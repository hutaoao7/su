/**
 * 用户数据导出工具
 * 
 * 功能说明：
 * 1. 支持JSON/CSV/PDF格式导出
 * 2. 汇总用户所有数据（个人信息、评估结果、聊天记录等）
 * 3. 支持H5和小程序双端
 * 4. 自动加密敏感数据
 * 5. 生成导出历史记录
 * 
 * 使用示例：
 * ```js
 * import dataExport from '@/utils/data-export.js';
 * 
 * // 导出为JSON
 * await dataExport.exportToJSON();
 * 
 * // 导出为CSV
 * await dataExport.exportToCSV();
 * 
 * // 导出为PDF（H5端）
 * await dataExport.exportToPDF();
 * ```
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

import storageCrypto from '@/utils/storage-crypto.js';

/**
 * 数据收集器 - 汇总所有用户数据
 */
class DataCollector {
	/**
	 * 收集所有用户数据
	 * @returns {Promise<Object>}
	 */
	async collectAllData() {
		const data = {
			meta: this.getMetadata(),
			userInfo: await this.collectUserInfo(),
			assessments: await this.collectAssessments(),
			chatHistory: await this.collectChatHistory(),
			musicHistory: await this.collectMusicHistory(),
			communityData: await this.collectCommunityData(),
			settings: await this.collectSettings()
		};
		
		return data;
	}
	
	/**
	 * 获取元数据
	 * @returns {Object}
	 */
	getMetadata() {
		return {
			exportTime: new Date().toISOString(),
			exportVersion: '1.0.0',
			appVersion: '0.1.0-MVP',
			platform: this.getPlatform()
		};
	}
	
	/**
	 * 获取平台信息
	 * @returns {string}
	 */
	getPlatform() {
		// #ifdef H5
		return 'H5';
		// #endif
		
		// #ifdef MP-WEIXIN
		return '微信小程序';
		// #endif
		
		// #ifdef APP-PLUS
		return 'APP';
		// #endif
		
		return 'Unknown';
	}
	
	/**
	 * 收集用户信息
	 * @returns {Promise<Object>}
	 */
	async collectUserInfo() {
		try {
			const userInfo = await storageCrypto.getSecure('userInfo') || {};
			const token = await storageCrypto.getSecure('token');
			
			return {
				id: userInfo.id || null,
				nickname: userInfo.nickname || null,
				avatarUrl: userInfo.avatarUrl || null,
				gender: userInfo.gender || null,
				birthday: userInfo.birthday || null,
				bio: userInfo.bio || null,
				phone: userInfo.phone ? this.maskPhone(userInfo.phone) : null, // 脱敏
				email: userInfo.email ? this.maskEmail(userInfo.email) : null, // 脱敏
				registerTime: userInfo.registerTime || null,
				lastLoginTime: userInfo.lastLoginTime || null,
				hasToken: !!token
			};
		} catch (error) {
			console.error('[DataExport] 收集用户信息失败:', error);
			return null;
		}
	}
	
	/**
	 * 收集评估数据
	 * @returns {Promise<Array>}
	 */
	async collectAssessments() {
		try {
			const history = await storageCrypto.getSecure('assessment_history') || [];
			const assessments = [];
			
			// 收集所有评估结果
			for (const item of history) {
				const result = await storageCrypto.getSecure(`assessment_result_${item.id}`);
				if (result) {
					assessments.push({
						id: item.id,
						scaleId: item.scaleId,
						scaleName: result.scaleName || item.scaleId,
						score: result.score,
						level: result.level,
						timestamp: item.timestamp,
						duration: result.duration || null,
						answers: result.answers || []
					});
				}
			}
			
			return assessments;
		} catch (error) {
			console.error('[DataExport] 收集评估数据失败:', error);
			return [];
		}
	}
	
