import { useRef, useState } from "react";
import {
  Upload,
  FileArchive,
  FileText,
  Database,
  FolderOpen,
  X,
  HardDrive,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFileStore, FileType } from "@/store/fileStore";

/* -------------------------------- TYPES -------------------------------- */

interface ImportedFileUI {
  id: string;
  file: File;
  name: string;
  size: string;
  type: FileType;
  status: "pending" | "importing" | "success" | "error";
  errorMessage?: string;
}

/* ----------------------------- HELPERS ---------------------------------- */

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(1)} KB`;

// 🔥 FIX: Robust type detection handles no-extension files like EDIT00000000
const detectType = (file: File): FileType => {
  const name = file.name.toUpperCase();

  // Exact match for the main save file
  if (name === "EDIT00000000" || name === "EDIT00000000.BIN") return "BIN";
  
  // Extension checks
  if (name.endsWith(".BIN")) return "BIN";
  if (name.endsWith(".CPK")) return "CPK";
  if (name.endsWith(".TED")) return "TED";
  if (name.endsWith(".DAT")) return "DAT";

  return "UNKNOWN";
};

const iconByType: Record<string, React.ElementType> = {
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
  const [uiFiles, setUiFiles] = useState<ImportedFileUI[]>([]);

  // Connect to the global store
  const importFileToStore = useFileStore((state) => state.importFile);

  /* ----------------------------- ACTIONS -------------------------------- */

  const processFile = async (uiFile: ImportedFileUI) => {
    // Update UI to loading
    setUiFiles((prev) =>
      prev.map((f) => (f.id === uiFile.id ? { ...f, status: "importing" } : f))
    );

    try {
      if (uiFile.type === "UNKNOWN") {
        throw new Error("Unsupported file format");
      }

      console.log(`[IMPORT] Processing ${uiFile.name} as ${uiFile.type}`);
      
      // Call the store action
      await importFileToStore(uiFile.file, uiFile.type);

      // Update UI to success
      setUiFiles((prev) =>
        prev.map((f) => (f.id === uiFile.id ? { ...f, status: "success" } : f))
      );
    } catch (error: any) {
      console.error("[IMPORT] Failed:", error);
      setUiFiles((prev) =>
        prev.map((f) =>
          f.id === uiFile.id
            ? { ...f, status: "error", errorMessage: error.message }
            : f
        )
      );
    }
  };

  const handleFilesAdded = (fileList: FileList | null) => {
    if (!fileList) return;

    const newFiles: ImportedFileUI[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: formatSize(file.size),
      type: detectType(file),
      status: "pending",
    }));

    setUiFiles((prev) => [...prev, ...newFiles]);

    // Automatically start processing valid files
    newFiles.forEach((file) => {
      processFile(file);
    });
  };

  const removeFile = (id: string) => {
    setUiFiles((prev) => prev.filter((f) => f.id !== id));
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
          handleFilesAdded(e.dataTransfer.files);
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
          className="hidden"
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
      </div>

      {/* Import Queue */}
      {uiFiles.length > 0 && (
        <div className="space-y-4">
          <h2 className="section-title">Import Queue</h2>

          {uiFiles.map((file) => {
            const Icon = iconByType[file.type] || FileArchive;

            return (
              <div
                key={file.id}
                className={cn(
                  "card-gaming p-4 flex items-center gap-4 transition-colors",
                  file.status === "error" ? "border-destructive/50" : ""
                )}
              >
                <div className="p-2 rounded-lg bg-secondary">
                  <Icon className="w-5 h-5" />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{file.name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{file.size}</span>
                    {file.errorMessage && (
                      <span className="text-destructive">
                        • {file.errorMessage}
                      </span>
                    )}
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="flex items-center gap-3">
                  {file.status === "importing" && (
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  )}
                  {file.status === "success" && (
                    <CheckCircle className="w-5 h-5 text-success" />
                  )}
                  {file.status === "error" && (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  )}
                  
                  <span
                    className={cn(
                      "text-xs font-mono px-2 py-1 rounded bg-secondary",
                      file.status === "success" && "text-success bg-success/10",
                      file.status === "error" && "text-destructive bg-destructive/10"
                    )}
                  >
                    {file.type}
                  </span>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(file.id);
                  }}
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
