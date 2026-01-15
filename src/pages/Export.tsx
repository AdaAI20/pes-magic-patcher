import { useState } from "react";
import {
  Download,
  FileArchive,
  FileText,
  Package,
  Settings2,
  CheckCircle,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface ExportOption {
  id: string;
  label: string;
  description: string;
  checked: boolean;
}

export default function Export() {
  const [exportFormat, setExportFormat] = useState("cpk");
  const [exportOptions, setExportOptions] = useState<ExportOption[]>([
    { id: "players", label: "Player Data", description: "All player stats and attributes", checked: true },
    { id: "teams", label: "Team Data", description: "Team rosters and settings", checked: true },
    { id: "leagues", label: "League Structure", description: "League configurations", checked: true },
    { id: "faces", label: "Player Faces", description: "Face textures and models", checked: false },
    { id: "kits", label: "Team Kits", description: "Kit textures", checked: false },
    { id: "balls", label: "Ball Data", description: "Ball textures", checked: false },
  ]);

  const toggleOption = (id: string) => {
    setExportOptions((prev) =>
      prev.map((opt) =>
        opt.id === id ? { ...opt, checked: !opt.checked } : opt
      )
    );
  };

  const selectedCount = exportOptions.filter((opt) => opt.checked).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold text-foreground">
          Export <span className="text-gradient-primary">Data</span>
        </h1>
        <p className="text-muted-foreground">
          Create patches and export game data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Export Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Format Selection */}
          <div className="card-gaming p-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Export Format
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: "cpk", name: "CPK Patch", icon: FileArchive, desc: "Standard game patch" },
                { id: "sider", name: "Sider Patch", icon: Package, desc: "Sider mod format" },
                { id: "bin", name: "Option File", icon: FileText, desc: "Save data format" },
              ].map((format) => {
                const Icon = format.icon;
                return (
                  <button
                    key={format.id}
                    onClick={() => setExportFormat(format.id)}
                    className={cn(
                      "p-4 rounded-lg border-2 text-left transition-all duration-200",
                      exportFormat === format.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-8 h-8 mb-3",
                        exportFormat === format.id
                          ? "text-primary"
                          : "text-muted-foreground"
                      )}
                    />
                    <p className="font-medium text-foreground">{format.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Data Selection */}
          <div className="card-gaming p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-foreground">
                Data to Export
              </h2>
              <span className="text-sm text-muted-foreground">
                {selectedCount} of {exportOptions.length} selected
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {exportOptions.map((option) => (
                <label
                  key={option.id}
                  className={cn(
                    "flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200",
                    option.checked
                      ? "border-primary/50 bg-primary/5"
                      : "border-border hover:border-primary/30"
                  )}
                >
                  <Checkbox
                    checked={option.checked}
                    onCheckedChange={() => toggleOption(option.id)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-medium text-foreground">{option.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {option.description}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Advanced Options */}
          <div className="card-gaming p-6">
            <div className="flex items-center gap-2 mb-4">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              <h2 className="font-display font-semibold text-lg text-foreground">
                Advanced Options
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Compression Level
                </Label>
                <Select defaultValue="normal">
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Compression</SelectItem>
                    <SelectItem value="fast">Fast (Low)</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="max">Maximum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Game Version
                </Label>
                <Select defaultValue="2021">
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2021">PES 2021</SelectItem>
                    <SelectItem value="2020">PES 2020</SelectItem>
                    <SelectItem value="2019">PES 2019</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Export Summary */}
        <div className="space-y-4">
          <div className="card-gaming p-6 sticky top-6">
            <h2 className="font-display font-semibold text-lg text-foreground mb-4">
              Export Summary
            </h2>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Format</span>
                <span className="text-foreground font-medium uppercase">
                  {exportFormat}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Data Selected</span>
                <span className="text-foreground font-medium">
                  {selectedCount} items
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Est. Size</span>
                <span className="text-foreground font-medium">~245 MB</span>
              </div>
            </div>

            <div className="border-t border-border pt-4 mb-6">
              <h3 className="text-sm font-medium text-foreground mb-3">
                Included Data
              </h3>
              <div className="space-y-2">
                {exportOptions
                  .filter((opt) => opt.checked)
                  .map((opt) => (
                    <div
                      key={opt.id}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckCircle className="w-4 h-4 text-success" />
                      <span>{opt.label}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div className="space-y-3">
              <Button variant="gaming" size="lg" className="w-full gap-2">
                <Download className="w-5 h-5" />
                Export Now
              </Button>
              <Button variant="outline" className="w-full gap-2">
                <FolderOpen className="w-4 h-4" />
                Choose Location
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