	/**
	 * 收集聊天记录
	 * @returns {Promise<Array>}
	 */
	async collectChatHistory() {
		try {
			const sessions = await storageCrypto.getSecure('chat_sessions') || [];
			const chatData = [];
			
			// 收集所有会话的消息
			for (const session of sessions) {
				const messages = await storageCrypto.getSecure(`chat_messages_${session.id}`) || [];
				
				// 过滤敏感内容
				const filteredMessages = messages.map(msg => ({
					id: msg.id,
					role: msg.role,
					content: this.sanitizeContent(msg.content),
					timestamp: msg.timestamp,
					feedback: msg.feedback || null
				}));
				
				chatData.push({
					sessionId: session.id,
					sessionName: session.name,
					createTime: session.createTime,
					messageCount: filteredMessages.length,
					messages: filteredMessages
				});
			}
			
			return chatData;
		} catch (error) {
			console.error('[DataExport] 收集聊天记录失败:', error);
			return [];
		}
	}
	
	/**
	 * 收集音乐历史
	 * @returns {Promise<Object>}
	 */
	async collectMusicHistory() {
		try {
			const favorites = uni.getStorageSync('music_favorites') || [];
			const history = uni.getStorageSync('music_history') || [];
			
			return {
				favorites: favorites.map(item => ({
					trackId: item.id,
					trackName: item.name,
					addTime: item.addTime
				})),
				playHistory: history.slice(0, 100).map(item => ({
					trackId: item.id,
					trackName: item.name,
					playTime: item.playTime,
					duration: item.duration
				}))
			};
		} catch (error) {
			console.error('[DataExport] 收集音乐历史失败:', error);
			return { favorites: [], playHistory: [] };
		}
	}
	
	/**
	 * 收集社区数据
	 * @returns {Promise<Object>}
	 */
	async collectCommunityData() {
		try {
			// 从本地缓存收集（实际应该从云端API获取）
			const myTopics = uni.getStorageSync('my_topics') || [];
			const myComments = uni.getStorageSync('my_comments') || [];
			
			return {
				topicCount: myTopics.length,
				commentCount: myComments.length,
				topics: myTopics.slice(0, 50).map(topic => ({
					id: topic.id,
					title: topic.title,
					content: this.sanitizeContent(topic.content),
					createTime: topic.createTime,
					likeCount: topic.likeCount || 0,
					commentCount: topic.commentCount || 0
				})),
				comments: myComments.slice(0, 100).map(comment => ({
					id: comment.id,
					content: this.sanitizeContent(comment.content),
					createTime: comment.createTime,
					likeCount: comment.likeCount || 0
				}))
			};
		} catch (error) {
			console.error('[DataExport] 收集社区数据失败:', error);
			return { topicCount: 0, commentCount: 0, topics: [], comments: [] };
		}
	}
	
	/**
	 * 收集设置
	 * @returns {Promise<Object>}
	 */
	async collectSettings() {
		try {
			return {
				theme: uni.getStorageSync('theme') || 'light',
				language: uni.getStorageSync('language') || 'zh-CN',
				notifications: uni.getStorageSync('notifications_enabled') || true,
				privacy: uni.getStorageSync('privacy_settings') || {}
			};
		} catch (error) {
			console.error('[DataExport] 收集设置失败:', error);
			return {};
		}
	}
	
	/**
	 * 手机号脱敏
	 * @param {string} phone
	 * @returns {string}
	 */
	maskPhone(phone) {
		if (!phone || phone.length < 11) return phone;
		return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
	}
	
	/**
	 * 邮箱脱敏
	 * @param {string} email
	 * @returns {string}
	 */
	maskEmail(email) {
		if (!email) return email;
		const [username, domain] = email.split('@');
		if (!username || !domain) return email;
		const maskedUsername = username.substring(0, 2) + '***';
		return `${maskedUsername}@${domain}`;
	}
	
	/**
	 * 内容清理（移除敏感信息）
	 * @param {string} content
	 * @returns {string}
	 */
	sanitizeContent(content) {
		if (!content) return '';
		
		// 移除手机号
		content = content.replace(/1[3-9]\d{9}/g, '***手机号***');
		
		// 移除身份证号
		content = content.replace(/\d{17}[\dXx]/g, '***身份证号***');
		
		// 移除邮箱
		content = content.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***邮箱***');
		
		return content;
	}
}

/**
 * JSON导出器
 */
class JSONExporter {
	/**
	 * 导出为JSON
	 * @param {Object} data
	 * @returns {Promise<string>}
	 */
	async export(data) {
		try {
			const jsonString = JSON.stringify(data, null, 2);
			return jsonString;
		} catch (error) {
			console.error('[DataExport] JSON导出失败:', error);
			throw error;
		}
	}
	
