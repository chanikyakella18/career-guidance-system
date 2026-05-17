import { useState, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListResumeAnalyses,
  getListResumeAnalysesQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Upload,
  Target,
  TrendingUp,
  AlertTriangle,
  Code2,
  Lightbulb,
  FileUp,
  RotateCcw,
  Clock,
  Link,
  Github,
  BarChart3,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  id: number;
  skillsFound: string[];
  score: number;
  eligibilityPrediction: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  analyzedAt: string;
  fileName?: string;
  wordCount?: number;
  sectionsPresent?: string[];
  hasLinkedIn?: boolean;
  hasGitHub?: boolean;
  hasQuantifiedResults?: boolean;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function EligibilityBadge({ prediction }: { prediction: string }) {
  if (prediction === "Eligible") {
    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 gap-1.5 px-3 py-1 text-sm">
        <CheckCircle2 className="w-4 h-4" /> Eligible for Placement
      </Badge>
    );
  }
  if (prediction === "Potentially Eligible") {
    return (
      <Badge className="bg-amber-100 text-amber-800 border-amber-200 gap-1.5 px-3 py-1 text-sm">
        <AlertCircle className="w-4 h-4" /> Potentially Eligible
      </Badge>
    );
  }
  return (
    <Badge className="bg-red-100 text-red-800 border-red-200 gap-1.5 px-3 py-1 text-sm">
      <XCircle className="w-4 h-4" /> Not Eligible
    </Badge>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#16a34a" : score >= 50 ? "#d97706" : "#dc2626";
  const label = score >= 70 ? "Strong Profile" : score >= 50 ? "Moderate Profile" : "Weak Profile";
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative flex items-center justify-center w-32 h-32 rounded-full border-8"
        style={{ borderColor: color + "33" }}
      >
        <div
          className="absolute inset-2 rounded-full flex flex-col items-center justify-center"
          style={{ background: color + "12" }}
        >
          <span className="text-3xl font-bold font-mono" style={{ color }}>
            {score.toFixed(0)}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color }}>{label}</span>
    </div>
  );
}

