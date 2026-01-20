// src/pages/Players.tsx
import { useState, useEffect } from 'react';
import {
  Search, Download, Upload, ChevronLeft, ChevronRight, Edit, Trash2, MoreHorizontal,
  Filter, LayoutGrid, List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useEditBinStore } from '@/store/editBinStore';
import { cn } from '@/lib/utils';

const POSITIONS: Record<number, string> = {
  0: 'GK', 1: 'CB', 2: 'LB', 3: 'RB', 4: 'DMF', 5: 'CMF',
  6: 'LMF', 7: 'RMF', 8: 'AMF', 9: 'LWF', 10: 'RWF', 11: 'SS', 12: 'CF',
};

const positionOptions = ['All', 'GK', 'CB', 'LB', 'RB', 'DMF', 'CMF', 'LMF', 'RMF', 'AMF', 'LWF', 'RWF', 'SS', 'CF'];

export default function Players() {
  const storeData = useEditBinStore((state) => state.data);
  const players = storeData?.players || [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('All');
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const playersPerPage = 50;

  // Filter players
  const filteredPlayers = players.filter((player) => {
    const matchesSearch = (player.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         player.id?.toString().includes(searchTerm);
    const matchesPosition = selectedPosition === 'All' || 
                           POSITIONS[player.position || 0] === selectedPosition;
    return matchesSearch && matchesPosition;
  });

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (page - 1) * playersPerPage,
    page * playersPerPage
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, selectedPosition]);

  const getPositionLabel = (pos?: number): string => {
    if (pos === undefined || pos === null) return '-';
    return POSITIONS[pos] || '-';
  };

  const exportPlayers = () => {
    const csv = [
      ['ID', 'Name', 'Shirt Name', 'Age', 'Height', 'Weight', 'Position'].join(','),
      ...filteredPlayers.map(p => [
        p.id,
        `"${p.name || ''}"`,
        `"${p.shirtName || ''}"`,
        p.age || '',
        p.height || '',
        p.weight || '',
        getPositionLabel(p.position)
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'players.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  if (players.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">Import an EDIT file to see players</p>
        </div>
        
        <div className="card-gaming p-12 text-center">
          <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Players Loaded</h3>
          <p className="text-muted-foreground mb-4">
            Import a decrypted EDIT00000000 file to view and edit players.
          </p>
          <Button variant="gaming" asChild>
            <a href="#/import">Go to Import</a>
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
          <h1 className="text-3xl font-display font-bold">
            Player <span className="text-gradient-primary">Editor</span>
          </h1>
          <p className="text-muted-foreground">
            {filteredPlayers.length} of {players.length} players
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={exportPlayers}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="card-gaming p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search players by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedPosition} onValueChange={setSelectedPosition}>
            <SelectTrigger className="w-full sm:w-40">
              <SelectValue placeholder="Position" />
            </SelectTrigger>
            <SelectContent>
              {positionOptions.map((pos) => (
                <SelectItem key={pos} value={pos}>{pos}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-1 border border-border rounded-lg p-1">
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Player List */}
      <div className="card-gaming overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">ID</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase">Shirt Name</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Age</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Height</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Weight</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase">Position</th>
                <th className="w-12 px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedPlayers.map((player, index) => (
                <tr key={`${player.id}-${index}`} className="table-row-gaming hover:bg-muted/50">
                  <td className="px-4 py-3 font-mono text-sm">{player.id}</td>
                  <td className="px-4 py-3 font-medium">{player.name || '-'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{player.shirtName || '-'}</td>
                  <td className="px-4 py-3 text-center">{player.age || '-'}</td>
                  <td className="px-4 py-3 text-center">{player.height ? `${player.height}cm` : '-'}</td>
                  <td className="px-4 py-3 text-center">{player.weight ? `${player.weight}kg` : '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant="outline">{getPositionLabel(player.position)}</Badge>
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
                          Edit Player
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
        <div className="flex items-center justify-between p-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Showing {((page - 1) * playersPerPage) + 1} - {Math.min(page * playersPerPage, filteredPlayers.length)} of {filteredPlayers.length}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>
            <span className="text-sm px-3">
              Page {page} of {totalPages || 1}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
