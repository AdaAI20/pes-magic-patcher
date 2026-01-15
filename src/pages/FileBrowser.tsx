import { useState } from "react";
import {
  Folder,
  FileText,
  FileArchive,
  Image,
  ChevronRight,
  ChevronDown,
  Search,
  HardDrive,
  ArrowUp,
  Download,
  Eye,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FileNode {
  id: string;
  name: string;
  type: "folder" | "file";
  extension?: string;
  size?: string;
  children?: FileNode[];
}

const mockFileTree: FileNode[] = [
  {
    id: "1",
    name: "dt36_all.cpk",
    type: "folder",
    children: [
      {
        id: "1-1",
        name: "common",
        type: "folder",
        children: [
          {
            id: "1-1-1",
            name: "etc",
            type: "folder",
            children: [
              { id: "1-1-1-1", name: "pes_db.bin", type: "file", extension: "bin", size: "12 MB" },
              { id: "1-1-1-2", name: "team_data.ted", type: "file", extension: "ted", size: "4 MB" },
            ],
          },
          {
            id: "1-1-2",
            name: "script",
            type: "folder",
            children: [
              { id: "1-1-2-1", name: "startup.lua", type: "file", extension: "lua", size: "45 KB" },
            ],
          },
        ],
      },
      {
        id: "1-2",
        name: "Asset",
        type: "folder",
        children: [
          {
            id: "1-2-1",
            name: "model",
            type: "folder",
            children: [
              { id: "1-2-1-1", name: "character", type: "folder", children: [] },
              { id: "1-2-1-2", name: "stadium", type: "folder", children: [] },
            ],
          },
          {
            id: "1-2-2",
            name: "texture",
            type: "folder",
            children: [
              { id: "1-2-2-1", name: "face_001.dds", type: "file", extension: "dds", size: "2 MB" },
              { id: "1-2-2-2", name: "face_002.dds", type: "file", extension: "dds", size: "2 MB" },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "2",
    name: "dt18_all.cpk",
    type: "folder",
    children: [],
  },
];

export default function FileBrowser() {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(["1", "1-1", "1-2"])
  );
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPath, setCurrentPath] = useState<string[]>(["dt36_all.cpk"]);

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getFileIcon = (node: FileNode) => {
    if (node.type === "folder") return Folder;
    switch (node.extension) {
      case "bin":
      case "ted":
      case "dat":
        return FileArchive;
      case "dds":
      case "png":
      case "fsh":
        return Image;
      default:
        return FileText;
    }
  };

  const getFileColor = (node: FileNode) => {
    if (node.type === "folder") return "text-accent";
    switch (node.extension) {
      case "bin":
      case "ted":
        return "text-primary";
      case "dds":
      case "png":
        return "text-success";
      default:
        return "text-muted-foreground";
    }
  };

  const renderTree = (nodes: FileNode[], depth: number = 0) => {
    return nodes.map((node) => {
      const Icon = getFileIcon(node);
      const isExpanded = expandedFolders.has(node.id);
      const isSelected = selectedFile === node.id;

      return (
        <div key={node.id}>
          <button
            onClick={() => {
              if (node.type === "folder") {
                toggleFolder(node.id);
              } else {
                setSelectedFile(node.id);
              }
            }}
            className={cn(
              "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors",
              isSelected
                ? "bg-primary/15 text-primary"
                : "hover:bg-secondary text-foreground"
            )}
            style={{ paddingLeft: `${depth * 16 + 12}px` }}
          >
            {node.type === "folder" && (
              <span className="w-4 h-4 flex items-center justify-center">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </span>
            )}
            {node.type === "file" && <span className="w-4" />}
            <Icon className={cn("w-4 h-4 shrink-0", getFileColor(node))} />
            <span className="flex-1 truncate text-sm">{node.name}</span>
            {node.size && (
              <span className="text-xs text-muted-foreground">{node.size}</span>
            )}
          </button>
          {node.type === "folder" && isExpanded && node.children && (
            <div>{renderTree(node.children, depth + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            File <span className="text-gradient-primary">Browser</span>
          </h1>
          <p className="text-muted-foreground">
            Explore CPK contents and game data
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" className="gap-2">
            <HardDrive className="w-4 h-4" />
            Load CPK
          </Button>
          <Button variant="outline" size="default" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* File Tree */}
        <div className="lg:col-span-1 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border"
            />
          </div>

          <div className="card-gaming p-2 max-h-[600px] overflow-y-auto">
            {renderTree(mockFileTree)}
          </div>
        </div>

        {/* File Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Breadcrumb */}
          <div className="card-gaming p-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ArrowUp className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-1 text-sm">
                <HardDrive className="w-4 h-4 text-muted-foreground" />
                {currentPath.map((path, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <button className="hover:text-primary transition-colors">
                      {path}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* File Preview / Content Area */}
          <div className="card-gaming p-8 min-h-[400px] flex items-center justify-center">
            {selectedFile ? (
              <div className="text-center">
                <FileArchive className="w-16 h-16 text-primary mx-auto mb-4" />
                <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                  pes_db.bin
                </h3>
                <p className="text-muted-foreground mb-6">
                  Binary database file • 12 MB
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button variant="gaming" className="gap-2">
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    Extract
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  No file selected
                </h3>
                <p className="text-muted-foreground">
                  Select a file from the tree to view its contents
                </p>
              </div>
            )}
          </div>

          {/* File Stats */}
          <div className="grid grid-cols-4 gap-4">
            {[
              { label: "Total Files", value: "12,458" },
              { label: "Total Size", value: "2.1 GB" },
              { label: "Folders", value: "342" },
              { label: "Modified", value: "2021-06-15" },
            ].map((stat) => (
              <div key={stat.label} className="stat-card">
                <p className="text-2xl font-bold font-display text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
