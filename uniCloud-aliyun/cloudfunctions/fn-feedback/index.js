'use strict';

const db = uniCloud.database();
const resp = require('response');
const auth = require('auth');

exports.main = async (event, context) => {
  try {
    const { action, ...payload } = event;
    
    switch (action) {
      case 'submit':
        return await submitFeedback(payload, context);
      default:
        return resp.err(40001, '不支持的操作');
    }
  } catch (error) {
    console.error('fn-feedback error:', error);
    return resp.err(50000, '服务器错误');
  }
};

// 提交反馈
async function submitFeedback({ type, text, contact }, context) {
  const userInfo = await auth.getUserInfo(context);
  if (!userInfo) {
    return resp.err(40002, '请先登录');
  }
  
  // 参数验证
  if (!type || !text) {
    return resp.err(40001, '类型和内容不能为空');
  }
  
  const validTypes = ['bug', 'suggest', 'content', 'other'];
  if (!validTypes.includes(type)) {
    return resp.err(40001, '不支持的反馈类型');
  }
  
  // 内容长度检查
  if (text.length < 5) {
    return resp.err(40001, '反馈内容至少5个字符');
  }
  
  if (text.length > 500) {
    return resp.err(40001, '反馈内容不能超过500个字符');
  }
  
  // 敏感词过滤
  const filteredText = filterSensitiveWords(text);
  
  // 联系方式验证（如果提供）
  if (contact && contact.length > 50) {
    return resp.err(40001, '联系方式不能超过50个字符');
  }
  
  // 频率限制检查
  const rateLimitResult = await checkRateLimit(userInfo.uid);
  if (!rateLimitResult.allowed) {
    return resp.err(42901, '提交过于频繁，请稍后再试');
  }
  
  // 保存反馈
  const feedbackCollection = db.collection('feedback');
  await feedbackCollection.add({
    userId: userInfo.uid,
    type,
    text: filteredText,
    contact: contact || null,
    status: 'open',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return resp.ok(true);
}

// 敏感词过滤
function filterSensitiveWords(text) {
  const sensitiveWords = [
    '政治敏感词', '违法内容', '不当言论'
    // 实际项目中应该有完整的敏感词库
  ];
  
  let filteredText = text;
  sensitiveWords.forEach(word => {
    filteredText = filteredText.replace(new RegExp(word, 'gi'), '***');
  });
  
  return filteredText;
}

// 频率限制检查
async function checkRateLimit(userId) {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  
  const feedbackCollection = db.collection('feedback');
  const recentCount = await feedbackCollection
    .where({
      userId,
      createdAt: db.command.gte(oneHourAgo)
    })
    .count();
  
  // 每小时最多5次反馈
  return {
    allowed: recentCount.total < 5,
    remaining: Math.max(0, 5 - recentCount.total)
  };
}