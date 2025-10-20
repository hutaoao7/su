/**
 * 用户数据导出云函数
 * 
 * 功能说明：
 * 1. 从数据库查询用户的所有数据
 * 2. 权限验证和身份认证
 * 3. 记录导出日志
 * 4. 支持邮件发送（可选）
 * 
 * @author CraneHeart Team
 * @date 2025-10-20
 */

'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
	console.log('[user-data-export] 请求参数:', event);
	
	const { operation, dataTypes, format, encrypted } = event;
	
	try {
		// 1. 验证Token并获取用户信息
		const user = await verifyToken(event.token);
		if (!user) {
			return {
				code: 401,
				message: '未授权，请先登录',
				data: null
			};
		}
		
		const userId = user.uid;
		
		// 2. 根据operation执行不同操作
		switch (operation) {
			case 'export':
				// 导出数据
				return await handleExport(userId, dataTypes, format, encrypted);
			
			case 'get_history':
				// 获取导出历史
				return await getExportHistory(userId);
			
			case 'send_email':
				// 发送邮件（可选功能）
				return await sendExportEmail(userId, event.exportId);
			
			default:
				return {
					code: 400,
					message: '不支持的操作类型',
					data: null
				};
		}
		
	} catch (error) {
		console.error('[user-data-export] 错误:', error);
		return {
			code: 500,
			message: error.message || '服务器错误',
			data: null
		};
	}
};

/**
 * 验证Token
 */
async function verifyToken(token) {
	if (!token) {
		return null;
	}
	
	try {
		const res = await db.collection('users')
			.where({
				token: token
			})
			.limit(1)
			.get();
		
		if (res.data && res.data.length > 0) {
			return res.data[0];
		}
		
		return null;
	} catch (error) {
		console.error('[user-data-export] 验证Token失败:', error);
		return null;
	}
}

/**
 * 处理数据导出
 */
async function handleExport(userId, dataTypes, format, encrypted) {
	try {
		// 1. 收集数据
		const exportData = {
			metadata: {
				exportTime: new Date().toISOString(),
				userId: userId,
				dataTypes: dataTypes,
				format: format,
				encrypted: encrypted
			}
		};
		
		// 判断是否导出所有数据
		const exportAll = dataTypes.includes('all');
		
		// 2. 收集各类数据
		if (exportAll || dataTypes.includes('profile')) {
			exportData.profile = await collectProfileData(userId);
		}
		
		if (exportAll || dataTypes.includes('assessments')) {
			exportData.assessments = await collectAssessmentData(userId);
		}
		
		if (exportAll || dataTypes.includes('chats')) {
			exportData.chats = await collectChatData(userId);
		}
		
		if (exportAll || dataTypes.includes('music')) {
			exportData.music = await collectMusicData(userId);
		}
		
		if (exportAll || dataTypes.includes('community')) {
			exportData.community = await collectCommunityData(userId);
		}
		
		if (exportAll || dataTypes.includes('cdk')) {
			exportData.cdk = await collectCDKData(userId);
		}
		
		if (exportAll || dataTypes.includes('consent')) {
			exportData.consent = await collectConsentData(userId);
		}
		
		// 3. 记录导出日志
		const exportLog = await recordExportLog(userId, {
			dataTypes,
			format,
			encrypted,
			dataSize: JSON.stringify(exportData).length,
			timestamp: new Date()
		});
		
		// 4. 返回导出数据
		return {
			code: 0,
			message: '导出成功',
			data: {
				exportId: exportLog.id,
				exportData: exportData
			}
		};
		
	} catch (error) {
		console.error('[user-data-export] 导出数据失败:', error);
		throw error;
	}
}

/**
 * 收集用户基本信息
 */
async function collectProfileData(userId) {
	try {
		// 查询用户表
		const userRes = await db.collection('users')
			.where({ _id: userId })
			.field({
				password: false,
				token: false
			})
			.get();
		
		// 查询用户资料表
		const profileRes = await db.collection('user_profiles')
			.where({ user_id: userId })
			.get();
		
		// 查询用户设置表
		const settingsRes = await db.collection('user_settings')
			.where({ user_id: userId })
			.get();
		
		return {
			basic: userRes.data[0] || null,
			profile: profileRes.data[0] || null,
			settings: settingsRes.data[0] || null
		};
	} catch (error) {
		console.error('[user-data-export] 收集用户信息失败:', error);
		return null;
	}
}

/**
 * 收集评估数据
 */
async function collectAssessmentData(userId) {
	try {
		// 查询评估记录
		const assessmentRes = await db.collection('assessments')
			.where({ user_id: userId })
			.orderBy('created_at', 'desc')
			.get();
		
		// 查询评估结果
		const resultRes = await db.collection('assessment_results')
			.where({ user_id: userId })
			.orderBy('created_at', 'desc')
			.get();
		
		return {
			records: assessmentRes.data || [],
			results: resultRes.data || [],
			count: assessmentRes.data.length
		};
	} catch (error) {
		console.error('[user-data-export] 收集评估数据失败:', error);
		return null;
	}
}

