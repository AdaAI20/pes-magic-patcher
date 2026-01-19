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
  AlertCircle,
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
import { useFileStore } from "@/stores/fileStore";
import { useNavigate } from "react-router-dom";

const positions = ["All", "GK", "CB", "LB", "RB", "DMF", "CMF", "AMF", "LWF", "RWF", "SS", "CF"];

export default function Players() {
  const navigate = useNavigate();
  const { editBinData } = useFileStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("All");
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>([]);

  const players = editBinData?.players || [];

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
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

  // Show empty state if no EDIT file loaded
  if (!editBinData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">Manage player data and attributes</p>
        </div>
        
        <div className="card-gaming p-12 text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-display font-semibold text-xl text-foreground mb-2">
            No EDIT file loaded
          </h3>
          <p className="text-muted-foreground mb-6">
            Import an EDIT00000000 file to view and edit players
          </p>
          <Button variant="gaming" onClick={() => navigate('/import')}>
            <Upload className="w-5 h-5 mr-2" />
            Import EDIT File
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            {players.length.toLocaleString()} players loaded from {editBinData.fileName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="default" className="gap-2" onClick={() => navigate('/import')}>
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
              placeholder="Search players..."
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
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="default" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="card-gaming overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="w-12 px-4 py-3"><input type="checkbox" className="rounded border-border" /></th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Pos</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">OVR</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">Age</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPlayers.slice(0, 50).map((player) => (
                <tr key={player.id} className={cn("table-row-gaming", selectedPlayers.includes(player.id) && "bg-primary/5")}>
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded border-border" checked={selectedPlayers.includes(player.id)} onChange={() => togglePlayerSelection(player.id)} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground font-mono">{player.id}</td>
                  <td className="px-4 py-3"><span className="font-medium text-foreground">{player.name}</span></td>
                  <td className="px-4 py-3 text-center"><span className="px-2 py-1 rounded text-xs font-medium bg-secondary text-muted-foreground">{player.position}</span></td>
                  <td className="px-4 py-3 text-center"><span className={cn("px-2.5 py-1 rounded-full text-xs font-bold", getOverallColor(player.overall))}>{player.overall}</span></td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{player.age}</td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="w-4 h-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem><Edit className="w-4 h-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive"><Trash2 className="w-4 h-4 mr-2" />Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-border">
          <p className="text-sm text-muted-foreground">Showing {Math.min(50, filteredPlayers.length)} of {filteredPlayers.length} players</p>
        </div>
      </div>
    </div>
  );
}
