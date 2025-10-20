'use strict';

const db = uniCloud.database();
const resp = require('response');
const auth = require('auth');

exports.main = async (event, context) => {
  try {
    const { action, ...payload } = event;
    
    switch (action) {
      case 'sessionStart':
        return await startSession(payload, context);
      case 'message':
        return await processMessage(payload, context);
      default:
        return resp.err(40001, '不支持的操作');
    }
  } catch (error) {
    console.error('fn-ai error:', error);
    return resp.err(50000, '服务器错误');
  }
};

// 开始新会话
async function startSession({ scene }, context) {
  const userInfo = await auth.getUserInfo(context);
  if (!userInfo) {
    return resp.err(40002, '请先登录');
  }
  
  if (!scene) {
    return resp.err(40001, '场景参数必填');
  }
  
  const validScenes = ['study', 'social', 'sleep'];
  if (!validScenes.includes(scene)) {
    return resp.err(40001, '不支持的场景类型');
  }
  
  const sessionsCollection = db.collection('ai_sessions');
  const sessionResult = await sessionsCollection.add({
    userId: userInfo.uid,
    scene,
    phase: 'accept', // 接纳阶段
    messages: [{
      role: 'assistant',
      text: getWelcomeMessage(scene),
      ts: Date.now()
    }],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  return resp.ok({
    sessionId: sessionResult.id
  });
}

// 处理用户消息
async function processMessage({ sessionId, text }, context) {
  const userInfo = await auth.getUserInfo(context);
  if (!userInfo) {
    return resp.err(40002, '请先登录');
  }
  
  if (!sessionId || !text) {
    return resp.err(40001, '参数不完整');
  }
  
  // 敏感词检测
  if (containsSensitiveWords(text)) {
    return resp.ok({
      replies: [{
        role: 'assistant',
        text: '我注意到您可能正在经历困难。如果您有自伤或伤害他人的想法，请立即寻求专业帮助。全国心理危机干预热线：400-161-9995'
      }],
      next: 'crisis' // 特殊状态
    });
  }
  
  const sessionsCollection = db.collection('ai_sessions');
  const sessionResult = await sessionsCollection.doc(sessionId).get();
  
  if (sessionResult.data.length === 0) {
    return resp.err(41001, '会话不存在');
  }
  
  const session = sessionResult.data[0];
  
  // 检查会话所有权
  if (session.userId !== userInfo.uid) {
    return resp.err(40003, '无权访问此会话');
  }
  
  // 添加用户消息
  const userMessage = {
    role: 'user',
    text: text.trim(),
    ts: Date.now()
  };
  
  // 生成AI回复
  const aiReply = await generateAIReply(session, text);
  const aiMessage = {
    role: 'assistant',
    text: aiReply.text,
    ts: Date.now()
  };
  
  // 更新会话
  const updatedMessages = [...session.messages, userMessage, aiMessage];
  await sessionsCollection.doc(sessionId).update({
    messages: updatedMessages,
    phase: aiReply.nextPhase,
    updatedAt: new Date()
  });
  
  return resp.ok({
    replies: [aiMessage],
    next: aiReply.nextPhase
  });
}

// 获取欢迎消息
function getWelcomeMessage(scene) {
  const messages = {
    study: '你好！我是你的学习心理助手。我了解学习压力可能让你感到困扰，这是很正常的感受。让我们一起来探索和理解这些感受，找到适合你的应对方式。你现在最困扰你的学习问题是什么？',
    social: '你好！我是你的社交心理助手。社交焦虑是很多人都会经历的，你并不孤单。让我们一起来了解你的感受，探索更舒适的社交方式。你在社交中最担心的是什么？',
    sleep: '你好！我是你的睡眠心理助手。睡眠问题确实会影响我们的生活质量，我理解你的困扰。让我们一起来了解你的睡眠情况，找到改善的方法。你的睡眠问题主要表现在哪些方面？'
  };
  return messages[scene] || '你好！我是你的心理健康助手，很高兴为你提供支持。';
}

// 生成AI回复
async function generateAIReply(session, userText) {
  const { scene, phase } = session;
  
  // 简化的规则引擎，实际项目中可接入真实的AI模型
  let nextPhase = phase;
  let replyText = '';
  
  switch (phase) {
    case 'accept':
      replyText = generateAcceptanceReply(scene, userText);
      nextPhase = 'assess';
      break;
    case 'assess':
      replyText = generateAssessmentReply(scene, userText);
      nextPhase = 'plan';
      break;
    case 'plan':
      replyText = generatePlanReply(scene, userText);
      nextPhase = 'exercise';
      break;
    case 'exercise':
      replyText = generateExerciseReply(scene, userText);
      nextPhase = 'summary';
      break;
    case 'summary':
      replyText = generateSummaryReply(scene, userText);
      nextPhase = 'accept'; // 循环
      break;
    default:
      replyText = '我理解你的感受，让我们继续探讨。';
  }
  
  return {
    text: replyText,
    nextPhase
  };
}

// 生成接纳阶段回复
function generateAcceptanceReply(scene, userText) {
  const replies = {
    study: [
      '我能理解学习压力给你带来的困扰。这种感受是完全正常的，很多人都会经历。',
      '感谢你分享这些感受。学习中的挫折感是成长过程的一部分。',
      '你的感受很真实，也很重要。让我们一起来更深入地了解这个问题。'
    ],
    social: [
      '社交焦虑是很常见的体验，你并不孤单。感谢你愿意分享这些感受。',
      '我理解在社交场合中感到不安的感觉。这种担心是可以理解的。',
      '你的感受很真实。让我们一起来探索这些社交担忧的根源。'
    ],
    sleep: [
      '睡眠问题确实会影响我们的整体健康。感谢你分享这些困扰。',
      '我理解睡眠不好会带来的疲惫感。这是一个值得关注的问题。',
      '你的睡眠困扰是真实存在的。让我们一起来分析可能的原因。'
    ]
  };
  
  const sceneReplies = replies[scene] || replies.study;
  return sceneReplies[Math.floor(Math.random() * sceneReplies.length)];
}

// 生成评估阶段回复
function generateAssessmentReply(scene, userText) {
  return `基于你刚才的描述，我想更好地了解你的情况。这个问题大概持续多长时间了？在什么情况下会特别明显？`;
}

// 生成计划阶段回复
function generatePlanReply(scene, userText) {
  const plans = {
    study: '根据你的情况，我建议我们可以尝试一些学习压力管理技巧，比如时间管理、放松训练等。你觉得从哪个方面开始比较好？',
    social: '我们可以从一些简单的社交技巧开始练习，比如深呼吸放松、积极自我对话等。你愿意尝试哪种方法？',
    sleep: '我们可以从改善睡眠习惯开始，比如建立睡前放松程序、调整睡眠环境等。你觉得哪个方面最需要改善？'
  };
  return plans[scene] || '让我们制定一个适合你的应对计划。';
}

// 生成练习阶段回复
function generateExerciseReply(scene, userText) {
  return '很好！现在让我们来做一个简单的练习。你可以尝试深呼吸放松法：慢慢吸气4秒，屏住呼吸2秒，然后慢慢呼气6秒。重复几次，感受身体的放松。';
}

// 生成总结阶段回复
function generateSummaryReply(scene, userText) {
  return '今天我们一起探讨了你的困扰，并尝试了一些应对方法。记住，改变需要时间和练习。你可以在日常生活中继续使用这些技巧。如果需要，我们随时可以继续对话。';
}

// 敏感词检测
function containsSensitiveWords(text) {
  const sensitiveWords = [
    '自杀', '轻生', '结束生命', '不想活', '想死',
    '伤害自己', '自残', '割腕', '跳楼', '服毒'
  ];
  
  return sensitiveWords.some(word => text.includes(word));
}