import { useState } from "react";
import {
  Search,
  Upload,
  Download,
  Grid3X3,
  List,
  Plus,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface Face {
  id: number;
  playerId: number;
  playerName: string;
  team: string;
  hasCustom: boolean;
}

const mockFaces: Face[] = [
  { id: 1, playerId: 1001, playerName: "L. Messi", team: "Paris Saint-Germain", hasCustom: true },
  { id: 2, playerId: 1002, playerName: "C. Ronaldo", team: "Manchester United", hasCustom: true },
  { id: 3, playerId: 1003, playerName: "K. Mbappé", team: "Paris Saint-Germain", hasCustom: true },
  { id: 4, playerId: 1004, playerName: "R. Lewandowski", team: "FC Bayern München", hasCustom: false },
  { id: 5, playerId: 1005, playerName: "K. De Bruyne", team: "Manchester City", hasCustom: true },
  { id: 6, playerId: 1006, playerName: "N. Kanté", team: "Chelsea", hasCustom: false },
  { id: 7, playerId: 1007, playerName: "E. Haaland", team: "Borussia Dortmund", hasCustom: true },
  { id: 8, playerId: 1008, playerName: "J. Oblak", team: "Atlético Madrid", hasCustom: false },
];

export default function Faces() {
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredFaces = mockFaces.filter(
    (face) =>
      face.playerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      face.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Face <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            Manage player face textures and models
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import Faces
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="gaming" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Face
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Face Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredFaces.map((face) => (
          <div
            key={face.id}
            className="card-gaming p-4 group hover:border-primary/50 transition-all duration-300 cursor-pointer"
          >
            <div className="aspect-square rounded-lg bg-secondary mb-3 flex items-center justify-center relative overflow-hidden">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20" />
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
              {face.playerName}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {face.team}
            </p>
            <div className="mt-2">
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  face.hasCustom
                    ? "bg-success/15 text-success"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {face.hasCustom ? "Custom" : "Default"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
