<template>
  <view class="revoke-page">
    <!-- 顶部安全区域 -->
    <view class="safe-area-top"></view>
    
    <!-- 导航栏 -->
    <view class="nav-bar">
      <view class="nav-left" @tap="goBack">
        <text class="nav-icon">‹</text>
        <text class="nav-back">返回</text>
      </view>
      <text class="nav-title">撤回同意与账号注销</text>
      <view class="nav-right"></view>
    </view>

    <!-- 滚动内容区 -->
    <scroll-view 
      class="content-scroll" 
      :scroll-y="true"
      :enhanced="true"
      :bounces="false"
    >
      <!-- 警告提示 -->
      <view class="warning-section">
        <view class="warning-icon">⚠️</view>
        <text class="warning-title">重要提示</text>
        <text class="warning-text">
          撤回同意或注销账号将导致您的数据被永久删除，此操作不可恢复。请在操作前确保已导出需要保留的数据。
        </text>
      </view>

      <!-- 撤回同意选项 -->
      <view class="section">
        <text class="section-title">撤回同意选项</text>
        <text class="section-desc">选择您要撤回的同意项</text>
        
        <view class="consent-list">
          <label class="consent-item" v-for="item in consentItems" :key="item.type">
            <view class="item-content">
              <checkbox 
                :value="item.type" 
                :checked="selectedItems.includes(item.type)"
                @tap="toggleConsent(item.type)"
                color="#FF6B6B"
              />
              <view class="item-info">
                <text class="item-title">{{ item.title }}</text>
                <text class="item-desc">{{ item.desc }}</text>
              </view>
            </view>
          </label>
        </view>
      </view>

      <!-- 撤回原因 -->
      <view class="section">
        <text class="section-title">撤回原因</text>
        <text class="section-desc">请告诉我们您撤回同意的原因（可选）</text>
        
        <view class="reason-list">
          <view 
            class="reason-item" 
            v-for="reason in revokeReasons" 
            :key="reason.value"
            :class="{ active: selectedReason === reason.value }"
            @tap="selectReason(reason.value)"
          >
            <text class="reason-text">{{ reason.label }}</text>
          </view>
        </view>
        
        <textarea 
          v-if="selectedReason === 'other'"
          class="reason-input"
          placeholder="请详细说明您的原因..."
          v-model="customReason"
          maxlength="200"
          :show-confirm-bar="false"
        />
      </view>

      <!-- 账号注销 -->
      <view class="section danger-section">
        <text class="section-title">账号注销</text>
        <text class="section-desc">永久删除账号和所有相关数据</text>
        
        <view class="delete-warning">
          <text class="warning-icon">🚨</text>
          <text class="warning-text">
            注销账号后，您的所有数据将在7个工作日内被永久删除，包括但不限于：
          </text>
          <view class="data-list">
            <text class="data-item">• 个人信息和资料</text>
            <text class="data-item">• 评估记录和结果</text>
            <text class="data-item">• AI对话历史</text>
            <text class="data-item">• 社区发布的内容</text>
            <text class="data-item">• 收藏和偏好设置</text>
          </view>
        </view>
        
        <label class="delete-confirm">
          <checkbox 
            :checked="confirmDelete"
            @tap="toggleDeleteConfirm"
            color="#FF3B30"
          />
          <text class="confirm-text">我已了解并同意永久删除我的账号和所有数据</text>
        </label>
      </view>

      <!-- 冷静期提醒 -->
      <view class="cooldown-notice" v-if="showCooldown">
        <text class="notice-icon">⏰</text>
        <text class="notice-text">
          根据相关法规，账号注销将有7天的冷静期。在此期间，您可以随时撤销注销申请。
        </text>
      </view>

      <!-- 操作按钮 -->
      <view class="action-section">
        <button 
          class="action-btn export-btn" 
          @tap="goToExport"
        >
          <text class="btn-icon">📥</text>
          <text class="btn-text">先导出数据</text>
        </button>
        
        <button 
          class="action-btn revoke-btn" 
          @tap="handleRevoke"
          :disabled="!canRevoke"
        >
          <text class="btn-text">撤回同意</text>
        </button>
        
        <button 
          class="action-btn delete-btn" 
          @tap="handleDelete"
          :disabled="!confirmDelete"
        >
          <text class="btn-text">注销账号</text>
        </button>
      </view>
    </scroll-view>

    <!-- 底部安全区域 -->
    <view class="safe-area-bottom"></view>

    <!-- 二次确认弹窗 -->
    <u-modal
      v-model="showConfirmModal"
      :title="confirmTitle"
      :content="confirmContent"
      show-cancel-button
      confirm-text="确认"
      cancel-text="取消"
      @confirm="confirmAction"
      @cancel="cancelAction"
    ></u-modal>
  </view>
