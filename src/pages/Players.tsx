// src/pages/Players.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Upload, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

interface Player {
  id: number;
  name: string;
  shirtName?: string;
  nationality?: number;
  age?: number;
  height?: number;
  weight?: number;
  position?: number;
  offset?: number;
}

const POSITIONS: Record<number, string> = {
  0: 'GK',
  1: 'CB',
  2: 'LB',
  3: 'RB',
  4: 'DMF',
  5: 'CMF',
  6: 'LMF',
  7: 'RMF',
  8: 'AMF',
  9: 'LWF',
  10: 'RWF',
  11: 'SS',
  12: 'CF',
};

function Players() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const playersPerPage = 50;

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = () => {
    setLoading(true);
    
    try {
      const storedData = localStorage.getItem('pes-edit-players');
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setPlayers(Array.isArray(parsed) ? parsed : parsed.players || []);
      } else {
        const sessionData = sessionStorage.getItem('editFileData');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          setPlayers(parsed.players || []);
        } else {
          setPlayers([]);
        }
      }
    } catch (e) {
      console.error('[PLAYERS] Error loading:', e);
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter((player) => {
    const name = (player.name || '').toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || player.id?.toString().includes(search);
  });

  // Pagination
  const totalPages = Math.ceil(filteredPlayers.length / playersPerPage);
  const paginatedPlayers = filteredPlayers.slice(
    (page - 1) * playersPerPage,
    page * playersPerPage
  );

  // Reset page when search changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm]);

  const getPositionLabel = (pos?: number): string => {
    if (pos === undefined || pos === null) return '-';
    return POSITIONS[pos] || `POS${pos}`;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
        <span className="ml-2">Loading players...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Players</h1>
          <p className="text-muted-foreground">
            {players.length > 0 
              ? `${players.length} players loaded`
              : 'Import an EDIT file to see players'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadPlayers}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportPlayers} disabled={players.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {players.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Players Loaded</h3>
            <p className="text-muted-foreground text-center mb-4">
              Import a decrypted EDIT00000000 file to view and edit players.
            </p>
            <Button asChild>
              <a href="#/import">Go to Import</a>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Player List</span>
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search players..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Shirt Name</TableHead>
                    <TableHead className="w-[60px]">Age</TableHead>
                    <TableHead className="w-[80px]">Height</TableHead>
                    <TableHead className="w-[80px]">Weight</TableHead>
                    <TableHead className="w-[80px]">Position</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedPlayers.map((player, index) => (
                    <TableRow key={`${player.id}-${index}`}>
                      <TableCell className="font-mono text-xs">
                        {player.id}
                      </TableCell>
                      <TableCell className="font-medium">
                        {player.name || '-'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {player.shirtName || '-'}
                      </TableCell>
                      <TableCell>{player.age || '-'}</TableCell>
                      <TableCell>
                        {player.height ? `${player.height}cm` : '-'}
                      </TableCell>
                      <TableCell>
                        {player.weight ? `${player.weight}kg` : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPositionLabel(player.position)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((page - 1) * playersPerPage) + 1} - {Math.min(page * playersPerPage, filteredPlayers.length)} of {filteredPlayers.length} players
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
                <span className="text-sm px-2">
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
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default Players;
