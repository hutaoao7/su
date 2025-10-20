<template>
	<view class="data-export-page">
		<!-- 导航栏 -->
		<view class="navbar" :style="{ paddingTop: safeAreaTop + 'px' }">
			<view class="navbar-content">
				<view class="back-btn" @click="goBack">
					<text class="iconfont icon-left"></text>
				</view>
				<text class="navbar-title">数据导出</text>
				<view class="placeholder"></view>
			</view>
		</view>
		
		<!-- 主内容区 -->
		<scroll-view
			class="content"
			scroll-y
			:style="{ paddingTop: navbarHeight + 'px', paddingBottom: safeAreaBottom + 'px' }"
		>
			<!-- 说明卡片 -->
			<view class="info-card">
				<view class="info-icon">📦</view>
				<view class="info-title">导出您的数据</view>
				<view class="info-desc">
					您可以导出在翎心CraneHeart中的所有数据，包括个人信息、评估记录、聊天历史等。
					我们会自动对敏感信息进行脱敏处理。
				</view>
			</view>
			
			<!-- 导出格式选择 -->
			<view class="section">
				<view class="section-title">选择导出格式</view>
				<view class="format-list">
					<view
						class="format-item"
						:class="{ active: selectedFormat === 'JSON' }"
						@click="selectFormat('JSON')"
					>
						<view class="format-icon">📄</view>
						<view class="format-info">
							<view class="format-name">JSON格式</view>
							<view class="format-desc">完整数据，适合程序处理</view>
						</view>
						<view class="format-check" v-if="selectedFormat === 'JSON'">
							<text class="iconfont icon-check"></text>
						</view>
					</view>
					
					<view
						class="format-item"
						:class="{ active: selectedFormat === 'CSV' }"
						@click="selectFormat('CSV')"
					>
						<view class="format-icon">📊</view>
						<view class="format-info">
							<view class="format-name">CSV格式</view>
							<view class="format-desc">表格数据，可用Excel打开</view>
						</view>
						<view class="format-check" v-if="selectedFormat === 'CSV'">
							<text class="iconfont icon-check"></text>
						</view>
					</view>
					
					<!-- #ifdef H5 -->
					<view
						class="format-item"
						:class="{ active: selectedFormat === 'PDF' }"
						@click="selectFormat('PDF')"
					>
						<view class="format-icon">📋</view>
						<view class="format-info">
							<view class="format-name">PDF格式</view>
							<view class="format-desc">可读性强，适合打印</view>
						</view>
						<view class="format-check" v-if="selectedFormat === 'PDF'">
							<text class="iconfont icon-check"></text>
						</view>
					</view>
					<!-- #endif -->
				</view>
			</view>
			
			<!-- 数据项选择 -->
			<view class="section">
				<view class="section-title">包含的数据项</view>
				<view class="data-items">
					<view class="data-item">
						<view class="data-item-icon">👤</view>
						<view class="data-item-name">个人信息</view>
						<view class="data-item-count">1项</view>
					</view>
					<view class="data-item">
						<view class="data-item-icon">📝</view>
						<view class="data-item-name">评估记录</view>
						<view class="data-item-count">{{ assessmentCount }}条</view>
					</view>
					<view class="data-item">
						<view class="data-item-icon">💬</view>
						<view class="data-item-name">聊天历史</view>
						<view class="data-item-count">{{ chatCount }}条</view>
					</view>
					<view class="data-item">
						<view class="data-item-icon">🎵</view>
						<view class="data-item-name">音乐收藏</view>
						<view class="data-item-count">{{ musicCount }}首</view>
					</view>
					<view class="data-item">
						<view class="data-item-icon">🌐</view>
						<view class="data-item-name">社区数据</view>
						<view class="data-item-count">{{ communityCount }}条</view>
					</view>
				</view>
			</view>
			
			<!-- 导出历史 -->
			<view class="section" v-if="exportHistory.length > 0">
				<view class="section-title">
					<text>导出历史</text>
					<text class="clear-btn" @click="clearHistory">清空</text>
				</view>
				<view class="history-list">
					<view
						class="history-item"
						v-for="item in exportHistory"
						:key="item.id"
					>
						<view class="history-icon">
							<text v-if="item.format === 'JSON'">📄</text>
							<text v-else-if="item.format === 'CSV'">📊</text>
							<text v-else>📋</text>
						</view>
						<view class="history-info">
							<view class="history-name">{{ item.format }}格式导出</view>
							<view class="history-time">{{ formatTime(item.timestamp) }}</view>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 注意事项 -->
			<view class="section">
				<view class="section-title">注意事项</view>
				<view class="notice-list">
					<view class="notice-item">
						<text class="notice-icon">🔒</text>
						<text class="notice-text">手机号、邮箱等敏感信息会自动脱敏</text>
					</view>
					<view class="notice-item">
						<text class="notice-icon">⏱️</text>
						<text class="notice-text">导出可能需要几秒钟时间</text>
					</view>
					<view class="notice-item">
						<text class="notice-icon">💾</text>
						<text class="notice-text">导出的数据会保存到本地文件</text>
					</view>
					<!-- #ifdef MP-WEIXIN -->
					<view class="notice-item">
						<text class="notice-icon">📱</text>
						<text class="notice-text">小程序端文件保存在临时目录</text>
					</view>
					<!-- #endif -->
				</view>
			</view>
		</scroll-view>
		
		<!-- 底部导出按钮 -->
		<view class="bottom-bar" :style="{ paddingBottom: safeAreaBottom + 'px' }">
			<button
				class="export-btn"
				:class="{ disabled: exporting }"
				:disabled="exporting"
				@click="handleExport"
			>
				<text v-if="exporting">导出中...</text>
				<text v-else>开始导出</text>
			</button>
		</view>
	</view>
