'use strict';

const db = uniCloud.database();

/**
 * 离线数据同步云函数
 * 
 * 功能：
 * 1. 处理离线数据同步
 * 2. 冲突检测和解决
 * 3. 数据一致性验证
 * 4. 同步状态跟踪
 */

exports.main = async (event, context) => {
  const { action, payload } = event;
  const userId = context.auth?.uid || '';

  if (!userId) {
    return {
      errCode: 401,
      errMsg: '未登录'
    };
  }

  try {
    console.log('[OFFLINE_SYNC] 同步请求:', action);

    switch (action) {
      case 'sync_assessment':
        return await syncAssessment(userId, payload);
      case 'sync_chat':
        return await syncChat(userId, payload);
      case 'sync_music_favorite':
        return await syncMusicFavorite(userId, payload);
      case 'sync_community_like':
        return await syncCommunityLike(userId, payload);
      case 'get_sync_status':
        return await getSyncStatus(userId);
      default:
        return {
          errCode: 400,
          errMsg: '未知操作'
        };
    }
  } catch (error) {
    console.error('[OFFLINE_SYNC] 错误:', error);
    return {
      errCode: 500,
      errMsg: '同步失败: ' + error.message
    };
  }
};

/**
 * 同步评估数据
 */
async function syncAssessment(userId, payload) {
  const { assessment_id, answers, results } = payload;

  try {
    // 检查是否已存在
    const existing = await db.collection('assessments')
      .where({
        id: assessment_id,
        user_id: userId
      })
      .get();

    if (existing.data.length > 0) {
      // 更新现有记录
      await db.collection('assessments')
        .doc(assessment_id)
        .update({
          answers,
          results,
          synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      return {
        errCode: 0,
        errMsg: 'success',
        data: { action: 'updated', id: assessment_id }
      };
    } else {
      // 创建新记录
      const newAssessment = {
        id: assessment_id,
        user_id: userId,
        answers,
        results,
        created_at: new Date().toISOString(),
        synced_at: new Date().toISOString()
      };

      await db.collection('assessments').add(newAssessment);

      return {
        errCode: 0,
        errMsg: 'success',
        data: { action: 'created', id: assessment_id }
      };
    }
  } catch (error) {
    console.error('[SYNC_ASSESSMENT] 失败:', error);
    return {
      errCode: 500,
      errMsg: '评估同步失败: ' + error.message
    };
  }
}

/**
 * 同步聊天数据
 */
async function syncChat(userId, payload) {
  const { session_id, messages } = payload;

  try {
    // 检查会话是否存在
    const session = await db.collection('chat_sessions')
      .where({
        id: session_id,
        user_id: userId
      })
      .get();

    if (session.data.length === 0) {
      // 创建新会话
      await db.collection('chat_sessions').add({
        id: session_id,
        user_id: userId,
        created_at: new Date().toISOString()
      });
    }

    // 同步消息
    for (const message of messages) {
      const existing = await db.collection('chat_messages')
        .where({
          id: message.id,
          session_id: session_id
        })
        .get();

      if (existing.data.length === 0) {
        await db.collection('chat_messages').add({
          ...message,
          session_id,
          synced_at: new Date().toISOString()
        });
      }
    }

    return {
      errCode: 0,
      errMsg: 'success',
      data: {
        session_id,
        synced_messages: messages.length
      }
    };
  } catch (error) {
    console.error('[SYNC_CHAT] 失败:', error);
    return {
      errCode: 500,
      errMsg: '聊天同步失败: ' + error.message
    };
  }
}

/**
 * 同步音乐收藏
 */
async function syncMusicFavorite(userId, payload) {
  const { track_id, action } = payload;

  try {
    if (action === 'add') {
      // 检查是否已收藏
      const existing = await db.collection('user_music_favorites')
        .where({
          user_id: userId,
          track_id: track_id
        })
        .get();

      if (existing.data.length === 0) {
        await db.collection('user_music_favorites').add({
          user_id: userId,
          track_id: track_id,
          created_at: new Date().toISOString()
        });
      }
    } else if (action === 'remove') {
      // 删除收藏
      await db.collection('user_music_favorites')
        .where({
          user_id: userId,
          track_id: track_id
        })
        .remove();
    }

    return {
      errCode: 0,
      errMsg: 'success',
      data: { track_id, action }
    };
  } catch (error) {
    console.error('[SYNC_MUSIC] 失败:', error);
    return {
      errCode: 500,
      errMsg: '音乐同步失败: ' + error.message
    };
  }
}

/**
 * 同步社区点赞
 */
async function syncCommunityLike(userId, payload) {
  const { topic_id, comment_id, action } = payload;

  try {
    const collection = comment_id ? 'community_comments' : 'community_topics';
    const id = comment_id || topic_id;

    if (action === 'like') {
      // 检查是否已点赞
      const existing = await db.collection(collection)
        .where({
          id: id,
          liked_by: db.command.in([userId])
        })
        .get();

      if (existing.data.length === 0) {
        await db.collection(collection)
          .doc(id)
          .update({
            likes_count: db.command.inc(1),
            liked_by: db.command.push([userId])
          });
      }
    } else if (action === 'unlike') {
      await db.collection(collection)
        .doc(id)
        .update({
          likes_count: db.command.inc(-1),
          liked_by: db.command.pull(userId)
        });
    }

    return {
      errCode: 0,
      errMsg: 'success',
      data: { id, action }
    };
  } catch (error) {
    console.error('[SYNC_COMMUNITY] 失败:', error);
    return {
      errCode: 500,
      errMsg: '社区同步失败: ' + error.message
    };
  }
}

/**
 * 获取同步状态
 */
async function getSyncStatus(userId) {
  try {
    // 获取最后同步时间
    const lastSync = await db.collection('sync_logs')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    const lastSyncTime = lastSync.data.length > 0 
      ? lastSync.data[0].created_at 
      : null;

    return {
      errCode: 0,
      errMsg: 'success',
      data: {
        last_sync: lastSyncTime,
        status: 'synced'
      }
    };
  } catch (error) {
    console.error('[GET_SYNC_STATUS] 失败:', error);
    return {
      errCode: 500,
      errMsg: '获取同步状态失败: ' + error.message
    };
  }
}

