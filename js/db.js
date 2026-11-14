// Stockage local : IndexedDB, rien ne quitte le téléphone.
const NAME = 'japprends-le-chinois';
const VERSION = 1;
let opening;

export function openDb() {
  opening ??= new Promise((resolve, reject) => {
    const r = indexedDB.open(NAME, VERSION);
    r.onupgradeneeded = () => {
      const d = r.result;
      if (!d.objectStoreNames.contains('cards')) {
        const s = d.createObjectStore('cards', { keyPath: 'id' });
        s.createIndex('due', 'due');
        s.createIndex('deckId', 'deckId');
        s.createIndex('hanzi', 'hanzi');
      }
      if (!d.objectStoreNames.contains('decks')) d.createObjectStore('decks', { keyPath: 'id' });
      if (!d.objectStoreNames.contains('logs')) {
        const l = d.createObjectStore('logs', { keyPath: 'id', autoIncrement: true });
        l.createIndex('day', 'day');
      }
      if (!d.objectStoreNames.contains('kv')) d.createObjectStore('kv');
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
  return opening;
}

const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const store = async (name, mode = 'readonly') => (await openDb()).transaction(name, mode).objectStore(name);

export const get = async (s, key) => req((await store(s)).get(key));
export const getAll = async (s) => req((await store(s)).getAll());
export const count = async (s) => req((await store(s)).count());
export const put = async (s, value, key) => req((await store(s, 'readwrite')).put(value, key));
export const del = async (s, key) => req((await store(s, 'readwrite')).delete(key));
export const getAllByIndex = async (s, index, query) => req((await store(s)).index(index).getAll(query));
export const countByIndex = async (s, index, query) => req((await store(s)).index(index).count(query));

export const kvGet = (key) => get('kv', key);
export const kvSet = (key, value) => put('kv', value, key);

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

// Demande au navigateur de ne pas effacer les données en cas de manque de place
export async function askPersistence() {
  try { if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist(); } catch {}
}
