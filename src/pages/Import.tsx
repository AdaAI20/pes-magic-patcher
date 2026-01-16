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

/* 🔑 CORE IMPORTS */
import { initCrypto } from "@/crypto/pesCrypto";
import { loadEditBin } from "@/parsers/editBinParser";
import { useEditBinStore } from "@/store/editBinStore";

/* -------------------------------- TYPES -------------------------------- */

type FileStatus = "pending" | "loaded" | "error";

interface ImportedFile {
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

  if (name === "edit00000000" || name === "edit00000000.bin") return "BIN";
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

  /* 🌍 GLOBAL STORE ACTION */
  const loadToStore = useEditBinStore((s) => s.loadEditBin);

  /* ----------------------------- CORE LOGIC ----------------------------- */

  const handleEditBin = async (file: File, index: number) => {
    try {
      await initCrypto();

      const result = await loadEditBin(file);

      loadToStore({
        header: result.header,
        raw: result.raw,
      });

      console.log("EDIT00000000 loaded:", result.header);
      updateStatus(index, "loaded");
    } catch (err) {
      console.error("EDIT00000000 failed:", err);
      updateStatus(index, "error");
    }
  };

  const updateStatus = (index: number, status: FileStatus) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status } : f))
    );
  };

  const addFiles = async (fileList: FileList | null) => {
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

      if (
        item.type === "BIN" &&
        (item.file.name === "EDIT00000000" ||
          item.file.name === "EDIT00000000.bin")
      ) {
        handleEditBin(item.file, index);
      }
    });
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /* ------------------------------- UI -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">
          Import <span className="text-gradient-primary">Files</span>
        </h1>
        <p className="text-muted-foreground">
          Supports EDIT00000000, CPK archives, and team data
        </p>
      </div>

      {/* Drop zone */}
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
        <p className="text-muted-foreground mb-4">
          EDIT00000000 • .bin • .cpk • .ted • .dat
        </p>

        <Button variant="gaming" size="lg">
          <FolderOpen className="w-5 h-5 mr-2" />
          Browse Files
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".bin,.cpk,.ted,.dat,EDIT00000000"
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* Import Queue */}
      {files.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">Import Queue</h2>

          {files.map((file, index) => {
            const Icon = iconByType[file.type];

            return (
              <div
                key={index}
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
                  onClick={() => removeFile(index)}
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
