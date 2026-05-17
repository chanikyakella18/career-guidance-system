import { pgTable, serial, integer, real, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { relations } from "drizzle-orm";

export const predictionsTable = pgTable("performance_prediction", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  predictedScore: real("predicted_score").notNull(),
  performanceLevel: text("performance_level").notNull(),
});

export const predictionsRelations = relations(predictionsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [predictionsTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const insertPredictionSchema = createInsertSchema(predictionsTable).omit({ id: true });
export type InsertPrediction = z.infer<typeof insertPredictionSchema>;
export type Prediction = typeof predictionsTable.$inferSelect;
