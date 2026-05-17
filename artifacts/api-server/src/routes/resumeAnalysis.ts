import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, resumeAnalysisTable, studentsTable } from "@workspace/db";
import { AnalyzeResumeBody, GetStudentResumeAnalysisParams } from "@workspace/api-zod";

const TECHNICAL_SKILLS = [
  "python", "java", "javascript", "typescript", "c++", "c#", "golang", "rust", "kotlin", "swift",
  "react", "angular", "vue", "node.js", "nodejs", "express", "django", "flask", "spring", "fastapi",
  "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "firebase",
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins",
  "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
  "html", "css", "tailwind", "bootstrap", "rest api", "graphql", "microservices",
  "git", "github", "linux", "bash", "data structures", "algorithms", "system design",
  "cybersecurity", "networking", "cloud computing", "devops", "agile", "scrum",
];

const EXPERIENCE_KEYWORDS = [
  "internship", "intern", "experience", "project", "developed", "built", "implemented",
  "designed", "deployed", "managed", "led", "collaborated", "contributed", "worked",
  "created", "maintained", "optimized", "architected", "freelance", "part-time", "full-time",
];

const EDUCATION_KEYWORDS = [
  "bachelor", "b.tech", "b.e", "b.sc", "master", "m.tech", "m.sc", "mba", "phd",
  "gpa", "cgpa", "percentage", "distinction", "first class", "computer science",
  "information technology", "electronics", "engineering", "degree",
];

const CERTIFICATION_KEYWORDS = [
  "certified", "certification", "certificate", "aws certified", "google certified",
  "microsoft certified", "oracle certified", "coursera", "udemy", "edx", "nptel",
];

const SOFT_SKILL_KEYWORDS = [
  "communication", "leadership", "teamwork", "problem solving", "analytical",
  "presentation", "critical thinking", "time management", "adaptable", "creative",
];

function analyzeResume(resumeText: string, student: typeof studentsTable.$inferSelect) {
  const lowerText = resumeText.toLowerCase();

  const skillsFound = TECHNICAL_SKILLS.filter(skill => lowerText.includes(skill));
  const experienceMatches = EXPERIENCE_KEYWORDS.filter(k => lowerText.includes(k));
  const educationMatches = EDUCATION_KEYWORDS.filter(k => lowerText.includes(k));
  const certificationMatches = CERTIFICATION_KEYWORDS.filter(k => lowerText.includes(k));
  const softSkillMatches = SOFT_SKILL_KEYWORDS.filter(k => lowerText.includes(k));

  const wordCount = resumeText.split(/\s+/).length;
  const hasContactInfo = /\b[\w.-]+@[\w.-]+\.\w+\b/.test(resumeText) || /\b\d{10}\b/.test(resumeText);

  // Scoring (out of 100)
  const skillScore = Math.min(skillsFound.length * 5, 35);
  const experienceScore = Math.min(experienceMatches.length * 3, 20);
  const educationScore = Math.min(educationMatches.length * 3, 15);
  const certScore = Math.min(certificationMatches.length * 5, 10);
  const softSkillScore = Math.min(softSkillMatches.length * 2, 10);
  const lengthScore = wordCount >= 300 ? 5 : wordCount >= 150 ? 3 : 0;
  const contactScore = hasContactInfo ? 5 : 0;

  // Academic data bonus
  const academicBonus =
    (student.percentage ?? 0) >= 75 ? 5 :
    (student.percentage ?? 0) >= 60 ? 2 : 0;

  const rawScore = skillScore + experienceScore + educationScore + certScore + softSkillScore + lengthScore + contactScore + academicBonus;
  const score = Math.min(Math.round(rawScore * 100) / 100, 100);

  const eligibilityPrediction = score >= 70 ? "Eligible" : score >= 50 ? "Potentially Eligible" : "Not Eligible";

  const strengths: string[] = [];
  if (skillsFound.length >= 6) strengths.push(`Strong technical profile with ${skillsFound.length} relevant skills`);
  else if (skillsFound.length >= 3) strengths.push(`Good technical foundation with ${skillsFound.length} skills identified`);
  if (experienceMatches.length >= 4) strengths.push("Well-documented work experience and project history");
  if (certificationMatches.length > 0) strengths.push(`${certificationMatches.length} certification(s) found — adds credibility`);
  if (educationMatches.length >= 3) strengths.push("Clear educational background mentioned");
  if (softSkillMatches.length >= 3) strengths.push("Good range of soft skills highlighted");
  if ((student.percentage ?? 0) >= 75) strengths.push(`Strong academic record (${student.percentage}%)`);
  if (wordCount >= 300) strengths.push("Resume has good depth and detail");
  if (strengths.length === 0) strengths.push("Resume submitted for review");

  const weaknesses: string[] = [];
  if (skillsFound.length < 3) weaknesses.push("Too few technical skills mentioned — add more relevant technologies");
  if (experienceMatches.length < 2) weaknesses.push("Insufficient experience or project descriptions");
  if (educationMatches.length === 0) weaknesses.push("Educational qualifications not clearly stated");
  if (!hasContactInfo) weaknesses.push("Contact information not detected");
  if (wordCount < 150) weaknesses.push("Resume is too short — expand with more detail");
  if (certificationMatches.length === 0) weaknesses.push("No certifications found — consider adding online courses");
  if (softSkillMatches.length < 2) weaknesses.push("Soft skills not highlighted adequately");
  if ((student.percentage ?? 0) < 60) weaknesses.push("Academic score may be a concern for some recruiters");

  const recommendations: string[] = [];
  if (skillsFound.length < 5) recommendations.push("Add more in-demand technical skills such as cloud platforms, frameworks, or databases");
  if (experienceMatches.length < 3) recommendations.push("Include 2–3 project descriptions with specific technologies used and outcomes achieved");
  if (certificationMatches.length === 0) recommendations.push("Earn a certification (AWS, Google, or Coursera) to strengthen your profile");
  if (wordCount < 250) recommendations.push("Expand the resume to at least 300 words — add more context to each role/project");
  recommendations.push("Tailor your resume keywords to the specific job description before applying");
  if ((student.attendance ?? 0) >= 75 && (student.aptitudeScore ?? 0) >= 65) {
    recommendations.push("Your academic metrics are strong — make sure they're clearly highlighted on the resume");
  }

  return {
    skillsFound,
    score,
    eligibilityPrediction,
    strengths,
    weaknesses,
    recommendations,
  };
}