</template>

<script>
export default {
  data() {
    return {
      // 同意项列表
      consentItems: [
        {
          type: 'privacy',
          title: '隐私政策',
          desc: '撤回对个人信息收集和使用的同意'
        },
        {
          type: 'user',
          title: '用户协议',
          desc: '撤回对服务条款的同意'
        },
        {
          type: 'data_collection',
          title: '数据收集',
          desc: '撤回对行为数据和使用习惯收集的同意'
        },
        {
          type: 'marketing',
          title: '营销推广',
          desc: '撤回接收推广信息和活动通知的同意'
        }
      ],
      
      // 撤回原因选项
      revokeReasons: [
        { value: 'privacy_concern', label: '担心隐私泄露' },
        { value: 'no_longer_use', label: '不再使用此应用' },
        { value: 'too_many_permissions', label: '权限要求过多' },
        { value: 'data_security', label: '数据安全顾虑' },
        { value: 'service_quality', label: '服务质量不满意' },
        { value: 'other', label: '其他原因' }
      ],
      
      // 选中的同意项
      selectedItems: [],
      
      // 选中的撤回原因
      selectedReason: '',
      customReason: '',
      
      // 确认删除
      confirmDelete: false,
      
      // 显示冷静期提醒
      showCooldown: false,
      
      // 确认弹窗
      showConfirmModal: false,
      confirmTitle: '',
      confirmContent: '',
      confirmType: '', // 'revoke' 或 'delete'
      
      // 用户信息
      userInfo: null
    }
  },
  
  computed: {
    canRevoke() {
      return this.selectedItems.length > 0
    }
  },
  
  onLoad() {
    this.loadUserInfo()
  },
  
  methods: {
    // 加载用户信息
    loadUserInfo() {
      this.userInfo = uni.getStorageSync('userInfo') || {}
    },
    
    // 切换同意项选择
    toggleConsent(type) {
      const index = this.selectedItems.indexOf(type)
      if (index > -1) {
        this.selectedItems.splice(index, 1)
      } else {
        this.selectedItems.push(type)
      }
    },
    
    // 选择撤回原因
    selectReason(value) {
      this.selectedReason = value
      if (value !== 'other') {
        this.customReason = ''
      }
    },
    
    // 切换删除确认
    toggleDeleteConfirm() {
      this.confirmDelete = !this.confirmDelete
      if (this.confirmDelete) {
        this.showCooldown = true
      }
    },
    
    // 跳转到数据导出
    goToExport() {
      uni.navigateTo({
        url: '/pages-sub/other/data-export'
      })
    },
    
    // 处理撤回同意
    handleRevoke() {
      if (!this.canRevoke) return
      
      this.confirmTitle = '确认撤回同意'
      this.confirmContent = `您确定要撤回选中的${this.selectedItems.length}项同意吗？撤回后相关功能将不可用。`
      this.confirmType = 'revoke'
      this.showConfirmModal = true
    },
    
    // 处理账号注销
    handleDelete() {
      if (!this.confirmDelete) return
      
      this.confirmTitle = '确认注销账号'
      this.confirmContent = '账号注销后所有数据将被永久删除，此操作不可恢复。确定要继续吗？'
      this.confirmType = 'delete'
      this.showConfirmModal = true
    },
    
    // 确认操作
    async confirmAction() {
      if (this.confirmType === 'revoke') {
        await this.doRevoke()
      } else if (this.confirmType === 'delete') {
        await this.doDelete()
      }
    },
    
    // 取消操作
    cancelAction() {
      this.showConfirmModal = false
      this.confirmType = ''
    },
    
    // 执行撤回同意
    async doRevoke() {
      uni.showLoading({ title: '处理中...' })
      
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          throw new Error('请先登录')
        }
        
        // 调用云函数撤回同意
        const res = await uniCloud.callFunction({
          name: 'consent-revoke',
          data: {
            action: 'revoke_consent',
            token,
            revokedItems: this.selectedItems,
            reason: this.selectedReason,
            customReason: this.customReason,
            timestamp: Date.now(),
            deviceInfo: {
              platform: uni.getSystemInfoSync().platform,
              model: uni.getSystemInfoSync().model
            }
          }
        })
        
        if (res.result.code === 200) {
          // 更新本地同意状态
          this.selectedItems.forEach(item => {
            uni.removeStorageSync(`consent_${item}`)
          })
          
          uni.showToast({
            title: '撤回成功',
            icon: 'success'
          })
          
          // 延迟返回
          setTimeout(() => {
            this.goBack()
          }, 1500)
        } else {
          throw new Error(res.result.message || '撤回失败')
        }
      } catch (error) {
        console.error('撤回同意失败:', error)
        uni.showToast({
          title: error.message || '撤回失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 执行账号注销
    async doDelete() {
      uni.showLoading({ title: '提交注销申请...' })
      
      try {
        const token = uni.getStorageSync('token')
        if (!token) {
          throw new Error('请先登录')
        }
        
        // 调用云函数注销账号
        const res = await uniCloud.callFunction({
          name: 'consent-revoke',
          data: {
            action: 'delete_account',
            token,
            reason: this.selectedReason,
            customReason: this.customReason,
            confirmDelete: true,
            timestamp: Date.now(),
            deviceInfo: {
              platform: uni.getSystemInfoSync().platform,
              model: uni.getSystemInfoSync().model,
              ip: '' // 服务端获取
            }
          }
        })
        
        if (res.result.code === 200) {
          uni.showModal({
            title: '注销申请已提交',
            content: '您的账号将在7天后正式注销。在此期间，您可以通过重新登录来撤销注销申请。',
            showCancel: false,
            success: () => {
              // 清除本地数据
              uni.clearStorageSync()
              
              // 跳转到登录页
              uni.reLaunch({
                url: '/pages/login/login'
              })
            }
          })
        } else {
          throw new Error(res.result.message || '注销失败')
        }
      } catch (error) {
        console.error('账号注销失败:', error)
        uni.showToast({
          title: error.message || '注销失败',
          icon: 'none'
        })
      } finally {
        uni.hideLoading()
      }
    },
    
    // 返回
    goBack() {
      uni.navigateBack()
    }
  }
}
</script>

<style lang="scss">
.revoke-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  
  .safe-area-top {
    padding-top: var(--status-bar-height);
  }
  
  .safe-area-bottom {
    padding-bottom: constant(safe-area-inset-bottom);
    padding-bottom: env(safe-area-inset-bottom);
  }
  
  // 导航栏
  .nav-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 44px;
    padding: 0 16px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    
    .nav-left {
      display: flex;
      align-items: center;
      
      .nav-icon {
        font-size: 28px;
        color: white;
        margin-right: 4px;
      }
      
      .nav-back {
        font-size: 16px;
        color: white;
      }
    }
    
    .nav-title {
      font-size: 17px;
      font-weight: 600;
      color: white;
    }
    
    .nav-right {
      width: 60px;
    }
  }
  
  // 内容滚动区
  .content-scroll {
    height: calc(100vh - var(--status-bar-height) - 44px - constant(safe-area-inset-bottom));
    height: calc(100vh - var(--status-bar-height) - 44px - env(safe-area-inset-bottom));
  }
  
  // 警告提示
  .warning-section {
    margin: 20px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    
    .warning-icon {
      font-size: 32px;
      text-align: center;
      display: block;
      margin-bottom: 12px;
    }
    
    .warning-title {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #FF6B6B;
      text-align: center;
      margin-bottom: 8px;
    }
    
    .warning-text {
      display: block;
      font-size: 14px;
      color: #666;
      line-height: 1.6;
      text-align: center;
    }
  }
  
  // 通用区块
  .section {
    margin: 20px;
    padding: 20px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    
    .section-title {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #333;
      margin-bottom: 4px;
    }
    
    .section-desc {
      display: block;
      font-size: 14px;
      color: #999;
      margin-bottom: 16px;
    }
    
    &.danger-section {
      background: #FFF5F5;
      border: 1px solid #FFE0E0;
    }
  }
  
  // 同意项列表
  .consent-list {
    .consent-item {
      display: block;
      padding: 12px 0;
      border-bottom: 1px solid #F5F5F5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-content {
        display: flex;
        align-items: flex-start;
        
        checkbox {
          margin-right: 12px;
          margin-top: 2px;
        }
        
        .item-info {
          flex: 1;
          
          .item-title {
            display: block;
            font-size: 16px;
            color: #333;
            margin-bottom: 4px;
          }
          
          .item-desc {
            display: block;
            font-size: 13px;
            color: #999;
          }
        }
      }
    }
  }
  
  // 原因列表
  .reason-list {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 16px;
    
    .reason-item {
      padding: 8px 16px;
      background: #F5F5F5;
      border-radius: 20px;
      border: 1px solid transparent;
      transition: all 0.3s;
      
      &.active {
        background: #FFF0F0;
        border-color: #FF6B6B;
        
        .reason-text {
          color: #FF6B6B;
        }
      }
      
      .reason-text {
        font-size: 14px;
        color: #666;
      }
    }
  }
  
  // 原因输入框
  .reason-input {
    width: 100%;
    min-height: 100px;
    padding: 12px;
    background: #F9F9F9;
    border-radius: 8px;
    font-size: 14px;
    box-sizing: border-box;
  }
  
  // 删除警告
  .delete-warning {
    padding: 16px;
    background: #FFF0F0;
    border-radius: 12px;
    margin-bottom: 16px;
    
    .warning-icon {
      display: block;
      font-size: 24px;
      text-align: center;
      margin-bottom: 8px;
    }
    
    .warning-text {
      display: block;
      font-size: 14px;
      color: #FF3B30;
      margin-bottom: 12px;
      line-height: 1.5;
    }
    
    .data-list {
      .data-item {
        display: block;
        font-size: 13px;
        color: #666;
        line-height: 1.8;
        padding-left: 8px;
      }
    }
  }
  
  // 删除确认
  .delete-confirm {
    display: flex;
    align-items: flex-start;
    
    checkbox {
      margin-right: 8px;
      margin-top: 2px;
    }
    
    .confirm-text {
      flex: 1;
      font-size: 14px;
      color: #FF3B30;
      line-height: 1.5;
    }
  }
  
  // 冷静期提醒
  .cooldown-notice {
    margin: 20px;
    padding: 16px;
    background: #FFF9E6;
    border-radius: 12px;
    border: 1px solid #FFE4A1;
    
    .notice-icon {
      display: inline-block;
      font-size: 20px;
      margin-right: 8px;
    }
    
    .notice-text {
      font-size: 14px;
      color: #8B6914;
      line-height: 1.5;
    }
  }
  
  // 操作按钮区
  .action-section {
    padding: 20px;
    
    .action-btn {
      width: 100%;
      height: 50px;
      border-radius: 25px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 12px;
      border: none;
      
      .btn-icon {
        margin-right: 8px;
        font-size: 18px;
      }
      
      &.export-btn {
        background: white;
        color: #667eea;
        
        &:active {
          opacity: 0.8;
        }
      }
      
      &.revoke-btn {
        background: #FF6B6B;
        color: white;
        
        &:disabled {
          background: #FFB3B3;
          opacity: 0.5;
        }
      }
      
      &.delete-btn {
        background: #FF3B30;
        color: white;
        
        &:disabled {
          background: #FF9A94;
          opacity: 0.5;
        }
      }
    }
  }
}
</style>