import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetStudent, 
  getGetStudentQueryKey,
  useCreatePrediction,
  useComputeEligibility,
  useCreateCareerSuggestion,
  useGetStudentPrediction,
  useGetStudentEligibility,
  useGetStudentCareerSuggestion,
  useUpdateStudent,
  getGetStudentPredictionQueryKey,
  getGetStudentEligibilityQueryKey,
  getGetStudentCareerSuggestionQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, CheckSquare, Compass, User, Phone, Mail,
  TrendingUp, BarChart3, Activity, GraduationCap, Brain, Target,
  CalendarDays, Save, RefreshCw
} from "lucide-react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from "recharts";

// ── helpers ──────────────────────────────────────────────────────────────────

function getScoreColor(val: number, max = 100) {
  const pct = (val / max) * 100;
  if (pct >= 75) return "#16a34a";
  if (pct >= 50) return "#d97706";
  return "#dc2626";
}

function getScoreLabel(val: number, max = 100) {
  const pct = (val / max) * 100;
  if (pct >= 85) return "Excellent";
  if (pct >= 70) return "Good";
  if (pct >= 50) return "Average";
  return "Needs Improvement";
}

function getPerformanceBadgeClass(level: string) {
  const colors: Record<string, string> = {
    Excellent: "bg-green-100 text-green-800 border-green-200",
    Good: "bg-blue-100 text-blue-800 border-blue-200",
    Average: "bg-yellow-100 text-yellow-800 border-yellow-200",
    "Needs Improvement": "bg-red-100 text-red-800 border-red-200",
  };
  return colors[level] ?? "bg-gray-100 text-gray-800";
}

// ── Score bar row ─────────────────────────────────────────────────────────────

