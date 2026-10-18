/**
 * Test Helper: In-memory LocalStorage and DOM stub for Node.js test runner
 */

export class MemoryLocalStorage {
  constructor() {
    this.store = new Map();
  }

  getItem(key) {
    return this.store.has(String(key)) ? this.store.get(String(key)) : null;
  }

  setItem(key, value) {
    this.store.set(String(key), String(value));
  }

  removeItem(key) {
    this.store.delete(String(key));
  }

  clear() {
    this.store.clear();
  }

  get length() {
    return this.store.size;
  }

  key(index) {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }
}

export function setupTestEnvironment() {
  globalThis.localStorage = new MemoryLocalStorage();
  globalThis.window = globalThis;
  if (!globalThis.location) {
    globalThis.location = {
      href: 'http://localhost:3000/',
      pathname: '/',
      search: '',
      hash: ''
    };
  }
}
