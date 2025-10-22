/**
 * 离线缓存管理器
 * 
 * 功能：
 * 1. 统一管理离线数据缓存（IndexedDB + localStorage）
 * 2. LRU淘汰策略，容量限制
 * 3. 数据过期管理
 * 4. 离线队列管理
 * 5. 自动同步机制
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

// 缓存配置
const CACHE_CONFIG = {
  // 数据库名称
  DB_NAME: 'CraneHeartCache',
  DB_VERSION: 1,
  
  // 存储对象名称
  STORES: {
    SCALES: 'scales',           // 量表数据
    RESULTS: 'results',         // 评估结果
    CHATS: 'chats',            // 聊天记录
    MUSIC: 'music',            // 音乐数据
    GENERAL: 'general'         // 通用缓存
  },
  
  // 容量限制（MB）
  MAX_SIZE: {
    SCALES: 10,
    RESULTS: 20,
    CHATS: 50,
    MUSIC: 100,
    GENERAL: 30
  },
  
  // 默认过期时间（毫秒）
  DEFAULT_TTL: 7 * 24 * 60 * 60 * 1000, // 7天
  
  // LRU缓存大小
  LRU_SIZE: 100
};

/**
 * IndexedDB封装类
 */
class IndexedDBHelper {
  constructor() {
    this.db = null;
    this.isSupported = this.checkSupport();
  }
  
  /**
   * 检查IndexedDB支持
   */
  checkSupport() {
    // #ifdef H5
    return typeof indexedDB !== 'undefined';
    // #endif
    
    // #ifndef H5
    return false;
    // #endif
  }
  