</template>

<script>
import dataExport from '@/utils/data-export.js';
import storageCrypto from '@/utils/storage-crypto.js';

export default {
	name: 'DataExport',
	
	data() {
		return {
			safeAreaTop: 0,
			safeAreaBottom: 0,
			navbarHeight: 44,
			selectedFormat: 'JSON',
			exporting: false,
			assessmentCount: 0,
			chatCount: 0,
			musicCount: 0,
			communityCount: 0,
			exportHistory: []
		};
	},
	
	onLoad() {
		this.initSafeArea();
		this.loadDataCounts();
		this.loadExportHistory();
	},
	
	methods: {
		/**
		 * 初始化安全区域
		 */
		initSafeArea() {
			const systemInfo = uni.getSystemInfoSync();
			this.safeAreaTop = systemInfo.statusBarHeight || 20;
			this.safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
			this.navbarHeight = this.safeAreaTop + 44;
		},
		
		/**
		 * 加载数据统计
		 */
		async loadDataCounts() {
			try {
				// 评估记录
				const assessmentHistory = await storageCrypto.getSecure('assessment_history') || [];
				this.assessmentCount = assessmentHistory.length;
				
				// 聊天会话
				const chatSessions = await storageCrypto.getSecure('chat_sessions') || [];
				let totalMessages = 0;
				for (const session of chatSessions) {
					const messages = await storageCrypto.getSecure(`chat_messages_${session.id}`) || [];
					totalMessages += messages.length;
				}
				this.chatCount = totalMessages;
				
				// 音乐收藏
				const musicFavorites = uni.getStorageSync('music_favorites') || [];
				this.musicCount = musicFavorites.length;
				
				// 社区数据
				const myTopics = uni.getStorageSync('my_topics') || [];
				const myComments = uni.getStorageSync('my_comments') || [];
				this.communityCount = myTopics.length + myComments.length;
			} catch (error) {
				console.error('加载数据统计失败:', error);
			}
		},
		
		/**
		 * 加载导出历史
		 */
		async loadExportHistory() {
			try {
				this.exportHistory = await dataExport.getExportHistory();
			} catch (error) {
				console.error('加载导出历史失败:', error);
			}
		},
		
		/**
		 * 选择导出格式
		 */
		selectFormat(format) {
			this.selectedFormat = format;
			uni.vibrateShort();
		},
		
		/**
		 * 开始导出
		 */
		async handleExport() {
			if (this.exporting) return;
			
			// 确认对话框
			const confirm = await this.showConfirm();
			if (!confirm) return;
			
			this.exporting = true;
			
			try {
				let result;
				
				switch (this.selectedFormat) {
					case 'JSON':
						result = await dataExport.exportToJSON();
						break;
					case 'CSV':
						result = await dataExport.exportToCSV();
						break;
					case 'PDF':
						result = await dataExport.exportToPDF();
						break;
					default:
						throw new Error('未知的导出格式');
				}
				
				// 刷新导出历史
				await this.loadExportHistory();
				
				// 显示成功消息
				this.showSuccessMessage(result);
			} catch (error) {
				console.error('导出失败:', error);
				uni.showToast({
					title: error.message || '导出失败',
					icon: 'none',
					duration: 2000
				});
			} finally {
				this.exporting = false;
			}
		},
		
		/**
		 * 显示确认对话框
		 */
		showConfirm() {
			return new Promise((resolve) => {
				uni.showModal({
					title: '确认导出',
					content: `确定要将数据导出为${this.selectedFormat}格式吗？`,
					success: (res) => {
						resolve(res.confirm);
					}
				});
			});
		},
		
		/**
		 * 显示成功消息
		 */
		showSuccessMessage(result) {
			// #ifdef H5
			uni.showModal({
				title: '导出成功',
				content: '文件已下载到您的设备',
				showCancel: false
			});
			// #endif
			
			// #ifdef MP-WEIXIN
			uni.showModal({
				title: '导出成功',
				content: `文件已保存，路径：\n${result.path}`,
				showCancel: false
			});
			// #endif
		},
		
		/**
		 * 清空导出历史
		 */
		async clearHistory() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空所有导出历史记录吗？',
				success: async (res) => {
					if (res.confirm) {
						await dataExport.clearExportHistory();
						this.exportHistory = [];
						uni.showToast({
							title: '已清空',
							icon: 'success'
						});
					}
				}
			});
		},
		
		/**
		 * 格式化时间
		 */
		formatTime(isoString) {
			const date = new Date(isoString);
			const now = new Date();
			const diff = now - date;
			
			// 小于1分钟
			if (diff < 60000) {
				return '刚刚';
			}
			
			// 小于1小时
			if (diff < 3600000) {
				const minutes = Math.floor(diff / 60000);
				return `${minutes}分钟前`;
			}
			
			// 小于24小时
			if (diff < 86400000) {
				const hours = Math.floor(diff / 3600000);
				return `${hours}小时前`;
			}
			
			// 显示日期
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const day = String(date.getDate()).padStart(2, '0');
			const hour = String(date.getHours()).padStart(2, '0');
			const minute = String(date.getMinutes()).padStart(2, '0');
			
			return `${year}-${month}-${day} ${hour}:${minute}`;
		},
		
		/**
		 * 返回上一页
		 */
		goBack() {
			uni.navigateBack();
		}
	}
};
</script>

