import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const subjects = sqliteTable("subjects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

export const questions = sqliteTable("questions", {
  id: text("id").primaryKey(),
  subjectId: text("subject_id")
    .notNull()
    .references(() => subjects.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  answer: text("answer").notNull(),
  points: integer("points").notNull(), // 10, 20, 30, 40, 50
});

export const gameHistory = sqliteTable("game_history", {
  id: text("id").primaryKey(),
  roomId: text("room_id").notNull().default("unknown"),
  hostId: text("host_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export const gameQuestionResults = sqliteTable(
  "game_question_results",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id")
      .notNull()
      .references(() => gameHistory.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => questions.id, { onDelete: "cascade" }),
    correct: integer("correct", { mode: "boolean" }).notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
  },
  (table) => [
    index("game_question_results_gameId_idx").on(table.gameId),
    index("game_question_results_userId_idx").on(table.userId),
  ]
);

export const gamePlayerResults = sqliteTable(
  "game_player_results",
  {
    id: text("id").primaryKey(),
    gameId: text("game_id")
      .notNull()
      .references(() => gameHistory.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    playerName: text("player_name").notNull(),
    score: integer("score").notNull(),
  },
  (table) => [
    index("game_player_results_gameId_idx").on(table.gameId),
    index("game_player_results_userId_idx").on(table.userId),
  ]
);

export const subjectsRelations = relations(subjects, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  subject: one(subjects, {
    fields: [questions.subjectId],
    references: [subjects.id],
  }),
}));

export const gameHistoryRelations = relations(gameHistory, ({ one, many }) => ({
  host: one(user, {
    fields: [gameHistory.hostId],
    references: [user.id],
  }),
  questionResults: many(gameQuestionResults),
  playerResults: many(gamePlayerResults),
}));

export const gameQuestionResultsRelations = relations(gameQuestionResults, ({ one }) => ({
  game: one(gameHistory, {
    fields: [gameQuestionResults.gameId],
    references: [gameHistory.id],
  }),
  user: one(user, {
    fields: [gameQuestionResults.userId],
    references: [user.id],
  }),
  question: one(questions, {
    fields: [gameQuestionResults.questionId],
    references: [questions.id],
  }),
}));

export const gamePlayerResultsRelations = relations(gamePlayerResults, ({ one }) => ({
  game: one(gameHistory, {
    fields: [gamePlayerResults.gameId],
    references: [gameHistory.id],
  }),
  user: one(user, {
    fields: [gamePlayerResults.userId],
    references: [user.id],
  }),
}));
