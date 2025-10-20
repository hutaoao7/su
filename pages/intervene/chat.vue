<template>
  <view class="chat-page">
    <!-- 顶部操作栏 -->
    <view class="top-actions">
      <view class="title-wrapper">
        <text class="page-title">AI心理支持</text>
        <view class="session-indicator" @tap="showSessionList">
          <text class="session-name">{{ currentSessionName }}</text>
          <u-icon name="arrow-down" size="12" color="#8E8E93"></u-icon>
        </view>
      </view>
      <view class="action-buttons">
        <view class="action-btn" @tap="handleNewSession">
          <u-icon name="plus" size="18" color="#8E8E93"></u-icon>
        </view>
        <view class="action-btn" @tap="handleClearChat">
          <u-icon name="trash" size="18" color="#8E8E93"></u-icon>
        </view>
      </view>
    </view>
    
    <!-- 会话列表弹窗 -->
    <u-popup v-model="showSessionPopup" mode="bottom" :safe-area-inset-bottom="true">
      <view class="session-popup">
        <view class="popup-header">
          <text class="popup-title">会话列表</text>
          <view class="popup-close" @tap="showSessionPopup = false">
            <u-icon name="close" size="18" color="#1D1D1F"></u-icon>
          </view>
        </view>
        
        <scroll-view class="session-list" scroll-y>
          <view 
            v-for="(session, index) in sessions" 
            :key="session.id"
            class="session-item"
            :class="{ 'active': session.id === sessionId }"
            @tap="switchSession(session)"
          >
            <view class="session-info">
              <text class="session-name">{{ session.name }}</text>
              <text class="session-time">{{ formatSessionTime(session.lastMessageAt) }}</text>
            </view>
            <view v-if="session.id !== 'default'" class="session-actions">
              <view class="action-icon" @tap.stop="renameSession(session)">
                <u-icon name="edit-pen" size="16" color="#8E8E93"></u-icon>
              </view>
              <view class="action-icon" @tap.stop="deleteSession(session)">
                <u-icon name="trash" size="16" color="#DC3545"></u-icon>
              </view>
            </view>
          </view>
        </scroll-view>
      </view>
    </u-popup>
    
    <!-- 消息列表 -->
    <scroll-view 
      class="message-list" 
      scroll-y 
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
    >
      <view v-if="messages.length === 0" class="empty-state">
        <u-icon name="chat" size="64" color="#C7C7CC"></u-icon>
        <text class="empty-text">开始与AI进行心理倾诉对话</text>
        <text class="empty-hint">我会倾听您的心声，给予支持和建议</text>
      </view>
      
      <view v-for="(msg, index) in messages" :key="index" :id="getMsgId(index)" class="message-item">
        <!-- 用户消息 -->
        <view v-if="msg.role === 'user'" class="message user-message">
          <view class="message-content-wrapper">
            <view class="message-content" @longpress="handleLongPress(msg, index)">
              <text>{{ msg.content }}</text>
              <view v-if="msg.isFavorite" class="favorite-badge">
                <u-icon name="star-fill" size="12" color="#FFB800"></u-icon>
              </view>
              <!-- 发送状态指示器 -->
              <view v-if="msg.sendStatus === 'sending'" class="status-indicator">
                <u-icon name="loading" size="12" color="#8E8E93"></u-icon>
              </view>
              <!-- 已撤回标记 -->
              <view v-if="msg.isRevoked" class="revoked-indicator">
                <text class="revoked-text">已撤回</text>
              </view>
            </view>
            <!-- 撤回按钮（2分钟内可撤回） -->
            <view v-if="canRevoke(msg) && !msg.isRevoked" class="revoke-btn" @tap="revokeMessage(index)">
              <u-icon name="close" size="12" color="#8E8E93"></u-icon>
              <text class="revoke-text">撤回</text>
            </view>
            <!-- 发送失败重试按钮 -->
            <view v-if="msg.sendStatus === 'failed'" class="retry-btn" @tap="resendMessage(index)">
              <u-icon name="reload" size="14" color="#DC3545"></u-icon>
              <text class="retry-text">重发</text>
            </view>
          </view>
          <view class="message-avatar">
            <u-icon name="account" size="20" color="#FFFFFF"></u-icon>
          </view>
        </view>
        
        <!-- AI消息 -->
        <view v-else class="message ai-message">
          <view class="message-avatar ai-avatar">
            <u-icon name="star" size="20" color="#FFFFFF"></u-icon>
          </view>
          <view class="ai-message-wrapper">
            <view class="message-content" @longpress="handleLongPress(msg, index)">
              <text>{{ msg.content }}</text>
              <view v-if="msg.isFavorite" class="favorite-badge">
                <u-icon name="star-fill" size="12" color="#FFB800"></u-icon>
              </view>
            </view>
            <!-- AI回复质量评分 -->
            <view class="message-rating">
              <view v-if="!msg.rating" class="rating-prompt" @tap="showRatingDialog(msg, index)">
                <u-icon name="thumb-up" size="14" color="#8E8E93"></u-icon>
                <text class="rating-text">觉得这个回复怎么样？</text>
              </view>
              <view v-else class="rating-result">
                <u-icon 
                  :name="msg.rating === 'good' ? 'thumb-up-fill' : 'thumb-down-fill'" 
                  size="14" 
                  :color="msg.rating === 'good' ? '#34C759' : '#FF3B30'"
                ></u-icon>
                <text class="rating-text rated">已评价</text>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 正在输入提示 -->
      <view v-if="isTyping" class="message ai-message">
        <view class="message-avatar ai-avatar">
          <u-icon name="star" size="20" color="#FFFFFF"></u-icon>
        </view>
        <view class="message-content typing-indicator">
          <view class="dot"></view>
          <view class="dot"></view>
          <view class="dot"></view>
        </view>
      </view>
    </scroll-view>
    
    <!-- 输入框 -->
    <view class="input-bar">
      <view class="input-wrapper">
        <view class="input-toolbar">
          <view class="toolbar-btn" @tap="toggleEmojiPicker">
            <u-icon name="smile" size="22" color="#8E8E93"></u-icon>
          </view>
        </view>
        <textarea
          v-model="inputText"
          class="input-field"
          placeholder="输入您想说的话..."
          :auto-height="true"
          :maxlength="500"
          :show-confirm-bar="false"
          @confirm="sendMessage"
        />
        <view class="input-actions">
          <text class="char-count">{{ inputText.length }}/500</text>
          <button 
            class="send-btn" 
            :disabled="!inputText.trim() || isSending"
            @tap="sendMessage"
          >
            <u-icon name="arrow-up" size="20" color="#FFFFFF"></u-icon>
          </button>
        </view>
      </view>
      
      <!-- 表情选择器 -->
      <view v-if="showEmojiPicker" class="emoji-picker">
        <view class="emoji-grid">
          <view 
            v-for="(emoji, index) in emojiList" 
            :key="index" 
            class="emoji-item"
            @tap="insertEmoji(emoji)"
          >
            {{ emoji }}
          </view>
        </view>
      </view>
    </view>
    
    
  </view>
