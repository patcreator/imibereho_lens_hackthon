import { index, jsonb, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

/** Public, opt-in aggregate notes. No uploaded dataset rows or raw files are stored in this table. */
export const sharedAnalyses = pgTable("shared_analyses", {
  id: uuid("id").primaryKey(),
  title: varchar("title", { length: 160 }).notNull(),
  datasetName: varchar("dataset_name", { length: 160 }).notNull(),
  source: varchar("source", { length: 300 }).notNull(),
  reportingPeriod: varchar("reporting_period", { length: 100 }).notNull(),
  question: varchar("question", { length: 800 }),
  summary: text("summary").notNull(),
  evidence: jsonb("evidence").$type<string[]>().notNull(),
  limitations: jsonb("limitations").$type<string[]>().notNull(),
  ownerTokenHash: varchar("owner_token_hash", { length: 64 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [
  index("shared_analyses_expires_at_idx").on(table.expiresAt),
  index("shared_analyses_created_at_idx").on(table.createdAt),
]);

export const schema = { sharedAnalyses };
