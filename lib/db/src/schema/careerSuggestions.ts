import { pgTable, serial, integer, text, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { relations } from "drizzle-orm";

export const careerSuggestionsTable = pgTable("career_suggestions", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  suggestedDomain: text("suggested_domain").notNull(),
  confidenceScore: real("confidence_score").notNull(),
});

export const careerSuggestionsRelations = relations(careerSuggestionsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [careerSuggestionsTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const insertCareerSuggestionSchema = createInsertSchema(careerSuggestionsTable).omit({ id: true });
export type InsertCareerSuggestion = z.infer<typeof insertCareerSuggestionSchema>;
export type CareerSuggestion = typeof careerSuggestionsTable.$inferSelect;
