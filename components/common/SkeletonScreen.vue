<template>
  <view class="skeleton-screen">
    <!-- 列表模式 -->
    <view v-if="type === 'list'" class="skeleton-list">
      <view v-for="n in rows" :key="n" class="skeleton-row">
        <view class="skeleton-circle" v-if="avatar"></view>
        <view class="skeleton-content">
          <view class="skeleton-line skeleton-line-title"></view>
          <view class="skeleton-line skeleton-line-text"></view>
        </view>
      </view>
    </view>
    
    <!-- 卡片模式 -->
    <view v-else-if="type === 'card'" class="skeleton-card">
      <view v-for="n in rows" :key="n" class="skeleton-card-item">
        <view class="skeleton-image"></view>
        <view class="skeleton-line skeleton-line-title"></view>
        <view class="skeleton-line skeleton-line-text"></view>
      </view>
    </view>
    
    <!-- 表单模式 -->
    <view v-else-if="type === 'form'" class="skeleton-form">
      <view v-for="n in rows" :key="n" class="skeleton-form-item">
        <view class="skeleton-label"></view>
        <view class="skeleton-input"></view>
      </view>
    </view>
    
    <!-- 详情模式 -->
    <view v-else-if="type === 'detail'" class="skeleton-detail">
      <view class="skeleton-detail-header">
        <view class="skeleton-circle"></view>
        <view class="skeleton-detail-info">
          <view class="skeleton-line skeleton-line-title"></view>
          <view class="skeleton-line skeleton-line-text"></view>
        </view>
      </view>
      <view class="skeleton-detail-content">
        <view v-for="n in rows" :key="n" class="skeleton-line skeleton-line-paragraph"></view>
      </view>
    </view>
    
    <!-- 默认模式（简单列表） -->
    <view v-else class="skeleton-default">
      <view v-for="n in rows" :key="n" class="skeleton-row">
        <view class="skeleton-circle" v-if="avatar"></view>
        <view class="skeleton-line"></view>
      </view>
    </view>
  </view>
</template>

<script>
/**
 * 通用骨架屏组件
 * 
 * 使用方法：
 * <skeleton-screen :loading="loading" :rows="5" :avatar="true" type="list" />
 * 
 * Props:
 * - loading: Boolean - 是否显示骨架屏（可选，由父组件控制v-if）
 * - rows: Number - 行数（默认3）
 * - avatar: Boolean - 是否显示头像（默认false）
 * - type: String - 骨架屏类型：list|card|form|detail|default（默认default）
 */
export default {
  name: 'SkeletonScreen',
  props: {
    loading: {
      type: Boolean,
      default: true
    },
    rows: {
      type: Number,
      default: 3
    },
    avatar: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'default',
      validator: (value) => {
        return ['default', 'list', 'card', 'form', 'detail'].includes(value)
      }
    }
  }
}
</script>

<style scoped>
/* ===================================
   基础样式
=================================== */
.skeleton-screen {
  width: 100%;
  padding: 24rpx;
}

/* ===================================
   通用元素
=================================== */
.skeleton-circle {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  flex-shrink: 0;
}

.skeleton-line {
  height: 30rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6rpx;
}

.skeleton-line-title {
  height: 36rpx;
  width: 60%;
  margin-bottom: 16rpx;
}

.skeleton-line-text {
  height: 28rpx;
  width: 80%;
}

.skeleton-line-paragraph {
  height: 28rpx;
  width: 100%;
  margin-bottom: 16rpx;
}

.skeleton-line-paragraph:last-child {
  width: 60%;
}

/* ===================================
   默认模式
=================================== */
.skeleton-default .skeleton-row {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
}

.skeleton-default .skeleton-line {
  flex: 1;
  margin-left: 20rpx;
}

/* ===================================
   列表模式
=================================== */
.skeleton-list .skeleton-row {
  display: flex;
  align-items: center;
  padding: 24rpx;
  margin-bottom: 16rpx;
  background: #FFFFFF;
  border-radius: 16rpx;
}

.skeleton-list .skeleton-content {
  flex: 1;
  margin-left: 20rpx;
}

/* ===================================
   卡片模式
=================================== */
.skeleton-card {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
}

.skeleton-card-item {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
}

.skeleton-image {
  width: 100%;
  height: 300rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12rpx;
  margin-bottom: 16rpx;
}

/* ===================================
   表单模式
=================================== */
.skeleton-form {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 24rpx;
}

.skeleton-form-item {
  margin-bottom: 32rpx;
}

.skeleton-form-item:last-child {
  margin-bottom: 0;
}

.skeleton-label {
  width: 120rpx;
  height: 28rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 6rpx;
  margin-bottom: 16rpx;
}

.skeleton-input {
  width: 100%;
  height: 80rpx;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 12rpx;
}

/* ===================================
   详情模式
=================================== */
.skeleton-detail {
  background: #FFFFFF;
  border-radius: 16rpx;
  padding: 32rpx;
}

.skeleton-detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
  padding-bottom: 32rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.skeleton-detail-info {
  flex: 1;
  margin-left: 20rpx;
}

.skeleton-detail-content {
  padding-top: 16rpx;
}

/* ===================================
   动画效果
=================================== */
@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

/* ===================================
   暗黑模式支持（可选）
=================================== */
@media (prefers-color-scheme: dark) {
  .skeleton-circle,
  .skeleton-line,
  .skeleton-image,
  .skeleton-label,
  .skeleton-input {
    background: linear-gradient(90deg, #2a2a2a 25%, #1f1f1f 50%, #2a2a2a 75%);
    background-size: 200% 100%;
  }
  
  .skeleton-list .skeleton-row,
  .skeleton-card-item,
  .skeleton-form,
  .skeleton-detail {
    background: #1a1a1a;
  }
  
  .skeleton-detail-header {
    border-bottom-color: #2a2a2a;
  }
}

/* ===================================
   响应式优化
=================================== */
/* 小屏幕（手机） */
@media screen and (max-width: 750rpx) {
  .skeleton-card {
    grid-template-columns: 1fr;
  }
}

/* 大屏幕（平板/桌面） */
@media screen and (min-width: 1200rpx) {
  .skeleton-card {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
