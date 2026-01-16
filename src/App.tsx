import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import EditBin from "./pages/EditBin";
import OptionFile from "./pages/OptionFile";
import { Button } from "@/components/ui/button";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b p-4 flex gap-3">
        <Button asChild variant="outline">
          <a href="#/">Home</a>
        </Button>
        <Button asChild variant="outline">
          <a href="#/edit-bin">EDIT.BIN</a>
        </Button>
        <Button asChild variant="outline">
          <a href="#/option-file">Option File</a>
        </Button>
      </header>

      {/* Page content */}
      <main className="flex-1 p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/edit-bin" element={<EditBin />} />
          <Route path="/option-file" element={<OptionFile />} />
        </Routes>
      </main>
    </div>
  );
}
