import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListStudents,
  useListResumeAnalyses,
  useAnalyzeResume,
  getListResumeAnalysesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  Code2,
  Lightbulb,
} from "lucide-react";

function EligibilityBadge({ prediction }: { prediction: string }) {
  if (prediction === "Eligible") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1" data-testid="badge-eligible">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Eligible
      </Badge>
    );
  }
  if (prediction === "Potentially Eligible") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1" data-testid="badge-potential">
        <AlertCircle className="w-3.5 h-3.5" />
        Potentially Eligible
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 gap-1" data-testid="badge-not-eligible">
      <XCircle className="w-3.5 h-3.5" />
      Not Eligible
    </Badge>
  );
}

function ScoreRing({ score }: { score: number }) {
  const color =
    score >= 70 ? "text-green-600" :
    score >= 50 ? "text-amber-500" :
    "text-red-500";

  const bgColor =
    score >= 70 ? "bg-green-50 border-green-200" :
    score >= 50 ? "bg-amber-50 border-amber-200" :
    "bg-red-50 border-red-200";

  return (
    <div className={`flex flex-col items-center justify-center w-28 h-28 rounded-full border-4 ${bgColor}`}>
      <span className={`text-3xl font-bold font-mono ${color}`} data-testid="text-resume-score">
        {score.toFixed(0)}
      </span>
      <span className="text-xs text-muted-foreground">/ 100</span>
    </div>
  );
}

