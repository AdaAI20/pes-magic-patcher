import { useState } from "react";
import {
  Search,
  Upload,
  Download,
  Plus,
  Shirt,
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

interface Kit {
  id: number;
  team: string;
  type: "home" | "away" | "third" | "gk";
  season: string;
  hasCustom: boolean;
  primaryColor: string;
  secondaryColor: string;
}

const mockKits: Kit[] = [
  { id: 1, team: "FC Barcelona", type: "home", season: "2020-21", hasCustom: true, primaryColor: "#A50044", secondaryColor: "#004D98" },
  { id: 2, team: "FC Barcelona", type: "away", season: "2020-21", hasCustom: true, primaryColor: "#000000", secondaryColor: "#EDBB00" },
  { id: 3, team: "Real Madrid", type: "home", season: "2020-21", hasCustom: true, primaryColor: "#FFFFFF", secondaryColor: "#00529F" },
  { id: 4, team: "Real Madrid", type: "away", season: "2020-21", hasCustom: false, primaryColor: "#FF69B4", secondaryColor: "#000000" },
  { id: 5, team: "Manchester United", type: "home", season: "2020-21", hasCustom: true, primaryColor: "#DA291C", secondaryColor: "#FBE122" },
  { id: 6, team: "Manchester City", type: "home", season: "2020-21", hasCustom: true, primaryColor: "#6CABDD", secondaryColor: "#1C2C5B" },
];

export default function Kits() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  const filteredKits = mockKits.filter((kit) => {
    const matchesSearch = kit.team.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || kit.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeName = (type: string) => {
    switch (type) {
      case "home": return "Home";
      case "away": return "Away";
      case "third": return "Third";
      case "gk": return "Goalkeeper";
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Kit <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            Design and manage team uniforms
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import Kits
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="gaming" className="gap-2">
            <Plus className="w-4 h-4" />
            Create Kit
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-border">
              <SelectValue placeholder="Kit Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="home">Home</SelectItem>
              <SelectItem value="away">Away</SelectItem>
              <SelectItem value="third">Third</SelectItem>
              <SelectItem value="gk">Goalkeeper</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Kit Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKits.map((kit) => (
          <div
            key={kit.id}
            className="card-gaming p-5 group hover:border-primary/50 transition-all duration-300 cursor-pointer"
          >
            <div className="flex items-center gap-4 mb-4">
              <div
                className="w-16 h-20 rounded-lg flex items-center justify-center relative"
                style={{ backgroundColor: kit.primaryColor }}
              >
                <Shirt className="w-10 h-10" style={{ color: kit.secondaryColor }} />
                <div
                  className="absolute bottom-0 left-0 right-0 h-4 rounded-b-lg"
                  style={{ backgroundColor: kit.secondaryColor }}
                />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">
                  {kit.team}
                </h3>
                <p className="text-sm text-muted-foreground">{getTypeName(kit.type)} Kit</p>
                <p className="text-xs text-muted-foreground">{kit.season}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: kit.primaryColor }}
                  title="Primary Color"
                />
                <div
                  className="w-6 h-6 rounded-full border-2 border-border"
                  style={{ backgroundColor: kit.secondaryColor }}
                  title="Secondary Color"
                />
              </div>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  kit.hasCustom
                    ? "bg-success/15 text-success"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {kit.hasCustom ? "Custom" : "Default"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
