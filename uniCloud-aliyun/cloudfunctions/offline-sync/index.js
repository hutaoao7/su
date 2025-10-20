/**
 * offline-sync 云函数
 * 
 * 功能：处理客户端离线数据的同步
 * 
 * 支持的操作：
 * 1. save_assessment - 保存评估结果
 * 2. save_chat - 保存聊天记录  
 * 3. update_profile - 更新用户资料
 * 4. upload_feedback - 上传用户反馈
 * 5. batch_sync - 批量同步多个操作
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  console.log('[offline-sync] 收到同步请求:', event);
  
  // 获取客户端信息
  const clientIP = context.CLIENTIP;
  const clientUA = context.CLIENTUA;
  
  // 验证Token
  const token = event.token || event.uniIdToken;
  if (!token) {
    return {
      code: 401,
      message: '未授权：缺少token'
    };
  }
  
  // 验证用户身份
  let userInfo;
  try {
    const uniID = uniCloud.uniID({
      clientInfo: context.CLIENTINFO
    });
    
    const verifyResult = await uniID.checkToken(token);
    if (verifyResult.code !== 0) {
      return {
        code: 401,
        message: '未授权：token无效'
      };
    }
    
    userInfo = verifyResult.userInfo;
  } catch (e) {
    console.error('[offline-sync] Token验证失败:', e);
    return {
      code: 401,
      message: 'Token验证失败'
    };
  }
  
  const userId = userInfo.uid;
  const { action, data, batchItems } = event;
  
  // 记录同步日志
  const syncLog = {
    user_id: userId,
    action,
    client_ip: clientIP,
    client_ua: clientUA,
    sync_time: new Date(),
    status: 'pending'
  };
  
  try {
    let result;
    
    // 根据操作类型分发处理
    switch (action) {
      case 'save_assessment':
        result = await handleSaveAssessment(userId, data);
        break;
        
      case 'save_chat':
        result = await handleSaveChat(userId, data);
        break;
        
      case 'update_profile':
        result = await handleUpdateProfile(userId, data);
        break;
        
      case 'upload_feedback':
        result = await handleUploadFeedback(userId, data, clientIP);
        break;
        
      case 'batch_sync':
        result = await handleBatchSync(userId, batchItems);
        break;
        
      default:
        return {
          code: 400,
          message: `不支持的操作类型: ${action}`
        };
    }
    
    // 更新同步日志
    syncLog.status = 'success';
    syncLog.result = result;
    await saveSyncLog(syncLog);
    
    return {
      code: 0,
      message: '同步成功',
      data: result
    };
    
  } catch (e) {
    console.error('[offline-sync] 同步失败:', e);
    
    // 记录失败日志
    syncLog.status = 'failed';
    syncLog.error = e.message;
    await saveSyncLog(syncLog);
    
    return {
      code: 500,
      message: '同步失败: ' + e.message
    };
  }
};

/**
 * 处理保存评估结果
 */
async function handleSaveAssessment(userId, data) {
  const { scaleId, answers, score, level, completedAt } = data;
  
  // 验证必填字段
  if (!scaleId || !answers) {
    throw new Error('缺少必填字段: scaleId, answers');
  }
  
  // 检查是否已存在（防止重复提交）
  const existing = await db.collection('assessment_results')
    .where({
      user_id: userId,
      scale_id: scaleId,
      completed_at: completedAt
    })
    .get();
  
  if (existing.data.length > 0) {
    return {
      id: existing.data[0]._id,
      duplicate: true
    };
  }
  
  // 保存评估结果
  const result = await db.collection('assessment_results').add({
    user_id: userId,
    scale_id: scaleId,
    score: score || 0,
    level: level || '',
    completed_at: completedAt || new Date(),
    created_at: new Date(),
    source: 'offline_sync'
  });
  
  // 保存答案详情
  const answerRecords = answers.map((answer, index) => ({
    result_id: result.id,
    user_id: userId,
    question_id: answer.questionId || index + 1,
    answer_value: answer.value,
    created_at: new Date()
  }));
  
  if (answerRecords.length > 0) {
    await db.collection('assessment_answers').add(answerRecords);
  }
  
  return {
    id: result.id,
    saved: true
  };
}

/**
 * 处理保存聊天记录
 */
