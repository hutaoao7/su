/**
 * 社区相关API
 */
import { callFunction } from '@/utils/unicloud-handler.js';
import mockAdapter from './mock-adapter.js';

// 是否使用Mock数据（开发阶段）
const USE_MOCK = false; // 设置为false使用真实接口

/**
 * 获取话题列表
 */
export const getTopicList = async (params = {}) => {
  if (USE_MOCK) {
    return mockAdapter.getMockCommunityTopics(params.page, params.pageSize);
  }
  
  try {
    const res = await callFunction('community-topics', {
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      category: params.category || 'all',
      sortBy: params.sortBy || 'latest'
    });
    
    return res;
  } catch (error) {
    console.error('[API] 获取话题列表失败:', error);
    throw error;
  }
};

/**
 * 获取话题详情
 */
export const getTopicDetail = async (topicId) => {
  if (USE_MOCK) {
    return mockAdapter.getMockTopicDetail(topicId);
  }
  
  try {
    const res = await callFunction('community-detail', {
      topicId
    });
    
    return res;
  } catch (error) {
    console.error('[API] 获取话题详情失败:', error);
    throw error;
  }
};

/**
 * 点赞话题
 */
export const likeTopic = async (topicId) => {
  try {
    const res = await callFunction('community-like', {
      topicId,
      action: 'like'
    });
    
    return res;
  } catch (error) {
    console.error('[API] 点赞失败:', error);
    throw error;
  }
};

/**
 * 发布话题
 */
export const publishTopic = async (data) => {
  try {
    const res = await callFunction('community-publish', {
      title: data.title,
      content: data.content,
      category: data.category,
      tags: data.tags
    });
    
    return res;
  } catch (error) {
    console.error('[API] 发布话题失败:', error);
    throw error;
  }
};

/**
 * 发表评论
 */
export const addComment = async (topicId, content) => {
  try {
    const res = await callFunction('community-comment', {
      topicId,
      content
    });
    
    return res;
  } catch (error) {
    console.error('[API] 发表评论失败:', error);
    throw error;
  }
};

/**
 * 编辑话题
 */
export const updateTopic = async (topicId, data) => {
  try {
    const res = await callFunction('community-topics', {
      action: 'update',
      topic_id: topicId,
      title: data.title,
      content: data.content,
      category: data.category,
      images: data.images
    });
    
    return res;
  } catch (error) {
    console.error('[API] 编辑话题失败:', error);
    throw error;
  }
};

/**
 * 删除话题
 */
export const deleteTopic = async (topicId) => {
  try {
    const res = await callFunction('community-topics', {
      action: 'delete',
      topic_id: topicId
    });
    
    return res;
  } catch (error) {
    console.error('[API] 删除话题失败:', error);
    throw error;
  }
};

/**
 * 举报话题
 */
export const reportTopic = async (topicId, reason, description) => {
  try {
    const res = await callFunction('community-topics', {
      action: 'report',
      topic_id: topicId,
      reason,
      description
    });
    
    return res;
  } catch (error) {
    console.error('[API] 举报话题失败:', error);
    throw error;
  }
};