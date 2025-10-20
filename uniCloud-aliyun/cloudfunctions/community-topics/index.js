'use strict';

/**
 * 获取社区话题列表
 */

const { getSupabaseClient } = require('../common/supabase-client');
const { verifyToken } = require('../common/auth');

exports.main = async (event, context) => {
  const TAG = '[community-topics]';
  
  try {
    console.log(TAG, '========== 请求开始 ==========');
    console.log(TAG, '请求参数:', JSON.stringify(event, null, 2));
    
    // 验证token（可选，允许游客浏览）
    const authResult = verifyToken(context);
    const userId = authResult.success ? authResult.uid : null;
    
    // 获取分页参数
    const {
      page = 1,
      pageSize = 10,
      category = 'all',
      sortBy = 'latest'
    } = event;
    
    // 计算offset
    const offset = (page - 1) * pageSize;
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 构建查询
    let query = supabase
      .from('community_topics')
      .select(`
        id,
        title,
        content,
        category,
        tags,
        author_id,
        author_name,
        author_avatar,
        likes_count,
        comments_count,
        views_count,
        is_pinned,
        created_at,
        updated_at
      `, { count: 'exact' });
    
    // 分类筛选
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    
    // 只查询已发布的话题
    query = query.eq('status', 'published');
    
    // 排序
    switch (sortBy) {
      case 'hot':
        query = query.order('likes_count', { ascending: false });
        break;
      case 'views':
        query = query.order('views_count', { ascending: false });
        break;
      case 'latest':
      default:
        query = query.order('created_at', { ascending: false });
        break;
    }
    
    // 置顶优先
    query = query.order('is_pinned', { ascending: false });
    
    // 分页
    query = query.range(offset, offset + pageSize - 1);
    
    const { data: topics, error, count } = await query;
    
    if (error) {
      console.error(TAG, '查询话题列表失败:', error);
      return {
        errCode: -1,
        errMsg: '查询失败: ' + error.message
      };
    }
    
    // 如果用户已登录，查询用户的点赞状态
    let userLikes = [];
    if (userId && topics.length > 0) {
      const topicIds = topics.map(t => t.id);
      const { data: likes } = await supabase
        .from('community_likes')
        .select('topic_id')
        .eq('user_id', userId)
        .in('topic_id', topicIds);
      
      userLikes = likes ? likes.map(l => l.topic_id) : [];
    }
    
    // 处理返回数据
    const processedTopics = topics.map(topic => ({
      ...topic,
      isLiked: userLikes.includes(topic.id),
      // 截取内容摘要
      contentSummary: topic.content.length > 100 
        ? topic.content.substring(0, 100) + '...' 
        : topic.content
    }));
    
    console.log(TAG, `查询成功，返回${topics.length}条话题`);
    console.log(TAG, '========== 请求结束 ==========');
    
    return {
      errCode: 0,
      errMsg: '获取成功',
      data: {
        list: processedTopics,
        total: count,
        page: page,
        pageSize: pageSize,
        hasMore: offset + topics.length < count
      }
    };
    
  } catch (error) {
    console.error(TAG, '执行错误:', error);
    return {
      errCode: -1,
      errMsg: '系统错误: ' + error.message
    };
  }
};
