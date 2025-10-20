<template>
  <view class="music-page">
    <!-- 导航栏 -->
    <view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <text class="navbar-title">音乐放松</text>
    </view>
    
    <!-- 分类标签 -->
    <scroll-view 
      class="category-tabs" 
      scroll-x 
      :scroll-into-view="'category-' + currentCategory"
      show-scrollbar="false"
    >
      <view 
        v-for="cat in categories" 
        :key="cat.code"
        :id="'category-' + cat.code"
        class="category-item"
        :class="{ active: currentCategory === cat.code }"
        @tap="switchCategory(cat.code)"
      >
        <text class="category-text">{{ cat.name }}</text>
      </view>
    </scroll-view>
    
    <!-- 曲目列表 -->
    <scroll-view 
      class="track-list"
      scroll-y
      :style="{ height: listHeight + 'px' }"
      @scrolltolower="loadMore"
      :lower-threshold="100"
    >
      <!-- 加载状态 -->
      <view v-if="loading && tracks.length === 0" class="loading-container">
        <u-loading mode="circle" color="#0A84FF" size="40"></u-loading>
        <text class="loading-text">加载中...</text>
      </view>
      
      <!-- 曲目列表 -->
      <view v-else-if="tracks.length > 0" class="tracks-container">
        <view 
          v-for="(track, index) in tracks" 
          :key="track.track_id"
          class="track-card"
          @tap="playTrack(track)"
        >
          <!-- 封面 -->
          <view class="track-cover">
            <image 
              class="cover-img"
              :src="track.cover_url || '/static/images/music-cover.png'"
              mode="aspectFill"
              :lazy-load="true"
            />
            <view class="play-icon-overlay">
              <u-icon name="play-circle-fill" size="24" color="#FFFFFF"></u-icon>
            </view>
          </view>
          
          <!-- 信息 -->
          <view class="track-info">
            <view class="track-header">
              <text class="track-title">{{ track.title }}</text>
              <u-icon 
                v-if="track.is_premium" 
                name="vip-card" 
                size="14" 
                color="#FFB74D"
              ></u-icon>
            </view>
            <text class="track-subtitle">{{ track.artist || '未知艺术家' }}</text>
            <view class="track-meta">
              <text class="meta-text">{{ formatDuration(track.duration) }}</text>
              <text class="meta-dot">·</text>
              <text class="meta-text">{{ track.play_count || 0 }}次播放</text>
            </view>
          </view>
          
          <!-- 收藏按钮 -->
          <view class="track-actions" @tap.stop="toggleFavorite(track)">
            <u-icon 
              :name="track.is_favorited ? 'star-fill' : 'star'" 
              size="20" 
              :color="track.is_favorited ? '#FFB74D' : '#86868B'"
            ></u-icon>
          </view>
        </view>
        
        <!-- 加载更多 -->
        <view v-if="hasMore" class="load-more">
          <u-loading v-if="loadingMore" mode="circle" color="#0A84FF" size="20"></u-loading>
          <text v-else class="load-more-text">上拉加载更多</text>
        </view>
        <view v-else-if="tracks.length > 0" class="no-more">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <u-icon name="music" size="60" color="#C7C7CC"></u-icon>
        <text class="empty-text">暂无音乐</text>
      </view>
    </scroll-view>
    
    <!-- 底部安全区域占位 -->
    <view class="safe-area-bottom"></view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent, trackClick } from '@/utils/analytics.js';

