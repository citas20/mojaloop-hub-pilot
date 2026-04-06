import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ParticipantsPage from "@/pages/ParticipantsPage";
import EndpointsPage from "@/pages/EndpointsPage";
import FundsPage from "@/pages/FundsPage";
import OnboardingPage from "@/pages/OnboardingPage";
import TransfersPage from "@/pages/TransfersPage";
import SettlementPage from "@/pages/SettlementPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/participants" element={<ParticipantsPage />} />
            <Route path="/endpoints" element={<EndpointsPage />} />
            <Route path="/funds" element={<FundsPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/settlement" element={<SettlementPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