<style lang="scss" scoped>
.data-export-page {
	min-height: 100vh;
	background: #f5f5f5;
}

/* 导航栏 */
.navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: #fff;
	z-index: 999;
	border-bottom: 1px solid #eee;
}

.navbar-content {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
}

.back-btn {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.navbar-title {
	font-size: 17px;
	font-weight: 600;
	color: #333;
}

.placeholder {
	width: 40px;
}

/* 主内容 */
.content {
	height: 100vh;
}

/* 说明卡片 */
.info-card {
	margin: 16px;
	padding: 20px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	border-radius: 12px;
	color: #fff;
}

.info-icon {
	font-size: 40px;
	margin-bottom: 12px;
}

.info-title {
	font-size: 20px;
	font-weight: 600;
	margin-bottom: 8px;
}

.info-desc {
	font-size: 14px;
	line-height: 1.6;
	opacity: 0.9;
}

/* 区块 */
.section {
	margin: 16px;
	background: #fff;
	border-radius: 12px;
	padding: 16px;
}

.section-title {
	font-size: 16px;
	font-weight: 600;
	color: #333;
	margin-bottom: 12px;
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.clear-btn {
	font-size: 14px;
	color: #f56c6c;
	font-weight: normal;
}

/* 格式列表 */
.format-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.format-item {
	display: flex;
	align-items: center;
	padding: 16px;
	background: #f9f9f9;
	border-radius: 8px;
	border: 2px solid transparent;
	transition: all 0.3s;
}

.format-item.active {
	background: #e8f4fd;
	border-color: #409eff;
}

.format-icon {
	font-size: 32px;
	margin-right: 12px;
}

.format-info {
	flex: 1;
}

.format-name {
	font-size: 15px;
	font-weight: 600;
	color: #333;
	margin-bottom: 4px;
}

.format-desc {
	font-size: 13px;
	color: #999;
}

.format-check {
	width: 24px;
	height: 24px;
	background: #409eff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: #fff;
	font-size: 14px;
}

/* 数据项 */
.data-items {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.data-item {
	display: flex;
	align-items: center;
	padding: 12px;
	background: #f9f9f9;
	border-radius: 8px;
}

.data-item-icon {
	font-size: 24px;
	margin-right: 12px;
}

.data-item-name {
	flex: 1;
	font-size: 15px;
	color: #333;
}

.data-item-count {
	font-size: 13px;
	color: #999;
}

/* 导出历史 */
.history-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.history-item {
	display: flex;
	align-items: center;
	padding: 12px;
	background: #f9f9f9;
	border-radius: 8px;
}

.history-icon {
	font-size: 24px;
	margin-right: 12px;
}

.history-info {
	flex: 1;
}

.history-name {
	font-size: 15px;
	color: #333;
	margin-bottom: 4px;
}

.history-time {
	font-size: 13px;
	color: #999;
}

/* 注意事项 */
.notice-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.notice-item {
	display: flex;
	align-items: flex-start;
	padding: 12px;
	background: #fff3e0;
	border-radius: 8px;
}

.notice-icon {
	font-size: 20px;
	margin-right: 8px;
	flex-shrink: 0;
}

.notice-text {
	flex: 1;
	font-size: 14px;
	color: #666;
	line-height: 1.5;
}

/* 底部按钮 */
.bottom-bar {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	background: #fff;
	padding: 16px;
	border-top: 1px solid #eee;
}

.export-btn {
	width: 100%;
	height: 48px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
	color: #fff;
	border: none;
	border-radius: 24px;
	font-size: 16px;
	font-weight: 600;
	display: flex;
	align-items: center;
	justify-content: center;
}

.export-btn.disabled {
	opacity: 0.6;
}
</style>
