const DB_NAME = "pes-magic-patcher";
const STORE = "projects";

export async function saveProject(name, data) {
  const db = await openDB();
  const tx = db.transaction(STORE, "readwrite");
  tx.objectStore(STORE).put(data, name);
}

export async function loadProject(name) {
  const db = await openDB();
  return db.transaction(STORE).objectStore(STORE).get(name);
}

function openDB() {
  return new Promise((resolve) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
  });
}
