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
  points: integer("points").notNull(),
});

export const gameHistory = sqliteTable("game_history", {
  id: text("id").primaryKey(),
  gameId: text("game_id").notNull().default("unknown"),
  gameType: text("game_type").notNull().default("buzzer"),
  hostId: text("host_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // Ordered snapshot of subject names in play order, e.g. ["Tarix","Geografiya"].
  // Lets the scoreboard render its columns (and empty cells) without touching
  // the live subjects table.
  subjects: text("subjects").notNull().default("[]"),
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
    // Kept for reference only — intentionally NOT a foreign key, so editing or
    // deleting a question never destroys historical results.
    questionId: text("question_id").notNull(),
    // Snapshot coordinates for the scoreboard grid.
    subjectName: text("subject_name").notNull().default(""),
    subjectPosition: integer("subject_position").notNull().default(0),
    questionPosition: integer("question_position").notNull().default(0),
    correct: integer("correct", { mode: "boolean" }).notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
  },
  table => [
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
  table => [
    index("game_player_results_gameId_idx").on(table.gameId),
    index("game_player_results_userId_idx").on(table.userId),
  ]
);

export const activeGames = sqliteTable("active_games", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  gameType: text("game_type").notNull().default("buzzer"),
  hostId: text("host_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  maxPlayers: integer("max_players").notNull().default(10),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(true),
  password: text("password"),
  status: text("status", { enum: ["waiting", "playing", "finished"] })
    .notNull()
    .default("waiting"),
  // Game-specific room configuration, shape owned by the game module. For the
  // buzzer game this is `{ subjectIds: string[] }`.
  config: text("config").notNull().default("{}"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }),
});

export const activeGameRelations = relations(activeGames, ({ one }) => ({
  host: one(user, {
    fields: [activeGames.hostId],
    references: [user.id],
  }),
}));

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

export const gameQuestionResultsRelations = relations(
  gameQuestionResults,
  ({ one }) => ({
    game: one(gameHistory, {
      fields: [gameQuestionResults.gameId],
      references: [gameHistory.id],
    }),
    user: one(user, {
      fields: [gameQuestionResults.userId],
      references: [user.id],
    }),
  })
);

export const gamePlayerResultsRelations = relations(
  gamePlayerResults,
  ({ one }) => ({
    game: one(gameHistory, {
      fields: [gamePlayerResults.gameId],
      references: [gameHistory.id],
    }),
    user: one(user, {
      fields: [gamePlayerResults.userId],
      references: [user.id],
    }),
  })
);
