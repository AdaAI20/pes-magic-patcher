import { HashRouter, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";

import Dashboard from "@/pages/Dashboard";
import Players from "@/pages/Players";
import Teams from "@/pages/Teams";
import Leagues from "@/pages/Leagues";
import Faces from "@/pages/Faces";
import Kits from "@/pages/Kits";
import Balls from "@/pages/Balls";

import Import from "@/pages/Import";      // ✅ FIX
import EditBin from "@/pages/EditBin";    // stays separate

import ExportPage from "@/pages/Export";
import PatchBuilder from "@/pages/PatchBuilder";
import FileBrowser from "@/pages/FileBrowser";
import Settings from "@/pages/Settings";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />

          <Route path="/players" element={<Players />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/leagues" element={<Leagues />} />

          <Route path="/faces" element={<Faces />} />
          <Route path="/kits" element={<Kits />} />
          <Route path="/balls" element={<Balls />} />

          {/* ✅ CORRECT ROUTING */}
          <Route path="/import" element={<Import />} />
          <Route path="/edit-bin" element={<EditBin />} />

          <Route path="/export" element={<ExportPage />} />
          <Route path="/patch-builder" element={<PatchBuilder />} />
          <Route path="/file-browser" element={<FileBrowser />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
