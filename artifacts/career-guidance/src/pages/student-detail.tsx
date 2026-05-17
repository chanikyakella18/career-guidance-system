import { useState } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetStudent, 
  getGetStudentQueryKey,
  useListModels,
  useCreatePrediction,
  useComputeEligibility,
  useCreateCareerSuggestion,
  useGetStudentPrediction,
  useGetStudentEligibility,
  useGetStudentCareerSuggestion,
  getGetStudentPredictionQueryKey,
  getGetStudentEligibilityQueryKey,
  getGetStudentCareerSuggestionQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BrainCircuit, CheckSquare, Compass, User, Phone, Mail, GraduationCap } from "lucide-react";

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

  const getPerformanceBadge = (level: string) => {
    const colors: Record<string, string> = {
      'Excellent': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'Good': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'Average': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'Needs Improvement': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  if (isStudentLoading || !student) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-32 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <Link href="/students" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Students
      </Link>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="flex-1 bg-card border-border/50 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">{student.fullName}</CardTitle>
                <div className="text-muted-foreground text-sm mt-1">{student.department} • Semester {student.semester}</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-4 gap-x-8 text-sm">
              <div>
                <div className="text-muted-foreground mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</div>
                <div className="font-medium truncate">{student.email}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</div>
                <div className="font-medium">{student.phone || 'N/A'}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Percentage</div>
                <div className="font-medium">{student.percentage}%</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Attendance</div>
                <div className="font-medium">{student.attendance}%</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Aptitude</div>
                <div className="font-medium">{student.aptitudeScore}/100</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Communication</div>
                <div className="font-medium">{student.communicationScore}/100</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Technical</div>
                <div className="font-medium">{student.technicalScore}/100</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Prediction Panel */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <BrainCircuit className="w-5 h-5 text-purple-500" />
            <CardTitle className="text-lg">Performance Prediction</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isPredLoading ? (
              <div className="flex-1 flex items-center justify-center"><Skeleton className="h-10 w-24" /></div>
            ) : prediction ? (
              <div className="flex-1 flex flex-col justify-center space-y-4">
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Predicted Placement Score</div>
                  <div className="text-3xl font-bold font-mono">{prediction.predictedScore.toFixed(1)}</div>
                </div>
                <div>
                  <Badge variant="outline" className={`px-3 py-1 ${getPerformanceBadge(prediction.performanceLevel)} border-0`}>
                    {prediction.performanceLevel}
                  </Badge>
                </div>
                <Button variant="outline" size="sm" onClick={handleRunPrediction} disabled={createPrediction.isPending} className="mt-auto w-full">
                  Re-run Prediction
                </Button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground mb-4">No prediction run yet.</p>
                <Button onClick={handleRunPrediction} disabled={createPrediction.isPending}>
                  {createPrediction.isPending ? "Running..." : "Run Prediction Model"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Eligibility Panel */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CheckSquare className="w-5 h-5 text-green-500" />
            <CardTitle className="text-lg">Eligibility Status</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            {isEligLoading ? (
              <div className="flex-1 flex items-center justify-center"><Skeleton className="h-10 w-24" /></div>
            ) : eligibility ? (
              <div className="flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Overall</span>
                    <Badge variant={eligibility.overallEligibility === 'Eligible' ? 'default' : 'destructive'} className={eligibility.overallEligibility === 'Eligible' ? 'bg-green-500' : ''}>
                      {eligibility.overallEligibility}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Attendance</span>
                    <span className={eligibility.attendanceStatus === 'Pass' ? 'text-green-600' : 'text-red-500'}>{eligibility.attendanceStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Academics</span>
                    <span className={eligibility.percentageStatus === 'Pass' ? 'text-green-600' : 'text-red-500'}>{eligibility.percentageStatus}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Aptitude</span>
                    <span className={eligibility.aptitudeStatus === 'Pass' ? 'text-green-600' : 'text-red-500'}>{eligibility.aptitudeStatus}</span>
                  </div>
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

        {/* Career Suggestion Panel */}
        <Card className="border-border/50 shadow-sm flex flex-col">
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <Compass className="w-5 h-5 text-amber-500" />
            <CardTitle className="text-lg">Career Recommendation</CardTitle>
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
                  <div className="text-sm text-muted-foreground mb-1">Confidence Score</div>
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
  );
}