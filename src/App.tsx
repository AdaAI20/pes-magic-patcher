import { HashRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EditBin from "./pages/EditBin";
import OptionFile from "./pages/OptionFile";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/import" element={<OptionFile />} />
          <Route path="/edit-bin" element={<EditBin />} />
        </Routes>
      </HashRouter>
    </div>
  );
}
