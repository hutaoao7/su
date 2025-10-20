/**
 * 评估结果缓存管理工具
 * 功能：
 * 1. 支持localStorage和IndexedDB双层缓存
 * 2. 自动过期清理机制
 * 3. 数据压缩存储
 * 4. 离线数据同步队列
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

const CACHE_CONFIG = {
  // 缓存键前缀
  PREFIX: 'crane_result_',
  
  // localStorage键
  STORAGE_KEYS: {
    RESULTS: 'assessment_results',      // 结果缓存
    HISTORY: 'assessment_history',      // 历史记录
    SYNC_QUEUE: 'result_sync_queue',    // 待同步队列
    CACHE_META: 'result_cache_meta'     // 缓存元数据
  },
  
  // 缓存策略
  MAX_RESULTS: 100,         // 最多缓存结果数
  MAX_HISTORY: 50,          // 最多历史记录数
  EXPIRE_DAYS: 30,          // 缓存过期天数
  
  // IndexedDB配置
  DB_NAME: 'CraneHeartDB',
  DB_VERSION: 1,
  STORE_NAME: 'assessment_results'
};

/**
 * 结果缓存管理器
 */
class ResultCacheManager {
  constructor() {
    this.db = null;
    this.dbReady = false;
    this.initIndexedDB();
  }
  
