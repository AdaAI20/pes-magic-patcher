import { useState } from "react";
import {
  Package,
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  FileArchive,
  FileText,
  Image,
  Music,
  Play,
  Save,
  FolderOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PatchItem {
  id: string;
  name: string;
  type: "data" | "texture" | "audio" | "script";
  path: string;
  size: string;
}

const mockPatchItems: PatchItem[] = [
  { id: "1", name: "Player Database", type: "data", path: "common/etc/pes_db.bin", size: "12 MB" },
  { id: "2", name: "Team Kits Pack", type: "texture", path: "Asset/model/character/uniform", size: "156 MB" },
  { id: "3", name: "Stadium Sounds", type: "audio", path: "Asset/sound/stadium", size: "45 MB" },
];

export default function PatchBuilder() {
  const [patchName, setPatchName] = useState("My Custom Patch");
  const [patchType, setPatchType] = useState("cpk");
  const [patchItems, setPatchItems] = useState<PatchItem[]>(mockPatchItems);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const getTypeIcon = (type: PatchItem["type"]) => {
    switch (type) {
      case "data":
        return FileText;
      case "texture":
        return Image;
      case "audio":
        return Music;
      case "script":
        return FileArchive;
    }
  };

  const getTypeColor = (type: PatchItem["type"]) => {
    switch (type) {
      case "data":
        return "text-primary bg-primary/15";
      case "texture":
        return "text-accent bg-accent/15";
      case "audio":
        return "text-success bg-success/15";
      case "script":
        return "text-warning bg-warning/15";
    }
  };

  const moveItem = (id: string, direction: "up" | "down") => {
    const index = patchItems.findIndex((item) => item.id === id);
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === patchItems.length - 1)
    ) {
      return;
    }

    const newItems = [...patchItems];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
    setPatchItems(newItems);
  };

  const removeItem = (id: string) => {
    setPatchItems((prev) => prev.filter((item) => item.id !== id));
    if (selectedItem === id) {
      setSelectedItem(null);
    }
  };

  const totalSize = patchItems.reduce((acc, item) => {
    const size = parseInt(item.size);
    return acc + (isNaN(size) ? 0 : size);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Patch <span className="text-gradient-primary">Builder</span>
          </h1>
          <p className="text-muted-foreground">
            Create custom patches for PES 2021
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" className="gap-2">
            <FolderOpen className="w-4 h-4" />
            Load Project
          </Button>
          <Button variant="outline" size="default" className="gap-2">
            <Save className="w-4 h-4" />
            Save Project
          </Button>
          <Button variant="gaming" size="default" className="gap-2">
            <Play className="w-4 h-4" />
            Build Patch
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patch Contents */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card-gaming p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-lg text-foreground">
                Patch Contents
              </h2>
              <Button variant="gaming-outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            </div>

            {patchItems.length > 0 ? (
              <div className="space-y-2">
                {patchItems.map((item, index) => {
                  const Icon = getTypeIcon(item.type);
                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item.id)}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-lg border cursor-pointer transition-all duration-200",
                        selectedItem === item.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItem(item.id, "up");
                          }}
                          disabled={index === 0}
                        >
                          <MoveUp className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            moveItem(item.id, "down");
                          }}
                          disabled={index === patchItems.length - 1}
                        >
                          <MoveDown className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className={cn("p-2 rounded-lg", getTypeColor(item.type))}>
                        <Icon className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {item.path}
                        </p>
                      </div>

                      <span className="text-sm text-muted-foreground">
                        {item.size}
                      </span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeItem(item.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  No items added
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start by adding files to your patch
                </p>
                <Button variant="gaming">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Item
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Patch Settings */}
        <div className="space-y-4">
          <div className="card-gaming p-6 space-y-5">
            <h2 className="font-display font-semibold text-lg text-foreground">
              Patch Settings
            </h2>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Patch Name
              </Label>
              <Input
                value={patchName}
                onChange={(e) => setPatchName(e.target.value)}
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Patch Type
              </Label>
              <Select value={patchType} onValueChange={setPatchType}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cpk">CPK Patch</SelectItem>
                  <SelectItem value="sider">Sider Patch</SelectItem>
                  <SelectItem value="dpfilelist">DpFileList</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Description
              </Label>
              <Textarea
                placeholder="Enter patch description..."
                className="bg-background border-border resize-none"
                rows={3}
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Author
              </Label>
              <Input
                placeholder="Your name"
                className="bg-background border-border"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground mb-2 block">
                Version
              </Label>
              <Input
                defaultValue="1.0.0"
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* Build Summary */}
          <div className="card-gaming p-6">
            <h3 className="font-display font-semibold text-foreground mb-4">
              Build Summary
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items</span>
                <span className="text-foreground font-medium">
                  {patchItems.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Size</span>
                <span className="text-foreground font-medium">
                  ~{totalSize} MB
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Output</span>
                <span className="text-foreground font-medium uppercase">
                  {patchType}
                </span>
              </div>
            </div>

            <Button variant="gaming" size="lg" className="w-full mt-6 gap-2">
              <Play className="w-5 h-5" />
              Build Patch
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
