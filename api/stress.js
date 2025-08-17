/**
 * 压力检测相关API
 */
import request from './request.js';

// 获取压力检测历史记录
export const getStressRecords = (params) => {
  return request.get('/stress/records', params);
};

// 获取压力检测详情
export const getStressRecordDetail = (id) => {
  return request.get(`/stress/record/${id}`);
};

// 创建新的压力检测记录
export const createStressRecord = (data) => {
  return request.post('/stress/record', data);
};

// 上传表情图片进行分析
export const uploadFaceImage = (filePath) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: request.defaults.baseURL + '/stress/analyze/face',
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

// 上传语音进行分析
export const uploadVoice = (filePath) => {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: request.defaults.baseURL + '/stress/analyze/voice',
      filePath,
      name: 'voice',
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

// 提交文本分析
export const analyzeText = (text) => {
  return request.post('/stress/analyze/text', { text });
};

// 获取压力干预建议
export const getInterventionSuggestions = (stressLevel) => {
  return request.get('/stress/intervention/suggestions', { stressLevel });
}; 