const router: IRouter = Router();

router.get("/resume-analysis", async (_req, res): Promise<void> => {
  const records = await db
    .select()
    .from(resumeAnalysisTable)
    .leftJoin(studentsTable, eq(resumeAnalysisTable.studentId, studentsTable.id))
    .orderBy(desc(resumeAnalysisTable.analyzedAt));

  res.json(
    records.map(r => ({
      ...r.resume_analysis,
      skillsFound: r.resume_analysis.skillsFound ?? [],
      strengths: r.resume_analysis.strengths ?? [],
      weaknesses: r.resume_analysis.weaknesses ?? [],
      recommendations: r.resume_analysis.recommendations ?? [],
      analyzedAt: r.resume_analysis.analyzedAt.toISOString(),
      student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
    }))
  );
});

router.post("/resume-analysis", async (req, res): Promise<void> => {
  const parsed = AnalyzeResumeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [student] = await db.select().from(studentsTable).where(eq(studentsTable.id, parsed.data.studentId));
  if (!student) {
    res.status(404).json({ error: "Student not found" });
    return;
  }

  const result = analyzeResume(parsed.data.resumeText, student);

  const [record] = await db
    .insert(resumeAnalysisTable)
    .values({
      studentId: parsed.data.studentId,
      resumeText: parsed.data.resumeText,
      skillsFound: result.skillsFound,
      score: result.score,
      eligibilityPrediction: result.eligibilityPrediction,
      strengths: result.strengths,
      weaknesses: result.weaknesses,
      recommendations: result.recommendations,
    })
    .returning();

  res.status(201).json({
    ...record,
    skillsFound: record.skillsFound ?? [],
    strengths: record.strengths ?? [],
    weaknesses: record.weaknesses ?? [],
    recommendations: record.recommendations ?? [],
    analyzedAt: record.analyzedAt.toISOString(),
    student: { ...student, createdAt: student.createdAt.toISOString() },
  });
});

router.get("/resume-analysis/student/:studentId", async (req, res): Promise<void> => {
  const params = GetStudentResumeAnalysisParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const results = await db
    .select()
    .from(resumeAnalysisTable)
    .leftJoin(studentsTable, eq(resumeAnalysisTable.studentId, studentsTable.id))
    .where(eq(resumeAnalysisTable.studentId, params.data.studentId))
    .orderBy(desc(resumeAnalysisTable.analyzedAt))
    .limit(1);

  if (results.length === 0) {
    res.status(404).json({ error: "No resume analysis found for this student" });
    return;
  }

  const r = results[0];
  res.json({
    ...r.resume_analysis,
    skillsFound: r.resume_analysis.skillsFound ?? [],
    strengths: r.resume_analysis.strengths ?? [],
    weaknesses: r.resume_analysis.weaknesses ?? [],
    recommendations: r.resume_analysis.recommendations ?? [],
    analyzedAt: r.resume_analysis.analyzedAt.toISOString(),
    student: r.students ? { ...r.students, createdAt: r.students.createdAt.toISOString() } : null,
  });
});

export default router;