function ScoreRow({ label, value, max = 100, icon }: { label: string; value: number | null | undefined; max?: number; icon: React.ReactNode }) {
  const v = value ?? 0;
  const color = getScoreColor(v, max);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          {icon}
          {label}
        </span>
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold" style={{ color }}>
            {v.toFixed(0)}{max === 100 ? "%" : ""}
          </span>
          <Badge
            className={`text-[10px] px-1.5 py-0 border ${getPerformanceBadgeClass(getScoreLabel(v, max))}`}
            variant="outline"
          >
            {getScoreLabel(v, max)}
          </Badge>
        </div>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${(v / max) * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Overall performance meter ─────────────────────────────────────────────────

function OverallScore({ student }: { student: { percentage?: number | null; attendance?: number | null; aptitudeScore?: number | null; communicationScore?: number | null; technicalScore?: number | null } }) {
  const scores = [
    student.percentage ?? 0,
    student.attendance ?? 0,
    student.aptitudeScore ?? 0,
    student.communicationScore ?? 0,
    student.technicalScore ?? 0,
  ];
  const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
  const color = getScoreColor(avg);
  const label = getScoreLabel(avg);

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative flex items-center justify-center w-24 h-24 rounded-full border-8 shrink-0"
        style={{ borderColor: color + "33" }}
      >
        <div
          className="absolute inset-2 rounded-full flex flex-col items-center justify-center"
          style={{ background: color + "15" }}
        >
          <span className="text-2xl font-bold font-mono leading-none" style={{ color }}>
            {avg.toFixed(0)}
          </span>
          <span className="text-[10px] text-muted-foreground">/100</span>
        </div>
      </div>
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Overall Performance</p>
        <p className="text-xl font-bold" style={{ color }}>{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Average across all 5 metrics</p>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StudentDetail() {
  const { id } = useParams();
  const studentId = Number(id);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: student, isLoading: isStudentLoading } = useGetStudent(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentQueryKey(studentId) }
  });

  const { data: prediction, isLoading: isPredLoading } = useGetStudentPrediction(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentPredictionQueryKey(studentId), retry: false }
  });

  const { data: eligibility, isLoading: isEligLoading } = useGetStudentEligibility(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentEligibilityQueryKey(studentId), retry: false }
  });

  const { data: careerSuggestion, isLoading: isCareerLoading } = useGetStudentCareerSuggestion(studentId, {
    query: { enabled: !!studentId, queryKey: getGetStudentCareerSuggestionQueryKey(studentId), retry: false }
  });

  const createPrediction = useCreatePrediction();
  const computeEligibility = useComputeEligibility();
  const createCareerSuggestion = useCreateCareerSuggestion();
  const updateStudent = useUpdateStudent();

  // Manual attendance state
  const [attendedClasses, setAttendedClasses] = useState<string>("");
  const [totalClasses, setTotalClasses] = useState<string>("");

  const attendedNum = parseInt(attendedClasses, 10);
  const totalNum = parseInt(totalClasses, 10);
  const calculatedPct =
    !isNaN(attendedNum) && !isNaN(totalNum) && totalNum > 0
      ? Math.min(100, Math.round((attendedNum / totalNum) * 1000) / 10)
      : null;

  const handleSaveAttendance = () => {
    if (calculatedPct === null) return;
    updateStudent.mutate(
      { id: studentId, data: { attendance: calculatedPct } },
      {
        onSuccess: () => {
          toast({ title: "Attendance saved", description: `Updated to ${calculatedPct.toFixed(1)}%` });
          queryClient.invalidateQueries({ queryKey: getGetStudentQueryKey(studentId) });
        },
        onError: () => toast({ title: "Failed to save attendance", variant: "destructive" }),
      }
    );
  };

  const handleRunPrediction = () => {
    createPrediction.mutate({ data: { studentId } }, {
      onSuccess: () => {
        toast({ title: "Prediction generated" });
        queryClient.invalidateQueries({ queryKey: getGetStudentPredictionQueryKey(studentId) });
      },
      onError: () => toast({ title: "Failed to run prediction", variant: "destructive" })
    });
  };

  const handleCheckEligibility = () => {
    computeEligibility.mutate({ data: { studentId } }, {
      onSuccess: () => {
        toast({ title: "Eligibility computed" });
        queryClient.invalidateQueries({ queryKey: getGetStudentEligibilityQueryKey(studentId) });
      },
      onError: () => toast({ title: "Failed to compute eligibility", variant: "destructive" })
    });
  };

  const handleGenerateCareer = () => {
    createCareerSuggestion.mutate({ data: { studentId } }, {
      onSuccess: () => {
        toast({ title: "Career suggestion generated" });
        queryClient.invalidateQueries({ queryKey: getGetStudentCareerSuggestionQueryKey(studentId) });
      },
      onError: () => toast({ title: "Failed to generate suggestion", variant: "destructive" })
    });
  };

  if (isStudentLoading || !student) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const radarData = [
    { metric: "Academics", value: student.percentage ?? 0 },
    { metric: "Attendance", value: student.attendance ?? 0 },
    { metric: "Aptitude", value: student.aptitudeScore ?? 0 },
    { metric: "Communication", value: student.communicationScore ?? 0 },
    { metric: "Technical", value: student.technicalScore ?? 0 },
  ];

  const barData = [
    { name: "Academics", value: student.percentage ?? 0, color: getScoreColor(student.percentage ?? 0) },
    { name: "Attendance", value: student.attendance ?? 0, color: getScoreColor(student.attendance ?? 0) },
    { name: "Aptitude", value: student.aptitudeScore ?? 0, color: getScoreColor(student.aptitudeScore ?? 0) },
    { name: "Comms", value: student.communicationScore ?? 0, color: getScoreColor(student.communicationScore ?? 0) },
    { name: "Technical", value: student.technicalScore ?? 0, color: getScoreColor(student.technicalScore ?? 0) },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Link href="/students" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Students
      </Link>

      {/* ── Profile header ── */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-7 w-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold">{student.fullName}</h1>
              <p className="text-muted-foreground mt-0.5">
                {student.department} · Semester {student.semester}
              </p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Mail className="w-3.5 h-3.5" />{student.email}
                </span>
                {student.phone && (
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />{student.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Performance section ── */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-accent" />
          Academic Performance
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score breakdown card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-muted-foreground" />
                Score Breakdown
              </CardTitle>
              <CardDescription className="text-xs">All academic and skill metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <OverallScore student={student} />

              <div className="border-t pt-4 space-y-4">
                <ScoreRow
                  label="Academic Percentage"
                  value={student.percentage}
                  icon={<GraduationCap className="w-3.5 h-3.5" />}
                />
                <ScoreRow
                  label="Attendance"
                  value={student.attendance}
                  icon={<Target className="w-3.5 h-3.5" />}
                />
                <ScoreRow
                  label="Aptitude Score"
                  value={student.aptitudeScore}
                  icon={<Brain className="w-3.5 h-3.5" />}
                />
                <ScoreRow
                  label="Communication Score"
                  value={student.communicationScore}
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                />
                <ScoreRow
                  label="Technical Score"
                  value={student.technicalScore}
                  icon={<BarChart3 className="w-3.5 h-3.5" />}
                />
              </div>
            </CardContent>
          </Card>

          {/* Charts card */}
          <div className="space-y-6">
            {/* Radar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Performance Radar</CardTitle>
                <CardDescription className="text-xs">Skill coverage across all dimensions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <Radar
                      name="Score"
                      dataKey="value"
                      stroke="#f59e0b"
                      fill="#f59e0b"
                      fillOpacity={0.25}
                      strokeWidth={2}
                    />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(0)}%`, "Score"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bar chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Score Comparison</CardTitle>
                <CardDescription className="text-xs">Scores vs 75% placement threshold</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#94a3b8" }} />
                    <Tooltip
                      formatter={(v: number) => [`${v.toFixed(0)}%`, "Score"]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
                    />
                    {/* Threshold reference line at 75 */}
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {barData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  Green ≥ 75% · Amber 50–74% · Red &lt; 50%
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ── Manual Attendance Entry ── */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <CalendarDays className="w-5 h-5 text-accent" />
          Attendance Entry
        </h2>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Mark Attendance Manually</CardTitle>
            <CardDescription className="text-xs">
              Enter the number of classes attended and total classes held. The percentage and performance will update automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Inputs */}
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="attended" className="text-sm">Classes Attended</Label>
                    <Input
                      id="attended"
                      type="number"
                      min={0}
                      placeholder="e.g. 72"
                      value={attendedClasses}
                      onChange={(e) => setAttendedClasses(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="total" className="text-sm">Total Classes</Label>
                    <Input
                      id="total"
                      type="number"
                      min={1}
                      placeholder="e.g. 90"
                      value={totalClasses}
                      onChange={(e) => setTotalClasses(e.target.value)}
                    />
                  </div>
                </div>

                {/* Live preview */}
                {calculatedPct !== null && (
                  <div className="rounded-lg border p-4 bg-muted/30 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Calculated Attendance</span>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xl font-bold font-mono"
                          style={{ color: getScoreColor(calculatedPct) }}
                        >
                          {calculatedPct.toFixed(1)}%
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-xs border ${getPerformanceBadgeClass(getScoreLabel(calculatedPct))}`}
                        >
                          {getScoreLabel(calculatedPct)}
                        </Badge>
                      </div>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${calculatedPct}%`,
                          background: getScoreColor(calculatedPct),
                        }}
                      />
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      {attendedClasses} attended out of {totalClasses} classes ·{" "}
                      {calculatedPct >= 75
                        ? "✓ Meets the 75% placement threshold"
                        : `✗ ${(75 - calculatedPct).toFixed(1)}% below placement threshold`}
                    </p>
                  </div>
                )}

                {attendedClasses && totalClasses && calculatedPct === null && (
                  <p className="text-xs text-destructive">Total classes must be greater than 0.</p>
                )}

                <div className="flex items-center gap-3">
                  <Button
                    onClick={handleSaveAttendance}
                    disabled={calculatedPct === null || updateStudent.isPending}
                    className="flex-1"
                  >
                    {updateStudent.isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Save className="w-4 h-4" />
                        Save Attendance
                      </span>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setAttendedClasses(""); setTotalClasses(""); }}
                    title="Clear"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Right: Current attendance status */}
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground font-medium">Current Recorded Attendance</p>
                <div className="flex items-center gap-4">
                  <div
                    className="relative flex items-center justify-center w-20 h-20 rounded-full border-8 shrink-0"
                    style={{ borderColor: getScoreColor(student.attendance ?? 0) + "33" }}
                  >
                    <div
                      className="absolute inset-2 rounded-full flex flex-col items-center justify-center"
                      style={{ background: getScoreColor(student.attendance ?? 0) + "15" }}
                    >
                      <span
                        className="text-lg font-bold font-mono leading-none"
                        style={{ color: getScoreColor(student.attendance ?? 0) }}
                      >
                        {(student.attendance ?? 0).toFixed(0)}
                      </span>
                      <span className="text-[10px] text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div>
                    <p
                      className="text-lg font-bold"
                      style={{ color: getScoreColor(student.attendance ?? 0) }}
                    >
                      {getScoreLabel(student.attendance ?? 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(student.attendance ?? 0) >= 75
                        ? "Above placement threshold (75%)"
                        : "Below placement threshold (75%)"}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className="font-mono font-medium">{(student.attendance ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${student.attendance ?? 0}%`,
                        background: getScoreColor(student.attendance ?? 0),
                      }}
                    />
                  </div>
                  {/* Threshold marker */}
                  <div className="relative h-3">
                    <div
                      className="absolute top-0 w-px h-3 bg-amber-400"
                      style={{ left: "75%" }}
                    />
                    <span
                      className="absolute top-0 text-[10px] text-amber-600 font-medium"
                      style={{ left: "calc(75% + 3px)" }}
                    >
                      75% threshold
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    { label: "Excellent", range: "≥ 85%", color: "#16a34a" },
                    { label: "Good", range: "70–84%", color: "#2563eb" },
                    { label: "Average", range: "50–69%", color: "#d97706" },
                  ].map((item) => (
                    <div key={item.label} className="text-center p-2 rounded-lg bg-muted/50">
                      <div className="w-2 h-2 rounded-full mx-auto mb-1" style={{ background: item.color }} />
                      <p className="text-[10px] font-medium">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.range}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── AI Insights ── */}
      <div>
        <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-accent" />
          AI Insights
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Prediction Panel */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <CardTitle className="text-base">Performance Prediction</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isPredLoading ? (
                <div className="flex-1 flex items-center justify-center"><Skeleton className="h-10 w-24" /></div>
              ) : prediction ? (
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Predicted Score</div>
                    <div className="text-3xl font-bold font-mono">{prediction.predictedScore.toFixed(1)}</div>
                  </div>
                  <div>
                    <Badge
                      variant="outline"
                      className={`px-3 py-1 border ${getPerformanceBadgeClass(prediction.performanceLevel)}`}
                    >
                      {prediction.performanceLevel}
                    </Badge>
                  </div>
                  <Progress value={prediction.predictedScore} className="h-2" />
                  <Button variant="outline" size="sm" onClick={handleRunPrediction} disabled={createPrediction.isPending} className="mt-auto w-full">
                    Re-run Prediction
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">No prediction run yet.</p>
                  <Button onClick={handleRunPrediction} disabled={createPrediction.isPending}>
                    {createPrediction.isPending ? "Running..." : "Run Prediction"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Eligibility Panel */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <CheckSquare className="w-5 h-5 text-green-500" />
              <CardTitle className="text-base">Eligibility Status</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isEligLoading ? (
                <div className="flex-1 flex items-center justify-center"><Skeleton className="h-10 w-24" /></div>
              ) : eligibility ? (
                <div className="flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Overall</span>
                      <Badge
                        className={eligibility.overallEligibility === "Eligible" ? "bg-green-500" : ""}
                        variant={eligibility.overallEligibility === "Eligible" ? "default" : "destructive"}
                      >
                        {eligibility.overallEligibility}
                      </Badge>
                    </div>
                    {[
                      { label: "Attendance", status: eligibility.attendanceStatus },
                      { label: "Academics", status: eligibility.percentageStatus },
                      { label: "Aptitude", status: eligibility.aptitudeStatus },
                    ].map(({ label, status }) => (
                      <div key={label} className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">{label}</span>
                        <span className={status === "Pass" ? "text-green-600 font-medium" : "text-red-500 font-medium"}>
                          {status}
                        </span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCheckEligibility} disabled={computeEligibility.isPending} className="mt-4 w-full">
                    Re-check Eligibility
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">Eligibility not checked.</p>
                  <Button onClick={handleCheckEligibility} disabled={computeEligibility.isPending}>
                    {computeEligibility.isPending ? "Checking..." : "Check Eligibility"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Career Panel */}
          <Card className="flex flex-col">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <Compass className="w-5 h-5 text-amber-500" />
              <CardTitle className="text-base">Career Recommendation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {isCareerLoading ? (
                <div className="flex-1 flex items-center justify-center"><Skeleton className="h-10 w-24" /></div>
              ) : careerSuggestion ? (
                <div className="flex-1 flex flex-col justify-center space-y-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Recommended Domain</div>
                    <div className="text-xl font-bold">{careerSuggestion.suggestedDomain}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Confidence</div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${careerSuggestion.confidenceScore}%` }} />
                      </div>
                      <span className="text-sm font-mono">{careerSuggestion.confidenceScore.toFixed(0)}%</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleGenerateCareer} disabled={createCareerSuggestion.isPending} className="mt-auto w-full">
                    Generate New Path
                  </Button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                  <p className="text-sm text-muted-foreground mb-4">No career path generated.</p>
                  <Button onClick={handleGenerateCareer} disabled={createCareerSuggestion.isPending}>
                    {createCareerSuggestion.isPending ? "Generating..." : "Generate Recommendation"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