</template>

<script>
import tabBarManager from '@/utils/tabbar-manager.js';
import chatStorage from '@/utils/chat-storage.js';
import { checkSensitiveWords, getCrisisWarning, getSensitiveWarning } from '@/utils/sensitive-words.js';

export default {
  data() {
    return {
      messages: [],
      inputText: '',
      isSending: false,
      isTyping: false,
      scrollIntoView: '',
      msgIdPrefix: 'msg-',
      sessionId: 'default', // 当前会话ID
      currentSessionName: '默认会话', // 当前会话名称
      sessions: [], // 会话列表
      showSessionPopup: false, // 显示会话列表弹窗
      isLoadingHistory: false,
      favoriteMessages: [],  // 收藏的消息
      showEmojiPicker: false,  // 是否显示表情选择器
      emojiList: [
        '😊', '😃', '😄', '😁', '😆', '😅', '🤣', '😂',
        '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩',
        '😘', '😗', '☺️', '😚', '😙', '🥲', '😋', '😛',
        '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
        '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄',
        '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷',
        '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '😶‍🌫️',
        '😵', '🤯', '🤠', '🥳', '🥴', '😎', '🤓', '🧐',
        '👍', '👎', '👏', '🙏', '💪', '❤️', '💔', '💯'
      ]
    }
  },
  
  async onLoad() {
    console.log('[CHAT] AI对话页面加载');
    
    // 初始化存储
    await chatStorage.init();
    
    // 加载会话列表
    await this.loadSessions();
    
    // 加载历史消息
    await this.loadHistoryMessages();
    
    // 加载收藏列表
    this.loadFavorites();
    
    // 如果没有历史消息，添加欢迎消息
    if (this.messages.length === 0) {
      this.addAIMessage('您好！我是您的心理支持AI。无论您遇到什么困扰，都可以和我倾诉。我会认真倾听，并尽我所能给予支持和建议。');
    }
    
    // 清理过期数据（后台执行）
    chatStorage.cleanExpiredData().catch(err => {
      console.warn('[CHAT] 清理过期数据失败:', err);
    });
  },
  
  onShow() {
    // 通知导航栏更新状态
    tabBarManager.setCurrentIndexByPath('/pages/intervene/chat');
  },
  
  onUnload() {
    // 页面卸载时保存消息
    this.saveAllMessages();
  },
  
  methods: {
    /**
     * 加载会话列表
     */
    async loadSessions() {
      try {
        const sessionsData = uni.getStorageSync('chat_sessions');
        if (sessionsData) {
          this.sessions = JSON.parse(sessionsData);
        } else {
          // 创建默认会话
          this.sessions = [{
            id: 'default',
            name: '默认会话',
            createdAt: Date.now(),
            lastMessageAt: Date.now(),
            messageCount: 0
          }];
          this.saveSessions();
        }
        
        // 更新当前会话名称
        const currentSession = this.sessions.find(s => s.id === this.sessionId);
        if (currentSession) {
          this.currentSessionName = currentSession.name;
        }
        
        console.log(`[CHAT] 加载了 ${this.sessions.length} 个会话`);
      } catch (error) {
        console.error('[CHAT] 加载会话列表失败:', error);
      }
    },
    
    /**
     * 保存会话列表
     */
    saveSessions() {
      try {
        uni.setStorageSync('chat_sessions', JSON.stringify(this.sessions));
        console.log('[CHAT] 会话列表已保存');
      } catch (error) {
        console.error('[CHAT] 保存会话列表失败:', error);
      }
    },
    
    /**
     * 显示会话列表
     */
    showSessionList() {
      this.showSessionPopup = true;
    },
    
    /**
     * 切换会话
     */
    async switchSession(session) {
      if (session.id === this.sessionId) {
        this.showSessionPopup = false;
        return;
      }
      
      // 保存当前会话的消息
      await this.saveAllMessages();
      
      // 切换会话
      this.sessionId = session.id;
      this.currentSessionName = session.name;
      this.messages = [];
      
      // 加载新会话的消息
      await this.loadHistoryMessages();
      
      // 如果是空会话，添加欢迎消息
      if (this.messages.length === 0) {
        this.addAIMessage('您好！我是您的心理支持AI。无论您遇到什么困扰，都可以和我倾诉。我会认真倾听，并尽我所能给予支持和建议。');
      }
      
      this.showSessionPopup = false;
      
      uni.showToast({
        title: `已切换到：${session.name}`,
        icon: 'success',
        duration: 1500
      });
      
      console.log('[CHAT] 切换到会话:', session.id);
    },
    
    /**
     * 创建新会话
     */
    handleNewSession() {
      uni.showModal({
        title: '新建会话',
        content: '请输入会话名称',
        placeholderText: '例如：工作压力、学习困扰等...',
        editable: true,
        confirmText: '创建',
        success: (res) => {
          if (res.confirm) {
            const sessionName = res.content?.trim() || `会话${this.sessions.length + 1}`;
            this.createNewSession(sessionName);
          }
        }
      });
    },
    
    /**
     * 创建新会话
     */
    async createNewSession(name) {
      const newSession = {
        id: `session_${Date.now()}`,
        name: name,
        createdAt: Date.now(),
        lastMessageAt: Date.now(),
        messageCount: 0
      };
      
      this.sessions.unshift(newSession);
      this.saveSessions();
      
      // 切换到新会话
      await this.switchSession(newSession);
      
      console.log('[CHAT] 创建新会话:', newSession);
    },
    
    /**
     * 重命名会话
     */
    renameSession(session) {
      uni.showModal({
        title: '重命名会话',
        content: '请输入新的会话名称',
        placeholderText: session.name,
        editable: true,
        confirmText: '确定',
        success: (res) => {
          if (res.confirm && res.content) {
            const newName = res.content.trim();
            if (newName) {
              session.name = newName;
              if (session.id === this.sessionId) {
                this.currentSessionName = newName;
              }
              this.saveSessions();
              
              uni.showToast({
                title: '重命名成功',
                icon: 'success'
              });
              
              console.log('[CHAT] 会话已重命名:', session.id, newName);
            }
          }
        }
      });
    },
    
    /**
     * 删除会话
     */
    deleteSession(session) {
      uni.showModal({
        title: '删除会话',
        content: `确定要删除会话"${session.name}"吗？此操作不可恢复。`,
        confirmText: '确定删除',
        confirmColor: '#DC3545',
        success: async (res) => {
          if (res.confirm) {
            // 从列表中移除
            const index = this.sessions.findIndex(s => s.id === session.id);
            if (index > -1) {
              this.sessions.splice(index, 1);
              this.saveSessions();
            }
            
            // 删除会话的所有消息
            await chatStorage.clearSession(session.id);
            
            // 如果删除的是当前会话，切换到默认会话
            if (session.id === this.sessionId) {
              const defaultSession = this.sessions.find(s => s.id === 'default') || this.sessions[0];
              if (defaultSession) {
                await this.switchSession(defaultSession);
              }
            }
            
            uni.showToast({
              title: '会话已删除',
              icon: 'success'
            });
            
            console.log('[CHAT] 会话已删除:', session.id);
          }
        }
      });
    },
    
    /**
     * 格式化会话时间
     */
    formatSessionTime(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      
      const minute = 60 * 1000;
      const hour = 60 * minute;
      const day = 24 * hour;
      
      if (diff < minute) {
        return '刚刚';
      } else if (diff < hour) {
        return `${Math.floor(diff / minute)}分钟前`;
      } else if (diff < day) {
        return `${Math.floor(diff / hour)}小时前`;
      } else if (diff < 7 * day) {
        return `${Math.floor(diff / day)}天前`;
      } else {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }
    },
    
    /**
     * 加载历史消息
     */
    async loadHistoryMessages() {
      try {
        this.isLoadingHistory = true;
        const messages = await chatStorage.getMessages(this.sessionId);
        
        if (messages && messages.length > 0) {
          // 转换为页面使用的格式
          this.messages = messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp
          }));
          
          console.log(`[CHAT] 已加载 ${messages.length} 条历史消息`);
          this.scrollToBottom();
        }
      } catch (error) {
        console.error('[CHAT] 加载历史消息失败:', error);
      } finally {
        this.isLoadingHistory = false;
      }
    },
    
    /**
     * 保存单条消息
     */
    async saveMessage(message) {
      try {
        await chatStorage.saveMessage(this.sessionId, {
          role: message.role,
          content: message.content,
          timestamp: message.timestamp || Date.now()
        });
        
        // 更新会话信息
        this.updateSessionInfo();
      } catch (error) {
        console.error('[CHAT] 保存消息失败:', error);
      }
    },
    
    /**
     * 更新会话信息
     */
    updateSessionInfo() {
      const session = this.sessions.find(s => s.id === this.sessionId);
      if (session) {
        session.lastMessageAt = Date.now();
        session.messageCount = this.messages.length;
        this.saveSessions();
      }
    },
    
    /**
     * 保存所有消息
     */
    async saveAllMessages() {
      try {
        await chatStorage.saveMessages(this.sessionId, this.messages);
        console.log('[CHAT] 所有消息已保存');
      } catch (error) {
        console.error('[CHAT] 保存所有消息失败:', error);
      }
    },
    
    /**
     * 清空当前会话
     */
    async clearCurrentSession() {
      try {
        await chatStorage.clearSession(this.sessionId);
        this.messages = [];
        
        // 重新添加欢迎消息
        this.addAIMessage('您好！我是您的心理支持AI。无论您遇到什么困扰，都可以和我倾诉。我会认真倾听，并尽我所能给予支持和建议。');
        
        uni.showToast({
          title: '聊天记录已清空',
          icon: 'success'
        });
        
        console.log('[CHAT] 会话已清空');
      } catch (error) {
        console.error('[CHAT] 清空会话失败:', error);
        uni.showToast({
          title: '清空失败',
          icon: 'none'
        });
      }
    },
    
    /**
     * 处理消息长按
     */
    handleLongPress(msg, index) {
      const isFavorite = msg.isFavorite || false;
      const actions = ['复制消息', isFavorite ? '取消收藏' : '收藏消息', '删除消息'];
      
      uni.showActionSheet({
        itemList: actions,
        success: (res) => {
          const actionIndex = res.tapIndex;
          
          switch (actionIndex) {
            case 0:
              // 复制消息
              this.copyMessage(msg);
              break;
            case 1:
              // 收藏/取消收藏消息
              this.toggleFavoriteMessage(msg, index);
              break;
            case 2:
              // 删除消息
              this.deleteMessage(index);
              break;
          }
        }
      });
      
      // 震动反馈
      uni.vibrateShort({
        success: () => {
          console.log('[CHAT] 长按震动反馈');
        }
      });
    },
    
    /**
     * 复制消息内容
     */
    copyMessage(msg) {
      uni.setClipboardData({
        data: msg.content,
        success: () => {
          uni.showToast({
            title: '已复制',
            icon: 'success',
            duration: 1500
          });
          console.log('[CHAT] 消息已复制');
        },
        fail: (err) => {
          console.error('[CHAT] 复制失败:', err);
          uni.showToast({
            title: '复制失败',
            icon: 'none'
          });
        }
      });
    },
    
    /**
     * 切换消息收藏状态
     */
    toggleFavoriteMessage(msg, index) {
      const isFavorite = msg.isFavorite || false;
      
      // 更新消息状态
      this.$set(this.messages[index], 'isFavorite', !isFavorite);
      
      // 更新收藏列表
      if (!isFavorite) {
        // 添加到收藏
        this.favoriteMessages.push({
          content: msg.content,
          role: msg.role,
          timestamp: msg.timestamp || Date.now(),
          sessionId: this.sessionId
        });
        
        uni.showToast({
          title: '已收藏',
          icon: 'success',
          duration: 1500
        });
        console.log('[CHAT] 消息已收藏');
      } else {
        // 从收藏中移除
        const favIndex = this.favoriteMessages.findIndex(
          fav => fav.content === msg.content && fav.timestamp === msg.timestamp
        );
        if (favIndex > -1) {
          this.favoriteMessages.splice(favIndex, 1);
        }
        
        uni.showToast({
          title: '已取消收藏',
          icon: 'none',
          duration: 1500
        });
        console.log('[CHAT] 已取消收藏');
      }
      
      // 保存收藏列表到本地
      this.saveFavorites();
      
      // 保存消息更新
      this.saveAllMessages();
    },
    
    /**
     * 删除消息
     */
    deleteMessage(index) {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这条消息吗？',
        success: (res) => {
          if (res.confirm) {
            this.messages.splice(index, 1);
            this.saveAllMessages();
            
            uni.showToast({
              title: '已删除',
              icon: 'success',
              duration: 1500
            });
            console.log('[CHAT] 消息已删除');
          }
        }
      });
    },
    
    /**
     * 保存收藏列表
     */
    saveFavorites() {
      try {
        uni.setStorageSync('chat_favorites', JSON.stringify(this.favoriteMessages));
        console.log('[CHAT] 收藏列表已保存');
      } catch (error) {
        console.error('[CHAT] 保存收藏列表失败:', error);
      }
    },
    
    /**
     * 加载收藏列表
     */
    loadFavorites() {
      try {
        const favorites = uni.getStorageSync('chat_favorites');
        if (favorites) {
          this.favoriteMessages = JSON.parse(favorites);
          console.log(`[CHAT] 加载了${this.favoriteMessages.length}条收藏消息`);
        }
      } catch (error) {
        console.error('[CHAT] 加载收藏列表失败:', error);
      }
    },
    
    /**
     * 切换表情选择器显示
     */
    toggleEmojiPicker() {
      this.showEmojiPicker = !this.showEmojiPicker;
      console.log(`[CHAT] 表情选择器: ${this.showEmojiPicker ? '显示' : '隐藏'}`);
    },
    
    /**
     * 插入表情
     */
    insertEmoji(emoji) {
      this.inputText += emoji;
      // 关闭表情选择器（可选）
      // this.showEmojiPicker = false;
      console.log('[CHAT] 插入表情:', emoji);
    },
    
    // 发送消息
    async sendMessage() {
      const text = this.inputText.trim();
      if (!text || this.isSending) return;
      
      // 敏感词检测
      const sensitiveCheck = checkSensitiveWords(text);
      
      // 如果包含危机关键词，显示危机干预提示
      if (sensitiveCheck.isCrisis) {
        uni.showModal({
          title: '⚠️ 重要提示',
          content: getCrisisWarning(),
          confirmText: '我知道了',
          confirmColor: '#DC3545',
          showCancel: false,
          success: (res) => {
            // 用户确认后仍然发送消息，但会由后端进行特殊处理
            this.proceedSendMessage(text, sensitiveCheck);
          }
        });
        return;
      }
      
      // 如果包含敏感词但不是危机，显示警告
      if (sensitiveCheck.hasSensitive) {
        uni.showModal({
          title: '敏感内容提示',
          content: getSensitiveWarning(sensitiveCheck.matchedWords),
          confirmText: '继续发送',
          cancelText: '重新编辑',
          success: (res) => {
            if (res.confirm) {
              this.proceedSendMessage(text, sensitiveCheck);
            }
          }
        });
        return;
      }
      
      // 正常发送
      this.proceedSendMessage(text, null);
    },
    
    /**
     * 执行发送消息（内部方法）
     */
    async proceedSendMessage(text, sensitiveCheck) {
      // 创建用户消息
      const userMessage = {
        role: 'user',
        content: text,
        timestamp: Date.now(),
        sendStatus: 'sending',  // 添加发送状态
        hasSensitive: sensitiveCheck?.hasSensitive || false,
        isCrisis: sensitiveCheck?.isCrisis || false
      };
      
      // 添加到消息列表
      this.messages.push(userMessage);
      const messageIndex = this.messages.length - 1;
      this.inputText = '';
      this.scrollToBottom();
      
      // 保存用户消息
      await this.saveMessage(userMessage);
      
      // 发送到AI并获取回复
      await this.sendToAI(messageIndex);
    },
    
    /**
     * 发送消息到AI并处理回复
     */
    async sendToAI(messageIndex) {
      // 显示输入中状态
      this.isSending = true;
      this.isTyping = true;
      
      try {
        // 准备发送的消息列表（只包含已成功的消息）
        const messagesToSend = this.messages
          .filter(msg => msg.sendStatus !== 'failed' && msg.sendStatus !== 'sending')
          .concat([this.messages[messageIndex]]);
        
        // 调用云函数获取AI回复
        const res = await uniCloud.callFunction({
          name: 'stress-chat',
          data: {
            messages: messagesToSend.map(m => ({
              role: m.role,
              content: m.content
            })),
            stream: false
          }
        });
        
        // 添加AI回复消息
        if (res.result && res.result.success && res.result.data) {
          const aiContent = res.result.data.content || res.result.data.message;
          
          // 标记用户消息发送成功
          this.$set(this.messages[messageIndex], 'sendStatus', 'success');
          await this.saveMessage(this.messages[messageIndex]);
          
          // 添加AI回复
          this.addAIMessage(aiContent);
        } else {
          console.error('[CHAT] AI回复异常:', res);
          // 标记消息发送失败
          this.$set(this.messages[messageIndex], 'sendStatus', 'failed');
          await this.saveMessage(this.messages[messageIndex]);
          
          uni.showToast({
            title: 'AI回复异常，点击重发',
            icon: 'none',
            duration: 2000
          });
        }
        
      } catch (error) {
        console.error('[CHAT] 发送失败:', error);
        
        // 标记消息发送失败
        this.$set(this.messages[messageIndex], 'sendStatus', 'failed');
        await this.saveMessage(this.messages[messageIndex]);
        
        uni.showToast({
          title: '发送失败，点击重发',
          icon: 'none',
          duration: 2000
        });
      } finally {
        this.isSending = false;
        this.isTyping = false;
        this.scrollToBottom();
      }
    },
    
    /**
     * 重发失败的消息
     */
    async resendMessage(messageIndex) {
      const message = this.messages[messageIndex];
      
      if (!message || message.role !== 'user') {
        return;
      }
      
      // 更新状态为发送中
      this.$set(this.messages[messageIndex], 'sendStatus', 'sending');
      
      // 震动反馈
      uni.vibrateShort({
        success: () => {
          console.log('[CHAT] 重发震动反馈');
        }
      });
      
      // 重新发送
      await this.sendToAI(messageIndex);
    },
    
    // 模拟AI回复（开发阶段使用）
    async simulateAIResponse(userMsg) {
      return new Promise((resolve) => {
        setTimeout(() => {
          let response = '';
          
          if (userMsg.includes('压力') || userMsg.includes('焦虑')) {
            response = '我理解您现在感到压力很大。压力是生活中很正常的一部分，重要的是学会如何管理它。您可以尝试深呼吸、适度运动，或者找朋友倾诉。记住，您不是一个人在面对这些。';
          } else if (userMsg.includes('睡不着') || userMsg.includes('失眠')) {
            response = '睡眠问题确实很困扰人。建议您睡前避免使用手机，保持规律的作息时间。您也可以尝试我们的冥想音疗功能，帮助放松身心，改善睡眠质量。';
          } else if (userMsg.includes('谢谢') || userMsg.includes('感谢')) {
            response = '不客气！很高兴能够帮到您。如果还有任何困扰，随时可以和我聊聊。记得照顾好自己！';
          } else {
            response = '我听到了您的心声。虽然我只是一个AI，但我真诚地希望能给您一些支持。如果您愿意，可以详细说说您的感受，我会认真倾听。';
          }
          
          this.addAIMessage(response);
          resolve();
        }, 1500);
      });
    },
    
    // 添加AI消息
    async addAIMessage(content) {
      const aiMessage = {
        role: 'assistant',
        content: content,
        timestamp: Date.now()
      };
      
      this.messages.push(aiMessage);
      this.scrollToBottom();
      
      // 保存AI消息
      await this.saveMessage(aiMessage);
    },
    
    // 滚动到底部
    scrollToBottom() {
      this.$nextTick(() => {
        this.scrollIntoView = this.getMsgId(this.messages.length - 1);
      });
    },
    
    // 获取消息ID
    getMsgId(index) {
      return this.msgIdPrefix + index;
    },
    
    /**
     * 判断消息是否可以撤回（2分钟内）
     */
    canRevoke(msg) {
      if (!msg || msg.role !== 'user' || msg.sendStatus !== 'success') {
        return false;
      }
      
      const now = Date.now();
      const messageTime = msg.timestamp || 0;
      const timeDiff = now - messageTime;
      
      // 2分钟 = 120000毫秒
      return timeDiff < 120000;
    },
    
    /**
     * 撤回消息
     */
    async revokeMessage(index) {
      const message = this.messages[index];
      
      if (!message || !this.canRevoke(message)) {
        uni.showToast({
          title: '无法撤回此消息',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '撤回消息',
        content: '确定要撤回这条消息吗？',
        confirmText: '撤回',
        cancelText: '取消',
        success: async (res) => {
          if (res.confirm) {
            // 标记消息为已撤回
            this.$set(this.messages[index], 'isRevoked', true);
            this.$set(this.messages[index], 'revokedAt', Date.now());
            
            // 保存更新后的消息
            await this.saveMessage(this.messages[index]);
            
            // 震动反馈
            uni.vibrateShort({
              success: () => {
                console.log('[CHAT] 撤回震动反馈');
              }
            });
            
            // 同时检查是否有对应的AI回复需要标记
            // 查找下一条AI消息
            if (index + 1 < this.messages.length && 
                this.messages[index + 1].role === 'assistant') {
              this.$set(this.messages[index + 1], 'relatedRevoked', true);
              await this.saveMessage(this.messages[index + 1]);
            }
            
            uni.showToast({
              title: '已撤回',
              icon: 'success',
              duration: 1500
            });
            
            console.log('[CHAT] 消息已撤回, index:', index);
          }
        }
      });
    },
    
    /**
     * 处理清空聊天
     */
    handleClearChat() {
      if (this.messages.length === 0) {
        uni.showToast({
          title: '暂无聊天记录',
          icon: 'none'
        });
        return;
      }
      
      uni.showModal({
        title: '清空聊天记录',
        content: '确定要清空所有聊天记录吗？此操作不可恢复。',
        confirmText: '确定清空',
        confirmColor: '#DC3545',
        success: (res) => {
          if (res.confirm) {
            this.clearCurrentSession();
          }
        }
      });
    },
    
    /**
     * 显示评分对话框
     */
    showRatingDialog(msg, index) {
      uni.showActionSheet({
        itemList: ['👍 很有帮助', '👎 不够满意', '💡 提供反馈'],
        success: (res) => {
          const tapIndex = res.tapIndex;
          
          if (tapIndex === 0) {
            // 好评
            this.rateMessage(msg, index, 'good');
          } else if (tapIndex === 1) {
            // 差评
            this.rateMessage(msg, index, 'bad');
            // 询问是否提供详细反馈
            this.askForDetailedFeedback(msg, index);
          } else if (tapIndex === 2) {
            // 直接提供反馈
            this.askForDetailedFeedback(msg, index);
          }
        }
      });
    },
    
    /**
     * 评价消息
     */
    async rateMessage(msg, index, rating) {
      // 更新本地消息状态
      this.$set(this.messages[index], 'rating', rating);
      this.$set(this.messages[index], 'ratedAt', Date.now());
      
      // 保存到本地存储
      await this.saveMessage(this.messages[index]);
      
      // 提交评分到服务器（异步，不影响用户体验）
      this.submitRating(msg, rating).catch(err => {
        console.warn('[CHAT] 评分上传失败:', err);
      });
      
      // 震动反馈
      uni.vibrateShort({
        success: () => {
          console.log('[CHAT] 评分震动反馈');
        }
      });
      
      // 显示感谢提示
      uni.showToast({
        title: rating === 'good' ? '感谢您的反馈！' : '我们会努力改进',
        icon: 'success',
        duration: 1500
      });
      
      console.log('[CHAT] 消息评分:', rating);
    },
    
    /**
     * 提交评分到服务器
     */
    async submitRating(msg, rating, feedback = '') {
      try {
        const res = await uniCloud.callFunction({
          name: 'chat-feedback',
          data: {
            sessionId: this.sessionId,
            messageContent: msg.content,
            messageTimestamp: msg.timestamp,
            rating: rating,
            feedback: feedback,
            timestamp: Date.now()
          }
        });
        
        if (res.result && res.result.success) {
          console.log('[CHAT] 评分已提交');
        }
      } catch (error) {
        console.error('[CHAT] 评分提交失败:', error);
        // 失败不影响用户体验，仅记录日志
      }
    },
    
    /**
     * 询问详细反馈
     */
    askForDetailedFeedback(msg, index) {
      // 延迟显示，避免与评分操作冲突
      setTimeout(() => {
        uni.showModal({
          title: '提供反馈',
          content: '请告诉我们您的想法，帮助我们改进AI回复质量',
          placeholderText: '例如：回复太简短、不够专业等...',
          editable: true,
          confirmText: '提交反馈',
          success: (res) => {
            if (res.confirm && res.content) {
              // 提交详细反馈
              this.submitRating(msg, msg.rating || 'neutral', res.content);
              
              uni.showToast({
                title: '感谢您的反馈！',
                icon: 'success'
              });
            }
          }
        });
      }, 300);
    }
  }
}
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F5F5F7;
  /* 顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  /* TabBar底部安全区域 */
  padding-bottom: calc(50px + constant(safe-area-inset-bottom));
  padding-bottom: calc(50px + env(safe-area-inset-bottom));
}