async function handleSaveChat(userId, data) {
  const { sessionId, messages } = data;
  
  if (!sessionId || !messages || !Array.isArray(messages)) {
    throw new Error('缺少必填字段: sessionId, messages');
  }
  
  // 确保会话存在
  const session = await db.collection('chat_sessions')
    .where({ _id: sessionId, user_id: userId })
    .get();
  
  if (session.data.length === 0) {
    // 创建新会话
    await db.collection('chat_sessions').add({
      _id: sessionId,
      user_id: userId,
      title: '离线会话',
      created_at: new Date(),
      updated_at: new Date()
    });
  }
  
  // 批量保存消息
  const messageRecords = messages.map(msg => ({
    session_id: sessionId,
    user_id: userId,
    role: msg.role || 'user',
    content: msg.content,
    timestamp: msg.timestamp || new Date(),
    created_at: new Date(),
    source: 'offline_sync'
  }));
  
  // 检查重复（根据timestamp去重）
  const existingMessages = await db.collection('chat_messages')
    .where({
      session_id: sessionId,
      user_id: userId
    })
    .field({ timestamp: true })
    .get();
  
  const existingTimestamps = new Set(
    existingMessages.data.map(m => new Date(m.timestamp).getTime())
  );
  
  const newMessages = messageRecords.filter(
    msg => !existingTimestamps.has(new Date(msg.timestamp).getTime())
  );
  
  if (newMessages.length > 0) {
    await db.collection('chat_messages').add(newMessages);
  }
  
  return {
    saved: newMessages.length,
    duplicate: messageRecords.length - newMessages.length
  };
}

/**
 * 处理更新用户资料
 */
async function handleUpdateProfile(userId, data) {
  const { nickname, avatar, gender, birthDate, bio } = data;
  
  // 构建更新数据
  const updateData = {
    updated_at: new Date()
  };
  
  if (nickname !== undefined) updateData.nickname = nickname;
  if (avatar !== undefined) updateData.avatar_url = avatar;
  if (gender !== undefined) updateData.gender = gender;
  if (birthDate !== undefined) updateData.birth_date = birthDate;
  if (bio !== undefined) updateData.bio = bio;
  
  // 更新用户资料
  const result = await db.collection('user_profiles')
    .where({ user_id: userId })
    .update(updateData);
  
  if (result.updated === 0) {
    // 如果没有更新记录，可能是首次创建
    await db.collection('user_profiles').add({
      user_id: userId,
      ...updateData,
      created_at: new Date()
    });
  }
  
  return {
    updated: true
  };
}

/**
 * 处理上传反馈
 */
async function handleUploadFeedback(userId, data, clientIP) {
  const { type, content, contact, attachments } = data;
  
  if (!type || !content) {
    throw new Error('缺少必填字段: type, content');
  }
  
  // 保存反馈
  const result = await db.collection('user_feedbacks').add({
    user_id: userId,
    type,
    content,
    contact: contact || '',
    attachments: attachments || [],
    client_ip: clientIP,
    status: 'pending',
    created_at: new Date()
  });
  
  return {
    id: result.id,
    submitted: true
  };
}

/**
 * 处理批量同步
 */
async function handleBatchSync(userId, batchItems) {
  if (!Array.isArray(batchItems) || batchItems.length === 0) {
    throw new Error('批量同步项为空');
  }
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < batchItems.length; i++) {
    const item = batchItems[i];
    
    try {
      let result;
      
      switch (item.action) {
        case 'save_assessment':
          result = await handleSaveAssessment(userId, item.data);
          break;
          
        case 'save_chat':
          result = await handleSaveChat(userId, item.data);
          break;
          
        case 'update_profile':
          result = await handleUpdateProfile(userId, item.data);
          break;
          
        case 'upload_feedback':
          result = await handleUploadFeedback(userId, item.data, '');
          break;
          
        default:
          throw new Error(`不支持的操作: ${item.action}`);
      }
      
      results.push({
        index: i,
        itemId: item.id,
        action: item.action,
        success: true,
        result
      });
      
    } catch (e) {
      console.error(`[offline-sync] 批量同步第${i}项失败:`, e);
      
      errors.push({
        index: i,
        itemId: item.id,
        action: item.action,
        success: false,
        error: e.message
      });
    }
  }
  
  return {
    total: batchItems.length,
    success: results.length,
    failed: errors.length,
    results,
    errors
  };
}

/**
 * 保存同步日志
 */
async function saveSyncLog(logData) {
  try {
    await db.collection('sync_logs').add(logData);
  } catch (e) {
    console.error('[offline-sync] 保存同步日志失败:', e);
    // 日志保存失败不影响主流程
  }
}

