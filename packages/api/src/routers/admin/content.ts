import { and, count, eq } from "@zeyn/db";
import { questions, subjects } from "@zeyn/db/schema";
import { TRPCError } from "@trpc/server";
import z from "zod";

import { adminProcedure, router } from "../../index";
import { gameConfig } from "../../game-types";
import {
  assertForceWhenChildrenExist,
  assertNotUsedByLiveRoom,
  pageInput,
  recordAudit,
  searchLike,
} from "./_shared";

const subjectNameSchema = z.string().trim().min(1).max(60);
const questionTextSchema = z.string().trim().min(1).max(2000);
const questionAnswerSchema = z.string().trim().min(1).max(500);
const questionPointsSchema = z.number().int().min(1).max(1000);

export const contentRouter = router({
  listSubjects: adminProcedure
    .input(pageInput)
    .query(async ({ ctx, input }) => {
      const where = input.search
        ? searchLike(subjects.name, input.search)
        : undefined;

      const [items, totalRow] = await Promise.all([
        ctx.db
          .select({
            id: subjects.id,
            name: subjects.name,
            questionCount: count(questions.id),
          })
          .from(subjects)
          .leftJoin(questions, eq(questions.subjectId, subjects.id))
          .where(where)
          .groupBy(subjects.id)
          .orderBy(subjects.name)
          .limit(input.limit)
          .offset(input.offset),
        ctx.db.select({ value: count() }).from(subjects).where(where).get(),
      ]);

      return {
        items,
        total: totalRow?.value ?? 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  getSubject: adminProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const subject = await ctx.db
        .select()
        .from(subjects)
        .where(eq(subjects.id, input.id))
        .limit(1)
        .get();

      if (!subject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subject not found" });
      }

      const subjectQuestions = await ctx.db
        .select()
        .from(questions)
        .where(eq(questions.subjectId, input.id))
        .orderBy(questions.points);

      return {
        ...subject,
        questions: subjectQuestions,
        minQuestions: gameConfig.questionsPerSubject,
      };
    }),

  createSubject: adminProcedure
    .input(z.object({ name: subjectNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const id = crypto.randomUUID();
      await ctx.db.insert(subjects).values({ id, name: input.name });
      await recordAudit(ctx, "subject.create", "subject", id, {
        name: input.name,
      });
      return { id };
    }),

  updateSubject: adminProcedure
    .input(z.object({ id: z.string(), name: subjectNameSchema }))
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(subjects)
        .set({ name: input.name })
        .where(eq(subjects.id, input.id))
        .returning({ id: subjects.id });

      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subject not found" });
      }

      await recordAudit(ctx, "subject.update", "subject", input.id, {
        name: input.name,
      });
      return { success: true as const };
    }),

  deleteSubject: adminProcedure
    .input(z.object({ id: z.string(), force: z.boolean().default(false) }))
    .mutation(async ({ ctx, input }) => {
      await assertNotUsedByLiveRoom(ctx, input.id, "subject");

      const childRow = await ctx.db
        .select({ value: count() })
        .from(questions)
        .where(eq(questions.subjectId, input.id))
        .get();
      const childCount = childRow?.value ?? 0;

      assertForceWhenChildrenExist(
        childCount,
        input.force,
        n => `Deleting this subject also deletes ${n} question(s).`
      );

      const deleted = await ctx.db
        .delete(subjects)
        .where(eq(subjects.id, input.id))
        .returning({ id: subjects.id });

      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subject not found" });
      }

      await recordAudit(ctx, "subject.delete", "subject", input.id, {
        deletedQuestions: childCount,
      });
      return { deletedQuestions: childCount };
    }),

  listQuestions: adminProcedure
    .input(
      pageInput.extend({
        subjectId: z.string().optional(),
        points: z.number().int().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];
      if (input.search) {
        conditions.push(searchLike(questions.text, input.search));
      }
      if (input.subjectId) {
        conditions.push(eq(questions.subjectId, input.subjectId));
      }
      if (input.points !== undefined) {
        conditions.push(eq(questions.points, input.points));
      }
      const where = conditions.length ? and(...conditions) : undefined;

      const [items, totalRow] = await Promise.all([
        ctx.db
          .select({
            id: questions.id,
            subjectId: questions.subjectId,
            subjectName: subjects.name,
            text: questions.text,
            answer: questions.answer,
            points: questions.points,
          })
          .from(questions)
          .innerJoin(subjects, eq(subjects.id, questions.subjectId))
          .where(where)
          .orderBy(subjects.name, questions.points)
          .limit(input.limit)
          .offset(input.offset),
        ctx.db.select({ value: count() }).from(questions).where(where).get(),
      ]);

      return {
        items,
        total: totalRow?.value ?? 0,
        limit: input.limit,
        offset: input.offset,
      };
    }),

  createQuestion: adminProcedure
    .input(
      z.object({
        subjectId: z.string(),
        text: questionTextSchema,
        answer: questionAnswerSchema,
        points: questionPointsSchema,
      })
    )
    .mutation(async ({ ctx, input }) => {
      const subject = await ctx.db
        .select({ id: subjects.id })
        .from(subjects)
        .where(eq(subjects.id, input.subjectId))
        .limit(1)
        .get();

      if (!subject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Subject not found" });
      }

      const id = crypto.randomUUID();
      await ctx.db.insert(questions).values({
        id,
        subjectId: input.subjectId,
        text: input.text,
        answer: input.answer,
        points: input.points,
      });

      await recordAudit(ctx, "question.create", "question", id, {
        subjectId: input.subjectId,
      });
      return { id };
    }),

  updateQuestion: adminProcedure
    .input(
      z.object({
        id: z.string(),
        text: questionTextSchema.optional(),
        answer: questionAnswerSchema.optional(),
        points: questionPointsSchema.optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const patch = Object.fromEntries(
        Object.entries(fields).filter(([, value]) => value !== undefined)
      );

      if (Object.keys(patch).length === 0) {
        return { success: true as const };
      }

      const updated = await ctx.db
        .update(questions)
        .set(patch)
        .where(eq(questions.id, id))
        .returning({ id: questions.id });

      if (updated.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        });
      }

      await recordAudit(ctx, "question.update", "question", id, patch);
      return { success: true as const };
    }),

  deleteQuestion: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(questions)
        .where(eq(questions.id, input.id))
        .returning({ subjectId: questions.subjectId });

      const row = deleted[0];
      if (!row) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Question not found",
        });
      }

      const remainingRow = await ctx.db
        .select({ value: count() })
        .from(questions)
        .where(eq(questions.subjectId, row.subjectId))
        .get();
      const remaining = remainingRow?.value ?? 0;

      await recordAudit(ctx, "question.delete", "question", input.id, {
        subjectId: row.subjectId,
      });

      return {
        success: true as const,
        warning:
          remaining < gameConfig.questionsPerSubject
            ? `This subject now has ${remaining} question(s); games need ${gameConfig.questionsPerSubject}.`
            : null,
      };
    }),
});