/* 顶部操作栏 */
.top-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  background: #FFFFFF;
  border-bottom: 1rpx solid #E5E5EA;
  position: sticky;
  top: 0;
  z-index: 10;
}

/* 标题包装器 */
.title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #1D1D1F;
}

/* 会话指示器 */
.session-indicator {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 4rpx 12rpx;
  background: #F5F5F7;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.session-indicator:active {
  transform: scale(0.95);
  background: #E5E5EA;
}

.session-name {
  font-size: 24rpx;
  color: #8E8E93;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.action-buttons {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #F5F5F7;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.action-btn:active {
  transform: scale(0.95);
  background: #E5E5EA;
}

/* 消息列表 */
.message-list {
  flex: 1;
  padding: 24rpx;
  /* 底部padding为输入框高度 + 额外间距 */
  padding-bottom: 240rpx;
  overflow-y: auto;
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
  line-height: 1.5;
}

/* 消息项 */
.message-item {
  margin-bottom: 24rpx;
}

.message {
  display: flex;
  align-items: flex-end;
  gap: 16rpx;
}

.user-message {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #0A84FF;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 消息内容包装器 */
.message-content-wrapper {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8rpx;
}

.message-content {
  max-width: 500rpx;
  padding: 24rpx 28rpx;
  border-radius: 24rpx;
  font-size: 30rpx;
  line-height: 1.6;
  word-break: break-word;
  position: relative;
}

/* 发送状态指示器 */
.status-indicator {
  position: absolute;
  bottom: 4rpx;
  right: 8rpx;
  display: flex;
  align-items: center;
  gap: 4rpx;
}

/* 重发按钮 */
.retry-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #FFF;
  border: 1rpx solid #DC3545;
  border-radius: 20rpx;
  transition: all 0.2s ease;
}

