'use strict';

/**
 * 离线数据同步云函数
 * 
 * 功能：
 * 1. 接收离线期间产生的数据
 * 2. 数据冲突检测和处理
 * 3. 批量数据同步
 * 4. 同步状态跟踪
 * 
 * @param {object} event - 请求参数
 * @param {string} event.action - 操作类型（sync_single/sync_batch/check_conflict）
 * @param {string} event.storeType - 存储类型（scales/results/chats/user_data）
 * @param {string} event.key - 数据键
 * @param {any} event.data - 数据内容
 * @param {number} event.timestamp - 客户端时间戳
 * @param {array} event.items - 批量同步时的数据数组
 */

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action = 'sync_single', storeType, key, data, timestamp, items } = event;
  const { uid: userId } = context;  // Token验证，获取用户ID
  
  // 验证登录
  if (!userId) {
    return {
      errCode: 401,
      errMsg: '未登录，请先登录'
    };
  }
  
  try {
    switch (action) {
      case 'sync_single':
        // 同步单个数据项
        return await syncSingleData(userId, storeType, key, data, timestamp);
        
      case 'sync_batch':
        // 批量同步
        return await syncBatchData(userId, items);
        
      case 'check_conflict':
        // 检查冲突
        return await checkConflict(userId, storeType, key, timestamp);
        
      default:
        return {
          errCode: 400,
          errMsg: '未知操作类型'
        };
    }
  } catch (error) {
    console.error('[offline-sync] 错误:', error);
    return {
      errCode: 500,
      errMsg: '同步失败: ' + error.message
    };
  }
};

/**
 * 同步单个数据项
 */
async function syncSingleData(userId, storeType, key, data, timestamp) {
  console.log(`[offline-sync] 同步数据: ${storeType}/${key}, userId=${userId}`);
  
  // 验证参数
  if (!storeType || !key || !data) {
    return {
      errCode: 400,
      errMsg: '参数不完整'
    };
  }
  
  // 根据不同的storeType调用不同的处理函数
  switch (storeType) {
    case 'results':
      return await syncAssessmentResult(userId, key, data, timestamp);
      
    case 'chats':
      return await syncChatMessage(userId, key, data, timestamp);
      
    case 'user_data':
      return await syncUserData(userId, key, data, timestamp);
      
    case 'scales':
      // 量表数据不需要同步到服务器（只读数据）
      return {
        errCode: 0,
        errMsg: 'success',
        needSync: false
      };
      
    default:
      return {
        errCode: 400,
        errMsg: '不支持的数据类型: ' + storeType
      };
  }
}

/**
 * 批量同步数据
 */
async function syncBatchData(userId, items) {
  if (!Array.isArray(items) || items.length === 0) {
    return {
      errCode: 400,
      errMsg: '批量数据为空'
    };
  }
  
  console.log(`[offline-sync] 批量同步: ${items.length}条数据`);
  
  const results = {
    success: 0,
    failed: 0,
    conflicts: 0,
    items: []
  };
  
  // 逐个同步
  for (const item of items) {
    try {
      const result = await syncSingleData(
        userId,
        item.storeType,
        item.key,
        item.data,
        item.timestamp
      );
      
      if (result.errCode === 0) {
        results.success++;
      } else if (result.errCode === 409) {
        results.conflicts++;
      } else {
        results.failed++;
      }
      
      results.items.push({
        storeType: item.storeType,
        key: item.key,
        status: result.errCode === 0 ? 'success' : 'failed',
        errMsg: result.errMsg
      });
      
    } catch (error) {
      console.error(`[offline-sync] 批量同步失败:`, error);
      results.failed++;
      results.items.push({
        storeType: item.storeType,
        key: item.key,
        status: 'failed',
        errMsg: error.message
      });
    }
  }
  
  return {
    errCode: 0,
    errMsg: 'success',
    results
  };
}

/**
 * 检查数据冲突
 */
