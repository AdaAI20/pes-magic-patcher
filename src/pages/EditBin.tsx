import { useEffect, useState } from "react";
import { initCrypto } from "@/crypto/pesCrypto";
import { loadEditBin, exportEditBin } from "@/parsers/editBinParser";

export default function EditBin() {
  const [edit, setEdit] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    initCrypto().catch(console.error);
  }, []);

  async function load(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await loadEditBin(file);
      setEdit(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "Load failed");
    }
  }

  function save() {
    if (!edit) return;
    const blob = exportEditBin(edit.raw);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EDIT.BIN";
    a.click();
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">EDIT.BIN Editor</h2>

      <input type="file" accept=".bin" onChange={load} />

      {edit && (
        <>
          <button onClick={save} className="block mt-4 underline">
            Export EDIT.BIN
          </button>

          <pre className="mt-4 bg-black text-green-400 p-3">
{JSON.stringify(edit.header, null, 2)}
          </pre>
        </>
      )}

      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
}
