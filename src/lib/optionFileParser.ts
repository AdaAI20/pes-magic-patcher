/**
 * Option File Parser for PES 2021
 * 
 * Handles .bin and .ted (Team Export Data) files
 * These are simpler than EDIT.bin and mostly contain team configurations
 */

export interface OptionFileData {
  raw: Uint8Array;
  fileName: string;
  fileSize: number;
  fileType: 'bin' | 'ted' | 'unknown';
  loadedAt: Date;
}

/**
 * Detect file type from extension and magic bytes
 */
function detectFileType(fileName: string, data: Uint8Array): 'bin' | 'ted' | 'unknown' {
  const ext = fileName.toLowerCase().split('.').pop();
  
  if (ext === 'ted') return 'ted';
  if (ext === 'bin') return 'bin';
  
  // Could also check magic bytes here
  return 'unknown';
}

/**
 * Load an option file (.bin or .ted)
 */
export async function loadOptionFile(file: File): Promise<OptionFileData> {
  console.log(`[Option Parser] Loading ${file.name} (${file.size} bytes)`);
  
  const arrayBuffer = await file.arrayBuffer();
  const buffer = new Uint8Array(arrayBuffer);
  
  const fileType = detectFileType(file.name, buffer);
  
  return {
    raw: buffer,
    fileName: file.name,
    fileSize: file.size,
    fileType,
    loadedAt: new Date(),
  };
}

/**
 * Export option file data back to file format
 */
export function exportOptionFile(data: OptionFileData): Blob {
  // Use slice() to create a regular ArrayBuffer from the Uint8Array
  return new Blob([new Uint8Array(data.raw).buffer.slice(0)], { type: "application/octet-stream" });
}
