import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import ProjectDashboard from "./pages/ProjectDashboard";
import RunReport from "./pages/RunReport";
import ProjectSettings from "./pages/ProjectSettings";
import Runner from "./pages/Runner";
import Runs from "./pages/Runs";
import RunDetail from "./pages/RunDetail";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Sentinelle MVP */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/project/:id" element={<ProjectDashboard />} />
          <Route path="/project/:id/run/:runId" element={<RunReport />} />
          <Route path="/project/:id/settings" element={<ProjectSettings />} />
          {/* Legacy runner */}
          <Route path="/runner" element={<Runner />} />
          <Route path="/runs" element={<Runs />} />
          <Route path="/runs/:id" element={<RunDetail />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
