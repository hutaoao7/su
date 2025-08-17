<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">🎵 音乐播放器 · 新版 UI</text></view>
    <view v-if="src" class="card" style="margin-top:16rpx"><audio :src="src" controls autoplay style="width:100%" /></view>
    <view v-else class="empty">暂无音频资源</view>
  </view>
</template>

<script>
export default {
  }
</script>

<style scoped></style>