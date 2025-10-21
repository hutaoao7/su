<template>
  <view class="features-page">
    <!-- 心理干预工具区域 -->
    <view class="intervention-section">
      <view class="section-title">心理干预工具</view>
      <view class="intervention-cards">
		<view 
			v-for="(card, index) in interventionCards" 
			:key="index"
			class="intervention-card"
			:class="{ 'card-pressed': pressedIntCard === index }"
			:aria-label="card.title + '，' + card.subtitle"
			role="button"
			@touchstart="handleIntTouchStart(index)"
			@touchend="handleTouchEnd"
			@touchcancel="handleTouchEnd"
			@tap="handleIntCardTap(index)"
		>
          <view class="card-content">
            <view class="card-icon" :style="{ background: card.iconBg }">
              <u-icon :name="card.icon" size="32" :color="card.iconColor"></u-icon>
            </view>
            <view class="card-text">
              <text class="card-title">{{ card.title }}</text>
              <text class="card-subtitle">{{ card.subtitle }}</text>
            </view>
            <view class="card-arrow">
              <u-icon name="arrow-right" size="20" color="#C7C7CC"></u-icon>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 评估入口卡片区域 -->
    <view class="assessment-section">
      <view class="section-title">心理健康评估</view>
      <view class="assessment-cards">
		<view 
			v-for="(card, index) in assessmentCards" 
			:key="index"
			class="assessment-card"
			:class="{ 'card-pressed': pressedCard === index }"
			:aria-label="card.title + '，' + card.subtitle"
			role="button"
			@touchstart="handleTouchStart(index)"
			@touchend="handleTouchEnd"
			@touchcancel="handleTouchEnd"
			@tap="handleAssessCardTap(index)"
		>
          <view class="card-content">
            <view class="card-icon">
              <u-icon :name="card.icon" size="32" :color="card.iconColor"></u-icon>
            </view>
            <view class="card-text">
              <text class="card-title">{{ card.title }}</text>
              <text class="card-subtitle">{{ card.subtitle }}</text>
            </view>
            <view class="card-arrow">
              <u-icon name="arrow-right" size="20" color="#C7C7CC"></u-icon>
            </view>
          </view>
        </view>
      </view>
    </view>
    
    
  </view>
</template>

<script>
import tabBarManager from '@/utils/tabbar-manager.js';

export default {
	data() {
		return {
			pressedCard: null,
			pressedIntCard: null,
				interventionCards: [
					{
						title: 'AI倾诉',
						subtitle: '与AI进行心理倾诉对话',
						icon: 'chat',
						iconColor: '#34C759',
						iconBg: 'rgba(52, 199, 89, 0.1)',
						route: '/pages-sub/intervene/chat'
					},
					{
						title: '正念冥想',
						subtitle: '通过音乐和引导放松身心',
						icon: 'play-circle',
						iconColor: '#AF52DE',
						iconBg: 'rgba(175, 82, 222, 0.1)',
						route: '/pages-sub/intervene/meditation'
					}
				],
				assessmentCards: [
					{
						title: '学业压力',
						subtitle: '评估学习相关的压力水平',
						icon: 'file-text',
						iconColor: '#0A84FF',
						route: '/pages-sub/assess/academic/index'
					},
					{
						title: '社交焦虑',
						subtitle: '评佰人际交往中的焦虑程度',
						icon: 'account',
						iconColor: '#0A84FF',
						route: '/pages-sub/assess/social/index'
					},
					{
						title: '睡眠质量',
						subtitle: '评估睡眠状况与相关问题',
						icon: 'moon',
						iconColor: '#0A84FF',
						route: '/pages-sub/assess/sleep/index'
					},
					{
						title: '一般压力',
						subtitle: '评估日常感知的总体压力',
						icon: 'heart',
						iconColor: '#0A84FF',
						route: '/pages-sub/assess/stress/index'
					}
				]
		}
	},
	onLoad() {
		// 自检日志
		console.log('[FEAT] features compact-mode applied; cards-only ready');
	},
	
	onShow() {
		// 通知导航栏更新状态
		tabBarManager.setCurrentIndexByPath('/pages/features/features');
	},
	methods: {
		// 处理卡片触摸开始
		handleTouchStart(index) {
			this.pressedCard = index;
		},
		
		// 处理干预卡片触摸开始
		handleIntTouchStart(index) {
			this.pressedIntCard = index;
		},

		// 处理卡片触摸结束
		handleTouchEnd() {
			this.pressedCard = null;
			this.pressedIntCard = null;
		},

		// 处理干预卡片点击
		handleIntCardTap(index) {
			const card = this.interventionCards[index];
			console.log(`[INTERVENE] nav ${card.title}`)
			uni.navigateTo({
				url: card.route
			});
		},
		
		// 处理评估卡片点击
		handleAssessCardTap(index) {
			const card = this.assessmentCards[index];
			console.log(`[ASSESS] nav ${card.title}`)
			uni.navigateTo({
				url: card.route
			});
		}
	}
}
</script>

