  <template>
  <view class="page">
    <!-- 用户信息卡片 -->
    <view class="card user-card">
      <view class="user-header">
        <view class="avatar-container">
          <image v-if="user && user.avatarUrl" :src="user.avatarUrl" class="avatar" mode="aspectFill" />
          <view v-else class="avatar-placeholder">
            <text class="avatar-text">👤</text>
          </view>
        </view>
        <view class="user-info">
          <text v-if="isLoggedIn" class="user-name">{{ userName }}</text>
          <text v-else class="user-name">未登录</text>
          <text class="user-status">{{ userStatusText }}</text>
        </view>
        <view class="user-actions">
          <button v-if="!isLoggedIn" class="btn-primary" @tap="handleLogin">登录/注册</button>
          <button v-else class="btn-secondary" @tap="handleEditProfile">编辑资料</button>
        </view>
      </view>
    </view>

    <!-- 未登录状态 -->
    <view v-if="!isLoggedIn" class="card login-prompt">
      <view class="login-content">
        <text class="login-title">欢迎使用翎心</text>
        <text class="login-desc">登录后可享受完整的心理健康服务</text>
        <button class="btn-primary login-btn" @tap="handleLogin">立即登录</button>
      </view>
    </view>

    <!-- 已登录状态 - 功能入口 -->
    <view v-else class="features-section">
      <!-- 账户管理 -->
      <view class="card feature-group">
        <text class="group-title">账户管理</text>
        <view class="feature-list">
          <view class="feature-item" @tap="navigateToProfile">
            <view class="feature-icon">👤</view>
            <text class="feature-name">个人资料</text>
            <text class="feature-arrow">›</text>
          </view>
          <view v-if="hasSettings" class="feature-item" @tap="navigateToSettings">
            <view class="feature-icon">⚙️</view>
            <text class="feature-name">设置</text>
            <text class="feature-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 数据统计 -->
      <view class="card feature-group">
        <text class="group-title">我的数据</text>
        <view class="feature-list">
          <view class="feature-item" @tap="navigateToStressHistory">
            <view class="feature-icon">📊</view>
            <text class="feature-name">压力检测记录</text>
            <text class="feature-arrow">›</text>
          </view>
          <view class="feature-item" @tap="navigateToCommunityPosts">
            <view class="feature-icon">💬</view>
            <text class="feature-name">我的动态</text>
            <text class="feature-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 会员服务 -->
      <view class="card feature-group">
        <text class="group-title">会员服务</text>
        <view class="feature-list">
          <view class="feature-item" @tap="navigateToRedeem">
            <view class="feature-icon">🎁</view>
            <text class="feature-name">CDK 兑换</text>
            <text class="feature-arrow">›</text>
          </view>
          <view v-if="canAdmin" class="feature-item" @tap="navigateToAdmin">
            <view class="feature-icon">🛠️</view>
            <text class="feature-name">管理后台</text>
            <text class="feature-arrow">›</text>
          </view>
        </view>
      </view>

      <!-- 其他功能 -->
      <view class="card feature-group">
        <text class="group-title">其他</text>
        <view class="feature-list">
          <view class="feature-item" @tap="handleAbout">
            <view class="feature-icon">ℹ️</view>
            <text class="feature-name">关于翎心</text>
            <text class="feature-arrow">›</text>
          </view>
          <view v-if="hasLogout" class="feature-item logout-item" @tap="handleLogout">
            <view class="feature-icon">🚪</view>
            <text class="feature-name logout-text">退出登录</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 操作结果展示 -->
    <view v-if="result" class="card result-card">
      <text class="result-title">操作结果</text>
      <text class="result-content" selectable>{{ resultText }}</text>
    </view>
  </view>
</template>