function SectionChip({ label, present }: { label: string; present: boolean }) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
        present
          ? "bg-green-50 text-green-700 border-green-200"
          : "bg-red-50 text-red-600 border-red-200"
      }`}
    >
      {present ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </div>
  );
}

const ALL_SECTIONS = [
  { key: "objective", label: "Summary" },
  { key: "education", label: "Education" },
  { key: "experience", label: "Experience" },
  { key: "skills", label: "Skills" },
  { key: "projects", label: "Projects" },
  { key: "certifications", label: "Certifications" },
  { key: "achievements", label: "Achievements" },
  { key: "contact", label: "Contact" },
];

// ── File Dropzone ────────────────────────────────────────────────────────────

function FileDropzone({
  onFile,
  file,
  disabled,
}: {
  onFile: (f: File) => void;
  file: File | null;
  disabled?: boolean;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files[0];
      if (dropped) onFile(dropped);
    },
    [onFile]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer ${
        dragging
          ? "border-primary bg-primary/5 scale-[1.01]"
          : file
          ? "border-green-400 bg-green-50"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      } ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />

      {file ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <FileText className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <p className="font-semibold text-green-700">{file.name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(file.size / 1024).toFixed(1)} KB · Click to change file</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <FileUp className="w-8 h-8 text-muted-foreground" />
          </div>
          <div>
            <p className="font-semibold text-base">Drop your resume here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse files</p>
          </div>
          <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
            PDF · DOCX · TXT — max 10 MB
          </p>
        </div>
      )}
    </div>
  );
}

// ── Analysis Result Panel ────────────────────────────────────────────────────

function ResultPanel({ result }: { result: AnalysisResult }) {
  const sections = result.sectionsPresent ?? [];

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-400">
      {/* Header */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              {result.fileName && (
                <p className="text-sm font-semibold flex items-center gap-1.5 text-foreground">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  {result.fileName}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {result.wordCount ? `${result.wordCount} words · ` : ""}
                Analyzed {new Date(result.analyzedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <EligibilityBadge prediction={result.eligibilityPrediction} />
          </div>

          <Separator className="my-4" />

          <div className="flex items-center gap-8">
            <ScoreGauge score={result.score} />
            <div className="flex-1 space-y-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Resume Strength</span>
                  <span className="font-mono font-medium">{result.score.toFixed(0)}%</span>
                </div>
                <Progress value={result.score} className="h-2.5" />
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${result.hasGitHub ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
                  <Github className="w-3 h-3" />
                  {result.hasGitHub ? "GitHub found" : "No GitHub"}
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${result.hasLinkedIn ? "bg-blue-50 text-blue-700" : "bg-muted text-muted-foreground"}`}>
                  <Link className="w-3 h-3" />
                  {result.hasLinkedIn ? "LinkedIn found" : "No LinkedIn"}
                </div>
                <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${result.hasQuantifiedResults ? "bg-purple-50 text-purple-700" : "bg-muted text-muted-foreground"}`}>
                  <BarChart3 className="w-3 h-3" />
                  {result.hasQuantifiedResults ? "Has metrics" : "No metrics"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resume sections coverage */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Resume Sections Coverage</CardTitle>
          <CardDescription className="text-xs">Which standard sections are present in the resume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ALL_SECTIONS.map(s => (
              <SectionChip key={s.key} label={s.label} present={sections.includes(s.key)} />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      {result.skillsFound.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4 text-blue-500" />
              Technical Skills Found ({result.skillsFound.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1.5">
              {result.skillsFound.map(skill => (
                <Badge key={skill} variant="secondary" className="text-xs capitalize">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Strengths */}
      <Card className="border-green-200 bg-green-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-green-700 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Strengths
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.strengths.map((s, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Weaknesses */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-red-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Issues Found
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {result.weaknesses.map((w, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <XCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
            {result.weaknesses.length === 0 && (
              <li className="text-sm text-muted-foreground">No major issues found.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Recommended changes */}
      <Card className="border-amber-200 bg-amber-50/30">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Changes to Make
          </CardTitle>
          <CardDescription className="text-xs">Specific improvements to boost placement chances</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-2.5">
            {result.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="shrink-0 w-5 h-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{r}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function ResumeAnalysis() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeResult, setActiveResult] = useState<AnalysisResult | null>(null);

  const { data: analyses, isLoading: analysesLoading } = useListResumeAnalyses();

  async function handleAnalyze() {
    if (!file) {
      toast({ title: "No file selected", description: "Please upload a resume file first.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("resume", file);

      const res = await fetch("/api/resume-analysis/upload", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Upload failed" }));
        throw new Error(err.error ?? "Upload failed");
      }
      const result: AnalysisResult = await res.json();
      setActiveResult(result);
      queryClient.invalidateQueries({ queryKey: getListResumeAnalysesQueryKey() });
      toast({
        title: "Analysis complete",
        description: `Score: ${result.score.toFixed(0)}/100 — ${result.eligibilityPrediction}`,
      });
    } catch (err: unknown) {
      toast({
        title: "Analysis failed",
        description: err instanceof Error ? err.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setActiveResult(null);
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-accent" />
            Resume Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload any resume (PDF or DOCX) to instantly check placement eligibility and get specific improvement suggestions.
          </p>
        </div>
        {activeResult && (
          <Button variant="outline" size="sm" onClick={handleReset}>
            <RotateCcw className="w-4 h-4 mr-2" />
            New Analysis
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
        {/* ── Left: Upload Panel ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="w-4 h-4 text-accent" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                Upload any resume file — no login or student selection required.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <FileDropzone onFile={setFile} file={file} disabled={uploading} />

              <Button
                className="w-full"
                size="lg"
                onClick={handleAnalyze}
                disabled={uploading || !file}
              >
                {uploading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Analyzing resume...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Analyze Resume
                  </span>
                )}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Supports PDF, DOCX, and TXT · max 10 MB
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Right: Result Panel ── */}
        <div>
          {activeResult ? (
            <ResultPanel result={activeResult} />
          ) : (
            <Card className="min-h-[420px] flex items-center justify-center border-dashed">
              <CardContent className="text-center py-16">
                <Target className="w-14 h-14 text-muted-foreground/25 mx-auto mb-4" />
                <p className="font-semibold text-muted-foreground">No analysis yet</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-[220px] mx-auto">
                  Upload a resume to see the eligibility score and what changes to make.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ── History ── */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-muted-foreground" />
          Analysis History
        </h2>

        {analysesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
          </div>
        ) : !analyses || analyses.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground text-sm">No resume analyses yet. Upload the first resume above.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {analyses.map(analysis => (
              <Card
                key={analysis.id}
                className="hover:shadow-md transition-all cursor-pointer hover:border-primary/30"
                onClick={() => setActiveResult(analysis as AnalysisResult)}
              >
                <CardContent className="py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      Resume #{analysis.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {analysis.skillsFound.length} skills · {new Date(analysis.analyzedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xl font-bold font-mono">
                      {analysis.score.toFixed(0)}<span className="text-xs font-normal text-muted-foreground">/100</span>
                    </span>
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
