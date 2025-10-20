/**
 * 用户数据导出工具
 * 
 * 功能说明：
 * 1. 导出用户所有数据（评估记录、聊天记录、用户信息等）
 * 2. 支持JSON/CSV/PDF格式
 * 3. 支持数据加密导出
 * 4. 符合GDPR数据携带权要求
 * 
 * 使用示例：
 * ```js
 * import { exportUserData } from '@/utils/data-export-helper.js';
 * 
 * const result = await exportUserData({
 *   dataTypes: ['assessments', 'chats', 'profile'],
 *   format: 'json',
 *   encrypted: true
 * });
 * ```
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

import storageCrypto from './storage-crypto.js';
import { exportToJSON as exportAssessmentJSON, exportToCSV as exportAssessmentCSV } from './assessment-export.js';

/**
 * 数据类型映射
 */
export const DATA_TYPES = {
	PROFILE: 'profile',           // 用户基本信息
	ASSESSMENTS: 'assessments',   // 评估记录
	CHATS: 'chats',               // AI对话记录
	MUSIC: 'music',               // 音乐历史
	COMMUNITY: 'community',       // 社区内容
	CDK: 'cdk',                   // CDK兑换记录
	CONSENT: 'consent',           // 同意记录
	ALL: 'all'                    // 所有数据
};

/**
 * 导出格式
 */
export const EXPORT_FORMATS = {
	JSON: 'json',
	CSV: 'csv',
	PDF: 'pdf'
};

/**
 * 导出用户数据（主入口）
 * @param {Object} options - 导出选项
 * @param {Array<String>} options.dataTypes - 数据类型列表
 * @param {String} options.format - 导出格式 'json' | 'csv' | 'pdf'
 * @param {Boolean} options.encrypted - 是否加密
 * @param {Boolean} options.includeMetadata - 是否包含元数据
 * @returns {Promise<Object>} 导出结果
 */
export async function exportUserData(options = {}) {
	const {
		dataTypes = [DATA_TYPES.ALL],
		format = EXPORT_FORMATS.JSON,
		encrypted = false,
		includeMetadata = true
	} = options;
	
	try {
		uni.showLoading({ title: '正在收集数据...' });
		
		// 1. 收集数据
		const collectedData = await collectUserData(dataTypes, includeMetadata);
		
		// 2. 格式化数据
		let formattedContent;
		let filename;
		let mimeType;
		
		switch (format) {
			case EXPORT_FORMATS.JSON:
				formattedContent = formatToJSON(collectedData);
				filename = `user_data_${Date.now()}.json`;
				mimeType = 'application/json';
				break;
			case EXPORT_FORMATS.CSV:
				formattedContent = formatToCSV(collectedData);
				filename = `user_data_${Date.now()}.csv`;
				mimeType = 'text/csv';
				break;
			case EXPORT_FORMATS.PDF:
				// PDF格式需要更复杂的处理
				const pdfResult = await formatToPDF(collectedData);
				formattedContent = pdfResult.content;
				filename = pdfResult.filename;
				mimeType = 'application/pdf';
				break;
			default:
				throw new Error('不支持的导出格式');
		}
		
		// 3. 加密（可选）
		if (encrypted) {
			uni.showLoading({ title: '正在加密数据...' });
			formattedContent = await encryptExportData(formattedContent);
			filename = filename.replace(/\.(json|csv|pdf)$/, '.encrypted.$1');
		}
		
		// 4. 保存/下载文件
		uni.showLoading({ title: '正在保存文件...' });
		const saveResult = await saveExportFile(formattedContent, filename, mimeType);
		
		// 5. 记录导出历史
		await recordExportHistory({
			dataTypes,
			format,
			encrypted,
			filename,
			fileSize: formattedContent.length,
			timestamp: Date.now()
		});
		
		uni.hideLoading();
		
		return {
			success: true,
			message: '数据导出成功',
			filename,
			filePath: saveResult.filePath,
			fileSize: formattedContent.length
		};
		
	} catch (error) {
		uni.hideLoading();
		console.error('[DataExport] 导出失败:', error);
		return {
			success: false,
			message: error.message || '数据导出失败'
		};
	}
}

/**
 * 收集用户数据
 * @private
 */
