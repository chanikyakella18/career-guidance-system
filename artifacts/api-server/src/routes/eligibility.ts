import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, eligibilityTable, studentsTable } from "@workspace/db";
import {
  ComputeEligibilityBody,
  GetStudentEligibilityParams,
} from "@workspace/api-zod";

function computeEligibilityForStudent(student: typeof studentsTable.$inferSelect) {
  const attendance = student.attendance ?? 0;
  const aptitude = student.aptitudeScore ?? 0;
  const percentage = student.percentage ?? 0;

  const attendanceStatus = attendance >= 75 ? "Eligible" : "Not Eligible";
  const aptitudeStatus = aptitude >= 60 ? "Eligible" : "Not Eligible";
  const percentageStatus = percentage >= 60 ? "Eligible" : "Not Eligible";
  const overallEligibility =
    attendanceStatus === "Eligible" && aptitudeStatus === "Eligible" && percentageStatus === "Eligible"
      ? "Eligible"
      : "Not Eligible";

  return { attendanceStatus, aptitudeStatus, percentageStatus, overallEligibility };
}

const router: IRouter = Router();

router.get("/eligibility", async (_req, res): Promise<void> => {
  const records = await db
    .select()
    .from(eligibilityTable)
    .leftJoin(studentsTable, eq(eligibilityTable.studentId, studentsTable.id));
  res.json(
    records.map(r => ({
      ...r.placement_eligibility,
      student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
    }))
  );
});

router.post("/eligibility", async (req, res): Promise<void> => {
  const parsed = ComputeEligibilityBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, parsed.data.studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const values = computeEligibilityForStudent(student);

  const existing = await db.select().from(eligibilityTable).where(eq(eligibilityTable.studentId, parsed.data.studentId));
  let record;
  if (existing.length > 0) {
    [record] = await db
      .update(eligibilityTable)
      .set(values)
      .where(eq(eligibilityTable.studentId, parsed.data.studentId))
      .returning();
  } else {
    [record] = await db
      .insert(eligibilityTable)
      .values({ studentId: parsed.data.studentId, ...values })
      .returning();
  }
  res.status(201).json({ ...record, student: { ...student, createdAt: student.createdAt.toISOString() } });
});

router.get("/eligibility/student/:studentId", async (req, res): Promise<void> => {
  const params = GetStudentEligibilityParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const results = await db
    .select()
    .from(eligibilityTable)
    .leftJoin(studentsTable, eq(eligibilityTable.studentId, studentsTable.id))
    .where(eq(eligibilityTable.studentId, params.data.studentId));
  if (results.length === 0) {
    res.status(404).json({ error: "Eligibility record not found" });
    return;
  }
  const r = results[0];
  res.json({
    ...r.placement_eligibility,
    student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
  });
});

export default router;
