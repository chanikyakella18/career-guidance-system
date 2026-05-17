import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { relations } from "drizzle-orm";

export const eligibilityTable = pgTable("placement_eligibility", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  attendanceStatus: text("attendance_status").notNull(),
  aptitudeStatus: text("aptitude_status").notNull(),
  percentageStatus: text("percentage_status").notNull(),
  overallEligibility: text("overall_eligibility").notNull(),
});

export const eligibilityRelations = relations(eligibilityTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [eligibilityTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const insertEligibilitySchema = createInsertSchema(eligibilityTable).omit({ id: true });
export type InsertEligibility = z.infer<typeof insertEligibilitySchema>;
export type Eligibility = typeof eligibilityTable.$inferSelect;
