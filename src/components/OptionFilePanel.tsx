import { useState } from "react";

export default function OptionFilePanel() {
  const [fileName, setFileName] = useState<string>("");

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    // Later: call loadOptionFile(file)
    console.log("Option file loaded:", file.name);
  }

  return (
    <section style={{ padding: 16, border: "1px solid #444", marginTop: 20 }}>
      <h2>Option Files (BIN / TED)</h2>
      <input type="file" onChange={onFileChange} />
      {fileName && <p>Loaded: {fileName}</p>}
    </section>
  );
}