.retry-btn:active {
  transform: scale(0.95);
  background: #FFF5F5;
}

.retry-text {
  font-size: 24rpx;
  color: #DC3545;
  font-weight: 500;
}

/* 撤回按钮 */
.revoke-btn {
  display: flex;
  align-items: center;
  gap: 6rpx;
  padding: 6rpx 12rpx;
  background: rgba(255, 255, 255, 0.9);
  border: 1rpx solid #E5E5EA;
  border-radius: 16rpx;
  transition: all 0.2s ease;
}

.revoke-btn:active {
  transform: scale(0.95);
  background: #F5F5F7;
}

.revoke-text {
  font-size: 22rpx;
  color: #8E8E93;
}

/* 已撤回标记 */
.revoked-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
}

.revoked-text {
  font-size: 24rpx;
  color: #8E8E93;
  font-style: italic;
}

/* 已撤回的消息样式 */
.message.user-message:has(.revoked-indicator) .message-content {
  opacity: 0.5;
  position: relative;
}

.message.user-message:has(.revoked-indicator) .message-content text {
  text-decoration: line-through;
  color: #8E8E93;
}

/* AI消息包装器 */
.ai-message-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  max-width: 500rpx;
}

/* 消息评分 */
.message-rating {
  display: flex;
  align-items: center;
  padding: 0 8rpx;
}

