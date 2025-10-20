/**
 * uniCloud统一请求封装
 * 支持 uniCloud.callFunction 和 uniCloud.importObject
 * 统一响应格式：{ code, msg, data }
 */

// Mock开关 - 开发时可设为true进行前端调试
const USE_MOCK = false;

// Mock数据
const MOCK_DATA = {
  'auth-login': { code: 0, msg: 'ok', data: { token: 'mock_token_123', openid: 'mock_openid', unionid: 'mock_unionid' } },
  'auth-validate': { code: 0, msg: 'ok', data: { valid: true, expiresAt: Date.now() + 86400000 } },
  'fn-music': {
    categories: { code: 0, msg: 'ok', data: ['relax', 'focus', 'sleep'] },
    list: { code: 0, msg: 'ok', data: { list: [
      { _id: '1', title: '轻松冥想', duration: 300, cover: '/static/music/cover1.jpg', trialUrl: '/static/music/trial1.mp3', fullUrl: '/static/music/full1.mp3', locked: false },
      { _id: '2', title: '专注音乐', duration: 600, cover: '/static/music/cover2.jpg', trialUrl: '/static/music/trial2.mp3', fullUrl: '/static/music/full2.mp3', locked: true }
    ], total: 2 } },
    detail: { code: 0, msg: 'ok', data: { _id: '1', title: '轻松冥想', intro: '帮助放松身心的冥想音乐', scenes: ['睡前', '工作'], progressSec: 0, isFav: false, fullUrl: '/static/music/full1.mp3', cover: '/static/music/cover1.jpg', duration: 300 } },
    progress: { code: 0, msg: 'ok', data: true },
    fav: { code: 0, msg: 'ok', data: true }
  },
  'fn-cdk': {
    redeem: { code: 0, msg: 'ok', data: { items: ['music_1', 'music_2'], unlocked: true } }
  },
  'fn-screening': {
    questions: { code: 0, msg: 'ok', data: { type: 'study', items: [
      { qid: 1, text: '最近学习压力如何？', scale: [0, 1, 2, 3] },
      { qid: 2, text: '是否经常感到焦虑？', scale: [0, 1, 2, 3] }
    ] } },
    submit: { code: 0, msg: 'ok', data: { level: 'mid', tips: '建议适当放松，保持良好作息' } }
  },
  'fn-ai': {
    sessionStart: { code: 0, msg: 'ok', data: { sessionId: 'session_123' } },
    message: { code: 0, msg: 'ok', data: { replies: [{ role: 'assistant', text: '我理解你的感受，让我们一起来分析一下...' }], next: 'assess' } }
  },
  'fn-feedback': {
    submit: { code: 0, msg: 'ok', data: true }
  },
  'fn-subscribe': {
    daily: { code: 0, msg: 'ok', data: true }
  }
};

class UniCloudRequest {
  constructor() {
    this.timeout = 10000;
  }

  // 获取token
  getToken() {
    return uni.getStorageSync('token') || '';
  }

  // 设置token
  setToken(token) {
    uni.setStorageSync('token', token);
  }

  // 清除token
  clearToken() {
    uni.removeStorageSync('token');
    uni.removeStorageSync('user');
  }

