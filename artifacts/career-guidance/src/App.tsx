import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Layout } from "./components/layout";
import Dashboard from "./pages/dashboard";
import Students from "./pages/students";
import StudentDetail from "./pages/student-detail";
import Predictions from "./pages/predictions";
import CareerSuggestions from "./pages/career-suggestions";
import Eligibility from "./pages/eligibility";
import Analytics from "./pages/analytics";
import ResumeAnalysis from "./pages/resume-analysis";
import Login from "./pages/login";
import { AuthProvider, useAuth } from "./contexts/auth-context";
import { ThemeProvider } from "./contexts/theme-context";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function ProtectedRouter() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/students" component={Students} />
        <Route path="/students/:id" component={StudentDetail} />
        <Route path="/predictions" component={Predictions} />
        <Route path="/career-suggestions" component={CareerSuggestions} />
        <Route path="/eligibility" component={Eligibility} />
        <Route path="/analytics" component={Analytics} />
        <Route path="/resume-analysis" component={ResumeAnalysis} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <ProtectedRouter />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
