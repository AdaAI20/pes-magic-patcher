export async function loadOptionFile(file: File) {
  const raw = new Uint8Array(await file.arrayBuffer());
  return raw;
}

export function exportOptionFile(raw: Uint8Array) {
  return new Blob([raw], { type: "application/octet-stream" });
}
