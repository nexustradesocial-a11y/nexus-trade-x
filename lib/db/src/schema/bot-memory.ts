import { pgTable, text, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botMemoryTable = pgTable("bot_memory", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  user: text("user").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
});

export const insertBotMemorySchema = createInsertSchema(botMemoryTable);
export type InsertBotMemory = z.infer<typeof insertBotMemorySchema>;
export type BotMemory = typeof botMemoryTable.$inferSelect;
