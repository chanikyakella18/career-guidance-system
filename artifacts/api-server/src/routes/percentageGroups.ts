import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, percentageGroupsTable, studentsTable } from "@workspace/db";

function getPercentageRange(percentage: number | null): string {
  if (percentage == null) return "Unknown";
  if (percentage >= 90) return "Excellent (90-100)";
  if (percentage >= 75) return "Good (75-89)";
  if (percentage >= 60) return "Average (60-74)";
  return "Needs Improvement (<60)";
}

const router: IRouter = Router();

router.get("/percentage-groups", async (_req, res): Promise<void> => {
  const records = await db
    .select()
    .from(percentageGroupsTable)
    .leftJoin(studentsTable, eq(percentageGroupsTable.studentId, studentsTable.id));
  res.json(
    records.map(r => ({
      ...r.percentage_groups,
      student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
    }))
  );
});

router.post("/percentage-groups/compute", async (_req, res): Promise<void> => {
  const students = await db.select().from(studentsTable);

  const results = [];
  for (const student of students) {
    const percentageRange = getPercentageRange(student.percentage);
    const existing = await db
      .select()
      .from(percentageGroupsTable)
      .where(eq(percentageGroupsTable.studentId, student.id));
    let record;
    if (existing.length > 0) {
      [record] = await db
        .update(percentageGroupsTable)
        .set({ percentageRange })
        .where(eq(percentageGroupsTable.studentId, student.id))
        .returning();
    } else {
      [record] = await db
        .insert(percentageGroupsTable)
        .values({ studentId: student.id, percentageRange })
        .returning();
    }
    results.push({ ...record, student: { ...student, createdAt: student.createdAt.toISOString() } });
  }
  res.json(results);
});

export default router;
