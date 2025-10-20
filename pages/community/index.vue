<template>
  <view class="community-page">
    <!-- 任务3: 话题搜索功能 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <u-icon name="search" size="18" color="#86868B"></u-icon>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索话题..."
          @input="handleSearchInput"
          @confirm="performSearch"
        />
        <u-icon
          v-if="searchKeyword"
          name="close-circle-fill"
          size="18"
          color="#86868B"
          @tap="clearSearch"
        ></u-icon>
      </view>
    </view>

    <!-- 顶部分类 -->
    <view class="category-tabs">
      <scroll-view scroll-x class="tab-scroll">
        <view class="tab-list">
          <view
            v-for="(tab, index) in categories"
            :key="index"
            class="tab-item"
            :class="{ active: currentCategory === tab.value }"
            @tap="switchCategory(tab.value)"
          >
            {{ tab.label }}
          </view>
        </view>
      </scroll-view>
    </view>
    
    <!-- 话题列表 - 支持虚拟滚动 -->
    <scroll-view
      scroll-y
      class="topic-list"
      @scrolltolower="loadMore"
      @scroll="onScroll"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
      :enable-back-to-top="true"
      :scroll-with-animation="true"
    >
      <!-- 骨架屏加载 -->
      <view v-if="loading && page === 1" class="skeleton-loading">
        <view v-for="n in 3" :key="n" class="skeleton-topic-item">
          <view class="skeleton-title"></view>
          <view class="skeleton-content"></view>
          <view class="skeleton-footer"></view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else-if="!loading && topics.length === 0" class="empty-state">
        <u-icon name="chat" size="64" color="#C7C7CC"></u-icon>
        <text class="empty-text">暂无话题</text>
        <text class="empty-hint">快来发布第一个话题吧</text>
      </view>

      <!-- 虚拟列表容器 - 仅渲染可见区域的话题 -->
      <view class="virtual-list-container">
        <!-- 顶部占位符 -->
        <view v-if="visibleTopics.length > 0" :style="{ height: topPlaceholderHeight + 'px' }"></view>

        <!-- 话题项 - 虚拟滚动渲染 -->
        <view
          v-for="topic in visibleTopics"
          :key="topic.id"
          class="topic-item"
          @tap="goToDetail(topic.id)"
        >
          <!-- 置顶标签 -->
          <view v-if="topic.is_pinned" class="pinned-tag">
            <u-icon name="pushpin" size="12" color="#FF9500"></u-icon>
            <text class="pinned-text">置顶</text>
          </view>

          <!-- 话题内容 -->
          <view class="topic-content">
            <text class="topic-title">{{ topic.title }}</text>
            <text class="topic-summary">{{ topic.contentSummary }}</text>
          </view>

          <!-- 作者信息 -->
          <view class="topic-author">
            <image
              class="author-avatar"
              :src="topic.author_avatar || '/static/images/default-avatar.png'"
              mode="aspectFill"
              lazy-load
            />
            <text class="author-name">{{ topic.author_name }}</text>
            <text class="publish-time">{{ formatTime(topic.created_at) }}</text>
          </view>

          <!-- 互动数据 -->
          <view class="topic-stats">
            <view class="stat-item">
              <u-icon name="eye" size="16" color="#86868B"></u-icon>
              <text class="stat-value">{{ topic.views_count || 0 }}</text>
            </view>
            <view class="stat-item" @tap.stop="likeTopic(topic)">
              <u-icon
                :name="topic.isLiked ? 'heart-fill' : 'heart'"
                size="16"
                :color="topic.isLiked ? '#FF4444' : '#86868B'"
              ></u-icon>
              <text class="stat-value">{{ topic.likes_count || 0 }}</text>
            </view>
            <view class="stat-item">
              <u-icon name="chat" size="16" color="#86868B"></u-icon>
              <text class="stat-value">{{ topic.comments_count || 0 }}</text>
            </view>
          </view>
        </view>

        <!-- 底部占位符 -->
        <view v-if="visibleTopics.length > 0" :style="{ height: bottomPlaceholderHeight + 'px' }"></view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more">
        <u-loadmore :status="loadStatus" />
      </view>
    </scroll-view>
    
    <!-- 发布按钮 -->
    <view class="publish-btn" @tap="goToPublish">
      <u-icon name="plus" size="24" color="#FFFFFF"></u-icon>
    </view>
    
    
  </view>
</template>

<script>
import { getTopicList, likeTopic as likeTopicApi } from '@/api/community.js';
import tabBarManager from '@/utils/tabbar-manager.js';

