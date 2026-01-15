import { useState } from "react";
import { loadOptionFile, exportOptionFile } from "@/parsers/optionFileParser";

export default function OptionFiles() {
  const [data, setData] = useState<Uint8Array | null>(null);

  async function onLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const raw = await loadOptionFile(file);
    setData(raw);
  }

  function onExport() {
    if (!data) return;
    const blob = exportOptionFile(data);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "option.bin";
    a.click();
  }

  return (
    <div>
      <h1>Option Files (BIN / TED)</h1>
      <input type="file" onChange={onLoad} />
      {data && <button onClick={onExport}>Export Option File</button>}
    </div>
  );
}
