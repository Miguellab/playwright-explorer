import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import DiscoverFlows from "./pages/DiscoverFlows";
import ProjectDashboard from "./pages/ProjectDashboard";
import ReleaseDetail from "./pages/ReleaseDetail";
import ReleasesTimeline from "./pages/ReleasesTimeline";
import ProjectSettings from "./pages/ProjectSettings";
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
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/project/:id" element={<ProjectDashboard />} />
            <Route path="/project/:id/discover" element={<DiscoverFlows />} />
            <Route path="/project/:id/release/:releaseId" element={<ReleaseDetail />} />
            <Route path="/project/:id/releases" element={<ReleasesTimeline />} />
            <Route path="/project/:id/settings" element={<ProjectSettings />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