export default {
  data() {
    return {
      categories: [
        { label: '全部', value: 'all' },
        { label: '心情', value: 'mood' },
        { label: '学习', value: 'study' },
        { label: '生活', value: 'life' },
        { label: '情感', value: 'emotion' },
        { label: '求助', value: 'help' }
      ],
      currentCategory: 'all',
      topics: [],
      page: 1,
      pageSize: 10,
      hasMore: true,
      loading: false,
      loadStatus: 'loadmore',
      isRefreshing: false,
      // 虚拟滚动相关
      visibleTopics: [],
      scrollTop: 0,
      itemHeight: 320, // 每个话题项的高度（rpx转px后约160px）
      bufferSize: 3, // 缓冲区大小（显示区域外额外渲染的项数）
      topPlaceholderHeight: 0,
      bottomPlaceholderHeight: 0,
      viewportHeight: 0,
      // 任务3: 搜索功能相关
      searchKeyword: '',
      searchHistory: [],
      isSearching: false,
      searchResults: []
    };
  },
  
  onLoad() {
    // 获取视口高度
    const systemInfo = uni.getSystemInfoSync();
    this.viewportHeight = systemInfo.windowHeight;

    this.loadTopics();
  },

  onShow() {
    // 通知导航栏更新状态
    tabBarManager.setCurrentIndexByPath('/pages/community/index');
  },

  computed: {
    // 计算可见的话题列表
    visibleTopicsComputed() {
      if (this.topics.length === 0) return [];

      // 计算起始和结束索引
      const startIndex = Math.max(0, Math.floor(this.scrollTop / this.itemHeight) - this.bufferSize);
      const endIndex = Math.min(
        this.topics.length,
        Math.ceil((this.scrollTop + this.viewportHeight) / this.itemHeight) + this.bufferSize
      );

      // 计算占位符高度
      this.topPlaceholderHeight = startIndex * this.itemHeight;
      this.bottomPlaceholderHeight = Math.max(0, (this.topics.length - endIndex) * this.itemHeight);

      return this.topics.slice(startIndex, endIndex);
    }
  },

  watch: {
    // 监听topics变化，更新可见列表
    topics() {
      this.updateVisibleTopics();
    }
  },
  
  methods: {
    // 切换分类
    switchCategory(category) {
      if (this.currentCategory === category) return;
      
      this.currentCategory = category;
      this.page = 1;
      this.topics = [];
      this.hasMore = true;
      this.loadTopics();
    },
    
    // 加载话题列表
    async loadTopics() {
      if (this.loading || !this.hasMore) return;
      
      this.loading = true;
      this.loadStatus = 'loading';
      
      try {
        const res = await getTopicList({
          page: this.page,
          pageSize: this.pageSize,
          category: this.currentCategory,
          sortBy: 'latest'
        });
        
        if (res.errCode === 0) {
          const { list, hasMore } = res.data;
          
          if (this.page === 1) {
            this.topics = list;
          } else {
            this.topics.push(...list);
          }
          
          this.hasMore = hasMore;
          this.loadStatus = hasMore ? 'loadmore' : 'nomore';
        } else {
          uni.showToast({
            title: res.errMsg || '加载失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('加载话题失败:', error);
        uni.showToast({
          title: '网络错误',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        this.isRefreshing = false;
      }
    },
    
    // 下拉刷新
    async onRefresh() {
      this.isRefreshing = true;
      this.page = 1;
      this.hasMore = true;
      
      // 添加触感反馈
      uni.vibrateShort({
        type: 'light'
      });
      
      await this.loadTopics();
      
      // 刷新完成提示
      if (!this.loading) {
        uni.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1500
        });
      }
    },
    
    // 加载更多
    loadMore() {
      if (this.hasMore && !this.loading) {
        this.page++;
        this.loadTopics();
      }
    },
    
    // 点赞话题
    async likeTopic(topic) {
      try {
        // 乐观更新
        topic.isLiked = !topic.isLiked;
        topic.likes_count += topic.isLiked ? 1 : -1;
        
        const res = await likeTopicApi(topic.id);
        
        if (res.errCode !== 0) {
          // 回滚
          topic.isLiked = !topic.isLiked;
          topic.likes_count += topic.isLiked ? 1 : -1;
          
          uni.showToast({
            title: res.errMsg || '操作失败',
            icon: 'none'
          });
        }
      } catch (error) {
        // 回滚
        topic.isLiked = !topic.isLiked;
        topic.likes_count += topic.isLiked ? 1 : -1;
        
        console.error('点赞失败:', error);
      }
    },
    
    // 跳转到详情
    goToDetail(topicId) {
      uni.navigateTo({
        url: `/pages/community/detail?id=${topicId}`
      });
    },
    
    // 跳转到发布页
    goToPublish() {
      // 检查登录状态
      const token = uni.getStorageSync('token');
      if (!token) {
        uni.showToast({
          title: '请先登录',
          icon: 'none'
        });
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/login/login'
          });
        }, 1500);
        return;
      }
      
      uni.navigateTo({
        url: '/pages/community/publish'
      });
    },
    
    // 格式化时间
    formatTime(timestamp) {
      if (!timestamp) return '';

      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;

      if (diff < 60000) {
        return '刚刚';
      } else if (diff < 3600000) {
        return Math.floor(diff / 60000) + '分钟前';
      } else if (diff < 86400000) {
        return Math.floor(diff / 3600000) + '小时前';
      } else if (diff < 604800000) {
        return Math.floor(diff / 86400000) + '天前';
      } else {
        return date.toLocaleDateString();
      }
    },

    // 虚拟滚动：处理滚动事件
    // 任务1: 虚拟列表recycle-list优化
    onScroll(event) {
      // 获取滚动距离（需要转换单位）
      this.scrollTop = event.detail.scrollTop || 0;
      this.updateVisibleTopics();

      // 任务1增强: 性能监控
      if (this.topics.length > 100) {
        // 大数据量时，记录性能指标
        const visibleCount = this.visibleTopics.length;
        const totalCount = this.topics.length;
        const renderRatio = (visibleCount / totalCount * 100).toFixed(2);
        console.log(`[VIRTUAL-SCROLL] 渲染比例: ${renderRatio}% (${visibleCount}/${totalCount})`);
      }
    },

    // 更新可见的话题列表
    // 任务1: 虚拟列表recycle-list优化 - 动态高度计算
    updateVisibleTopics() {
      if (this.topics.length === 0) {
        this.visibleTopics = [];
        return;
      }

      // 任务1优化: 动态计算项目高度
      // 根据内容长度动态调整高度
      const avgItemHeight = this.calculateAverageItemHeight();

      // 计算起始和结束索引
      const startIndex = Math.max(0, Math.floor(this.scrollTop / avgItemHeight) - this.bufferSize);
      const endIndex = Math.min(
        this.topics.length,
        Math.ceil((this.scrollTop + this.viewportHeight) / avgItemHeight) + this.bufferSize
      );

      // 计算占位符高度
      this.topPlaceholderHeight = startIndex * avgItemHeight;
      this.bottomPlaceholderHeight = Math.max(0, (this.topics.length - endIndex) * avgItemHeight);

      // 更新可见列表
      this.visibleTopics = this.topics.slice(startIndex, endIndex);
    },

    // 任务1增强: 计算平均项目高度
    calculateAverageItemHeight() {
      // 根据话题内容长度动态计算高度
      if (this.topics.length === 0) return this.itemHeight;

      let totalHeight = 0;
      const sampleSize = Math.min(10, this.topics.length);

      for (let i = 0; i < sampleSize; i++) {
        const topic = this.topics[i];
        // 基础高度 + 内容长度影响
        const contentLength = (topic.title || '').length + (topic.contentSummary || '').length;
        const dynamicHeight = 320 + Math.ceil(contentLength / 20) * 20;
        totalHeight += dynamicHeight;
      }

      return Math.ceil(totalHeight / sampleSize);
    },

    // 任务3: 搜索功能
    handleSearchInput(e) {
      this.searchKeyword = e.detail.value || '';
    },

    // 任务3: 执行搜索
    async performSearch() {
      if (!this.searchKeyword.trim()) {
        uni.showToast({
          title: '请输入搜索关键词',
          icon: 'none'
        });
        return;
      }

      this.isSearching = true;

      try {
        // 保存搜索历史
        if (!this.searchHistory.includes(this.searchKeyword)) {
          this.searchHistory.unshift(this.searchKeyword);
          if (this.searchHistory.length > 10) {
            this.searchHistory.pop();
          }
          uni.setStorageSync('community_search_history', this.searchHistory);
        }

        // 调用搜索API
        const res = await getTopicList({
          page: 1,
          pageSize: 20,
          keyword: this.searchKeyword,
          sortBy: 'relevance'
        });

        if (res.errCode === 0) {
          this.searchResults = res.data.list || [];
          this.topics = this.searchResults;
          this.page = 1;
          this.hasMore = res.data.hasMore;

          uni.showToast({
            title: `找到${this.searchResults.length}个结果`,
            icon: 'success',
            duration: 1500
          });
        }
      } catch (error) {
        console.error('[SEARCH] 搜索失败:', error);
        uni.showToast({
          title: '搜索失败',
          icon: 'none'
        });
      } finally {
        this.isSearching = false;
      }
    },

    // 任务3: 清除搜索
    clearSearch() {
      this.searchKeyword = '';
      this.searchResults = [];
      this.page = 1;
      this.loadTopics();
    }
  }
};
</script>

