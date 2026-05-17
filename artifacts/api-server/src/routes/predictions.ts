import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, predictionsTable, studentsTable } from "@workspace/db";
import {
  CreatePredictionBody,
  GetStudentPredictionParams,
} from "@workspace/api-zod";

const PERFORMANCE_LEVELS = [
  { min: 90, label: "Excellent" },
  { min: 75, label: "Good" },
  { min: 60, label: "Average" },
  { min: 0, label: "Needs Improvement" },
];

function computePredictedScore(student: typeof studentsTable.$inferSelect): number {
  const weights = { percentage: 0.4, aptitudeScore: 0.25, communicationScore: 0.15, technicalScore: 0.2 };
  const score =
    (student.percentage ?? 50) * weights.percentage +
    (student.aptitudeScore ?? 50) * weights.aptitudeScore +
    (student.communicationScore ?? 50) * weights.communicationScore +
    (student.technicalScore ?? 50) * weights.technicalScore;
  return Math.round(score * 100) / 100;
}

function getPerformanceLevel(score: number): string {
  return PERFORMANCE_LEVELS.find(l => score >= l.min)?.label ?? "Needs Improvement";
}

const router: IRouter = Router();

router.get("/predictions", async (_req, res): Promise<void> => {
  const predictions = await db
    .select()
    .from(predictionsTable)
    .leftJoin(studentsTable, eq(predictionsTable.studentId, studentsTable.id));
  res.json(
    predictions.map(r => ({
      ...r.performance_prediction,
      student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
    }))
  );
});

router.post("/predictions", async (req, res): Promise<void> => {
  const parsed = CreatePredictionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, parsed.data.studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const predictedScore = computePredictedScore(student);
  const performanceLevel = getPerformanceLevel(predictedScore);

  const existing = await db.select().from(predictionsTable).where(eq(predictionsTable.studentId, parsed.data.studentId));
  let prediction;
  if (existing.length > 0) {
    [prediction] = await db
      .update(predictionsTable)
      .set({ predictedScore, performanceLevel })
      .where(eq(predictionsTable.studentId, parsed.data.studentId))
      .returning();
  } else {
    [prediction] = await db
      .insert(predictionsTable)
      .values({ studentId: parsed.data.studentId, predictedScore, performanceLevel })
      .returning();
  }
  res.status(201).json({ ...prediction, student: { ...student, createdAt: student.createdAt.toISOString() } });
});

router.get("/predictions/student/:studentId", async (req, res): Promise<void> => {
  const params = GetStudentPredictionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const results = await db
    .select()
    .from(predictionsTable)
    .leftJoin(studentsTable, eq(predictionsTable.studentId, studentsTable.id))
    .where(eq(predictionsTable.studentId, params.data.studentId));
  if (results.length === 0) {
    res.status(404).json({ error: "Prediction not found" });
    return;
  }
  const r = results[0];
  res.json({
    ...r.performance_prediction,
    student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
  });
});

export default router;
