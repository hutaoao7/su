/**
 * 网络状态检测器
 * 
 * 功能：
 * 1. 网络连接状态检测
 * 2. 网络类型识别
 * 3. 网络质量评估
 * 4. 状态变化通知
 */

class NetworkDetector {
  constructor() {
    this.isOnline = navigator.onLine;
    this.networkType = this.getNetworkType();
    this.listeners = [];
    this.lastCheckTime = Date.now();
    this.checkInterval = 5000; // 5秒检查一次
  }

  /**
   * 初始化网络检测
   */
  init() {
    // 监听在线/离线事件
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // 定期检查网络状态
    this.startPeriodicCheck();

    console.log('✅ 网络检测器已初始化');
  }

  /**
   * 处理在线事件
   */
  handleOnline() {
    if (!this.isOnline) {
      this.isOnline = true;
      console.log('✅ 网络已连接');
      this.notifyListeners('online');
    }
  }

  /**
   * 处理离线事件
   */
  handleOffline() {
    if (this.isOnline) {
      this.isOnline = false;
      console.log('❌ 网络已断开');
      this.notifyListeners('offline');
    }
  }

  /**
   * 获取网络类型
   */
  getNetworkType() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return 'unknown';
    }

    const type = connection.type || connection.effectiveType;
    
    // 标准化网络类型
    const typeMap = {
      'bluetooth': 'bluetooth',
      'cellular': 'cellular',
      'ethernet': 'ethernet',
      'wifi': 'wifi',
      'wimax': 'wimax',
      'other': 'other',
      'none': 'none',
      '4g': 'cellular',
      '3g': 'cellular',
      '2g': 'cellular',
      'slow-2g': 'cellular'
    };

    return typeMap[type] || 'unknown';
  }

  /**
   * 获取网络质量
   */
  getNetworkQuality() {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (!connection) {
      return {
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false
      };
    }

    return {
      effectiveType: connection.effectiveType || 'unknown',
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }

  /**
   * 检查网络连接
   */
  async checkConnection() {
    try {
      // 尝试获取一个小文件来检查连接
      const response = await fetch('/ping', {
        method: 'HEAD',
        cache: 'no-cache'
      });
      
      return response.ok;
    } catch (error) {
      console.error('❌ 网络连接检查失败:', error);
      return false;
    }
  }

  /**
   * 启动定期检查
   */
  startPeriodicCheck() {
    this.checkTimer = setInterval(async () => {
      const isConnected = await this.checkConnection();
      
      if (isConnected && !this.isOnline) {
        this.handleOnline();
      } else if (!isConnected && this.isOnline) {
        this.handleOffline();
      }
    }, this.checkInterval);
  }

  /**
   * 停止定期检查
   */
  stopPeriodicCheck() {
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
  }

  /**
   * 注册状态变化监听器
   */
  onStatusChange(callback) {
    this.listeners.push(callback);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * 通知所有监听器
   */
  notifyListeners(status) {
    this.listeners.forEach(callback => {
      try {
        callback({
          status,
          isOnline: this.isOnline,
          networkType: this.networkType,
          quality: this.getNetworkQuality(),
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('❌ 监听器执行失败:', error);
      }
    });
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      networkType: this.networkType,
      quality: this.getNetworkQuality(),
      timestamp: Date.now()
    };
  }

  /**
   * 等待网络连接
   */
  async waitForConnection(timeout = 30000) {
    if (this.isOnline) {
      return true;
    }

    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const unsubscribe = this.onStatusChange((status) => {
        if (status.status === 'online') {
          unsubscribe();
          resolve(true);
        }
      });

      // 超时处理
      setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, timeout);
    });
  }

  /**
   * 销毁检测器
   */
  destroy() {
    this.stopPeriodicCheck();
    window.removeEventListener('online', () => this.handleOnline());
    window.removeEventListener('offline', () => this.handleOffline());
    this.listeners = [];
    console.log('✅ 网络检测器已销毁');
  }
}

// 导出单例
export default new NetworkDetector();

