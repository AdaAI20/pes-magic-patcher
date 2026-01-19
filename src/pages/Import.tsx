import { useRef, useState } from "react";
import {
  Upload, FileArchive, FileText, Database, FolderOpen, X, HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { initCrypto } from "@/crypto/pesCrypto";
import { loadEditBin } from "@/parsers/editBinParser";
import { useEditBinStore } from "@/store/editBinStore";

type FileStatus = "pending" | "loaded" | "error";

interface ImportedFile {
  file: File;
  name: string;
  size: string;
  type: "BIN" | "CPK" | "TED" | "DAT" | "UNKNOWN";
  status: FileStatus;
}

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

const detectType = (file: File): ImportedFile["type"] => {
  const name = file.name.toLowerCase();
  if (name.startsWith("edit00000000")) return "BIN";
  if (name.endsWith(".bin")) return "BIN";
  if (name.endsWith(".cpk")) return "CPK";
  if (name.endsWith(".ted")) return "TED";
  if (name.endsWith(".dat")) return "DAT";
  return "UNKNOWN";
};

const iconByType = {
  BIN: Database, CPK: FileArchive, TED: FileText, DAT: HardDrive, UNKNOWN: FileArchive,
};

export default function Import() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<ImportedFile[]>([]);
  const loadEditBinToStore = useEditBinStore((s) => s.loadEditBin);

  const updateStatus = (index: number, status: FileStatus) => {
    setFiles((prev) => prev.map((f, i) => (i === index ? { ...f, status } : f)));
  };

  const handleEditBin = async (file: File, index: number) => {
    try {
      console.log("[IMPORT] Processing EDIT00000000...");
      
      // Safety timeout for crypto
      const cryptoPromise = initCrypto();
      const timeoutPromise = new Promise((resolve) => setTimeout(() => {
          console.warn("[IMPORT] Crypto timeout - continuing anyway");
          resolve(true);
      }, 2000));
      await Promise.race([cryptoPromise, timeoutPromise]);

      const result = await loadEditBin(file);

      // 🔥 PASS PLAYERS TO STORE
      loadEditBinToStore({
        header: result.header,
        raw: result.raw,
        players: result.players, 
      });

      console.log(`[IMPORT] Success! ${result.players.length} players stored.`);
      updateStatus(index, "loaded");
    } catch (err) {
      console.error("[IMPORT] Failed:", err);
      updateStatus(index, "error");
    }
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const incoming: ImportedFile[] = Array.from(fileList).map((file) => ({
      file,
      name: file.name,
      size: formatSize(file.size),
      type: detectType(file),
      status: "pending",
    }));

    const baseIndex = files.length;
    setFiles((prev) => [...prev, ...incoming]);

    incoming.forEach((item, i) => {
      const index = baseIndex + i;
      if (item.type === "BIN" && item.file.name.toUpperCase().startsWith("EDIT00000000")) {
        handleEditBin(item.file, index);
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Import <span className="text-gradient-primary">Files</span></h1>
        <p className="text-muted-foreground">Supports EDIT00000000, CPK, and TED files.</p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault(); setDragActive(false); addFiles(e.dataTransfer.files);
        }}
        className={cn("card-gaming border-2 border-dashed p-12 text-center cursor-pointer transition-all", dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/40")}
      >
        <Upload className="w-10 h-10 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold mb-2">Drop files here or click to browse</h3>
        <Button variant="gaming">Browse Files</Button>
        <input ref={fileInputRef} type="file" multiple hidden onChange={(e) => addFiles(e.target.files)} />
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">Import Queue</h2>
          {files.map((file, index) => {
            const Icon = iconByType[file.type];
            return (
              <div key={index} className="card-gaming p-4 flex items-center gap-4">
                <Icon className="w-5 h-5" />
                <div className="flex-1">
                  <p className="font-medium">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size}</p>
                </div>
                <span className={cn("text-xs font-mono px-2 py-1 rounded", file.status === "loaded" ? "bg-success/20 text-success" : file.status === "error" ? "bg-destructive/20 text-destructive" : "bg-secondary")}>
                  {file.status.toUpperCase()}
                </span>
                <Button variant="ghost" size="icon" onClick={() => removeFile(index)}><X className="w-4 h-4" /></Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
