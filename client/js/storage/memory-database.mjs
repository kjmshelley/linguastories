import { DATABASE_MIGRATIONS } from "./migrations.mjs";

export class MemoryDatabase {
  constructor({ failOnPut = null } = {}) { this.failOnPut = failOnPut; this.stores = new Map(); this.indexes = new Map(); for (const migration of DATABASE_MIGRATIONS) for (const definition of migration.stores) { if (!this.stores.has(definition.name)) this.stores.set(definition.name, new Map()); const existing = this.indexes.get(definition.name) || []; this.indexes.set(definition.name, [...existing, ...definition.indexes.filter((index) => !existing.some((item) => item.name === index.name))]); } }
  async open() { return this; }
  async transaction(storeNames, _mode, callback) {
    const snapshots = new Map(storeNames.map((name) => [name, new Map(this.stores.get(name))]));
    const api = {
      get: async (store, key) => structuredClone(this.stores.get(store).get(String(key))),
      put: async (store, value) => { if (this.failOnPut?.(store, value)) throw Object.assign(new Error("Simulated quota failure"), { name: "QuotaExceededError" }); this.stores.get(store).set(String(value.id), structuredClone(value)); return value.id; },
      delete: async (store, key) => this.stores.get(store).delete(String(key)),
      clear: async (store) => this.stores.get(store).clear(),
      getAll: async (store) => [...this.stores.get(store).values()].map((value) => structuredClone(value)),
      getAllByIndex: async (store, index, query) => [...this.stores.get(store).values()].filter((value) => value[this.indexes.get(store).find((item) => item.name === index)?.keyPath] === query).map((value) => structuredClone(value))
    };
    try { return await callback(api); } catch (error) { for (const [name, snapshot] of snapshots) this.stores.set(name, snapshot); throw error; }
  }
  get(store, key) { return this.transaction([store], "readonly", (tx) => tx.get(store, key)); }
  put(store, value) { return this.transaction([store], "readwrite", (tx) => tx.put(store, value)); }
  delete(store, key) { return this.transaction([store], "readwrite", (tx) => tx.delete(store, key)); }
  getAll(store) { return this.transaction([store], "readonly", (tx) => tx.getAll(store)); }
  getAllByIndex(store, index, query) { return this.transaction([store], "readonly", (tx) => tx.getAllByIndex(store, index, query)); }
}
