<template>
  <view class="page">
    <!-- 欢迎卡片 -->
    <view class="card welcome-card">
      <view class="welcome-header">
        <text class="welcome-title">{{ welcomeText }}</text>
        <text class="welcome-subtitle">翎心 · 心理健康助手</text>
      </view>
    </view>

    <!-- 功能入口网格 -->
    <view class="grid">
      <!-- 压力检测 -->
      <view class="card feature-card" @tap="navigateToStress">
        <view class="feature-icon">🧠</view>
        <text class="feature-title">压力检测</text>
        <text class="feature-desc">智能评估心理状态</text>
      </view>

      <!-- 心理干预 -->
      <view class="card feature-card" @tap="navigateToIntervene">
        <view class="feature-icon">💚</view>
        <text class="feature-title">心理干预</text>
        <text class="feature-desc">专业心理疏导</text>
      </view>

      <!-- AI 倾诉 -->
      <view class="card feature-card" @tap="navigateToChat">
        <view class="feature-icon">🤖</view>
        <text class="feature-title">AI 倾诉</text>
        <text class="feature-desc">智能情感陪伴</text>
      </view>

      <!-- 音乐疗愈 -->
      <view class="card feature-card" @tap="navigateToMusic">
        <view class="feature-icon">🎵</view>
        <text class="feature-title">音乐疗愈</text>
        <text class="feature-desc">舒缓心灵音乐</text>
      </view>

      <!-- 社区交流 -->
      <view class="card feature-card" @tap="navigateToCommunity">
        <view class="feature-icon">👥</view>
        <text class="feature-title">社区交流</text>
        <text class="feature-desc">分享交流心得</text>
      </view>

      <!-- 个人中心 -->
      <view class="card feature-card" @tap="navigateToUser">
        <view class="feature-icon">👤</view>
        <text class="feature-title">个人中心</text>
        <text class="feature-desc">管理个人信息</text>
      </view>
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
	computed: {
		welcomeText() {
			const hour = new Date().getHours();
			if (hour < 6) return '夜深了，注意休息';
			if (hour < 12) return '早上好';
			if (hour < 18) return '下午好';
			return '晚上好';
		}
	},
	onLoad() {

	},
	methods: {
		navigateToStress() {
			uni.navigateTo({ url: '/pages/stress/index' });
		},
		navigateToIntervene() {
			uni.navigateTo({ url: '/pages/intervene/intervene' });
		},
		navigateToChat() {
			uni.navigateTo({ url: '/pages/intervene/chat' });
		},
		navigateToMusic() {
			uni.navigateTo({ url: '/pages/music/index' });
		},
		navigateToCommunity() {
			uni.navigateTo({ url: '/pages/community/index' });
		},
		navigateToUser() {
			uni.navigateTo({ url: '/pages/user/home' });
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #FFFFFF;
	box-sizing: border-box;
	padding: 24rpx;
}

.card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 24rpx;
	box-shadow: 0 8rpx 16rpx rgba(10, 132, 255, 0.12);
	margin-bottom: 16rpx;
}

.welcome-card {
	margin-bottom: 32rpx;
}

.welcome-header {
	text-align: center;
}

.welcome-title {
	display: block;
	font-size: 32rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 8rpx;
}

.welcome-subtitle {
	display: block;
	font-size: 24rpx;
	color: #86868B;
}

.grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 16rpx;
}

.feature-card {
	text-align: center;
	padding: 32rpx 24rpx;
	transition: all 0.3s ease;
}

.feature-card:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 8rpx rgba(10, 132, 255, 0.08);
}

.feature-icon {
	font-size: 48rpx;
	margin-bottom: 16rpx;
	display: block;
}

.feature-title {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 8rpx;
}

.feature-desc {
	display: block;
	font-size: 22rpx;
	color: #86868B;
	line-height: 1.4;
}
</style>
