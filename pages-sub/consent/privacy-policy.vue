<template>
  <view class="policy-page">
    <!-- 顶部安全区域 -->
    <view class="safe-area-top"></view>
    
    <!-- 搜索栏 -->
    <view class="search-bar">
      <view class="search-input-wrapper">
        <text class="search-icon">🔍</text>
        <input 
          class="search-input" 
          v-model="searchKeyword" 
          placeholder="搜索协议内容..."
          @input="handleSearch"
          @confirm="handleSearchConfirm"
        />
        <text v-if="searchKeyword" class="clear-icon" @tap="clearSearch">✕</text>
      </view>
      
      <!-- 搜索结果 -->
      <view v-if="searchResult.count > 0" class="search-result">
        <text class="result-text">找到 {{ searchResult.count }} 处匹配</text>
        <view class="result-nav">
          <text 
            class="nav-btn" 
            :class="{ disabled: currentMatchIndex <= 0 }"
            @tap="navigateMatch(-1)"
          >
            ↑
          </text>
          <text class="nav-text">{{ currentMatchIndex + 1 }}/{{ searchResult.count }}</text>
          <text 
            class="nav-btn"
            :class="{ disabled: currentMatchIndex >= searchResult.count - 1 }"
            @tap="navigateMatch(1)"
          >
            ↓
          </text>
        </view>
      </view>
    </view>
    
    <!-- 工具栏 -->
    <view class="toolbar">
      <view 
        class="tool-item" 
        :class="{ active: showHighlight }"
        @tap="toggleHighlight"
      >
        <text class="tool-icon">✨</text>
        <text class="tool-text">重点条款</text>
      </view>
      
      <!-- #ifdef H5 -->
      <view class="tool-item" @tap="handleExportPDF">
        <text class="tool-icon">📄</text>
        <text class="tool-text">导出PDF</text>
      </view>
      <!-- #endif -->
      
      <!-- #ifndef H5 -->
      <view class="tool-item" @tap="handleShare">
        <text class="tool-icon">📤</text>
        <text class="tool-text">分享</text>
      </view>
      <!-- #endif -->
    </view>
    
    <scroll-view 
      class="content-scroll" 
      :scroll-into-view="scrollIntoView"
      scroll-y
      :enable-back-to-top="true"
      :scroll-with-animation="true"
      :enhanced="true"
      :bounces="true"
    >
      <view class="content">
        <text class="page-title">翎心隐私政策</text>
        <text class="page-meta">生效日期：2025年10月12日 | 版本：v1.0.0</text>
        
        <!-- 使用rich-text渲染高亮内容 -->
        <view v-if="highlightedContent" class="content-html">
          <rich-text :nodes="highlightedContent"></rich-text>
        </view>
        
        <!-- 原始内容（不搜索时） -->
        <view v-else class="content-raw">
          <view class="section">
            <text class="section-title">一、信息收集</text>
            <text class="section-text">
我们收集以下信息：
1. 账号信息：微信OpenID、昵称、头像
2. 评估数据：问卷答案、评估结果
3. 使用数据：页面访问、功能使用记录
4. 交互数据：AI对话摘要（不保存完整对话内容）
            </text>
          </view>

          <view class="section">
            <text class="section-title">二、信息使用</text>
            <text class="section-text">
您的信息将用于：
1. 提供核心功能服务
2. 改进产品和服务质量
3. 个性化推荐和内容定制
4. 安全保障和风险防范
5. 客户服务和技术支持
            </text>
          </view>

          <view class="section">
            <text class="section-title">三、信息保护</text>
            <text class="section-text">
我们采取以下措施保护您的信息：
1. HTTPS传输加密
2. 数据存储加密（AES-256）
3. 严格的访问控制机制
4. 定期安全审计和漏洞扫描
5. 员工保密协议
            </text>
          </view>

          <view class="section">
            <text class="section-title">四、您的权利</text>
            <text class="section-text">
