<template>
  <view class="page">
    
    <view class="card"><text class="text-muted">🔐 微信一键登录</text></view>
    <view class="row" style="margin-top:16rpx"><button v-if="hasWxLogin" class="btn-primary" @click="handleWxLogin">微信一键授权</button></view>
    <view v-if="user" class="card" style="margin-top:16rpx"><text :selectable="true">{{ JSON.stringify(user,null,2) }}</text></view>
    <view v-else class="empty">未登录</view>
  </view>
</template>

<script>
export default {
  computed: {
    hasWxLogin() { return typeof this.wxLogin === 'function'; },
    user() {
      // 假设用户信息存储在全局或Vuex
      return this.$store && this.$store.state.user;
    }
  },
  methods: {
    async handleWxLogin() {
      if (typeof this.wxLogin !== 'function') {
        uni.showToast({ title: '登录功能暂未实现', icon: 'none' });
        return;
      }
      try {
        const res = await this.wxLogin();
        uni.showToast({ title: '登录成功', icon: 'success' });
        
        // 登录成功后，返回个人中心
        uni.switchTab({
          url: '/pages/user/home'
        });

      } catch (err) {
        console.error('wxLogin error', err);
        uni.showToast({ title: (err && err.message) || '登录失败', icon: 'none' });
      }
    }
  }
}
</script>

<style scoped></style>