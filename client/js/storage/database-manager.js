import { DATABASE_MIGRATIONS, migrationsForUpgrade } from "./migrations.mjs";
import { DATABASE_NAME, DATABASE_VERSION } from "./storage-contracts.mjs";

function requestPromise(request) {
  return new Promise((resolve, reject) => { request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
}

function transactionPromise(transaction) {
  return new Promise((resolve, reject) => { transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); transaction.onabort = () => reject(transaction.error || new Error("Storage transaction aborted")); });
}

function applyMigrations(database, transaction, oldVersion, newVersion) {
  for (const migration of migrationsForUpgrade(oldVersion, newVersion)) {
    for (const definition of migration.stores) {
      const store = database.objectStoreNames.contains(definition.name) ? transaction.objectStore(definition.name) : database.createObjectStore(definition.name, { keyPath: definition.keyPath });
      for (const index of definition.indexes) if (!store.indexNames.contains(index.name)) store.createIndex(index.name, index.keyPath, { unique: Boolean(index.unique) });
    }
  }
}

export class DatabaseManager {
  constructor({ indexedDB = globalThis.indexedDB, name = DATABASE_NAME, version = DATABASE_VERSION, logger = null } = {}) {
    this.indexedDB = indexedDB; this.name = name; this.version = version; this.logger = logger; this.database = null;
  }
  async open() {
    if (this.database) return this.database;
    if (!this.indexedDB) throw Object.assign(new Error("Offline storage is unavailable in this browser."), { code: "INDEXEDDB_UNAVAILABLE" });
    const request = this.indexedDB.open(this.name, this.version);
    request.onupgradeneeded = (event) => applyMigrations(request.result, request.transaction, event.oldVersion, event.newVersion || this.version);
    this.database = await requestPromise(request);
    this.database.onversionchange = () => { this.database.close(); this.database = null; };
    this.logger?.info("database_open", { name: this.name, version: this.version });
    return this.database;
  }
  async transaction(storeNames, mode, callback) {
    const database = await this.open();
    const transaction = database.transaction(storeNames, mode);
    const completion = transactionPromise(transaction);
    const api = {
      get: (store, key) => requestPromise(transaction.objectStore(store).get(key)),
      put: (store, value) => requestPromise(transaction.objectStore(store).put(value)),
      delete: (store, key) => requestPromise(transaction.objectStore(store).delete(key)),
      clear: (store) => requestPromise(transaction.objectStore(store).clear()),
      getAll: (store) => requestPromise(transaction.objectStore(store).getAll()),
      getAllByIndex: (store, index, query) => requestPromise(transaction.objectStore(store).index(index).getAll(query))
    };
    let result;
    try { result = await callback(api); } catch (error) { transaction.abort(); throw error; }
    await completion;
    return result;
  }
  get(store, key) { return this.transaction([store], "readonly", (tx) => tx.get(store, key)); }
  put(store, value) { return this.transaction([store], "readwrite", (tx) => tx.put(store, value)); }
  delete(store, key) { return this.transaction([store], "readwrite", (tx) => tx.delete(store, key)); }
  getAll(store) { return this.transaction([store], "readonly", (tx) => tx.getAll(store)); }
  getAllByIndex(store, index, query) { return this.transaction([store], "readonly", (tx) => tx.getAllByIndex(store, index, query)); }
}

export { applyMigrations, DATABASE_MIGRATIONS };