您享有以下权利：
1. 访问权：查看我们持有的您的个人信息
2. 更正权：更正不准确或不完整的信息
3. 删除权：要求删除您的个人信息
4. 撤回同意权：随时撤回对信息处理的同意
5. 数据导出权：以结构化格式导出您的数据
            </text>
          </view>
          
          <view class="section">
            <text class="section-title">五、第三方服务</text>
            <text class="section-text">
我们可能使用以下第三方服务：
1. 微信小程序SDK（用户认证）
2. uniCloud云服务（数据存储）
3. OpenAI API（AI对话功能）

第三方服务提供商已签署数据处理协议，承诺保护您的信息安全。
            </text>
          </view>
          
          <view class="section">
            <text class="section-title">六、未成年人保护</text>
            <text class="section-text">
如果您是未成年人（18岁以下），请在监护人同意和指导下使用本应用。
            </text>
          </view>
          
          <view class="section">
            <text class="section-title">七、政策更新</text>
            <text class="section-text">
我们可能会不定期更新本隐私政策。重大变更时，我们会通过应用内通知的方式告知您。
            </text>
          </view>
          
          <view class="section">
            <text class="section-title">八、联系我们</text>
            <text class="section-text">
如有任何疑问或建议，请通过以下方式联系我们：
- 应用内反馈功能
- 邮箱：privacy@craneheart.com
            </text>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="bottom-action">
      <button class="action-button" @tap="handleBack">我已阅读</button>
    </view>
  </view>
</template>

<script>
import { searchContent, highlightContent, exportToPDF, getFullAgreementContent } from '@/utils/consent-content-helper.js';

export default {
  data() {
    return {
      searchKeyword: '',
      searchResult: { matches: [], count: 0 },
      currentMatchIndex: 0,
      showHighlight: true,
      highlightedContent: '',
      scrollIntoView: '',
      fullContent: ''
    };
  },
  
  onLoad() {
    // 获取完整协议内容
    this.fullContent = getFullAgreementContent('privacy');
    // 默认显示重点条款高亮
    this.updateHighlight();
  },
  
  methods: {
    // 搜索处理（防抖）
    handleSearch() {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      
      this.searchTimer = setTimeout(() => {
        this.performSearch();
      }, 300);
    },
    
    // 执行搜索
    performSearch() {
      if (!this.searchKeyword) {
        this.searchResult = { matches: [], count: 0 };
        this.currentMatchIndex = 0;
        this.updateHighlight();
        return;
      }
      
      // 搜索内容
      this.searchResult = searchContent(this.fullContent, this.searchKeyword);
      this.currentMatchIndex = 0;
      
      // 更新高亮
      this.updateHighlight();
      
      // 提示搜索结果
      if (this.searchResult.count === 0) {
        uni.showToast({
          title: '未找到匹配内容',
          icon: 'none'
        });
      }
    },
    
    // 搜索确认
    handleSearchConfirm() {
      this.performSearch();
    },
    
    // 清除搜索
    clearSearch() {
      this.searchKeyword = '';
      this.searchResult = { matches: [], count: 0 };
      this.currentMatchIndex = 0;
      this.updateHighlight();
    },
    
    // 导航匹配项
    navigateMatch(direction) {
      const newIndex = this.currentMatchIndex + direction;
      
      if (newIndex < 0 || newIndex >= this.searchResult.count) {
        uni.vibrateShort();
        return;
      }
      
      this.currentMatchIndex = newIndex;
      
      // 滚动到匹配位置（简化实现，实际可以更精确）
      uni.pageScrollTo({
        scrollTop: this.currentMatchIndex * 100,
        duration: 300
      });
      
      uni.vibrateShort();
    },
    
    // 切换重点条款高亮
    toggleHighlight() {
      this.showHighlight = !this.showHighlight;
      this.updateHighlight();
      
      uni.showToast({
        title: this.showHighlight ? '已开启重点高亮' : '已关闭重点高亮',
        icon: 'none'
      });
    },
    
    // 更新高亮显示
    updateHighlight() {
      if (this.searchKeyword || this.showHighlight) {
        this.highlightedContent = highlightContent(
          this.fullContent,
          this.searchKeyword,
          this.showHighlight
        );
      } else {
        this.highlightedContent = '';
      }
    },
    
    // 导出PDF
    async handleExportPDF() {
      uni.showLoading({ title: '生成中...' });
      
      try {
        const result = await exportToPDF('翎心隐私政策', this.fullContent);
        
        uni.hideLoading();
        
        if (result.success) {
          uni.showToast({
            title: 'PDF已下载',
            icon: 'success'
          });
        } else {
          uni.showModal({
            title: '导出失败',
            content: result.error || 'PDF导出功能仅支持H5端',
            showCancel: false
          });
        }
      } catch (error) {
        uni.hideLoading();
        uni.showToast({
          title: '导出失败',
          icon: 'none'
        });
      }
    },
    
    // 分享（小程序端）
    handleShare() {
      uni.showModal({
        title: '分享协议',
        content: '请长按屏幕截图，然后分享给好友',
        showCancel: false,
        confirmText: '我知道了'
      });
    },
    
    handleBack() {
      uni.navigateBack();
    }
  },
  
  onUnload() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  }
};
</script>

