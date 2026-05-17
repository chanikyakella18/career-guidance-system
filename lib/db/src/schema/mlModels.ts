import { pgTable, text, serial } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const mlModelsTable = pgTable("ml_models", {
  id: serial("id").primaryKey(),
  modelName: text("model_name").notNull(),
  modelType: text("model_type").notNull(),
  description: text("description"),
});

export const insertMlModelSchema = createInsertSchema(mlModelsTable).omit({ id: true });
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;
export type MlModel = typeof mlModelsTable.$inferSelect;