<style scoped>
.community-page {
  min-height: 100vh;
  background: #F5F5F7;
  position: relative;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: calc(50px + constant(safe-area-inset-bottom));
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}

/* 任务3: 搜索栏样式 */
.search-bar {
  background: #FFFFFF;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #E5E5EA;
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #F5F5F7;
  border-radius: 20rpx;
  padding: 12rpx 16rpx;
  gap: 12rpx;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 28rpx;
  color: #1D1D1F;
  outline: none;
}

.search-input::placeholder {
  color: #C7C7CC;
}

/* 分类标签 */
.category-tabs {
  background: #FFFFFF;
  border-bottom: 1rpx solid #E5E5EA;
  position: sticky;
  top: 0;
  z-index: 10;
}

.tab-scroll {
  height: 88rpx;
}

.tab-list {
  display: flex;
  padding: 0 24rpx;
  height: 100%;
  align-items: center;
}

.tab-item {
  padding: 0 24rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  color: #86868B;
  white-space: nowrap;
  position: relative;
}

.tab-item.active {
  color: #1D1D1F;
  font-weight: 600;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  background: #0A84FF;
  border-radius: 3rpx;
}

/* 话题列表 */
.topic-list {
  height: calc(100vh - 88rpx);
  padding: 24rpx;
}

