'use strict';

const crypto = require('crypto')
const db = uniCloud.database()

/**
 * 撤回同意和账号注销云函数
 * 功能：
 * 1. 撤回指定的同意项
 * 2. 提交账号注销申请
 * 3. 记录撤回历史
 * 4. 处理冷静期逻辑
 */
exports.main = async (event, context) => {
  const { action, token, ...params } = event
  
  try {
    // 验证Token
    if (!token) {
      return {
        code: 401,
        message: '未授权访问'
      }
    }
    
    // 验证用户身份
    const userInfo = await verifyToken(token)
    if (!userInfo) {
      return {
        code: 401,
        message: 'Token无效或已过期'
      }
    }
    
    // 根据操作类型处理
    switch (action) {
      case 'revoke_consent':
        return await handleRevokeConsent(userInfo, params)
        
      case 'delete_account':
        return await handleDeleteAccount(userInfo, params)
        
      case 'cancel_deletion':
        return await handleCancelDeletion(userInfo, params)
        
      case 'check_status':
        return await checkRevokeStatus(userInfo)
        
      default:
        return {
          code: 400,
          message: '无效的操作类型'
        }
    }
  } catch (error) {
    console.error('consent-revoke error:', error)
    return {
      code: 500,
      message: error.message || '服务器错误'
    }
  }
}

/**
 * 验证Token
 */
async function verifyToken(token) {
  try {
    // 查询用户会话
    const sessionRes = await db.collection('user_sessions')
      .where({
        token: token,
        is_valid: true
      })
      .get()
    
    if (sessionRes.data.length === 0) {
      return null
    }
    
    const session = sessionRes.data[0]
    
    // 检查是否过期
    if (session.expires_at < Date.now()) {
      // 标记会话无效
      await db.collection('user_sessions')
        .doc(session._id)
        .update({
          is_valid: false
        })
      return null
    }
    
    // 获取用户信息
    const userRes = await db.collection('users')
      .doc(session.user_id)
      .get()
    
    if (userRes.data.length === 0) {
      return null
    }
    
    return userRes.data[0]
  } catch (error) {
    console.error('Token验证失败:', error)
    return null
  }
}

/**
 * 处理撤回同意
 */