	/**
	 * 下载JSON文件
	 * @param {Object} data
	 * @param {string} filename
	 */
	async download(data, filename = 'user_data.json') {
		const jsonString = await this.export(data);
		
		// #ifdef H5
		// H5端下载
		const blob = new Blob([jsonString], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
		return { success: true, path: filename };
		// #endif
		
		// #ifdef MP-WEIXIN
		// 小程序端保存到临时文件
		const fs = uni.getFileSystemManager();
		const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
		
		return new Promise((resolve, reject) => {
			fs.writeFile({
				filePath: filePath,
				data: jsonString,
				encoding: 'utf8',
				success: () => {
					resolve({ success: true, path: filePath });
				},
				fail: (error) => {
					reject(error);
				}
			});
		});
		// #endif
	}
}

/**
 * CSV导出器
 */
class CSVExporter {
	/**
	 * 导出为CSV
	 * @param {Object} data
	 * @returns {Promise<string>}
	 */
	async export(data) {
		try {
			let csv = '';
			
			// 元数据
			csv += '# 导出元数据\n';
			csv += this.objectToCSV(data.meta);
			csv += '\n\n';
			
			// 用户信息
			csv += '# 用户信息\n';
			csv += this.objectToCSV(data.userInfo);
			csv += '\n\n';
			
			// 评估记录
			csv += '# 评估记录\n';
			csv += this.arrayToCSV(data.assessments);
			csv += '\n\n';
			
			// 聊天会话统计
			csv += '# 聊天会话统计\n';
			const chatSummary = data.chatHistory.map(session => ({
				sessionId: session.sessionId,
				sessionName: session.sessionName,
				createTime: session.createTime,
				messageCount: session.messageCount
			}));
			csv += this.arrayToCSV(chatSummary);
			csv += '\n\n';
			
			// 音乐收藏
			csv += '# 音乐收藏\n';
			csv += this.arrayToCSV(data.musicHistory.favorites);
			csv += '\n\n';
			
			// 社区统计
			csv += '# 社区数据统计\n';
			csv += `话题数,${data.communityData.topicCount}\n`;
			csv += `评论数,${data.communityData.commentCount}\n`;
			
			return csv;
		} catch (error) {
			console.error('[DataExport] CSV导出失败:', error);
			throw error;
		}
	}
	
	/**
	 * 对象转CSV
	 * @param {Object} obj
	 * @returns {string}
	 */
	objectToCSV(obj) {
		if (!obj) return '';
		
		const keys = Object.keys(obj);
		const values = keys.map(key => this.escapeCSV(obj[key]));
		
		return `${keys.join(',')}\n${values.join(',')}\n`;
	}
	
	/**
	 * 数组转CSV
	 * @param {Array} arr
	 * @returns {string}
	 */
	arrayToCSV(arr) {
		if (!arr || arr.length === 0) return '';
		
		// 获取所有列名
		const keys = Object.keys(arr[0]);
		let csv = keys.join(',') + '\n';
		
		// 添加数据行
		arr.forEach(item => {
			const values = keys.map(key => this.escapeCSV(item[key]));
			csv += values.join(',') + '\n';
		});
		
		return csv;
	}
	
