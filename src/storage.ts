import type { Sketch } from './types';

const DB_NAME = 'transposing-sketchpad';
const STORE = 'sketches';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadSketch(): Promise<Sketch | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE).objectStore(STORE).get('current');
    request.onsuccess = () => resolve(request.result as Sketch | undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function saveSketch(sketch: Sketch): Promise<void> {
  const db = await database();
  await new Promise<void>((resolve, reject) => {
    const request = db.transaction(STORE, 'readwrite').objectStore(STORE).put(sketch, 'current');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}
