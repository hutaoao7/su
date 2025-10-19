/**
 * 聊天记录存储工具
 * 
 * 使用策略：
 * - H5端：优先使用 IndexedDB 实现高性能存储
 * - 小程序端：使用 localStorage 作为降级方案
 * 
 * 功能：
 * - 聊天记录持久化存储
 * - 会话管理
 * - 自动清理过期数据
 * - 数据压缩
 * 
 * @module chat-storage
 */

// 配置常量
const DB_NAME = 'CraneHeartChatDB';
const DB_VERSION = 1;
const STORE_NAME = 'chat_messages';
const INDEX_NAME_SESSION = 'sessionId';
const INDEX_NAME_TIMESTAMP = 'timestamp';
const MAX_MESSAGES_PER_SESSION = 500; // 每个会话最多保留500条消息
const EXPIRE_DAYS = 30; // 数据保留30天

/**
 * 聊天存储管理类
 */
class ChatStorage {
  constructor() {
    this.db = null;
    this.isH5 = false;
    this.isReady = false;
    
    // 判断当前环境
    // #ifdef H5
    this.isH5 = true;
    // #endif
  }
  
  /**
   * 初始化存储
   */
  async init() {
    if (this.isReady) return true;
    
    // #ifdef H5
    if (this.isH5) {
      try {
        await this.initIndexedDB();
        this.isReady = true;
        console.log('[CHAT_STORAGE] IndexedDB 初始化成功');
        return true;
      } catch (error) {
        console.error('[CHAT_STORAGE] IndexedDB 初始化失败:', error);
        this.isH5 = false; // 降级到localStorage
      }
    }
    // #endif
    
    // 小程序端或IndexedDB失败时使用localStorage
    this.isReady = true;
    console.log('[CHAT_STORAGE] localStorage 模式已启用');
    return true;
  }
  