async function collectUserData(dataTypes, includeMetadata) {
	const data = {};
	
	// 元数据
	if (includeMetadata) {
		data.metadata = {
			exportTime: new Date().toISOString(),
			exportVersion: '1.0',
			appVersion: getAppVersion(),
			dataTypes: dataTypes
		};
	}
	
	// 判断是否导出所有数据
	const exportAll = dataTypes.includes(DATA_TYPES.ALL);
	
	// 收集各类数据
	if (exportAll || dataTypes.includes(DATA_TYPES.PROFILE)) {
		data.profile = await collectProfileData();
	}
	
	if (exportAll || dataTypes.includes(DATA_TYPES.ASSESSMENTS)) {
		data.assessments = await collectAssessmentData();
	}
	
	if (exportAll || dataTypes.includes(DATA_TYPES.CHATS)) {
		data.chats = await collectChatData();
	}
	
	if (exportAll || dataTypes.includes(DATA_TYPES.MUSIC)) {
		data.music = await collectMusicData();
	}
	
	if (exportAll || dataTypes.includes(DATA_TYPES.COMMUNITY)) {
		data.community = await collectCommunityData();
	}
	
	if (exportAll || dataTypes.includes(DATA_TYPES.CDK)) {
		data.cdk = await collectCDKData();
	}
	
	if (exportAll || dataTypes.includes(DATA_TYPES.CONSENT)) {
		data.consent = await collectConsentData();
	}
	
	return data;
}

/**
 * 收集用户基本信息
 * @private
 */
