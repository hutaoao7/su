/**
 * 用户数据导出云函数
 * 
 * 功能：
 * 1. 汇总用户所有数据
 * 2. 支持JSON/CSV导出
 * 3. 自动脱敏敏感信息
 * 4. 记录导出历史
 * 5. 频率限制（24小时5次）
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
	const { action, format, options = {} } = event;
	const { uid } = context;
	
	// Token验证
	if (!uid) {
		return {
			code: 401,
			message: '未授权，请先登录'
		};
	}
	
	try {
		switch (action) {
			case 'export':
				return await handleExport(uid, format, options, event);
			case 'getHistory':
				return await getExportHistory(uid);
			case 'download':
				return await downloadExport(uid, event.exportId);
			default:
				return {
					code: 40001,
					message: '不支持的操作类型'
				};
		}
	} catch (error) {
		console.error('导出错误:', error);
		return {
			code: 50001,
			message: error.message || '服务器错误',
			data: null
		};
	}
};

/**
 * 处理数据导出
 */
async function handleExport(uid, format, options, event) {
	// 1. 检查频率限制
	const rateLimitCheck = await checkRateLimit(uid);
	if (!rateLimitCheck.allowed) {
		return {
			code: 40006,
			message: `导出频率限制，请${rateLimitCheck.waitTime}分钟后重试`,
			data: null
		};
	}
	
	// 2. 验证导出格式
	if (!['JSON', 'CSV'].includes(format)) {
		return {
			code: 40002,
			message: '不支持的导出格式，仅支持JSON和CSV',
			data: null
		};
	}
	
	// 3. 创建导出记录
	const exportLog = await createExportLog(uid, format, event);
	
	try {
		// 4. 收集用户数据
		const userData = await collectUserData(uid, options);
		
		// 5. 生成导出文件
		const fileInfo = await generateExportFile(userData, format);
		
		// 6. 上传到云存储
		const uploadResult = await uploadToCloudStorage(fileInfo, uid, exportLog.id);
		
		// 7. 更新导出记录为成功
		await updateExportLog(exportLog.id, {
			export_status: 'completed',
			file_size: fileInfo.size,
			file_path: uploadResult.url,
			data_items: userData.stats,
			completed_at: new Date()
		});
		
		return {
			code: 0,
			message: '导出成功',
			data: {
				exportId: exportLog.id,
				format: format,
				fileSize: fileInfo.size,
				downloadUrl: uploadResult.url,
				expiresAt: uploadResult.expiresAt,
				dataItems: userData.stats
			}
		};
	} catch (error) {
		// 更新导出记录为失败
		await updateExportLog(exportLog.id, {
			export_status: 'failed',
			error_message: error.message
		});
		
		throw error;
	}
}

/**
 * 检查频率限制（24小时内最多5次）
 */
async function checkRateLimit(uid) {
	const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
	
	const recentExports = await db.collection('data_export_logs')
		.where({
			user_id: uid,
			created_at: dbCmd.gte(oneDayAgo)
		})
		.count();
	
	const allowed = recentExports.total < 5;
	
	if (!allowed) {
		// 计算需要等待的时间
		const oldestExport = await db.collection('data_export_logs')
			.where({
				user_id: uid,
				created_at: dbCmd.gte(oneDayAgo)
			})
			.orderBy('created_at', 'asc')
			.limit(1)
			.get();
		
		if (oldestExport.data.length > 0) {
			const waitTime = Math.ceil(
				(new Date(oldestExport.data[0].created_at).getTime() + 24 * 60 * 60 * 1000 - Date.now()) / 60000
			);
			return { allowed: false, waitTime };
		}
	}
	
	return { allowed: true };
}

/**
 * 创建导出记录
 */
async function createExportLog(uid, format, event) {
	const result = await db.collection('data_export_logs').add({
		user_id: uid,
		export_format: format,
		export_status: 'processing',
		ip_address: event.context?.CLIENTIP || null,
		user_agent: event.context?.['user-agent'] || null,
		created_at: new Date()
	});
	
	return { id: result.id };
}

/**
 * 收集用户数据
 */
