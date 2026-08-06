import { relations } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

export const adminAuditLog = sqliteTable(
  "admin_audit_log",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    metadata: text("metadata").notNull().default("{}"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  table => [
    index("admin_audit_log_createdAt_idx").on(table.createdAt),
    index("admin_audit_log_actorId_idx").on(table.actorId),
  ]
);

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  actor: one(user, {
    fields: [adminAuditLog.actorId],
    references: [user.id],
  }),
}));
