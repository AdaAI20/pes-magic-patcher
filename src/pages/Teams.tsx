// src/pages/Teams.tsx
import { useState } from "react";
import {
  Search, Filter, Plus, Download, Upload, MoreHorizontal, Edit, Trash2,
  Users, Shirt, LayoutGrid, List,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditBinStore } from "@/store/editBinStore";
import { cn } from "@/lib/utils";

interface Team {
  id: number;
  name: string;
  shortName?: string;
  league: string;
  country: string;
  playerCount?: number;
  stadium?: string;
  rating?: number;
  color: string;
  offset?: number;
}

const defaultTeams: Team[] = [
  { id: 1, name: "FC Barcelona", league: "La Liga", country: "Spain", playerCount: 28, stadium: "Camp Nou", rating: 5, color: "#A50044" },
  { id: 2, name: "Real Madrid", league: "La Liga", country: "Spain", playerCount: 27, stadium: "Santiago Bernabéu", rating: 5, color: "#FEBE10" },
  { id: 3, name: "Manchester United", league: "Premier League", country: "England", playerCount: 30, stadium: "Old Trafford", rating: 5, color: "#DA291C" },
  { id: 4, name: "Manchester City", league: "Premier League", country: "England", playerCount: 29, stadium: "Etihad Stadium", rating: 5, color: "#6CABDD" },
  { id: 5, name: "Paris Saint-Germain", league: "Ligue 1", country: "France", playerCount: 31, stadium: "Parc des Princes", rating: 5, color: "#004170" },
  { id: 6, name: "FC Bayern München", league: "Bundesliga", country: "Germany", playerCount: 28, stadium: "Allianz Arena", rating: 5, color: "#DC052D" },
  { id: 7, name: "Juventus", league: "Serie A", country: "Italy", playerCount: 29, stadium: "Allianz Stadium", rating: 5, color: "#000000" },
  { id: 8, name: "Liverpool", league: "Premier League", country: "England", playerCount: 28, stadium: "Anfield", rating: 5, color: "#C8102E" },
];

const leagues = ["All", "La Liga", "Premier League", "Bundesliga", "Serie A", "Ligue 1"];

export default function Teams() {
  const storeData = useEditBinStore((state) => state.data);
  const storeTeams = storeData?.teams || [];
  
  // Use store teams if available, otherwise use defaults
  const teams: Team[] = storeTeams.length > 0 
    ? storeTeams.map(t => ({
        ...t,
        playerCount: t.playerCount || 0,
        stadium: t.stadium || '',
        rating: t.rating || 3,
      }))
    : defaultTeams;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredTeams = teams.filter((team) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      team.name.toLowerCase().includes(q) ||
      team.league.toLowerCase().includes(q) ||
      team.country.toLowerCase().includes(q);

    const matchesLeague = selectedLeague === "All" || team.league === selectedLeague;

    return matchesSearch && matchesLeague;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Team <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            {filteredTeams.length} teams {storeTeams.length > 0 ? '(from EDIT file)' : '(sample data)'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2" asChild>
            <a href="#/import">
              <Upload className="w-4 h-4" />
              Import EDIT
            </a>
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="gaming" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Team
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teams, leagues, countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedLeague} onValueChange={setSelectedLeague}>
            <SelectTrigger className="w-full sm:w-48">
              <SelectValue placeholder="League" />
            </SelectTrigger>
            <SelectContent>
              {leagues.map((league) => (
                <SelectItem key={league} value={league}>{league}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" className="gap-2">
            <Filter className="w-4 h-4" />
            More Filters
          </Button>

          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="w-4 h-4" />
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

      {/* Empty State */}
      {filteredTeams.length === 0 && (
        <div className="card-gaming p-10 text-center">
          <p className="text-muted-foreground">No teams match your filters.</p>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredTeams.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredTeams.map((team) => (
            <div
              key={team.id}
              className="card-gaming p-5 group cursor-pointer hover:-translate-y-1 hover:shadow-lg transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-display font-bold text-xl"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name.slice(0, 2).toUpperCase()}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Team
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Users className="w-4 h-4 mr-2" />
                      Manage Roster
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Shirt className="w-4 h-4 mr-2" />
                      Edit Kits
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <h3 className="font-display font-semibold text-lg mb-1 group-hover:text-primary">
                {team.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">{team.league}</p>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {team.playerCount || 0} players
                </div>
                <div className="text-accent">
                  {"★".repeat(team.rating || 3)}
                </div>
              </div>

              {team.stadium && (
                <div className="mt-4 pt-4 border-t border-border text-xs text-muted-foreground truncate">
                  📍 {team.stadium}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* List View */}
      {viewMode === "list" && filteredTeams.length > 0 && (
        <div className="card-gaming overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Team</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">League</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Country</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Players</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Stadium</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Rating</th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="table-row-gaming">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                          style={{ backgroundColor: team.color }}
                        >
                          {team.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium hover:text-primary cursor-pointer">
                          {team.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">{team.league}</td>
                    <td className="px-4 py-3 text-sm">{team.country}</td>
                    <td className="px-4 py-3 text-center text-sm">{team.playerCount || 0}</td>
                    <td className="px-4 py-3 text-sm">{team.stadium || '-'}</td>
                    <td className="px-4 py-3 text-center text-accent">
                      {"★".repeat(team.rating || 3)}
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
      )}
    </div>
  );
}
