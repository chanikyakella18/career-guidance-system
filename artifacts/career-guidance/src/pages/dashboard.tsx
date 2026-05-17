import { useGetDashboardStats } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BrainCircuit, CheckCircle, Compass } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats();

  if (isLoading || !stats) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = [
    { title: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-500" },
    { title: "Predictions Run", value: stats.totalPredictions, icon: BrainCircuit, color: "text-purple-500" },
    { title: "Eligible for Placement", value: stats.totalEligible, icon: CheckCircle, color: "text-green-500" },
    { title: "Career Suggestions", value: stats.totalSuggestions, icon: Compass, color: "text-amber-500" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Overview</h1>
        <p className="text-muted-foreground mt-2">At-a-glance metrics for all monitored students.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <Card key={i} className="border-border/50 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <Icon className={`w-5 h-5 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{item.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Average Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.avgPercentage.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Average Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.avgAttendance.toFixed(1)}%</div>
          </CardContent>
        </Card>
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Average Aptitude</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-mono">{stats.avgAptitude.toFixed(1)}/100</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