  /**
   * 初始化数据库
   */
  async init() {
    if (!this.isSupported) {
      console.log('[CacheManager] IndexedDB不支持，使用localStorage降级');
      return false;
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION);
      
      request.onerror = () => {
        console.error('[CacheManager] 数据库打开失败:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[CacheManager] 数据库打开成功');
        resolve(true);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建存储对象
        Object.values(CACHE_CONFIG.STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('expireAt', 'expireAt', { unique: false });
            store.createIndex('size', 'size', { unique: false });
            console.log(`[CacheManager] 创建存储对象: ${storeName}`);
          }
        });
      };
    });
    // #endif
    
    // #ifndef H5
    return false;
    // #endif
  }
  
  /**
   * 获取数据
   */
  async get(storeName, key) {
    if (!this.isSupported || !this.db) {
      return this.getFromLocalStorage(storeName, key);
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);
      
      request.onsuccess = () => {
        const record = request.result;
        
        if (!record) {
          resolve(null);
          return;
        }
        
        // 检查是否过期
        if (record.expireAt && Date.now() > record.expireAt) {
          this.delete(storeName, key); // 异步删除过期数据
          resolve(null);
          return;
        }
        
        // 更新访问时间（LRU）
        record.lastAccess = Date.now();
        this.put(storeName, key, record.value, record.expireAt - Date.now());
        
        resolve(record.value);
      };
      
      request.onerror = () => {
        console.error('[CacheManager] 读取失败:', request.error);
        reject(request.error);
      };
    });
    // #endif
    
    // #ifndef H5
    return this.getFromLocalStorage(storeName, key);
    // #endif
  }
  
  /**
   * 存储数据
   */
  async put(storeName, key, value, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    if (!this.isSupported || !this.db) {
      return this.putToLocalStorage(storeName, key, value, ttl);
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const record = {
        key,
        value,
        timestamp: Date.now(),
        lastAccess: Date.now(),
        expireAt: ttl > 0 ? Date.now() + ttl : null,
        size: this.calculateSize(value)
      };
      
      const request = store.put(record);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('[CacheManager] 存储失败:', request.error);
        reject(request.error);
      };
    });
    // #endif
    
    // #ifndef H5
    return this.putToLocalStorage(storeName, key, value, ttl);
    // #endif
  }
  
  /**
   * 删除数据
   */
  async delete(storeName, key) {
    if (!this.isSupported || !this.db) {
      return this.deleteFromLocalStorage(storeName, key);
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('[CacheManager] 删除失败:', request.error);
        reject(request.error);
      };
    });
    // #endif
    
    // #ifndef H5
    return this.deleteFromLocalStorage(storeName, key);
    // #endif
  }
  
  /**
   * 清空存储对象
   */
  async clear(storeName) {
    if (!this.isSupported || !this.db) {
      return this.clearLocalStorage(storeName);
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();
      
      request.onsuccess = () => {
        console.log(`[CacheManager] 清空存储: ${storeName}`);
        resolve(true);
      };
      
      request.onerror = () => {
        console.error('[CacheManager] 清空失败:', request.error);
        reject(request.error);
      };
    });
    // #endif
    
    // #ifndef H5
    return this.clearLocalStorage(storeName);
    // #endif
  }
  
  /**
   * 获取所有键
   */
  async getAllKeys(storeName) {
    if (!this.isSupported || !this.db) {
      return this.getAllKeysFromLocalStorage(storeName);
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAllKeys();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        console.error('[CacheManager] 获取键列表失败:', request.error);
        reject(request.error);
      };
    });
    // #endif
    
    // #ifndef H5
    return this.getAllKeysFromLocalStorage(storeName);
    // #endif
  }
  
  /**
   * 获取存储大小
   */
  async getStoreSize(storeName) {
    if (!this.isSupported || !this.db) {
      return this.getLocalStorageSize(storeName);
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const records = request.result;
        const totalSize = records.reduce((sum, record) => sum + (record.size || 0), 0);
        resolve(totalSize);
      };
      
      request.onerror = () => {
        console.error('[CacheManager] 获取存储大小失败:', request.error);
        reject(request.error);
      };
    });
    // #endif
    
    // #ifndef H5
    return this.getLocalStorageSize(storeName);
    // #endif
  }
  
  /**
   * LRU淘汰
   */
  async evictLRU(storeName, targetSize) {
    if (!this.isSupported || !this.db) {
      return;
    }
    
    // #ifdef H5
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        const records = request.result;
        
        // 按最后访问时间排序
        records.sort((a, b) => a.lastAccess - b.lastAccess);
        
        let currentSize = records.reduce((sum, r) => sum + (r.size || 0), 0);
        const itemsToDelete = [];
        
        // 删除最少使用的记录，直到低于目标大小
        for (const record of records) {
          if (currentSize <= targetSize) break;
          
          itemsToDelete.push(record.key);
          currentSize -= (record.size || 0);
        }
        
        // 执行删除
        const deletePromises = itemsToDelete.map(key => this.delete(storeName, key));
        Promise.all(deletePromises).then(() => {
          console.log(`[CacheManager] LRU淘汰完成，删除${itemsToDelete.length}项`);
          resolve(itemsToDelete.length);
        });
      };
      
      request.onerror = () => {
        console.error('[CacheManager] LRU淘汰失败:', request.error);
        reject(request.error);
      };
    });
    // #endif
  }
  
  /**
   * 计算数据大小（字节）
   */
  calculateSize(data) {
    try {
      const str = JSON.stringify(data);
      return new Blob([str]).size;
    } catch (e) {
      return 0;
    }
  }
  
  // ==================== localStorage降级方法 ====================
  
  /**
   * 从localStorage获取
   */
  getFromLocalStorage(storeName, key) {
    try {
      const fullKey = `${CACHE_CONFIG.DB_NAME}_${storeName}_${key}`;
      const recordStr = uni.getStorageSync(fullKey);
      
      if (!recordStr) return null;
      
      const record = JSON.parse(recordStr);
      
      // 检查过期
      if (record.expireAt && Date.now() > record.expireAt) {
        uni.removeStorageSync(fullKey);
        return null;
      }
      
      return record.value;
    } catch (e) {
      console.error('[CacheManager] localStorage读取失败:', e);
      return null;
    }
  }
  
  /**
   * 存储到localStorage
   */
  putToLocalStorage(storeName, key, value, ttl) {
    try {
      const fullKey = `${CACHE_CONFIG.DB_NAME}_${storeName}_${key}`;
      const record = {
        key,
        value,
        timestamp: Date.now(),
        expireAt: ttl > 0 ? Date.now() + ttl : null
      };
      
      uni.setStorageSync(fullKey, JSON.stringify(record));
      return true;
    } catch (e) {
      console.error('[CacheManager] localStorage存储失败:', e);
      return false;
    }
  }
  
  /**
   * 从localStorage删除
   */
  deleteFromLocalStorage(storeName, key) {
    try {
      const fullKey = `${CACHE_CONFIG.DB_NAME}_${storeName}_${key}`;
      uni.removeStorageSync(fullKey);
      return true;
    } catch (e) {
      console.error('[CacheManager] localStorage删除失败:', e);
      return false;
    }
  }
  
  /**
   * 清空localStorage中的存储对象
   */
  clearLocalStorage(storeName) {
    try {
      const info = uni.getStorageInfoSync();
      const prefix = `${CACHE_CONFIG.DB_NAME}_${storeName}_`;
      
      info.keys.forEach(key => {
        if (key.startsWith(prefix)) {
          uni.removeStorageSync(key);
        }
      });
      
      return true;
    } catch (e) {
      console.error('[CacheManager] localStorage清空失败:', e);
      return false;
    }
  }
  
  /**
   * 获取localStorage中的所有键
   */
  getAllKeysFromLocalStorage(storeName) {
    try {
      const info = uni.getStorageInfoSync();
      const prefix = `${CACHE_CONFIG.DB_NAME}_${storeName}_`;
      
      return info.keys
        .filter(key => key.startsWith(prefix))
        .map(key => key.replace(prefix, ''));
    } catch (e) {
      console.error('[CacheManager] localStorage获取键列表失败:', e);
      return [];
    }
  }
  
  /**
   * 获取localStorage存储大小
   */
  getLocalStorageSize(storeName) {
    try {
      const keys = this.getAllKeysFromLocalStorage(storeName);
      let totalSize = 0;
      
      keys.forEach(key => {
        const fullKey = `${CACHE_CONFIG.DB_NAME}_${storeName}_${key}`;
        const value = uni.getStorageSync(fullKey);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      });
      
      return totalSize;
    } catch (e) {
      console.error('[CacheManager] localStorage获取大小失败:', e);
      return 0;
    }
  }
}

