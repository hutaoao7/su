<template>
  <view class="export-page">
    <!-- 标题区域 -->
    <view class="header">
      <text class="title">数据导出</text>
      <text class="subtitle">根据GDPR要求，您可以导出所有个人数据</text>
    </view>

    <!-- 导出选项 -->
    <view class="options-section">
      <view class="section-title">选择导出内容</view>
      
      <view class="option-item">
        <checkbox-group @change="onCheckboxChange">
          <label class="checkbox-label">
            <checkbox value="profile" :checked="exportOptions.profile" />
            <text class="checkbox-text">个人资料</text>
          </label>
          
          <label class="checkbox-label">
            <checkbox value="assessments" :checked="exportOptions.assessments" />
            <text class="checkbox-text">评估记录（{{ assessmentCount }}条）</text>
          </label>
          
          <label class="checkbox-label">
            <checkbox value="chats" :checked="exportOptions.chats" />
            <text class="checkbox-text">聊天记录（{{ chatCount }}条）</text>
          </label>
          
          <label class="checkbox-label">
            <checkbox value="favorites" :checked="exportOptions.favorites" />
            <text class="checkbox-text">收藏内容</text>
          </label>
        </checkbox-group>
      </view>
    </view>

    <!-- 格式选择 -->
    <view class="format-section">
      <view class="section-title">选择导出格式</view>
      
      <radio-group @change="onFormatChange">
        <label class="radio-label">
          <radio value="json" :checked="format === 'json'" />
          <text class="radio-text">JSON格式</text>
        </label>
        
        <label class="radio-label">
          <radio value="csv" :checked="format === 'csv'" />
          <text class="radio-text">CSV表格</text>
        </label>
      </radio-group>
    </view>

    <!-- 导出按钮 -->
    <view class="export-section">
      <button 
        class="export-btn"
        :disabled="exporting || !hasSelection"
        :loading="exporting"
        @tap="handleExport"
      >
        {{ exporting ? '导出中...' : '开始导出' }}
      </button>
      
      <view class="export-hint">
        <u-icon name="info-circle" size="16" color="#86868B"></u-icon>
        <text class="hint-text">导出的数据将加密保存，请妥善保管</text>
      </view>
    </view>

    <!-- 导出历史 -->
    <view class="history-section" v-if="exportHistory.length > 0">
      <view class="section-title">导出历史</view>
      
      <view 
        v-for="(item, index) in exportHistory" 
        :key="index"
        class="history-item"
      >
        <view class="history-info">
          <text class="history-date">{{ formatDate(item.created_at) }}</text>
          <text class="history-format">{{ item.format.toUpperCase() }}</text>
        </view>
        <button class="history-download" size="mini" @tap="downloadHistory(item)">
          下载
        </button>
      </view>
    </view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent } from '@/utils/analytics.js';

export default {
  data() {
    return {
      exportOptions: {
        profile: true,
        assessments: true,
        chats: false,
        favorites: false
      },
      format: 'json',
      exporting: false,
      assessmentCount: 0,
      chatCount: 0,
      exportHistory: []
    };
  },
  
  computed: {
    hasSelection() {
      return Object.values(this.exportOptions).some(v => v);
    }
  },
  
  onLoad() {
    this.loadCounts();
    this.loadExportHistory();
  },
  
  methods: {
    onCheckboxChange(e) {
      const values = e.detail.value;
      this.exportOptions = {
        profile: values.includes('profile'),
        assessments: values.includes('assessments'),
        chats: values.includes('chats'),
        favorites: values.includes('favorites')
      };
    },
    
    onFormatChange(e) {
      this.format = e.detail.value;
    },
    
    async loadCounts() {
      // 加载数据计数
      try {
        const result = await callCloudFunction('user-data-stats', {});
        
        if (result && result.stats) {
          this.assessmentCount = result.stats.assessments || 0;
          this.chatCount = result.stats.chats || 0;
        }
      } catch (error) {
        console.error('[EXPORT] 加载统计失败:', error);
      }
    },
    
    async loadExportHistory() {
      // 加载导出历史
      try {
        const result = await callCloudFunction('user-export-history', {});
        
        if (result && result.list) {
          this.exportHistory = result.list;
        }
      } catch (error) {
        console.error('[EXPORT] 加载历史失败:', error);
      }
    },
    
    async handleExport() {
      if (!this.hasSelection) {
        uni.showToast({
          title: '请选择要导出的内容',
          icon: 'none'
        });
        return;
      }
      
      this.exporting = true;
      
      try {
        const result = await callCloudFunction('user-data-export', {
          options: this.exportOptions,
          format: this.format
        }, {
          showLoading: true,
          loadingText: '正在导出数据...',
          timeout: 30000
        });
        
        if (result && result.download_url) {
          // 埋点
          trackEvent('data_export_success', {
            format: this.format,
            options: this.exportOptions
          });
          
          uni.showModal({
            title: '导出成功',
            content: '数据已准备好，是否立即下载？',
            success: (res) => {
              if (res.confirm) {
                this.downloadFile(result.download_url);
              }
            }
          });
          
          // 刷新历史
          this.loadExportHistory();
        }
      } catch (error) {
        console.error('[EXPORT] 导出失败:', error);
        
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        });
      } finally {
        this.exporting = false;
      }
    },
    
    downloadFile(url) {
      // 下载文件
      uni.downloadFile({
        url: url,
        success: (res) => {
          uni.saveFile({
            tempFilePath: res.tempFilePath,
            success: () => {
              uni.showToast({
                title: '保存成功',
                icon: 'success'
              });
            }
          });
        }
      });
    },
    
    downloadHistory(item) {
      this.downloadFile(item.download_url);
    },
    
    formatDate(timestamp) {
      const date = new Date(timestamp);
      return date.toLocaleString('zh-CN');
    }
  }
};
</script>

<style scoped>
.export-page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 40rpx 24rpx;
}

.header {
  text-align: center;
  margin-bottom: 48rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #1D1D1F;
  margin-bottom: 16rpx;
}

.subtitle {
  display: block;
  font-size: 26rpx;
  color: #86868B;
  line-height: 1.6;
}

.options-section,
.format-section,
.history-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 24rpx;
}

.option-item {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.checkbox-label,
.radio-label {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
}

.checkbox-text,
.radio-text {
  font-size: 28rpx;
  color: #1D1D1F;
}

.export-section {
  margin: 48rpx 0;
}

.export-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.export-btn[disabled] {
  opacity: 0.5;
}

.export-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  margin-top: 24rpx;
}

.hint-text {
  font-size: 24rpx;
  color: #86868B;
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx;
  background: #F9FAFB;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

.history-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.history-date {
  font-size: 28rpx;
  color: #1D1D1F;
}

.history-format {
  font-size: 24rpx;
  color: #86868B;
}

.history-download {
  background: #0A84FF;
  color: #FFFFFF;
}
</style>

