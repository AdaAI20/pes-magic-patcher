import { Routes, Route, NavLink } from "react-router-dom";
import Home from "./pages/Home";
import OptionFiles from "./pages/OptionFiles";
import Edit00000000 from "./pages/Edit00000000";
import NotFound from "./pages/NotFound";
import Teams from "./pages/Teams";
import Players from "./pages/Players";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="bg-white shadow-md p-4 flex gap-4">
        <NavLink to="/" className="font-bold hover:underline">
          Home
        </NavLink>
        <NavLink to="/option-files" className="hover:underline">
          Option Files
        </NavLink>
        <NavLink to="/edit00000000" className="hover:underline">
          EDIT00000000
        </NavLink>
        <NavLink to="/teams" className="hover:underline">
          Teams
        </NavLink>
        <NavLink to="/players" className="hover:underline">
          Players
        </NavLink>
      </header>

      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/option-files" element={<OptionFiles />} />
          <Route path="/edit00000000" element={<Edit00000000 />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