export default function ResumeAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [resumeText, setResumeText] = useState("");
  const [activeResult, setActiveResult] = useState<null | {
    id: number;
    studentId: number;
    resumeText: string;
    skillsFound: string[];
    score: number;
    eligibilityPrediction: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    analyzedAt: string;
    student?: { fullName: string; department: string } | null;
  }>(null);

  const { data: students, isLoading: studentsLoading } = useListStudents();
  const { data: analyses, isLoading: analysesLoading } = useListResumeAnalyses();
  const analyzeResume = useAnalyzeResume();

  function handleAnalyze() {
    if (!selectedStudentId || !resumeText.trim()) {
      toast({ title: "Missing fields", description: "Please select a student and paste resume text.", variant: "destructive" });
      return;
    }
    analyzeResume.mutate(
      { data: { studentId: parseInt(selectedStudentId, 10), resumeText: resumeText.trim() } },
      {
        onSuccess: (result) => {
          setActiveResult(result as typeof activeResult);
          queryClient.invalidateQueries({ queryKey: getListResumeAnalysesQueryKey() });
          toast({ title: "Analysis complete", description: `Resume scored ${result.score.toFixed(0)}/100 — ${result.eligibilityPrediction}` });
        },
        onError: () => {
          toast({ title: "Analysis failed", description: "Something went wrong. Please try again.", variant: "destructive" });
        },
      }
    );
  }

  const selectedStudent = students?.find(s => String(s.id) === selectedStudentId);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-accent" />
          Resume Analysis
        </h1>
        <p className="text-muted-foreground mt-1">
          Paste a student resume to get an AI-powered placement eligibility prediction with skill gap analysis.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Input Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-accent" />
                Analyze Resume
              </CardTitle>
              <CardDescription>Select a student and paste their resume text to predict placement eligibility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Student</label>
                {studentsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Select value={selectedStudentId} onValueChange={setSelectedStudentId} data-testid="select-student">
                    <SelectTrigger data-testid="trigger-student-select">
                      <SelectValue placeholder="Select a student..." />
                    </SelectTrigger>
                    <SelectContent>
                      {students?.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)} data-testid={`option-student-${s.id}`}>
                          {s.fullName} — {s.department}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {selectedStudent && (
                <div className="grid grid-cols-3 gap-3 p-3 rounded-lg bg-muted/50 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Percentage</p>
                    <p className="font-semibold">{selectedStudent.percentage ?? "—"}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Attendance</p>
                    <p className="font-semibold">{selectedStudent.attendance ?? "—"}%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Aptitude</p>
                    <p className="font-semibold">{selectedStudent.aptitudeScore ?? "—"}/100</p>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Resume Text</label>
                <Textarea
                  data-testid="input-resume-text"
                  placeholder={`Paste the student's resume here...\n\nExample:\nJohn Doe | john@email.com | +91 9876543210\n\nEducation:\nB.Tech Computer Science, 8.5 CGPA\n\nSkills:\nPython, React, Node.js, PostgreSQL, AWS, Docker\n\nExperience:\nSoftware Engineering Intern at TechCorp (June–Aug 2024)\n- Developed REST APIs using Node.js and Express\n- Deployed microservices on AWS EC2\n\nProjects:\n- Built a real-time chat app using React and WebSockets\n\nCertifications:\nAWS Certified Cloud Practitioner`}
                  className="min-h-[280px] font-mono text-sm resize-none"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{resumeText.split(/\s+/).filter(Boolean).length} words</p>
              </div>

              <Button
                data-testid="button-analyze-resume"
                className="w-full"
                onClick={handleAnalyze}
                disabled={analyzeResume.isPending || !selectedStudentId || !resumeText.trim()}
              >
                {analyzeResume.isPending ? (
                  <>Analyzing...</>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Analyze Resume
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Result Panel */}
        <div className="space-y-4">
          {activeResult ? (
            <>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Analysis Result</CardTitle>
                      <CardDescription>
                        {activeResult.student?.fullName} — {activeResult.student?.department}
                      </CardDescription>
                    </div>
                    <EligibilityBadge prediction={activeResult.eligibilityPrediction} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="flex items-center gap-6">
                    <ScoreRing score={activeResult.score} />
                    <div className="flex-1 space-y-2">
                      <p className="text-sm font-medium">Resume Strength Score</p>
                      <Progress value={activeResult.score} className="h-2" data-testid="progress-score" />
                      <p className="text-xs text-muted-foreground">
                        {activeResult.score >= 70 ? "Strong profile — good chances of placement." :
                         activeResult.score >= 50 ? "Moderate profile — some improvements needed." :
                         "Weak profile — significant improvements required."}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {activeResult.skillsFound.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Code2 className="w-4 h-4 text-blue-500" />
                        Skills Detected ({activeResult.skillsFound.length})
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {activeResult.skillsFound.map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs" data-testid={`badge-skill-${skill}`}>
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1.5 text-green-700">
                        <TrendingUp className="w-4 h-4" />
                        Strengths
                      </p>
                      <ul className="space-y-1">
                        {activeResult.strengths.map((s, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-strength-${i}`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                            {s}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1.5 text-red-700">
                        <AlertTriangle className="w-4 h-4" />
                        Weaknesses
                      </p>
                      <ul className="space-y-1">
                        {activeResult.weaknesses.map((w, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-weakness-${i}`}>
                            <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 shrink-0" />
                            {w}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-1.5 text-amber-700">
                        <Lightbulb className="w-4 h-4" />
                        Recommendations
                      </p>
                      <ul className="space-y-1">
                        {activeResult.recommendations.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm" data-testid={`text-recommendation-${i}`}>
                            <ChevronRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            {r}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="h-full min-h-[400px] flex items-center justify-center border-dashed">
              <CardContent className="text-center py-12">
                <Target className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">No analysis yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Select a student and paste their resume to see results.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* History */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5 text-muted-foreground" />
          Analysis History
        </h2>

        {analysesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground text-sm">No resume analyses yet. Analyze your first resume above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {analyses.map((analysis) => (
              <Card
                key={analysis.id}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setActiveResult(analysis as typeof activeResult)}
                data-testid={`card-analysis-${analysis.id}`}
              >
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-medium text-sm truncate" data-testid={`text-student-name-${analysis.id}`}>
                        {analysis.student?.fullName ?? `Student #${analysis.studentId}`}
                      </p>
                      <span className="text-muted-foreground text-xs">·</span>
                      <p className="text-xs text-muted-foreground truncate">{analysis.student?.department}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{analysis.skillsFound.length} skills found</span>
                      <span>·</span>
                      <span>{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-lg font-bold font-mono" data-testid={`text-score-${analysis.id}`}>
                        {analysis.score.toFixed(0)}
                        <span className="text-xs font-normal text-muted-foreground">/100</span>
                      </p>
                    </div>
                    <EligibilityBadge prediction={analysis.eligibilityPrediction} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
