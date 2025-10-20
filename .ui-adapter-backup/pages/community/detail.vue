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
        
        <!-- 更多操作按钮 -->
        <view class="more-btn" @tap="showActionMenu">
          <u-icon name="more-dot-fill" size="20" color="#86868B"></u-icon>
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
      <!-- 任务5: 互动优化 - 评论排序 -->
      <view class="comments-header">
        <text class="comments-title">评论 ({{ comments.length }})</text>
        <view class="sort-buttons">
          <view
            class="sort-btn"
            :class="{ active: commentSort === 'latest' }"
            @tap="changeCommentSort('latest')"
          >
            最新
          </view>
          <view
            class="sort-btn"
            :class="{ active: commentSort === 'hottest' }"
            @tap="changeCommentSort('hottest')"
          >
            最热
          </view>
        </view>
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
        <view class="comment-floor">{{ index + 1 }}楼</view>
        <image 
          class="comment-avatar"
          :src="comment.user_avatar || '/static/images/default-avatar.png'"
          mode="aspectFill"
        />
        <view class="comment-content">
          <text class="comment-author">{{ comment.user_name }}</text>
          <rich-text class="comment-text" :nodes="renderCommentContent(comment.content)"></rich-text>
          <view class="comment-meta">
            <text class="comment-time">{{ formatTime(comment.created_at) }}</text>
            <!-- 任务5: 互动优化 - 回复按钮 -->
            <view class="comment-actions">
              <view class="comment-reply" @tap.stop="replyComment(comment)">
                <u-icon name="chat" size="14" color="#86868B"></u-icon>
                <text class="reply-text">回复</text>
              </view>
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
    </view>

    <!-- 评论输入框 -->
    <view class="comment-input-bar">
      <view class="mention-btn" @tap="showUserPicker">
        <u-icon name="at" size="22" color="#86868B"></u-icon>
      </view>
      <input 
        class="comment-input"
        v-model="commentText"
        placeholder="说点什么..."
        :disabled="commenting"
        @input="handleCommentInput"
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
    
    <!-- @用户选择器 -->
    <u-popup 
      :show="showMentionPicker" 
      mode="bottom" 
      :round="20"
      @close="showMentionPicker = false"
    >
      <view class="mention-picker">
        <view class="picker-header">
          <text class="picker-title">选择要@的用户</text>
          <u-icon name="close" size="24" @tap="showMentionPicker = false"></u-icon>
        </view>
        
        <view class="search-user">
          <input 
            class="search-input"
            v-model="mentionKeyword"
            placeholder="搜索用户..."
            @input="handleSearchUser"
          />
        </view>
        
        <scroll-view class="user-list" scroll-y>
          <view 
            v-for="user in filteredUsers" 
            :key="user.id"
            class="user-item"
            @tap="selectMentionUser(user)"
          >
            <image 
              class="user-avatar"
              :src="user.avatar"
              mode="aspectFill"
            />
            <view class="user-info">
              <text class="user-name">{{ user.name }}</text>
              <text v-if="user.role" class="user-role">{{ user.role === 'author' ? '作者' : '评论者' }}</text>
            </view>
          </view>
          
          <view v-if="filteredUsers.length === 0" class="empty-users">
            <text class="empty-text">没有找到用户</text>
          </view>
        </scroll-view>
      </view>
    </u-popup>
    
    <!-- 操作菜单 -->
    <u-action-sheet 
      :show="showMenu" 
      :actions="menuActions"
      @close="showMenu = false"
      @select="handleMenuSelect"
    ></u-action-sheet>
    
    <!-- 举报对话框 -->
    <u-popup 
      :show="showReportDialog" 
      mode="center" 
      :round="20"
      @close="showReportDialog = false"
    >
      <view class="report-dialog">
        <view class="report-title">举报话题</view>
        <view class="report-reasons">
          <view 
            v-for="(item, index) in reportReasons" 
            :key="index"
            class="reason-item"
            :class="{ active: reportReason === item.value }"
            @tap="reportReason = item.value"
          >
            {{ item.label }}
          </view>
        </view>
        <textarea 
          class="report-desc"
          v-model="reportDescription"
          placeholder="请详细描述举报原因（选填）"
          maxlength="200"
        />
        <view class="report-actions">
          <button class="cancel-btn" @tap="showReportDialog = false">取消</button>
          <button 
            class="confirm-btn" 
            :disabled="!reportReason"
            @tap="submitReport"
          >
            提交
          </button>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import { getTopicDetail, updateTopic, deleteTopic, reportTopic } from '@/api/community.js';
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent } from '@/utils/analytics.js';
import { 
  detectMentionTrigger, 
  insertMention, 
  parseMentions,
  renderMentions,
  getAvailableUsers,
  searchUsers
} from '@/utils/mention-helper.js';

