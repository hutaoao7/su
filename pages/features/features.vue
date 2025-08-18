<template>
  <view class="page">
    <!-- 功能模块卡片清单 -->
    <view class="module-list">
      <!-- 压力检测模块 -->
      <view class="card module-card" @tap="navigateToStressIndex">
        <view class="module-header">
          <view class="module-icon">🧠</view>
          <view class="module-info">
            <text class="module-title">压力检测</text>
            <text class="module-desc">智能评估心理压力状态</text>
          </view>
        </view>
        <view class="module-actions">
          <button v-if="hasDetect" class="btn-action" @tap.stop="detect">快速检测</button>
          <button class="btn-secondary" @tap.stop="navigateToStressHistory">查看历史</button>
        </view>
      </view>

      <!-- 心理干预模块 -->
      <view class="card module-card" @tap="navigateToIntervene">
        <view class="module-header">
          <view class="module-icon">💚</view>
          <view class="module-info">
            <text class="module-title">心理干预</text>
            <text class="module-desc">专业心理疏导与建议</text>
          </view>
        </view>
        <view class="module-actions">
          <button v-if="hasStart" class="btn-action" @tap.stop="start">开始干预</button>
          <button class="btn-secondary" @tap.stop="navigateToMeditation">正念冥想</button>
        </view>
      </view>

      <!-- AI 倾诉模块 -->
      <view class="card module-card" @tap="navigateToChat">
        <view class="module-header">
          <view class="module-icon">🤖</view>
          <view class="module-info">
            <text class="module-title">AI 倾诉</text>
            <text class="module-desc">智能情感陪伴与对话</text>
          </view>
        </view>
        <view class="module-actions">
          <button v-if="hasChat" class="btn-action" @tap.stop="chat">开始对话</button>
        </view>
      </view>

      <!-- 音乐疗愈模块 -->
      <view class="card module-card" @tap="navigateToMusic">
        <view class="module-header">
          <view class="module-icon">🎵</view>
          <view class="module-info">
            <text class="module-title">音乐疗愈</text>
            <text class="module-desc">舒缓心灵的治愈音乐</text>
          </view>
        </view>
        <view class="module-actions">
          <button v-if="hasPlay" class="btn-action" @tap.stop="play">播放音乐</button>
          <button class="btn-secondary" @tap.stop="navigateToNature">自然音疗</button>
        </view>
      </view>

      <!-- 社区交流模块 -->
      <view class="card module-card" @tap="navigateToCommunity">
        <view class="module-header">
          <view class="module-icon">👥</view>
          <view class="module-info">
            <text class="module-title">社区交流</text>
            <text class="module-desc">分享心得，互相支持</text>
          </view>
        </view>
        <view class="module-actions">
          <button v-if="hasFetch" class="btn-action" @tap.stop="fetch">刷新动态</button>
        </view>
      </view>

      <!-- CDK 兑换模块 -->
      <view class="card module-card" @tap="navigateToRedeem">
        <view class="module-header">
          <view class="module-icon">🎁</view>
          <view class="module-info">
            <text class="module-title">CDK 兑换</text>
            <text class="module-desc">兑换会员权益</text>
          </view>
        </view>
        <view class="module-actions">
          <button v-if="hasRedeem" class="btn-action" @tap.stop="redeem">立即兑换</button>
        </view>
      </view>

      <!-- 管理员模块 -->
      <view v-if="canAdmin" class="card module-card" @tap="navigateToAdmin">
        <view class="module-header">
          <view class="module-icon">⚙️</view>
          <view class="module-info">
            <text class="module-title">数据管理</text>
            <text class="module-desc">系统数据与指标</text>
          </view>
        </view>
        <view class="module-actions">
          <button class="btn-secondary" @tap.stop="navigateToAdminBatch">批量管理</button>
        </view>
      </view>
    </view>

    <!-- 结果展示区域 -->
    <view v-if="result" class="card result-card">
      <text class="result-title">操作结果</text>
      <text class="result-content" selectable>{{ resultText }}</text>
    </view>

    <view v-if="data" class="card result-card">
      <text class="result-title">数据信息</text>
      <text class="result-content" selectable>{{ dataText }}</text>
    </view>

    <view v-if="list && list.length" class="card result-card">
      <text class="result-title">列表数据（{{ list.length }}）</text>
      <view v-for="(txt, idx) in listText" :key="idx" class="list-item">
        <text selectable>{{ txt }}</text>
      </view>
    </view>
  </view>
</template>