/**
 * 收集AI对话数据
 */
async function collectChatData(userId) {
	try {
		// 查询会话
		const sessionRes = await db.collection('chat_sessions')
			.where({ user_id: userId })
			.orderBy('updated_at', 'desc')
			.get();
		
		// 查询消息（限制最近1000条）
		const messageRes = await db.collection('chat_messages')
			.where({ user_id: userId })
			.orderBy('created_at', 'desc')
			.limit(1000)
			.get();
		
		return {
			sessions: sessionRes.data || [],
			messages: messageRes.data || [],
			sessionCount: sessionRes.data.length,
			messageCount: messageRes.data.length
		};
	} catch (error) {
		console.error('[user-data-export] 收集聊天数据失败:', error);
		return null;
	}
}

/**
 * 收集音乐数据
 */
async function collectMusicData(userId) {
	try {
		// 查询收藏
		const favoriteRes = await db.collection('user_music_favorites')
			.where({ user_id: userId })
			.get();
		
		// 查询播放历史（限制最近500条）
		const historyRes = await db.collection('user_music_history')
			.where({ user_id: userId })
			.orderBy('played_at', 'desc')
			.limit(500)
			.get();
		
		return {
			favorites: favoriteRes.data || [],
			history: historyRes.data || [],
			favoriteCount: favoriteRes.data.length,
			historyCount: historyRes.data.length
		};
	} catch (error) {
		console.error('[user-data-export] 收集音乐数据失败:', error);
		return null;
	}
}

/**
 * 收集社区数据
 */
async function collectCommunityData(userId) {
	try {
		// 查询话题
		const topicRes = await db.collection('community_topics')
			.where({ user_id: userId })
			.orderBy('created_at', 'desc')
			.get();
		
		// 查询评论
		const commentRes = await db.collection('community_comments')
			.where({ user_id: userId })
			.orderBy('created_at', 'desc')
			.get();
		
		// 查询点赞
		const likeRes = await db.collection('community_likes')
			.where({ user_id: userId })
			.get();
		
		return {
			topics: topicRes.data || [],
			comments: commentRes.data || [],
			likes: likeRes.data || [],
			topicCount: topicRes.data.length,
			commentCount: commentRes.data.length,
			likeCount: likeRes.data.length
		};
	} catch (error) {
		console.error('[user-data-export] 收集社区数据失败:', error);
		return null;
	}
}

/**
 * 收集CDK数据
 */
async function collectCDKData(userId) {
	try {
		// 查询兑换记录
		const redeemRes = await db.collection('cdk_redeem_records')
			.where({ user_id: userId })
			.orderBy('redeemed_at', 'desc')
			.get();
		
		return {
			records: redeemRes.data || [],
			count: redeemRes.data.length
		};
	} catch (error) {
		console.error('[user-data-export] 收集CDK数据失败:', error);
		return null;
	}
}

/**
 * 收集同意记录
 */
async function collectConsentData(userId) {
	try {
		// 查询同意记录
		const consentRes = await db.collection('consent_records')
			.where({ user_id: userId })
			.orderBy('created_at', 'desc')
			.get();
		
		// 查询撤回记录
		const revokeRes = await db.collection('consent_revoke_logs')
			.where({ user_id: userId })
			.get();
		
		return {
			records: consentRes.data || [],
			revokes: revokeRes.data || [],
			recordCount: consentRes.data.length,
			revokeCount: revokeRes.data.length
		};
	} catch (error) {
		console.error('[user-data-export] 收集同意记录失败:', error);
		return null;
	}
}

/**
 * 记录导出日志
 */
async function recordExportLog(userId, logData) {
	try {
		const res = await db.collection('data_export_logs').add({
			user_id: userId,
			data_types: logData.dataTypes,
			format: logData.format,
			encrypted: logData.encrypted,
			data_size: logData.dataSize,
			status: 'completed',
			created_at: logData.timestamp,
			expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30天后过期
		});
		
		return {
			id: res.id
		};
	} catch (error) {
		console.error('[user-data-export] 记录导出日志失败:', error);
		return { id: null };
	}
}

/**
 * 获取导出历史
 */
async function getExportHistory(userId) {
	try {
		const res = await db.collection('data_export_logs')
			.where({ user_id: userId })
			.orderBy('created_at', 'desc')
			.limit(50)
			.get();
		
		return {
			code: 0,
			message: '获取成功',
			data: res.data || []
		};
	} catch (error) {
		console.error('[user-data-export] 获取导出历史失败:', error);
		return {
			code: 500,
			message: '获取失败',
			data: []
		};
	}
}

/**
 * 发送导出邮件（可选功能）
 */
async function sendExportEmail(userId, exportId) {
	// TODO: 实现邮件发送功能
	// 需要配置邮件服务（如阿里云邮件推送、SendGrid等）
	
	return {
		code: 0,
		message: '邮件发送功能暂未开启',
		data: null
	};
}