.rating-prompt {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  background: #F5F5F7;
  border-radius: 16rpx;
  transition: all 0.2s ease;
}

.rating-prompt:active {
  transform: scale(0.95);
  background: #E5E5EA;
}

.rating-result {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
}

.rating-text {
  font-size: 22rpx;
  color: #8E8E93;
}

.rating-text.rated {
  color: #34C759;
  font-weight: 500;
}

.favorite-badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 36rpx;
  height: 36rpx;
  background: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.user-message .message-content {
  background: linear-gradient(135deg, #0A84FF 0%, #5856D6 100%);
  color: #FFFFFF;
  border-bottom-right-radius: 8rpx;
  box-shadow: 0 4rpx 16rpx rgba(10, 132, 255, 0.3);
  /* 添加消息出现动画 */
  animation: slideInRight 0.3s ease-out;
}

.ai-message .message-content {
  background: #FFFFFF;
  color: #1D1D1F;
  border-bottom-left-radius: 8rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
  border: 1rpx solid #F0F0F5;
  /* 添加消息出现动画 */
  animation: slideInLeft 0.3s ease-out;
}

/* 消息滑入动画 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(50rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-50rpx);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

/* 正在输入动画 */
.typing-indicator {
  display: flex;
  gap: 12rpx;
  padding: 32rpx 28rpx;
}

.typing-indicator .dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: #C7C7CC;
  animation: typing 1.4s infinite;
}

