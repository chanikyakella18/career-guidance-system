import { useState } from "react";
import { Link } from "wouter";
import { useListPredictions, useListStudents, useCreatePrediction, getListPredictionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BrainCircuit, Play } from "lucide-react";

export default function Predictions() {
  const [isRunOpen, setIsRunOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: predictions, isLoading } = useListPredictions();
  const { data: students } = useListStudents();
  const createPrediction = useCreatePrediction();

  const handleRun = () => {
    if (!selectedStudent) return;
    
    createPrediction.mutate({ data: { studentId: Number(selectedStudent) } }, {
      onSuccess: () => {
        toast({ title: "Prediction run successfully" });
        setIsRunOpen(false);
        setSelectedStudent("");
        queryClient.invalidateQueries({ queryKey: getListPredictionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to run prediction", variant: "destructive" });
      }
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BrainCircuit className="w-8 h-8 text-purple-500" />
            Predictions
          </h1>
          <p className="text-muted-foreground">ML-powered performance predictions for students.</p>
        </div>
        
        <Dialog open={isRunOpen} onOpenChange={setIsRunOpen}>
          <DialogTrigger asChild>
            <Button><Play className="w-4 h-4 mr-2" /> Run Prediction</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Run Prediction Model</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <label className="text-sm font-medium mb-2 block">Select Student</label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students?.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.fullName} ({s.department})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button onClick={handleRun} disabled={!selectedStudent || createPrediction.isPending}>
                {createPrediction.isPending ? "Running..." : "Execute Model"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-md border overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Student Name</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Predicted Score</TableHead>
              <TableHead>Performance Level</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : predictions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No predictions run yet.
                </TableCell>
              </TableRow>
            ) : (
              predictions?.map((prediction) => (
                <TableRow key={prediction.id}>
                  <TableCell className="font-medium">
                    <Link href={`/students/${prediction.studentId}`} className="hover:underline">
                      {prediction.student?.fullName || `Student #${prediction.studentId}`}
                    </Link>
                  </TableCell>
                  <TableCell>{prediction.student?.department || 'Unknown'}</TableCell>
                  <TableCell className="font-mono">{prediction.predictedScore.toFixed(1)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 ${getPerformanceBadge(prediction.performanceLevel)}`}>
                      {prediction.performanceLevel}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}