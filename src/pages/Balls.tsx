import { useState } from "react";
import {
  Search,
  Upload,
  Download,
  Plus,
  CircleDot,
  Eye,
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
import { cn } from "@/lib/utils";

interface Ball {
  id: number;
  name: string;
  brand: string;
  competition: string;
  season: string;
  isCustom: boolean;
  color: string;
}

const mockBalls: Ball[] = [
  { id: 1, name: "Nike Flight", brand: "Nike", competition: "Premier League", season: "2020-21", isCustom: true, color: "#FF6B00" },
  { id: 2, name: "Adidas Finale", brand: "Adidas", competition: "Champions League", season: "2020-21", isCustom: true, color: "#1A47B8" },
  { id: 3, name: "Puma LaLiga", brand: "Puma", competition: "La Liga", season: "2020-21", isCustom: false, color: "#FFCD00" },
  { id: 4, name: "Nike Serie A", brand: "Nike", competition: "Serie A", season: "2020-21", isCustom: true, color: "#FF0000" },
  { id: 5, name: "Derbystar Bundesliga", brand: "Derbystar", competition: "Bundesliga", season: "2020-21", isCustom: false, color: "#D20515" },
  { id: 6, name: "Adidas World Cup", brand: "Adidas", competition: "World Cup", season: "2018", isCustom: true, color: "#000000" },
];

export default function Balls() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrand, setSelectedBrand] = useState("all");

  const filteredBalls = mockBalls.filter((ball) => {
    const matchesSearch = ball.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ball.competition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand = selectedBrand === "all" || ball.brand === selectedBrand;
    return matchesSearch && matchesBrand;
  });

  const brands = [...new Set(mockBalls.map((b) => b.brand))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Ball <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            Import and manage custom balls
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <Upload className="w-4 h-4" />
            Import Balls
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="gaming" className="gap-2">
            <Plus className="w-4 h-4" />
            Add Ball
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search balls or competitions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border"
            />
          </div>
          <Select value={selectedBrand} onValueChange={setSelectedBrand}>
            <SelectTrigger className="w-full sm:w-40 bg-background border-border">
              <SelectValue placeholder="Brand" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Brands</SelectItem>
              {brands.map((brand) => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Ball Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredBalls.map((ball) => (
          <div
            key={ball.id}
            className="card-gaming p-4 group hover:border-primary/50 transition-all duration-300 cursor-pointer"
          >
            <div className="aspect-square rounded-lg bg-secondary mb-3 flex items-center justify-center relative overflow-hidden">
              <div
                className="w-20 h-20 rounded-full border-4 border-white/20 flex items-center justify-center"
                style={{ backgroundColor: ball.color }}
              >
                <CircleDot className="w-10 h-10 text-white/70" />
              </div>
              <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Eye className="w-6 h-6 text-primary" />
              </div>
            </div>
            <p className="font-medium text-foreground text-sm truncate group-hover:text-primary transition-colors">
              {ball.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {ball.competition}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-muted-foreground">{ball.season}</span>
              <span
                className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  ball.isCustom
                    ? "bg-success/15 text-success"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {ball.isCustom ? "Custom" : "Default"}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