.typing-indicator .dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator .dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.5;
  }
  30% {
    transform: translateY(-12rpx);
    opacity: 1;
  }
}

/* 输入框 */
.input-bar {
  background: #FFFFFF;
  padding: 24rpx;
  /* 底部安全区域 */
  padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #E5E5EA;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.05);
  /* 固定在底部，支持键盘避让 */
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.input-wrapper {
  display: flex;
  flex-direction: column;
  background: #F5F5F7;
  border-radius: 24rpx;
  padding: 16rpx 20rpx;
}

.input-field {
  width: 100%;
  min-height: 80rpx;
  max-height: 200rpx;
  font-size: 30rpx;
  line-height: 1.6;
  color: #1D1D1F;
  background: transparent;
}

.input-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.char-count {
  font-size: 24rpx;
  color: #86868B;
}

.send-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #0A84FF;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  transition: all 0.3s ease;
}

.send-btn:disabled {
  background: #C7C7CC;
  opacity: 0.5;
}

.send-btn:active:not(:disabled) {
  transform: scale(0.95);
}

/* 输入工具栏 */
.input-toolbar {
  display: flex;
  align-items: center;
  padding-bottom: 8rpx;
}

.toolbar-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.toolbar-btn:active {
  background: rgba(0, 0, 0, 0.05);
}

