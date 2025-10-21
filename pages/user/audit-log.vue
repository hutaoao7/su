<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-back" @tap="goBack">
        <text class="back-icon">‹</text>
      </view>
      <text class="header-title">撤回记录审计</text>
      <view class="header-placeholder"></view>
    </view>

    <!-- 时间范围筛选 -->
    <view class="filter-section">
      <view class="filter-item">
        <text class="filter-label">开始日期</text>
        <input 
          type="date"
          v-model="startDate"
          class="filter-input"
          @change="loadAuditLog"
        />
      </view>
      <view class="filter-item">
        <text class="filter-label">结束日期</text>
        <input 
          type="date"
          v-model="endDate"
          class="filter-input"
          @change="loadAuditLog"
        />
      </view>
      <button class="btn-export" @tap="exportAuditReport">
        📥 导出报告
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="isLoading" class="loading-container">
      <u-loading-page></u-loading-page>
    </view>

    <!-- 空状态 -->
    <view v-else-if="auditRecords.length === 0" class="empty-state">
      <text class="empty-icon">📋</text>
      <text class="empty-title">暂无审计记录</text>
      <text class="empty-desc">您还没有任何撤回或删除操作</text>
    </view>

    <!-- 审计日志列表 -->
    <view v-else class="audit-list">
      <view 
        v-for="record in auditRecords" 
        :key="record.id"
        class="audit-item"
        :class="{ [record.actionType]: true }"
      >
        <view class="item-header">
          <text class="item-icon">{{ getActionIcon(record.actionType) }}</text>
          <view class="item-info">
            <text class="item-title">{{ getActionTitle(record.actionType) }}</text>
            <text class="item-time">{{ formatTime(record.timestamp) }}</text>
          </view>
          <text class="item-status" :class="record.status">
            {{ getStatusText(record.status) }}
          </text>
        </view>
        
        <view class="item-details">
          <view v-if="record.reason" class="detail-row">
            <text class="detail-label">原因：</text>
            <text class="detail-value">{{ record.reason }}</text>
          </view>
          <view v-if="record.customReason" class="detail-row">
            <text class="detail-label">详情：</text>
            <text class="detail-value">{{ record.customReason }}</text>
          </view>
          <view v-if="record.revokedItems" class="detail-row">
            <text class="detail-label">撤回项：</text>
            <view class="detail-tags">
              <view 
                v-for="item in record.revokedItems" 
                :key="item"
                class="tag"
              >
                {{ item }}
              </view>
            </view>
          </view>
          <view v-if="record.scheduledAt" class="detail-row">
            <text class="detail-label">计划执行：</text>
            <text class="detail-value">{{ formatTime(record.scheduledAt) }}</text>
          </view>
          <view v-if="record.completedAt" class="detail-row">
            <text class="detail-label">完成时间：</text>
            <text class="detail-value">{{ formatTime(record.completedAt) }}</text>
          </view>
        </view>
        
        <!-- 操作按钮 -->
        <view class="item-actions">
          <button 
            v-if="canUndo(record)"
            class="btn-action btn-undo"
            @tap="undoAction(record)"
          >
            撤销
          </button>
          <button 
            class="btn-action btn-detail"
            @tap="showDetail(record)"
          >
            详情
          </button>
        </view>
      </view>
    </view>

    <!-- 详情弹窗 -->
    <u-popup 
      v-model="showDetailModal"
      mode="bottom"
      height="60%"
      border-radius="24"
      :safe-area-inset-bottom="true"
    >
      <view class="detail-modal">
        <view class="modal-header">
          <text class="modal-title">操作详情</text>
          <view class="modal-close" @tap="showDetailModal = false">
            <text class="close-icon">×</text>
          </view>
        </view>
        <view class="modal-body">
          <view v-if="selectedRecord" class="detail-content">
            <view class="detail-section">
              <text class="section-title">基本信息</text>
              <view class="detail-row">
                <text class="detail-label">操作类型：</text>
                <text class="detail-value">{{ getActionTitle(selectedRecord.actionType) }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">操作时间：</text>
                <text class="detail-value">{{ formatTime(selectedRecord.timestamp) }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">操作状态：</text>
                <text class="detail-value" :class="selectedRecord.status">
                  {{ getStatusText(selectedRecord.status) }}
                </text>
              </view>
            </view>
            
            <view v-if="selectedRecord.deviceInfo" class="detail-section">
              <text class="section-title">设备信息</text>
              <view class="detail-row">
                <text class="detail-label">平台：</text>
                <text class="detail-value">{{ selectedRecord.deviceInfo.platform }}</text>
              </view>
              <view class="detail-row">
                <text class="detail-label">设备型号：</text>
                <text class="detail-value">{{ selectedRecord.deviceInfo.model }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import { callFunction } from '@/utils/unicloud-handler.js';

export default {
  data() {
    return {
      isLoading: false,
      
      // 时间范围筛选
      startDate: this.getDateString(Date.now() - 90 * 24 * 60 * 60 * 1000),
      endDate: this.getDateString(Date.now()),
      
      // 审计记录
      auditRecords: [],
      
      // 详情弹窗
      showDetailModal: false,
      selectedRecord: null
    };
  },
  
  methods: {
    // 返回上一页
    goBack() {
      uni.navigateBack();
    },
    
    // 任务3: 加载审计日志
    async loadAuditLog() {
      this.isLoading = true;
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('请先登录');
        }
        
        // 任务3: 调用云函数查询审计记录
        const res = await callFunction('audit-log', {
          action: 'query_audit_records',
          token,
          startDate: this.startDate,
          endDate: this.endDate,
          limit: 100
        });
        
        if (res.code === 200) {
          this.auditRecords = res.data || [];
          console.log('[AUDIT-LOG] 审计记录已加载:', this.auditRecords.length);
        } else {
          throw new Error(res.message || '加载失败');
        }
      } catch (error) {
        console.error('[AUDIT-LOG] 加载审计日志失败:', error);
        uni.showToast({
          title: error.message || '加载失败',
          icon: 'none'
        });
      } finally {
        this.isLoading = false;
      }
    },
    
    // 任务3: 导出审计报告
    async exportAuditReport() {
      uni.showLoading({ title: '生成中...' });
      
      try {
        const token = uni.getStorageSync('token');
        if (!token) {
          throw new Error('请先登录');
        }
        
        // 任务3: 调用云函数导出报告
        const res = await callFunction('audit-log', {
          action: 'export_audit_report',
          token,
          startDate: this.startDate,
          endDate: this.endDate,
          format: 'pdf'
        });
        
        if (res.code === 200) {
          uni.hideLoading();
          
          // 保存导出记录
          this.recordExport(res.data);
          
          uni.showToast({
            title: '报告已生成',
            icon: 'success'
          });
          
          // 可选：下载或分享报告
          if (res.data.downloadUrl) {
            uni.downloadFile({
              url: res.data.downloadUrl,
              success: (res) => {
                console.log('[AUDIT-LOG] 报告已下载:', res.tempFilePath);
              }
            });
          }
        } else {
          throw new Error(res.message || '导出失败');
        }
      } catch (error) {
        uni.hideLoading();
        console.error('[AUDIT-LOG] 导出失败:', error);
        
        uni.showToast({
          title: error.message || '导出失败',
          icon: 'none'
        });
      }
    },
    
    // 任务3: 记录导出
    recordExport(data) {
      try {
        const log = {
          action: 'audit_report_export',
          timestamp: Date.now(),
          reportId: data.reportId,
          format: 'pdf'
        };
        
        const logs = uni.getStorageSync('exportLogs') || [];
        logs.push(log);
        uni.setStorageSync('exportLogs', logs);
        
        console.log('[AUDIT-LOG] 导出记录已保存:', log);
      } catch (error) {
        console.error('[AUDIT-LOG] 记录导出失败:', error);
      }
    },
    
    // 撤销操作
    async undoAction(record) {
      if (!this.canUndo(record)) return;
      
      uni.showModal({
        title: '确认撤销',
        content: '确定要撤销此操作吗？',
        success: async (res) => {
          if (res.confirm) {
            uni.showLoading({ title: '处理中...' });
            
            try {
              const token = uni.getStorageSync('token');
              if (!token) {
                throw new Error('请先登录');
              }
              
              const res = await callFunction('audit-log', {
                action: 'undo_action',
                token,
                recordId: record.id
              });
              
              if (res.code === 200) {
                uni.hideLoading();
                uni.showToast({
                  title: '撤销成功',
                  icon: 'success'
                });
                this.loadAuditLog();
              } else {
                throw new Error(res.message || '撤销失败');
              }
            } catch (error) {
              uni.hideLoading();
              console.error('[AUDIT-LOG] 撤销失败:', error);
              
              uni.showToast({
                title: error.message || '撤销失败',
                icon: 'none'
              });
            }
          }
        }
      });
    },
    
    // 显示详情
    showDetail(record) {
      this.selectedRecord = record;
      this.showDetailModal = true;
    },
    
    // 是否可以撤销
    canUndo(record) {
      if (record.status !== 'pending') return false;
      
      // 检查是否在7天内
      const now = Date.now();
      const createdAt = new Date(record.timestamp).getTime();
      const daysPassed = (now - createdAt) / (24 * 60 * 60 * 1000);
      
      return daysPassed < 7;
    },
    
    // 获取操作图标
    getActionIcon(actionType) {
      const icons = {
        'revoke_consent': '🔄',
        'delete_account': '🗑️',
        'delete_data': '📊',
        'export_data': '📥'
      };
      return icons[actionType] || '📋';
    },
    
    // 获取操作标题
    getActionTitle(actionType) {
      const titles = {
        'revoke_consent': '撤回同意',
        'delete_account': '账号注销',
        'delete_data': '数据删除',
        'export_data': '数据导出'
      };
      return titles[actionType] || '未知操作';
    },
    
    // 获取状态文本
    getStatusText(status) {
      const texts = {
        'pending': '进行中',
        'completed': '已完成',
        'cancelled': '已取消',
        'failed': '失败'
      };
      return texts[status] || status;
    },
    
    // 格式化时间
    formatTime(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    },
    
    // 获取日期字符串
    getDateString(timestamp) {
      const date = new Date(timestamp);
      return date.toISOString().split('T')[0];
    }
  },
  
  onLoad() {
    console.log('[AUDIT-LOG] 页面加载');
    this.loadAuditLog();
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

.filter-section {
  display: flex;
  gap: 12px;
  padding: 12px 16px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  align-items: center;
}

.filter-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  color: #999;
}

.filter-input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.btn-export {
  padding: 8px 12px;
  background-color: #2196f3;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
}

.loading-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.empty-icon {
  font-size: 48px;
}

.empty-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.empty-desc {
  font-size: 14px;
  color: #999;
}

.audit-list {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.audit-item {
  background-color: #fff;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
  border-left: 4px solid #2196f3;
}

.audit-item.delete_account {
  border-left-color: #ff3b30;
}

.audit-item.delete_data {
  border-left-color: #ff9800;
}

.item-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.item-icon {
  font-size: 24px;
}

.item-info {
  flex: 1;
}

.item-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  display: block;
}

.item-time {
  font-size: 12px;
  color: #999;
  display: block;
  margin-top: 2px;
}

.item-status {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: #e3f2fd;
  color: #2196f3;
}

.item-status.completed {
  background-color: #e8f5e9;
  color: #2e7d32;
}

.item-status.failed {
  background-color: #ffebee;
  color: #c62828;
}

.item-details {
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13px;
}

.detail-label {
  color: #999;
  min-width: 60px;
}

.detail-value {
  color: #333;
  flex: 1;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag {
  display: inline-block;
  padding: 4px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  font-size: 12px;
  color: #666;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  background-color: #f9f9f9;
  color: #333;
}

.btn-undo {
  border-color: #2196f3;
  color: #2196f3;
}

.btn-detail {
  border-color: #999;
  color: #666;
}

.detail-modal {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #eee;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.modal-close {
  font-size: 24px;
  color: #999;
}

.modal-body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
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

