const DB_NAME = "earnings-iq";
const STORE_NAME = "podcast-audio";
const DB_VERSION = 1;

type PodcastAudioRecord = {
  id: string;
  mimeType: string;
  blob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
}

function runTransaction<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, mode);
        const request = fn(tx.objectStore(STORE_NAME));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      }),
  );
}

export async function savePodcastAudio(
  id: string,
  audioBase64: string,
  mimeType: string,
): Promise<void> {
  const bytes = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  await runTransaction("readwrite", (store) =>
    store.put({ id, mimeType, blob } satisfies PodcastAudioRecord),
  );
}

export async function getPodcastAudio(
  id: string,
): Promise<{ blob: Blob; mimeType: string } | null> {
  const record = await runTransaction<PodcastAudioRecord | undefined>("readonly", (store) =>
    store.get(id),
  );
  if (!record) return null;
  return { blob: record.blob, mimeType: record.mimeType };
}

export async function deletePodcastAudio(id: string): Promise<void> {
  await runTransaction("readwrite", (store) => store.delete(id));
}
