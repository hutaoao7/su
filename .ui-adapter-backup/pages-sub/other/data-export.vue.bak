<template>
	<view class="data-export-page">
		<!-- 导航栏 -->
		<view class="navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-inner">
				<view class="navbar-left" @click="goBack">
					<u-icon name="arrow-left" color="#333" size="20"></u-icon>
				</view>
				<view class="navbar-title">数据导出</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<!-- 内容区域 -->
		<scroll-view class="content" scroll-y :style="{ height: contentHeight + 'px' }">
			<!-- 说明信息 -->
			<view class="section">
				<view class="section-title">
					<u-icon name="info-circle" color="#5677fc" size="18"></u-icon>
					<text class="title-text">导出说明</text>
				</view>
				<view class="info-card">
					<text class="info-text">根据GDPR等隐私法规，您有权导出您的所有数据。导出的数据包括您的个人信息、评估记录、聊天记录等。</text>
				</view>
			</view>
			
			<!-- 数据类型选择 -->
			<view class="section">
				<view class="section-title">
					<text class="title-text">选择数据类型</text>
				</view>
				<view class="data-types">
					<view 
						v-for="(type, index) in dataTypeOptions" 
						:key="index"
						class="type-item"
						:class="{ 'active': isTypeSelected(type.value) }"
						@click="toggleDataType(type.value)"
					>
						<view class="type-icon">
							<u-icon :name="type.icon" size="24" :color="isTypeSelected(type.value) ? '#5677fc' : '#999'"></u-icon>
						</view>
						<view class="type-info">
							<text class="type-name">{{ type.label }}</text>
							<text class="type-desc">{{ type.desc }}</text>
						</view>
						<view class="type-check">
							<u-icon 
								name="checkmark-circle-fill" 
								size="20" 
								:color="isTypeSelected(type.value) ? '#5677fc' : '#e0e0e0'"
							></u-icon>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 导出格式选择 -->
			<view class="section">
				<view class="section-title">
					<text class="title-text">选择导出格式</text>
				</view>
				<view class="format-options">
					<view 
						v-for="(format, index) in formatOptions" 
						:key="index"
						class="format-item"
						:class="{ 'active': selectedFormat === format.value }"
						@click="selectedFormat = format.value"
					>
						<u-icon :name="format.icon" size="20" :color="selectedFormat === format.value ? '#5677fc' : '#999'"></u-icon>
						<text class="format-label">{{ format.label }}</text>
					</view>
				</view>
			</view>
			
			<!-- 加密选项 -->
			<view class="section">
				<view class="option-item">
					<view class="option-left">
						<u-icon name="lock" color="#5677fc" size="20"></u-icon>
						<text class="option-label">加密导出</text>
					</view>
					<u-switch v-model="encryptData" active-color="#5677fc"></u-switch>
				</view>
				<view class="option-desc">
					<text>开启后，导出的数据将使用AES-256加密，需要密钥才能解密</text>
				</view>
			</view>
			
			<!-- 导出历史 -->
			<view class="section" v-if="exportHistory.length > 0">
				<view class="section-title">
					<text class="title-text">导出历史</text>
					<text class="clear-history" @click="handleClearHistory">清空</text>
				</view>
				<view class="history-list">
					<view 
						v-for="(item, index) in exportHistory.slice(0, 5)" 
						:key="index"
						class="history-item"
					>
						<view class="history-icon">
							<u-icon name="file-text" color="#5677fc" size="20"></u-icon>
						</view>
						<view class="history-info">
							<text class="history-filename">{{ item.filename }}</text>
							<text class="history-time">{{ formatTime(item.timestamp) }}</text>
						</view>
						<view class="history-size">
							<text>{{ formatFileSize(item.fileSize) }}</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 底部占位 -->
			<view class="bottom-placeholder"></view>
		</scroll-view>
		
		<!-- 底部操作按钮 -->
		<view class="bottom-bar" :style="{ paddingBottom: safeAreaBottom + 'px' }">
			<view class="export-btn" :class="{ 'disabled': !canExport }" @click="handleExport">
				<u-icon name="download" color="#fff" size="20"></u-icon>
				<text class="btn-text">开始导出</text>
			</view>
		</view>
	</view>
</template>

<script>
import { exportUserData, getExportHistory, clearExportHistory, DATA_TYPES, EXPORT_FORMATS } from '@/utils/data-export-helper.js';

