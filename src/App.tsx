import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import EditBin from "./pages/EditBin";
import OptionFile from "./pages/OptionFile";

export default function App() {
  return (
    <div className="min-h-screen p-6">
      <nav className="flex gap-4 mb-6">
        <Link to="/" className="underline">Home</Link>
        <Link to="/edit-bin" className="underline">EDIT.BIN</Link>
        <Link to="/option-file" className="underline">Option File</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/edit-bin" element={<EditBin />} />
        <Route path="/option-file" element={<OptionFile />} />
      </Routes>
    </div>
  );
}
