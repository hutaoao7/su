<template>
  <view class="page">
    <!-- 欢迎区 -->
    <view class="card welcome-card">
      <view class="welcome-header">
        <text class="welcome-title">{{ welcomeText }}</text>
        <text class="welcome-subtitle">翎心 · 心理健康助手</text>
      </view>
      <view class="user-status">
        <text v-if="isLoggedIn" class="user-greeting">{{ userGreeting }}</text>
        <text v-else class="login-prompt" @tap="goToAuth">点击登录获取完整服务</text>
      </view>
    </view>

    <!-- 三大入口 -->
    <view class="main-features">
      <view class="card feature-card main-card" @tap="navigateToMusic">
        <view class="feature-icon">🎵</view>
        <text class="feature-title">冥想音乐</text>
        <text class="feature-desc">舒缓心灵的音乐疗愈</text>
      </view>

      <view class="card feature-card main-card" @tap="navigateToScreening">
        <view class="feature-icon">🧠</view>
        <text class="feature-title">轻量筛查</text>
        <text class="feature-desc">快速评估心理状态</text>
      </view>

      <view class="card feature-card main-card" @tap="navigateToAI">
        <view class="feature-icon">🤖</view>
        <text class="feature-title">AI 干预</text>
        <text class="feature-desc">智能心理疏导陪伴</text>
      </view>
    </view>

    <!-- 今日推荐 -->
    <view class="card recommend-card">
      <view class="recommend-header">
        <text class="recommend-title">今日推荐</text>
        <text class="recommend-more" @tap="navigateToMusic">查看更多</text>
      </view>
      <view class="recommend-list">
        <view 
          v-for="item in recommendList" 
          :key="item._id"
          class="recommend-item"
          @tap="playMusic(item)"
        >
          <image :src="item.cover" class="recommend-cover" mode="aspectFill" />
          <view class="recommend-info">
            <text class="recommend-name">{{ item.title }}</text>
            <text class="recommend-duration">{{ formatDuration(item.duration) }}</text>
          </view>
          <view v-if="item.locked" class="lock-icon">🔒</view>
        </view>
      </view>
    </view>
    
    
  </view>
</template>

<script>
import { musicAPI } from '@/utils/request.js';
import { isAuthed, getUid, getUserInfo } from '@/utils/auth.js';
import tabBarManager from '@/utils/tabbar-manager.js';

export default {
	data() {
		return {
			recommendList: []
		}
	},
	computed: {
		welcomeText() {
			const hour = new Date().getHours();
			if (hour < 6) return '夜深了，注意休息';
			if (hour < 12) return '早上好';
			if (hour < 18) return '下午好';
			return '晚上好';
		},
		isLoggedIn() {
			return isAuthed();
		},
		userGreeting() {
			if (!this.isLoggedIn) return '';
			const userInfo = getUserInfo();
			const name = userInfo?.nickname || '用户';
			return `欢迎回来，${name}`;
		}
	},
	onLoad() {
		this.loadRecommendMusic();
	},
	onShow() {
		// 刷新用户状态
		this.$forceUpdate();
		// 通知导航栏更新状态
		tabBarManager.setCurrentIndexByPath('/pages/home/home');
	},
	methods: {
		// 加载今日推荐音乐（带错误处理）
		async loadRecommendMusic() {
			try {
				console.log('[HOME] 加载推荐音乐');
				
				// 获取第一个分类
				const categoriesRes = await musicAPI.getCategories();
				if (categoriesRes.code === 0 && categoriesRes.data.length > 0) {
					const firstCategory = categoriesRes.data[0];
					
					// 获取该分类的前4首音乐
					const listRes = await musicAPI.getList(firstCategory, 1, 4);
					if (listRes.code === 0) {
						this.recommendList = listRes.data.list || [];
						console.log('[HOME] 推荐音乐加载成功:', this.recommendList.length);
					} else {
						// API返回错误
						console.warn('[HOME] 推荐音乐API返回错误:', listRes.msg);
						this.setFallbackRecommendList();
					}
				} else {
					// 分类加载失败
					console.warn('[HOME] 音乐分类加载失败');
					this.setFallbackRecommendList();
				}
			} catch (error) {
				console.error('[HOME] 加载推荐音乐失败:', error);
				// 使用降级数据
				this.setFallbackRecommendList();
			}
		},
		
		// 设置降级推荐列表
		setFallbackRecommendList() {
			this.recommendList = [
				{
					_id: 'fallback_1',
					title: '深度呼吸练习',
					cover: '/static/images/meditation-cover.png',
					duration: 600,
					locked: false
				},
				{
					_id: 'fallback_2',
					title: '森林漫步',
					cover: '/static/images/nature-cover.png',
					duration: 900,
					locked: false
				}
			];
			console.log('[HOME] 使用降级推荐列表');
		},

		// 格式化时长
		formatDuration(seconds) {
			const mins = Math.floor(seconds / 60);
			const secs = seconds % 60;
			return `${mins}:${secs.toString().padStart(2, '0')}`;
		},

		// 导航方法 - 跳转到features页面的对应模块
		navigateToMusic() {
			uni.switchTab({ 
				url: '/pages/features/features?tab=music' 
			});
		},
		
		navigateToScreening() {
			uni.switchTab({ 
				url: '/pages/features/features?tab=screening' 
			});
		},
		
		navigateToAI() {
			uni.switchTab({ 
				url: '/pages/features/features?tab=ai' 
			});
		},

		// 播放音乐
		playMusic(item) {
			uni.switchTab({ 
				url: `/pages/features/features?tab=music&id=${item._id}` 
			});
		},

		// 跳转到登录页面
		goToAuth() {
			uni.navigateTo({
				url: '/pages/login/login'
			});
		}
	}
}
</script>