export default {
	name: 'DataExport',
	data() {
		return {
			statusBarHeight: 20,
			safeAreaBottom: 0,
			contentHeight: 600,
			
			// 数据类型选项
			dataTypeOptions: [
				{ value: DATA_TYPES.ALL, label: '全部数据', desc: '导出所有可用数据', icon: 'grid' },
				{ value: DATA_TYPES.PROFILE, label: '用户信息', desc: '基本信息和个人资料', icon: 'account' },
				{ value: DATA_TYPES.ASSESSMENTS, label: '评估记录', desc: '心理评估历史数据', icon: 'list' },
				{ value: DATA_TYPES.CHATS, label: 'AI对话', desc: '聊天记录和会话', icon: 'chat' },
				{ value: DATA_TYPES.MUSIC, label: '音乐数据', desc: '收藏和播放历史', icon: 'play-circle' },
				{ value: DATA_TYPES.COMMUNITY, label: '社区内容', desc: '话题和评论', icon: 'share' },
				{ value: DATA_TYPES.CDK, label: 'CDK记录', desc: '兑换历史', icon: 'gift' },
				{ value: DATA_TYPES.CONSENT, label: '同意记录', desc: '隐私协议同意记录', icon: 'file-text' }
			],
			
			// 格式选项
			formatOptions: [
				{ value: EXPORT_FORMATS.JSON, label: 'JSON', icon: 'code-working' },
				{ value: EXPORT_FORMATS.CSV, label: 'CSV', icon: 'document-text' },
				{ value: EXPORT_FORMATS.PDF, label: 'PDF', icon: 'document' }
			],
			
			// 选中的数据类型
			selectedDataTypes: [DATA_TYPES.ALL],
			
			// 选中的格式
			selectedFormat: EXPORT_FORMATS.JSON,
			
			// 是否加密
			encryptData: false,
			
			// 导出历史
			exportHistory: []
		};
	},
	computed: {
		canExport() {
			return this.selectedDataTypes.length > 0;
		}
	},
	onLoad() {
		this.initPage();
		this.loadExportHistory();
	},
	methods: {
		/**
		 * 初始化页面
		 */
		initPage() {
			const systemInfo = uni.getSystemInfoSync();
			this.statusBarHeight = systemInfo.statusBarHeight || 20;
			this.safeAreaBottom = systemInfo.safeAreaInsets?.bottom || 0;
			
			// 计算内容区域高度
			const navbarHeight = this.statusBarHeight + 44;
			const bottomBarHeight = 60 + this.safeAreaBottom;
			this.contentHeight = systemInfo.windowHeight - navbarHeight - bottomBarHeight;
		},
		
		/**
		 * 返回上一页
		 */
		goBack() {
			uni.navigateBack();
		},
		
		/**
		 * 判断数据类型是否选中
		 */
		isTypeSelected(type) {
			// 如果选中了"全部数据"，其他类型也显示为选中
			if (this.selectedDataTypes.includes(DATA_TYPES.ALL)) {
				return true;
			}
			return this.selectedDataTypes.includes(type);
		},
		
		/**
		 * 切换数据类型
		 */
		toggleDataType(type) {
			if (type === DATA_TYPES.ALL) {
				// 如果点击"全部数据"
				if (this.selectedDataTypes.includes(DATA_TYPES.ALL)) {
					// 如果已选中，则取消
					this.selectedDataTypes = [];
				} else {
					// 否则选中"全部数据"
					this.selectedDataTypes = [DATA_TYPES.ALL];
				}
			} else {
				// 如果点击其他类型
				// 首先移除"全部数据"
				this.selectedDataTypes = this.selectedDataTypes.filter(t => t !== DATA_TYPES.ALL);
				
				// 切换选中状态
				const index = this.selectedDataTypes.indexOf(type);
				if (index > -1) {
					this.selectedDataTypes.splice(index, 1);
				} else {
					this.selectedDataTypes.push(type);
				}
			}
		},
		
		/**
		 * 开始导出
		 */
		async handleExport() {
			if (!this.canExport) {
				return;
			}
			
			// 震动反馈
			uni.vibrateShort();
			
			try {
				const result = await exportUserData({
					dataTypes: this.selectedDataTypes,
					format: this.selectedFormat,
					encrypted: this.encryptData,
					includeMetadata: true
				});
				
				if (result.success) {
					uni.showToast({
						title: '导出成功',
						icon: 'success'
					});
					
					// 刷新导出历史
					this.loadExportHistory();
				} else {
					uni.showToast({
						title: result.message || '导出失败',
						icon: 'none'
					});
				}
			} catch (error) {
				console.error('[DataExport] 导出失败:', error);
				uni.showToast({
					title: '导出失败',
					icon: 'none'
				});
			}
		},
		
		/**
		 * 加载导出历史
		 */
		loadExportHistory() {
			this.exportHistory = getExportHistory();
		},
		
		/**
		 * 清空导出历史
		 */
		handleClearHistory() {
			uni.showModal({
				title: '确认清空',
				content: '确定要清空导出历史吗？',
				success: (res) => {
					if (res.confirm) {
						const success = clearExportHistory();
						if (success) {
							this.exportHistory = [];
							uni.showToast({
								title: '已清空',
								icon: 'success'
							});
						}
					}
				}
			});
		},
		
		/**
		 * 格式化时间
		 */
		formatTime(timestamp) {
			const date = new Date(timestamp);
			const now = new Date();
			const diff = now - date;
			
			// 1分钟内
			if (diff < 60000) {
				return '刚刚';
			}
			// 1小时内
			if (diff < 3600000) {
				return Math.floor(diff / 60000) + '分钟前';
			}
			// 今天
			if (date.toDateString() === now.toDateString()) {
				return '今天 ' + date.toTimeString().slice(0, 5);
			}
			// 昨天
			const yesterday = new Date(now);
			yesterday.setDate(yesterday.getDate() - 1);
			if (date.toDateString() === yesterday.toDateString()) {
				return '昨天 ' + date.toTimeString().slice(0, 5);
			}
			// 其他
			return date.toLocaleDateString('zh-CN');
		},
		
		/**
		 * 格式化文件大小
		 */
		formatFileSize(bytes) {
			if (bytes < 1024) {
				return bytes + ' B';
			}
			if (bytes < 1024 * 1024) {
				return (bytes / 1024).toFixed(2) + ' KB';
			}
			return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
		}
	}
};
</script>

