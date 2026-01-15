import { useState } from "react";
import {
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Player {
  id: number;
  name: string;
  team: string;
  nationality: string;
  position: string;
  overall: number;
  age: number;
  foot: string;
}

const mockPlayers: Player[] = [
  { id: 1, name: "L. Messi", team: "Paris Saint-Germain", nationality: "Argentina", position: "RWF", overall: 93, age: 34, foot: "Left" },
  { id: 2, name: "C. Ronaldo", team: "Manchester United", nationality: "Portugal", position: "CF", overall: 91, age: 36, foot: "Right" },
  { id: 3, name: "K. Mbappé", team: "Paris Saint-Germain", nationality: "France", position: "LWF", overall: 91, age: 22, foot: "Right" },
  { id: 4, name: "R. Lewandowski", team: "FC Bayern München", nationality: "Poland", position: "CF", overall: 91, age: 32, foot: "Right" },
  { id: 5, name: "K. De Bruyne", team: "Manchester City", nationality: "Belgium", position: "CMF", overall: 91, age: 30, foot: "Right" },
  { id: 6, name: "N. Kanté", team: "Chelsea", nationality: "France", position: "DMF", overall: 90, age: 30, foot: "Right" },
  { id: 7, name: "E. Haaland", team: "Borussia Dortmund", nationality: "Norway", position: "CF", overall: 88, age: 21, foot: "Left" },
  { id: 8, name: "J. Oblak", team: "Atlético Madrid", nationality: "Slovenia", position: "GK", overall: 90, age: 28, foot: "Right" },
  { id: 9, name: "V. van Dijk", team: "Liverpool", nationality: "Netherlands", position: "CB", overall: 89, age: 30, foot: "Right" },
  { id: 10, name: "M. Salah", team: "Liverpool", nationality: "Egypt", position: "RWF", overall: 89, age: 29, foot: "Left" },
];

const positions = ["All", "GK", "CB", "LB", "RB", "DMF", "CMF", "AMF", "LWF", "RWF", "SS", "CF"];

export default function Players() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  const filteredPlayers = mockPlayers.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = selectedPosition === "All" || player.position === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  const togglePlayerSelection = (id: number) => {
    setSelectedPlayers((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const getOverallColor = (overall: number) => {
    if (overall >= 90) return "text-accent bg-accent/15";
    if (overall >= 85) return "text-success bg-success/15";
    if (overall >= 80) return "text-primary bg-primary/15";
    return "text-muted-foreground bg-secondary";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            {mockPlayers.length.toLocaleString()} players loaded
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" className="gap-2">
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" size="default" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="gaming" size="default" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players or teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-border">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              {positions.map((pos) => (
                <SelectItem key={pos} value={pos}>
                  {pos}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="default" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>

        {selectedPlayers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {selectedPlayers.length} selected
            </span>
            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
            <Button variant="ghost" size="sm">
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            <Button variant="ghost" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export Selected
            </Button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="card-gaming overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    className="rounded border-border"
                    checked={selectedPlayers.length === filteredPlayers.length}
                    onChange={() =>
                      setSelectedPlayers(
                        selectedPlayers.length === filteredPlayers.length
                          ? []
                          : filteredPlayers.map((p) => p.id)
                      )
                    }
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Team
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nationality
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Pos
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  OVR
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Age
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Foot
                </th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPlayers.map((player) => (
                <tr
                  key={player.id}
                  className={cn(
                    "table-row-gaming",
                    selectedPlayers.includes(player.id) && "bg-primary/5"
                  )}
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      className="rounded border-border"
                      checked={selectedPlayers.includes(player.id)}
                      onChange={() => togglePlayerSelection(player.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">
                    {player.id}
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground hover:text-primary cursor-pointer transition-colors">
                      {player.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {player.team}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {player.nationality}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-muted-foreground">
                      {player.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold",
                        getOverallColor(player.overall)
                      )}
                    >
                      {player.overall}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {player.age}
                  </td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">
                    {player.foot}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-border flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing 1-{filteredPlayers.length} of {mockPlayers.length} players
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" className="bg-primary/10 border-primary/30 text-primary">
              1
            </Button>
            <Button variant="outline" size="sm">
              2
            </Button>
            <Button variant="outline" size="sm">
              3
            </Button>
            <Button variant="outline" size="sm">
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
