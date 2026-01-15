import { useState } from "react";

export default function EditBinPanel() {
  const [fileName, setFileName] = useState<string>("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // Later: call loadEditBin(file)
    console.log("Edit.bin loaded:", file.name);
  }

  return (
    <section style={{ padding: 16, border: "1px solid #444" }}>
      <h2>EDIT00000000 (edit.bin)</h2>
      <input type="file" onChange={onFileChange} />
      {fileName && <p>Loaded: {fileName}</p>}
    </section>
  );
}