<style lang="scss" scoped>
.data-export-page {
	width: 100%;
	height: 100vh;
	background-color: #f5f5f5;
	display: flex;
	flex-direction: column;
}

/* 导航栏 */
.navbar {
	background-color: #fff;
	border-bottom: 1px solid #e0e0e0;
}

.navbar-inner {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 16px;
}

.navbar-left, .navbar-right {
	width: 60px;
}

.navbar-title {
	font-size: 17px;
	font-weight: 500;
	color: #333;
}

/* 内容区域 */
.content {
	flex: 1;
	overflow-y: auto;
}

/* 分区 */
.section {
	margin-top: 12px;
	background-color: #fff;
	padding: 16px;
}

.section-title {
	display: flex;
	align-items: center;
	margin-bottom: 12px;
}

.title-text {
	font-size: 16px;
	font-weight: 500;
	color: #333;
	margin-left: 8px;
	flex: 1;
}

.clear-history {
	font-size: 14px;
	color: #5677fc;
}

/* 说明卡片 */
.info-card {
	background-color: #f0f5ff;
	border-radius: 8px;
	padding: 12px;
}

.info-text {
	font-size: 14px;
	color: #666;
	line-height: 1.6;
}

/* 数据类型列表 */
.data-types {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.type-item {
	display: flex;
	align-items: center;
	padding: 12px;
	background-color: #f5f5f5;
	border-radius: 8px;
	transition: all 0.3s;
}

.type-item.active {
	background-color: #f0f5ff;
	border: 1px solid #5677fc;
}

.type-icon {
	margin-right: 12px;
}

.type-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.type-name {
	font-size: 15px;
	color: #333;
	font-weight: 500;
}

.type-desc {
	font-size: 13px;
	color: #999;
}

/* 格式选项 */
.format-options {
	display: flex;
	gap: 12px;
}

.format-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: 16px;
	background-color: #f5f5f5;
	border-radius: 8px;
	transition: all 0.3s;
}

.format-item.active {
	background-color: #f0f5ff;
	border: 1px solid #5677fc;
}

.format-label {
	font-size: 14px;
	color: #333;
	margin-top: 8px;
}

/* 选项 */
.option-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 12px 0;
}

.option-left {
	display: flex;
	align-items: center;
	gap: 8px;
}

.option-label {
	font-size: 15px;
	color: #333;
}

.option-desc {
	margin-top: 8px;
	padding-left: 28px;
	font-size: 13px;
	color: #999;
	line-height: 1.5;
}

/* 历史记录列表 */
.history-list {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.history-item {
	display: flex;
	align-items: center;
	padding: 12px;
	background-color: #f5f5f5;
	border-radius: 8px;
}

.history-icon {
	margin-right: 12px;
}

.history-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.history-filename {
	font-size: 14px;
	color: #333;
}

.history-time {
	font-size: 12px;
	color: #999;
}

.history-size {
	font-size: 13px;
	color: #666;
}

/* 底部占位 */
.bottom-placeholder {
	height: 20px;
}

/* 底部操作栏 */
.bottom-bar {
	background-color: #fff;
	border-top: 1px solid #e0e0e0;
	padding: 10px 16px;
}

.export-btn {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8px;
	height: 44px;
	background: linear-gradient(135deg, #5677fc 0%, #7e57ff 100%);
	border-radius: 22px;
	box-shadow: 0 4px 12px rgba(86, 119, 252, 0.3);
}

.export-btn.disabled {
	background: #ccc;
	box-shadow: none;
}

.btn-text {
	font-size: 16px;
	font-weight: 500;
	color: #fff;
}
</style>

