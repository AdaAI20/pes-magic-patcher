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
import { Search, Download, Upload, RefreshCw } from 'lucide-react';

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
  rawData?: Uint8Array;
}

// Helper to display player name
function displayPlayerName(player: Player): string {
  if (player.name && player.name.length > 0 && !/^[\x00-\x1F]*$/.test(player.name)) {
    return player.name;
  }
  if (player.shirtName && player.shirtName.length > 0) {
    return player.shirtName;
  }
  return `Player #${player.id || 'Unknown'}`;
}

// Position mapping
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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try to get players from localStorage or store
      const storedData = localStorage.getItem('pes-edit-players');
      
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setPlayers(Array.isArray(parsed) ? parsed : parsed.players || []);
      } else {
        // Check for data in sessionStorage or other stores
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
      setError('Failed to load player data');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredPlayers = players.filter((player) => {
    const name = displayPlayerName(player).toLowerCase();
    const search = searchTerm.toLowerCase();
    return name.includes(search) || 
           player.id?.toString().includes(search);
  });

  const getPositionLabel = (pos?: number): string => {
    if (pos === undefined || pos === null) return 'N/A';
    return POSITIONS[pos] || `POS${pos}`;
  };

  const exportPlayers = () => {
    const csv = [
      ['ID', 'Name', 'Shirt Name', 'Age', 'Height', 'Weight', 'Position', 'Nationality'].join(','),
      ...filteredPlayers.map(p => [
        p.id,
        `"${displayPlayerName(p)}"`,
        `"${p.shirtName || ''}"`,
        p.age || '',
        p.height || '',
        p.weight || '',
        getPositionLabel(p.position),
        p.nationality || ''
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
              ? `Manage ${players.length} players from your EDIT file`
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

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      )}

      {players.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Upload className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Players Loaded</h3>
            <p className="text-muted-foreground text-center mb-4">
              Import an EDIT00000000 file to view and edit players.
            </p>
            <Button asChild>
              <a href="/import">Go to Import</a>
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
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.slice(0, 100).map((player, index) => (
                    <TableRow key={player.id || index}>
                      <TableCell className="font-mono text-xs">
                        {player.id || index}
                      </TableCell>
                      <TableCell className="font-medium">
                        {displayPlayerName(player)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {player.shirtName || '-'}
                      </TableCell>
                      <TableCell>{player.age || '-'}</TableCell>
                      <TableCell>{player.height ? `${player.height}cm` : '-'}</TableCell>
                      <TableCell>{player.weight ? `${player.weight}kg` : '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getPositionLabel(player.position)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {filteredPlayers.length > 100 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 100 of {filteredPlayers.length} players. Use search to find specific players.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-32">
            {JSON.stringify({
              totalPlayers: players.length,
              filteredCount: filteredPlayers.length,
              samplePlayer: players[0] ? {
                id: players[0].id,
                name: players[0].name,
                nameHex: players[0].name ? 
                  Array.from(new TextEncoder().encode(players[0].name))
                    .map(b => b.toString(16).padStart(2, '0')).join(' ') : 'N/A'
              } : null
            }, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

export default Players;
