<template>
  <view class="music-module">
    <!-- 分类标签 -->
    <view class="category-tabs">
      <view 
        v-for="category in categories" 
        :key="category"
        class="category-tab"
        :class="{ active: currentCategory === category }"
        @tap="switchCategory(category)"
      >
        {{ getCategoryName(category) }}
      </view>
    </view>

    <!-- 音乐列表 -->
    <view class="music-list">
      <view 
        v-for="item in musicList" 
        :key="item._id"
        class="music-card"
        @tap="showDetail(item)"
      >
        <image :src="item.cover" class="music-cover" mode="aspectFill" />
        <view class="music-info">
          <text class="music-title">{{ item.title }}</text>
          <text class="music-duration">{{ formatDuration(item.duration) }}</text>
        </view>
        <view v-if="item.locked" class="lock-badge">🔒</view>
      </view>
    </view>

    <!-- 音乐详情弹窗 -->
    <view v-if="showDetailModal" class="detail-modal" @tap="hideDetail">
      <view class="detail-content" @tap.stop>
        <view class="detail-header">
          <image :src="currentMusic.cover" class="detail-cover" mode="aspectFill" />
          <view class="detail-info">
            <text class="detail-title">{{ currentMusic.title }}</text>
            <text class="detail-intro">{{ currentMusic.intro }}</text>
          </view>
          <view class="detail-actions">
            <button class="btn-fav" @tap="toggleFav">
              {{ currentMusic.isFav ? '❤️' : '🤍' }}
            </button>
            <button class="btn-ai" @tap="enterAI">进入AI</button>
          </view>
        </view>
        <button class="btn-close" @tap="hideDetail">×</button>
      </view>
    </view>

    <!-- 底部播放器 -->
    <view v-if="currentPlaying" class="bottom-player">
      <image :src="currentPlaying.cover" class="player-cover" mode="aspectFill" />
      <view class="player-info">
        <text class="player-title">{{ currentPlaying.title }}</text>
        <view class="player-progress">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: progressPercent + '%' }"></view>
          </view>
          <text class="progress-text">{{ formatTime(currentProgress) }} / {{ formatTime(currentPlaying.duration) }}</text>
        </view>
      </view>
      <view class="player-controls">
        <button class="btn-play" @tap="togglePlay">
          {{ isPlaying ? '⏸️' : '▶️' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { musicAPI } from '@/utils/unicloud-request.js';
import eventBus, { EVENTS } from '@/utils/event-bus.js';

export default {
  props: {
    musicId: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      categories: [],
      currentCategory: 'relax',
      musicList: [],
      showDetailModal: false,
      currentMusic: null,
      currentPlaying: null,
      isPlaying: false,
      currentProgress: 0,
      progressTimer: null
    }
  },
  computed: {
    progressPercent() {
      if (!this.currentPlaying || !this.currentPlaying.duration) return 0;
      return (this.currentProgress / this.currentPlaying.duration) * 100;
    }
  },
  mounted() {
    this.loadCategories();
    this.setupEventListeners();
    
    // 如果有指定音乐ID，直接显示详情
    if (this.musicId && this.musicId.trim()) {
      this.loadMusicDetail(this.musicId);
    }
  },
  beforeDestroy() {
    this.clearProgressTimer();
    eventBus.off(EVENTS.CDK_REDEEMED, this.handleCdkRedeemed);
  },
  methods: {
    // 设置事件监听
    setupEventListeners() {
      eventBus.on(EVENTS.CDK_REDEEMED, this.handleCdkRedeemed);
    },

    // 加载分类
    async loadCategories() {
      try {
        const result = await musicAPI.categories();
        if (result.code === 0) {
          this.categories = result.data;
          if (this.categories.length > 0) {
            this.currentCategory = this.categories[0];
            this.loadMusicList();
          }
        }
      } catch (error) {
        console.error('加载分类失败:', error);
      }
    },

    // 加载音乐列表
    async loadMusicList() {
      try {
        const result = await musicAPI.list(this.currentCategory);
        if (result.code === 0) {
          this.musicList = result.data.list || [];
        }
      } catch (error) {
        console.error('加载音乐列表失败:', error);
      }
    },

    // 加载音乐详情
    async loadMusicDetail(id) {
      try {
        const result = await musicAPI.detail(id);
        if (result.code === 0) {
          this.currentMusic = result.data;
          this.showDetailModal = true;
        }
      } catch (error) {
        console.error('加载音乐详情失败:', error);
      }
    },

    // 切换分类
    switchCategory(category) {
      this.currentCategory = category;
      this.loadMusicList();
    },

    // 获取分类名称
    getCategoryName(category) {
      const names = {
        relax: '放松',
        focus: '专注',
        sleep: '睡眠'
      };
      return names[category] || category;
    },

    // 显示详情
    showDetail(item) {
      this.currentMusic = item;
      this.showDetailModal = true;
    },

    // 隐藏详情
    hideDetail() {
      this.showDetailModal = false;
      this.currentMusic = null;
    },

    // 切换收藏
    async toggleFav() {
      if (!this.currentMusic) return;
      
      try {
        const newFavState = !this.currentMusic.isFav;
        const result = await musicAPI.fav(this.currentMusic._id, newFavState);
        
        if (result.code === 0) {
          this.currentMusic.isFav = newFavState;
          uni.showToast({
            title: newFavState ? '已收藏' : '已取消收藏',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('收藏操作失败:', error);
      }
    },

    // 进入AI模块
    enterAI() {
      this.hideDetail();
      this.$emit('switch-to', 'ai', { scene: 'study' });
    },

    // 播放控制
    togglePlay() {
      this.isPlaying = !this.isPlaying;
      
      if (this.isPlaying) {
        this.startProgressTimer();
      } else {
        this.clearProgressTimer();
      }
    },

    // 开始进度计时
    startProgressTimer() {
      this.clearProgressTimer();
      this.progressTimer = setInterval(() => {
        this.currentProgress += 1;
        
        // 每10秒更新一次进度到服务器
        if (this.currentProgress % 10 === 0 && this.currentPlaying) {
          this.updateProgress();
        }
        
        // 播放结束
        if (this.currentProgress >= this.currentPlaying.duration) {
          this.isPlaying = false;
          this.clearProgressTimer();
        }
      }, 1000);
    },

    // 清除进度计时器
    clearProgressTimer() {
      if (this.progressTimer) {
        clearInterval(this.progressTimer);
        this.progressTimer = null;
      }
    },

    // 更新播放进度
    async updateProgress() {
      if (!this.currentPlaying) return;
      
      try {
        await musicAPI.progress(this.currentPlaying._id, this.currentProgress);
      } catch (error) {
        console.error('更新进度失败:', error);
      }
    },

    // CDK兑换成功处理
    handleCdkRedeemed() {
      // 重新加载当前分类的音乐列表
      this.loadMusicList();
    },

    // 格式化时长
    formatDuration(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    // 格式化时间
    formatTime(seconds) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped>
.music-module {
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 分类标签 */
.category-tabs {
  display: flex;
  margin-bottom: 24rpx;
}

.category-tab {
  flex: 1;
  text-align: center;
  padding: 16rpx;
  background: rgba(255, 255, 255, 0.2);
  margin-right: 12rpx;
  border-radius: 8rpx;
  color: rgba(255, 255, 255, 0.8);
  font-size: 24rpx;
}

.category-tab:last-child {
  margin-right: 0;
}

.category-tab.active {
  background: rgba(255, 255, 255, 0.3);
  color: #FFFFFF;
  font-weight: 500;
}

/* 音乐列表 */
.music-list {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  overflow-y: auto;
}

.music-card {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12rpx;
  padding: 16rpx;
  position: relative;
}

.music-cover {
  width: 100%;
  height: 200rpx;
  border-radius: 8rpx;
  margin-bottom: 12rpx;
}

.music-info {
  text-align: center;
}

.music-title {
  display: block;
  font-size: 24rpx;
  color: #FFFFFF;
  font-weight: 500;
  margin-bottom: 4rpx;
}

.music-duration {
  display: block;
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.7);
}

.lock-badge {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  font-size: 20rpx;
}

/* 详情弹窗 */
.detail-modal {
  position: fixed;
  top: calc(0px + env(safe-area-inset-top));
  left: 0;
  right: 0;
  bottom: calc(0px + env(safe-area-inset-bottom));
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.detail-content {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
  margin: 48rpx;
  position: relative;
  max-height: 80vh;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 24rpx;
}

.detail-cover {
  width: 120rpx;
  height: 120rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}

.detail-info {
  flex: 1;
}

.detail-title {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 8rpx;
}

.detail-intro {
  display: block;
  font-size: 24rpx;
  color: #86868B;
  line-height: 1.4;
}

.detail-actions {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.btn-fav, .btn-ai {
  padding: 12rpx 16rpx;
  border-radius: 8rpx;
  border: none;
  font-size: 22rpx;
}

.btn-fav {
  background: #FF3B30;
  color: #FFFFFF;
}

.btn-ai {
  background: #007AFF;
  color: #FFFFFF;
}

.btn-close {
  position: absolute;
  top: 16rpx;
  right: 16rpx;
  width: 48rpx;
  height: 48rpx;
  border-radius: 24rpx;
  background: #F2F2F7;
  border: none;
  font-size: 24rpx;
  color: #86868B;
}

/* 底部播放器 */
.bottom-player {
  position: fixed;
  bottom: calc(0px + env(safe-area-inset-bottom));
  left: 0;
  right: 0;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  border-top: 1rpx solid rgba(0, 0, 0, 0.1);
}

.player-cover {
  width: 80rpx;
  height: 80rpx;
  border-radius: 8rpx;
  margin-right: 16rpx;
}

.player-info {
  flex: 1;
}

.player-title {
  display: block;
  font-size: 24rpx;
  color: #1D1D1F;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.progress-bar {
  height: 44px;
  background: #E5E5EA;
  border-radius: 2rpx;
  margin-bottom: 4rpx;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: #007AFF;
  border-radius: 2rpx;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 20rpx;
  color: #86868B;
}

.player-controls {
  margin-left: 16rpx;
}

.btn-play {
  width: 64rpx;
  height: 64rpx;
  border-radius: 32rpx;
  background: #007AFF;
  border: none;
  font-size: 24rpx;
  color: #FFFFFF;
}
</style>