  /**
   * 初始化 IndexedDB
   */
  initIndexedDB() {
    return new Promise((resolve, reject) => {
      // #ifdef H5
      if (!window.indexedDB) {
        reject(new Error('浏览器不支持 IndexedDB'));
        return;
      }
      
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => {
        reject(new Error('打开数据库失败'));
      };
      
      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建对象存储
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const objectStore = db.createObjectStore(STORE_NAME, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // 创建索引
          objectStore.createIndex(INDEX_NAME_SESSION, 'sessionId', { unique: false });
          objectStore.createIndex(INDEX_NAME_TIMESTAMP, 'timestamp', { unique: false });
          
          console.log('[CHAT_STORAGE] 数据库结构创建成功');
        }
      };
      // #endif
      
      // #ifndef H5
      resolve();
      // #endif
    });
  }
  
  /**
   * 保存单条消息
   * @param {string} sessionId - 会话ID
   * @param {object} message - 消息对象 {role, content, timestamp}
   */
  async saveMessage(sessionId, message) {
    await this.init();
    
    const messageData = {
      sessionId: sessionId || 'default',
      role: message.role,
      content: message.content,
      timestamp: message.timestamp || Date.now(),
      createdAt: new Date().toISOString()
    };
    
    // #ifdef H5
    if (this.isH5 && this.db) {
      return this.saveMessageIndexedDB(messageData);
    }
    // #endif
    
    // localStorage 模式
    return this.saveMessageLocalStorage(sessionId, messageData);
  }
  
  /**
   * 批量保存消息
   * @param {string} sessionId - 会话ID
   * @param {array} messages - 消息数组
   */
  async saveMessages(sessionId, messages) {
    await this.init();
    
    if (!Array.isArray(messages) || messages.length === 0) {
      return;
    }
    
    for (const message of messages) {
      await this.saveMessage(sessionId, message);
    }
    
    console.log(`[CHAT_STORAGE] 已保存 ${messages.length} 条消息到会话 ${sessionId}`);
  }
  
  /**
   * 获取会话的所有消息
   * @param {string} sessionId - 会话ID
   * @param {number} limit - 限制数量
   */
  async getMessages(sessionId = 'default', limit = MAX_MESSAGES_PER_SESSION) {
    await this.init();
    
    // #ifdef H5
    if (this.isH5 && this.db) {
      return this.getMessagesIndexedDB(sessionId, limit);
    }
    // #endif
    
    // localStorage 模式
    return this.getMessagesLocalStorage(sessionId, limit);
  }
  
  /**
   * 清空会话消息
   * @param {string} sessionId - 会话ID
   */
  async clearSession(sessionId = 'default') {
    await this.init();
    
    // #ifdef H5
    if (this.isH5 && this.db) {
      return this.clearSessionIndexedDB(sessionId);
    }
    // #endif
    
    // localStorage 模式
    return this.clearSessionLocalStorage(sessionId);
  }
  
  /**
   * 清理过期数据
   */
  async cleanExpiredData() {
    await this.init();
    
    const expireTime = Date.now() - (EXPIRE_DAYS * 24 * 60 * 60 * 1000);
    
    // #ifdef H5
    if (this.isH5 && this.db) {
      return this.cleanExpiredDataIndexedDB(expireTime);
    }
    // #endif
    
    // localStorage 模式
    return this.cleanExpiredDataLocalStorage(expireTime);
  }
  
  // ==================== IndexedDB 实现 ====================
  
  /**
   * IndexedDB: 保存消息
   */
  saveMessageIndexedDB(messageData) {
    return new Promise((resolve, reject) => {
      // #ifdef H5
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.add(messageData);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(new Error('保存消息失败'));
      };
      // #endif
      
      // #ifndef H5
      resolve();
      // #endif
    });
  }
  
  /**
   * IndexedDB: 获取消息
   */
  getMessagesIndexedDB(sessionId, limit) {
    return new Promise((resolve, reject) => {
      // #ifdef H5
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index(INDEX_NAME_SESSION);
      const request = index.getAll(sessionId);
      
      request.onsuccess = () => {
        let messages = request.result || [];
        
        // 按时间排序
        messages.sort((a, b) => a.timestamp - b.timestamp);
        
        // 限制数量
        if (messages.length > limit) {
          messages = messages.slice(-limit);
        }
        
        resolve(messages);
      };
      
      request.onerror = () => {
        reject(new Error('读取消息失败'));
      };
      // #endif
      
      // #ifndef H5
      resolve([]);
      // #endif
    });
  }
  
  /**
   * IndexedDB: 清空会话
   */
  clearSessionIndexedDB(sessionId) {
    return new Promise((resolve, reject) => {
      // #ifdef H5
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index(INDEX_NAME_SESSION);
      const request = index.openCursor(sessionId);
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log(`[CHAT_STORAGE] 会话 ${sessionId} 已清空`);
          resolve();
        }
      };
      
      request.onerror = () => {
        reject(new Error('清空会话失败'));
      };
      // #endif
      
      // #ifndef H5
      resolve();
      // #endif
    });
  }
  
  /**
   * IndexedDB: 清理过期数据
   */
  cleanExpiredDataIndexedDB(expireTime) {
    return new Promise((resolve, reject) => {
      // #ifdef H5
      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const index = objectStore.index(INDEX_NAME_TIMESTAMP);
      const request = index.openCursor();
      
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          if (cursor.value.timestamp < expireTime) {
            cursor.delete();
            deletedCount++;
          }
          cursor.continue();
        } else {
          console.log(`[CHAT_STORAGE] 清理了 ${deletedCount} 条过期消息`);
          resolve(deletedCount);
        }
      };
      
      request.onerror = () => {
        reject(new Error('清理过期数据失败'));
      };
      // #endif
      
      // #ifndef H5
      resolve(0);
      // #endif
    });
  }
  
  // ==================== localStorage 实现 ====================
  
  /**
   * localStorage: 获取会话存储键
   */
  getSessionKey(sessionId) {
    return `chat_session_${sessionId}`;
  }
  
  /**
   * localStorage: 保存消息
   */
  saveMessageLocalStorage(sessionId, messageData) {
    try {
      const key = this.getSessionKey(sessionId);
      const stored = uni.getStorageSync(key);
      let messages = [];
      
      if (stored) {
        try {
          messages = JSON.parse(stored);
        } catch (e) {
          console.warn('[CHAT_STORAGE] 解析存储数据失败，将重置');
          messages = [];
        }
      }
      
      // 添加新消息
      messages.push(messageData);
      
      // 限制数量
      if (messages.length > MAX_MESSAGES_PER_SESSION) {
        messages = messages.slice(-MAX_MESSAGES_PER_SESSION);
      }
      
      uni.setStorageSync(key, JSON.stringify(messages));
      return true;
    } catch (error) {
      console.error('[CHAT_STORAGE] localStorage 保存失败:', error);
      return false;
    }
  }
  
  /**
   * localStorage: 获取消息
   */
  getMessagesLocalStorage(sessionId, limit) {
    try {
      const key = this.getSessionKey(sessionId);
      const stored = uni.getStorageSync(key);
      
      if (!stored) {
        return [];
      }
      
      let messages = JSON.parse(stored);
      
      // 限制数量
      if (messages.length > limit) {
        messages = messages.slice(-limit);
      }
      
      return messages;
    } catch (error) {
      console.error('[CHAT_STORAGE] localStorage 读取失败:', error);
      return [];
    }
  }
  
  /**
   * localStorage: 清空会话
   */
  clearSessionLocalStorage(sessionId) {
    try {
      const key = this.getSessionKey(sessionId);
      uni.removeStorageSync(key);
      console.log(`[CHAT_STORAGE] 会话 ${sessionId} 已清空`);
      return true;
    } catch (error) {
      console.error('[CHAT_STORAGE] localStorage 清空失败:', error);
      return false;
    }
  }
  
  /**
   * localStorage: 清理过期数据
   */
  cleanExpiredDataLocalStorage(expireTime) {
    try {
      const info = uni.getStorageInfoSync();
      let deletedCount = 0;
      
      info.keys.forEach(key => {
        if (key.startsWith('chat_session_')) {
          const stored = uni.getStorageSync(key);
          if (stored) {
            try {
              const messages = JSON.parse(stored);
              const validMessages = messages.filter(msg => msg.timestamp >= expireTime);
              
              if (validMessages.length < messages.length) {
                deletedCount += (messages.length - validMessages.length);
                
                if (validMessages.length > 0) {
                  uni.setStorageSync(key, JSON.stringify(validMessages));
                } else {
                  uni.removeStorageSync(key);
                }
              }
            } catch (e) {
              console.warn(`[CHAT_STORAGE] 清理 ${key} 失败:`, e);
            }
          }
        }
      });
      
      console.log(`[CHAT_STORAGE] 清理了 ${deletedCount} 条过期消息`);
      return deletedCount;
    } catch (error) {
      console.error('[CHAT_STORAGE] localStorage 清理失败:', error);
      return 0;
    }
  }
  
  /**
   * 获取所有会话列表
   */
  async getAllSessions() {
    await this.init();
    
    // #ifdef H5
    if (this.isH5 && this.db) {
      return this.getAllSessionsIndexedDB();
    }
    // #endif
    
    // localStorage 模式
    return this.getAllSessionsLocalStorage();
  }
  
  /**
   * IndexedDB: 获取所有会话
   */
  getAllSessionsIndexedDB() {
    return new Promise((resolve, reject) => {
      // #ifdef H5
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();
      
      request.onsuccess = () => {
        const messages = request.result || [];
        const sessions = new Set();
        
        messages.forEach(msg => {
          sessions.add(msg.sessionId);
        });
        
        resolve(Array.from(sessions));
      };
      
      request.onerror = () => {
        reject(new Error('获取会话列表失败'));
      };
      // #endif
      
      // #ifndef H5
      resolve([]);
      // #endif
    });
  }
  
  /**
   * localStorage: 获取所有会话
   */
  getAllSessionsLocalStorage() {
    try {
      const info = uni.getStorageInfoSync();
      const sessions = [];
      
      info.keys.forEach(key => {
        if (key.startsWith('chat_session_')) {
          const sessionId = key.replace('chat_session_', '');
          sessions.push(sessionId);
        }
      });
      
      return sessions;
    } catch (error) {
      console.error('[CHAT_STORAGE] 获取会话列表失败:', error);
      return [];
    }
  }
}

// 创建单例
const chatStorage = new ChatStorage();

export default chatStorage;