  // 处理401未登录
  handleUnauthorized() {
    this.clearToken();
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    });
    // 跳转到授权页面
    uni.navigateTo({ 
      url: '/pages/login/login?from=' + encodeURIComponent(getCurrentPages()[getCurrentPages().length - 1].route)
    });
  }

  // 统一错误处理
  handleError(error, showToast = true) {
    console.error('uniCloud请求错误:', error);
    
    let message = '网络异常，请稍后重试';
    
    if (error.code === 40002 || error.code === 401) {
      this.handleUnauthorized();
      return;
    }
    
    // 处理CONFIG_ERROR，提供详细的配置缺失信息
    if (error.msg === 'CONFIG_ERROR' || error.message === 'CONFIG_ERROR') {
      if (error.code === 5000) {
        message = '配置错误：缺少微信小程序配置';
        error.configError = '缺少 appid 或 secret 配置';
      } else if (error.code === 50001) {
        message = '配置错误：缺少应用配置';
        error.configError = '缺少 appid 或 appsecret';
      } else {
        message = '系统配置错误，请联系管理员';
        error.configError = '未知配置错误';
      }
    } else if (error.message) {
      message = error.message;
    } else if (error.msg) {
      message = error.msg;
    }
    
    // 保留原始错误信息
    if (error.errMsg) {
      error.originalErrMsg = error.errMsg;
    }
    if (error.errmsg) {
      error.originalErrmsg = error.errmsg;
    }
    
    if (showToast) {
      uni.showToast({
        title: message,
        icon: 'none'
      });
    }
    
    throw error;
  }

  // 核心请求方法 - callFunction方式
  async callFunction(name, data = {}, options = {}) {
    const { showLoading = false, showToast = true } = options;
    
    // Mock模式
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500)); // 模拟网络延迟
      
      const mockKey = data.action ? `${name}.${data.action}` : name;
      const mockResponse = MOCK_DATA[name]?.[data.action] || MOCK_DATA[name] || { code: 0, msg: 'ok', data: null };
      
      console.log(`[MOCK] ${name}:`, data, '→', mockResponse);
      return mockResponse;
    }

    if (showLoading) {
      uni.showLoading({ title: '请求中...' });
    }

    try {
      const result = await uniCloud.callFunction({
        name,
        data,
        timeout: this.timeout
      });

      if (showLoading) {
        uni.hideLoading();
      }

      // 统一响应格式处理
      const response = result.result;
      
      if (response.code !== 0) {
        this.handleError(response, showToast);
      }

      return response;
    } catch (error) {
      if (showLoading) {
        uni.hideLoading();
      }
      
      this.handleError(error, showToast);
    }
  }

  // importObject方式（推荐）
  async importObject(name, method, data = {}, options = {}) {
    const { showLoading = false, showToast = true } = options;
    
    // Mock模式
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockResponse = MOCK_DATA[name]?.[method] || { code: 0, msg: 'ok', data: null };
      console.log(`[MOCK] ${name}.${method}:`, data, '→', mockResponse);
      return mockResponse;
    }

    if (showLoading) {
      uni.showLoading({ title: '请求中...' });
    }

    try {
      const obj = uniCloud.importObject(name);
      const result = await obj[method](data);

      if (showLoading) {
        uni.hideLoading();
      }

      // 统一响应格式处理
      if (result.code !== 0) {
        this.handleError(result, showToast);
      }

      return result;
    } catch (error) {
      if (showLoading) {
        uni.hideLoading();
      }
      
      this.handleError(error, showToast);
    }
  }
}

// 创建实例
const request = new UniCloudRequest();

// 业务API封装
export const authAPI = {
  // 登录
  login: (data) => request.callFunction('auth-login', data),
  
  // 验证token
  validate: () => request.callFunction('auth-validate', {}, { showToast: false }),
  
  // 微信登录
  wechatLogin: (data) => request.callFunction('auth-login', data)
};

export const musicAPI = {
  // 获取分类
  categories: () => request.callFunction('fn-music', { action: 'categories' }),
  
  // 获取音乐列表
  list: (category, page = 1, pageSize = 20) => 
    request.callFunction('fn-music', { action: 'list', category, page, pageSize }),
  
  // 获取音乐详情
  detail: (id) => request.callFunction('fn-music', { action: 'detail', id }),
  
  // 更新播放进度
  progress: (id, sec) => request.callFunction('fn-music', { action: 'progress', id, sec }, { showToast: false }),
  
  // 收藏/取消收藏
  fav: (id, fav) => request.callFunction('fn-music', { action: 'fav', id, fav })
};

export const cdkAPI = {
  // 兑换CDK
  redeem: (cdk) => request.callFunction('fn-cdk', { action: 'redeem', cdk }, { showLoading: true })
};

export const screeningAPI = {
  // 获取题目
  questions: (type) => request.callFunction('fn-screening', { action: 'questions', type }),
  
  // 提交答案
  submit: (type, answers, timeMs) => 
    request.callFunction('fn-screening', { action: 'submit', type, answers, timeMs }, { showLoading: true })
};

export const aiAPI = {
  // 开始会话
  sessionStart: (scene) => request.callFunction('fn-ai', { action: 'sessionStart', scene }),
  
  // 发送消息
  message: (sessionId, text) => 
    request.callFunction('fn-ai', { action: 'message', sessionId, text }, { showLoading: true })
};

export const feedbackAPI = {
  // 提交反馈
  submit: (type, text, contact) => 
    request.callFunction('fn-feedback', { action: 'submit', type, text, contact }, { showLoading: true })
};

export const subscribeAPI = {
  // 每日订阅
  daily: (enable) => request.callFunction('fn-subscribe', { action: 'daily', enable })
};

// 导出请求实例和Mock开关控制
export { request, USE_MOCK };
export default request;