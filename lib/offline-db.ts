// lib/offline-db.ts
// IndexedDB para modo offline de Nadin Lencería

// Declaraciones TypeScript para IndexedDB
declare const indexedDB: any;
declare const navigator: any;
declare const window: any;

export interface Product {
  id: number;
  name: string;
  price: number;
  images: string[];
  brand: string | null;
  category: string | null;
  cachedAt: number;
  [key: string]: any;
}

export interface PendingOrder {
  id: string;
  userId: number;
  items: any[];
  total: number;
  customerData: any;
  createdAt: number;
  synced: boolean;
}

class OfflineDatabase {
  private dbName = 'nadin-offline-db';
  private dbVersion = 1;
  private db: any = null;

  // Inicializar la base de datos
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Error al abrir IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB inicializado');
        resolve();
      };

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;

        // Store de productos
        if (!db.objectStoreNames.contains('products')) {
          const productStore = db.createObjectStore('products', { keyPath: 'id' });
          productStore.createIndex('brand', 'brand', { unique: false });
          productStore.createIndex('category', 'category', { unique: false });
          productStore.createIndex('cachedAt', 'cachedAt', { unique: false });
          console.log('📦 Store "products" creado');
        }

        // Store de pedidos pendientes
        if (!db.objectStoreNames.contains('pendingOrders')) {
          const orderStore = db.createObjectStore('pendingOrders', { keyPath: 'id' });
          orderStore.createIndex('synced', 'synced', { unique: false });
          orderStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('📦 Store "pendingOrders" creado');
        }

        // Store de metadata
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
          console.log('📦 Store "metadata" creado');
        }
      };
    });
  }

  // Asegurar que la DB está inicializada
  private async ensureDB(): Promise<any> {
    if (!this.db) {
      await this.init();
    }
    return this.db!;
  }

  // ==================== PRODUCTOS ====================

  // Guardar productos en lote
  async saveProducts(products: Product[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');

    const now = Date.now();

    for (const product of products) {
      store.put({
        ...product,
        cachedAt: now,
      });
    }

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log(`✅ ${products.length} productos guardados en IndexedDB`);
        this.saveMetadata('lastProductSync', now);
        resolve();
      };
      transaction.onerror = () => {
        console.error('Error al guardar productos:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // Obtener todos los productos
  async getProducts(): Promise<Product[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.log(`📦 ${request.result.length} productos obtenidos de IndexedDB`);
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('Error al obtener productos:', request.error);
        reject(request.error);
      };
    });
  }

  // Obtener un producto por ID
  async getProduct(id: number): Promise<Product | undefined> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['products'], 'readonly');
    const store = transaction.objectStore('products');

    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Buscar productos
  async searchProducts(query: string): Promise<Product[]> {
    const products = await this.getProducts();
    const lowerQuery = query.toLowerCase();

    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(lowerQuery) ||
        p.brand?.toLowerCase().includes(lowerQuery) ||
        p.category?.toLowerCase().includes(lowerQuery)
    );
  }

  // Limpiar productos viejos (más de N días)
  async cleanOldProducts(daysOld: number = 7): Promise<number> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['products'], 'readwrite');
    const store = transaction.objectStore('products');
    const index = store.index('cachedAt');

    const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const request = index.openCursor();

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.cachedAt < cutoffDate) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`🗑️ ${deletedCount} productos viejos eliminados`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        console.error('Error al limpiar productos:', request.error);
        reject(request.error);
      };
    });
  }

  // ==================== PEDIDOS PENDIENTES ====================

  // Guardar pedido pendiente (offline)
  async savePendingOrder(order: Omit<PendingOrder, 'synced'>): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pendingOrders'], 'readwrite');
    const store = transaction.objectStore('pendingOrders');

    const pendingOrder: PendingOrder = {
      ...order,
      synced: false,
    };

    return new Promise((resolve, reject) => {
      const request = store.put(pendingOrder);
      request.onsuccess = () => {
        console.log('✅ Pedido guardado como pendiente:', order.id);
        resolve();
      };
      request.onerror = () => {
        console.error('Error al guardar pedido pendiente:', request.error);
        reject(request.error);
      };
    });
  }

  // Obtener pedidos pendientes (no sincronizados)
  async getPendingOrders(): Promise<PendingOrder[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pendingOrders'], 'readonly');
    const store = transaction.objectStore('pendingOrders');
    const index = store.index('synced');

    return new Promise((resolve, reject) => {
      const request = index.getAll(false);
      request.onsuccess = () => {
        console.log(`📋 ${request.result.length} pedidos pendientes`);
        resolve(request.result);
      };
      request.onerror = () => {
        console.error('Error al obtener pedidos pendientes:', request.error);
        reject(request.error);
      };
    });
  }

  // Marcar pedido como sincronizado
  async markOrderSynced(orderId: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pendingOrders'], 'readwrite');
    const store = transaction.objectStore('pendingOrders');

    return new Promise((resolve, reject) => {
      const getRequest = store.get(orderId);

      getRequest.onsuccess = () => {
        const order = getRequest.result;
        if (order) {
          order.synced = true;
          const putRequest = store.put(order);
          putRequest.onsuccess = () => {
            console.log('✅ Pedido marcado como sincronizado:', orderId);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          resolve();
        }
      };

      getRequest.onerror = () => {
        console.error('Error al marcar pedido:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  // Eliminar pedidos sincronizados
  async cleanSyncedOrders(): Promise<number> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['pendingOrders'], 'readwrite');
    const store = transaction.objectStore('pendingOrders');
    const index = store.index('synced');

    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const request = index.openCursor(true);

      request.onsuccess = (event: any) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`🗑️ ${deletedCount} pedidos sincronizados eliminados`);
          resolve(deletedCount);
        }
      };

      request.onerror = () => {
        console.error('Error al limpiar pedidos:', request.error);
        reject(request.error);
      };
    });
  }

  // ==================== METADATA ====================

  // Guardar metadata
  async saveMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['metadata'], 'readwrite');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.put({ key, value, updatedAt: Date.now() });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Obtener metadata
  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['metadata'], 'readonly');
    const store = transaction.objectStore('metadata');

    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }

  // Limpiar toda la base de datos
  async clearAll(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction(['products', 'pendingOrders', 'metadata'], 'readwrite');

    transaction.objectStore('products').clear();
    transaction.objectStore('pendingOrders').clear();
    transaction.objectStore('metadata').clear();

    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => {
        console.log('🗑️ Base de datos limpiada completamente');
        resolve();
      };
      transaction.onerror = () => {
        console.error('Error al limpiar base de datos:', transaction.error);
        reject(transaction.error);
      };
    });
  }

  // Obtener estadísticas
  async getStats(): Promise<{
    totalProducts: number;
    pendingOrders: number;
    lastSync: number | null;
    dbSize: string;
  }> {
    const db = await this.ensureDB();

    const productsCount = await new Promise<number>((resolve) => {
      const request = db.transaction(['products'], 'readonly').objectStore('products').count();
      request.onsuccess = () => resolve(request.result);
    });

    const ordersCount = await new Promise<number>((resolve) => {
      const request = db
        .transaction(['pendingOrders'], 'readonly')
        .objectStore('pendingOrders')
        .index('synced')
        .count(false);
      request.onsuccess = () => resolve(request.result);
    });

    const lastSync = await this.getMetadata('lastProductSync');

    let estimatedSize = 'desconocido';
    if (typeof navigator !== 'undefined' && 'storage' in (navigator as any)) {
      const estimate = await (navigator as any).storage.estimate();
      if (estimate.usage) {
        const mb = (estimate.usage / (1024 * 1024)).toFixed(2);
        estimatedSize = `${mb} MB`;
      }
    }

    return {
      totalProducts: productsCount,
      pendingOrders: ordersCount,
      lastSync,
      dbSize: estimatedSize,
    };
  }
}

// Instancia singleton
export const offlineDB = new OfflineDatabase();

// Inicializar automáticamente cuando se importe
if (typeof window !== 'undefined') {
  offlineDB.init().catch(console.error);
}