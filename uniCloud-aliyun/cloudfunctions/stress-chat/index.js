'use strict';

// 导入所需模块
const axios = require('axios');
const { Configuration, OpenAIApi } = require('openai');

// OpenAI配置
const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY'; // 实际项目中应使用环境变量或配置中心
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
 * 生成聊天回复
 * @param {string} userMessage - 用户消息
 * @param {Array} chatHistory - 聊天历史
 */
async function generateChatResponse(userMessage, chatHistory = []) {
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
    
    // 调用OpenAI API
    const response = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
      max_tokens: 400,
      top_p: 0.95,
      frequency_penalty: 0.5,
      presence_penalty: 0.5,
    });
    
    // 提取回复
    const reply = response.data.choices[0].message.content.trim();
    
    return {
      code: 0,
      msg: '回复成功',
      data: {
        content: reply
      }
    };
    
  } catch (error) {
    console.error('生成聊天回复错误:', error);
    
    // 使用备用回复
    return {
      code: -1,
      msg: '生成回复失败',
      data: {
        content: getFallbackResponse()
      }
    };
  }
}

/**
 * 当API调用失败时的备用回复
 */
function getFallbackResponse() {
  const fallbackResponses = [
    '我理解你现在的感受。尝试深呼吸几次，感受当下，然后我们可以一起探讨这个问题。',
    '听起来你正在经历一些压力。从CBT的角度，我们可以尝试识别导致这种感受的具体想法，然后质疑它们的合理性。',
    '你描述的感受很常见。让我们尝试一种CBT技术：想象一下，如果你的好朋友遇到同样的情况，你会给他们什么建议？',
    '我理解这种情况会让人感到压力。CBT建议我们关注可控因素，制定具体的小步骤来改善情况。',
    '从你的描述中，我注意到一些"非黑即白"的思维模式。生活中的许多情况其实存在灰色地带。你能尝试找出一个介于最好和最坏情况之间的中间可能性吗？'
  ];
  
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

/**
 * 记录聊天内容到数据库（如需要）
 */
async function logChatToDatabase(userId, userMessage, aiResponse) {
  // 实际项目中，可以将聊天记录保存到数据库
  // ...
}

exports.main = async (event, context) => {
  const { message, history = [], userId = '' } = event;
  
  if (!message || message.trim() === '') {
    return {
      code: -1,
      msg: '消息内容不能为空',
      data: null
    };
  }
  
  try {
    // 生成聊天回复
    const response = await generateChatResponse(message, history);
    
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