	/**
	 * CSV值转义
	 * @param {*} value
	 * @returns {string}
	 */
	escapeCSV(value) {
		if (value === null || value === undefined) return '';
		
		// 转换为字符串
		let str = String(value);
		
		// 如果包含逗号、引号或换行符，需要用引号包裹
		if (str.includes(',') || str.includes('"') || str.includes('\n')) {
			// 引号需要转义为两个引号
			str = str.replace(/"/g, '""');
			str = `"${str}"`;
		}
		
		return str;
	}
	
	/**
	 * 下载CSV文件
	 * @param {Object} data
	 * @param {string} filename
	 */
	async download(data, filename = 'user_data.csv') {
		const csvString = await this.export(data);
		
		// 添加BOM以支持Excel打开中文
		const bom = '\uFEFF';
		const csvWithBOM = bom + csvString;
		
		// #ifdef H5
		const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
		return { success: true, path: filename };
		// #endif
		
		// #ifdef MP-WEIXIN
		const fs = uni.getFileSystemManager();
		const filePath = `${wx.env.USER_DATA_PATH}/${filename}`;
		
		return new Promise((resolve, reject) => {
			fs.writeFile({
				filePath: filePath,
				data: csvWithBOM,
				encoding: 'utf8',
				success: () => {
					resolve({ success: true, path: filePath });
				},
				fail: (error) => {
					reject(error);
				}
			});
		});
		// #endif
	}
}

/**
 * PDF导出器（仅H5端支持）
 */
class PDFExporter {
	/**
	 * 导出为PDF
	 * @param {Object} data
	 * @returns {Promise<Blob>}
	 */
	async export(data) {
		// #ifdef H5
		try {
			// 生成HTML内容
			const html = this.generateHTML(data);
			
			// 使用html2canvas和jspdf生成PDF
			// 注意：需要在index.html中引入这两个库
			if (typeof html2canvas === 'undefined' || typeof jspdf === 'undefined') {
				throw new Error('PDF导出需要html2canvas和jspdf库');
			}
			
			// 创建临时DOM
			const tempDiv = document.createElement('div');
			tempDiv.innerHTML = html;
			tempDiv.style.position = 'absolute';
			tempDiv.style.left = '-9999px';
			tempDiv.style.width = '800px';
			document.body.appendChild(tempDiv);
			
			// 渲染为Canvas
			const canvas = await html2canvas(tempDiv, {
				scale: 2,
				logging: false
			});
			
			// 移除临时DOM
			document.body.removeChild(tempDiv);
			
			// 生成PDF
			const { jsPDF } = jspdf;
			const pdf = new jsPDF('p', 'mm', 'a4');
			const imgData = canvas.toDataURL('image/png');
			const imgWidth = 210; // A4宽度
			const imgHeight = (canvas.height * imgWidth) / canvas.width;
			
			pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
			
			return pdf.output('blob');
		} catch (error) {
			console.error('[DataExport] PDF导出失败:', error);
			throw error;
		}
		// #endif
		
		// #ifndef H5
		throw new Error('PDF导出仅支持H5端');
		// #endif
	}
	
	/**
	 * 生成HTML内容
	 * @param {Object} data
	 * @returns {string}
	 */
	generateHTML(data) {
		return `
			<div style="padding: 20px; font-family: Arial, sans-serif;">
				<h1 style="text-align: center; color: #333;">翎心CraneHeart - 用户数据导出</h1>
				<p style="text-align: center; color: #666;">导出时间: ${data.meta.exportTime}</p>
				
				<h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px;">用户信息</h2>
				<table style="width: 100%; border-collapse: collapse;">
					<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>用户ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.userInfo?.id || '-'}</td></tr>
					<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>昵称</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.userInfo?.nickname || '-'}</td></tr>
					<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>注册时间</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.userInfo?.registerTime || '-'}</td></tr>
				</table>
				
				<h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; margin-top: 20px;">评估记录 (${data.assessments?.length || 0}条)</h2>
				<ul>
					${(data.assessments || []).slice(0, 10).map(item => `<li>${item.scaleName} - ${item.level} (${item.score}分)</li>`).join('')}
				</ul>
				
				<h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; margin-top: 20px;">聊天会话 (${data.chatHistory?.length || 0}个)</h2>
				<ul>
					${(data.chatHistory || []).slice(0, 5).map(session => `<li>${session.sessionName} (${session.messageCount}条消息)</li>`).join('')}
				</ul>
				
				<h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; margin-top: 20px;">音乐收藏 (${data.musicHistory?.favorites?.length || 0}首)</h2>
				
				<h2 style="color: #4CAF50; border-bottom: 2px solid #4CAF50; padding-bottom: 5px; margin-top: 20px;">社区数据</h2>
				<p>发布话题: ${data.communityData?.topicCount || 0}条</p>
				<p>发表评论: ${data.communityData?.commentCount || 0}条</p>
			</div>
		`;
	}
	
