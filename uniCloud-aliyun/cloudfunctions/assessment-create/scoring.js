'use strict';

/**
 * 评分逻辑（简化版，实际项目使用utils/scoring.js）
 */

function scoreUnified(scaleId, answers) {
  // 这里是简化版本，实际应该使用完整的评分逻辑
  
  const answerValues = Object.values(answers).map(v => Number(v) || 0);
  const totalScore = answerValues.reduce((sum, val) => sum + val, 0);
  
  // 根据量表返回不同的等级判断
  const scoreMap = {
    'phq9': {
      maxScore: 27,
      levels: [
        { max: 4, level: '无抑郁症状', description: '您的抑郁症状在正常范围内' },
        { max: 9, level: '轻度抑郁', description: '您有轻度的抑郁症状' },
        { max: 14, level: '中度抑郁', description: '您的抑郁症状达到中度水平' },
        { max: 19, level: '中重度抑郁', description: '您的抑郁症状较为严重' },
        { max: 27, level: '重度抑郁', description: '您的抑郁症状非常严重，建议立即寻求专业帮助' }
      ]
    },
    'gad7': {
      maxScore: 21,
      levels: [
        { max: 4, level: '正常', description: '您的焦虑水平在正常范围内' },
        { max: 9, level: '轻度焦虑', description: '您有轻度的焦虑症状' },
        { max: 14, level: '中度焦虑', description: '您的焦虑症状达到中度水平' },
        { max: 21, level: '重度焦虑', description: '您的焦虑症状非常严重' }
      ]
    }
  };
  
  const scaleConfig = scoreMap[scaleId] || { maxScore: 100, levels: [] };
  
  // 查找对应等级
  let level = '未知';
  let description = '';
  
  for (const levelConfig of scaleConfig.levels) {
    if (totalScore <= levelConfig.max) {
      level = levelConfig.level;
      description = levelConfig.description;
      break;
    }
  }
  
  return {
    score: totalScore,
    maxScore: scaleConfig.maxScore,
    level: level,
    description: description,
    suggestions: generateSuggestions(level),
    riskFactors: []
  };
}

function generateSuggestions(level) {
  if (level.includes('重度') || level.includes('严重')) {
    return [
      '建议立即寻求专业心理咨询或医疗帮助',
      '考虑联系学校心理辅导中心',
      '告诉信任的人您的感受',
      '如有紧急情况，请拨打24小时心理危机热线'
    ];
  } else if (level.includes('中度')) {
    return [
      '建议寻求专业心理咨询',
      '保持规律作息，适度运动',
      '尝试放松技巧，如冥想、深呼吸',
      '与朋友或家人交流感受'
    ];
  } else if (level.includes('轻度')) {
    return [
      '注意调节情绪，保持积极心态',
      '适当运动，改善心理状态',
      '尝试使用我们的AI对话或冥想功能',
      '如症状持续，建议咨询专业人士'
    ];
  }
  
  return [
    '继续保持良好的心理状态',
    '定期自我关注，及时调整',
    '探索更多心理健康知识'
  ];
}

module.exports = { scoreUnified };

