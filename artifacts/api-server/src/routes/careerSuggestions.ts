import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, careerSuggestionsTable, studentsTable } from "@workspace/db";
import {
  CreateCareerSuggestionBody,
  GetStudentCareerSuggestionParams,
} from "@workspace/api-zod";

const CAREER_DOMAINS = [
  { domain: "AI/ML", minTechnical: 75, minAptitude: 70 },
  { domain: "Data Science", minTechnical: 70, minAptitude: 70 },
  { domain: "Cyber Security", minTechnical: 65, minAptitude: 65 },
  { domain: "Cloud Computing", minTechnical: 60, minAptitude: 60 },
  { domain: "Web Development", minTechnical: 0, minAptitude: 0 },
];

function suggestCareerDomain(student: typeof studentsTable.$inferSelect): { domain: string; confidence: number } {
  const technical = student.technicalScore ?? 50;
  const aptitude = student.aptitudeScore ?? 50;
  const communication = student.communicationScore ?? 50;
  const percentage = student.percentage ?? 50;

  for (const career of CAREER_DOMAINS) {
    if (technical >= career.minTechnical && aptitude >= career.minAptitude) {
      const base = (technical + aptitude + percentage) / 3;
      const bonus = communication >= 70 ? 5 : 0;
      const confidence = Math.min(Math.round((base + bonus) * 100) / 100, 99);
      return { domain: career.domain, confidence };
    }
  }
  return { domain: "Web Development", confidence: 65 };
}

const router: IRouter = Router();

router.get("/career-suggestions", async (_req, res): Promise<void> => {
  const records = await db
    .select()
    .from(careerSuggestionsTable)
    .leftJoin(studentsTable, eq(careerSuggestionsTable.studentId, studentsTable.id));
  res.json(
    records.map(r => ({
      ...r.career_suggestions,
      student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
    }))
  );
});

router.post("/career-suggestions", async (req, res): Promise<void> => {
  const parsed = CreateCareerSuggestionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, parsed.data.studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }
  const { domain, confidence } = suggestCareerDomain(student);

  const existing = await db
    .select()
    .from(careerSuggestionsTable)
    .where(eq(careerSuggestionsTable.studentId, parsed.data.studentId));
  let record;
  if (existing.length > 0) {
    [record] = await db
      .update(careerSuggestionsTable)
      .set({ suggestedDomain: domain, confidenceScore: confidence })
      .where(eq(careerSuggestionsTable.studentId, parsed.data.studentId))
      .returning();
  } else {
    [record] = await db
      .insert(careerSuggestionsTable)
      .values({ studentId: parsed.data.studentId, suggestedDomain: domain, confidenceScore: confidence })
      .returning();
  }
  res.status(201).json({ ...record, student: { ...student, createdAt: student.createdAt.toISOString() } });
});

router.get("/career-suggestions/student/:studentId", async (req, res): Promise<void> => {
  const params = GetStudentCareerSuggestionParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const results = await db
    .select()
    .from(careerSuggestionsTable)
    .leftJoin(studentsTable, eq(careerSuggestionsTable.studentId, studentsTable.id))
    .where(eq(careerSuggestionsTable.studentId, params.data.studentId));
  if (results.length === 0) {
    res.status(404).json({ error: "Career suggestion not found" });
    return;
  }
  const r = results[0];
  res.json({
    ...r.career_suggestions,
    student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
  });
});

export default router;