	/**
	 * 下载PDF文件
	 * @param {Object} data
	 * @param {string} filename
	 */
	async download(data, filename = 'user_data.pdf') {
		// #ifdef H5
		const blob = await this.export(data);
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		link.click();
		URL.revokeObjectURL(url);
		return { success: true, path: filename };
		// #endif
		
		// #ifndef H5
		throw new Error('PDF导出仅支持H5端');
		// #endif
	}
}

/**
 * 数据导出管理器
 */
class DataExportManager {
	constructor() {
		this.collector = new DataCollector();
		this.jsonExporter = new JSONExporter();
		this.csvExporter = new CSVExporter();
		this.pdfExporter = new PDFExporter();
	}
	
	/**
	 * 导出为JSON
	 * @param {Object} options
	 * @returns {Promise<Object>}
	 */
	async exportToJSON(options = {}) {
		try {
			uni.showLoading({ title: '正在收集数据...' });
			
			const data = await this.collector.collectAllData();
			const result = await this.jsonExporter.download(
				data,
				options.filename || `craneheart_data_${Date.now()}.json`
			);
			
			// 记录导出历史
			await this.recordExportHistory('JSON', result.path);
			
			uni.hideLoading();
			uni.showToast({
				title: 'JSON导出成功',
				icon: 'success'
			});
			
			return result;
		} catch (error) {
			uni.hideLoading();
			uni.showToast({
				title: 'JSON导出失败',
				icon: 'none'
			});
			throw error;
		}
	}
	
	/**
	 * 导出为CSV
	 * @param {Object} options
	 * @returns {Promise<Object>}
	 */
	async exportToCSV(options = {}) {
		try {
			uni.showLoading({ title: '正在收集数据...' });
			
			const data = await this.collector.collectAllData();
			const result = await this.csvExporter.download(
				data,
				options.filename || `craneheart_data_${Date.now()}.csv`
			);
			
			// 记录导出历史
			await this.recordExportHistory('CSV', result.path);
			
			uni.hideLoading();
			uni.showToast({
				title: 'CSV导出成功',
				icon: 'success'
			});
			
			return result;
		} catch (error) {
			uni.hideLoading();
			uni.showToast({
				title: 'CSV导出失败',
				icon: 'none'
			});
			throw error;
		}
	}
	
	/**
	 * 导出为PDF（仅H5端）
	 * @param {Object} options
	 * @returns {Promise<Object>}
	 */
	async exportToPDF(options = {}) {
		try {
			// #ifndef H5
			uni.showToast({
				title: 'PDF导出仅支持H5端',
				icon: 'none'
			});
			throw new Error('PDF导出仅支持H5端');
			// #endif
			
			// #ifdef H5
			uni.showLoading({ title: '正在生成PDF...' });
			
			const data = await this.collector.collectAllData();
			const result = await this.pdfExporter.download(
				data,
				options.filename || `craneheart_data_${Date.now()}.pdf`
			);
			
			// 记录导出历史
			await this.recordExportHistory('PDF', result.path);
			
			uni.hideLoading();
			uni.showToast({
				title: 'PDF导出成功',
				icon: 'success'
			});
			
			return result;
			// #endif
		} catch (error) {
			uni.hideLoading();
			uni.showToast({
				title: 'PDF导出失败',
				icon: 'none'
			});
			throw error;
		}
	}
	
	/**
	 * 获取导出历史
	 * @returns {Promise<Array>}
	 */
	async getExportHistory() {
		try {
			return uni.getStorageSync('export_history') || [];
		} catch (error) {
			console.error('[DataExport] 获取导出历史失败:', error);
			return [];
		}
	}
	
	/**
	 * 记录导出历史
	 * @param {string} format
	 * @param {string} path
	 */
	async recordExportHistory(format, path) {
		try {
			const history = await this.getExportHistory();
			
			history.unshift({
				id: Date.now(),
				format: format,
				path: path,
				timestamp: new Date().toISOString()
			});
			
			// 只保留最近20条记录
			uni.setStorageSync('export_history', history.slice(0, 20));
		} catch (error) {
			console.error('[DataExport] 记录导出历史失败:', error);
		}
	}
	
	/**
	 * 清除导出历史
	 */
	async clearExportHistory() {
		try {
			uni.removeStorageSync('export_history');
		} catch (error) {
			console.error('[DataExport] 清除导出历史失败:', error);
		}
	}
}

// 创建单例
const dataExport = new DataExportManager();

export default dataExport;