<style scoped>
.policy-page {
  min-height: 100vh;
  background: #F0F0F5;
  /* 顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
}

.safe-area-top {
  height: constant(safe-area-inset-top);
  height: env(safe-area-inset-top);
}

/* 搜索栏 */
.search-bar {
  background: #FFFFFF;
  padding: 24rpx 32rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.05);
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  background: #F5F5F5;
  border-radius: 40rpx;
  padding: 0 24rpx;
  height: 72rpx;
}

.search-icon {
  font-size: 32rpx;
  margin-right: 16rpx;
  color: #8E8E93;
}

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #333;
  height: 72rpx;
  line-height: 72rpx;
}

.clear-icon {
  font-size: 32rpx;
  color: #8E8E93;
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8rpx;
; overflow: hidden}

.search-result {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 16rpx;
  padding: 16rpx 0;
  border-top: 1rpx solid #E5E5EA;
}

.result-text {
  font-size: 24rpx;
  color: #8E8E93;
}

.result-nav {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.nav-btn {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F5F5F5;
  border-radius: 28rpx;
  font-size: 32rpx;
  color: #007AFF;
; overflow: hidden}

.nav-btn.disabled {
  color: #C7C7CC;
  background: #F9F9F9;
}

.nav-text {
  font-size: 24rpx;
  color: #333;
}

/* 工具栏 */
.toolbar {
  background: #FFFFFF;
  padding: 16rpx 32rpx;
  display: flex;
  gap: 24rpx;
  border-bottom: 1rpx solid #E5E5EA;
}

.tool-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
  transition: all 0.3s;
}

.tool-item.active {
  background: #E3F2FD;
}

.tool-icon {
  font-size: 40rpx;
  margin-bottom: 8rpx;
}

.tool-text {
  font-size: 22rpx;
  color: #666;
}

.content-scroll {
  height: calc(100vh - 320rpx - constant(safe-area-inset-top));
  height: calc(100vh - 320rpx - env(safe-area-inset-top));
}

.content {
  padding: 40rpx;
}

.page-title {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #333;
  margin-bottom: 16rpx;
}

.page-meta {
  display: block;
  font-size: 24rpx;
  color: #8E8E93;
  margin-bottom: 40rpx;
}

/* 高亮内容样式 */
.content-html {
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
}

.content-html >>> .highlight-search {
  background: #FFEB3B;
  color: #333;
  font-weight: 600;
  padding: 2rpx 4rpx;
  border-radius: 4rpx;
}

.content-html >>> .highlight-important {
  background: #FFF3E0;
  color: #F57C00;
  font-weight: 500;
  padding: 2rpx 4rpx;
  border-radius: 4rpx;
}

/* 原始内容 */
.content-raw {
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
}

.section {
  margin-bottom: 40rpx;
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 16rpx;
}

.section-text {
  display: block;
  font-size: 28rpx;
  line-height: 1.8;
  color: #666;
  white-space: pre-wrap;
}

.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  /* 底部安全区域 */
  padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
}

.action-button {
  width: 100%;
  height: 88rpx;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 44rpx;
  font-size: 32rpx;
; max-width: 750rpx; overflow: hidden}


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

