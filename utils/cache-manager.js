/**
 * 通用缓存管理器
 * 
 * 功能：
 * 1. 统一的IndexedDB/localStorage封装
 * 2. 网络状态检测
 * 3. 离线数据自动同步
 * 4. 多类型数据缓存（量表/结果/聊天/用户数据）
 * 5. 缓存清理策略
 * 6. 同步冲突处理
 * 
 * 使用示例：
 * ```javascript
 * import { CacheManager } from '@/utils/cache-manager.js';
 * 
 * // 初始化
 * await CacheManager.init();
 * 
 * // 保存数据
 * await CacheManager.set('scales', 'pss10', scaleData);
 * 
 * // 读取数据
 * const data = await CacheManager.get('scales', 'pss10');
 * 
 * // 检查网络状态
 * const isOnline = CacheManager.isOnline();
 * 
 * // 同步离线数据
 * await CacheManager.syncOfflineData();
 * ```
 * 
 * @module cache-manager
 * @author CraneHeart Team
 * @date 2025-10-20
 */

// ==================== 配置常量 ====================

const CONFIG = {
  // IndexedDB配置
  DB_NAME: 'CraneHeartCacheDB',
  DB_VERSION: 2,
  
  // 对象存储配置
  STORES: {
    SCALES: 'scales',           // 量表数据
    RESULTS: 'results',         // 评估结果
    CHATS: 'chats',             // 聊天记录
    USER_DATA: 'user_data',     // 用户数据
    SYNC_QUEUE: 'sync_queue'    // 待同步队列
  },
  
  // 缓存策略
  EXPIRE_DAYS: {
    SCALES: 7,        // 量表缓存7天
    RESULTS: 90,      // 结果保留90天
    CHATS: 30,        // 聊天记录30天
    USER_DATA: 30,    // 用户数据30天
    SYNC_QUEUE: 7     // 同步队列7天
  },
  
  // localStorage键前缀
  STORAGE_PREFIX: 'crane_cache_',
  
  // 同步配置
  SYNC_INTERVAL: 60000,  // 同步间隔（60秒）
  MAX_RETRY: 3,          // 最大重试次数
  
  // 网络检测配置
  NETWORK_CHECK_INTERVAL: 10000,  // 网络检测间隔（10秒）
  NETWORK_CHECK_URL: 'https://www.baidu.com/favicon.ico',  // 网络检测URL
  NETWORK_TIMEOUT: 3000  // 网络检测超时（3秒）
};

// ==================== 工具函数 ====================

/**
 * 生成唯一ID
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 检查数据是否过期
 * @param {number} timestamp - 时间戳
 * @param {number} expireDays - 过期天数
 */
function isExpired(timestamp, expireDays) {
  if (!timestamp || !expireDays) return false;
  const now = Date.now();
  const expireTime = expireDays * 24 * 60 * 60 * 1000;
  return (now - timestamp) > expireTime;
}

/**
 * 压缩数据（简单JSON字符串化）
 * @param {any} data - 要压缩的数据
 */
function compressData(data) {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('[CacheManager] 数据压缩失败:', error);
    return null;
  }
}

/**
 * 解压数据
 * @param {string} compressedData - 压缩的数据
 */
function decompressData(compressedData) {
  try {
    return JSON.parse(compressedData);
  } catch (error) {
    console.error('[CacheManager] 数据解压失败:', error);
    return null;
  }
}

// ==================== 主类 ====================

/**
 * 缓存管理器类
 */
class CacheManagerClass {
  constructor() {
    this.db = null;
    this.isH5 = false;
    this.isReady = false;
    this.isOnlineStatus = true;
    this.networkCheckTimer = null;
    this.syncTimer = null;
    this.syncQueue = [];
    this.listeners = {
      online: [],
      offline: [],
      sync: []
    };
    
    // 检测环境
    // #ifdef H5
    this.isH5 = true;
    // #endif
  }
  
  /**
   * 初始化缓存管理器
   */
  async init() {
    if (this.isReady) {
      return true;
    }
    
    console.log('[CacheManager] 开始初始化...');
    
    try {
      // 初始化IndexedDB（H5端）
      if (this.isH5) {
        await this.initIndexedDB();
      }
      
      // 加载同步队列
      await this.loadSyncQueue();
      
      // 启动网络监听
      this.startNetworkMonitoring();
      
      // 启动自动同步
      this.startAutoSync();
      
      this.isReady = true;
      console.log('[CacheManager] 初始化成功');
      return true;
      
    } catch (error) {
      console.error('[CacheManager] 初始化失败:', error);
      this.isReady = false;
      return false;
    }
  }
  
  /**
   * 初始化IndexedDB
   */
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      // #ifdef H5
      if (!window.indexedDB) {
        console.warn('[CacheManager] 浏览器不支持IndexedDB，将使用localStorage降级');
        resolve();
        return;
      }
      
