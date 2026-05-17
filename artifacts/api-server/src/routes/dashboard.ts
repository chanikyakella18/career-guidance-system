import { Router, type IRouter } from "express";
import { count, avg, eq } from "drizzle-orm";
import { db, studentsTable, predictionsTable, eligibilityTable, careerSuggestionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const [studentStats] = await db
    .select({
      total: count(),
      avgPercentage: avg(studentsTable.percentage),
      avgAttendance: avg(studentsTable.attendance),
      avgAptitude: avg(studentsTable.aptitudeScore),
    })
    .from(studentsTable);

  const [predCount] = await db.select({ total: count() }).from(predictionsTable);
  const [suggCount] = await db.select({ total: count() }).from(careerSuggestionsTable);
  const [eligibleCount] = await db
    .select({ total: count() })
    .from(eligibilityTable)
    .where(eq(eligibilityTable.overallEligibility, "Eligible"));

  res.json({
    totalStudents: studentStats?.total ?? 0,
    totalPredictions: predCount?.total ?? 0,
    totalEligible: eligibleCount?.total ?? 0,
    totalSuggestions: suggCount?.total ?? 0,
    avgPercentage: parseFloat(String(studentStats?.avgPercentage ?? "0")),
    avgAttendance: parseFloat(String(studentStats?.avgAttendance ?? "0")),
    avgAptitude: parseFloat(String(studentStats?.avgAptitude ?? "0")),
  });
});

router.get("/dashboard/department-breakdown", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      department: studentsTable.department,
      count: count(),
    })
    .from(studentsTable)
    .groupBy(studentsTable.department)
    .orderBy(sql`count(*) DESC`);
  res.json(rows);
});

router.get("/dashboard/performance-distribution", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      level: predictionsTable.performanceLevel,
      count: count(),
    })
    .from(predictionsTable)
    .groupBy(predictionsTable.performanceLevel)
    .orderBy(sql`count(*) DESC`);
  res.json(rows);
});

router.get("/dashboard/career-domain-distribution", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      domain: careerSuggestionsTable.suggestedDomain,
      count: count(),
    })
    .from(careerSuggestionsTable)
    .groupBy(careerSuggestionsTable.suggestedDomain)
    .orderBy(sql`count(*) DESC`);
  res.json(rows);
});

router.get("/dashboard/eligibility-summary", async (_req, res): Promise<void> => {
  const [eligible] = await db
    .select({ total: count() })
    .from(eligibilityTable)
    .where(eq(eligibilityTable.overallEligibility, "Eligible"));
  const [notEligible] = await db
    .select({ total: count() })
    .from(eligibilityTable)
    .where(eq(eligibilityTable.overallEligibility, "Not Eligible"));
  const [totalStudents] = await db.select({ total: count() }).from(studentsTable);
  const [totalEligibility] = await db.select({ total: count() }).from(eligibilityTable);

  const pending = (totalStudents?.total ?? 0) - (totalEligibility?.total ?? 0);

  res.json({
    eligible: eligible?.total ?? 0,
    notEligible: notEligible?.total ?? 0,
    pending: Math.max(0, pending),
  });
});

export default router;
