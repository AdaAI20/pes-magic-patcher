import { useState, useEffect } from "react";
import { initCrypto } from "@/crypto/pesCrypto";
import { loadEditBin, exportEditBin } from "@/parsers/editBinParser";
import { Button } from "@/components/ui/button";

export default function EditBin() {
  const [edit, setEdit] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    initCrypto().catch(console.error);
  }, []);

  async function handleLoadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await loadEditBin(file);
      console.log("EDIT.BIN loaded:", result);
      setEdit(result);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to load EDIT.BIN");
    }
  }

  function handleExport() {
    if (!edit) return;

    const blob = exportEditBin(edit.raw);
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "EDIT.BIN";
    a.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">EDIT.BIN Editor</h1>

      <input
        type="file"
        accept=".bin"
        onChange={handleLoadFile}
        className="block"
      />

      <Button onClick={handleExport} disabled={!edit}>
        Export EDIT.BIN
      </Button>

      {error && <p className="text-red-500">{error}</p>}

      {edit && (
        <pre className="bg-gray-900 text-green-300 p-4 rounded text-sm overflow-auto">
{JSON.stringify(edit.header, null, 2)}
        </pre>
      )}
    </div>
  );
}
