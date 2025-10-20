<template>
  <view class="mentions-page">
    <!-- 顶部标签 -->
    <view class="mentions-header">
      <view class="header-title">
        <text class="title-text">提醒中心</text>
        <view v-if="unreadCount > 0" class="unread-badge">{{ unreadCount }}</view>
      </view>
      <button v-if="unreadCount > 0" class="mark-all-btn" @tap="markAllAsRead">
        全部标记已读
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <u-loading mode="circle" size="40"></u-loading>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 空状态 -->
    <view v-else-if="mentions.length === 0" class="empty-state">
      <u-icon name="chat" size="64" color="#C7C7CC"></u-icon>
      <text class="empty-text">暂无提醒</text>
      <text class="empty-hint">当有人@你时，会在这里显示</text>
    </view>

    <!-- 提醒列表 -->
    <scroll-view 
      v-else
      scroll-y 
      class="mentions-list"
      @scrolltolower="loadMore"
      :refresher-enabled="true"
      :refresher-triggered="isRefreshing"
      @refresherrefresh="onRefresh"
    >
      <view 
        v-for="mention in mentions" 
        :key="mention.id"
        class="mention-item"
        :class="{ unread: !mention.is_read }"
        @tap="goToComment(mention)"
      >
        <!-- 未读指示器 -->
        <view v-if="!mention.is_read" class="unread-indicator"></view>

        <!-- 用户信息 -->
        <image 
          class="user-avatar"
          :src="mention.mentioned_by_avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />

        <!-- 内容区域 -->
        <view class="mention-content">
          <view class="mention-header">
            <text class="mention-user">{{ mention.mentioned_by_user_name }}</text>
            <text class="mention-time">{{ formatTime(mention.created_at) }}</text>
          </view>
          <text class="mention-preview">{{ mention.comment_preview }}</text>
          <view class="mention-topic">
            <u-icon name="chat" size="14" color="#86868B"></u-icon>
            <text class="topic-name">{{ mention.topic_title }}</text>
          </view>
        </view>

        <!-- 操作按钮 -->
        <view class="mention-action">
          <u-icon name="arrow-right" size="18" color="#C7C7CC"></u-icon>
        </view>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more">
        <u-loadmore :status="loadStatus" />
      </view>
    </scroll-view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent } from '@/utils/analytics.js';

export default {
  data() {
    return {
      mentions: [],
      page: 1,
      pageSize: 10,
      hasMore: true,
      loading: false,
      loadStatus: 'loadmore',
      isRefreshing: false,
      unreadCount: 0,
      currentUserId: ''
    };
  },

  onLoad() {
    this.currentUserId = uni.getStorageSync('userId') || '';
    this.loadMentions();
    this.getUnreadCount();
  },

  onShow() {
    // 每次显示时刷新未读数
    this.getUnreadCount();
  },

  methods: {
    // 加载提醒列表
    async loadMentions() {
      if (this.loading || !this.hasMore) return;

      this.loading = true;
      this.loadStatus = 'loading';

      try {
        const res = await callCloudFunction('community-mentions', {
          action: 'list',
          page: this.page,
          pageSize: this.pageSize
        });

        if (res && res.errCode === 0) {
          const { list, hasMore } = res.data;

          if (this.page === 1) {
            this.mentions = list;
          } else {
            this.mentions.push(...list);
          }

          this.hasMore = hasMore;
          this.loadStatus = hasMore ? 'loadmore' : 'nomore';

          // 埋点
          trackEvent('mentions_list_view', {
            count: this.mentions.length
          });
        }
      } catch (error) {
        console.error('[MENTIONS] 加载失败:', error);
        uni.showToast({
          title: '加载失败',
          icon: 'none'
        });
      } finally {
        this.loading = false;
        this.isRefreshing = false;
      }
    },

    // 获取未读数
    async getUnreadCount() {
      try {
        const res = await callCloudFunction('community-mentions', {
          action: 'getUnreadCount'
        });

        if (res && res.errCode === 0) {
          this.unreadCount = res.data.unread_count || 0;
        }
      } catch (error) {
        console.error('[MENTIONS] 获取未读数失败:', error);
      }
    },

    // 下拉刷新
    async onRefresh() {
      this.isRefreshing = true;
      this.page = 1;
      this.hasMore = true;

      uni.vibrateShort({ type: 'light' });

      await this.loadMentions();
      await this.getUnreadCount();

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
        this.loadMentions();
      }
    },

    // 全部标记已读
    async markAllAsRead() {
      try {
        const res = await callCloudFunction('community-mentions', {
          action: 'markAllAsRead'
        });

        if (res && res.errCode === 0) {
          // 更新本地列表
          this.mentions.forEach(mention => {
            mention.is_read = true;
          });

          this.unreadCount = 0;

          uni.showToast({
            title: '已全部标记为已读',
            icon: 'success'
          });

          // 埋点
          trackEvent('mentions_mark_all_read');
        }
      } catch (error) {
        console.error('[MENTIONS] 标记失败:', error);
      }
    },

    // 跳转到评论
    async goToComment(mention) {
      // 标记为已读
      if (!mention.is_read) {
        try {
          await callCloudFunction('community-mentions', {
            action: 'markAsRead',
            mention_id: mention.id
          });

          mention.is_read = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        } catch (error) {
          console.error('[MENTIONS] 标记已读失败:', error);
        }
      }

      // 跳转到话题详情
      uni.navigateTo({
        url: `/pages/community/detail?id=${mention.topic_id}&commentId=${mention.comment_id}`
      });

      // 埋点
      trackEvent('mention_click', {
        mention_id: mention.id,
        topic_id: mention.topic_id
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
.mentions-page {
  min-height: 100vh;
  background: #F5F5F7;
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.mentions-header {
  background: #FFFFFF;
  padding: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1rpx solid #E5E5EA;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.title-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.unread-badge {
  background: #FF3B30;
  color: #FFFFFF;
  border-radius: 50%;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  font-weight: 600;
}

.mark-all-btn {
  background: #0A84FF;
  color: #FFFFFF;
  border: none;
  border-radius: 8rpx;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
}

.loading-state,
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

.mentions-list {
  height: calc(100vh - 88rpx);
  padding: 24rpx;
}

.mention-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  position: relative;
}

.mention-item.unread {
  background: #F0F8FF;
  border-left: 4rpx solid #0A84FF;
}

.unread-indicator {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  background: #0A84FF;
  border-radius: 50%;
}

.user-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.mention-content {
  flex: 1;
  min-width: 0;
}

.mention-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.mention-user {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.mention-time {
  font-size: 24rpx;
  color: #C7C7CC;
}

.mention-preview {
  font-size: 26rpx;
  color: #86868B;
  display: block;
  margin-bottom: 12rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mention-topic {
  display: flex;
  align-items: center;
  gap: 8rpx;
  font-size: 24rpx;
  color: #0A84FF;
}

.topic-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mention-action {
  flex-shrink: 0;
}

.load-more {
  padding: 32rpx 0;
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