<style scoped>
.features-page {
	min-height: 100vh;
	background: #FFFFFF;
	/* 添加顶部安全区域 */
	padding-top: constant(safe-area-inset-top);
	padding-top: env(safe-area-inset-top);
	/* TabBar底部安全区域 */
	padding-bottom: calc(50px + constant(safe-area-inset-bottom));
	padding-bottom: calc(50px + env(safe-area-inset-bottom));
}

/* 心理干预工具区域 */
.intervention-section {
	background: #FFFFFF;
	padding: 32rpx 24rpx 16rpx;
}

.intervention-cards {
	display: flex;
	flex-direction: row;
	gap: 16rpx;
}

.intervention-card {
	flex: 1;
	background: #F9FAFB;
	border-radius: 24rpx;
	padding: 24rpx;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.08);
	transition: all 0.2s ease;
	min-height: 160rpx;
	position: relative;
	overflow: hidden;
}

.intervention-card:active,
.intervention-card.card-pressed {
	transform: scale(0.98);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.intervention-card .card-content {
	display: flex;
	flex-direction: column;
	align-items: center;
	text-align: center;
	gap: 16rpx;
}

.intervention-card .card-icon {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto;
}

.intervention-card .card-text {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
	align-items: center;
}

.intervention-card .card-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1D1D1F;
	line-height: 1.4;
}

.intervention-card .card-subtitle {
	font-size: 24rpx;
	color: #86868B;
	line-height: 1.4;
}

.intervention-card .card-arrow {
	display: none;
}

/* 评估卡片区域 */
.assessment-section {
	background: #FFFFFF;
	padding: 16rpx 24rpx 32rpx;
}

.section-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 24rpx;
	line-height: 1.4;
}

.assessment-cards {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.assessment-card {
	background: #F9FAFB;
	border-radius: 24rpx;
	padding: 32rpx;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.08);
	transition: all 0.2s ease;
	min-height: 88rpx;
	position: relative;
	overflow: hidden;
}

.assessment-card:active,
.card-pressed {
	transform: scale(0.98);
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06);
}

.card-content {
	display: flex;
	align-items: center;
	width: 100%;
}

.card-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 16rpx;
	background: rgba(10, 132, 255, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
	flex-shrink: 0;
}

.card-text {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 8rpx;
}

.card-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #1D1D1F;
	line-height: 1.4;
}

.card-subtitle {
	font-size: 26rpx;
	color: #86868B;
	line-height: 1.4;
}

.card-arrow {
	width: 40rpx;
	height: 40rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

/* 响应式适配 */
@media screen and (max-width: 320px) {
	.assessment-card {
		padding: 24rpx;
	}
	
	.card-title {
		font-size: 32rpx;
	}
	
	.card-subtitle {
		font-size: 24rpx;
	}
}

@media screen and (min-width: 428px) {
	.assessment-cards {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16rpx;
	}
}


/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}

</style>