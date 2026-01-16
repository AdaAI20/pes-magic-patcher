import { useRef, useState } from "react";
import {
  Upload,
  FileArchive,
  FileText,
  Database,
  FolderOpen,
  CheckCircle,
  AlertCircle,
  X,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ImportedFile {
  name: string;
  size: string;
  type: string;
  status: "pending" | "importing" | "success" | "error";
  progress?: number;
}

const EXTENSION_MAP: Record<string, string> = {
  cpk: "CPK",
  bin: "BIN",
  ted: "TED",
  dat: "DAT",
};

export default function Import() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([]);

  const formatSize = (bytes: number) =>
    bytes > 1024 * 1024
      ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
      : `${(bytes / 1024).toFixed(1)} KB`;

  const detectType = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    return EXTENSION_MAP[ext] ?? "UNKNOWN";
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const newFiles: ImportedFile[] = Array.from(files).map((file) => ({
      name: file.name,
      size: formatSize(file.size),
      type: detectType(file.name),
      status: "pending",
    }));

    setImportedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    addFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setImportedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Import <span className="text-gradient-primary">Data</span>
        </h1>
        <p className="text-muted-foreground">
          Import CPK archives, option files, and edit data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drop Zone */}
        <div className="lg:col-span-2 space-y-6">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "card-gaming border-2 border-dashed p-12 text-center cursor-pointer transition-all",
              dragActive
                ? "border-primary bg-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            <Upload className="w-10 h-10 mx-auto mb-4 text-primary" />
            <h3 className="text-xl font-semibold">Drop files here</h3>
            <p className="text-muted-foreground mb-4">
              Supports .cpk, .bin, .ted, .dat
            </p>

            <Button variant="gaming" size="lg">
              <FolderOpen className="w-5 h-5 mr-2" />
              Browse Files
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".cpk,.bin,.ted,.dat"
              hidden
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* Import Queue */}
          {importedFiles.length > 0 && (
            <div className="space-y-4">
              <h2 className="section-title">Import Queue</h2>

              {importedFiles.map((file, index) => (
                <div
                  key={index}
                  className="card-gaming p-4 flex items-center gap-4"
                >
                  <div className="p-2 rounded-lg bg-secondary">
                    {file.type === "CPK" && <FileArchive />}
                    {file.type === "BIN" && <Database />}
                    {file.type === "TED" && <FileText />}
                    {file.type === "DAT" && <HardDrive />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{file.size}</p>
                  </div>

                  <span className="text-xs font-mono bg-secondary px-2 py-1 rounded">
                    {file.type}
                  </span>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeFile(index)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Import */}
        <div className="space-y-4">
          <h2 className="section-title">Quick Import</h2>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Database className="w-4 h-4" />
            Import EDIT00000000.bin
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <FileArchive className="w-4 h-4" />
            Import CPK Archive
          </Button>
        </div>
      </div>
    </div>
  );
}
