import { Switch, Route, Router as WouterRouter } from "wouter";
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
import Models from "./pages/models";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
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
        <Route path="/models" component={Models} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
