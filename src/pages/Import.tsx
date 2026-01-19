import { useRef, useCallback, useEffect } from "react";
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
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFileStore, formatFileSize } from "@/stores/fileStore";
import { useState } from "react";

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
  { extension: "EDIT*", name: "EDIT File", description: "EDIT00000000 save file", icon: HardDrive, color: "text-warning" },
];

export default function Import() {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { 
    importQueue, 
    importFile, 
    removeFromQueue, 
    initializeCrypto,
    cryptoReady,
    editBinData,
  } = useFileStore();

  // Initialize crypto on mount
  useEffect(() => {
    initializeCrypto().catch(console.error);
  }, [initializeCrypto]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const processFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    for (const file of Array.from(files)) {
      await importFile(file);
    }
  }, [importFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'loading':
        return <Loader2 className="w-5 h-5 animate-spin" />;
      default:
        return <FileArchive className="w-5 h-5" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'success':
        return "bg-success/15 text-success";
      case 'error':
        return "bg-destructive/15 text-destructive";
      case 'loading':
        return "bg-primary/15 text-primary";
      default:
        return "bg-secondary text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".cpk,.bin,.ted,.dat"
        onChange={handleFileInput}
      />
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Import <span className="text-gradient-primary">Data</span>
        </h1>
        <p className="text-muted-foreground">
          Load game files, option files, and patch data
          {!cryptoReady && (
            <span className="ml-2 text-warning">(Initializing...)</span>
          )}
        </p>
      </div>

      {/* Status banner when EDIT is loaded */}
      {editBinData && (
        <div className="card-gaming p-4 bg-success/10 border-success/30">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <div className="flex-1">
              <p className="font-medium text-foreground">
                {editBinData.fileName} loaded successfully
              </p>
              <p className="text-sm text-muted-foreground">
                {editBinData.players.length} players • {editBinData.teams.length} teams • {formatFileSize(editBinData.fileSize)}
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = '/#/players'}
            >
              View Players
            </Button>
          </div>
        </div>
      )}

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
            onClick={handleBrowseClick}
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
            <Button variant="gaming" size="lg" onClick={(e) => { e.stopPropagation(); handleBrowseClick(); }}>
              <FolderOpen className="w-5 h-5 mr-2" />
              Browse Files
            </Button>
          </div>

          {/* Import Queue */}
          {importQueue.length > 0 && (
            <div className="space-y-4">
              <h2 className="section-title">Import Queue</h2>
              <div className="space-y-3">
                {importQueue.map((file) => (
                  <div
                    key={file.id}
                    className="card-gaming p-4 flex items-center gap-4"
                  >
                    <div className={cn("p-2.5 rounded-lg", getStatusClass(file.status))}>
                      {getStatusIcon(file.status)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium text-foreground truncate">
                          {file.name}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatFileSize(file.size)}
                        </span>
                      </div>

                      {file.status === "loading" && file.progress !== undefined ? (
                        <div className="w-full bg-secondary rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          {file.status === "success" && "Import complete"}
                          {file.status === "error" && (file.error || "Import failed")}
                          {file.status === "idle" && "Waiting..."}
                        </p>
                      )}
                    </div>

                    <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-muted-foreground uppercase">
                      {file.type}
                    </span>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromQueue(file.id)}
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
                  className="card-gaming p-4 flex items-start gap-3 hover:border-primary/30 transition-colors cursor-pointer"
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
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleBrowseClick}
              >
                <HardDrive className="w-4 h-4" />
                Load EDIT00000000
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleBrowseClick}
              >
                <Database className="w-4 h-4" />
                Import Option File
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start gap-2"
                onClick={handleBrowseClick}
                disabled
              >
                <FileArchive className="w-4 h-4" />
                Extract CPK Archive (Coming Soon)
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
