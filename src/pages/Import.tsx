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

  /* ✅ CORRECT STORE ACTION */
  const loadIntoStore = useEditBinStore((s) => s.loadEditBin);

  const updateStatus = (index: number, status: FileStatus) => {
    setFiles((prev) =>
      prev.map((f, i) => (i === index ? { ...f, status } : f))
    );
  };

  const handleEditBin = async (file: File, index: number) => {
    try {
      console.log("Loading EDIT00000000:", file.name);

      await initCrypto();

      const result = await loadEditBin(file);

      loadIntoStore({
        header: result.header,
        raw: result.raw,
      });

      console.log("EDIT00000000 loaded into store:", result.header);

      updateStatus(index, "loaded");
    } catch (err) {
      console.error("EDIT00000000 failed:", err);
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

      if (item.type === "BIN" && item.file.name === "EDIT00000000") {
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
        <h1 className="text-3xl font-bold">Import Files</h1>
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
          "border-2 border-dashed p-12 text-center cursor-pointer",
          dragActive ? "border-primary" : "border-border"
        )}
      >
        <Upload className="w-10 h-10 mx-auto mb-4" />
        <Button>
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

      {files.map((file, index) => {
        const Icon = iconByType[file.type];
        return (
          <div key={index} className="flex items-center gap-4">
            <Icon />
            <span>{file.name}</span>
            <span>{file.status.toUpperCase()}</span>
            <Button onClick={() => removeFile(index)} size="icon">
              <X />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
