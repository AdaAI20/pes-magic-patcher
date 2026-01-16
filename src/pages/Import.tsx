import { useState } from "react";
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

interface FileType {
  extension: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
}

const supportedFiles: FileType[] = [
  { extension: ".cpk", name: "CPK Archive", description: "Criware packed files (game data)", icon: FileArchive, color: "text-primary" },
  { extension: ".bin", name: "Option File", description: "PES option file / save data", icon: Database, color: "text-accent" },
  { extension: ".ted", name: "Team Data", description: "Team edit data file", icon: FileText, color: "text-success" },
  { extension: ".dat", name: "Data File", description: "Generic game data", icon: HardDrive, color: "text-warning" },
];

interface ImportedFile {
  name: string;
  size: string;
  type: string;
  status: "pending" | "importing" | "success" | "error";
  progress?: number;
}

export default function Import() {
  const [dragActive, setDragActive] = useState(false);
  const [importedFiles, setImportedFiles] = useState<ImportedFile[]>([
    { name: "dt36_all.cpk", size: "2.1 GB", type: "CPK", status: "success" },
    { name: "EDIT00000000.bin", size: "45 MB", type: "BIN", status: "importing", progress: 65 },
  ]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    // future: handle file drop
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
          Load game files, option files, and patch data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Drop Zone */}
        <div className="lg:col-span-2 space-y-6">
          <div
            className={cn(
              "card-gaming border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer",
              dragActive
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div
              className={cn(
                "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-colors",
                dragActive ? "bg-primary/20" : "bg-secondary"
              )}
            >
              <Upload
                className={cn(
                  "w-8 h-8 transition-colors",
                  dragActive ? "text-primary" : "text-muted-foreground"
                )}
              />
            </div>

            <h3 className="font-display font-semibold text-xl text-foreground mb-2">
              Drop files here to import
            </h3>
            <p className="text-muted-foreground mb-6">
              or click to browse your files
            </p>

            <Button variant="gaming" size="lg">
              <FolderOpen className="w-5 h-5 mr-2" />
              Browse Files
            </Button>
          </div>

          {/* Import Queue */}
          {importedFiles.length > 0 && (
            <div className="space-y-4">
              <h2 className="section-title">Import Queue</h2>

              <div className="space-y-3">
                {importedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="card-gaming p-4 flex items-center gap-4"
                  >
                    <div
                      className={cn(
                        "p-2.5 rounded-lg shrink-0",
                        file.status === "success" && "bg-success/15 text-success",
                        file.status === "error" && "bg-destructive/15 text-destructive",
                        file.status === "importing" && "bg-primary/15 text-primary",
                        file.status === "pending" && "bg-secondary text-muted-foreground"
                      )}
                    >
                      {file.status === "success" ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : file.status === "error" ? (
                        <AlertCircle className="w-5 h-5" />
                      ) : (
                        <FileArchive className="w-5 h-5" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {file.size}
                        </span>
                      </div>

                      {file.status === "importing" && file.progress !== undefined ? (
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      ) : (
                        <p
                          className={cn(
                            "text-xs",
                            file.status === "success" && "text-success",
                            file.status === "error" && "text-destructive",
                            file.status === "pending" && "text-muted-foreground"
                          )}
                        >
                          {file.status === "success" && "Import complete"}
                          {file.status === "error" && "Import failed"}
                          {file.status === "pending" && "Waiting..."}
                        </p>
                      )}
                    </div>

                    <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-muted-foreground uppercase">
                      {file.type}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={file.status === "importing"}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFile(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Supported Formats */}
        <div className="space-y-4">
          <h2 className="section-title">Supported Formats</h2>

          <div className="space-y-3">
            {supportedFiles.map((file) => {
              const Icon = file.icon;
              return (
                <div
                  key={file.extension}
                  className="card-gaming p-4 flex items-start gap-3 hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
                >
                  <div className={cn("p-2 rounded-lg bg-secondary", file.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-foreground">
                        {file.name}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        {file.extension}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {file.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="card-gaming p-4 mt-6">
            <h3 className="font-display font-semibold text-foreground mb-3">
              Quick Import
            </h3>

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start gap-2">
                <HardDrive className="w-4 h-4" />
                Load Game Installation
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Database className="w-4 h-4" />
                Import Option File
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileArchive className="w-4 h-4" />
                Extract CPK Archive
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