async function collectUserData(uid, options) {
	const {
		includeChats = true,
		includeAssessments = true,
		maskSensitive = true
	} = options;
	
	const data = {
		meta: {
			exportTime: new Date().toISOString(),
			exportVersion: '1.0.0',
			userId: uid
		},
		stats: {}
	};
	
	// 收集用户基本信息
	try {
		const userInfo = await db.collection('users')
			.doc(uid)
			.field({
				id: true,
				nickname: true,
				avatar_url: true,
				created_at: true
			})
			.get();
		
		if (userInfo.data.length > 0) {
			data.userInfo = userInfo.data[0];
			data.stats.userInfo = 1;
		}
	} catch (error) {
		console.error('收集用户信息失败:', error);
		data.userInfo = null;
		data.stats.userInfo = 0;
	}
	
	// 收集评估记录
	if (includeAssessments) {
		try {
			const assessments = await db.collection('assessments')
				.where({ user_id: uid })
				.orderBy('created_at', 'desc')
				.get();
			
			data.assessments = assessments.data;
			data.stats.assessments = assessments.data.length;
		} catch (error) {
			console.error('收集评估记录失败:', error);
			data.assessments = [];
			data.stats.assessments = 0;
		}
	}
	
	// 收集聊天记录
	if (includeChats) {
		try {
			const chatSessions = await db.collection('chat_sessions')
				.where({ user_id: uid })
				.get();
			
			const chats = [];
			let totalMessages = 0;
			
			for (const session of chatSessions.data) {
				const messages = await db.collection('chat_messages')
					.where({ session_id: session.id })
					.orderBy('created_at', 'asc')
					.limit(100) // 每个会话最多100条消息
					.get();
				
				chats.push({
					session: session,
					messages: maskSensitive ? sanitizeMessages(messages.data) : messages.data
				});
				
				totalMessages += messages.data.length;
			}
			
			data.chatHistory = chats;
			data.stats.chatSessions = chatSessions.data.length;
			data.stats.chatMessages = totalMessages;
		} catch (error) {
			console.error('收集聊天记录失败:', error);
			data.chatHistory = [];
			data.stats.chatSessions = 0;
			data.stats.chatMessages = 0;
		}
	}
	
	// 收集音乐收藏
	try {
		const musicFavorites = await db.collection('user_music_favorites')
			.where({ user_id: uid })
			.get();
		
		data.musicFavorites = musicFavorites.data;
		data.stats.musicFavorites = musicFavorites.data.length;
	} catch (error) {
		console.error('收集音乐收藏失败:', error);
		data.musicFavorites = [];
		data.stats.musicFavorites = 0;
	}
	
	// 收集社区数据
	try {
		const communityTopics = await db.collection('community_topics')
			.where({ author_id: uid })
			.get();
		
		data.communityTopics = communityTopics.data;
		data.stats.communityTopics = communityTopics.data.length;
	} catch (error) {
		console.error('收集社区数据失败:', error);
		data.communityTopics = [];
		data.stats.communityTopics = 0;
	}
	
	return data;
}

/**
 * 脱敏处理消息
 */
function sanitizeMessages(messages) {
	return messages.map(msg => ({
		...msg,
		content: sanitizeContent(msg.content || '')
	}));
}

/**
 * 内容脱敏
 */
function sanitizeContent(content) {
	if (!content) return '';
	
	// 移除手机号
	content = content.replace(/1[3-9]\d{9}/g, '***手机号***');
	
	// 移除身份证号
	content = content.replace(/\d{17}[\dXx]/g, '***身份证号***');
	
	// 移除邮箱
	content = content.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***邮箱***');
	
	return content;
}

/**
 * 生成导出文件
 */
async function generateExportFile(userData, format) {
	let fileContent;
	let mimeType;
	let extension;
	
	switch (format) {
		case 'JSON':
			fileContent = JSON.stringify(userData, null, 2);
			mimeType = 'application/json';
			extension = 'json';
			break;
		
		case 'CSV':
			fileContent = convertToCSV(userData);
			mimeType = 'text/csv';
			extension = 'csv';
			break;
		
		default:
			throw new Error('不支持的导出格式');
	}
	
	return {
		content: fileContent,
		size: Buffer.byteLength(fileContent, 'utf8'),
		mimeType,
		extension
	};
}

