<template>
  <div v-if="!isOnline" class="offline-indicator">
    <!-- 离线提示条 -->
    <div class="offline-banner">
      <div class="banner-content">
        <icon class="icon">📡</icon>
        <span class="text">{{ offlineMessage }}</span>
        <button v-if="showRetry" class="retry-btn" @click="retryConnection">
          重试
        </button>
      </div>
    </div>

    <!-- 离线模式指示器 -->
    <div v-if="showModeIndicator" class="mode-indicator">
      <span class="mode-badge">离线模式</span>
      <span class="sync-status">{{ syncStatus }}</span>
    </div>
  </div>
</template>

<script>
import networkDetector from '@/utils/network-detector.js';
import offlineSyncManager from '@/utils/offline-sync-manager.js';

export default {
  name: 'OfflineIndicator',
  data() {
    return {
      isOnline: true,
      offlineMessage: '网络已断开，应用将在后台同步数据',
      showRetry: false,
      showModeIndicator: false,
      syncStatus: '等待同步...',
      retryCount: 0,
      maxRetries: 3
    };
  },
  mounted() {
    this.initNetworkDetection();
    this.initSyncMonitoring();
  },
  methods: {
    /**
     * 初始化网络检测
     */
    initNetworkDetection() {
      // 初始状态
      this.isOnline = networkDetector.isOnline;

      // 监听网络状态变化
      networkDetector.onStatusChange((status) => {
        this.isOnline = status.isOnline;
        
        if (status.isOnline) {
          this.offlineMessage = '网络已恢复';
          this.showRetry = false;
          this.retryCount = 0;
          
          // 2秒后隐藏提示
          setTimeout(() => {
            this.isOnline = true;
          }, 2000);
        } else {
          this.offlineMessage = '网络已断开，应用将在后台同步数据';
          this.showRetry = true;
          this.showModeIndicator = true;
        }
      });
    },

    /**
     * 初始化同步监控
     */
    initSyncMonitoring() {
      offlineSyncManager.onSyncStatusChange((status) => {
        if (status.status === 'start') {
          this.syncStatus = '正在同步...';
        } else if (status.status === 'complete') {
          this.syncStatus = '同步完成';
          setTimeout(() => {
            this.syncStatus = '等待同步...';
          }, 2000);
        } else if (status.status === 'error') {
          this.syncStatus = '同步失败';
        }
      });
    },

    /**
     * 重试连接
     */
    async retryConnection() {
      this.retryCount++;
      
      if (this.retryCount > this.maxRetries) {
        this.$toast('重试次数过多，请稍后再试');
        return;
      }

      try {
        const isConnected = await networkDetector.checkConnection();
        
        if (isConnected) {
          this.isOnline = true;
          this.$toast('网络已恢复');
        } else {
          this.$toast(`重试失败 (${this.retryCount}/${this.maxRetries})`);
        }
      } catch (error) {
        console.error('❌ 重试连接失败:', error);
        this.$toast('重试失败，请检查网络');
      }
    }
  },
  beforeUnmount() {
    // 清理监听器
    networkDetector.destroy();
  }
};
</script>

<style scoped lang="scss">
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  
  .offline-banner {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
    color: white;
    padding: 12px 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    animation: slideDown 0.3s ease-out;

    .banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
      max-width: 100%;

      .icon {
        font-size: 18px;
        flex-shrink: 0;
      }

      .text {
        flex: 1;
        font-size: 14px;
        line-height: 1.4;
        word-break: break-word;
      }

      .retry-btn {
        flex-shrink: 0;
        padding: 6px 12px;
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.4);
        color: white;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:active {
          background: rgba(255, 255, 255, 0.3);
          transform: scale(0.95);
        }
      }
    }
  }

  .mode-indicator {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: #fff3cd;
    border-bottom: 1px solid #ffc107;
    font-size: 12px;

    .mode-badge {
      display: inline-block;
      padding: 2px 8px;
      background: #ffc107;
      color: #333;
      border-radius: 3px;
      font-weight: 500;
    }

    .sync-status {
      color: #666;
      flex: 1;
    }
  }
}

@keyframes slideDown {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 480px) {
  .offline-indicator {
    .offline-banner {
      padding: 10px 12px;

      .banner-content {
        gap: 8px;

        .icon {
          font-size: 16px;
        }

        .text {
          font-size: 13px;
        }

        .retry-btn {
          padding: 4px 8px;
          font-size: 11px;
        }
      }
    }

    .mode-indicator {
      padding: 6px 12px;
      font-size: 11px;
    }
  }
}
</style>