/* 表情选择器 */
.emoji-picker {
  width: 100%;
  background: #F9FAFB;
  border-top: 1rpx solid #E5E5EA;
  padding: 24rpx 16rpx;
  max-height: 400rpx;
  overflow-y: scroll;
  border-radius: 24rpx 24rpx 0 0;
}

.emoji-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 16rpx;
}

.emoji-item {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  border-radius: 12rpx;
  transition: all 0.2s ease;
}

.emoji-item:active {
  background: #E5E5EA;
  transform: scale(1.2);
}

/* 会话弹窗 */
.session-popup {
  background: #FFFFFF;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #E5E5EA;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.popup-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F5F5F7;
  transition: all 0.2s ease;
}

.popup-close:active {
  transform: scale(0.95);
  background: #E5E5EA;
}

.session-list {
  flex: 1;
  padding: 16rpx 0;
  max-height: 600rpx;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  transition: background 0.2s ease;
}

.session-item:active {
  background: #F5F5F7;
}

.session-item.active {
  background: #F0F9FF;
  border-left: 4rpx solid #0A84FF;
}

.session-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.session-item .session-name {
  font-size: 28rpx;
  color: #1D1D1F;
  font-weight: 500;
  max-width: 400rpx;
}

.session-time {
  font-size: 24rpx;
  color: #8E8E93;
}

.session-actions {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.action-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #F5F5F7;
  transition: all 0.2s ease;
}

.action-icon:active {
  transform: scale(0.9);
  background: #E5E5EA;
}
</style>