export default {
  data() {
    return {
      topicId: '',
      topic: null,
      comments: [],
      commentText: '',
      loading: true,
      commenting: false,
      showMenu: false,
      menuActions: [],
      currentUserId: '',
      showReportDialog: false,
      reportReason: '',
      reportDescription: '',
      reportReasons: [
        { label: '垃圾广告', value: 'spam' },
        { label: '色情低俗', value: 'vulgar' },
        { label: '政治敏感', value: 'political' },
        { label: '人身攻击', value: 'attack' },
        { label: '虚假信息', value: 'fake' },
        { label: '侵权内容', value: 'copyright' },
        { label: '其他', value: 'other' }
      ],
      // @用户相关
      showMentionPicker: false,
      mentionKeyword: '',
      availableUsers: [],
      mentionTrigger: null, // { atPos, keyword }
      cursorPosition: 0,
      // 任务5: 互动优化 - 评论排序和回复
      commentSort: 'latest', // 'latest' 或 'hottest'
      replyingTo: null // 正在回复的评论
    };
  },
  
  computed: {
    // 过滤后的用户列表
    filteredUsers() {
      return searchUsers(this.mentionKeyword, this.availableUsers);
    },
    
    isAuthor() {
      return this.topic && this.currentUserId && this.topic.user_id === this.currentUserId;
    }
  },
  
  onLoad(options) {
    this.topicId = options.id;
    this.currentUserId = uni.getStorageSync('userId') || '';
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
          
          // 初始化可用用户列表（话题作者+评论者）
          this.availableUsers = getAvailableUsers(this.topic, this.comments);
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
    
    // 任务2: @用户提醒功能完善
    // 任务4: 社区内容审核
    async submitComment() {
      const text = this.commentText.trim();
      if (!text) return;

      // 任务4增强: 内容审核 - 敏感词检测
      const auditResult = await this.auditCommentContent(text);
      if (!auditResult.passed) {
        uni.showToast({
          title: auditResult.message || '内容包含不适当信息',
          icon: 'none'
        });
        return;
      }

      this.commenting = true;

      try {
        // 解析@用户
        const mentionedUserIds = parseMentions(text);

        const res = await callCloudFunction('community-comments', {
          action: 'create',
          topic_id: this.topicId,
          content: text,
          mentioned_users: mentionedUserIds // 传递@的用户ID列表
        });

        if (res && res.comment) {
          this.comments.push(res.comment);
          this.commentText = '';
          this.topic.comments_count++;

          // 更新可用用户列表
          this.availableUsers = getAvailableUsers(this.topic, this.comments);

          // 任务2增强: 发送@提醒通知
          if (mentionedUserIds.length > 0) {
            await this.sendMentionNotifications(mentionedUserIds, text, res.comment.id);
          }

          uni.showToast({
            title: '评论成功',
            icon: 'success'
          });

          // 埋点
          trackEvent('comment_submit', {
            topic_id: this.topicId,
            has_mention: mentionedUserIds.length > 0,
            mention_count: mentionedUserIds.length
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

    // 任务2增强: 发送@提醒通知
    async sendMentionNotifications(mentionedUserIds, content, commentId) {
      try {
        // 调用云函数发送提醒
        await callCloudFunction('community-mentions', {
          action: 'createMentions',
          topic_id: this.topicId,
          comment_id: commentId,
          mentioned_user_ids: mentionedUserIds,
          content: content,
          mentioned_by_user_id: this.currentUserId
        });

        console.log(`[MENTION] 已发送${mentionedUserIds.length}条@提醒`);
      } catch (error) {
        console.error('[MENTION] 发送提醒失败:', error);
        // 不影响评论提交，只记录错误
      }
    },

    // 任务4增强: 内容审核 - 敏感词检测
    async auditCommentContent(content) {
      try {
        // 敏感词列表（本地检测）
        const sensitiveWords = [
          '违法', '赌博', '诈骗', '色情', '暴力', '恐怖',
          '政治敏感词', '人身攻击', '骚扰', '骂人'
        ];

        // 检测敏感词
        for (const word of sensitiveWords) {
          if (content.includes(word)) {
            return {
              passed: false,
              message: '内容包含不适当信息，请修改后重试'
            };
          }
        }

        // 调用云函数进行深度审核
        const res = await callCloudFunction('content-audit', {
          action: 'audit',
          content: content,
          type: 'comment'
        });

        if (res && res.passed === false) {
          return {
            passed: false,
            message: res.message || '内容审核未通过'
          };
        }

        // 记录审核日志
        console.log(`[AUDIT] 内容审核通过: ${content.substring(0, 50)}...`);

        return { passed: true };
      } catch (error) {
        console.error('[AUDIT] 审核失败:', error);
        // 审核失败时，允许提交但记录日志
        return { passed: true };
      }
    },
    
    // @用户相关方法
    // 显示用户选择器
    showUserPicker() {
      this.showMentionPicker = true;
      this.mentionKeyword = '';
      
      // 记录当前光标位置和@位置
      this.mentionTrigger = {
        atPos: this.commentText.length,
        keyword: ''
      };
      
      // 自动在光标处插入@符号
      if (!this.commentText.endsWith('@')) {
        this.commentText += '@';
        this.cursorPosition = this.commentText.length;
      }
    },
    
    // 监听评论输入，检测@符号
    handleCommentInput(e) {
      const value = e.detail.value || '';
      const cursor = e.detail.cursor || value.length;
      
      this.cursorPosition = cursor;
      
      // 检测是否触发@
      const trigger = detectMentionTrigger(value, cursor);
      
      if (trigger) {
        this.mentionTrigger = trigger;
        this.mentionKeyword = trigger.keyword;
        
        // 如果关键词发生变化，自动显示选择器
        if (trigger.keyword && !this.showMentionPicker) {
          this.showMentionPicker = true;
        }
      } else {
        this.mentionTrigger = null;
        
        // 如果不在@状态，关闭选择器
        if (this.showMentionPicker && !this.mentionKeyword) {
          // this.showMentionPicker = false;
        }
      }
    },
    
    // 搜索用户
    handleSearchUser() {
      // searchUsers 方法会自动在 computed.filteredUsers 中调用
    },
    
    // 选择要@的用户
    selectMentionUser(user) {
      if (!this.mentionTrigger) {
        // 如果没有触发位置，直接在末尾追加
        this.commentText += `@[${user.name}](${user.id}) `;
      } else {
        // 在触发位置插入
        const result = insertMention(
          this.commentText,
          this.mentionTrigger.atPos,
          this.cursorPosition,
          user
        );
        
        this.commentText = result.content;
        this.cursorPosition = result.cursorPos;
      }
      
      // 关闭选择器
      this.showMentionPicker = false;
      this.mentionTrigger = null;
      this.mentionKeyword = '';
      
      // 震动反馈
      uni.vibrateShort();
      
      // 埋点
      trackEvent('mention_user_select', {
        topic_id: this.topicId,
        mentioned_user_id: user.id
      });
    },
    
    // 渲染评论内容（高亮@用户）
    renderCommentContent(content) {
      if (!content) {
        return '';
      }
      return renderMentions(content);
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
    },

    // 任务5: 互动优化 - 评论排序
    changeCommentSort(sortType) {
      this.commentSort = sortType;

      // 根据排序类型重新排序评论
      if (sortType === 'latest') {
        this.comments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (sortType === 'hottest') {
        this.comments.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }

      // 埋点
      trackEvent('comment_sort_changed', {
        topic_id: this.topicId,
        sort_type: sortType
      });
    },

    // 任务5: 互动优化 - 回复评论
    replyComment(comment) {
      this.replyingTo = comment;

      // 在评论框中插入@提醒
      this.commentText = `@${comment.user_name} `;
      this.showMentionPicker = false;

      // 自动聚焦到输入框（需要使用ref）
      uni.showToast({
        title: `回复 ${comment.user_name}`,
        icon: 'success',
        duration: 1000
      });

      // 埋点
      trackEvent('comment_reply_start', {
        topic_id: this.topicId,
        reply_to_user_id: comment.user_id
      });
    },

    // 显示操作菜单
    showActionMenu() {
      const actions = [];
      
      if (this.isAuthor) {
        actions.push(
          { name: '编辑', color: '#0A84FF' },
          { name: '删除', color: '#FF3B30' }
        );
      } else {
        actions.push(
          { name: '举报', color: '#FF9500' }
        );
      }
      
      this.menuActions = actions;
      this.showMenu = true;
    },
    
    // 处理菜单选择
    handleMenuSelect(e) {
      const action = e.name;
      
      if (action === '编辑') {
        this.editTopic();
      } else if (action === '删除') {
        this.confirmDelete();
      } else if (action === '举报') {
        this.openReportDialog();
      }
    },
    
    // 编辑话题
    editTopic() {
      uni.navigateTo({
        url: `/pages/community/publish?mode=edit&id=${this.topicId}`
      });
    },
    
    // 确认删除
    confirmDelete() {
      uni.showModal({
        title: '确认删除',
        content: '删除后无法恢复，确定要删除这个话题吗？',
        confirmColor: '#FF3B30',
        success: async (res) => {
          if (res.confirm) {
            await this.handleDelete();
          }
        }
      });
    },
    
    // 执行删除
    async handleDelete() {
      try {
        uni.showLoading({ title: '删除中...' });
        
        const res = await deleteTopic(this.topicId);
        
        if (res.errCode === 0) {
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 埋点
          trackEvent('topic_delete', {
            topic_id: this.topicId
          });
          
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error(res.errMsg || '删除失败');
        }
      } catch (error) {
        console.error('[DETAIL] 删除失败:', error);
        
        uni.showToast({
          title: error.message || '删除失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 打开举报对话框
    openReportDialog() {
      this.reportReason = '';
      this.reportDescription = '';
      this.showReportDialog = true;
    },
    
    // 提交举报
    async submitReport() {
      if (!this.reportReason) {
        uni.showToast({
          title: '请选择举报原因',
          icon: 'none'
        });
        return;
      }
      
      try {
        uni.showLoading({ title: '提交中...' });
        
        const res = await reportTopic(
          this.topicId,
          this.reportReason,
          this.reportDescription
        );
        
        if (res.errCode === 0) {
          this.showReportDialog = false;
          
          uni.showToast({
            title: '举报成功，我们会尽快处理',
            icon: 'success',
            duration: 2000
          });
          
          // 埋点
          trackEvent('topic_report', {
            topic_id: this.topicId,
            reason: this.reportReason
          });
        } else {
          throw new Error(res.errMsg || '举报失败');
        }
      } catch (error) {
        console.error('[DETAIL] 举报失败:', error);
        
        uni.showToast({
          title: error.message || '举报失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
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
  position: relative;
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

.more-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F9FAFB;
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.comments-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

/* 任务5: 互动优化 - 排序按钮样式 */
.sort-buttons {
  display: flex;
  gap: 12rpx;
}

.sort-btn {
  padding: 8rpx 16rpx;
  background: #F5F5F7;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #86868B;
  transition: all 0.3s;
}

.sort-btn.active {
  background: #0A84FF;
  color: #FFFFFF;
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
  position: relative;
}

.comment-floor {
  position: absolute;
  left: -80rpx;
  top: 0;
  font-size: 24rpx;
  color: #C7C7CC;
  writing-mode: vertical-rl;
  text-orientation: mixed;
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
  margin-top: 12rpx;
}

.comment-time {
  font-size: 24rpx;
  color: #C7C7CC;
}

/* 任务5: 互动优化 - 回复和点赞按钮 */
.comment-actions {
  display: flex;
  gap: 24rpx;
  align-items: center;
}

.comment-reply {
  display: flex;
  align-items: center;
  gap: 6rpx;
  cursor: pointer;
  transition: all 0.3s;
}

.comment-reply:active {
  opacity: 0.6;
}

.reply-text {
  font-size: 24rpx;
  color: #86868B;
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

.mention-btn {
  width: 72rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F9FAFB;
  border-radius: 36rpx;
  flex-shrink: 0;
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

/* @用户选择器样式 */
.mention-picker {
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

.picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 32rpx;
  border-bottom: 1rpx solid #F0F0F5;
}

.picker-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.search-user {
  padding: 24rpx 32rpx;
}

.search-input {
  width: 100%;
  height: 72rpx;
  background: #F9FAFB;
  border-radius: 36rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
}

.user-list {
  max-height: 600rpx;
  padding: 0 32rpx 32rpx;
}

.user-item {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  margin-bottom: 16rpx;
  transition: all 0.3s;
}

.user-item:active {
  background: #F0F0F5;
}

.user-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.user-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.user-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #1D1D1F;
}

.user-role {
  font-size: 24rpx;
  color: #86868B;
}

.empty-users {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #86868B;
}

/* 评论中的@标签样式 */
.comment-text >>> .mention-tag {
  color: #0A84FF;
  font-weight: 500;
}

/* 举报对话框 */
.report-dialog {
  width: 600rpx;
  padding: 48rpx 32rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
}

.report-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1D1D1F;
  text-align: center;
  margin-bottom: 32rpx;
}

.report-reasons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
  margin-bottom: 24rpx;
}

.reason-item {
  padding: 20rpx;
  background: #F9FAFB;
  border: 2rpx solid transparent;
  border-radius: 16rpx;
  text-align: center;
  font-size: 28rpx;
  color: #1D1D1F;
  transition: all 0.3s;
}

.reason-item.active {
  background: #E8F4FF;
  border-color: #0A84FF;
  color: #0A84FF;
}

.report-desc {
  width: 100%;
  min-height: 180rpx;
  padding: 20rpx;
  background: #F9FAFB;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  margin-bottom: 32rpx;
}

.report-actions {
  display: flex;
  gap: 16rpx;
}

.cancel-btn,
.confirm-btn {
  flex: 1;
  height: 88rpx;
  line-height: 88rpx;
  border: none;
  border-radius: 44rpx;
  font-size: 30rpx;
  padding: 0;
}

.cancel-btn {
  background: #F9FAFB;
  color: #1D1D1F;
}

.confirm-btn {
  background: #0A84FF;
  color: #FFFFFF;
}

.confirm-btn[disabled] {
  opacity: 0.5;
}
</style>

