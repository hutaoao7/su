<template>
	<view class="error-dashboard">
		<!-- 导航栏 -->
		<view class="navbar" :style="{ paddingTop: safeAreaTop + 'px' }">
			<view class="navbar-content">
				<text class="navbar-title">错误监控看板</text>
				<view class="navbar-actions">
					<view class="refresh-btn" @click="refreshData">
						<text class="icon">🔄</text>
					</view>
				</view>
			</view>
		</view>

		<!-- 内容区域 -->
		<scroll-view 
			class="content" 
			scroll-y 
			:style="{ paddingTop: navbarHeight + 'px', paddingBottom: safeAreaBottom + 'px' }"
		>
			<!-- 加载状态 -->
			<view v-if="loading" class="loading-state">
				<text class="loading-text">加载中...</text>
			</view>

			<!-- 数据展示 -->
			<view v-else class="dashboard-content">
				<!-- 概览卡片 -->
				<view class="overview-cards">
					<view class="card" v-for="(item, index) in overviewData" :key="index">
						<view class="card-value" :class="'level-' + item.level">{{ item.value }}</view>
						<view class="card-label">{{ item.label }}</view>
						<view class="card-change" :class="item.change >= 0 ? 'increase' : 'decrease'">
							<text>{{ item.change >= 0 ? '↑' : '↓' }} {{ Math.abs(item.change) }}%</text>
						</view>
					</view>
				</view>

				<!-- 错误趋势图 -->
				<view class="chart-section">
					<view class="section-header">
						<text class="section-title">24小时错误趋势</text>
						<text class="section-subtitle">每小时错误数量</text>
					</view>
					<view class="chart-container">
						<canvas 
							canvas-id="trendCanvas" 
							id="trendCanvas"
							class="chart-canvas"
							@touchstart="handleTrendTouchStart"
							@touchmove="handleTrendTouchMove"
							@touchend="handleTrendTouchEnd"
						></canvas>
					</view>
				</view>

				<!-- 错误类型分布 -->
				<view class="chart-section">
					<view class="section-header">
						<text class="section-title">错误类型分布</text>
						<text class="section-subtitle">按错误类型统计</text>
					</view>
					<view class="chart-container">
						<canvas 
							canvas-id="typeCanvas" 
							id="typeCanvas"
							class="chart-canvas chart-canvas-pie"
						></canvas>
					</view>
					<view class="legend">
						<view class="legend-item" v-for="(item, index) in typeDistribution" :key="index">
							<view class="legend-color" :style="{ backgroundColor: item.color }"></view>
							<text class="legend-label">{{ item.label }}（{{ item.count }}）</text>
						</view>
					</view>
				</view>

				<!-- 高频错误排行 -->
				<view class="list-section">
					<view class="section-header">
						<text class="section-title">高频错误Top 10</text>
						<text class="section-subtitle">按发生次数排序</text>
					</view>
					<view class="error-list">
						<view class="error-item" v-for="(error, index) in topErrors" :key="index">
							<view class="error-rank" :class="'rank-' + (index + 1)">{{ index + 1 }}</view>
							<view class="error-info">
								<view class="error-message">{{ error.message }}</view>
								<view class="error-meta">
									<text class="error-type">{{ error.type }}</text>
									<text class="error-count">{{ error.count }}次</text>
									<text class="error-users">{{ error.affected_users }}人</text>
								</view>
							</view>
							<view class="error-level" :class="'level-' + error.level">{{ levelLabels[error.level] }}</view>
						</view>
					</view>
				</view>

				<!-- 页面错误统计 -->
				<view class="list-section">
					<view class="section-header">
						<text class="section-title">页面错误统计</text>
						<text class="section-subtitle">按页面统计错误数</text>
					</view>
					<view class="page-list">
						<view class="page-item" v-for="(page, index) in pageErrors" :key="index">
							<view class="page-info">
								<text class="page-path">{{ page.page }}</text>
								<text class="page-count">{{ page.count }}个错误</text>
							</view>
							<view class="page-bar">
								<view class="page-bar-fill" :style="{ width: (page.count / maxPageErrors * 100) + '%' }"></view>
							</view>
						</view>
					</view>
				</view>

				<!-- 最后更新时间 -->
				<view class="update-time">
					<text>最后更新：{{ lastUpdateTime }}</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script>
