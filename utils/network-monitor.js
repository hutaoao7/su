/**
 * 网络状态监测工具
 * 
 * 功能：
 * 1. 实时监测网络状态（在线/离线）
 * 2. 网络类型识别（WiFi/4G/5G等）
 * 3. 网络质量评估
 * 4. 离线模式自动切换
 * 5. 事件通知机制
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

/**
 * 网络状态枚举
 */
const NetworkStatus = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown'
};

/**
 * 网络类型枚举
 */
const NetworkType = {
  WIFI: 'wifi',
  '2G': '2g',
  '3G': '3g',
  '4G': '4g',
  '5G': '5g',
  NONE: 'none',
  UNKNOWN: 'unknown'
};

/**
 * 网络质量等级
 */
const NetworkQuality = {
  EXCELLENT: 'excellent', // 优秀
  GOOD: 'good',          // 良好
  FAIR: 'fair',          // 一般
  POOR: 'poor',          // 较差
  OFFLINE: 'offline'     // 离线
};

/**
 * 网络监测器类
 */
class NetworkMonitor {
  constructor() {
    this.status = NetworkStatus.UNKNOWN;
    this.networkType = NetworkType.UNKNOWN;
    this.quality = NetworkQuality.OFFLINE;
    this.listeners = [];
    this.checkInterval = null;
    this.isMonitoring = false;
    
    // 网络质量评估参数
    this.lastCheckTime = 0;
    this.responseTime = 0;
    this.failedChecks = 0;
  }
  
  /**
   * 开始监测
   */
  start() {
    if (this.isMonitoring) {
      console.log('[NetworkMonitor] 已在监测中');
      return;
    }
    
    console.log('[NetworkMonitor] 开始监测网络状态');
    this.isMonitoring = true;
    
    // 立即检查一次
    this.checkNetwork();
    
    // 监听网络状态变化
    uni.onNetworkStatusChange(this.handleNetworkChange.bind(this));
    
    // 定期检查网络质量（每30秒）
    this.checkInterval = setInterval(() => {
      this.assessQuality();
    }, 30 * 1000);
  }
  
  /**
   * 停止监测
   */
  stop() {
    if (!this.isMonitoring) {
      return;
    }
    
    console.log('[NetworkMonitor] 停止监测网络状态');
    this.isMonitoring = false;
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    // 注意：uni-app的onNetworkStatusChange无法取消监听
    // 只能通过isMonitoring标志控制是否响应
  }
  
  /**
   * 检查网络状态
   */
  async checkNetwork() {
    try {
      const res = await uni.getNetworkType();
      
      this.networkType = res.networkType || NetworkType.UNKNOWN;
      
      // 判断是否在线
      const wasOffline = this.status === NetworkStatus.OFFLINE;
      
      if (res.networkType === 'none') {
        this.status = NetworkStatus.OFFLINE;
        this.quality = NetworkQuality.OFFLINE;
      } else {
        this.status = NetworkStatus.ONLINE;
        // 评估网络质量
        await this.assessQuality();
      }
      
      // 如果从离线变为在线，触发恢复事件
      if (wasOffline && this.status === NetworkStatus.ONLINE) {
        this.notifyListeners('recovered', {
          networkType: this.networkType,
          quality: this.quality
        });
      }
      
      console.log('[NetworkMonitor] 网络状态:', {
        status: this.status,
        type: this.networkType,
        quality: this.quality
      });
      
      return {
        status: this.status,
        networkType: this.networkType,
        quality: this.quality
      };
    } catch (e) {
      console.error('[NetworkMonitor] 检查网络失败:', e);
      this.status = NetworkStatus.UNKNOWN;
      return {
        status: this.status,
        networkType: NetworkType.UNKNOWN,
        quality: NetworkQuality.OFFLINE
      };
    }
  }
  
  /**
   * 处理网络状态变化
   */
  handleNetworkChange(res) {
    if (!this.isMonitoring) {
      return;
    }
    
    console.log('[NetworkMonitor] 网络状态变化:', res);
    
    const previousStatus = this.status;
    const previousType = this.networkType;
    
    this.networkType = res.networkType || NetworkType.UNKNOWN;
    
    if (res.isConnected) {
      this.status = NetworkStatus.ONLINE;
      
      // 从离线恢复
      if (previousStatus === NetworkStatus.OFFLINE) {
        this.notifyListeners('recovered', {
          networkType: this.networkType,
          quality: this.quality
        });
      }
      
      // 网络类型变化
      if (previousType !== this.networkType) {
        this.notifyListeners('type_changed', {
          from: previousType,
          to: this.networkType
        });
      }
      
      // 重新评估质量
      this.assessQuality();
    } else {
      this.status = NetworkStatus.OFFLINE;
      this.quality = NetworkQuality.OFFLINE;
      
      this.notifyListeners('offline', {
        previousType: previousType
      });
    }
    
    // 通知状态变化
    this.notifyListeners('change', {
      status: this.status,
      networkType: this.networkType,
      quality: this.quality
    });
  }
  
