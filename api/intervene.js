/**
 * 干预相关API
 */
import request from './request.js';

// 获取干预项目列表
export const getInterventions = () => {
  return request.get('/intervene/list');
};

// 获取干预详情
export const getInterventionDetail = (id) => {
  return request.get(`/intervene/detail/${id}`);
};

// 记录干预使用记录
export const recordIntervention = (data) => {
  return request.post('/intervene/record', data);
};

// 获取冥想列表
export const getMeditations = () => {
  return request.get('/intervene/meditations');
};

// 获取自然音乐列表
export const getNatureSounds = () => {
  return request.get('/intervene/nature-sounds');
};

// 获取AI聊天对话历史
export const getChatHistory = (params) => {
  return request.get('/intervene/chat/history', params);
};

// 发送AI聊天消息
export const sendChatMessage = (message) => {
  return request.post('/intervene/chat/message', { message });
};

// 评价干预效果
export const rateIntervention = (interventionId, rating, feedback) => {
  return request.post('/intervene/rate', {
    interventionId,
    rating,
    feedback
  });
};

// 获取用户干预记录
export const getUserInterventions = (params) => {
  return request.get('/intervene/user-records', params);
}; 