/**
 * 缓存管理器类
 */
class CacheManager {
  constructor() {
    this.db = new IndexedDBHelper();
    this.initialized = false;
    this.offlineQueue = []; // 离线队列
    this.syncInProgress = false;
  }
  
  /**
   * 初始化
   */
  async init() {
    if (this.initialized) return;
    
    try {
      await this.db.init();
      this.initialized = true;
      console.log('[CacheManager] 初始化完成');
      
      // 启动清理任务
      this.startCleanupTask();
      
      // 监听网络状态
      this.setupNetworkListener();
    } catch (e) {
      console.error('[CacheManager] 初始化失败:', e);
      this.initialized = true; // 即使失败也标记为已初始化，使用localStorage降级
    }
  }
  
  /**
   * 缓存量表数据
   */
  async cacheScale(scaleId, scaleData) {
    await this.ensureInitialized();
    
    try {
      await this.db.put(CACHE_CONFIG.STORES.SCALES, scaleId, scaleData);
      console.log(`[CacheManager] 量表缓存成功: ${scaleId}`);
      
      // 检查容量
      await this.checkAndEvict(CACHE_CONFIG.STORES.SCALES);
      
      return true;
    } catch (e) {
      console.error(`[CacheManager] 量表缓存失败: ${scaleId}`, e);
      return false;
    }
  }
  
