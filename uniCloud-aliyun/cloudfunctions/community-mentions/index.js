'use strict';

const db = uniCloud.database();
const _ = db.command;

/**
 * 社区@用户提醒云函数
 * 功能：处理@用户提醒的记录、查询、标记已读等操作
 */

exports.main = async (event, context) => {
  const { action, ...params } = event;
  const userId = context.auth?.uid || '';

  try {
    switch (action) {
      case 'list':
        return await getMentionsList(userId, params);
      case 'getUnreadCount':
        return await getUnreadCount(userId);
      case 'markAsRead':
        return await markAsRead(params.mention_id);
      case 'markAllAsRead':
        return await markAllAsRead(userId);
      case 'create':
        return await createMentions(params);
      default:
        return {
          errCode: 400,
          errMsg: '未知操作'
        };
    }
  } catch (error) {
    console.error('[MENTIONS] 错误:', error);
    return {
      errCode: 500,
      errMsg: '服务器错误: ' + error.message
    };
  }
};

/**
 * 获取提醒列表
 */
async function getMentionsList(userId, params) {
  const { page = 1, pageSize = 10 } = params;
  const skip = (page - 1) * pageSize;

  try {
    // 查询用户的@提醒
    const res = await db.collection('user_mentions')
      .where({
        mentioned_user_id: userId
      })
      .orderBy('created_at', 'desc')
      .skip(skip)
      .limit(pageSize + 1)
      .get();

    const list = res.data.slice(0, pageSize);
    const hasMore = res.data.length > pageSize;

    return {
      errCode: 0,
      errMsg: 'success',
      data: {
        list,
        hasMore
      }
    };
  } catch (error) {
    console.error('[GET_MENTIONS_LIST] 失败:', error);
    return {
      errCode: 500,
      errMsg: '获取失败: ' + error.message
    };
  }
}

/**
 * 获取未读提醒数量
 */
async function getUnreadCount(userId) {
  try {
    const res = await db.collection('user_mentions')
      .where({
        mentioned_user_id: userId,
        is_read: false
      })
      .count();

    return {
      errCode: 0,
      errMsg: 'success',
      data: {
        unread_count: res.total
      }
    };
  } catch (error) {
    console.error('[GET_UNREAD_COUNT] 失败:', error);
    return {
      errCode: 500,
      errMsg: '获取失败: ' + error.message
    };
  }
}

/**
 * 标记单条提醒为已读
 */
async function markAsRead(mentionId) {
  try {
    await db.collection('user_mentions')
      .doc(mentionId)
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      });

    return {
      errCode: 0,
      errMsg: 'success'
    };
  } catch (error) {
    console.error('[MARK_AS_READ] 失败:', error);
    return {
      errCode: 500,
      errMsg: '标记失败: ' + error.message
    };
  }
}

/**
 * 标记所有提醒为已读
 */
async function markAllAsRead(userId) {
  try {
    await db.collection('user_mentions')
      .where({
        mentioned_user_id: userId,
        is_read: false
      })
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      });

    return {
      errCode: 0,
      errMsg: 'success'
    };
  } catch (error) {
    console.error('[MARK_ALL_AS_READ] 失败:', error);
    return {
      errCode: 500,
      errMsg: '标记失败: ' + error.message
    };
  }
}

/**
 * 创建@提醒记录
 * 在评论创建时调用
 */
async function createMentions(params) {
  const {
    comment_id,
    topic_id,
    mentioned_users = [],
    mentioned_by_user_id,
    mentioned_by_user_name,
    comment_content,
    topic_title
  } = params;

  if (!comment_id || !topic_id || mentioned_users.length === 0) {
    return {
      errCode: 400,
      errMsg: '参数不完整'
    };
  }

  try {
    // 为每个被@的用户创建提醒记录
    const mentions = mentioned_users.map(userId => ({
      comment_id,
      topic_id,
      mentioned_user_id: userId,
      mentioned_by_user_id,
      mentioned_by_user_name,
      comment_content,
      comment_preview: (comment_content || '').substring(0, 200),
      topic_title,
      is_read: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // 批量插入
    await db.collection('user_mentions').add(mentions);

    return {
      errCode: 0,
      errMsg: 'success',
      data: {
        count: mentions.length
      }
    };
  } catch (error) {
    console.error('[CREATE_MENTIONS] 失败:', error);
    return {
      errCode: 500,
      errMsg: '创建失败: ' + error.message
    };
  }
}

