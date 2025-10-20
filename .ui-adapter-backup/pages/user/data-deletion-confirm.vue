<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="header-title">数据删除确认</text>
      <view class="header-placeholder"></view>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-container">
      <u-loading-page></u-loading-page>
    </view>

    <!-- 主要内容 -->
    <view v-else class="content">
      <!-- 删除清单 -->
      <view class="deletion-list-section">
        <text class="section-title">将被删除的数据</text>
        <view class="deletion-list">
          <view 
            v-for="item in deletionList" 
            :key="item.id"
            class="deletion-item"
          >
            <view class="item-header">
              <text class="item-icon">{{ item.icon }}</text>
              <view class="item-info">
                <text class="item-name">{{ item.name }}</text>
                <text class="item-count">{{ item.count }}</text>
              </view>
            </view>
            <text class="item-desc">{{ item.description }}</text>
          </view>
        </view>
      </view>

      <!-- 删除前确认 -->
      <view class="confirm-section">
        <text class="section-title">删除前确认</text>
        <view class="confirm-items">
          <label class="confirm-item">
            <checkbox 
              :checked="confirmUnderstand"
              @tap="confirmUnderstand = !confirmUnderstand"
              color="#2196f3"
            />
            <text class="confirm-text">我已了解删除的数据内容</text>
          </label>
          <label class="confirm-item">
            <checkbox 
              :checked="confirmIrreversible"
              @tap="confirmIrreversible = !confirmIrreversible"
              color="#2196f3"
            />
            <text class="confirm-text">我已了解此操作不可恢复</text>
          </label>
        </view>
      </view>

      <!-- 撤销选项 -->
      <view class="undo-section">
        <text class="section-title">撤销选项</text>
        <view class="undo-info">
          <text class="undo-icon">⏱️</text>
          <view class="undo-content">
            <text class="undo-title">7天内可撤销</text>
            <text class="undo-desc">
              删除后7天内，您可以通过重新登录来撤销此操作。7天后数据将被永久删除。
            </text>
          </view>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <button 
          class="btn btn-cancel"
          @tap="goBack"
        >
          取消
        </button>
        <button 
          class="btn btn-delete"
          :class="{ disabled: !canDelete }"
          :disabled="!canDelete"
          @tap="handleDelete"
        >
          {{ isDeleting ? '删除中...' : '确认删除' }}
        </button>
      </view>

      <!-- 删除日志提示 -->
      <view class="log-tip">
        <text class="tip-icon">📋</text>
        <text class="tip-text">
          所有删除操作都会被记录在审计日志中，您可以在"撤回记录审计"页面查看。
        </text>
      </view>
    </view>

    <!-- 确认对话框 -->
    <u-modal 
      v-model="showConfirmModal"
      title="最后确认"
      :content="confirmContent"
      confirm-text="确认删除"
      cancel-text="取消"
      @confirm="confirmDataDeletion"
      @cancel="showConfirmModal = false"
    ></u-modal>
  </view>
</template>

<script>
import { callFunction } from '@/utils/unicloud-handler.js';

