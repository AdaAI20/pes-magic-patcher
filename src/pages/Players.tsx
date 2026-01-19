import { useState } from "react";
import {
  Search, Filter, Plus, Download, Upload, MoreHorizontal, Edit, Trash2, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useFileStore } from "@/store/fileStore";

const positions = ["All", "GK", "CB", "LB", "RB", "DMF", "CMF", "AMF", "LWF", "RWF", "SS", "CF"];

export default function Players() {
  const editBin = useFileStore((state) => state.editBin);
  const players = editBin?.players || [];

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("All");
  
  // Basic filtering
  const filteredPlayers = players.filter((player: any) => {
    // If data is garbage/raw, handle missing fields gracefully
    const pName = player.name || "";
    const pId = player.id ? player.id.toString() : "";
    const searchLower = searchQuery.toLowerCase();
    
    const matchesSearch = pName.toLowerCase().includes(searchLower) || pId.includes(searchLower);
    const matchesPosition = selectedPosition === "All" || player.position === selectedPosition;

    return matchesSearch && matchesPosition;
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
            <p className="text-muted-foreground">{players.length} entries loaded (Raw Mode)</p>
          )}
        </div>
      </div>

      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
           <Input 
             placeholder="Search Name or ID..." 
             value={searchQuery} 
             onChange={(e) => setSearchQuery(e.target.value)} 
             className="pl-10"
             disabled={!editBin} 
           />
        </div>
      </div>

      <div className="card-gaming overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ID (Raw)</th>
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
                    {editBin ? "No players found." : "Import a file first."}
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player: any, index: number) => (
                  <tr key={index} className="table-row-gaming">
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
