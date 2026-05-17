import { useState } from "react";
import { Link } from "wouter";
import { useListEligibility, useListStudents, useComputeEligibility, getListEligibilityQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckSquare, Calculator } from "lucide-react";

export default function Eligibility() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: eligibilityList, isLoading } = useListEligibility();
  const { data: students } = useListStudents();
  const computeEligibility = useComputeEligibility();

  const handleCompute = () => {
    if (!selectedStudent) return;
    
    computeEligibility.mutate({ data: { studentId: Number(selectedStudent) } }, {
      onSuccess: () => {
        toast({ title: "Eligibility computed successfully" });
        setIsOpen(false);
        setSelectedStudent("");
        queryClient.invalidateQueries({ queryKey: getListEligibilityQueryKey() });
      },
      onError: () => {
        toast({ title: "Failed to compute eligibility", variant: "destructive" });
      }
    });
  };

  const StatusText = ({ status }: { status: string }) => {
    if (status === 'Pass') return <span className="text-green-600 font-medium">{status}</span>;
    if (status === 'Fail') return <span className="text-red-500 font-medium">{status}</span>;
    return <span>{status}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <CheckSquare className="w-8 h-8 text-green-500" />
            Eligibility Rules
          </h1>
          <p className="text-muted-foreground">Placement eligibility tracking per student.</p>
        </div>
        
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700 text-white"><Calculator className="w-4 h-4 mr-2" /> Check Student</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Compute Placement Eligibility</DialogTitle>
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
              <Button onClick={handleCompute} disabled={!selectedStudent || computeEligibility.isPending}>
                {computeEligibility.isPending ? "Computing..." : "Run Checks"}
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
              <TableHead>Attendance</TableHead>
              <TableHead>Aptitude</TableHead>
              <TableHead>Academics</TableHead>
              <TableHead className="text-right">Overall Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-6 w-20 ml-auto rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : eligibilityList?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No eligibility records computed yet.
                </TableCell>
              </TableRow>
            ) : (
              eligibilityList?.map((eligibility) => (
                <TableRow key={eligibility.id}>
                  <TableCell className="font-medium">
                    <Link href={`/students/${eligibility.studentId}`} className="hover:underline">
                      {eligibility.student?.fullName || `Student #${eligibility.studentId}`}
                    </Link>
                  </TableCell>
                  <TableCell><StatusText status={eligibility.attendanceStatus} /></TableCell>
                  <TableCell><StatusText status={eligibility.aptitudeStatus} /></TableCell>
                  <TableCell><StatusText status={eligibility.percentageStatus} /></TableCell>
                  <TableCell className="text-right">
                    <Badge variant={eligibility.overallEligibility === 'Eligible' ? 'default' : 'destructive'} 
                           className={eligibility.overallEligibility === 'Eligible' ? 'bg-green-500 hover:bg-green-600' : ''}>
                      {eligibility.overallEligibility}
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