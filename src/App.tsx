import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import Leagues from "./pages/Leagues";
import Faces from "./pages/Faces";
import Kits from "./pages/Kits";
import Balls from "./pages/Balls";
import Import from "./pages/Import";
import Export from "./pages/Export";
import PatchBuilder from "./pages/PatchBuilder";
import FileBrowser from "./pages/FileBrowser";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/players" element={<Players />} />
            <Route path="/teams" element={<Teams />} />
            <Route path="/leagues" element={<Leagues />} />
            <Route path="/faces" element={<Faces />} />
            <Route path="/kits" element={<Kits />} />
            <Route path="/balls" element={<Balls />} />
            <Route path="/import" element={<Import />} />
            <Route path="/export" element={<Export />} />
            <Route path="/patch-builder" element={<PatchBuilder />} />
            <Route path="/file-browser" element={<FileBrowser />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
