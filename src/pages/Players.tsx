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

import { useEditBinStore } from "@/store/editBinStore";

/* -------------------------------- */

const positions = [
  "All",
  "GK",
  "CB",
  "LB",
  "RB",
  "DMF",
  "CMF",
  "AMF",
  "LWF",
  "RWF",
  "SS",
  "CF",
];

export default function Players() {
  const { loaded, players } = useEditBinStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  if (!loaded) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-display font-bold">
          Player <span className="text-gradient-primary">Editor</span>
        </h1>

        <p className="text-destructive">
          No EDIT00000000 loaded — import it first
        </p>

        <div className="card-gaming p-12 text-center text-muted-foreground">
          Import <strong>EDIT00000000</strong> to view players
        </div>
      </div>
    );
  }

  const filteredPlayers = players.filter((player) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.id.toString().includes(searchQuery);

    const matchesPosition =
      selectedPosition === "All" || player.position === selectedPosition;

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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            {players.length.toLocaleString()} players loaded
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="gaming">
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gaming p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by ID or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={selectedPosition} onValueChange={setSelectedPosition}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {positions.map((pos) => (
              <SelectItem key={pos} value={pos}>
                {pos}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline">
          <Filter className="w-4 h-4 mr-2" />
          More Filters
        </Button>
      </div>

      {/* Table */}
      <div className="card-gaming overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-4 py-3 text-left">ID</th>
              <th className="px-4 py-3 text-left">Name</th>
              <th className="px-4 py-3 text-center">Pos</th>
              <th className="px-4 py-3 text-center">OVR</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {filteredPlayers.map((player) => (
              <tr key={player.id} className="table-row-gaming">
                <td className="px-4 py-3 font-mono">{player.id}</td>
                <td className="px-4 py-3">{player.name}</td>
                <td className="px-4 py-3 text-center">
                  {player.position}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      "px-2 py-1 rounded text-xs font-bold",
                      getOverallColor(player.overall)
                    )}
                  >
                    {player.overall}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
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
    </div>
  );
}
