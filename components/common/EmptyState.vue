<template>
  <view class="empty-state">
    <image v-if="image" :src="image" class="empty-image" mode="aspectFit" />
    <text v-else class="empty-icon">{{ icon }}</text>
    <text class="empty-title">{{ title }}</text>
    <text v-if="description" class="empty-desc">{{ description }}</text>
    <button v-if="buttonText" class="empty-button" @tap="handleAction">
      {{ buttonText }}
    </button>
  </view>
</template>

<script>
export default {
  name: 'EmptyState',
  props: {
    icon: { type: String, default: '📭' },
    image: { type: String, default: '' },
    title: { type: String, default: '暂无数据' },
    description: { type: String, default: '' },
    buttonText: { type: String, default: '' }
  },
  methods: {
    handleAction() {
      this.$emit('action');
    }
  }
};
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 60rpx;
}

.empty-icon {
  font-size: 120rpx;
  margin-bottom: 32rpx;
}

.empty-image {
  width: 240rpx;
  height: 240rpx;
  margin-bottom: 32rpx;
}

.empty-title {
  font-size: 32rpx;
  color: #666;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.empty-desc {
  font-size: 26rpx;
  color: #999;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32rpx;
}

.empty-button {
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 8rpx;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}

</style>

