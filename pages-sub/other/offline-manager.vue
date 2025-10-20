<template>
  <view class="offline-manager">
    <!-- 导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: safeAreaTop + 'px' }">
      <view class="nav-content">
        <view class="nav-left" @tap="goBack">
          <text class="iconfont icon-back"></text>
        </view>
        <view class="nav-title">离线管理</view>
        <view class="nav-right"></view>
      </view>
    </view>
    
    <!-- 内容区域 -->
    <scroll-view
      class="content"
      :style="{ paddingTop: navBarHeight + 'px', paddingBottom: safeAreaBottom + 'px' }"
      scroll-y
      enhanced
      :show-scrollbar="false"
    >
      <!-- 网络状态卡片 -->
      <view class="card network-status">
        <view class="card-header">
          <text class="card-title">网络状态</text>
          <view
            class="status-badge"
            :class="{
              'status-online': networkStatus.status === 'online',
              'status-offline': networkStatus.status === 'offline'
            }"
          >
            <text class="status-dot"></text>
            <text class="status-text">{{ networkStatus.status === 'online' ? '在线' : '离线' }}</text>
          </view>
        </view>
        
        <view class="network-info">
          <view class="info-row">
            <text class="info-label">网络类型</text>
            <text class="info-value">{{ getNetworkTypeText(networkStatus.networkType) }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">网络质量</text>
            <text class="info-value">{{ getQualityText(networkStatus.quality) }}</text>
          </view>
          <view v-if="networkStatus.responseTime > 0" class="info-row">
            <text class="info-label">响应时间</text>
            <text class="info-value">{{ networkStatus.responseTime }}ms</text>
          </view>
        </view>
        
        <view class="network-suggestion">
          <text class="suggestion-icon">💡</text>
          <text class="suggestion-text">{{ networkSuggestion }}</text>
        </view>
      </view>
      
      <!-- 缓存统计卡片 -->
      <view class="card cache-stats">
        <view class="card-header">
          <text class="card-title">缓存统计</text>
          <text class="refresh-btn" @tap="refreshStats">刷新</text>
        </view>
        
        <view v-if="loading" class="loading-state">
          <text class="loading-text">加载中...</text>
        </view>
        
        <view v-else class="stats-list">
          <view
            v-for="(stat, key) in cacheStats"
            :key="key"
            class="stat-item"
          >
            <view class="stat-info">
              <text class="stat-name">{{ getStatName(key) }}</text>
              <text class="stat-count">{{ stat.count }}项</text>
            </view>
            <text class="stat-size">{{ stat.sizeFormatted }}</text>
          </view>
          
          <view v-if="cacheStats.offlineQueue > 0" class="stat-item highlight">
            <view class="stat-info">
              <text class="stat-name">离线队列</text>
              <text class="stat-count">{{ cacheStats.offlineQueue }}项待同步</text>
            </view>
            <text class="sync-btn" @tap="syncOfflineQueue">立即同步</text>
          </view>
        </view>
        
        <view class="clear-cache-btn" @tap="showClearConfirm">
          <text class="btn-text">清空所有缓存</text>
        </view>
      </view>
      
      <!-- 离线功能卡片 -->
      <view class="card offline-features">
        <view class="card-header">
          <text class="card-title">离线功能</text>
        </view>
        
        <view class="feature-list">
          <view class="feature-item">
            <view class="feature-info">
              <text class="feature-icon">📝</text>
              <view class="feature-text">
                <text class="feature-name">离线答题</text>
                <text class="feature-desc">量表已缓存，可离线完成评估</text>
              </view>
            </view>
            <text class="feature-status enabled">已启用</text>
          </view>
          
          <view class="feature-item">
            <view class="feature-info">
              <text class="feature-icon">📊</text>
              <view class="feature-text">
                <text class="feature-name">结果查看</text>
                <text class="feature-desc">历史结果本地缓存，随时查看</text>
              </view>
            </view>
            <text class="feature-status enabled">已启用</text>
          </view>
          
          <view class="feature-item">
            <view class="feature-info">
              <text class="feature-icon">☁️</text>
              <view class="feature-text">
                <text class="feature-name">自动同步</text>
                <text class="feature-desc">网络恢复后自动上传数据</text>
              </view>
            </view>
            <switch
              :checked="autoSync"
              @change="toggleAutoSync"
              color="#4CAF50"
            />
          </view>
          
          <view class="feature-item">
            <view class="feature-info">
              <text class="feature-icon">🔔</text>
              <view class="feature-text">
                <text class="feature-name">同步提醒</text>
                <text class="feature-desc">同步完成后显示通知</text>
              </view>
            </view>
            <switch
              :checked="syncNotification"
              @change="toggleSyncNotification"
              color="#4CAF50"
            />
          </view>
        </view>
      </view>
      
      <!-- 使用说明 -->
      <view class="card usage-tips">
        <view class="card-header">
          <text class="card-title">使用说明</text>
        </view>
        
        <view class="tips-list">
          <view class="tip-item">
            <text class="tip-number">1</text>
            <text class="tip-text">在有网络时，系统会自动缓存量表和历史数据</text>
          </view>
          <view class="tip-item">
            <text class="tip-number">2</text>
            <text class="tip-text">离线时可以继续答题，数据保存在本地</text>
          </view>
          <view class="tip-item">
            <text class="tip-number">3</text>
            <text class="tip-text">网络恢复后，离线数据会自动上传到云端</text>
          </view>
          <view class="tip-item">
            <text class="tip-number">4</text>
            <text class="tip-text">定期清理缓存可以释放存储空间</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script>
import cacheManager from '@/utils/cache-manager.js';
import networkMonitor from '@/utils/network-monitor.js';

export default {
  name: 'OfflineManager',
  
  data() {
    return {
      safeAreaTop: 0,
      safeAreaBottom: 0,
      navBarHeight: 44,
      
      loading: false,
      
      // 网络状态
      networkStatus: {
        status: 'unknown',
        networkType: 'unknown',
        quality: 'offline',
        responseTime: 0
      },
      networkSuggestion: '检测网络状况中...',
      
      // 缓存统计
      cacheStats: {},
      
      // 设置
      autoSync: true,
      syncNotification: true,
      
      // 网络监听器
      networkUnsubscribe: null
    };
  },
  
  onLoad() {
    this.initSafeArea();
    this.loadSettings();
    this.initNetworkMonitor();
    this.initCacheManager();
    this.refreshStats();
  },
  
  onUnload() {
    // 移除网络监听
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
  },
  
  methods: {
    /**
     * 初始化安全区域
     */
    initSafeArea() {
      const systemInfo = uni.getSystemInfoSync();
      this.safeAreaTop = systemInfo.statusBarHeight || 0;
      this.safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
      this.navBarHeight = this.safeAreaTop + 44;
    },
    
    /**
     * 加载设置
     */
    loadSettings() {
      try {
        this.autoSync = uni.getStorageSync('offline_auto_sync') !== false;
        this.syncNotification = uni.getStorageSync('offline_sync_notification') !== false;
      } catch (e) {
        console.error('加载设置失败:', e);
      }
    },
    
    /**
     * 初始化网络监测
     */
    initNetworkMonitor() {
      // 开始监测
      networkMonitor.start();
      
      // 获取当前状态
      this.updateNetworkStatus();
      
      // 监听网络状态变化
      this.networkUnsubscribe = networkMonitor.on('*', () => {
        this.updateNetworkStatus();
      });
    },
    
    /**
     * 初始化缓存管理器
     */
    async initCacheManager() {
      try {
        await cacheManager.init();
        console.log('[OfflineManager] 缓存管理器初始化完成');
      } catch (e) {
        console.error('[OfflineManager] 缓存管理器初始化失败:', e);
      }
    },
    
    /**
     * 更新网络状态
     */
    updateNetworkStatus() {
      this.networkStatus = networkMonitor.getStatus();
      this.networkSuggestion = networkMonitor.getSuggestion();
    },
    
    /**
     * 刷新统计
     */
    async refreshStats() {
      this.loading = true;
      
      try {
        this.cacheStats = await cacheManager.getStats();
        console.log('[OfflineManager] 缓存统计:', this.cacheStats);
      } catch (e) {
        console.error('[OfflineManager] 获取统计失败:', e);
        uni.showToast({
          title: '获取统计失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    /**
     * 同步离线队列
     */
    async syncOfflineQueue() {
      if (this.networkStatus.status === 'offline') {
        uni.showToast({
          title: '当前离线，无法同步',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({
        title: '同步中...'
      });
      
      try {
        const result = await cacheManager.syncOfflineQueue();
        
        uni.hideLoading();
        
        if (result.success > 0) {
          uni.showToast({
            title: `同步成功${result.success}项`,
            icon: 'success'
          });
          
          // 刷新统计
          this.refreshStats();
        } else {
          uni.showToast({
            title: '没有需要同步的数据',
            icon: 'none'
          });
        }
      } catch (e) {
        console.error('[OfflineManager] 同步失败:', e);
        uni.hideLoading();
        uni.showToast({
          title: '同步失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 显示清空确认
     */
    showClearConfirm() {
      uni.showModal({
        title: '清空缓存',
        content: '确定要清空所有缓存吗？这将删除离线数据，但不会影响已上传到云端的数据。',
        confirmText: '清空',
        confirmColor: '#f44336',
        success: (res) => {
          if (res.confirm) {
            this.clearCache();
          }
        }
      });
    },
    
    /**
     * 清空缓存
     */
    async clearCache() {
      uni.showLoading({
        title: '清空中...'
      });
      
      try {
        await cacheManager.clearAll();
        
        uni.hideLoading();
        uni.showToast({
          title: '清空成功',
          icon: 'success'
        });
        
        // 刷新统计
        this.refreshStats();
      } catch (e) {
        console.error('[OfflineManager] 清空缓存失败:', e);
        uni.hideLoading();
        uni.showToast({
          title: '清空失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 切换自动同步
     */
    toggleAutoSync(e) {
      this.autoSync = e.detail.value;
      uni.setStorageSync('offline_auto_sync', this.autoSync);
      
      uni.showToast({
        title: this.autoSync ? '已开启自动同步' : '已关闭自动同步',
        icon: 'none'
      });
    },
    
    /**
     * 切换同步提醒
     */
    toggleSyncNotification(e) {
      this.syncNotification = e.detail.value;
      uni.setStorageSync('offline_sync_notification', this.syncNotification);
      
      uni.showToast({
        title: this.syncNotification ? '已开启同步提醒' : '已关闭同步提醒',
        icon: 'none'
      });
    },
    
    /**
     * 获取网络类型文本
     */
    getNetworkTypeText(type) {
      const texts = {
        'wifi': 'WiFi',
        '2g': '2G',
        '3g': '3G',
        '4g': '4G',
        '5g': '5G',
        'none': '无网络',
        'unknown': '未知'
      };
      return texts[type] || '未知';
    },
    
    /**
     * 获取质量文本
     */
    getQualityText(quality) {
      const texts = {
        'excellent': '优秀',
        'good': '良好',
        'fair': '一般',
        'poor': '较差',
        'offline': '离线'
      };
      return texts[quality] || '未知';
    },
    
    /**
     * 获取统计项名称
     */
    getStatName(key) {
      const names = {
        'SCALES': '量表数据',
        'RESULTS': '评估结果',
        'CHATS': '聊天记录',
        'MUSIC': '音乐数据',
        'GENERAL': '通用缓存'
      };
      return names[key] || key;
    },
    
    /**
     * 返回
     */
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style lang="scss" scoped>
.offline-manager {
  width: 100%;
  min-height: 100vh;
  background: #f5f5f5;
}

// 导航栏
.nav-bar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: #fff;
  border-bottom: 1px solid #eee;
}

.nav-content {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
}

.nav-left,
.nav-right {
  width: 60px;
}

.nav-left {
  display: flex;
  align-items: center;
}

.icon-back {
  font-size: 20px;
  color: #333;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 500;
  color: #333;
}

// 内容区域
.content {
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
}

// 卡片样式
.card {
  margin: 12px;
  padding: 16px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

// 网络状态
.status-badge {
  display: flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status-online {
  background: #e8f5e9;
  color: #4caf50;
}

.status-offline {
  background: #ffebee;
  color: #f44336;
}

.status-dot {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin-right: 6px;
  border-radius: 50%;
  background: currentColor;
}

.network-info {
  margin-bottom: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #666;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.network-suggestion {
  display: flex;
  align-items: flex-start;
  padding: 12px;
  background: #fff3e0;
  border-radius: 8px;
  margin-top: 12px;
}

.suggestion-icon {
  font-size: 16px;
  margin-right: 8px;
}

.suggestion-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: #e65100;
}

// 缓存统计
.refresh-btn {
  font-size: 14px;
  color: #2196f3;
}

.loading-state {
  padding: 40px 0;
  text-align: center;
}

.loading-text {
  font-size: 14px;
  color: #999;
}

.stats-list {
  margin-bottom: 16px;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-item.highlight {
  background: #fff3e0;
  padding: 12px;
  border-radius: 8px;
  margin-top: 8px;
}

.stat-info {
  display: flex;
  flex-direction: column;
}

.stat-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.stat-count {
  font-size: 12px;
  color: #999;
}

.stat-size {
  font-size: 13px;
  font-weight: 500;
  color: #666;
}

.sync-btn {
  padding: 6px 16px;
  background: #ff9800;
  color: #fff;
  border-radius: 16px;
  font-size: 13px;
}

.clear-cache-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 44px;
  background: #f44336;
  border-radius: 8px;
}

.btn-text {
  font-size: 15px;
  font-weight: 500;
  color: #fff;
}

// 离线功能
.feature-list {
  
}

.feature-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}

.feature-item:last-child {
  border-bottom: none;
}

.feature-info {
  display: flex;
  align-items: center;
  flex: 1;
}

.feature-icon {
  font-size: 24px;
  margin-right: 12px;
}

.feature-text {
  display: flex;
  flex-direction: column;
}

.feature-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.feature-desc {
  font-size: 12px;
  color: #999;
}

.feature-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.feature-status.enabled {
  background: #e8f5e9;
  color: #4caf50;
}

// 使用说明
.tips-list {
  
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-number {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 20px;
  height: 20px;
  margin-right: 12px;
  background: #2196f3;
  color: #fff;
  border-radius: 50%;
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.tip-text {
  flex: 1;
  font-size: 13px;
  line-height: 1.6;
  color: #666;
}
</style>

