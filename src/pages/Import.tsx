import { useRef, useState } from "react";
import {
  Upload,
  FileArchive,
  FileText,
  Database,
  FolderOpen,
  X,
  HardDrive,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { initCrypto } from "@/crypto/pesCrypto";
import { loadEditBin } from "@/parsers/editBinParser";
import { useEditBinStore } from "@/store/editBinStore";

/* -------------------------------- TYPES -------------------------------- */

type FileStatus = "pending" | "loaded" | "error";

interface ImportedFile {
  id: string;
  file: File;
  name: string;
  size: string;
  type: "BIN" | "CPK" | "TED" | "DAT" | "UNKNOWN";
  status: FileStatus;
}

/* ----------------------------- HELPERS ---------------------------------- */

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

const detectType = (file: File): ImportedFile["type"] => {
  const name = file.name.toLowerCase();
  if (name === "edit00000000") return "BIN";
  if (name.endsWith(".bin")) return "BIN";
  if (name.endsWith(".cpk")) return "CPK";
  if (name.endsWith(".ted")) return "TED";
  if (name.endsWith(".dat")) return "DAT";
  return "UNKNOWN";
};

const iconByType = {
  BIN: Database,
  CPK: FileArchive,
  TED: FileText,
  DAT: HardDrive,
  UNKNOWN: FileArchive,
};

/* ------------------------------- COMPONENT -------------------------------- */

export default function Import() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [files, setFiles] = useState<ImportedFile[]>([]);

  const loadEditBinToStore = useEditBinStore((s) => s.loadEditBin);

  /* ----------------------------- CORE LOGIC ----------------------------- */

  const handleEditBin = async (item: ImportedFile) => {
    console.log("[IMPORT] Handling EDIT00000000");

    try {
      await initCrypto();
      const result = await loadEditBin(item.file);

      loadEditBinToStore({
        header: result.header,
        raw: result.raw,
      });

      console.log("[IMPORT] EDIT00000000 stored in Zustand");

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "loaded" } : f
        )
      );
    } catch (err) {
      console.error("[IMPORT] FAILED:", err);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: "error" } : f
        )
      );
    }
  };

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return;

    const incoming: ImportedFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: formatSize(file.size),
      type: detectType(file),
      status: "pending",
    }));

    setFiles((prev) => [...prev, ...incoming]);

    incoming.forEach((item) => {
      if (item.type === "BIN" && item.name === "EDIT00000000") {
        handleEditBin(item);
      }
    });
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  /* ------------------------------- UI -------------------------------- */

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">
          Import <span className="text-gradient-primary">Files</span>
        </h1>
        <p className="text-muted-foreground">
          Supports EDIT00000000, CPK archives, and team data
        </p>
      </div>

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragActive(false);
          addFiles(e.dataTransfer.files);
        }}
        className={cn(
          "card-gaming border-2 border-dashed p-12 text-center cursor-pointer transition-all",
          dragActive
            ? "border-primary bg-primary/10"
            : "border-border hover:border-primary/40"
        )}
      >
        <Upload className="w-10 h-10 mx-auto mb-4 text-primary" />
        <h3 className="text-xl font-semibold mb-2">
          Drop files here or click to browse
        </h3>

        <Button variant="gaming" size="lg">
          <FolderOpen className="w-5 h-5 mr-2" />
          Browse Files
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">Import Queue</h2>

          {files.map((file) => {
            const Icon = iconByType[file.type];

            return (
              <div
                key={file.id}
                className="card-gaming p-4 flex items-center gap-4"
              >
                <div className="p-2 rounded-lg bg-secondary">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.size}</p>
                </div>

                <span
                  className={cn(
                    "text-xs font-mono px-2 py-1 rounded",
                    file.status === "loaded" &&
                      "bg-success/20 text-success",
                    file.status === "error" &&
                      "bg-destructive/20 text-destructive",
                    file.status === "pending" && "bg-secondary"
                  )}
                >
                  {file.status.toUpperCase()}
                </span>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(file.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