export default {
  data() {
    return {
      isLoading: false,
      isDeleting: false,
      
      // 删除清单
      deletionList: [
        {
          id: 'profile',
          icon: '👤',
          name: '个人资料',
          count: '1项',
          description: '头像、昵称、个人简介等基本信息'
        },
        {
          id: 'assessments',
          icon: '📊',
          name: '评估记录',
          count: '0项',
          description: '所有心理评估的记录和结果'
        },
        {
          id: 'chat',
          icon: '💬',
          name: 'AI对话',
          count: '0项',
          description: '与AI助手的所有对话历史'
        },
        {
          id: 'community',
          icon: '👥',
          name: '社区内容',
          count: '0项',
          description: '发布的帖子、评论和互动记录'
        },
        {
          id: 'favorites',
          icon: '⭐',
          name: '收藏和偏好',
          count: '0项',
          description: '收藏的内容和个性化设置'
        }
      ],
      
      // 确认状态
      confirmUnderstand: false,
      confirmIrreversible: false,
      showConfirmModal: false,
      confirmContent: '删除后，您的所有数据将被永久删除。此操作不可恢复，但您可以在7天内通过重新登录来撤销。确定要继续吗？'
    };
  },
  
  computed: {
    // 是否可以删除
    canDelete() {
      return this.confirmUnderstand && this.confirmIrreversible && !this.isDeleting;
    }
  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 处理删除
    handleDelete() {
      if (!this.canDelete) return;
      
      this.showConfirmModal = true;
    },
    
    // 任务2: 确认数据删除
    async confirmDataDeletion() {
      this.showConfirmModal = false;
      this.isDeleting = true;
      
      uni.showLoading({ title: '删除中...' });
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('请先登录');
        }
        
        // 任务2: 调用云函数执行删除
        const res = await callFunction('data-deletion', {
          action: 'confirm_deletion',
          token,
          timestamp: Date.now(),
          deviceInfo: {
            platform: uni.getSystemInfoSync().platform,
            model: uni.getSystemInfoSync().model
          }
        });
        
        if (res.code === 200) {
          uni.hideLoading();
          
          // 任务2: 记录删除日志
          await this.recordDeletionLog(res.data);
          
          // 显示成功提示
          uni.showModal({
            title: '数据删除成功',
            content: `您的数据已开始删除。删除过程可能需要几分钟。您可以在7天内通过重新登录来撤销此操作。`,
            showCancel: false,
            success: () => {
              uni.navigateBack();
            }
          });
        } else {
          throw new Error(res.message || '删除失败');
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[DATA-DELETION] 删除失败:', error);
        
        uni.showToast({
          title: error.message || '删除失败，请重试',
          icon: 'none'
        });
      } finally {
        this.isDeleting = false;
      }
    },
    
    // 任务2: 记录删除日志
    async recordDeletionLog(data) {
      try {
        const log = {
          action: 'data_deletion',
          timestamp: Date.now(),
          deletionId: data.deletionId,
          status: 'confirmed',
          items: this.deletionList.map(item => item.id)
        };
        
        // 保存到本地存储
        const logs = uni.getStorageSync('deletionLogs') || [];
        logs.push(log);
        uni.setStorageSync('deletionLogs', logs);
        
        console.log('[DATA-DELETION] 删除日志已记录:', log);
        
        // 记录事件
        uni.$emit('trackEvent', 'data_deletion_confirmed', {
          deletionId: data.deletionId,
          timestamp: log.timestamp
        });
      } catch (error) {
        console.error('[DATA-DELETION] 记录日志失败:', error);
      }
    },
    
    // 任务2: 撤销删除
    async undoDeletion() {
      uni.showLoading({ title: '处理中...' });
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('请先登录');
        }
        
        // 调用云函数撤销删除
        const res = await callFunction('data-deletion', {
          action: 'undo_deletion',
          token,
          timestamp: Date.now()
        });
        
        if (res.code === 200) {
          uni.hideLoading();
          uni.showToast({
            title: '撤销成功',
            icon: 'success'
          });
          uni.navigateBack();
        } else {
          throw new Error(res.message || '撤销失败');
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[DATA-DELETION] 撤销失败:', error);
        
        uni.showToast({
          title: error.message || '撤销失败，请重试',
          icon: 'none'
        });
      }
    },
    
    // 加载删除清单
    async loadDeletionList() {
      try {
        const token = uni.getStorageSync('token');
        if (!token) return;
        
        // 调用云函数获取删除清单
        const res = await callFunction('data-deletion', {
          action: 'get_deletion_list',
          token
        });
        
        if (res.code === 200 && res.data) {
          // 更新删除清单中的数量
          this.deletionList.forEach(item => {
            const data = res.data[item.id];
            if (data) {
              item.count = `${data.count}项`;
            }
          });
        }
      } catch (error) {
        console.error('[DATA-DELETION] 加载删除清单失败:', error);
      }
    }
  },
  
  onLoad() {
    console.log('[DATA-DELETION] 页面加载');
    this.loadDeletionList();
  }
};
</script>

<style scoped lang="scss">
.page {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  padding-top: max(16px, env(safe-area-inset-top));
}

.header-back {
  font-size: 28px;
  color: #333;
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.header-placeholder {
  width: 44px;
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.deletion-list-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 12px;
}

.deletion-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deletion-item {
  padding: 12px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border-left: 3px solid #2196f3;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.item-icon {
  font-size: 20px;
}

.item-info {
  flex: 1;
}

.item-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: block;
}

.item-count {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 2px;
}

.item-desc {
  font-size: 13px;
  color: #666;
  margin-left: 32px;
}

.confirm-section {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.confirm-items {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.confirm-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.confirm-text {
  font-size: 14px;
  color: #333;
  flex: 1;
}

.undo-section {
  background-color: #e8f5e9;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.undo-info {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.undo-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.undo-content {
  flex: 1;
}

.undo-title {
  font-size: 14px;
  font-weight: 600;
  color: #2e7d32;
  display: block;
  margin-bottom: 4px;
}

.undo-desc {
  font-size: 13px;
  color: #558b2f;
  line-height: 1.5;
}

.action-section {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.btn {
  flex: 1;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background-color: #f0f0f0;
  color: #333;
}

.btn-delete {
  background-color: #2196f3;
  color: #fff;
}

.btn-delete.disabled {
  background-color: #ccc;
  color: #999;
  cursor: not-allowed;
}

.log-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  background-color: #fff3e0;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 20px;
}

.tip-icon {
  font-size: 16px;
  flex-shrink: 0;
}

.tip-text {
  font-size: 13px;
  color: #e65100;
  line-height: 1.5;
}
</style>

