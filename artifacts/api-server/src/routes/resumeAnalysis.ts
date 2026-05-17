import { Router, type IRouter } from "express";
import { desc } from "drizzle-orm";
import { db, resumeAnalysisTable } from "@workspace/db";
import multer from "multer";
import { createRequire } from "node:module";
import mammoth from "mammoth";

const _require = createRequire(import.meta.url);
const pdfParse = _require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ── Analysis logic ──────────────────────────────────────────────────────────

const TECHNICAL_SKILLS = [
  "python", "java", "javascript", "typescript", "c++", "c#", "golang", "rust", "kotlin", "swift",
  "react", "angular", "vue", "node.js", "nodejs", "express", "django", "flask", "spring", "fastapi",
  "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch", "firebase",
  "aws", "azure", "gcp", "docker", "kubernetes", "terraform", "ci/cd", "jenkins",
  "machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "pandas", "numpy",
  "html", "css", "tailwind", "bootstrap", "rest api", "graphql", "microservices",
  "git", "github", "linux", "bash", "data structures", "algorithms", "system design",
  "cybersecurity", "networking", "cloud computing", "devops", "agile", "scrum",
  "excel", "power bi", "tableau", "hadoop", "spark", "kafka",
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

const SECTION_KEYWORDS: Record<string, string[]> = {
  objective: ["objective", "summary", "profile", "about me"],
  education: ["education", "qualification", "academic"],
  experience: ["experience", "work history", "employment", "internship"],
  skills: ["skills", "technical skills", "technologies", "tools"],
  projects: ["projects", "personal projects", "academic projects"],
  certifications: ["certifications", "certificates", "courses"],
  achievements: ["achievements", "awards", "accomplishments", "honors"],
  contact: ["email", "phone", "linkedin", "github", "portfolio"],
};

function detectSections(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(SECTION_KEYWORDS)
    .filter(([, keywords]) => keywords.some(k => lower.includes(k)))
    .map(([section]) => section);
}

function analyzeResumeText(resumeText: string) {
  const lowerText = resumeText.toLowerCase();
  const wordCount = resumeText.split(/\s+/).filter(Boolean).length;

  const skillsFound = TECHNICAL_SKILLS.filter(s => lowerText.includes(s));
  const experienceMatches = EXPERIENCE_KEYWORDS.filter(k => lowerText.includes(k));
  const educationMatches = EDUCATION_KEYWORDS.filter(k => lowerText.includes(k));
  const certificationMatches = CERTIFICATION_KEYWORDS.filter(k => lowerText.includes(k));
  const softSkillMatches = SOFT_SKILL_KEYWORDS.filter(k => lowerText.includes(k));
  const sectionsPresent = detectSections(resumeText);
  const hasContactInfo = /\b[\w.-]+@[\w.-]+\.\w+\b/.test(resumeText) || /\b\d{10}\b/.test(resumeText);
  const hasLinkedIn = lowerText.includes("linkedin");
  const hasGitHub = lowerText.includes("github");
  const hasQuantifiedResults = /\d+%|\d+ (users|clients|projects|systems|apps|students)/.test(lowerText);

  // Scoring breakdown (out of 100)
  const skillScore = Math.min(skillsFound.length * 5, 35);
  const experienceScore = Math.min(experienceMatches.length * 3, 20);
  const educationScore = Math.min(educationMatches.length * 2, 12);
  const certScore = Math.min(certificationMatches.length * 4, 10);
  const softSkillScore = Math.min(softSkillMatches.length * 1.5, 8);
  const sectionScore = Math.min(sectionsPresent.length * 1, 7);
  const contactScore = (hasContactInfo ? 2 : 0) + (hasLinkedIn ? 1.5 : 0) + (hasGitHub ? 1.5 : 0);
  const quantScore = hasQuantifiedResults ? 3 : 0;
  const lengthScore = wordCount >= 400 ? 4 : wordCount >= 250 ? 2 : 0;

  const rawScore = skillScore + experienceScore + educationScore + certScore + softSkillScore + sectionScore + contactScore + quantScore + lengthScore;
  const score = Math.min(Math.round(rawScore * 10) / 10, 100);

  const eligibilityPrediction = score >= 70 ? "Eligible" : score >= 50 ? "Potentially Eligible" : "Not Eligible";

  // Strengths
  const strengths: string[] = [];
  if (skillsFound.length >= 8) strengths.push(`Excellent technical depth — ${skillsFound.length} relevant skills identified`);
  else if (skillsFound.length >= 5) strengths.push(`Good technical profile with ${skillsFound.length} skills detected`);
  else if (skillsFound.length >= 2) strengths.push(`${skillsFound.length} technical skills found`);
  if (certificationMatches.length > 0) strengths.push(`${certificationMatches.length} certification(s) detected — adds recruiter credibility`);
  if (hasLinkedIn && hasGitHub) strengths.push("Both LinkedIn and GitHub profiles included — great for visibility");
  else if (hasLinkedIn) strengths.push("LinkedIn profile included");
  else if (hasGitHub) strengths.push("GitHub profile included");
  if (hasQuantifiedResults) strengths.push("Quantified achievements detected — numbers make impact tangible");
  if (sectionsPresent.length >= 5) strengths.push(`Well-structured resume with ${sectionsPresent.length} clear sections`);
  if (experienceMatches.length >= 4) strengths.push("Strong experience/project descriptions");
  if (softSkillMatches.length >= 3) strengths.push("Soft skills well represented");
  if (wordCount >= 400) strengths.push("Resume has good depth and completeness");
  if (strengths.length === 0) strengths.push("Resume submitted for analysis");

  // Weaknesses
  const weaknesses: string[] = [];
  if (skillsFound.length < 4) weaknesses.push(`Only ${skillsFound.length} technical skill(s) found — resume needs more relevant technologies`);
  if (!sectionsPresent.includes("objective")) weaknesses.push("Missing professional summary or objective section");
  if (!sectionsPresent.includes("projects")) weaknesses.push("No projects section detected — projects are critical for freshers");
  if (!sectionsPresent.includes("certifications")) weaknesses.push("No certifications found — online certs add credibility");
  if (!hasLinkedIn) weaknesses.push("LinkedIn profile not included");
  if (!hasGitHub) weaknesses.push("GitHub profile not mentioned — essential for tech roles");
  if (!hasContactInfo) weaknesses.push("Contact information not clearly present");
  if (!hasQuantifiedResults) weaknesses.push("No quantified achievements — missing numbers (e.g., '40% faster', '500+ users')");
  if (wordCount < 250) weaknesses.push(`Resume is too short (${wordCount} words) — aim for at least 400 words`);
  if (softSkillMatches.length < 2) weaknesses.push("Soft skills not highlighted — recruiters look for communication and leadership");

  // Specific changes to make
  const recommendations: string[] = [];
  if (!sectionsPresent.includes("objective")) recommendations.push("Add a 2–3 line Professional Summary at the top tailored to your target role");
  if (skillsFound.length < 6) {
    const missing = ["Python", "SQL", "Git", "React", "AWS", "Docker"].filter(s => !skillsFound.includes(s.toLowerCase()));
    if (missing.length) recommendations.push(`Add these high-demand skills if you know them: ${missing.slice(0, 4).join(", ")}`);
  }
  if (!hasGitHub) recommendations.push("Add your GitHub profile URL — most tech recruiters check it before interviews");
  if (!hasLinkedIn) recommendations.push("Add your LinkedIn URL — recruiters often contact candidates directly there");
  if (!hasQuantifiedResults) recommendations.push("Quantify your impact: replace vague bullets with numbers (e.g. 'Reduced load time by 30%', 'Built for 200+ users')");
  if (!sectionsPresent.includes("projects")) recommendations.push("Add 2–3 projects with: title, tech stack used, what problem it solved, and a GitHub link");
  if (certificationMatches.length === 0) recommendations.push("Complete 1–2 free certifications (Google, AWS Free Tier, or NPTEL) and list them");
  if (wordCount < 300) recommendations.push("Expand resume content to at least 400 words — elaborate on each role, project, and achievement");
  recommendations.push("Use action verbs to start every bullet: 'Developed', 'Implemented', 'Optimized', 'Led', 'Deployed'");
  recommendations.push("Tailor your resume keywords to each job description before applying — ATS systems scan for exact matches");

  return {
    skillsFound,
    score,
    eligibilityPrediction,
    strengths,
    weaknesses,
    recommendations,
    sectionsPresent,
    wordCount,
    hasLinkedIn,
    hasGitHub,
    hasQuantifiedResults,
  };
}

// ── Routes ───────────────────────────────────────────────────────────────────

const router: IRouter = Router();

// File upload + analyze (no student required)
router.post(
  "/resume-analysis/upload",
  upload.single("resume"),
  async (req, res): Promise<void> => {
    if (!req.file) {
      res.status(400).json({ error: "Resume file is required" });
      return;
    }

    let resumeText = "";
    const mimetype = req.file.mimetype;
    const originalname = req.file.originalname.toLowerCase();

    try {
      if (mimetype === "application/pdf" || originalname.endsWith(".pdf")) {
        const parsed = await pdfParse(req.file.buffer);
        resumeText = parsed.text;
      } else if (
        mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        originalname.endsWith(".docx")
      ) {
        const result = await mammoth.extractRawText({ buffer: req.file.buffer });
        resumeText = result.value;
      } else if (mimetype === "text/plain" || originalname.endsWith(".txt")) {
        resumeText = req.file.buffer.toString("utf-8");
      } else {
        res.status(400).json({ error: "Unsupported file type. Please upload PDF, DOCX, or TXT." });
        return;
      }
    } catch {
      res.status(422).json({ error: "Could not parse the uploaded file. Ensure it is a valid PDF or DOCX." });
      return;
    }

    if (!resumeText.trim()) {
      res.status(422).json({ error: "No readable text found in the file. The PDF may be image-based (scanned)." });
      return;
    }

    const analysis = analyzeResumeText(resumeText);

    const [record] = await db
      .insert(resumeAnalysisTable)
      .values({
        resumeText: resumeText.slice(0, 10000),
        skillsFound: analysis.skillsFound,
        score: analysis.score,
        eligibilityPrediction: analysis.eligibilityPrediction,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        recommendations: analysis.recommendations,
      })
      .returning();

    res.status(201).json({
      ...record,
      fileName: req.file.originalname,
      wordCount: analysis.wordCount,
      sectionsPresent: analysis.sectionsPresent,
      hasLinkedIn: analysis.hasLinkedIn,
      hasGitHub: analysis.hasGitHub,
      hasQuantifiedResults: analysis.hasQuantifiedResults,
      skillsFound: record.skillsFound ?? [],
      strengths: record.strengths ?? [],
      weaknesses: record.weaknesses ?? [],
      recommendations: record.recommendations ?? [],
      analyzedAt: record.analyzedAt.toISOString(),
    });
  }
);

// List all analyses
router.get("/resume-analysis", async (_req, res): Promise<void> => {
  const records = await db
    .select()
    .from(resumeAnalysisTable)
    .orderBy(desc(resumeAnalysisTable.analyzedAt));

  res.json(
    records.map(r => ({
      ...r,
      skillsFound: r.skillsFound ?? [],
      strengths: r.strengths ?? [],
      weaknesses: r.weaknesses ?? [],
      recommendations: r.recommendations ?? [],
      analyzedAt: r.analyzedAt.toISOString(),
    }))
  );
});

export default router;