export default {
  data() {
    return {
      // 状态栏高度
      statusBarHeight: 0,
      listHeight: 500,
      
      // 分类列表
      categories: [
        { code: 'all', name: '全部' },
        { code: 'meditation', name: '冥想引导' },
        { code: 'nature', name: '自然音效' },
        { code: 'music', name: '放松音乐' },
        { code: 'sleep', name: '助眠音乐' },
        { code: 'focus', name: '专注音乐' }
      ],
      currentCategory: 'all',
      
      // 曲目列表
      tracks: [],
      loading: false,
      loadingMore: false,
      hasMore: true,
      
      // 分页
      page: 1,
      pageSize: 20
    };
  },
  
  onLoad() {
    // 获取状态栏高度
    const systemInfo = uni.getSystemInfoSync();
    this.statusBarHeight = systemInfo.statusBarHeight || 0;
    
    // 计算列表高度
    this.calculateListHeight();
    
    // 加载曲目列表
    this.loadTracks();
    
    // 埋点
    trackEvent('music_index_view');
  },
  
  methods: {
    /**
     * 计算列表高度
     */
    calculateListHeight() {
      const systemInfo = uni.getSystemInfoSync();
      const windowHeight = systemInfo.windowHeight;
      const navbarHeight = this.statusBarHeight + 44; // 状态栏 + 导航栏
      const tabsHeight = 44; // 分类标签栏
      const safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
      
      this.listHeight = windowHeight - navbarHeight - tabsHeight - safeAreaBottom;
    },
    
    /**
     * 加载曲目列表
     */
    async loadTracks(isRefresh = false) {
      if (this.loading || this.loadingMore) return;
      
      if (isRefresh) {
        this.page = 1;
        this.hasMore = true;
        this.loading = true;
      } else {
        this.loadingMore = true;
      }
      
      try {
        const res = await callCloudFunction('fn-music', {
          action: 'list',
          category: this.currentCategory === 'all' ? undefined : this.currentCategory,
          page: this.page,
          page_size: this.pageSize
        });
        
        if (res && res.data) {
          const newTracks = res.data.list || [];
          
          if (isRefresh) {
            this.tracks = newTracks;
          } else {
            this.tracks = [...this.tracks, ...newTracks];
          }
          
          // 判断是否还有更多
          this.hasMore = newTracks.length >= this.pageSize;
          
          // 页码+1
          if (this.hasMore) {
            this.page++;
          }
        }
      } catch (error) {
        console.error('[MUSIC] 加载列表失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        this.loadingMore = false;
      }
    },
    
    /**
     * 加载更多
     */
    loadMore() {
      if (!this.hasMore || this.loadingMore) return;
      this.loadTracks(false);
    },
    
    /**
     * 切换分类
     */
    switchCategory(code) {
      if (this.currentCategory === code) return;
      
      this.currentCategory = code;
      this.page = 1;
      this.tracks = [];
      this.hasMore = true;
      
      // 加载新分类的曲目
      this.loadTracks(true);
      
      // 埋点
      trackClick('music_category_switch', { category: code });
    },
    
    /**
     * 播放曲目
     */
    playTrack(track) {
      // 埋点
      trackClick('music_track_play', {
        track_id: track.track_id,
        title: track.title
      });
      
      // 跳转到播放器页面
      uni.navigateTo({
        url: `/pages/music/player?track_id=${track.track_id}`
      });
    },
    
    /**
     * 切换收藏
     */
    async toggleFavorite(track) {
      const newFavState = !track.is_favorited;
      
      // 乐观更新UI
      track.is_favorited = newFavState;
      
      try {
        await callCloudFunction('fn-music', {
          action: 'fav',
          track_id: track.track_id,
          favorite: newFavState
        });
        
        // 震动反馈
        uni.vibrateShort({ type: 'light' });
        
        // 提示
        uni.showToast({
          title: newFavState ? '已收藏' : '已取消收藏',
          icon: 'none',
          duration: 1000
        });
        
        // 埋点
        trackClick('music_favorite', {
          track_id: track.track_id,
          action: newFavState ? 'add' : 'remove'
        });
      } catch (error) {
        // 回滚
        track.is_favorited = !newFavState;
        
        uni.showToast({
          title: '操作失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 格式化时长
     */
    formatDuration(seconds) {
      if (!seconds || seconds < 0) return '00:00';
      
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.music-page {
  min-height: 100vh;
  background: #F9F7FF;
}

/* 导航栏 */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background: linear-gradient(180deg, #FFFFFF 0%, #F9F7FF 100%);
  padding-bottom: 12rpx;
}

.navbar-title {
  display: block;
  text-align: center;
  font-size: 36rpx;
  font-weight: 700;
  color: #1D1D1F;
  padding: 12rpx 0;
}

/* 分类标签 */
.category-tabs {
  position: fixed;
  top: calc(constant(safe-area-inset-top) + 44px);
  top: calc(env(safe-area-inset-top) + 44px);
  left: 0;
  right: 0;
  z-index: 99;
  white-space: nowrap;
  background: #FFFFFF;
  padding: 12rpx 0;
  border-bottom: 1rpx solid #E5E5EA;
}

.category-item {
  display: inline-block;
  padding: 12rpx 32rpx;
  margin: 0 8rpx;
  background: #F2F2F7;
  border-radius: 48rpx;
  transition: all 0.3s ease;
}

.category-item.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.category-text {
  font-size: 28rpx;
  color: #1D1D1F;
}

.category-item.active .category-text {
  color: #FFFFFF;
  font-weight: 600;
}

/* 曲目列表 */
.track-list {
  margin-top: calc(constant(safe-area-inset-top) + 44px + 44px);
  margin-top: calc(env(safe-area-inset-top) + 44px + 44px);
}

.tracks-container {
  padding: 24rpx 32rpx;
}

.track-card {
  display: flex;
  align-items: center;
  gap: 24rpx;
  padding: 24rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.track-card:active {
  transform: scale(0.98);
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
}

/* 封面 */
.track-cover {
  position: relative;
  width: 120rpx;
  height: 120rpx;
  border-radius: 16rpx;
  overflow: hidden;
  flex-shrink: 0;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.play-icon-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.track-card:active .play-icon-overlay {
  opacity: 1;
}

/* 信息 */
.track-info {
  flex: 1;
  min-width: 0;
}

.track-header {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 8rpx;
}

.track-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #1D1D1F;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-subtitle {
  display: block;
  font-size: 24rpx;
  color: #86868B;
  margin-bottom: 8rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.meta-text {
  font-size: 22rpx;
  color: #C7C7CC;
}

.meta-dot {
  font-size: 22rpx;
  color: #C7C7CC;
}

/* 操作按钮 */
.track-actions {
  padding: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  gap: 24rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #86868B;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
}

.load-more-text {
  font-size: 26rpx;
  color: #86868B;
}

.no-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
}

.no-more-text {
  font-size: 26rpx;
  color: #C7C7CC;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  gap: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #86868B;
}

/* 底部安全区域 */
.safe-area-bottom {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}

/* 响应式适配 */
@media screen and (max-width: 375px) {
  .track-cover {
    width: 100rpx;
    height: 100rpx;
  }
  
  .track-title {
    font-size: 28rpx;
  }
}

@media screen and (min-width: 768px) {
  .tracks-container {
    max-width: 750rpx;
    margin: 0 auto;
  }
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}



/* 横屏适配 */
@media (orientation: landscape) {
  /* 横屏样式 */
}

</style>