<script>
export default {
	data() {
		return {
			title: 'Hello',
			result: null,
			data: null,
			list: []
		}
	},
	computed: {
		hasFetch() { return typeof this.fetch === 'function'; },
		hasStart() { return typeof this.start === 'function'; },
		hasPlay() { return typeof this.play === 'function'; },
		hasDetect() { return typeof this.detect === 'function'; },
		hasChat() { return typeof this.chat === 'function'; },
		hasRedeem() { return typeof this.redeem === 'function'; },
		canAdmin() {
			// 基于现有数据判断管理员权限，不新增鉴权逻辑
			return this.title === 'Admin' || this.data && this.data.role === 'admin';
		},
		resultText() {
			if (!this.result) return '';
			try {
				return typeof this.result === 'string' ? this.result : JSON.stringify(this.result, null, 2);
			} catch (e) {
				return String(this.result);
			}
		},
		dataText() {
			if (!this.data) return '';
			try {
				return typeof this.data === 'string' ? this.data : JSON.stringify(this.data, null, 2);
			} catch (e) {
				return String(this.data);
			}
		},
		listText() {
			if (!this.list || !Array.isArray(this.list)) return [];
			return this.list.map(item => {
				try {
					return typeof item === 'object' ? JSON.stringify(item) : String(item);
				} catch (e) {
					return String(item);
				}
			});
		}
	},
	onLoad() {

	},
	methods: {
		// 既有方法占位符（如果存在会被调用）
		fetch() { console.log('fetch method called'); },
		start() { console.log('start method called'); },
		play() { console.log('play method called'); },
		detect() { console.log('detect method called'); },
		chat() { console.log('chat method called'); },
		redeem() { console.log('redeem method called'); },

		// 导航方法
		navigateToStressIndex() {
			uni.navigateTo({ url: '/pages/stress/index' });
		},
		navigateToStressHistory() {
			uni.navigateTo({ url: '/pages/stress/history' });
		},
		navigateToIntervene() {
			uni.navigateTo({ url: '/pages/intervene/intervene' });
		},
		navigateToMeditation() {
			uni.navigateTo({ url: '/pages/intervene/meditation' });
		},
		navigateToChat() {
			uni.navigateTo({ url: '/pages/intervene/chat' });
		},
		navigateToMusic() {
			uni.navigateTo({ url: '/pages/music/index' });
		},
		navigateToNature() {
			uni.navigateTo({ url: '/pages/intervene/nature' });
		},
		navigateToCommunity() {
			uni.navigateTo({ url: '/pages/community/index' });
		},
		navigateToRedeem() {
			uni.navigateTo({ url: '/pages/cdk/redeem' });
		},
		navigateToAdmin() {
			uni.navigateTo({ url: '/pages/admin/metrics' });
		},
		navigateToAdminBatch() {
			uni.navigateTo({ url: '/pages/cdk/admin-batch' });
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

.module-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.module-card {
	transition: all 0.3s ease;
}

.module-card:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 8rpx rgba(10, 132, 255, 0.08);
}

.module-header {
	display: flex;
	align-items: center;
	margin-bottom: 16rpx;
}

.module-icon {
	font-size: 48rpx;
	margin-right: 16rpx;
}

.module-info {
	flex: 1;
}

.module-title {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 4rpx;
}

.module-desc {
	display: block;
	font-size: 22rpx;
	color: #86868B;
	line-height: 1.4;
}

.module-actions {
	display: flex;
	gap: 12rpx;
	flex-wrap: wrap;
}

.btn-action {
	border-radius: 14rpx;
	padding: 16rpx 24rpx;
	color: #FFFFFF;
	background: linear-gradient(135deg, #5AC8FA, #0A84FF);
	box-shadow: 0 6rpx 12rpx rgba(10, 132, 255, 0.25);
	font-size: 24rpx;
	font-weight: 500;
	border: none;
}

.btn-secondary {
	border-radius: 14rpx;
	padding: 16rpx 24rpx;
	color: #0A84FF;
	background: rgba(10, 132, 255, 0.1);
	font-size: 24rpx;
	font-weight: 500;
	border: none;
}

.result-card {
	margin-top: 24rpx;
}

.result-title {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 12rpx;
}

.result-content {
	display: block;
	font-size: 24rpx;
	color: #424245;
	line-height: 1.5;
	white-space: pre-wrap;
}

.list-item {
	padding: 8rpx 0;
	border-bottom: 1rpx solid #F2F2F7;
}

.list-item:last-child {
	border-bottom: none;
}

.list-item text {
	font-size: 24rpx;
	color: #424245;
	line-height: 1.5;
}
</style>
