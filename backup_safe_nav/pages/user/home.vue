<template>
  <view class="page">
    <view class="card" style="margin-bottom:16rpx">
      <text class="text-muted">✅ 个人中心渲染成功（Safe UI）</text>
    </view>
    <view class="row">
      <button class="btn-primary" @click="go('/pages/user/profile')">查看资料</button>
      <button class="btn-primary" @click="go('/pages/auth/login')">重新登录</button>
    </view>
  </view>
</template>

<script>
import { go } from '@/common/nav.js'
export default {
  // 注意：原始脚本因备份问题不可用，此处为最小化实现。
  // 请在UI恢复正常后，从您的本地备份中恢复此文件的原始 <script> 内容。
  methods: {
    go
  }
}
</script>

<style scoped>
/* 可在此处添加页面特定样式 */
</style>