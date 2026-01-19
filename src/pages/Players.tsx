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
// 🔥 FIX: Correct import path (singular 'store')
import { useFileStore } from "@/store/fileStore";

/* -------------------------------- CONSTANTS -------------------------------- */

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

/* ------------------------------- COMPONENT -------------------------------- */

export default function Players() {
  // Connect to the file store
  const editBin = useFileStore((state) => state.editBin);
  const players = editBin?.players || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  /* ----------------------------- FILTERS ----------------------------- */

  const filteredPlayers = players.filter((player: any) => {
    const matchesSearch =
      player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      player.id.toString().includes(searchQuery);

    const matchesPosition =
      selectedPosition === "All" ||
      player.position === selectedPosition;

    return matchesSearch && matchesPosition;
  });

  /* ----------------------------- HELPERS ----------------------------- */

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

  const allVisibleSelected =
    filteredPlayers.length > 0 &&
    filteredPlayers.every((p: any) => selectedPlayers.includes(p.id));

  /* ------------------------------- UI -------------------------------- */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>

          {!editBin ? (
            <p className="text-destructive">
              No EDIT00000000 loaded — import it first
            </p>
          ) : (
            <p className="text-muted-foreground">
              {players.length.toLocaleString()} players loaded from EDIT
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" disabled={!editBin}>
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2" disabled={!editBin}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="gaming" className="gap-2" disabled={!editBin}>
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
              placeholder="Search by ID or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              disabled={!editBin}
            />
          </div>

          <Select
            value={selectedPosition}
            onValueChange={setSelectedPosition}
            disabled={!editBin}
          >
            <SelectTrigger className="w-full sm:w-40">
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

          <Button variant="outline" className="gap-2" disabled>
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="card-gaming overflow-hidden">
        {!editBin ? (
          <div className="p-12 text-center text-muted-foreground">
            Import <b>EDIT00000000</b> to view players
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={() =>
                        setSelectedPlayers(
                          allVisibleSelected
                            ? []
                            : filteredPlayers.map((p: any) => p.id)
                        )
                      }
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">
                    Name
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                    Pos
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                    OVR
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                    Age (Dummy)
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">
                    Foot (Dummy)
                  </th>
                  <th className="w-12 px-4 py-3"></th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border">
                {filteredPlayers.map((player: any) => (
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
                        checked={selectedPlayers.includes(player.id)}
                        onChange={() => togglePlayerSelection(player.id)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-sm">
                      {player.id}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {player.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {player.position}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-bold",
                          getOverallColor(player.overall)
                        )}
                      >
                        {player.overall}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      --
                    </td>
                    <td className="px-4 py-3 text-center">
                      --
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
        )}
      </div>
    </div>
  );
}
