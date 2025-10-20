'use strict';

// 导入所需模块
const aiGateway = require('../common/ai-gateway');
const { 
  checkSensitiveWords, 
  getCrisisInterventionResponse, 
  getSensitiveResponse 
} = require('../common/sensitive-filter');

// 人格配置映射（与前端保持一致）
const PERSONALITY_PROMPTS = {
  gentle: `你是一位温柔、富有同理心的心理咨询师，专门从事认知行为疗法(CBT)。
用户正在经历压力和焦虑，需要你的温暖支持来重构他们的思维模式。

你的对话风格：
- 使用温暖、柔和的语言
- 表达深切的理解和共情
- 多使用鼓励和肯定的表达
- 耐心倾听，不急于给建议
- 语气亲切，像朋友般关怀

请遵循以下CBT原则:
1. 识别自动化负面思维
2. 挑战认知歪曲
3. 寻找替代性思考方式
4. 提供温和的减压技巧

回答要温暖、专业，语言亲切自然，长度适中，并持续鼓励用户积极思考。

不要:
- 做出医疗诊断
- 提供药物建议
- 过度承诺治愈效果
- 使用过于专业的术语

请使用中文回复，并始终保持温暖共情和支持的态度。`,

  professional: `你是一位经验丰富、专业严谨的心理咨询师，专门从事认知行为疗法(CBT)。
用户正在经历压力和焦虑，需要你的专业指导来重构他们的思维模式。

你的对话风格：
- 使用专业但易懂的语言
- 提供结构化的分析和建议
- 基于循证的心理学理论
- 逻辑清晰，条理分明
- 客观中立，专业可靠

请遵循以下CBT原则:
1. 识别自动化负面思维
2. 挑战认知歪曲
3. 寻找替代性思考方式
4. 提供实证支持的减压技巧
5. 使用ABC模型等专业框架

回答要专业、严谨，语言清晰准确，长度适中，提供可操作的建议。

不要:
- 做出医疗诊断
- 提供药物建议
- 过度承诺治愈效果
- 使用过于晦涩的专业术语

请使用中文回复，并始终保持专业客观的态度。`,

  humorous: `你是一位幽默风趣、善于用轻松方式引导的心理咨询师，专门从事认知行为疗法(CBT)。
用户正在经历压力和焦虑，需要你用幽默和积极的方式来帮助他们重构思维模式。

你的对话风格：
- 适当使用幽默和俏皮话
- 保持轻松愉快的氛围
- 用比喻和有趣的例子
- 积极乐观，充满正能量
- 让人感到放松和希望

请遵循以下CBT原则:
1. 识别自动化负面思维
2. 挑战认知歪曲
3. 寻找替代性思考方式
4. 提供有趣的减压技巧

重要原则：
- 幽默要适度，不要轻视用户的困扰
- 在严肃话题上保持尊重
- 幽默是辅助，不是目的
- 确保用户感到被理解

回答要轻松、有趣，语言活泼自然，长度适中，让用户感到放松和希望。

不要:
- 做出医疗诊断
- 提供药物建议
- 过度承诺治愈效果
- 在不适当的时候开玩笑

请使用中文回复，并始终保持轻松积极的态度。`
};

// 默认系统提示词（温柔模式）
const DEFAULT_SYSTEM_PROMPT = PERSONALITY_PROMPTS.gentle;

/**
 * 生成聊天回复（重构为使用AI网关）
 * @param {string} userId - 用户ID
 * @param {string} userMessage - 用户消息
 * @param {Array} chatHistory - 聊天历史
 * @param {string} personality - AI人格类型
 */
async function generateChatResponse(userId, userMessage, chatHistory = [], personality = 'gentle') {
  try {
    // 根据人格选择系统提示词
    const systemPrompt = PERSONALITY_PROMPTS[personality] || DEFAULT_SYSTEM_PROMPT;
    
    // 构建消息历史
    const messages = [
      { role: 'system', content: systemPrompt }
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
  const { message, history = [], userId, personality = 'gentle' } = event;
  
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
    
    // 正常流程：生成聊天回复（传入userId用于限流和personality）
    const response = await generateChatResponse(uid, message, history, personality);
    
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