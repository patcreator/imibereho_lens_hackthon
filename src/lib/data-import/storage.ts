import type { ImportedDataset } from "@/lib/data-import/types";

const DB_NAME = "imibereho-lens";
const DB_VERSION = 1;
const DATASETS_STORE = "datasets";

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") return Promise.reject(new Error("IndexedDB is not available in this browser."));
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DATASETS_STORE)) db.createObjectStore(DATASETS_STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local dataset storage."));
  });
}

export async function putImportedDataset(dataset: ImportedDataset): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DATASETS_STORE, "readwrite");
    tx.objectStore(DATASETS_STORE).put(dataset);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not save the dataset in this browser."));
    tx.onabort = () => reject(tx.error ?? new Error("Dataset save was cancelled."));
  });
  db.close();
}

export async function getImportedDataset(id: string): Promise<ImportedDataset | null> {
  const db = await openDatabase();
  const result = await new Promise<ImportedDataset | null>((resolve, reject) => {
    const request = db.transaction(DATASETS_STORE, "readonly").objectStore(DATASETS_STORE).get(id);
    request.onsuccess = () => resolve((request.result as ImportedDataset | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error("Could not read the local dataset."));
  });
  db.close();
  return result;
}

export async function listImportedDatasets(): Promise<ImportedDataset[]> {
  const db = await openDatabase();
  const result = await new Promise<ImportedDataset[]>((resolve, reject) => {
    const request = db.transaction(DATASETS_STORE, "readonly").objectStore(DATASETS_STORE).getAll();
    request.onsuccess = () => resolve((request.result as ImportedDataset[]).sort((a, b) => b.importedAt.localeCompare(a.importedAt)));
    request.onerror = () => reject(request.error ?? new Error("Could not list local datasets."));
  });
  db.close();
  return result;
}

export async function deleteImportedDataset(id: string): Promise<void> {
  const db = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(DATASETS_STORE, "readwrite");
    tx.objectStore(DATASETS_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error("Could not delete the local dataset."));
  });
  db.close();
}