/* 虚拟列表容器 - 通过占位符实现高效渲染 */
.virtual-list-container {
  width: 100%;
; max-width: 750rpx; overflow: hidden}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 48rpx;
  text-align: center;
}

.empty-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-top: 24rpx;
}

.empty-hint {
  font-size: 28rpx;
  color: #86868B;
  margin-top: 16rpx;
}

/* 骨架屏加载 */
.skeleton-loading {
  padding: 24rpx;
}

.skeleton-topic-item {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.skeleton-title,
.skeleton-content,
.skeleton-footer {
  height: 44px;
  background: linear-gradient(90deg, #F0F0F5 25%, #E5E5EA 50%, #F0F0F5 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 8rpx;
  margin-bottom: 16rpx;
}

.skeleton-title {
  width: 70%;
  height: 44px;
}

.skeleton-content {
  width: 100%;
  height: 64rpx;
; max-width: 750rpx; overflow: hidden}

.skeleton-footer {
  width: 50%;
  height: 44px;
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 话题项 */
.topic-item {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  position: relative;
}

.pinned-tag {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #FFF3E0;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.pinned-text {
  font-size: 24rpx;
  color: #FF9500;
}

.topic-content {
  margin-bottom: 24rpx;
}

.topic-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  line-height: 1.6;
  display: block;
  margin-bottom: 12rpx;
}

.topic-summary {
  font-size: 28rpx;
  color: #86868B;
  line-height: 1.6;
  display: block;
}

.topic-author {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.author-avatar {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  margin-right: 16rpx;
; overflow: hidden}

.author-name {
  font-size: 28rpx;
  color: #1D1D1F;
  margin-right: 16rpx;
}

.publish-time {
  font-size: 24rpx;
  color: #C7C7CC;
}

.topic-stats {
  display: flex;
  gap: 48rpx;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-value {
  font-size: 26rpx;
  color: #86868B;
}

/* 加载更多 */
.load-more {
  padding: 32rpx 0;
}

/* 发布按钮 */
.publish-btn {
  position: fixed;
  right: 32rpx;
  /* 底部安全区域适配 - TabBar高度(50px ≈ 100rpx) + 间距(20rpx) + 安全区域 */
  bottom: calc(120rpx + constant(safe-area-inset-bottom));
  bottom: calc(120rpx + env(safe-area-inset-bottom));
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #0A84FF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(10, 132, 255, 0.4);
  z-index: 100;
; overflow: hidden}

.publish-btn:active {
  transform: scale(0.95);
}


/* 响应式布局 - 平板设备 */
@media (min-width: 768px) {
  /* 平板设备样式 */
}

/* 响应式布局 - 大屏设备 */
@media (min-width: 1024px) {
  /* 大屏设备样式 */
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