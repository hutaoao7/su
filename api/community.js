/**
 * 社区相关API
 */
import request from './request.js';

// 获取社区帖子列表
export const getPosts = (params) => {
  return request.get('/community/posts', params);
};

// 获取帖子详情
export const getPostDetail = (id) => {
  return request.get(`/community/post/${id}`);
};

// 创建新帖子
export const createPost = (data) => {
  return request.post('/community/post', data);
};

// 上传帖子图片
export const uploadPostImage = (filePath) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: request.defaults.baseURL + '/community/upload/image',
      filePath,
      name: 'image',
      header: {
        'Authorization': `Bearer ${uni.getStorageSync('token') || ''}`,
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data);
            resolve(data);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(res);
        }
      },
      fail: reject
    });
  });
};

// 点赞帖子
export const likePost = (postId) => {
  return request.post(`/community/post/${postId}/like`);
};

// 取消点赞
export const unlikePost = (postId) => {
  return request.delete(`/community/post/${postId}/like`);
};

// 评论帖子
export const commentPost = (postId, content) => {
  return request.post(`/community/post/${postId}/comment`, { content });
};

// 获取帖子评论列表
export const getComments = (postId, params) => {
  return request.get(`/community/post/${postId}/comments`, params);
};

// 获取话题标签列表
export const getTopics = () => {
  return request.get('/community/topics');
}; 