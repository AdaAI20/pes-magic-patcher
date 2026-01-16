import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EditBin from "./pages/EditBin";
import OptionFile from "./pages/OptionFile";

export default function App() {
  return (
    <BrowserRouter basename="/pes-magic-patcher">
      <div className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/edit-bin" element={<EditBin />} />
          <Route path="/option-file" element={<OptionFile />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