  /**
   * 评估网络质量
   */
  async assessQuality() {
    if (this.status === NetworkStatus.OFFLINE) {
      this.quality = NetworkQuality.OFFLINE;
      return;
    }
    
    try {
      const startTime = Date.now();
      
      // 发送轻量级ping请求测试网络质量
      // 使用云函数或API端点
      const result = await this.ping();
      
      const responseTime = Date.now() - startTime;
      this.responseTime = responseTime;
      this.lastCheckTime = Date.now();
      
      if (result.success) {
        this.failedChecks = 0;
        
        // 根据响应时间判断质量
        if (responseTime < 200) {
          this.quality = NetworkQuality.EXCELLENT;
        } else if (responseTime < 500) {
          this.quality = NetworkQuality.GOOD;
        } else if (responseTime < 1000) {
          this.quality = NetworkQuality.FAIR;
        } else {
          this.quality = NetworkQuality.POOR;
        }
      } else {
        this.failedChecks++;
        
        if (this.failedChecks >= 3) {
          this.quality = NetworkQuality.OFFLINE;
        } else {
          this.quality = NetworkQuality.POOR;
        }
      }
      
      console.log('[NetworkMonitor] 网络质量评估:', {
        quality: this.quality,
        responseTime: `${responseTime}ms`,
        failedChecks: this.failedChecks
      });
      
      // 通知质量变化
      this.notifyListeners('quality_changed', {
        quality: this.quality,
        responseTime: responseTime
      });
    } catch (e) {
      console.error('[NetworkMonitor] 评估网络质量失败:', e);
      this.failedChecks++;
      
      if (this.failedChecks >= 3) {
        this.quality = NetworkQuality.OFFLINE;
      } else {
        this.quality = NetworkQuality.POOR;
      }
    }
  }
  
  /**
   * Ping测试
   */
  async ping() {
    return new Promise((resolve) => {
      // 使用HEAD请求测试连接性
      // 可以配置为云函数端点或API健康检查端点
      
      // #ifdef MP-WEIXIN
      // 小程序端使用uni.request
      uni.request({
        url: 'https://your-api-endpoint.com/health', // 配置实际的健康检查端点
        method: 'GET',
        timeout: 5000,
        success: () => {
          resolve({ success: true });
        },
        fail: () => {
          resolve({ success: false });
        }
      });
      // #endif
      
      // #ifdef H5
      // H5端使用fetch
      fetch('https://your-api-endpoint.com/health', {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      })
        .then(() => {
          resolve({ success: true });
        })
        .catch(() => {
          resolve({ success: false });
        });
      // #endif
      
      // 如果没有配置端点，直接返回成功（假设有网络）
      // #ifndef MP-WEIXIN
      // #ifndef H5
      setTimeout(() => {
        resolve({ success: true });
      }, 100);
      // #endif
      // #endif
    });
  }
  
  /**
   * 添加监听器
   */
  on(event, callback) {
    if (typeof callback !== 'function') {
      console.error('[NetworkMonitor] 回调必须是函数');
      return;
    }
    
    this.listeners.push({
      event,
      callback
    });
    
    return () => this.off(event, callback);
  }
  
  /**
   * 移除监听器
   */
  off(event, callback) {
    this.listeners = this.listeners.filter(
      listener => !(listener.event === event && listener.callback === callback)
    );
  }
  
  /**
   * 通知监听器
   */
  notifyListeners(event, data) {
    this.listeners
      .filter(listener => listener.event === event || listener.event === '*')
      .forEach(listener => {
        try {
          listener.callback({
            event,
            data,
            timestamp: Date.now()
          });
        } catch (e) {
          console.error('[NetworkMonitor] 监听器执行失败:', e);
        }
      });
  }
  
  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      status: this.status,
      networkType: this.networkType,
      quality: this.quality,
      responseTime: this.responseTime,
      lastCheckTime: this.lastCheckTime,
      isMonitoring: this.isMonitoring
    };
  }
  
  /**
   * 是否在线
   */
  isOnline() {
    return this.status === NetworkStatus.ONLINE;
  }
  
  /**
   * 是否离线
   */
  isOffline() {
    return this.status === NetworkStatus.OFFLINE;
  }
  
  /**
   * 是否弱网
   */
  isWeakNetwork() {
    return this.quality === NetworkQuality.POOR || this.quality === NetworkQuality.FAIR;
  }
  
  /**
   * 获取网络质量描述
   */
  getQualityDescription() {
    const descriptions = {
      [NetworkQuality.EXCELLENT]: '网络优秀',
      [NetworkQuality.GOOD]: '网络良好',
      [NetworkQuality.FAIR]: '网络一般',
      [NetworkQuality.POOR]: '网络较差',
      [NetworkQuality.OFFLINE]: '网络断开'
    };
    
    return descriptions[this.quality] || '未知';
  }
  
  /**
   * 获取建议
   */
  getSuggestion() {
    switch (this.quality) {
      case NetworkQuality.EXCELLENT:
      case NetworkQuality.GOOD:
        return '网络状况良好，可以正常使用所有功能';
        
      case NetworkQuality.FAIR:
        return '网络状况一般，部分功能可能加载较慢';
        
      case NetworkQuality.POOR:
        return '网络状况较差，建议切换到WiFi或信号更好的地方';
        
      case NetworkQuality.OFFLINE:
        return '网络已断开，部分功能不可用。已开启离线模式';
        
      default:
        return '网络状况未知';
    }
  }
}

// 导出单例
const networkMonitor = new NetworkMonitor();

export default networkMonitor;
export { NetworkStatus, NetworkType, NetworkQuality };

