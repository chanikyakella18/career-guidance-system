import { pgTable, serial, integer, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { relations } from "drizzle-orm";

export const resumeAnalysisTable = pgTable("resume_analysis", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  resumeText: text("resume_text").notNull(),
  skillsFound: text("skills_found").array().notNull().default([]),
  score: real("score").notNull(),
  eligibilityPrediction: text("eligibility_prediction").notNull(),
  strengths: text("strengths").array().notNull().default([]),
  weaknesses: text("weaknesses").array().notNull().default([]),
  recommendations: text("recommendations").array().notNull().default([]),
  analyzedAt: timestamp("analyzed_at", { withTimezone: true }).notNull().defaultNow(),
});

export const resumeAnalysisRelations = relations(resumeAnalysisTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [resumeAnalysisTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const insertResumeAnalysisSchema = createInsertSchema(resumeAnalysisTable).omit({ id: true, analyzedAt: true });
export type InsertResumeAnalysis = z.infer<typeof insertResumeAnalysisSchema>;
export type ResumeAnalysis = typeof resumeAnalysisTable.$inferSelect;