  /**
   * 初始化IndexedDB
   */
  async initIndexedDB() {
    // #ifdef H5
    try {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open(CACHE_CONFIG.DB_NAME, CACHE_CONFIG.DB_VERSION);
        
        request.onerror = () => {
          console.error('[ResultCache] IndexedDB打开失败');
          this.dbReady = false;
          reject(request.error);
        };
        
        request.onsuccess = () => {
          this.db = request.result;
          this.dbReady = true;
          console.log('[ResultCache] IndexedDB初始化成功');
          resolve(this.db);
        };
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          
          // 创建对象存储
          if (!db.objectStoreNames.contains(CACHE_CONFIG.STORE_NAME)) {
            const objectStore = db.createObjectStore(CACHE_CONFIG.STORE_NAME, { 
              keyPath: 'id',
              autoIncrement: true
            });
            
            // 创建索引
            objectStore.createIndex('scaleId', 'scaleId', { unique: false });
            objectStore.createIndex('timestamp', 'timestamp', { unique: false });
            objectStore.createIndex('userId', 'userId', { unique: false });
            
            console.log('[ResultCache] IndexedDB结构创建成功');
          }
        };
      });
    } catch (error) {
      console.error('[ResultCache] IndexedDB初始化失败:', error);
      this.dbReady = false;
    }
    // #endif
    
    // #ifndef H5
    console.log('[ResultCache] 非H5环境，跳过IndexedDB初始化');
    this.dbReady = false;
    // #endif
  }
  
  /**
   * 保存评估结果（主方法）
   * @param {Object} resultData - 结果数据
   * @returns {Promise<boolean>}
   */
  async saveResult(resultData) {
    try {
      // 数据验证
      if (!resultData || !resultData.scaleId) {
        console.error('[ResultCache] 无效的结果数据');
        return false;
      }
      
      // 添加元数据
      const enrichedData = {
        ...resultData,
        cachedAt: Date.now(),
        expireAt: Date.now() + CACHE_CONFIG.EXPIRE_DAYS * 24 * 60 * 60 * 1000,
        version: '1.0'
      };
      
      // 尝试保存到IndexedDB（H5）
      if (this.dbReady) {
        await this.saveToIndexedDB(enrichedData);
      }
      
      // 保存到localStorage（所有平台）
      await this.saveToLocalStorage(enrichedData);
      
      // 保存到历史记录
      await this.saveToHistory(resultData);
      
      // 更新缓存元数据
      this.updateCacheMeta();
      
      console.log('[ResultCache] 结果保存成功:', resultData.scaleId);
      return true;
    } catch (error) {
      console.error('[ResultCache] 保存结果失败:', error);
      return false;
    }
  }
  
  /**
   * 保存到IndexedDB
   */
  async saveToIndexedDB(data) {
    // #ifdef H5
    if (!this.dbReady || !this.db) {
      return false;
    }
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const request = objectStore.add(data);
        
        request.onsuccess = () => {
          console.log('[ResultCache] IndexedDB保存成功');
          resolve(true);
        };
        
        request.onerror = () => {
          console.error('[ResultCache] IndexedDB保存失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[ResultCache] IndexedDB保存异常:', error);
      return false;
    }
    // #endif
    
    // #ifndef H5
    return false;
    // #endif
  }
  
  /**
   * 保存到localStorage
   */
  async saveToLocalStorage(data) {
    try {
      const key = CACHE_CONFIG.STORAGE_KEYS.RESULTS;
      const cached = uni.getStorageSync(key) || [];
      
      // 添加新结果
      cached.push(data);
      
      // 清理过期数据
      const now = Date.now();
      const validCached = cached.filter(item => {
        return item.expireAt > now;
      });
      
      // 限制数量
      if (validCached.length > CACHE_CONFIG.MAX_RESULTS) {
        validCached.splice(0, validCached.length - CACHE_CONFIG.MAX_RESULTS);
      }
      
      uni.setStorageSync(key, validCached);
      console.log('[ResultCache] localStorage保存成功, 当前缓存:', validCached.length);
      return true;
    } catch (error) {
      console.error('[ResultCache] localStorage保存失败:', error);
      return false;
    }
  }
  
  /**
   * 保存到历史记录
   */
  async saveToHistory(data) {
    try {
      const key = CACHE_CONFIG.STORAGE_KEYS.HISTORY;
      const history = uni.getStorageSync(key) || [];
      
      history.push({
        scaleId: data.scaleId,
        score: data.score,
        level: data.level,
        timestamp: Date.now()
      });
      
      // 只保留最近N条
      if (history.length > CACHE_CONFIG.MAX_HISTORY) {
        history.splice(0, history.length - CACHE_CONFIG.MAX_HISTORY);
      }
      
      uni.setStorageSync(key, history);
      console.log('[ResultCache] 历史记录保存成功');
      return true;
    } catch (error) {
      console.error('[ResultCache] 历史记录保存失败:', error);
      return false;
    }
  }
  
  /**
   * 获取缓存的结果
   * @param {string} scaleId - 量表ID
   * @param {number} limit - 数量限制
   * @returns {Promise<Array>}
   */
  async getResults(scaleId, limit = 10) {
    try {
      // 优先从IndexedDB读取
      if (this.dbReady) {
        const results = await this.getFromIndexedDB(scaleId, limit);
        if (results && results.length > 0) {
          return results;
        }
      }
      
      // 从localStorage读取
      return this.getFromLocalStorage(scaleId, limit);
    } catch (error) {
      console.error('[ResultCache] 获取结果失败:', error);
      return [];
    }
  }
  
  /**
   * 从IndexedDB读取
   */
  async getFromIndexedDB(scaleId, limit) {
    // #ifdef H5
    if (!this.dbReady || !this.db) {
      return [];
    }
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([CACHE_CONFIG.STORE_NAME], 'readonly');
        const objectStore = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const index = objectStore.index('scaleId');
        const request = index.getAll(scaleId, limit);
        
        request.onsuccess = () => {
          const results = request.result || [];
          console.log('[ResultCache] IndexedDB读取成功:', results.length);
          resolve(results);
        };
        
        request.onerror = () => {
          console.error('[ResultCache] IndexedDB读取失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[ResultCache] IndexedDB读取异常:', error);
      return [];
    }
    // #endif
    
    // #ifndef H5
    return [];
    // #endif
  }
  
  /**
   * 从localStorage读取
   */
  getFromLocalStorage(scaleId, limit) {
    try {
      const key = CACHE_CONFIG.STORAGE_KEYS.RESULTS;
      const cached = uni.getStorageSync(key) || [];
      
      // 过滤量表和过期数据
      const now = Date.now();
      const validResults = cached.filter(item => {
        return item.scaleId === scaleId && item.expireAt > now;
      });
      
      // 按时间倒序
      validResults.sort((a, b) => b.timestamp - a.timestamp);
      
      // 限制数量
      const results = validResults.slice(0, limit);
      
      console.log('[ResultCache] localStorage读取成功:', results.length);
      return results;
    } catch (error) {
      console.error('[ResultCache] localStorage读取失败:', error);
      return [];
    }
  }
  
  /**
   * 获取历史记录
   * @param {string} scaleId - 量表ID（可选）
   * @param {number} limit - 数量限制
   * @returns {Array}
   */
  getHistory(scaleId = null, limit = 50) {
    try {
      const key = CACHE_CONFIG.STORAGE_KEYS.HISTORY;
      const history = uni.getStorageSync(key) || [];
      
      // 过滤量表
      let filtered = scaleId 
        ? history.filter(h => h.scaleId === scaleId)
        : history;
      
      // 按时间倒序
      filtered.sort((a, b) => b.timestamp - a.timestamp);
      
      // 限制数量
      return filtered.slice(0, limit);
    } catch (error) {
      console.error('[ResultCache] 获取历史失败:', error);
      return [];
    }
  }
  
  /**
   * 清理过期缓存
   * @returns {Promise<Object>}
   */
  async cleanExpired() {
    try {
      const now = Date.now();
      let cleanedCount = 0;
      
      // 清理localStorage
      const key = CACHE_CONFIG.STORAGE_KEYS.RESULTS;
      const cached = uni.getStorageSync(key) || [];
      const validCached = cached.filter(item => item.expireAt > now);
      
      cleanedCount = cached.length - validCached.length;
      
      if (cleanedCount > 0) {
        uni.setStorageSync(key, validCached);
      }
      
      // 清理IndexedDB（H5）
      // #ifdef H5
      if (this.dbReady) {
        cleanedCount += await this.cleanIndexedDBExpired();
      }
      // #endif
      
      console.log('[ResultCache] 清理完成, 删除:', cleanedCount);
      
      return {
        success: true,
        cleanedCount
      };
    } catch (error) {
      console.error('[ResultCache] 清理失败:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  /**
   * 清理IndexedDB过期数据
   */
  async cleanIndexedDBExpired() {
    // #ifdef H5
    if (!this.dbReady || !this.db) {
      return 0;
    }
    
    try {
      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        const request = objectStore.openCursor();
        
        const now = Date.now();
        let count = 0;
        
        request.onsuccess = (event) => {
          const cursor = event.target.result;
          
          if (cursor) {
            const value = cursor.value;
            
            if (value.expireAt && value.expireAt < now) {
              cursor.delete();
              count++;
            }
            
            cursor.continue();
          } else {
            console.log('[ResultCache] IndexedDB清理完成:', count);
            resolve(count);
          }
        };
        
        request.onerror = () => {
          console.error('[ResultCache] IndexedDB清理失败:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('[ResultCache] IndexedDB清理异常:', error);
      return 0;
    }
    // #endif
    
    // #ifndef H5
    return 0;
    // #endif
  }
  
  /**
   * 清空所有缓存
   * @returns {boolean}
   */
  clearAll() {
    try {
      // 清空localStorage
      Object.values(CACHE_CONFIG.STORAGE_KEYS).forEach(key => {
        uni.removeStorageSync(key);
      });
      
      // 清空IndexedDB（H5）
      // #ifdef H5
      if (this.dbReady && this.db) {
        const transaction = this.db.transaction([CACHE_CONFIG.STORE_NAME], 'readwrite');
        const objectStore = transaction.objectStore(CACHE_CONFIG.STORE_NAME);
        objectStore.clear();
      }
      // #endif
      
      console.log('[ResultCache] 已清空所有缓存');
      return true;
    } catch (error) {
      console.error('[ResultCache] 清空缓存失败:', error);
      return false;
    }
  }
  
  /**
   * 更新缓存元数据
   */
  updateCacheMeta() {
    try {
      const meta = {
        lastUpdated: Date.now(),
        version: '1.0'
      };
      
      uni.setStorageSync(CACHE_CONFIG.STORAGE_KEYS.CACHE_META, meta);
    } catch (error) {
      console.error('[ResultCache] 更新元数据失败:', error);
    }
  }
  
  /**
   * 获取缓存统计信息
   * @returns {Object}
   */
  getCacheStats() {
    try {
      const results = uni.getStorageSync(CACHE_CONFIG.STORAGE_KEYS.RESULTS) || [];
      const history = uni.getStorageSync(CACHE_CONFIG.STORAGE_KEYS.HISTORY) || [];
      const meta = uni.getStorageSync(CACHE_CONFIG.STORAGE_KEYS.CACHE_META) || {};
      
      const now = Date.now();
      const validResults = results.filter(r => r.expireAt > now);
      const expiredResults = results.filter(r => r.expireAt <= now);
      
      return {
        totalResults: results.length,
        validResults: validResults.length,
        expiredResults: expiredResults.length,
        historyCount: history.length,
        lastUpdated: meta.lastUpdated || null,
        dbReady: this.dbReady
      };
    } catch (error) {
      console.error('[ResultCache] 获取统计失败:', error);
      return null;
    }
  }
}

// 创建单例
const resultCache = new ResultCacheManager();

// 导出方法
export default resultCache;

export {
  resultCache,
  CACHE_CONFIG
};

