/**
 * 统一错误消息管理
 * 提供用户友好的错误提示文案
 */

// 错误码映射表
const ERROR_MESSAGES = {
  // 网络错误
  'NETWORK_ERROR': '网络连接失败，请检查网络设置',
  'TIMEOUT': '请求超时，请稍后重试',
  'SERVER_ERROR': '服务器繁忙，请稍后重试',
  'REQUEST_FAILED': '请求失败，请稍后重试',
  
  // 登录认证
  'AUTH_FAILED': '登录失效，请重新登录',
  'TOKEN_EXPIRED': '登录已过期，请重新登录',
  'PERMISSION_DENIED': '权限不足，无法执行该操作',
  'LOGIN_REQUIRED': '请先登录',
  'WXLOGIN_FAILED': '微信登录失败，请重试',
  
  // 用户操作
  'USER_NOT_FOUND': '用户信息不存在',
  'PROFILE_UPDATE_FAILED': '资料更新失败，请重试',
  'AVATAR_UPLOAD_FAILED': '头像上传失败，请检查图片格式',
  'NICKNAME_INVALID': '昵称格式不正确',
  'PHONE_INVALID': '手机号格式不正确',
  
  // 评估相关
  'ASSESSMENT_LOAD_FAILED': '评估内容加载失败',
  'ASSESSMENT_SUBMIT_FAILED': '评估提交失败，请重试',
  'ASSESSMENT_NOT_FOUND': '评估记录不存在',
  'ASSESSMENT_INCOMPLETE': '请完成所有题目',
  
  // AI对话
  'AI_SERVICE_UNAVAILABLE': '智能助手暂时无法使用',
  'AI_RESPONSE_FAILED': '获取回复失败，请稍后重试',
  'MESSAGE_TOO_LONG': '消息内容过长，请精简后重试',
  'SENSITIVE_CONTENT': '消息包含敏感内容，请修改后发送',
  
  // CDK兑换
  'CDK_INVALID': '兑换码无效或已使用',
  'CDK_EXPIRED': '兑换码已过期',
  'CDK_USED': '该兑换码已被使用',
  'CDK_REDEEM_FAILED': '兑换失败，请稍后重试',
  
  // 社区功能
  'TOPIC_NOT_FOUND': '话题不存在或已删除',
  'COMMENT_FAILED': '评论发送失败',
  'LIKE_FAILED': '点赞失败，请重试',
  'CONTENT_VIOLATION': '内容违规，无法发布',
  
  // 文件操作
  'FILE_TOO_LARGE': '文件过大，请选择小于10MB的文件',
  'FILE_TYPE_INVALID': '文件格式不支持',
  'UPLOAD_FAILED': '文件上传失败，请重试',
  
  // 数据操作
  'DATA_LOAD_FAILED': '数据加载失败，请下拉刷新',
  'DATA_SAVE_FAILED': '保存失败，请重试',
  'DATA_DELETE_FAILED': '删除失败，请重试',
  'SYNC_FAILED': '数据同步失败',
  
  // 表单验证
  'FORM_INCOMPLETE': '请填写完整信息',
  'INPUT_INVALID': '输入内容格式不正确',
  'REQUIRED_FIELD': '该项为必填项',
  
  // 通用错误
  'UNKNOWN_ERROR': '出现未知错误，请重试',
  'OPERATION_FAILED': '操作失败，请重试',
  'FEATURE_UNAVAILABLE': '该功能暂不可用',
  'UNDER_MAINTENANCE': '系统维护中，请稍后访问'
};

// HTTP状态码对应的友好提示
const HTTP_STATUS_MESSAGES = {
  400: '请求参数错误',
  401: '请先登录',
  403: '权限不足',
  404: '请求的内容不存在',
  405: '操作不允许',
  408: '请求超时',
  409: '数据冲突',
  413: '数据过大',
  429: '操作太频繁，请稍后重试',
  500: '服务器错误',
  502: '服务暂时不可用',
  503: '服务维护中',
  504: '网络超时'
};

/**
 * 获取友好的错误提示
 * @param {String|Number|Object} error - 错误码、错误对象或HTTP状态码
 * @param {String} defaultMessage - 默认提示
 * @returns {String} 友好的错误提示文案
 */
function getFriendlyMessage(error, defaultMessage = '操作失败，请重试') {
  // 字符串错误码
  if (typeof error === 'string') {
    return ERROR_MESSAGES[error] || defaultMessage;
  }
  
  // HTTP状态码
  if (typeof error === 'number') {
    return HTTP_STATUS_MESSAGES[error] || defaultMessage;
  }
  
  // 错误对象
  if (error && typeof error === 'object') {
    // 优先使用错误码
    if (error.code && ERROR_MESSAGES[error.code]) {
      return ERROR_MESSAGES[error.code];
    }
    
    // 使用HTTP状态码
    if (error.status && HTTP_STATUS_MESSAGES[error.status]) {
      return HTTP_STATUS_MESSAGES[error.status];
    }
    
    // 使用错误消息（如果已经是友好的）
    if (error.message && !error.message.includes('Error')) {
      return error.message;
    }
    
    // 检查errCode
    if (error.errCode) {
      // 特殊错误码处理
      switch(error.errCode) {
        case -1:
          return error.errMsg || '操作失败';
        case 401:
          return '请先登录';
        case 403:
          return '权限不足';
        default:
          return error.errMsg || defaultMessage;
      }
    }
  }
  
  return defaultMessage;
}

/**
 * 显示错误提示
 * @param {String|Number|Object} error - 错误
 * @param {Object} options - 选项
 */
function showErrorToast(error, options = {}) {
  const message = getFriendlyMessage(error, options.defaultMessage);
  
  uni.showToast({
    title: message,
    icon: options.icon || 'none',
    duration: options.duration || 2000,
    mask: options.mask !== false
  });
  
  // 记录错误日志（开发环境）
  // #ifdef MP-WEIXIN
  if (__wxConfig && __wxConfig.envVersion === 'develop') {
    console.error('[错误提示]', error);
  }
  // #endif
}

/**
 * 显示错误弹窗
 * @param {String|Number|Object} error - 错误
 * @param {Object} options - 选项
 */
function showErrorModal(error, options = {}) {
  const message = getFriendlyMessage(error, options.defaultMessage);
  
  uni.showModal({
    title: options.title || '提示',
    content: message,
    showCancel: options.showCancel !== false,
    cancelText: options.cancelText || '取消',
    confirmText: options.confirmText || '确定',
    success: options.success,
    fail: options.fail
  });
}

/**
 * 处理API错误
 * @param {Object} error - API返回的错误
 * @param {Object} options - 选项
 */
function handleApiError(error, options = {}) {
  // 特殊处理登录失效
  if (error.errCode === 401 || error.status === 401) {
    if (!options.silent) {
      showErrorToast('登录已失效，请重新登录');
    }
    
    // 清理登录状态
    uni.removeStorageSync('token');
    uni.removeStorageSync('userInfo');
    
    // 跳转到登录页（延迟执行，让提示显示）
    setTimeout(() => {
      uni.reLaunch({
        url: '/pages/login/login'
      });
    }, 1500);
    
    return;
  }
  
  // 显示错误提示
  if (!options.silent) {
    showErrorToast(error, options);
  }
  
  // 执行回调
  if (options.onError) {
    options.onError(error);
  }
}

// 导出
module.exports = {
  ERROR_MESSAGES,
  HTTP_STATUS_MESSAGES,
  getFriendlyMessage,
  showErrorToast,
  showErrorModal,
  handleApiError
};
