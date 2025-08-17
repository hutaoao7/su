<template>
  <view class="page">
    <view class="card"><text class="text-muted">✅ 个人中心</text></view>
    <view class="row" style="margin-top:16rpx">
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/auth/login'})">登录/注册</button>
      <button class="btn-primary" @click="uni.navigateTo({url:'/pages/user/profile'})">编辑资料</button>
    </view>
  </view>
</template>

<script>
export default {
	data() {
		return {
			title: 'Hello'
		}
	},
	onLoad() {

	},
	methods: {

	},
	computed: {
	  hasFetch ()  { return typeof this.fetch  === 'function' },
	  hasStart ()  { return typeof this.start  === 'function' },
	  hasPlay  ()  { return typeof this.play   === 'function' },
	  hasDetect()  { return typeof this.detect === 'function' },
	  hasChat  ()  { return typeof this.chat   === 'function' },
	  hasRedeem()  { return typeof this.redeem === 'function' }
	}
}
</script>

<style scoped></style>