/**
 * 转换为CSV格式
 */
function convertToCSV(userData) {
	let csv = '\uFEFF'; // 添加BOM以支持Excel打开中文
	
	// 元数据
	csv += '# 导出元数据\n';
	csv += `导出时间,${userData.meta.exportTime}\n`;
	csv += `用户ID,${userData.meta.userId}\n`;
	csv += '\n';
	
	// 统计信息
	csv += '# 数据统计\n';
	csv += '数据类型,数量\n';
	csv += Object.entries(userData.stats)
		.map(([key, value]) => `${key},${value}`)
		.join('\n');
	csv += '\n\n';
	
	// 评估记录
	if (userData.assessments && userData.assessments.length > 0) {
		csv += '# 评估记录\n';
		csv += 'ID,量表名称,分数,等级,创建时间\n';
		userData.assessments.forEach(item => {
			csv += `${item.id || ''},${escapeCSV(item.scale_name)},${item.score || ''},${escapeCSV(item.level)},${item.created_at || ''}\n`;
		});
		csv += '\n';
	}
	
	// 聊天会话统计
	if (userData.chatHistory && userData.chatHistory.length > 0) {
		csv += '# 聊天会话统计\n';
		csv += '会话ID,会话名称,消息数量,创建时间\n';
		userData.chatHistory.forEach(chat => {
			csv += `${chat.session.id},${escapeCSV(chat.session.name)},${chat.messages.length},${chat.session.created_at}\n`;
		});
		csv += '\n';
	}
	
	return csv;
}

/**
 * CSV值转义
 */
function escapeCSV(value) {
	if (value === null || value === undefined) return '';
	
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
 * 上传到云存储
 */
async function uploadToCloudStorage(fileInfo, uid, exportId) {
	const cloudPath = `exports/${uid}/${Date.now()}_${exportId}.${fileInfo.extension}`;
	
	// 使用uniCloud上传文件
	const result = await uniCloud.uploadFile({
		cloudPath: cloudPath,
		fileContent: Buffer.from(fileInfo.content, 'utf8')
	});
	
	// 生成临时下载链接（7天有效）
	const tempFileURL = await uniCloud.getTempFileURL({
		fileList: [result.fileID],
		maxAge: 7 * 24 * 60 * 60 // 7天
	});
	
	return {
		url: tempFileURL.fileList[0].tempFileURL,
		expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
	};
}

/**
 * 更新导出记录
 */
async function updateExportLog(exportId, updates) {
	await db.collection('data_export_logs')
		.doc(exportId)
		.update(updates);
}

/**
 * 获取导出历史
 */
async function getExportHistory(uid) {
	const history = await db.collection('data_export_logs')
		.where({ user_id: uid })
		.orderBy('created_at', 'desc')
		.limit(20)
		.get();
	
	return {
		code: 0,
		message: '获取成功',
		data: history.data
	};
}

/**
 * 下载导出文件
 */
async function downloadExport(uid, exportId) {
	const exportLog = await db.collection('data_export_logs')
		.doc(exportId)
		.get();
	
	if (exportLog.data.length === 0) {
		return {
			code: 40001,
			message: '导出记录不存在',
			data: null
		};
	}
	
	const log = exportLog.data[0];
	
	if (log.user_id !== uid) {
		return {
			code: 40003,
			message: '无权访问此导出',
			data: null
		};
	}
	
	if (log.export_status !== 'completed') {
		return {
			code: 40004,
			message: '导出未完成或已失败',
			data: null
		};
	}
	
	// 检查是否过期
	if (log.expires_at && new Date(log.expires_at) < new Date()) {
		return {
			code: 40005,
			message: '导出文件已过期',
			data: null
		};
	}
	
	return {
		code: 0,
		message: '获取成功',
		data: {
			downloadUrl: log.file_path,
			fileSize: log.file_size,
			format: log.export_format,
			createdAt: log.created_at,
			expiresAt: log.expires_at
		}
	};
}

