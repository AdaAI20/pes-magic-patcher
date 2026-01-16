import { HashRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Players from "./pages/Players";
import Teams from "./pages/Teams";
import Leagues from "./pages/Leagues";
import Import from "./pages/Import";
import EditBin from "./pages/EditBin";

import MainLayout from "./components/layout/MainLayout";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/players" element={<Players />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/import" element={<Import />} />
          <Route path="/edit-bin" element={<EditBin />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
