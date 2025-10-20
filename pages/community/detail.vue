<template>
  <view class="detail-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <u-loading mode="circle" size="40"></u-loading>
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 话题详情 -->
    <view v-else-if="topic" class="topic-detail">
      <!-- 作者信息 -->
      <view class="author-section">
        <image 
          class="author-avatar"
          :src="topic.author_avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="author-info">
          <text class="author-name">{{ topic.author_name }}</text>
          <text class="publish-time">{{ formatTime(topic.created_at) }}</text>
        </view>
      </view>

      <!-- 话题内容 -->
      <view class="topic-content">
        <text class="topic-title">{{ topic.title }}</text>
        <text class="topic-text">{{ topic.content }}</text>
        
        <!-- 图片列表 -->
        <view v-if="topic.images && topic.images.length > 0" class="topic-images">
          <image 
            v-for="(img, index) in topic.images"
            :key="index"
            class="topic-image"
            :src="img"
            mode="aspectFill"
            @tap="previewImage(index)"
          />
        </view>
      </view>

      <!-- 互动数据 -->
      <view class="stats-section">
        <view class="stat-item">
          <u-icon name="eye" size="18" color="#86868B"></u-icon>
          <text class="stat-text">{{ topic.views_count }}</text>
        </view>
        <view class="stat-item" @tap="likeTopic">
          <u-icon 
            :name="topic.is_liked ? 'heart-fill' : 'heart'" 
            size="18" 
            :color="topic.is_liked ? '#FF4444' : '#86868B'"
          ></u-icon>
          <text class="stat-text">{{ topic.likes_count }}</text>
        </view>
        <view class="stat-item">
          <u-icon name="chat" size="18" color="#86868B"></u-icon>
          <text class="stat-text">{{ topic.comments_count }}</text>
        </view>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comments-section">
      <view class="comments-header">
        <text class="comments-title">评论 ({{ comments.length }})</text>
      </view>
      
      <view v-if="comments.length === 0" class="empty-comments">
        <u-icon name="chat" size="48" color="#C7C7CC"></u-icon>
        <text class="empty-text">还没有评论，快来抢沙发</text>
      </view>
      
      <view 
        v-for="(comment, index) in comments" 
        :key="index"
        class="comment-item"
      >
        <image 
          class="comment-avatar"
          :src="comment.user_avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="comment-content">
          <text class="comment-author">{{ comment.user_name }}</text>
          <text class="comment-text">{{ comment.content }}</text>
          <view class="comment-meta">
            <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
            <view class="comment-like" @tap.stop="likeComment(comment)">
              <u-icon 
                :name="comment.is_liked ? 'thumb-up-fill' : 'thumb-up'" 
                size="14" 
                :color="comment.is_liked ? '#0A84FF' : '#86868B'"
              ></u-icon>
              <text class="like-count">{{ comment.likes_count || 0 }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 评论输入框 -->
    <view class="comment-input-bar">
      <input 
        class="comment-input"
        v-model="commentText"
        placeholder="说点什么..."
        :disabled="commenting"
        @confirm="submitComment"
      />
      <button 
        class="comment-btn"
        :disabled="!commentText.trim() || commenting"
        @tap="submitComment"
      >
        发送
      </button>
    </view>
  </view>
</template>

<script>
import { getTopicDetail } from '@/api/community.js';
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent } from '@/utils/analytics.js';

