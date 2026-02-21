import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Sidebar } from "@/components/Sidebar";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import KanbanPage from "./pages/KanbanPage";
import LeadsPage from "./pages/LeadsPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            {/*
              Main content area with responsive padding for mobile hamburger menu
              Mobile: pt-16 to account for fixed hamburger button (44px)
              Desktop (md+): no additional padding needed as sidebar is fixed
            */}
            <main className="flex-1 overflow-auto bg-background pt-16 md:pt-0">
              <Routes>
                <Route path="/" element={<Navigate to="/kanban" replace />} />
                <Route path="/kanban" element={<KanbanPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/relatorios" element={<RelatoriosPage />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