async function handleRevokeConsent(userInfo, params) {
  const {
    revokedItems = [],
    reason = '',
    customReason = '',
    timestamp = Date.now(),
    deviceInfo = {}
  } = params
  
  if (revokedItems.length === 0) {
    return {
      code: 400,
      message: '请选择要撤回的同意项'
    }
  }
  
  const transaction = await db.startTransaction()
  
  try {
    // 记录撤回日志
    const logData = {
      user_id: userInfo._id,
      action_type: 'revoke_consent',
      revoked_items: revokedItems,
      reason: reason,
      custom_reason: customReason,
      device_info: {
        ...deviceInfo,
        ip: context.CLIENTIP || ''
      },
      status: 'completed',
      created_at: timestamp,
      updated_at: timestamp
    }
    
    await transaction.collection('consent_revoke_logs').add(logData)
    
    // 更新用户的同意记录
    for (const item of revokedItems) {
      // 查找该用户对应同意项的记录
      const consentRes = await transaction.collection('consent_records')
        .where({
          user_id: userInfo._id,
          agreement_type: item,
          status: 'agreed'
        })
        .get()
      
      if (consentRes.data.length > 0) {
        // 更新为撤回状态
        await transaction.collection('consent_records')
          .doc(consentRes.data[0]._id)
          .update({
            status: 'revoked',
            revoked_at: timestamp,
            revoke_reason: reason,
            updated_at: timestamp
          })
      }
    }
    
    // 根据撤回的同意项，可能需要限制某些功能
    if (revokedItems.includes('privacy') || revokedItems.includes('user')) {
      // 标记用户账号状态为受限
      await transaction.collection('users')
        .doc(userInfo._id)
        .update({
          account_status: 'restricted',
          restricted_features: revokedItems,
          updated_at: timestamp
        })
    }
    
    await transaction.commit()
    
    return {
      code: 200,
      message: '撤回成功',
      data: {
        revokedItems,
        timestamp,
        logId: logData._id
      }
    }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

/**
 * 处理账号注销
 */
async function handleDeleteAccount(userInfo, params) {
  const {
    reason = '',
    customReason = '',
    confirmDelete = false,
    timestamp = Date.now(),
    deviceInfo = {}
  } = params
  
  if (!confirmDelete) {
    return {
      code: 400,
      message: '请确认删除操作'
    }
  }
  
  const transaction = await db.startTransaction()
  
  try {
    // 检查是否已有进行中的注销申请
    const existingDeletion = await transaction.collection('consent_revoke_logs')
      .where({
        user_id: userInfo._id,
        action_type: 'delete_account',
        status: 'pending'
      })
      .get()
    
    if (existingDeletion.data.length > 0) {
      return {
        code: 400,
        message: '您已有进行中的注销申请'
      }
    }
    
    // 创建注销申请记录
    const deletionData = {
      user_id: userInfo._id,
      action_type: 'delete_account',
      reason: reason,
      custom_reason: customReason,
      device_info: {
        ...deviceInfo,
        ip: context.CLIENTIP || ''
      },
      status: 'pending',
      // 7天冷静期
      scheduled_at: timestamp + (7 * 24 * 60 * 60 * 1000),
      created_at: timestamp,
      updated_at: timestamp
    }
    
    const logRes = await transaction.collection('consent_revoke_logs').add(deletionData)
    
    // 更新用户状态为待注销
    await transaction.collection('users')
      .doc(userInfo._id)
      .update({
        account_status: 'pending_deletion',
        deletion_scheduled_at: deletionData.scheduled_at,
        updated_at: timestamp
      })
    
    // 发送通知邮件（如果有邮箱）
    if (userInfo.email) {
      // TODO: 调用邮件发送服务
      console.log(`发送注销确认邮件到: ${userInfo.email}`)
    }
    
    await transaction.commit()
    
    return {
      code: 200,
      message: '注销申请已提交',
      data: {
        requestId: logRes.id,
        scheduledAt: deletionData.scheduled_at,
        cooldownDays: 7
      }
    }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

/**
 * 取消注销申请
 */
async function handleCancelDeletion(userInfo, params) {
  const { timestamp = Date.now() } = params
  
  const transaction = await db.startTransaction()
  
  try {
    // 查找进行中的注销申请
    const deletionRes = await transaction.collection('consent_revoke_logs')
      .where({
        user_id: userInfo._id,
        action_type: 'delete_account',
        status: 'pending'
      })
      .get()
    
    if (deletionRes.data.length === 0) {
      return {
        code: 400,
        message: '没有进行中的注销申请'
      }
    }
    
    const deletion = deletionRes.data[0]
    
    // 更新注销申请状态为已取消
    await transaction.collection('consent_revoke_logs')
      .doc(deletion._id)
      .update({
        status: 'cancelled',
        cancelled_at: timestamp,
        updated_at: timestamp
      })
    
    // 恢复用户账号状态
    await transaction.collection('users')
      .doc(userInfo._id)
      .update({
        account_status: 'active',
        deletion_scheduled_at: db.command.remove(),
        updated_at: timestamp
      })
    
    await transaction.commit()
    
    return {
      code: 200,
      message: '注销申请已取消',
      data: {
        requestId: deletion._id,
        cancelledAt: timestamp
      }
    }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

/**
 * 检查撤回状态
 */
async function checkRevokeStatus(userInfo) {
  try {
    // 获取最新的撤回记录
    const revokeRes = await db.collection('consent_revoke_logs')
      .where({
        user_id: userInfo._id
      })
      .orderBy('created_at', 'desc')
      .limit(10)
      .get()
    
    // 获取当前同意状态
    const consentRes = await db.collection('consent_records')
      .where({
        user_id: userInfo._id,
        status: 'revoked'
      })
      .get()
    
    // 检查是否有进行中的注销申请
    const pendingDeletion = revokeRes.data.find(
      log => log.action_type === 'delete_account' && log.status === 'pending'
    )
    
    return {
      code: 200,
      data: {
        revokeLogs: revokeRes.data,
        revokedConsents: consentRes.data.map(c => c.agreement_type),
        hasPendingDeletion: !!pendingDeletion,
        deletionScheduledAt: pendingDeletion?.scheduled_at || null
      }
    }
  } catch (error) {
    throw error
  }
}

/**
 * 定时任务：处理到期的账号注销
 * 这个函数由定时触发器调用
 */
exports.processScheduledDeletions = async () => {
  const now = Date.now()
  
  try {
    // 查找到期的注销申请
    const pendingRes = await db.collection('consent_revoke_logs')
      .where({
        action_type: 'delete_account',
        status: 'pending',
        scheduled_at: db.command.lte(now)
      })
      .get()
    
    console.log(`找到 ${pendingRes.data.length} 个待处理的注销申请`)
    
    for (const deletion of pendingRes.data) {
      try {
        // 执行数据删除
        await deleteUserData(deletion.user_id)
        
        // 更新注销记录状态
        await db.collection('consent_revoke_logs')
          .doc(deletion._id)
          .update({
            status: 'completed',
            completed_at: now,
            updated_at: now
          })
        
        console.log(`用户 ${deletion.user_id} 的数据已删除`)
      } catch (error) {
        console.error(`处理用户 ${deletion.user_id} 的注销失败:`, error)
        
        // 记录错误
        await db.collection('consent_revoke_logs')
          .doc(deletion._id)
          .update({
            status: 'failed',
            error_message: error.message,
            updated_at: now
          })
      }
    }
    
    return {
      code: 200,
      processed: pendingRes.data.length
    }
  } catch (error) {
    console.error('处理定时注销任务失败:', error)
    return {
      code: 500,
      error: error.message
    }
  }
}

/**
 * 删除用户数据
 */
async function deleteUserData(userId) {
  const transaction = await db.startTransaction()
  
  try {
    // 删除用户基本信息
    await transaction.collection('users').doc(userId).remove()
    
    // 删除用户资料
    await transaction.collection('user_profiles')
      .where({ user_id: userId })
      .remove()
    
    // 删除用户设置
    await transaction.collection('user_settings')
      .where({ user_id: userId })
      .remove()
    
    // 删除评估记录
    await transaction.collection('assessments')
      .where({ user_id: userId })
      .remove()
    
    // 删除评估答案
    await transaction.collection('assessment_answers')
      .where({ user_id: userId })
      .remove()
    
    // 删除聊天记录
    await transaction.collection('chat_sessions')
      .where({ user_id: userId })
      .remove()
    
    await transaction.collection('chat_messages')
      .where({ user_id: userId })
      .remove()
    
    // 删除社区内容
    await transaction.collection('community_topics')
      .where({ author_id: userId })
      .remove()
    
    await transaction.collection('community_comments')
      .where({ user_id: userId })
      .remove()
    
    // 删除收藏记录
    await transaction.collection('user_music_favorites')
      .where({ user_id: userId })
      .remove()
    
    // 删除会话记录
    await transaction.collection('user_sessions')
      .where({ user_id: userId })
      .remove()
    
    // 删除同意记录（保留撤回日志用于审计）
    await transaction.collection('consent_records')
      .where({ user_id: userId })
      .remove()
    
    await transaction.commit()
    
    console.log(`用户 ${userId} 的所有数据已删除`)
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
