// Tarayıcı-içi (IndexedDB) kütüphane veritabanı — Materyal + Model + Koleksiyon.
// NET SINIR: Bu veritabanı tarayıcı/cihaz-yereldir. Firma çapında paylaşılan, çoklu-kullanıcılı
// bir sistem DEĞİLDİR (bu Faz C'nin — gerçek backend'in — işi, bkz. 01_MIMARI/04_SaaS-Platform-Mimarisi.md).
// Model & Material Editörü ile bu kütüphane aynı origin'den (aynı yerel sunucu) servis edildiği için
// aynı IndexedDB veritabanını paylaşırlar — "Kütüphaneye Kaydet" bu sayede çalışır.

const DB_NAME = "configurator_studio_library";
const DB_VERSION = 1;

let _dbPromise = null;
function openDB() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains("materials")) {
        const s = db.createObjectStore("materials", { keyPath: "id" });
        s.createIndex("brand", "brand");
        s.createIndex("category", "category");
        s.createIndex("favorite", "favorite");
        s.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("models")) {
        const s = db.createObjectStore("models", { keyPath: "id" });
        s.createIndex("brand", "brand");
        s.createIndex("category", "category");
        s.createIndex("favorite", "favorite");
        s.createIndex("createdAt", "createdAt");
      }
      if (!db.objectStoreNames.contains("collections")) {
        db.createObjectStore("collections", { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return _dbPromise;
}

function withStore(storeName, mode, fn) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode);
        const store = tx.objectStore(storeName);
        fn(store);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      })
  );
}

export function newId(prefix) {
  return (prefix || "item") + "_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
}

export async function dbPut(storeName, record) {
  await withStore(storeName, "readwrite", (store) => store.put(record));
  return record;
}

export async function dbGet(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readonly").objectStore(storeName).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function dbGetAll(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function dbDelete(storeName, id) {
  await withStore(storeName, "readwrite", (store) => store.delete(id));
}

/** Boş bir materyal kaydı iskeleti — form alanları burada tek yerden tanımlı. */
export function blankMaterial() {
  const now = new Date().toISOString();
  return {
    id: newId("mat"),
    name: "", productName: "", productCode: "", brand: "", manufacturer: "",
    collectionName: "", category: "", subcategory: "", description: "",
    tags: [], color: "#cfcac0", colorVariations: [],
    physicalWidth: 100, physicalHeight: 100, physicalUnit: "cm",
    price: null, currency: "TRY", stock: null,
    favorite: false, createdAt: now, updatedAt: now,
    maps: {},       // slotKey -> Blob
    mapMeta: {},    // slotKey -> {width,height,type,size}
    params: {},     // slotKey -> ADJUST_SCHEMA değerleri (kayıt anındaki hali)
    sizing: null,   // editördeki __sizing anlık görüntüsü
    roughness: 0.6, metalness: 0.05,
    resolution: null,
  };
}

/** Boş bir model kaydı iskeleti. */
export function blankModel() {
  const now = new Date().toISOString();
  return {
    id: newId("mdl"),
    name: "", brand: "", code: "", category: "", subcategory: "",
    description: "", tags: [],
    dimensions: { width: null, height: null, depth: null, unit: "cm" },
    polyCount: null, vertCount: null, format: "",
    materialsUsed: [], price: null, currency: "TRY",
    favorite: false, createdAt: now, updatedAt: now,
    fileBlob: null, fileName: "",
    thumb: null,
  };
}