export default {
	data() {
		return {
			loading: true,
			safeAreaTop: 0,
			safeAreaBottom: 0,
			navbarHeight: 44,
			
			// 概览数据
			overviewData: [
				{ label: '今日错误', value: 0, change: 0, level: 'error' },
				{ label: '致命错误', value: 0, change: 0, level: 'fatal' },
				{ label: '受影响用户', value: 0, change: 0, level: 'warning' },
				{ label: '错误率', value: '0%', change: 0, level: 'info' }
			],
			
			// 趋势数据（24小时）
			trendData: [],
			
			// 类型分布
			typeDistribution: [],
			typeColors: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F'],
			
			// 高频错误
			topErrors: [],
			
			// 页面错误
			pageErrors: [],
			maxPageErrors: 0,
			
			// 级别标签
			levelLabels: {
				debug: '调试',
				info: '信息',
				warning: '警告',
				error: '错误',
				fatal: '致命'
			},
			
			// 最后更新时间
			lastUpdateTime: '',
			
			// 自动刷新定时器
			refreshTimer: null,
			
			// Canvas上下文
			trendCtx: null,
			typeCtx: null
		};
	},
	
	onLoad() {
		this.initSafeArea();
		this.loadDashboardData();
		this.startAutoRefresh();
	},
	
	onUnload() {
		this.stopAutoRefresh();
	},
	
	methods: {
		// 初始化安全区域
		initSafeArea() {
			const systemInfo = uni.getSystemInfoSync();
			this.safeAreaTop = systemInfo.statusBarHeight || 0;
			this.safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
			this.navbarHeight = this.safeAreaTop + 44;
		},
		
		// 加载看板数据
		async loadDashboardData() {
			this.loading = true;
			
			try {
				const res = await uniCloud.callFunction({
					name: 'error-report',
					data: {
						action: 'get_dashboard',
						timeRange: 24 // 最近24小时
					}
				});
				
				if (res.result && res.result.code === 0) {
					const data = res.result.data;
					
					// 更新概览数据
					this.updateOverviewData(data.overview);
					
					// 更新趋势数据
					this.trendData = data.trend || [];
					
					// 更新类型分布
					this.updateTypeDistribution(data.typeDistribution || []);
					
					// 更新高频错误
					this.topErrors = data.topErrors || [];
					
					// 更新页面错误
					this.updatePageErrors(data.pageErrors || []);
					
					// 更新时间
					this.lastUpdateTime = this.formatTime(new Date());
					
					// 绘制图表
					this.$nextTick(() => {
						this.drawTrendChart();
						this.drawTypeChart();
					});
				} else {
					uni.showToast({
						title: '加载失败',
						icon: 'none'
					});
				}
			} catch (error) {
				console.error('加载看板数据失败:', error);
				uni.showToast({
					title: '加载失败',
					icon: 'none'
				});
			} finally {
				this.loading = false;
			}
		},
		
		// 更新概览数据
		updateOverviewData(overview) {
			if (!overview) return;
			
			this.overviewData[0].value = overview.todayErrors || 0;
			this.overviewData[0].change = overview.errorChange || 0;
			
			this.overviewData[1].value = overview.fatalErrors || 0;
			this.overviewData[1].change = overview.fatalChange || 0;
			
			this.overviewData[2].value = overview.affectedUsers || 0;
			this.overviewData[2].change = overview.userChange || 0;
			
			this.overviewData[3].value = (overview.errorRate || 0).toFixed(2) + '%';
			this.overviewData[3].change = overview.rateChange || 0;
		},
		
		// 更新类型分布
		updateTypeDistribution(distribution) {
			this.typeDistribution = distribution.map((item, index) => ({
				...item,
				color: this.typeColors[index % this.typeColors.length]
			}));
		},
		
		// 更新页面错误
		updatePageErrors(pageErrors) {
			this.pageErrors = pageErrors;
			this.maxPageErrors = Math.max(...pageErrors.map(p => p.count), 1);
		},
		
		// 绘制趋势图
		drawTrendChart() {
			const query = uni.createSelectorQuery().in(this);
			query.select('#trendCanvas').boundingClientRect(rect => {
				if (!rect) return;
				
				const ctx = uni.createCanvasContext('trendCanvas', this);
				this.trendCtx = ctx;
				
				const width = rect.width;
				const height = rect.height;
				const padding = 40;
				const chartWidth = width - padding * 2;
				const chartHeight = height - padding * 2;
				
				// 清空画布
				ctx.clearRect(0, 0, width, height);
				
				// 背景
				ctx.fillStyle = '#FFFFFF';
				ctx.fillRect(0, 0, width, height);
				
				if (this.trendData.length === 0) {
					ctx.setFontSize(14);
					ctx.setFillStyle('#999999');
					ctx.fillText('暂无数据', width / 2 - 28, height / 2);
					ctx.draw();
					return;
				}
				
				// 计算最大值
				const maxValue = Math.max(...this.trendData.map(d => d.count), 10);
				const stepX = chartWidth / (this.trendData.length - 1 || 1);
				
				// 绘制网格线
				ctx.setStrokeStyle('#F0F0F0');
				ctx.setLineWidth(1);
				for (let i = 0; i <= 5; i++) {
					const y = padding + (chartHeight / 5) * i;
					ctx.beginPath();
					ctx.moveTo(padding, y);
					ctx.lineTo(width - padding, y);
					ctx.stroke();
					
					// Y轴标签
					const value = Math.round(maxValue * (1 - i / 5));
					ctx.setFontSize(10);
					ctx.setFillStyle('#999999');
					ctx.fillText(value.toString(), 5, y + 4);
				}
				
				// 绘制折线
				ctx.setStrokeStyle('#4ECDC4');
				ctx.setLineWidth(2);
				ctx.beginPath();
				
				this.trendData.forEach((point, index) => {
					const x = padding + stepX * index;
					const y = padding + chartHeight - (point.count / maxValue) * chartHeight;
					
					if (index === 0) {
						ctx.moveTo(x, y);
					} else {
						ctx.lineTo(x, y);
					}
				});
				
				ctx.stroke();
				
				// 绘制数据点
				this.trendData.forEach((point, index) => {
					const x = padding + stepX * index;
					const y = padding + chartHeight - (point.count / maxValue) * chartHeight;
					
					ctx.beginPath();
					ctx.arc(x, y, 4, 0, 2 * Math.PI);
					ctx.setFillStyle('#4ECDC4');
					ctx.fill();
					
					// X轴标签（每4小时显示一个）
					if (index % 4 === 0) {
						ctx.setFontSize(10);
						ctx.setFillStyle('#999999');
						const label = point.hour + 'h';
						ctx.fillText(label, x - 10, height - padding + 15);
					}
				});
				
				ctx.draw();
			}).exec();
		},
		
		// 绘制类型分布饼图
		drawTypeChart() {
			const query = uni.createSelectorQuery().in(this);
			query.select('#typeCanvas').boundingClientRect(rect => {
				if (!rect) return;
				
				const ctx = uni.createCanvasContext('typeCanvas', this);
				this.typeCtx = ctx;
				
				const width = rect.width;
				const height = rect.height;
				const centerX = width / 2;
				const centerY = height / 2;
				const radius = Math.min(width, height) / 2 - 20;
				
				// 清空画布
				ctx.clearRect(0, 0, width, height);
				
				// 背景
				ctx.fillStyle = '#FFFFFF';
				ctx.fillRect(0, 0, width, height);
				
				if (this.typeDistribution.length === 0) {
					ctx.setFontSize(14);
					ctx.setFillStyle('#999999');
					ctx.fillText('暂无数据', centerX - 28, centerY);
					ctx.draw();
					return;
				}
				
				// 计算总数
				const total = this.typeDistribution.reduce((sum, item) => sum + item.count, 0);
				
				// 绘制饼图
				let startAngle = -Math.PI / 2;
				
				this.typeDistribution.forEach(item => {
					const angle = (item.count / total) * 2 * Math.PI;
					const endAngle = startAngle + angle;
					
					// 绘制扇形
					ctx.beginPath();
					ctx.moveTo(centerX, centerY);
					ctx.arc(centerX, centerY, radius, startAngle, endAngle);
					ctx.closePath();
					ctx.setFillStyle(item.color);
					ctx.fill();
					
					// 绘制百分比
					const midAngle = startAngle + angle / 2;
					const textX = centerX + Math.cos(midAngle) * radius * 0.7;
					const textY = centerY + Math.sin(midAngle) * radius * 0.7;
					const percentage = ((item.count / total) * 100).toFixed(1) + '%';
					
					ctx.setFontSize(12);
					ctx.setFillStyle('#FFFFFF');
					ctx.setTextAlign('center');
					ctx.fillText(percentage, textX, textY);
					
					startAngle = endAngle;
				});
				
				ctx.draw();
			}).exec();
		},
		
		// 趋势图触摸开始
		handleTrendTouchStart(e) {
			// 可以实现交互高亮功能
		},
		
		// 趋势图触摸移动
		handleTrendTouchMove(e) {
			// 可以实现交互高亮功能
		},
		
		// 趋势图触摸结束
		handleTrendTouchEnd(e) {
			// 可以实现交互高亮功能
		},
		
		// 刷新数据
		refreshData() {
			uni.vibrateShort();
			this.loadDashboardData();
		},
		
		// 开始自动刷新
		startAutoRefresh() {
			this.refreshTimer = setInterval(() => {
				this.loadDashboardData();
			}, 30000); // 30秒刷新一次
		},
		
		// 停止自动刷新
		stopAutoRefresh() {
			if (this.refreshTimer) {
				clearInterval(this.refreshTimer);
				this.refreshTimer = null;
			}
		},
		
		// 格式化时间
		formatTime(date) {
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hour = String(date.getHours()).padStart(2, '0');
			const minute = String(date.getMinutes()).padStart(2, '0');
			const second = String(date.getSeconds()).padStart(2, '0');
			
			return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
		}
	}
};
</script>