  /**
   * 获取缓存的量表
   */
  async getScale(scaleId) {
    await this.ensureInitialized();
    
    try {
      const scaleData = await this.db.get(CACHE_CONFIG.STORES.SCALES, scaleId);
      
      if (scaleData) {
        console.log(`[CacheManager] 量表命中缓存: ${scaleId}`);
      }
      
      return scaleData;
    } catch (e) {
      console.error(`[CacheManager] 获取量表失败: ${scaleId}`, e);
      return null;
    }
  }
  
  /**
   * 缓存评估结果
   */
  async cacheResult(resultId, resultData) {
    await this.ensureInitialized();
    
    try {
      await this.db.put(CACHE_CONFIG.STORES.RESULTS, resultId, resultData);
      console.log(`[CacheManager] 结果缓存成功: ${resultId}`);
      
      await this.checkAndEvict(CACHE_CONFIG.STORES.RESULTS);
      
      return true;
    } catch (e) {
      console.error(`[CacheManager] 结果缓存失败: ${resultId}`, e);
      return false;
    }
  }
  
  /**
   * 获取缓存的结果
   */
  async getResult(resultId) {
    await this.ensureInitialized();
    
    try {
      return await this.db.get(CACHE_CONFIG.STORES.RESULTS, resultId);
    } catch (e) {
      console.error(`[CacheManager] 获取结果失败: ${resultId}`, e);
      return null;
    }
  }
  
  /**
   * 添加到离线队列
   */
  async addToOfflineQueue(action, data) {
    await this.ensureInitialized();
    
    const queueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      data,
      timestamp: Date.now(),
      retryCount: 0
    };
    
    this.offlineQueue.push(queueItem);
    
    // 持久化队列
    await this.saveOfflineQueue();
    
    console.log(`[CacheManager] 添加到离线队列: ${action}`, queueItem.id);
    
