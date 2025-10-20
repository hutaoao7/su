<template>
  <view class="community-page">
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
    
    <!-- 话题列表 -->
    <scroll-view 
      scroll-y 
      class="topic-list"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <!-- 空状态 -->
      <view v-if="!loading && topics.length === 0" class="empty-state">
        <u-icon name="chat" size="64" color="#C7C7CC"></u-icon>
        <text class="empty-text">暂无话题</text>
        <text class="empty-hint">快来发布第一个话题吧</text>
      </view>
      
      <!-- 话题项 -->
      <view 
        v-for="topic in topics" 
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
      isRefreshing: false
    };
  },
  
  onLoad() {
    this.loadTopics();
  },
  
  onShow() {
    // 通知导航栏更新状态
    tabBarManager.setCurrentIndexByPath('/pages/community/index');
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
    onRefresh() {
      this.isRefreshing = true;
      this.page = 1;
      this.hasMore = true;
      this.loadTopics();
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
  width: 40rpx;
  height: 6rpx;
  background: #0A84FF;
  border-radius: 3rpx;
}

/* 话题列表 */
.topic-list {
  height: calc(100vh - 88rpx);
  padding: 24rpx;
}

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
}

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
  bottom: 120rpx;
  width: 112rpx;
  height: 112rpx;
  border-radius: 50%;
  background: #0A84FF;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(10, 132, 255, 0.4);
  z-index: 100;
}

.publish-btn:active {
  transform: scale(0.95);
}
</style>