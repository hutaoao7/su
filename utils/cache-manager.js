/**
 * 缓存管理器
 * 
 * 功能：
 * 1. IndexedDB封装
 * 2. 本地存储管理
 * 3. 网络状态检测
 * 4. 自动同步机制
 * 5. 冲突处理
 */

const DB_NAME = 'CraneHeartDB';
const DB_VERSION = 1;

// 数据库存储对象
const STORES = {
  scales: 'scales',           // 量表数据
  assessments: 'assessments', // 评估结果
  chats: 'chats',             // 聊天记录
  music: 'music',             // 音乐数据
  sync_queue: 'sync_queue'    // 同步队列
};

let db = null;
let isOnline = true;

/**
 * 初始化IndexedDB
 */
export async function initDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      console.log('[CACHE] IndexedDB初始化成功');
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = event.target.result;

      // 创建存储对象
      Object.values(STORES).forEach(storeName => {
        if (!database.objectStoreNames.contains(storeName)) {
          const store = database.createObjectStore(storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('synced', 'synced', { unique: false });
        }
      });

      console.log('[CACHE] 数据库结构已创建');
    };
  });
}

/**
 * 保存数据到IndexedDB
 */
export async function saveToCache(storeName, data) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);

    const item = {
      ...data,
      timestamp: Date.now(),
      synced: false
    };

    const request = store.put(item);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log(`[CACHE] 数据已保存到${storeName}:`, item.id);
      resolve(item);
    };
  });
}

/**
 * 从IndexedDB读取数据
 */
export async function getFromCache(storeName, id) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * 获取所有缓存数据
 */
export async function getAllFromCache(storeName) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * 删除缓存数据
 */
export async function deleteFromCache(storeName, id) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log(`[CACHE] 数据已删除:${storeName}/${id}`);
      resolve();
    };
  });
}

/**
 * 清空存储对象
 */
export async function clearStore(storeName) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      console.log(`[CACHE] ${storeName}已清空`);
      resolve();
    };
  });
}

/**
 * 添加到同步队列
 */
export async function addToSyncQueue(action, data) {
  const item = {
    id: `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    action,
    data,
    timestamp: Date.now(),
    synced: false,
    retries: 0
  };

  return saveToCache(STORES.sync_queue, item);
}

/**
 * 获取待同步的数据
 */
export async function getPendingSyncItems() {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORES.sync_queue], 'readonly');
    const store = transaction.objectStore(STORES.sync_queue);
    const index = store.index('synced');
    const request = index.getAll(false);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

/**
 * 标记为已同步
 */
export async function markAsSynced(storeName, id) {
  if (!db) await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const item = getRequest.result;
      if (item) {
        item.synced = true;
        item.syncedAt = Date.now();
        const putRequest = store.put(item);

        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => {
          console.log(`[CACHE] 数据已标记为已同步:${storeName}/${id}`);
          resolve(item);
        };
      } else {
        reject(new Error('数据不存在'));
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

/**
 * 检测网络状态
 */
export function initNetworkDetection() {
  // 监听在线事件
  window.addEventListener('online', () => {
    isOnline = true;
    console.log('[CACHE] 网络已连接');
    uni.showToast({
      title: '网络已连接',
      icon: 'success',
      duration: 1500
    });
    // 触发同步
    triggerSync();
  });

  // 监听离线事件
  window.addEventListener('offline', () => {
    isOnline = false;
    console.log('[CACHE] 网络已断开');
    uni.showToast({
      title: '网络已断开，将在恢复后自动同步',
      icon: 'none',
      duration: 2000
    });
  });
}

/**
 * 获取网络状态
 */
export function isNetworkOnline() {
  return isOnline && navigator.onLine;
}

/**
 * 触发同步
 */
export async function triggerSync() {
  if (!isNetworkOnline()) {
    console.log('[CACHE] 网络离线，跳过同步');
    return;
  }

  try {
    const pendingItems = await getPendingSyncItems();
    console.log(`[CACHE] 发现${pendingItems.length}条待同步数据`);

    for (const item of pendingItems) {
      try {
        // 调用云函数同步
        await uni.callFunction({
          name: 'offline-sync',
          data: {
            action: item.action,
            payload: item.data
          }
        });

        // 标记为已同步
        await markAsSynced(STORES.sync_queue, item.id);
        console.log(`[CACHE] 数据已同步:${item.id}`);
      } catch (error) {
        console.error(`[CACHE] 同步失败:${item.id}`, error);
        // 增加重试次数
        item.retries = (item.retries || 0) + 1;
        if (item.retries < 3) {
          await saveToCache(STORES.sync_queue, item);
        }
      }
    }
  } catch (error) {
    console.error('[CACHE] 同步过程出错:', error);
  }
}

/**
 * 获取缓存统计信息
 */
export async function getCacheStats() {
  const stats = {};

  for (const [key, storeName] of Object.entries(STORES)) {
    try {
      const items = await getAllFromCache(storeName);
      stats[key] = {
        count: items.length,
        size: JSON.stringify(items).length
      };
    } catch (error) {
      stats[key] = { count: 0, size: 0, error: error.message };
    }
  }

  return stats;
}

/**
 * 清理过期缓存
 */
export async function cleanupExpiredCache(maxAge = 7 * 24 * 60 * 60 * 1000) {
  const now = Date.now();
  const expiredTime = now - maxAge;

  for (const storeName of Object.values(STORES)) {
    try {
      const items = await getAllFromCache(storeName);
      const expiredItems = items.filter(item => item.timestamp < expiredTime);

      for (const item of expiredItems) {
        await deleteFromCache(storeName, item.id);
      }

      if (expiredItems.length > 0) {
        console.log(`[CACHE] 清理${storeName}中的${expiredItems.length}条过期数据`);
      }
    } catch (error) {
      console.error(`[CACHE] 清理${storeName}失败:`, error);
    }
  }
}

/**
 * 导出缓存数据
 */
export async function exportCacheData() {
  const data = {};

  for (const [key, storeName] of Object.entries(STORES)) {
    try {
      data[key] = await getAllFromCache(storeName);
    } catch (error) {
      console.error(`[CACHE] 导出${storeName}失败:`, error);
    }
  }

  return data;
}

/**
 * 导入缓存数据
 */
export async function importCacheData(data) {
  for (const [key, items] of Object.entries(data)) {
    const storeName = STORES[key];
    if (storeName && Array.isArray(items)) {
      try {
        for (const item of items) {
          await saveToCache(storeName, item);
        }
        console.log(`[CACHE] 导入${storeName}成功:${items.length}条数据`);
      } catch (error) {
        console.error(`[CACHE] 导入${storeName}失败:`, error);
      }
    }
  }
}