async function checkConflict(userId, storeType, key, clientTimestamp) {
  console.log(`[offline-sync] 检查冲突: ${storeType}/${key}`);
  
  // 根据storeType查询服务器端最新数据
  let collection = null;
  let queryField = null;
  
  switch (storeType) {
    case 'results':
      collection = 'assessment_results';
      queryField = 'result_id';
      break;
      
    case 'chats':
      collection = 'chat_messages';
      queryField = 'message_id';
      break;
      
    case 'user_data':
      collection = 'users';
      queryField = 'user_id';
      break;
      
    default:
      return {
        errCode: 400,
        errMsg: '不支持的数据类型'
      };
  }
  
  try {
    const result = await db.collection(collection)
      .where({
        [queryField]: key,
        user_id: userId
      })
      .field('updated_at')
      .get();
    
    if (result.data && result.data.length > 0) {
      const serverTimestamp = new Date(result.data[0].updated_at).getTime();
      
      // 服务器数据更新，存在冲突
      if (serverTimestamp > clientTimestamp) {
        return {
          errCode: 409,
          errMsg: 'conflict',
          conflict: true,
          serverTimestamp,
          clientTimestamp
        };
      }
    }
    
    // 无冲突
    return {
      errCode: 0,
      errMsg: 'no conflict',
      conflict: false
    };
    
  } catch (error) {
    console.error('[offline-sync] 冲突检查失败:', error);
    return {
      errCode: 500,
      errMsg: '冲突检查失败: ' + error.message
    };
  }
}

/**
 * 同步评估结果
 */
async function syncAssessmentResult(userId, resultId, data, timestamp) {
  try {
    // 检查是否已存在
    const existing = await db.collection('assessment_results')
      .where({
        result_id: resultId,
        user_id: userId
      })
      .get();
    
    const now = new Date();
    
    if (existing.data && existing.data.length > 0) {
      // 已存在，检查冲突
      const serverTimestamp = new Date(existing.data[0].updated_at).getTime();
      
      if (serverTimestamp > timestamp) {
        // 服务器数据更新，返回冲突
        return {
          errCode: 409,
          errMsg: 'conflict',
          serverData: existing.data[0]
        };
      }
      
      // 客户端数据更新，执行更新
      await db.collection('assessment_results')
        .where({
          result_id: resultId,
          user_id: userId
        })
        .update({
          ...data,
          updated_at: now,
          synced_at: now
        });
        
    } else {
      // 不存在，插入新记录
      await db.collection('assessment_results').add({
        result_id: resultId,
        user_id: userId,
        ...data,
        created_at: timestamp ? new Date(timestamp) : now,
        updated_at: now,
        synced_at: now
      });
    }
    
    return {
      errCode: 0,
      errMsg: 'success'
    };
    
  } catch (error) {
    console.error('[offline-sync] 同步评估结果失败:', error);
    return {
      errCode: 500,
      errMsg: '同步失败: ' + error.message
    };
  }
}

/**
 * 同步聊天消息
 */
async function syncChatMessage(userId, messageId, data, timestamp) {
  try {
    // 检查消息是否已存在
    const existing = await db.collection('chat_messages')
      .where({
        message_id: messageId,
        user_id: userId
      })
      .get();
    
    if (existing.data && existing.data.length > 0) {
      // 消息已存在，不需要重复同步
      return {
        errCode: 0,
        errMsg: 'message already exists',
        skipped: true
      };
    }
    
    // 插入新消息
    await db.collection('chat_messages').add({
      message_id: messageId,
      user_id: userId,
      ...data,
      created_at: timestamp ? new Date(timestamp) : new Date(),
      synced_at: new Date()
    });
    
    return {
      errCode: 0,
      errMsg: 'success'
    };
    
  } catch (error) {
    console.error('[offline-sync] 同步聊天消息失败:', error);
    return {
      errCode: 500,
      errMsg: '同步失败: ' + error.message
    };
  }
}

/**
 * 同步用户数据
 */
async function syncUserData(userId, key, data, timestamp) {
  try {
    // 根据key类型更新不同的字段
    const updateData = {};
    
    // 支持的用户数据类型
    const allowedFields = ['nickname', 'avatar', 'gender', 'birthday', 'bio'];
    
    if (allowedFields.includes(key)) {
      updateData[key] = data;
      updateData.updated_at = new Date();
      
      await db.collection('users')
        .doc(userId)
        .update(updateData);
        
      return {
        errCode: 0,
        errMsg: 'success'
      };
    } else {
      return {
        errCode: 400,
        errMsg: '不支持的用户数据字段: ' + key
      };
    }
    
  } catch (error) {
    console.error('[offline-sync] 同步用户数据失败:', error);
    return {
      errCode: 500,
      errMsg: '同步失败: ' + error.message
    };
  }
}

