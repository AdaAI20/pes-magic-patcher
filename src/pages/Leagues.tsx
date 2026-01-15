import { useState } from "react";
import {
  Search,
  Plus,
  Download,
  Upload,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  Trophy,
  Shield,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface League {
  id: number;
  name: string;
  country: string;
  teams: number;
  tier: number;
  season: string;
  color: string;
}

const mockLeagues: League[] = [
  { id: 1, name: "Premier League", country: "England", teams: 20, tier: 1, season: "2020-21", color: "#3D195B" },
  { id: 2, name: "La Liga", country: "Spain", teams: 20, tier: 1, season: "2020-21", color: "#EE8707" },
  { id: 3, name: "Bundesliga", country: "Germany", teams: 18, tier: 1, season: "2020-21", color: "#D20515" },
  { id: 4, name: "Serie A", country: "Italy", teams: 20, tier: 1, season: "2020-21", color: "#024494" },
  { id: 5, name: "Ligue 1", country: "France", teams: 20, tier: 1, season: "2020-21", color: "#DBA111" },
  { id: 6, name: "Eredivisie", country: "Netherlands", teams: 18, tier: 1, season: "2020-21", color: "#E85B1A" },
  { id: 7, name: "Primeira Liga", country: "Portugal", teams: 18, tier: 1, season: "2020-21", color: "#1B4D3E" },
  { id: 8, name: "Champions League", country: "Europe", teams: 32, tier: 0, season: "2020-21", color: "#071D49" },
];

export default function Leagues() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLeagues = mockLeagues.filter((league) =>
    league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    league.country.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            League <span className="text-gradient-primary">Manager</span>
          </h1>
          <p className="text-muted-foreground">
            {mockLeagues.length} leagues configured
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
            Add League
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="card-gaming p-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leagues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border"
          />
        </div>
      </div>

      {/* Leagues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredLeagues.map((league) => (
          <div
            key={league.id}
            className="card-gaming p-5 group hover:border-primary/50 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: league.color }}
              >
                <Trophy className="w-8 h-8 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-display font-semibold text-xl text-foreground group-hover:text-primary transition-colors">
                      {league.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Globe className="w-4 h-4" />
                      <span>{league.country}</span>
                      <span>•</span>
                      <span>{league.season}</span>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit League
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Shield className="w-4 h-4 mr-2" />
                        Manage Teams
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center gap-4 mt-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-foreground font-medium">{league.teams}</span>
                    <span className="text-muted-foreground">Teams</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span
                      className={cn(
                        "px-2 py-0.5 rounded text-xs font-medium",
                        league.tier === 0
                          ? "bg-accent/15 text-accent"
                          : "bg-primary/15 text-primary"
                      )}
                    >
                      {league.tier === 0 ? "International" : `Tier ${league.tier}`}
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredLeagues.length === 0 && (
        <div className="card-gaming p-12 text-center">
          <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display font-semibold text-lg text-foreground mb-2">
            No leagues found
          </h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or add a new league
          </p>
          <Button variant="gaming">
            <Plus className="w-4 h-4 mr-2" />
            Add League
          </Button>
        </div>
      )}
    </div>
  );
}
