import { useGetDashboardStats, useGetDepartmentBreakdown, useGetPerformanceDistribution, useGetCareerDomainDistribution, useGetEligibilitySummary } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BrainCircuit, CheckCircle, Compass } from "lucide-react";
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, AreaChart, Area, CartesianGrid } from 'recharts';

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: deptData, isLoading: deptLoading } = useGetDepartmentBreakdown();
  const { data: perfData, isLoading: perfLoading } = useGetPerformanceDistribution();
  const { data: eligData, isLoading: eligLoading } = useGetEligibilitySummary();

  const isLoading = statsLoading || deptLoading || perfLoading || eligLoading;

  if (isLoading || !stats || !deptData || !perfData || !eligData) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  const items = [
    { title: "Total Students", value: stats.totalStudents, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Predictions Run", value: stats.totalPredictions, icon: BrainCircuit, color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Eligible for Placement", value: stats.totalEligible, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Career Suggestions", value: stats.totalSuggestions, icon: Compass, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  const eligibilityChartData = [
    { name: 'Eligible', value: eligData.eligible, color: 'hsl(var(--chart-3))' },
    { name: 'Not Eligible', value: eligData.notEligible, color: 'hsl(var(--chart-4))' },
    { name: 'Pending', value: eligData.pending, color: 'hsl(var(--chart-2))' },
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
                <div className={`p-2 rounded-md ${item.bg}`}>
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold font-mono">{item.value.toLocaleString()}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Department Breakdown</CardTitle>
            <CardDescription>Number of students per department</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle>Eligibility Summary</CardTitle>
            <CardDescription>Placement eligibility status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={eligibilityChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {eligibilityChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
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