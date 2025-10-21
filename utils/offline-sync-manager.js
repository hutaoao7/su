/**
 * 离线同步管理器
 * 
 * 功能：
 * 1. 自动同步机制
 * 2. 同步队列管理
 * 3. 重试机制
 * 4. 冲突解决
 */

import cacheManager from './cache-manager.js';
import networkDetector from './network-detector.js';

class OfflineSyncManager {
  constructor() {
    this.isSyncing = false;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1秒
    this.syncListeners = [];
  }

  /**
   * 初始化离线同步
   */
  async init() {
    // 初始化缓存管理器
    await cacheManager.init();

    // 初始化网络检测器
    networkDetector.init();

    // 监听网络状态变化
    networkDetector.onStatusChange((status) => {
      if (status.status === 'online') {
        console.log('✅ 网络已连接，开始同步');
        this.startSync();
      } else {
        console.log('❌ 网络已断开，停止同步');
        this.stopSync();
      }
    });

    console.log('✅ 离线同步管理器已初始化');
  }

  /**
   * 添加数据到同步队列
   */
  async addToQueue(action, data) {
    try {
      await cacheManager.addToSyncQueue(action, data);
      console.log(`✅ 已添加${action}到同步队列`);
      
      // 如果在线，立即同步
      if (networkDetector.isOnline) {
        this.startSync();
      }
    } catch (error) {
      console.error('❌ 添加到同步队列失败:', error);
      throw error;
    }
  }

  /**
   * 启动同步
   */
  async startSync() {
    if (this.isSyncing) {
      console.log('⏳ 同步已在进行中');
      return;
    }

    this.isSyncing = true;
    this.notifySyncStart();

    try {
      const queue = await cacheManager.getSyncQueue();
      console.log(`📊 同步队列中有${queue.length}项待同步`);

      for (const item of queue) {
        await this.syncItem(item);
      }

      console.log('✅ 同步完成');
      this.notifySyncComplete();
    } catch (error) {
      console.error('❌ 同步失败:', error);
      this.notifySyncError(error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 停止同步
   */
  stopSync() {
    this.isSyncing = false;
    console.log('⏹️ 同步已停止');
  }

  /**
   * 同步单个项目
   */
  async syncItem(item) {
    try {
      console.log(`🔄 正在同步: ${item.action}`);

      // 调用云函数进行同步
      const result = await uni.callFunction({
        name: 'offline-sync',
        data: {
          action: item.action,
          data: item.data
        }
      });

      if (result.result.errCode === 0) {
        // 同步成功，从队列移除
        await cacheManager.removeFromSyncQueue(item.id);
        console.log(`✅ ${item.action}同步成功`);
      } else {
        // 同步失败，增加重试次数
        item.retries = (item.retries || 0) + 1;
        
        if (item.retries < this.maxRetries) {
          console.log(`⚠️ ${item.action}同步失败，将重试 (${item.retries}/${this.maxRetries})`);
          // 延迟后重试
          await this.delay(this.retryDelay * item.retries);
          await this.syncItem(item);
        } else {
          console.error(`❌ ${item.action}同步失败，已达最大重试次数`);
          // 记录错误但不移除队列项
        }
      }
    } catch (error) {
      console.error(`❌ 同步${item.action}异常:`, error);
      
      item.retries = (item.retries || 0) + 1;
      if (item.retries < this.maxRetries) {
        await this.delay(this.retryDelay * item.retries);
        await this.syncItem(item);
      }
    }
  }

  /**
   * 延迟函数
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取同步状态
   */
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      isOnline: networkDetector.isOnline,
      networkType: networkDetector.networkType,
      networkQuality: networkDetector.getNetworkQuality()
    };
  }

  /**
   * 注册同步监听器
   */
  onSyncStatusChange(callback) {
    this.syncListeners.push(callback);
    
    return () => {
      this.syncListeners = this.syncListeners.filter(l => l !== callback);
    };
  }

  /**
   * 通知同步开始
   */
  notifySyncStart() {
    this.syncListeners.forEach(callback => {
      try {
        callback({ status: 'start', isSyncing: true });
      } catch (error) {
        console.error('❌ 监听器执行失败:', error);
      }
    });
  }

  /**
   * 通知同步完成
   */
  notifySyncComplete() {
    this.syncListeners.forEach(callback => {
      try {
        callback({ status: 'complete', isSyncing: false });
      } catch (error) {
        console.error('❌ 监听器执行失败:', error);
      }
    });
  }

  /**
   * 通知同步错误
   */
  notifySyncError(error) {
    this.syncListeners.forEach(callback => {
      try {
        callback({ status: 'error', error, isSyncing: false });
      } catch (err) {
        console.error('❌ 监听器执行失败:', err);
      }
    });
  }

  /**
   * 清空同步队列
   */
  async clearSyncQueue() {
    try {
      await cacheManager.clearCache('sync_queue');
      console.log('✅ 同步队列已清空');
    } catch (error) {
      console.error('❌ 清空同步队列失败:', error);
      throw error;
    }
  }

  /**
   * 销毁管理器
   */
  destroy() {
    this.stopSync();
    networkDetector.destroy();
    this.syncListeners = [];
    console.log('✅ 离线同步管理器已销毁');
  }
}

// 导出单例
export default new OfflineSyncManager();

