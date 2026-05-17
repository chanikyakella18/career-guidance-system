import { pgTable, serial, integer, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { studentsTable } from "./students";
import { relations } from "drizzle-orm";

export const percentageGroupsTable = pgTable("percentage_groups", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => studentsTable.id, { onDelete: "cascade" }),
  percentageRange: text("percentage_range").notNull(),
});

export const percentageGroupsRelations = relations(percentageGroupsTable, ({ one }) => ({
  student: one(studentsTable, {
    fields: [percentageGroupsTable.studentId],
    references: [studentsTable.id],
  }),
}));

export const insertPercentageGroupSchema = createInsertSchema(percentageGroupsTable).omit({ id: true });
export type InsertPercentageGroup = z.infer<typeof insertPercentageGroupSchema>;
export type PercentageGroup = typeof percentageGroupsTable.$inferSelect;