export default {
  data() {
    return {
      topicId: '',
      topic: null,
      comments: [],
      commentText: '',
      loading: true,
      commenting: false
    };
  },
  
  onLoad(options) {
    this.topicId = options.id;
    this.loadTopic();
    this.loadComments();
  },
  
  methods: {
    async loadTopic() {
      try {
        this.loading = true;
        
        const res = await getTopicDetail(this.topicId);
        
        if (res.errCode === 0) {
          this.topic = res.data;
          
          // 埋点
          trackEvent('topic_detail_view', {
            topic_id: this.topicId,
            category: this.topic.category
          });
        }
      } catch (error) {
        console.error('[DETAIL] 加载失败:', error);
      } finally {
        this.loading = false;
      }
    },
    
    async loadComments() {
      try {
        const res = await callCloudFunction('community-comments', {
          action: 'list',
          topic_id: this.topicId
        });
        
        if (res && res.list) {
          this.comments = res.list;
        }
      } catch (error) {
        console.error('[DETAIL] 加载评论失败:', error);
      }
    },
    
    async likeTopic() {
      // 乐观更新
      this.topic.is_liked = !this.topic.is_liked;
      this.topic.likes_count += this.topic.is_liked ? 1 : -1;
      
      try {
        await callCloudFunction('community-topics', {
          action: 'like',
          topic_id: this.topicId
        });
      } catch (error) {
        // 回滚
        this.topic.is_liked = !this.topic.is_liked;
        this.topic.likes_count += this.topic.is_liked ? 1 : -1;
      }
    },
    
    async likeComment(comment) {
      comment.is_liked = !comment.is_liked;
      comment.likes_count = (comment.likes_count || 0) + (comment.is_liked ? 1 : -1);
      
      try {
        await callCloudFunction('community-comments', {
          action: 'like',
          comment_id: comment.id
        });
      } catch (error) {
        // 回滚
        comment.is_liked = !comment.is_liked;
        comment.likes_count += comment.is_liked ? 1 : -1;
      }
    },
    
    async submitComment() {
      const text = this.commentText.trim();
      if (!text) return;
      
      this.commenting = true;
      
      try {
        const res = await callCloudFunction('community-comments', {
          action: 'create',
          topic_id: this.topicId,
          content: text
        });
        
        if (res && res.comment) {
          this.comments.push(res.comment);
          this.commentText = '';
          this.topic.comments_count++;
          
          uni.showToast({
            title: '评论成功',
            icon: 'success'
          });
        }
      } catch (error) {
        console.error('[DETAIL] 评论失败:', error);
        
        uni.showToast({
          title: '评论失败',
          icon: 'none'
        });
      } finally {
        this.commenting = false;
      }
    },
    
    previewImage(index) {
      uni.previewImage({
        current: index,
        urls: this.topic.images
      });
    },
    
    formatTime(timestamp) {
      if (!timestamp) return '';
      
      const date = new Date(timestamp);
      const now = new Date();
      const diff = now - date;
      
      if (diff < 60000) return '刚刚';
      if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前';
      if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前';
      if (diff < 604800000) return Math.floor(diff / 86400000) + '天前';
      
      return date.toLocaleDateString();
    }
  }
};
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #F5F5F7;
  /* 顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  /* 底部安全区域 - 评论输入栏高度 + 安全区域 */
  padding-bottom: calc(120rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(120rpx + env(safe-area-inset-bottom));
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 24rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #86868B;
}

.topic-detail {
  background: #FFFFFF;
  padding: 32rpx;
}

.author-section {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.author-avatar {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.author-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.publish-time {
  font-size: 24rpx;
  color: #86868B;
}

.topic-content {
  margin-bottom: 32rpx;
}

.topic-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: #1D1D1F;
  line-height: 1.6;
  margin-bottom: 24rpx;
}

.topic-text {
  display: block;
  font-size: 30rpx;
  color: #1D1D1F;
  line-height: 1.8;
  margin-bottom: 24rpx;
}

.topic-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
}

.topic-image {
  width: 100%;
  height: 200rpx;
  border-radius: 12rpx;
}

.stats-section {
  display: flex;
  gap: 48rpx;
  padding: 24rpx 0;
  border-top: 1rpx solid #F0F0F5;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.stat-text {
  font-size: 26rpx;
  color: #86868B;
}

.comments-section {
  background: #FFFFFF;
  margin-top: 16rpx;
  padding: 32rpx;
  min-height: 400rpx;
}

.comments-header {
  margin-bottom: 24rpx;
  padding-bottom: 24rpx;
  border-bottom: 1rpx solid #F0F0F5;
}

.comments-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.empty-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  gap: 24rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #86868B;
}

.comment-item {
  display: flex;
  gap: 20rpx;
  margin-bottom: 32rpx;
}

.comment-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.comment-author {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.comment-text {
  font-size: 28rpx;
  color: #1D1D1F;
  line-height: 1.6;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comment-time {
  font-size: 24rpx;
  color: #C7C7CC;
}

.comment-like {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.like-count {
  font-size: 24rpx;
  color: #86868B;
}

.comment-input-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #E5E5EA;
  display: flex;
  gap: 16rpx;
  align-items: center;
}

.comment-input {
  flex: 1;
  height: 72rpx;
  background: #F9FAFB;
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.comment-btn {
  height: 72rpx;
  padding: 0 32rpx;
  background: #0A84FF;
  color: #FFFFFF;
  border: none;
  border-radius: 36rpx;
  font-size: 28rpx;
}

.comment-btn[disabled] {
  opacity: 0.5;
}
</style>

