import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { SiteProvider } from "@/contexts/SiteContext";
import Index from "./pages/Index";
import AssessmentsPage from "./pages/AssessmentsPage";
import AssessmentDetail from "./pages/AssessmentDetail";
import NewAssessment from "./pages/NewAssessment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/assessment/:id" element={<AssessmentDetail />} />
              <Route path="/new-assessment" element={<NewAssessment />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </SiteProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
