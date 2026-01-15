export async function loadOptionFile(file) {
  const buffer = new Uint8Array(await file.arrayBuffer());

  return {
    size: buffer.length,
    raw: buffer
  };
}

export function exportOptionFile(data) {
  return new Blob([data.raw], { type: "application/octet-stream" });
}
