/**
 * Zustand store for managing loaded PES files
 * 
 * This store holds the state of all imported files and provides
 * actions to load, update, and export data.
 */

import { create } from 'zustand';
import { EditBinData, loadEditBin } from '@/lib/editBinParser';
import { OptionFileData, loadOptionFile } from '@/lib/optionFileParser';
import { initCrypto, isCryptoReady } from '@/lib/pesCrypto';

export type ImportStatus = 'idle' | 'loading' | 'success' | 'error';

interface ImportedFile {
  id: string;
  name: string;
  size: number;
  type: 'cpk' | 'bin' | 'ted' | 'edit' | 'unknown';
  status: ImportStatus;
  progress: number;
  error?: string;
  loadedAt?: Date;
}

interface FileStore {
  // Crypto state
  cryptoReady: boolean;
  
  // Loaded data
  editBinData: EditBinData | null;
  optionFiles: OptionFileData[];
  
  // Import queue
  importQueue: ImportedFile[];
  
  // Stats (derived from actual data when loaded, mock otherwise)
  stats: {
    playersCount: number;
    teamsCount: number;
    leaguesCount: number;
    patchesCount: number;
  };
  
  // Actions
  initializeCrypto: () => Promise<void>;
  importFile: (file: File) => Promise<void>;
  removeFromQueue: (id: string) => void;
  clearEditBin: () => void;
  clearAll: () => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function getFileType(fileName: string): ImportedFile['type'] {
  const ext = fileName.toLowerCase().split('.').pop();
  switch (ext) {
    case 'cpk': return 'cpk';
    case 'ted': return 'ted';
    case 'bin':
      // Check if it's an EDIT file
      if (fileName.toUpperCase().includes('EDIT')) return 'edit';
      return 'bin';
    default:
      return 'unknown';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export const useFileStore = create<FileStore>((set, get) => ({
  // Initial state
  cryptoReady: false,
  editBinData: null,
  optionFiles: [],
  importQueue: [],
  stats: {
    playersCount: 0,
    teamsCount: 0,
    leaguesCount: 0,
    patchesCount: 0,
  },
  
  // Initialize crypto module
  initializeCrypto: async () => {
    if (get().cryptoReady) return;
    
    try {
      await initCrypto();
      set({ cryptoReady: true });
      console.log('[FileStore] Crypto initialized');
    } catch (error) {
      console.error('[FileStore] Failed to initialize crypto:', error);
      throw error;
    }
  },
  
  // Import a file
  importFile: async (file: File) => {
    const { cryptoReady, initializeCrypto } = get();
    
    // Ensure crypto is ready
    if (!cryptoReady) {
      await initializeCrypto();
    }
    
    const id = generateId();
    const fileType = getFileType(file.name);
    
    // Add to queue
    const queueItem: ImportedFile = {
      id,
      name: file.name,
      size: file.size,
      type: fileType,
      status: 'loading',
      progress: 0,
    };
    
    set(state => ({
      importQueue: [...state.importQueue, queueItem],
    }));
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        set(state => ({
          importQueue: state.importQueue.map(item =>
            item.id === id && item.status === 'loading'
              ? { ...item, progress: Math.min(item.progress + 10, 90) }
              : item
          ),
        }));
      }, 100);
      
      // Process based on file type
      if (fileType === 'edit') {
        const editData = await loadEditBin(file);
        
        clearInterval(progressInterval);
        
        set(state => ({
          editBinData: editData,
          importQueue: state.importQueue.map(item =>
            item.id === id
              ? { ...item, status: 'success', progress: 100, loadedAt: new Date() }
              : item
          ),
          stats: {
            ...state.stats,
            playersCount: editData.players.length,
            teamsCount: editData.teams.length,
          },
        }));
        
        console.log(`[FileStore] EDIT file loaded: ${editData.players.length} players, ${editData.teams.length} teams`);
        
      } else if (fileType === 'bin' || fileType === 'ted') {
        const optionData = await loadOptionFile(file);
        
        clearInterval(progressInterval);
        
        set(state => ({
          optionFiles: [...state.optionFiles, optionData],
          importQueue: state.importQueue.map(item =>
            item.id === id
              ? { ...item, status: 'success', progress: 100, loadedAt: new Date() }
              : item
          ),
        }));
        
        console.log(`[FileStore] Option file loaded: ${file.name}`);
        
      } else {
        clearInterval(progressInterval);
        
        // For CPK and other files, just mark as pending (not yet implemented)
        set(state => ({
          importQueue: state.importQueue.map(item =>
            item.id === id
              ? { ...item, status: 'error', error: 'CPK parsing not yet implemented', progress: 0 }
              : item
          ),
        }));
      }
      
    } catch (error) {
      console.error(`[FileStore] Failed to import ${file.name}:`, error);
      
      set(state => ({
        importQueue: state.importQueue.map(item =>
          item.id === id
            ? { 
                ...item, 
                status: 'error', 
                error: error instanceof Error ? error.message : 'Unknown error',
                progress: 0,
              }
            : item
        ),
      }));
    }
  },
  
  // Remove from queue
  removeFromQueue: (id: string) => {
    set(state => ({
      importQueue: state.importQueue.filter(item => item.id !== id),
    }));
  },
  
  // Clear EDIT.bin data
  clearEditBin: () => {
    set({
      editBinData: null,
      stats: {
        playersCount: 0,
        teamsCount: 0,
        leaguesCount: 0,
        patchesCount: 0,
      },
    });
  },
  
  // Clear all data
  clearAll: () => {
    set({
      editBinData: null,
      optionFiles: [],
      importQueue: [],
      stats: {
        playersCount: 0,
        teamsCount: 0,
        leaguesCount: 0,
        patchesCount: 0,
      },
    });
  },
}));

// Export helper for getting formatted file size
export { formatFileSize };