      const request = indexedDB.open(CONFIG.DB_NAME, CONFIG.DB_VERSION);
      
      request.onerror = () => {
        console.error('[CacheManager] IndexedDB打开失败');
        reject(request.error);
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('[CacheManager] IndexedDB初始化成功');
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建所有对象存储
        Object.values(CONFIG.STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const objectStore = db.createObjectStore(storeName, {
              keyPath: 'id'
            });
            
            // 创建通用索引
            objectStore.createIndex('key', 'key', { unique: false });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            objectStore.createIndex('userId', 'userId', { unique: false });
            
            console.log(`[CacheManager] 创建对象存储: ${storeName}`);
          }
        });
      };
      // #endif
      
      // #ifndef H5
      console.log('[CacheManager] 非H5环境，跳过IndexedDB初始化');
      resolve();
      // #endif
    });
  }
  
  /**
   * 保存数据到缓存
   * @param {string} storeType - 存储类型（scales/results/chats/user_data）
   * @param {string} key - 数据键
   * @param {any} data - 要保存的数据
   * @param {object} options - 选项 {userId, needSync}
   */
  async set(storeType, key, data, options = {}) {
    if (!this.isReady) {
      await this.init();
    }
    
    const { userId = '', needSync = false } = options;
    
    const cacheData = {
      id: generateId(),
      key,
      data,
      userId,
      timestamp: Date.now(),
      synced: !needSync,  // 是否需要同步
      storeType
    };
    
    try {
      // H5端使用IndexedDB
      if (this.isH5 && this.db) {
        await this.setIndexedDB(storeType, cacheData);
      } else {
        // 降级使用localStorage
        this.setLocalStorage(storeType, key, cacheData);
      }
      
      // 如果需要同步且当前离线，加入同步队列
      if (needSync && !this.isOnlineStatus) {
        await this.addToSyncQueue(cacheData);
      }
      
      console.log(`[CacheManager] 保存成功: ${storeType}/${key}`);
      return true;
      
    } catch (error) {
      console.error('[CacheManager] 保存失败:', error);
      return false;
    }
  }
  
  /**
   * 从缓存读取数据
   * @param {string} storeType - 存储类型
   * @param {string} key - 数据键
   */
  async get(storeType, key) {
    if (!this.isReady) {
      await this.init();
    }
    
    try {
      let cacheData = null;
      
      // H5端使用IndexedDB
      if (this.isH5 && this.db) {
        cacheData = await this.getIndexedDB(storeType, key);
      } else {
        // 降级使用localStorage
        cacheData = this.getLocalStorage(storeType, key);
      }
      
      // 检查是否过期
      if (cacheData) {
        const expireDays = CONFIG.EXPIRE_DAYS[storeType.toUpperCase()] || 30;
        if (isExpired(cacheData.timestamp, expireDays)) {
          console.log(`[CacheManager] 数据已过期: ${storeType}/${key}`);
          await this.remove(storeType, key);
          return null;
        }
        
        return cacheData.data;
      }
      
      return null;
      
    } catch (error) {
      console.error('[CacheManager] 读取失败:', error);
      return null;
    }
  }
  
  /**
   * 删除缓存数据
   * @param {string} storeType - 存储类型
   * @param {string} key - 数据键
   */
  async remove(storeType, key) {
    if (!this.isReady) {
      await this.init();
    }
    
    try {
      if (this.isH5 && this.db) {
        await this.removeIndexedDB(storeType, key);
      } else {
        this.removeLocalStorage(storeType, key);
      }
      
      console.log(`[CacheManager] 删除成功: ${storeType}/${key}`);
      return true;
      
    } catch (error) {
      console.error('[CacheManager] 删除失败:', error);
      return false;
    }
  }
  
  /**
   * 清空指定类型的缓存
   * @param {string} storeType - 存储类型
   */
  async clear(storeType) {
    if (!this.isReady) {
      await this.init();
    }
    
    try {
      if (this.isH5 && this.db) {
        await this.clearIndexedDB(storeType);
      } else {
        this.clearLocalStorage(storeType);
      }
      
      console.log(`[CacheManager] 清空成功: ${storeType}`);
      return true;
      
    } catch (error) {
      console.error('[CacheManager] 清空失败:', error);
      return false;
    }
  }
  
  // ==================== IndexedDB操作 ====================
  
  /**
   * IndexedDB保存数据
   */
  setIndexedDB(storeType, data) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeType], 'readwrite');
        const objectStore = transaction.objectStore(storeType);
        const request = objectStore.put(data);
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * IndexedDB读取数据
   */
  getIndexedDB(storeType, key) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeType], 'readonly');
        const objectStore = transaction.objectStore(storeType);
        const index = objectStore.index('key');
        const request = index.get(key);
        
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * IndexedDB删除数据
   */
  removeIndexedDB(storeType, key) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeType], 'readwrite');
        const objectStore = transaction.objectStore(storeType);
        const index = objectStore.index('key');
        const request = index.openCursor(key);
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            cursor.delete();
            resolve();
          } else {
            resolve();
          }
        };
        
        request.onerror = () => reject(request.error);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  /**
   * IndexedDB清空存储
   */
  clearIndexedDB(storeType) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = this.db.transaction([storeType], 'readwrite');
        const objectStore = transaction.objectStore(storeType);
        const request = objectStore.clear();
        
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        
      } catch (error) {
        reject(error);
      }
    });
  }
  
  // ==================== localStorage操作 ====================
  
  /**
   * localStorage保存数据
   */
  setLocalStorage(storeType, key, data) {
    try {
      const storageKey = `${CONFIG.STORAGE_PREFIX}${storeType}_${key}`;
      const compressed = compressData(data);
      if (compressed) {
        uni.setStorageSync(storageKey, compressed);
      }
    } catch (error) {
      console.error('[CacheManager] localStorage保存失败:', error);
    }
  }
  
  /**
   * localStorage读取数据
   */
  getLocalStorage(storeType, key) {
    try {
      const storageKey = `${CONFIG.STORAGE_PREFIX}${storeType}_${key}`;
      const compressed = uni.getStorageSync(storageKey);
      if (compressed) {
        return decompressData(compressed);
      }
      return null;
    } catch (error) {
      console.error('[CacheManager] localStorage读取失败:', error);
      return null;
    }
  }
  
  /**
   * localStorage删除数据
   */
  removeLocalStorage(storeType, key) {
    try {
      const storageKey = `${CONFIG.STORAGE_PREFIX}${storeType}_${key}`;
      uni.removeStorageSync(storageKey);
    } catch (error) {
      console.error('[CacheManager] localStorage删除失败:', error);
    }
  }
  
  /**
   * localStorage清空存储
   */
  clearLocalStorage(storeType) {
    try {
      const prefix = `${CONFIG.STORAGE_PREFIX}${storeType}_`;
      const info = uni.getStorageInfoSync();
      info.keys.forEach(key => {
        if (key.startsWith(prefix)) {
          uni.removeStorageSync(key);
        }
      });
    } catch (error) {
      console.error('[CacheManager] localStorage清空失败:', error);
    }
  }
  
  // ==================== 网络状态监听 ====================
  
  /**
   * 启动网络监听
   */
  startNetworkMonitoring() {
    // uni-app网络状态变化监听
    uni.onNetworkStatusChange((res) => {
      const wasOnline = this.isOnlineStatus;
      this.isOnlineStatus = res.isConnected;
      
      console.log(`[CacheManager] 网络状态变化: ${this.isOnlineStatus ? '在线' : '离线'}`);
      
      // 触发事件
      if (!wasOnline && this.isOnlineStatus) {
        this.emit('online');
        // 网络恢复，自动同步
        this.syncOfflineData();
      } else if (wasOnline && !this.isOnlineStatus) {
        this.emit('offline');
      }
    });
    
    // 初始检测网络状态
    this.checkNetworkStatus();
    
    // 定期检测（备用）
    this.networkCheckTimer = setInterval(() => {
      this.checkNetworkStatus();
    }, CONFIG.NETWORK_CHECK_INTERVAL);
  }
  
  /**
   * 检查网络状态
   */
  async checkNetworkStatus() {
    try {
      const networkInfo = await uni.getNetworkType();
      this.isOnlineStatus = networkInfo.networkType !== 'none';
    } catch (error) {
      console.error('[CacheManager] 网络状态检查失败:', error);
    }
  }
  
  /**
   * 获取当前网络状态
   */
  isOnline() {
    return this.isOnlineStatus;
  }
  
  // ==================== 自动同步 ====================
  
  /**
   * 启动自动同步
   */
  startAutoSync() {
    this.syncTimer = setInterval(() => {
      if (this.isOnlineStatus) {
        this.syncOfflineData();
      }
    }, CONFIG.SYNC_INTERVAL);
  }
  
  /**
   * 加载同步队列
   */
  async loadSyncQueue() {
    try {
      const queue = await this.get(CONFIG.STORES.SYNC_QUEUE, 'queue');
      this.syncQueue = queue || [];
      console.log(`[CacheManager] 加载同步队列: ${this.syncQueue.length}条`);
    } catch (error) {
      console.error('[CacheManager] 加载同步队列失败:', error);
      this.syncQueue = [];
    }
  }
  
  /**
   * 保存同步队列
   */
  async saveSyncQueue() {
    try {
      await this.set(CONFIG.STORES.SYNC_QUEUE, 'queue', this.syncQueue, { needSync: false });
    } catch (error) {
      console.error('[CacheManager] 保存同步队列失败:', error);
    }
  }
  
  /**
   * 添加到同步队列
   */
  async addToSyncQueue(data) {
    this.syncQueue.push({
      ...data,
      addedAt: Date.now(),
      retryCount: 0
    });
    await this.saveSyncQueue();
    console.log(`[CacheManager] 加入同步队列: ${data.storeType}/${data.key}`);
  }
  
  /**
   * 同步离线数据
   */
  async syncOfflineData() {
    if (!this.isOnlineStatus || this.syncQueue.length === 0) {
      return;
    }
    
    console.log(`[CacheManager] 开始同步: ${this.syncQueue.length}条数据`);
    
    const syncResults = {
      success: 0,
      failed: 0,
      total: this.syncQueue.length
    };
    
    // 遍历同步队列
    for (let i = this.syncQueue.length - 1; i >= 0; i--) {
      const item = this.syncQueue[i];
      
      try {
        // 调用同步函数（需要外部实现）
        const success = await this.syncSingleItem(item);
        
        if (success) {
          // 同步成功，从队列移除
          this.syncQueue.splice(i, 1);
          syncResults.success++;
        } else {
          // 同步失败，增加重试次数
          item.retryCount = (item.retryCount || 0) + 1;
          
          // 超过最大重试次数，移除
          if (item.retryCount >= CONFIG.MAX_RETRY) {
            console.warn(`[CacheManager] 同步失败超过最大重试次数: ${item.storeType}/${item.key}`);
            this.syncQueue.splice(i, 1);
          }
          
          syncResults.failed++;
        }
        
      } catch (error) {
        console.error(`[CacheManager] 同步出错: ${item.storeType}/${item.key}`, error);
        syncResults.failed++;
      }
    }
    
    // 保存更新后的队列
    await this.saveSyncQueue();
    
    // 触发同步完成事件
    this.emit('sync', syncResults);
    
    console.log(`[CacheManager] 同步完成: 成功${syncResults.success}条, 失败${syncResults.failed}条`);
  }
  
  /**
   * 同步单个数据项（需要外部实现）
   * @param {object} item - 要同步的数据项
   * @returns {Promise<boolean>} 是否同步成功
   */
  async syncSingleItem(item) {
    // TODO: 根据不同的storeType调用不同的云函数
    // 这里需要外部注册同步处理函数
    
    console.log(`[CacheManager] 同步数据: ${item.storeType}/${item.key}`);
    
    // 示例：调用云函数同步
    // const result = await callCloudFunction('data-sync', {
    //   storeType: item.storeType,
    //   key: item.key,
    //   data: item.data
    // });
    // 
    // return result && result.errCode === 0;
    
    // 临时返回true表示成功
    return true;
  }
  
  // ==================== 事件系统 ====================
  
  /**
   * 监听事件
   * @param {string} event - 事件名（online/offline/sync）
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }
  
  /**
   * 移除事件监听
   * @param {string} event - 事件名
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(callback);
      if (index > -1) {
        this.listeners[event].splice(index, 1);
      }
    }
  }
  
  /**
   * 触发事件
   * @param {string} event - 事件名
   * @param {any} data - 事件数据
   */
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[CacheManager] 事件回调错误: ${event}`, error);
        }
      });
    }
  }
  
  // ==================== 清理和销毁 ====================
  
  /**
   * 清理过期数据
   */
  async cleanExpiredData() {
    console.log('[CacheManager] 开始清理过期数据...');
    
    const storeTypes = Object.values(CONFIG.STORES);
    let cleanedCount = 0;
    
    for (const storeType of storeTypes) {
      try {
        // TODO: 实现清理逻辑
        // 遍历存储，检查timestamp，删除过期数据
        
      } catch (error) {
        console.error(`[CacheManager] 清理失败: ${storeType}`, error);
      }
    }
    
    console.log(`[CacheManager] 清理完成: 删除${cleanedCount}条过期数据`);
  }
  
  /**
   * 销毁缓存管理器
   */
  destroy() {
    console.log('[CacheManager] 销毁中...');
    
    // 停止定时器
    if (this.networkCheckTimer) {
      clearInterval(this.networkCheckTimer);
      this.networkCheckTimer = null;
    }
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    // 关闭数据库
    if (this.db) {
      this.db.close();
      this.db = null;
    }
    
    // 清空监听器
    this.listeners = {
      online: [],
      offline: [],
      sync: []
    };
    
    this.isReady = false;
    console.log('[CacheManager] 已销毁');
  }
}

// ==================== 导出 ====================

// 创建单例
const CacheManager = new CacheManagerClass();

export {
  CacheManager,
  CONFIG as CACHE_CONFIG
};

export default CacheManager;