<script>
export default {
	data() {
		return {
			title: 'Hello',
			userInfo: null,
			result: null,
			user: null
		}
	},
	computed: {
		isLoggedIn() {
			// 基于token和用户信息判断登录状态
			return this.user && this.user.uid;
		},
		userName() {
			if (!this.user) return '游客';
			return this.user.nickname || '用户';
		},
		userStatusText() {
			if (!this.isLoggedIn) return '点击登录获取完整服务';
			return this.user && this.user.role === 'vip' ? 'VIP 会员' : '普通用户';
		},
		canAdmin() {
			// 基于现有数据判断管理员权限
			return this.user && (this.user.role === 'admin' || this.user.isAdmin);
		},
		hasSettings() {
			// 检查是否有设置页面
			return true; // 根据 pages.json 存在 settings 页面
		},
		hasLogout() {
			return this.isLoggedIn;
		},
		resultText() {
			if (!this.result) return '';
			try {
				return typeof this.result === 'string' ? this.result : JSON.stringify(this.result, null, 2);
			} catch (e) {
				return String(this.result);
			}
		}
	},
	onLoad() {
		this.checkLoginStatus();
	},
	onShow() {
		this.checkLoginStatus();
	},
	methods: {
		// 检查登录状态
		checkLoginStatus() {
			this.user = uni.getStorageSync('user') || null;
		},

		// 事件处理方法
		goLogin() {
			uni.navigateTo({ url: '/pages/auth/wechat-login' });
		},
		handleLogin() {
			this.goLogin();
		},
		handleLogout() {
			uni.removeStorageSync('token');
			uni.removeStorageSync('user');
			uni.showToast({
				title: '已退出',
				icon: 'success'
			});
			this.user = null;
		},
		logout() {
			this.handleLogout();
		},
		handleEditProfile() {
			uni.navigateTo({ url: '/pages/user/profile' });
		},
		handleAbout() {
			uni.showModal({
				title: '关于翎心',
				content: '翎心是一款专业的心理健康助手应用，致力于为用户提供全方位的心理健康服务。',
				showCancel: false
			});
		},

		// 导航方法
		navigateToProfile() {
			uni.navigateTo({ url: '/pages/user/profile' });
		},
		navigateToSettings() {
			uni.switchTab({ url: '/pages/settings/settings' });
		},
		navigateToStressHistory() {
			uni.navigateTo({ url: '/pages/stress/history' });
		},
		navigateToCommunityPosts() {
			uni.navigateTo({ url: '/pages/community/index' });
		},
		navigateToRedeem() {
			uni.navigateTo({ url: '/pages/cdk/redeem' });
		},
		navigateToAdmin() {
			uni.navigateTo({ url: '/pages/admin/metrics' });
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

.user-card {
	margin-bottom: 24rpx;
}

.user-header {
	display: flex;
	align-items: center;
}

.avatar-container {
	margin-right: 16rpx;
}

.avatar {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
}

.avatar-placeholder {
	width: 80rpx;
	height: 80rpx;
	border-radius: 40rpx;
	background: #F2F2F7;
	display: flex;
	align-items: center;
	justify-content: center;
}

.avatar-text {
	font-size: 32rpx;
	color: #86868B;
}

.user-info {
	flex: 1;
}

.user-name {
	display: block;
	font-size: 28rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 4rpx;
}

.user-status {
	display: block;
	font-size: 22rpx;
	color: #86868B;
}

.user-actions {
	margin-left: 16rpx;
}

.btn-primary {
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

.login-prompt {
	text-align: center;
	padding: 48rpx 24rpx;
}

.login-content {
	display: flex;
	flex-direction: column;
	align-items: center;
}

.login-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 12rpx;
}

.login-desc {
	font-size: 24rpx;
	color: #86868B;
	margin-bottom: 32rpx;
	line-height: 1.4;
}

.login-btn {
	padding: 20rpx 48rpx;
}

.features-section {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.feature-group {
	padding: 20rpx 24rpx;
}

.group-title {
	display: block;
	font-size: 26rpx;
	font-weight: 600;
	color: #1D1D1F;
	margin-bottom: 16rpx;
}

.feature-list {
	display: flex;
	flex-direction: column;
}

.feature-item {
	display: flex;
	align-items: center;
	padding: 16rpx 0;
	border-bottom: 1rpx solid #F2F2F7;
	transition: all 0.3s ease;
}

.feature-item:last-child {
	border-bottom: none;
}

.feature-item:active {
	background: rgba(10, 132, 255, 0.05);
	border-radius: 8rpx;
}

.feature-icon {
	font-size: 32rpx;
	margin-right: 16rpx;
	width: 40rpx;
	text-align: center;
}

.feature-name {
	flex: 1;
	font-size: 26rpx;
	color: #1D1D1F;
}

.feature-arrow {
	font-size: 32rpx;
	color: #C7C7CC;
	font-weight: 300;
}

.logout-item {
	border-bottom: none;
	margin-top: 8rpx;
}

.logout-text {
	color: #FF3B30;
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
</style>
