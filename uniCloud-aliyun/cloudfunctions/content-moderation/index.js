'use strict';

/**
 * 内容审核云函数 (Mock版本)
 * 
 * 功能说明：
 * - 图片审核：检测色情、政治敏感、暴力等违规内容
 * - 文本审核：检测敏感词、违禁内容（可选，已有sensitive-words.js）
 * 
 * Mock版本说明：
 * - 模拟真实的审核结果，用于开发和测试
 * - 后续可无缝替换为腾讯云、阿里云等真实审核API
 * 
 * @param {Object} event - 云函数参数
 * @param {String} event.type - 审核类型：image | text
 * @param {String} event.content - 审核内容：图片URL | 文本内容
 * @returns {Object} { pass: Boolean, reason: String, confidence: Number, label: String }
 */
exports.main = async (event, context) => {
  const { type, content } = event;
  
  console.log('[CONTENT-MODERATION] 审核请求:', { type, content: content ? content.substring(0, 50) : 'empty' });
  
  // 参数验证
  if (!type || !content) {
    return {
      errCode: 400,
      errMsg: '参数错误：type和content为必填项',
      data: null
    };
  }
  
  try {
    let result;
    
    // 图片审核
    if (type === 'image') {
      result = await mockImageModeration(content);
    }
    // 文本审核
    else if (type === 'text') {
      result = await mockTextModeration(content);
    }
    // 不支持的类型
    else {
      return {
        errCode: 400,
        errMsg: `不支持的审核类型: ${type}`,
        data: null
      };
    }
    
    console.log('[CONTENT-MODERATION] 审核结果:', result);
    
    return result;
    
  } catch (error) {
    console.error('[CONTENT-MODERATION] 审核失败:', error);
    
    return {
      errCode: 500,
      errMsg: `审核服务异常: ${error.message}`,
      data: {
        pass: true, // 降级策略：异常时允许通过
        reason: '审核服务暂不可用',
        confidence: 0,
        label: 'error'
      }
    };
  }
};

/**
 * Mock图片审核
 * 
 * 模拟规则：
 * 1. 90%的图片审核通过
 * 2. 5%检测为色情内容
 * 3. 3%检测为政治敏感
 * 4. 2%检测为暴力内容
 * 
 * 实际使用时替换为真实API：
 * - 腾讯云图片审核: https://cloud.tencent.com/document/product/1125
 * - 阿里云内容安全: https://help.aliyun.com/product/28415.html
 * 
 * @param {String} imageUrl - 图片URL
 * @returns {Object} 审核结果
 */
async function mockImageModeration(imageUrl) {
  // 模拟审核延迟（500-1500ms）
  await sleep(500 + Math.random() * 1000);
  
  // 生成随机审核结果（用于测试）
  const random = Math.random();
  
  // 90%通过
  if (random < 0.90) {
    return {
      pass: true,
      reason: '',
      confidence: 0.95 + Math.random() * 0.05, // 95%-100%
      label: 'normal',
      suggestion: 'Pass'
    };
  }
  // 5%色情内容
  else if (random < 0.95) {
    return {
      pass: false,
      reason: '包含不适宜内容',
      confidence: 0.80 + Math.random() * 0.15, // 80%-95%
      label: 'porn',
      suggestion: 'Block'
    };
  }
  // 3%政治敏感
  else if (random < 0.98) {
    return {
      pass: false,
      reason: '包含敏感内容',
      confidence: 0.75 + Math.random() * 0.20, // 75%-95%
      label: 'politics',
      suggestion: 'Block'
    };
  }
  // 2%暴力内容
  else {
    return {
      pass: false,
      reason: '包含暴力内容',
      confidence: 0.70 + Math.random() * 0.25, // 70%-95%
      label: 'terrorism',
      suggestion: 'Block'
    };
  }
}

/**
 * Mock文本审核
 * 
 * 模拟规则：
 * 1. 检测敏感词列表
 * 2. 检测违禁关键词
 * 
 * 注：项目已有 utils/sensitive-words.js 敏感词检测，可复用
 * 
 * @param {String} text - 文本内容
 * @returns {Object} 审核结果
 */
async function mockTextModeration(text) {
  // 模拟审核延迟（200-500ms）
  await sleep(200 + Math.random() * 300);
  
  // 简单的敏感词检测（实际应使用 sensitive-words.js）
  const bannedWords = [
    '违禁词', '敏感内容', '政治', '色情', '赌博', '毒品',
    'fuck', 'shit', 'damn'
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const word of bannedWords) {
    if (lowerText.includes(word.toLowerCase())) {
      return {
        pass: false,
        reason: `包含敏感词: ${word}`,
        confidence: 0.90,
        label: 'sensitive',
        suggestion: 'Block',
        matchedWords: [word]
      };
    }
  }
  
  // 通过
  return {
    pass: true,
    reason: '',
    confidence: 0.98,
    label: 'normal',
    suggestion: 'Pass',
    matchedWords: []
  };
}

/**
 * 睡眠函数（模拟延迟）
 * @param {Number} ms - 毫秒
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 真实API集成示例（注释版本）
 * 
 * 替换为腾讯云图片审核时，取消下面注释并安装依赖：
 * npm install tencentcloud-sdk-nodejs
 */
/*
const tencentcloud = require("tencentcloud-sdk-nodejs");
const ImsClient = tencentcloud.ims.v20201229.Client;

async function realImageModeration(imageUrl) {
  const client = new ImsClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: "ap-guangzhou"
  });
  
  const params = {
    FileUrl: imageUrl,
    Scene: ["PORN", "POLITICS", "TERRORISM"]
  };
  
  const data = await client.ImageModeration(params);
  
  return {
    pass: data.Suggestion === 'Pass',
    reason: data.Label,
    confidence: data.Confidence,
    label: data.Label,
    suggestion: data.Suggestion
  };
}
*/

