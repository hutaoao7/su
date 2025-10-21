<template>
  <view v-if="show" class="confirm-dialog-mask" @tap="handleMaskClick">
    <view class="confirm-dialog" @tap.stop>
      <text class="dialog-title">{{ title }}</text>
      <text class="dialog-content">{{ content }}</text>
      <view class="dialog-buttons">
        <button v-if="showCancel" class="dialog-button cancel" @tap="handleCancel">
          {{ cancelText }}
        </button>
        <button class="dialog-button confirm" @tap="handleConfirm">
          {{ confirmText }}
        </button>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  props: {
    show: { type: Boolean, default: false },
    title: { type: String, default: '提示' },
    content: { type: String, default: '' },
    confirmText: { type: String, default: '确定' },
    cancelText: { type: String, default: '取消' },
    showCancel: { type: Boolean, default: true },
    maskClosable: { type: Boolean, default: false }
  },
  methods: {
    handleConfirm() {
      this.$emit('confirm');
      this.$emit('update:show', false);
    },
    handleCancel() {
      this.$emit('cancel');
      this.$emit('update:show', false);
    },
    handleMaskClick() {
      if (this.maskClosable) {
        this.$emit('update:show', false);
      }
    }
  }
};
</script>

<style scoped>
.confirm-dialog-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.confirm-dialog {
  width: 560rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 48rpx 40rpx 32rpx;
}

.dialog-title {
  display: block;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  text-align: center;
  margin-bottom: 24rpx;
}

.dialog-content {
  display: block;
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
  text-align: center;
  margin-bottom: 40rpx;
}

.dialog-buttons {
  display: flex;
  gap: 16rpx;
}

.dialog-button {
  flex: 1;
  height: 80rpx;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
}

.dialog-button.cancel {
  background: #F5F5F5;
  color: #666;
}

.dialog-button.confirm {
  background: #007AFF;
  color: #FFFFFF;
}
</style>