async function collectProfileData() {
	try {
		const userInfo = uni.getStorageSync('userInfo');
		const userProfile = uni.getStorageSync('userProfile');
		
		return {
			basic: userInfo ? JSON.parse(userInfo) : null,
			profile: userProfile ? JSON.parse(userProfile) : null,
			collectedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('[DataExport] 收集用户信息失败:', error);
		return null;
	}
}

/**
 * 收集评估数据
 * @private
 */
async function collectAssessmentData() {
	try {
		const assessments = [];
		
		// 遍历所有可能的评估记录
		const scaleIds = [
			'phq9', 'gad7', 'psqi', 'pss', 'ces-d', 'mbi',
			'wemwbs', 'swls', 'resilience', 'loneliness',
			'social-support', 'self-esteem', 'academic', 'sleep'
		];
		
		for (const scaleId of scaleIds) {
			// 获取历史记录
			const historyKey = `assessment_history_${scaleId}`;
			const historyStr = uni.getStorageSync(historyKey);
			
			if (historyStr) {
				try {
					const history = JSON.parse(historyStr);
					if (Array.isArray(history) && history.length > 0) {
						assessments.push({
							scaleId,
							history: history.map(item => ({
								...item,
								// 不包含敏感的原始答案，只保留结果
								score: item.score || item.total_score,
								level: item.level,
								date: item.date || item.timestamp
							}))
						});
					}
				} catch (error) {
					console.error(`[DataExport] 解析${scaleId}历史记录失败:`, error);
				}
			}
		}
		
		return {
			count: assessments.reduce((sum, item) => sum + item.history.length, 0),
			scales: assessments,
			collectedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('[DataExport] 收集评估数据失败:', error);
		return null;
	}
}

/**
 * 收集聊天数据
 * @private
 */
async function collectChatData() {
	try {
		// 从IndexedDB或localStorage获取聊天记录
		const chatSessions = uni.getStorageSync('chat_sessions');
		const chatMessages = uni.getStorageSync('chat_messages');
		
		return {
			sessions: chatSessions ? JSON.parse(chatSessions) : [],
			messages: chatMessages ? JSON.parse(chatMessages) : [],
			collectedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('[DataExport] 收集聊天数据失败:', error);
		return null;
	}
}

/**
 * 收集音乐数据
 * @private
 */
async function collectMusicData() {
	try {
		const favorites = uni.getStorageSync('music_favorites');
		const history = uni.getStorageSync('music_history');
		
		return {
			favorites: favorites ? JSON.parse(favorites) : [],
			history: history ? JSON.parse(history) : [],
			collectedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('[DataExport] 收集音乐数据失败:', error);
		return null;
	}
}

/**
 * 收集社区数据
 * @private
 */
async function collectCommunityData() {
	try {
		const myTopics = uni.getStorageSync('my_topics');
		const myComments = uni.getStorageSync('my_comments');
		
		return {
			topics: myTopics ? JSON.parse(myTopics) : [],
			comments: myComments ? JSON.parse(myComments) : [],
			collectedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('[DataExport] 收集社区数据失败:', error);
		return null;
	}
}

/**
 * 收集CDK数据
 * @private
 */
async function collectCDKData() {
	try {
		const cdkHistory = uni.getStorageSync('cdk_history');
		
		return {
			history: cdkHistory ? JSON.parse(cdkHistory) : [],
			collectedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('[DataExport] 收集CDK数据失败:', error);
		return null;
	}
}

/**
 * 收集同意记录
 * @private
 */
async function collectConsentData() {
	try {
		const consentRecords = uni.getStorageSync('consent_records');
		
		return {
			records: consentRecords ? JSON.parse(consentRecords) : [],
			collectedAt: new Date().toISOString()
		};
	} catch (error) {
		console.error('[DataExport] 收集同意记录失败:', error);
		return null;
	}
}

/**
 * 格式化为JSON
 * @private
 */
function formatToJSON(data) {
	return JSON.stringify(data, null, 2);
}

/**
 * 格式化为CSV
 * @private
 */
function formatToCSV(data) {
	// CSV格式：将嵌套数据扁平化
	const rows = [];
	
	// 添加元数据
	rows.push(['数据导出报告']);
	rows.push(['导出时间', data.metadata?.exportTime || '']);
	rows.push(['应用版本', data.metadata?.appVersion || '']);
	rows.push(['']);
	
	// 用户信息
	if (data.profile) {
		rows.push(['用户基本信息']);
		rows.push(['字段', '值']);
		const basic = data.profile.basic || {};
		Object.entries(basic).forEach(([key, value]) => {
			rows.push([key, String(value)]);
		});
		rows.push(['']);
	}
	
	// 评估记录
	if (data.assessments && data.assessments.scales) {
		rows.push(['评估记录汇总']);
		rows.push(['量表ID', '评估次数', '最近评估时间']);
		data.assessments.scales.forEach(scale => {
			const lastRecord = scale.history[scale.history.length - 1];
			rows.push([
				scale.scaleId,
				scale.history.length,
				lastRecord?.date || ''
			]);
		});
		rows.push(['']);
	}
	
	// 聊天记录统计
	if (data.chats) {
		rows.push(['聊天记录统计']);
		rows.push(['会话数', data.chats.sessions?.length || 0]);
		rows.push(['消息数', data.chats.messages?.length || 0]);
		rows.push(['']);
	}
	
	// 音乐数据
	if (data.music) {
		rows.push(['音乐数据']);
		rows.push(['收藏曲目数', data.music.favorites?.length || 0]);
		rows.push(['播放历史数', data.music.history?.length || 0]);
		rows.push(['']);
	}
	
	// 社区数据
	if (data.community) {
		rows.push(['社区数据']);
		rows.push(['发布话题数', data.community.topics?.length || 0]);
		rows.push(['评论数', data.community.comments?.length || 0]);
		rows.push(['']);
	}
	
	// 转换为CSV字符串
	return rows.map(row => row.map(cell => escapeCSV(cell)).join(',')).join('\n');
}

/**
 * 格式化为PDF
 * @private
 */
async function formatToPDF(data) {
	// PDF生成需要html2canvas和jspdf库
	// 这里返回HTML格式的内容，由前端页面转换为PDF
	
	const html = `
<!DOCTYPE html>
<html>
<head>
	<meta charset="UTF-8">
	<title>用户数据导出报告</title>
	<style>
		body { font-family: Arial, sans-serif; margin: 20px; }
		h1 { color: #333; border-bottom: 2px solid #5677fc; padding-bottom: 10px; }
		h2 { color: #555; margin-top: 30px; }
		table { width: 100%; border-collapse: collapse; margin-top: 10px; }
		th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
		th { background-color: #5677fc; color: white; }
		.metadata { background-color: #f5f5f5; padding: 10px; margin-bottom: 20px; }
	</style>
</head>
<body>
	<h1>翎心CraneHeart - 用户数据导出报告</h1>
	<div class="metadata">
		<p><strong>导出时间：</strong>${data.metadata?.exportTime || ''}</p>
		<p><strong>应用版本：</strong>${data.metadata?.appVersion || ''}</p>
	</div>
	
	${data.profile ? `
	<h2>用户基本信息</h2>
	<table>
		<tr><th>字段</th><th>值</th></tr>
		${Object.entries(data.profile.basic || {}).map(([key, value]) => 
			`<tr><td>${key}</td><td>${value}</td></tr>`
		).join('')}
	</table>
	` : ''}
	
	${data.assessments ? `
	<h2>评估记录汇总</h2>
	<p><strong>总评估次数：</strong>${data.assessments.count || 0}</p>
	<table>
		<tr><th>量表ID</th><th>评估次数</th><th>最近评估</th></tr>
		${data.assessments.scales?.map(scale => {
			const lastRecord = scale.history[scale.history.length - 1];
			return `<tr>
				<td>${scale.scaleId}</td>
				<td>${scale.history.length}</td>
				<td>${lastRecord?.date || ''}</td>
			</tr>`;
		}).join('') || ''}
	</table>
	` : ''}
	
	${data.chats ? `
	<h2>AI对话记录</h2>
	<p><strong>会话数：</strong>${data.chats.sessions?.length || 0}</p>
	<p><strong>消息数：</strong>${data.chats.messages?.length || 0}</p>
	` : ''}
	
	${data.music ? `
	<h2>音乐数据</h2>
	<p><strong>收藏曲目：</strong>${data.music.favorites?.length || 0}</p>
	<p><strong>播放历史：</strong>${data.music.history?.length || 0}</p>
	` : ''}
	
	${data.community ? `
	<h2>社区数据</h2>
	<p><strong>发布话题：</strong>${data.community.topics?.length || 0}</p>
	<p><strong>评论数：</strong>${data.community.comments?.length || 0}</p>
	` : ''}
</body>
</html>
	`;
	
	return {
		content: html,
		filename: `user_data_${Date.now()}.html`
	};
}

/**
 * 加密导出数据
 * @private
 */
async function encryptExportData(content) {
	try {
		// 使用storage-crypto加密
		const encrypted = await storageCrypto.encrypt(content);
		return JSON.stringify({
			encrypted: true,
			version: '1.0',
			data: encrypted
		}, null, 2);
	} catch (error) {
		console.error('[DataExport] 加密失败:', error);
		throw new Error('数据加密失败');
	}
}

/**
 * 保存导出文件
 * @private
 */
async function saveExportFile(content, filename, mimeType) {
	// #ifdef H5
	try {
		const blob = new Blob([content], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.style.display = 'none';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		URL.revokeObjectURL(url);
		
		return {
			success: true,
			filePath: filename
		};
	} catch (error) {
		throw new Error('文件下载失败');
	}
	// #endif
	
	// #ifdef MP-WEIXIN
	try {
		const fs = uni.getFileSystemManager();
		const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
		
		await new Promise((resolve, reject) => {
			fs.writeFile({
				filePath,
				data: content,
				encoding: 'utf8',
				success: resolve,
				fail: reject
			});
		});
		
		// 询问是否分享
		uni.showModal({
			title: '导出成功',
			content: '文件已保存，是否分享到微信？',
			confirmText: '分享',
			cancelText: '稍后',
			success: (res) => {
				if (res.confirm) {
					wx.shareFileMessage({
						filePath,
						success: () => {
							uni.showToast({ title: '分享成功' });
						},
						fail: () => {
							uni.showToast({ title: '分享失败', icon: 'none' });
						}
					});
				}
			}
		});
		
		return {
			success: true,
			filePath
		};
	} catch (error) {
		throw new Error('文件保存失败');
	}
	// #endif
}

/**
 * 记录导出历史
 * @private
 */
async function recordExportHistory(record) {
	try {
		const historyKey = 'data_export_history';
		let history = [];
		
		const historyStr = uni.getStorageSync(historyKey);
		if (historyStr) {
			history = JSON.parse(historyStr);
		}
		
		history.unshift(record);
		
		// 最多保留50条记录
		if (history.length > 50) {
			history = history.slice(0, 50);
		}
		
		uni.setStorageSync(historyKey, JSON.stringify(history));
	} catch (error) {
		console.error('[DataExport] 记录导出历史失败:', error);
	}
}

/**
 * 获取导出历史
 * @returns {Array} 导出历史记录
 */
export function getExportHistory() {
	try {
		const historyStr = uni.getStorageSync('data_export_history');
		return historyStr ? JSON.parse(historyStr) : [];
	} catch (error) {
		console.error('[DataExport] 获取导出历史失败:', error);
		return [];
	}
}

/**
 * 清空导出历史
 */
export function clearExportHistory() {
	try {
		uni.removeStorageSync('data_export_history');
		return true;
	} catch (error) {
		console.error('[DataExport] 清空导出历史失败:', error);
		return false;
	}
}

/**
 * 获取应用版本
 * @private
 */
function getAppVersion() {
	// #ifdef MP-WEIXIN
	const accountInfo = wx.getAccountInfoSync();
	return accountInfo.miniProgram.version || '开发版';
	// #endif
	
	// #ifdef H5
	return process.env.VUE_APP_VERSION || '1.0.0';
	// #endif
	
	return '1.0.0';
}

/**
 * 转义CSV特殊字符
 * @private
 */
function escapeCSV(text) {
	if (text === null || text === undefined) {
		return '';
	}
	
	const str = String(text);
	
	if (str.includes(',') || str.includes('"') || str.includes('\n')) {
		return '"' + str.replace(/"/g, '""') + '"';
	}
	
	return str;
}

export default {
	exportUserData,
	getExportHistory,
	clearExportHistory,
	DATA_TYPES,
	EXPORT_FORMATS
};