<style lang="scss" scoped>
.error-dashboard {
	width: 100%;
	min-height: 100vh;
	background-color: #F5F5F5;
}

/* 导航栏 */
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 100;
	background-color: #FFFFFF;
	border-bottom: 1px solid #E0E0E0;
}

.navbar-content {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 44px;
	padding: 0 16px;
}

.navbar-title {
	font-size: 18px;
	font-weight: 600;
	color: #333333;
}

.navbar-actions {
	display: flex;
	align-items: center;
}

.refresh-btn {
	padding: 8px;
	
	.icon {
		font-size: 20px;
	}
}

/* 内容区域 */
.content {
	width: 100%;
	height: 100vh;
}

.loading-state {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 100px 0;
}

.loading-text {
	font-size: 14px;
	color: #999999;
}

.dashboard-content {
	padding: 16px;
}

/* 概览卡片 */
.overview-cards {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: 12px;
	margin-bottom: 16px;
}

.card {
	background-color: #FFFFFF;
	border-radius: 12px;
	padding: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-value {
	font-size: 28px;
	font-weight: 700;
	margin-bottom: 4px;
	
	&.level-error {
		color: #FF6B6B;
	}
	
	&.level-fatal {
		color: #DC143C;
	}
	
	&.level-warning {
		color: #FFA07A;
	}
	
	&.level-info {
		color: #4ECDC4;
	}
}

.card-label {
	font-size: 12px;
	color: #999999;
	margin-bottom: 8px;
}

.card-change {
	font-size: 12px;
	font-weight: 600;
	
	&.increase {
		color: #FF6B6B;
	}
	
	&.decrease {
		color: #4ECDC4;
	}
}

/* 图表区域 */
.chart-section {
	background-color: #FFFFFF;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-header {
	margin-bottom: 16px;
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	color: #333333;
	display: block;
	margin-bottom: 4px;
}

.section-subtitle {
	font-size: 12px;
	color: #999999;
}

.chart-container {
	width: 100%;
	margin-bottom: 8px;
}

.chart-canvas {
	width: 100%;
	height: 200px;
}

.chart-canvas-pie {
	height: 180px;
}

/* 图例 */
.legend {
	display: flex;
	flex-wrap: wrap;
	gap: 12px;
	margin-top: 12px;
}

.legend-item {
	display: flex;
	align-items: center;
	gap: 6px;
}

.legend-color {
	width: 12px;
	height: 12px;
	border-radius: 2px;
}

.legend-label {
	font-size: 12px;
	color: #666666;
}

/* 列表区域 */
.list-section {
	background-color: #FFFFFF;
	border-radius: 12px;
	padding: 16px;
	margin-bottom: 16px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

/* 错误列表 */
.error-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.error-item {
	display: flex;
	align-items: center;
	gap: 12px;
	padding: 12px;
	background-color: #F9F9F9;
	border-radius: 8px;
}

.error-rank {
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 14px;
	font-weight: 700;
	background-color: #E0E0E0;
	color: #666666;
	flex-shrink: 0;
	
	&.rank-1 {
		background-color: #FFD700;
		color: #FFFFFF;
	}
	
	&.rank-2 {
		background-color: #C0C0C0;
		color: #FFFFFF;
	}
	
	&.rank-3 {
		background-color: #CD7F32;
		color: #FFFFFF;
	}
}

.error-info {
	flex: 1;
	min-width: 0;
}

.error-message {
	font-size: 14px;
	color: #333333;
	margin-bottom: 6px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.error-meta {
	display: flex;
	align-items: center;
	gap: 8px;
	font-size: 12px;
	color: #999999;
}

.error-type {
	padding: 2px 8px;
	background-color: #E0E0E0;
	border-radius: 4px;
}

.error-level {
	padding: 4px 12px;
	border-radius: 12px;
	font-size: 12px;
	font-weight: 600;
	flex-shrink: 0;
	
	&.level-fatal {
		background-color: #FFE5E5;
		color: #DC143C;
	}
	
	&.level-error {
		background-color: #FFE5E5;
		color: #FF6B6B;
	}
	
	&.level-warning {
		background-color: #FFF5E5;
		color: #FFA07A;
	}
}

/* 页面列表 */
.page-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.page-item {
	display: flex;
	flex-direction: column;
	gap: 6px;
}

.page-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.page-path {
	font-size: 14px;
	color: #333333;
	flex: 1;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.page-count {
	font-size: 12px;
	color: #999999;
	margin-left: 8px;
}

.page-bar {
	width: 100%;
	height: 6px;
	background-color: #F0F0F0;
	border-radius: 3px;
	overflow: hidden;
}

.page-bar-fill {
	height: 100%;
	background: linear-gradient(90deg, #4ECDC4 0%, #45B7D1 100%);
	transition: width 0.3s ease;
}

/* 更新时间 */
.update-time {
	text-align: center;
	padding: 16px 0;
	font-size: 12px;
	color: #999999;
}
</style>

