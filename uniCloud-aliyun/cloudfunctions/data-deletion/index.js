'use strict';

const db = uniCloud.database();
const auth = require('../common/auth');

/**
 * 数据删除云函数
 * 处理用户数据删除、撤销等操作
 */
exports.main = async (event, context) => {
  console.log('[data-deletion] 请求参数:', event);
  
  const { action, token, timestamp, deviceInfo } = event;
  
  try {
    // 验证Token并获取用户信息
    const userInfo = await auth.verifyToken(token);
    if (!userInfo) {
      return {
        code: 401,
        message: '未授权，请先登录'
      };
    }
    
    // 根据action执行不同操作
    switch (action) {
      case 'get_deletion_list':
        // 任务2: 获取删除清单
        return await getDeletionList(userInfo);
      
      case 'confirm_deletion':
        // 任务2: 确认删除
        return await confirmDataDeletion(userInfo, { timestamp, deviceInfo });
      
      case 'undo_deletion':
        // 任务2: 撤销删除
        return await undoDeletion(userInfo, { timestamp });
      
      default:
        return {
          code: 400,
          message: '不支持的操作类型'
        };
    }
  } catch (error) {
    console.error('[data-deletion] 错误:', error);
    return {
      code: 500,
      message: error.message || '服务器错误'
    };
  }
};

/**
 * 任务2: 获取删除清单
 */
async function getDeletionList(userInfo) {
  try {
    const userId = userInfo._id || userInfo.uid;
    
    // 统计各类数据数量
    const [
      profileRes,
      assessmentsRes,
      chatRes,
      communityRes,
      favoritesRes
    ] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('assessments').where({ user_id: userId }).count(),
      db.collection('chat_messages').where({ user_id: userId }).count(),
      db.collection('community_posts').where({ user_id: userId }).count(),
      db.collection('favorites').where({ user_id: userId }).count()
    ]);
    
    return {
      code: 200,
      message: '获取成功',
      data: {
        profile: { count: profileRes.data ? 1 : 0 },
        assessments: { count: assessmentsRes.total || 0 },
        chat: { count: chatRes.total || 0 },
        community: { count: communityRes.total || 0 },
        favorites: { count: favoritesRes.total || 0 }
      }
    };
  } catch (error) {
    console.error('[data-deletion] 获取删除清单失败:', error);
    return {
      code: 500,
      message: '获取删除清单失败'
    };
  }
}

/**
 * 任务2: 确认数据删除
 */
async function confirmDataDeletion(userInfo, params) {
  const { timestamp, deviceInfo } = params;
  const userId = userInfo._id || userInfo.uid;
  
  const transaction = await db.startTransaction();
  
  try {
    // 创建删除任务记录
    const deletionData = {
      user_id: userId,
      action_type: 'delete_data',
      status: 'pending',
      scheduled_at: timestamp + (7 * 24 * 60 * 60 * 1000), // 7天后执行
      device_info: {
        ...deviceInfo,
        ip: context.CLIENTIP || ''
      },
      created_at: timestamp,
      updated_at: timestamp
    };
    
    const logRes = await transaction.collection('data_deletion_tasks').add(deletionData);
    
    // 更新用户状态
    await transaction.collection('users')
      .doc(userId)
      .update({
        data_deletion_scheduled_at: deletionData.scheduled_at,
        updated_at: timestamp
      });
    
    await transaction.commit();
    
    console.log('[data-deletion] 删除任务已创建:', logRes.id);
    
    return {
      code: 200,
      message: '删除任务已创建',
      data: {
        deletionId: logRes.id,
        scheduledAt: deletionData.scheduled_at,
        cooldownDays: 7
      }
    };
  } catch (error) {
    await transaction.rollback();
    console.error('[data-deletion] 创建删除任务失败:', error);
    
    return {
      code: 500,
      message: '创建删除任务失败'
    };
  }
}

/**
 * 任务2: 撤销删除
 */
async function undoDeletion(userInfo, params) {
  const { timestamp } = params;
  const userId = userInfo._id || userInfo.uid;
  
  const transaction = await db.startTransaction();
  
  try {
    // 查找进行中的删除任务
    const deletionRes = await transaction.collection('data_deletion_tasks')
      .where({
        user_id: userId,
        status: 'pending'
      })
      .get();
    
    if (deletionRes.data.length === 0) {
      return {
        code: 400,
        message: '没有进行中的删除任务'
      };
    }
    
    const deletion = deletionRes.data[0];
    
    // 检查是否在7天内
    const daysPassed = (timestamp - new Date(deletion.created_at).getTime()) / (24 * 60 * 60 * 1000);
    if (daysPassed >= 7) {
      return {
        code: 400,
        message: '撤销期已过期'
      };
    }
    
    // 更新删除任务状态为已取消
    await transaction.collection('data_deletion_tasks')
      .doc(deletion._id)
      .update({
        status: 'cancelled',
        cancelled_at: timestamp,
        updated_at: timestamp
      });
    
    // 清除用户的删除计划
    await transaction.collection('users')
      .doc(userId)
      .update({
        data_deletion_scheduled_at: db.command.remove(),
        updated_at: timestamp
      });
    
    await transaction.commit();
    
    console.log('[data-deletion] 删除任务已取消:', deletion._id);
    
    return {
      code: 200,
      message: '撤销成功',
      data: {
        deletionId: deletion._id
      }
    };
  } catch (error) {
    await transaction.rollback();
    console.error('[data-deletion] 撤销删除失败:', error);
    
    return {
      code: 500,
      message: '撤销删除失败'
    };
  }
}