    return queueItem.id;
  }
  
  /**
   * 保存离线队列
   */
  async saveOfflineQueue() {
    try {
      await this.db.put(CACHE_CONFIG.STORES.GENERAL, 'offline_queue', this.offlineQueue, 0);
    } catch (e) {
      console.error('[CacheManager] 保存离线队列失败:', e);
    }
  }
  
  /**
   * 加载离线队列
   */
  async loadOfflineQueue() {
    try {
      const queue = await this.db.get(CACHE_CONFIG.STORES.GENERAL, 'offline_queue');
      this.offlineQueue = queue || [];
      console.log(`[CacheManager] 加载离线队列: ${this.offlineQueue.length}项`);
    } catch (e) {
      console.error('[CacheManager] 加载离线队列失败:', e);
      this.offlineQueue = [];
    }
  }
  
  /**
   * 同步离线队列
   */
  async syncOfflineQueue() {
    if (this.syncInProgress || this.offlineQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    console.log(`[CacheManager] 开始同步离线队列: ${this.offlineQueue.length}项`);
    
    const successIds = [];
    const failedItems = [];
    
    for (const item of this.offlineQueue) {
      try {
        // 根据action类型执行同步
        const success = await this.syncQueueItem(item);
        
        if (success) {
          successIds.push(item.id);
        } else {
          item.retryCount++;
          if (item.retryCount < 3) {
            failedItems.push(item);
          }
        }
      } catch (e) {
        console.error('[CacheManager] 同步队列项失败:', item.id, e);
        item.retryCount++;
        if (item.retryCount < 3) {
          failedItems.push(item);
        }
      }
    }
    
    // 更新队列
    this.offlineQueue = failedItems;
    await this.saveOfflineQueue();
    
    console.log(`[CacheManager] 同步完成: 成功${successIds.length}项, 失败${failedItems.length}项`);
    
    this.syncInProgress = false;
    
    return {
      success: successIds.length,
      failed: failedItems.length
    };
  }
  
  /**
   * 同步单个队列项
   */
  async syncQueueItem(item) {
    // 这里需要根据具体的action类型调用相应的API
    // 预留接口，由业务层实现具体逻辑
    
    switch (item.action) {
      case 'save_assessment':
        // 调用保存评估结果的API
        return await this.syncAssessment(item.data);
        
      case 'save_chat':
        // 调用保存聊天记录的API
        return await this.syncChat(item.data);
        
      default:
        console.warn('[CacheManager] 未知的同步操作:', item.action);
        return false;
    }
  }
  
  /**
   * 同步评估结果（预留接口）
   */
  async syncAssessment(data) {
    // 由业务层实现
    console.log('[CacheManager] 同步评估结果（预留）:', data);
    return true;
  }
  
  /**
   * 同步聊天记录（预留接口）
   */
  async syncChat(data) {
    // 由业务层实现
    console.log('[CacheManager] 同步聊天记录（预留）:', data);
    return true;
  }
  
  /**
   * 检查容量并淘汰
   */
  async checkAndEvict(storeName) {
    try {
      const currentSize = await this.db.getStoreSize(storeName);
      const maxSize = (CACHE_CONFIG.MAX_SIZE[storeName.toUpperCase()] || 30) * 1024 * 1024; // MB转字节
      
      if (currentSize > maxSize) {
        const targetSize = maxSize * 0.8; // 淘汰到80%
        await this.db.evictLRU(storeName, targetSize);
        console.log(`[CacheManager] 容量超限，执行LRU淘汰: ${storeName}`);
      }
    } catch (e) {
      console.error(`[CacheManager] 检查容量失败: ${storeName}`, e);
    }
  }
  
  /**
   * 启动清理任务
   */
  startCleanupTask() {
    // 每小时清理一次过期数据
    setInterval(() => {
      this.cleanupExpired();
    }, 60 * 60 * 1000);
    
    // 立即执行一次
    this.cleanupExpired();
  }
  
  /**
   * 清理过期数据
   */
  async cleanupExpired() {
    console.log('[CacheManager] 开始清理过期数据');
    
    for (const storeName of Object.values(CACHE_CONFIG.STORES)) {
      try {
        const keys = await this.db.getAllKeys(storeName);
        
        for (const key of keys) {
          // get方法会自动检查过期并删除
          await this.db.get(storeName, key);
        }
      } catch (e) {
        console.error(`[CacheManager] 清理失败: ${storeName}`, e);
      }
    }
    
    console.log('[CacheManager] 过期数据清理完成');
  }
  
  /**
   * 监听网络状态
   */
  setupNetworkListener() {
    uni.onNetworkStatusChange((res) => {
      console.log('[CacheManager] 网络状态变化:', res.isConnected ? '在线' : '离线');
      
      if (res.isConnected) {
        // 网络恢复，尝试同步
        this.loadOfflineQueue().then(() => {
          this.syncOfflineQueue();
        });
      }
    });
  }
  
  /**
   * 获取缓存统计
   */
  async getStats() {
    await this.ensureInitialized();
    
    const stats = {};
    
    for (const [name, storeName] of Object.entries(CACHE_CONFIG.STORES)) {
      try {
        const keys = await this.db.getAllKeys(storeName);
        const size = await this.db.getStoreSize(storeName);
        
        stats[name] = {
          count: keys.length,
          size: size,
          sizeFormatted: this.formatSize(size)
        };
      } catch (e) {
        stats[name] = { count: 0, size: 0, sizeFormatted: '0 B' };
      }
    }
    
    stats.offlineQueue = this.offlineQueue.length;
    
    return stats;
  }
  
  /**
   * 格式化大小
   */
  formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
  
  /**
   * 清空所有缓存
   */
  async clearAll() {
    await this.ensureInitialized();
    
    for (const storeName of Object.values(CACHE_CONFIG.STORES)) {
      await this.db.clear(storeName);
    }
    
    this.offlineQueue = [];
    await this.saveOfflineQueue();
    
    console.log('[CacheManager] 所有缓存已清空');
  }
  
  /**
   * 确保已初始化
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await this.init();
    }
  }
}

// 导出单例
const cacheManager = new CacheManager();

export default cacheManager;
export { CACHE_CONFIG };

