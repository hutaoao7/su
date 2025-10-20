'use strict';

// 导入所需模块
const aiGateway = require('../common/ai-gateway');
const { 
  checkSensitiveWords, 
  getCrisisInterventionResponse, 
  getSensitiveResponse 
} = require('../common/sensitive-filter');

// 现在通过AI网关调用，无需直接配置OpenAI

// CBT认知行为疗法的系统提示词
const SYSTEM_PROMPT = `
你是一位经验丰富的心理咨询师，专门从事认知行为疗法(CBT)。
用户正在经历压力和焦虑，需要你的帮助来重构他们的思维模式。

请遵循以下CBT原则:
1. 识别自动化负面思维
2. 挑战认知歪曲
3. 寻找替代性思考方式
4. 提供实用的减压技巧

回答要温暖、专业，语言亲切自然，长度适中，并鼓励用户积极思考。

不要:
- 做出医疗诊断
- 提供药物建议
- 过度承诺治愈效果
- 使用过于专业的术语

请使用中文回复，并始终保持共情和支持的态度。
`;

/**
 * 生成聊天回复（重构为使用AI网关）
 * @param {string} userId - 用户ID
 * @param {string} userMessage - 用户消息
 * @param {Array} chatHistory - 聊天历史
 */
async function generateChatResponse(userId, userMessage, chatHistory = []) {
  try {
    // 构建消息历史
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ];
    
    // 添加历史消息
    chatHistory.forEach(msg => {
      if (msg.from === 'self') {
        messages.push({ role: 'user', content: msg.content });
      } else if (msg.from === 'ai') {
        messages.push({ role: 'assistant', content: msg.content });
      }
    });
    
    // 添加当前用户消息
    messages.push({ role: 'user', content: userMessage });
    
    // 通过AI网关调用（支持限流、降级、内容安全）
    const reply = await aiGateway.chat(userId, messages, {
      model: 'gpt-3.5-turbo',
      temperature: 0.7,
      maxTokens: 400
    });
    
    return {
      code: 0,
      msg: '回复成功',
      data: {
        content: reply
      }
    };
    
  } catch (error) {
    console.error('生成聊天回复错误:', error);
    
    // 处理从AI网关返回的格式化错误
    if (error.type && error.userMessage) {
      return {
        code: -1,
        msg: error.userMessage,
        errorType: error.type,
        data: {
          content: error.userMessage,
          suggestion: error.suggestion,
          canRetry: ['NETWORK', 'TIMEOUT', 'RATE_LIMIT', 'SERVER'].includes(error.type)
        }
      };
    }
    
    // 兜底错误处理
    return {
      code: -1,
      msg: error.message || '生成回复失败',
      data: {
        content: '抱歉，AI暂时无法回复。请稍后再试。',
        canRetry: true
      }
    };
  }
}

// getFallbackResponse已移至ai-gateway/fallback-templates.js

/**
 * 记录聊天内容到数据库（如需要）
 */
async function logChatToDatabase(userId, userMessage, aiResponse) {
  // 实际项目中，可以将聊天记录保存到数据库
  // ...
}

exports.main = async (event, context) => {
  const { message, history = [], userId } = event;
  
  // 从Token提取userId（如果未提供）
  let uid = userId;
  if (!uid && context.UNI_ID_TOKEN) {
    try {
      const token = context.UNI_ID_TOKEN;
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString());
      uid = payload.sub || payload.uid || 'anonymous';
    } catch (error) {
      uid = 'anonymous';
    }
  } else if (!uid) {
    uid = 'anonymous';
  }
  
  if (!message || message.trim() === '') {
    return {
      code: -1,
      msg: '消息内容不能为空',
      data: null
    };
  }
  
  try {
    // 检查敏感词
    const sensitiveCheck = checkSensitiveWords(message);
    
    if (sensitiveCheck.hasSensitive) {
      console.log('检测到敏感词:', sensitiveCheck.matchedWords);
      
      // 如果是危机情况，返回危机干预回复
      if (sensitiveCheck.isCrisis) {
        const crisisResponse = getCrisisInterventionResponse();
        
        // 记录危机干预日志
        console.warn('触发危机干预，用户ID:', uid);
        
        return {
          code: 0,
          msg: '危机干预',
          data: {
            content: crisisResponse,
            isCrisis: true
          }
        };
      } else {
        // 一般敏感词，返回引导性回复
        const sensitiveResponse = getSensitiveResponse(sensitiveCheck.matchedWords);
        
        return {
          code: 0,
          msg: '敏感内容',
          data: {
            content: sensitiveResponse,
            hasSensitive: true
          }
        };
      }
    }
    
    // 正常流程：生成聊天回复（传入userId用于限流）
    const response = await generateChatResponse(uid, message, history);
    
    // 记录聊天内容（可选）
    if (userId) {
      await logChatToDatabase(userId, message, response.data.content);
    }
    
    return response;
    
  } catch (error) {
    console.error('聊天处理错误:', error);
    return {
      code: -1,
      msg: '处理聊天请求失败: ' + error.message,
      data: null
    };
  }
}; 