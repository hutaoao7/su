'use strict';

const db = uniCloud.database();
const resp = require('common/response');
const auth = require('common/auth');

exports.main = async (event, context) => {
  try {
    const { action, ...payload } = event;
    
    switch (action) {
      case 'questions':
        return await getQuestions(payload);
      case 'submit':
        return await submitAnswers(payload, context);
      default:
        return resp.err(40001, '不支持的操作');
    }
  } catch (error) {
    console.error('fn-screening error:', error);
    return resp.err(50000, '服务器错误');
  }
};

// 获取筛查题目
async function getQuestions({ type }) {
  if (!type) {
    return resp.err(40001, '类型参数必填');
  }
  
  const validTypes = ['study', 'social', 'sleep'];
  if (!validTypes.includes(type)) {
    return resp.err(40001, '不支持的筛查类型');
  }
  
  const questionsCollection = db.collection('screening_questions');
  const result = await questionsCollection
    .where({
      type: type
    })
    .orderBy('version', 'desc')
    .limit(1)
    .get();
  
  if (result.data.length === 0) {
    // 返回默认题目
    return resp.ok({
      type,
      items: getDefaultQuestions(type)
    });
  }
  
  return resp.ok(result.data[0]);
}

// 提交答案并计算结果
async function submitAnswers({ type, answers, timeMs }, context) {
  const userInfo = await auth.getUserInfo(context);
  if (!userInfo) {
    return resp.err(40002, '请先登录');
  }
  
  if (!type || !answers || !Array.isArray(answers)) {
    return resp.err(40001, '参数不完整');
  }
  
  // 计算总分和等级
  const totalScore = answers.reduce((sum, answer) => sum + (answer.score || 0), 0);
  const maxScore = answers.length * 3; // 假设每题最高3分
  const scoreRatio = totalScore / maxScore;
  
  let level, tips;
  if (scoreRatio <= 0.3) {
    level = 'low';
    tips = getLowRiskTips(type);
  } else if (scoreRatio <= 0.7) {
    level = 'mid';
    tips = getMidRiskTips(type);
  } else {
    level = 'high';
    tips = getHighRiskTips(type);
  }
  
  // 保存结果
  const resultsCollection = db.collection('screening_results');
  await resultsCollection.add({
    userId: userInfo.uid,
    type,
    answers,
    level,
    tips,
    timeMs: timeMs || 0,
    createdAt: new Date()
  });
  
  return resp.ok({
    level,
    tips
  });
}

// 获取默认题目
function getDefaultQuestions(type) {
  const questionSets = {
    study: [
      { qid: 1, text: '最近学习时是否容易分心？', scale: [0, 1, 2, 3] },
      { qid: 2, text: '是否感到学习压力过大？', scale: [0, 1, 2, 3] },
      { qid: 3, text: '是否经常为学习成绩担忧？', scale: [0, 1, 2, 3] },
      { qid: 4, text: '是否觉得学习任务难以完成？', scale: [0, 1, 2, 3] },
      { qid: 5, text: '是否因学习问题影响睡眠？', scale: [0, 1, 2, 3] }
    ],
    social: [
      { qid: 1, text: '是否感到与他人交流困难？', scale: [0, 1, 2, 3] },
      { qid: 2, text: '是否经常感到孤独？', scale: [0, 1, 2, 3] },
      { qid: 3, text: '是否害怕在公共场合发言？', scale: [0, 1, 2, 3] },
      { qid: 4, text: '是否担心被他人评判？', scale: [0, 1, 2, 3] },
      { qid: 5, text: '是否避免参加社交活动？', scale: [0, 1, 2, 3] }
    ],
    sleep: [
      { qid: 1, text: '是否经常难以入睡？', scale: [0, 1, 2, 3] },
      { qid: 2, text: '是否夜间经常醒来？', scale: [0, 1, 2, 3] },
      { qid: 3, text: '是否早上起床困难？', scale: [0, 1, 2, 3] },
      { qid: 4, text: '是否白天感到疲倦？', scale: [0, 1, 2, 3] },
      { qid: 5, text: '是否因睡眠问题影响日常生活？', scale: [0, 1, 2, 3] }
    ]
  };
  
  return questionSets[type] || [];
}

// 获取低风险建议
function getLowRiskTips(type) {
  const tips = {
    study: '您的学习状态良好！建议继续保持规律的学习习惯，适当放松。',
    social: '您的社交状态不错！可以尝试参与更多有趣的社交活动。',
    sleep: '您的睡眠质量良好！继续保持规律的作息时间。'
  };
  return tips[type] || '状态良好，继续保持！';
}

// 获取中等风险建议
function getMidRiskTips(type) {
  const tips = {
    study: '建议调整学习方法，合理安排时间，必要时寻求帮助。',
    social: '可以尝试从小的社交场合开始，逐步提升社交信心。',
    sleep: '建议改善睡眠环境，建立睡前放松习惯。'
  };
  return tips[type] || '需要适当调整，建议寻求专业指导。';
}

// 获取高风险建议
function getHighRiskTips(type) {
  const tips = {
    study: '建议及时寻求专业心理咨询师的帮助，制定个性化的应对策略。',
    social: '建议寻求专业心理支持，学习社交技巧和焦虑管理方法。',
    sleep: '建议咨询医生或心理专家，可能需要专业的睡眠治疗。'
  };
  return tips[type] || '建议尽快寻求专业心理健康服务。';
}