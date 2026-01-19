import { useState } from "react";
import {
  Search, Filter, Plus, Download, Upload, MoreHorizontal, Edit, Trash2, Copy, ChevronLeft, ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/fileStore";

const positions = ["All", "GK", "CB", "LB", "RB", "DMF", "CMF", "AMF", "LWF", "RWF", "SS", "CF"];

export default function Players() {
  // Connect to global file store
  const editBin = useFileStore((state) => state.editBin);
  const players = editBin?.players || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("All");
  
  // Filter Logic
  const filteredPlayers = players.filter((player: any) => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = player.name?.toLowerCase().includes(searchLower);
    const idMatch = player.id?.toString().includes(searchLower);
    
    // Safety check for position
    const pos = player.position || "UNK";
    const posMatch = selectedPosition === "All" || pos === selectedPosition;

    return (nameMatch || idMatch) && posMatch;
  });

  const getOverallColor = (overall: number) => {
    if (overall >= 90) return "text-accent bg-accent/15";
    if (overall >= 85) return "text-success bg-success/15";
    if (overall >= 80) return "text-primary bg-primary/15";
    return "text-muted-foreground bg-secondary";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>
          {!editBin ? (
            <p className="text-destructive font-medium">No File Loaded. Please go to Import.</p>
          ) : (
            <p className="text-muted-foreground">{players.length.toLocaleString()} players loaded</p>
          )}
        </div>
        {/* Buttons... (Keep existing buttons) */}
      </div>

      {/* Filters (Keep existing filters) */}
      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
           <Input 
             placeholder="Search Name or ID..." 
             value={searchQuery} 
             onChange={(e) => setSearchQuery(e.target.value)} 
             className="pl-10"
             disabled={!editBin} 
           />
           {/* ... other filters ... */}
        </div>
      </div>

      {/* Table */}
      <div className="card-gaming overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">OVR</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Pos</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredPlayers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    {editBin ? "No players found matching filters." : "Import a file to see players."}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player: any) => (
                  <tr key={player.id} className="table-row-gaming">
                    <td className="px-4 py-3 font-mono text-sm">{player.id}</td>
                    <td className="px-4 py-3 font-medium">{player.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn("px-2 py-1 rounded-full text-xs font-bold", getOverallColor(player.overall))}>
                        {player.overall}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-sm">{player.position}</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="icon"><MoreHorizontal className="w-4 h-4" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