<style scoped>
.page {
	min-height: 100vh;
	background: #F8F9FA;
	/* 添加顶部安全区域 */
	padding-top: calc(24rpx + constant(safe-area-inset-top));
	padding-top: calc(24rpx + env(safe-area-inset-top));
	/* TabBar底部安全区域 */
	padding-bottom: calc(50px + constant(safe-area-inset-bottom) + 24rpx);
	padding-bottom: calc(50px + env(safe-area-inset-bottom) + 24rpx);
	box-sizing: border-box;
	padding-left: 24rpx;
	padding-right: 24rpx;
}

.card {
	background: #FFFFFF;
	border-radius: 16rpx;
	padding: 24rpx;
	box-shadow: 0 8rpx 16rpx rgba(10, 132, 255, 0.12);
	margin-bottom: 16rpx;
}

/* 欢迎区 */
.welcome-card {
	margin-bottom: 32rpx;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #FFFFFF;
}

.welcome-header {
	text-align: center;
	margin-bottom: 16rpx;
}

.welcome-title {
	display: block;
	font-size: 32rpx;
	font-weight: 600;
	margin-bottom: 8rpx;
}

.welcome-subtitle {
	display: block;
	font-size: 24rpx;
	opacity: 0.8;
}

.user-status {
	text-align: center;
}

.user-greeting {
	font-size: 26rpx;
	opacity: 0.9;
}

.login-prompt {
	font-size: 24rpx;
	opacity: 0.8;
	text-decoration: underline;
}

/* 三大入口 */
.main-features {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
	margin-bottom: 32rpx;
}

.main-card {
	padding: 32rpx 24rpx;
	text-align: center;
	transition: all 0.3s ease;
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
	color: #FFFFFF;
}

.main-card:nth-child(2) {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.main-card:nth-child(3) {
	background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.main-card:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 8rpx rgba(0, 0, 0, 0.1);
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
	margin-bottom: 8rpx;
}

.feature-desc {
	display: block;
	font-size: 22rpx;
	opacity: 0.9;
	line-height: 1.4;
}

/* 今日推荐 */
.recommend-card {
	padding: 24rpx;
}

.recommend-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 20rpx;
}

.recommend-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #1D1D1F;
}

.recommend-more {
	font-size: 24rpx;
	color: #007AFF;
}

.recommend-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.recommend-item {
	display: flex;
	align-items: center;
	padding: 16rpx;
	background: #F8F9FA;
	border-radius: 12rpx;
	transition: all 0.3s ease;
}

.recommend-item:active {
	background: #E9ECEF;
	transform: scale(0.98);
}

.recommend-cover {
	width: 80rpx;
	height: 80rpx;
	border-radius: 8rpx;
	margin-right: 16rpx;
}

.recommend-info {
	flex: 1;
}

.recommend-name {
	display: block;
	font-size: 26rpx;
	font-weight: 500;
	color: #1D1D1F;
	margin-bottom: 4rpx;
}

.recommend-duration {
	display: block;
	font-size: 22rpx;
	color: #86868B;
}

.lock-icon {
	font-size: 24rpx;
	color: #FF9500;
}
</style>
