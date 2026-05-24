import { pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const botConfigTable = pgTable("bot_config", {
  id: integer("id").primaryKey().default(1),
  xApiKey: text("x_api_key"),
  xApiSecret: text("x_api_secret"),
  xAccessToken: text("x_access_token"),
  xAccessSecret: text("x_access_secret"),
  openAiKey: text("open_ai_key"),
  xaiKey: text("xai_key"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertBotConfigSchema = createInsertSchema(botConfigTable).omit({ id: true, updatedAt: true });
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type BotConfig = typeof botConfigTable.$inferSelect;
