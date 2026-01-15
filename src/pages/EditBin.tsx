import { useState, useEffect } from "react";
import { initCrypto } from "@/crypto/pesCrypto";
import { loadEditBin, exportEditBin } from "@/parsers/editBinParser";

export default function EditBin() {
  const [data, setData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    initCrypto();
  }, []);

  async function onLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await loadEditBin(file);
    setData(result.raw);
  }

  function onExport() {
    if (!data) return;
    const blob = exportEditBin(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "EDIT00000000";
    a.click();
  }

  return (
    <div>
      <h1>Edit.bin Editor</h1>
      <input type="file" onChange={onLoad} />
      {data && <button onClick={onExport}>Export Edit.bin</button>}
    </div>
  );
}
