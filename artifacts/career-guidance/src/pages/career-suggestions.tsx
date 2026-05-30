import { useState } from "react";
import { Link } from "wouter";
import { useListCareerSuggestions, useListStudents, useCreateCareerSuggestion, getListCareerSuggestionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Compass, Sparkles } from "lucide-react";

export default function CareerSuggestions() {
  const [isGenOpen, setIsGenOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions, isLoading } = useListCareerSuggestions();
  const { data: students } = useListStudents();
  const createSuggestion = useCreateCareerSuggestion();

  const handleGenerate = () => {
    if (!selectedStudent) return;
    
    createSuggestion.mutate({ data: { studentId: Number(selectedStudent) } }, {
      onSuccess: () => {
        toast({ title: "Career suggestion generated" });
        setIsGenOpen(false);
        setSelectedStudent("");
        queryClient.invalidateQueries({ queryKey: getListCareerSuggestionsQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to generate suggestion", variant: "destructive" });
      }
    });
  };

  const getDomainBadge = (domain: string) => {
    const badges: Record<string, string> = {
      'Web Development': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'AI/ML': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      'Cyber Security': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      'Data Science': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      'Cloud Computing': 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300',
    };
    return badges[domain] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Compass className="w-8 h-8 text-amber-500" />
            Career Suggestions
          </h1>
          <p className="text-muted-foreground">AI-recommended career paths based on student profiles.</p>
        </div>
        
        <Dialog open={isGenOpen} onOpenChange={setIsGenOpen}>
          <DialogTrigger asChild>
            <Button className="bg-amber-600 hover:bg-amber-700 text-white"><Sparkles className="w-4 h-4 mr-2" /> Generate Path</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Generate Career Recommendation</DialogTitle>
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
              <Button onClick={handleGenerate} disabled={!selectedStudent || createSuggestion.isPending}>
                {createSuggestion.isPending ? "Generating..." : "Generate Recommendation"}
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
              <TableHead>Recommended Domain</TableHead>
              <TableHead>Confidence Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-32 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                </TableRow>
              ))
            ) : suggestions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                  No career suggestions generated yet.
                </TableCell>
              </TableRow>
            ) : (
              suggestions?.map((suggestion) => (
                <TableRow key={suggestion.id}>
                  <TableCell className="font-medium">
                    <Link href={`/students/${suggestion.studentId}`} className="hover:underline">
                      {suggestion.student?.fullName || `Student #${suggestion.studentId}`}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`border-0 ${getDomainBadge(suggestion.suggestedDomain)}`}>
                      {suggestion.suggestedDomain}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 rounded-full" style={{ width: `${suggestion.confidenceScore}%` }} />
                      </div>
                      <span className="text-sm font-mono text-muted-foreground">{suggestion.confidenceScore.toFixed(0)}%</span>
                    </div>
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

