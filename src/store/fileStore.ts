// Make sure the store can handle many players
// In your store file, ensure there's no limit or increase it

// Example for Zustand store:
interface FileStore {
  players: Player[];
  setPlayers: (players: Player[]) => void;
  // ... other properties
}

export const useFileStore = create<FileStore>((set) => ({
  players: [],
  setPlayers: (players) => {
    console.log('[STORE] Saving', players.length, 'players');
    set({ players });
  },
}));
