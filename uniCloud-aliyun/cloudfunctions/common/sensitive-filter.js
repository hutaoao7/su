/**
 * 敏感词过滤模块
 */

// 敏感词列表（实际应该从数据库或配置文件加载）
const SENSITIVE_WORDS = [
  // 危机相关
  '自杀', '自残', '轻生', '想死', '不想活',
  '结束生命', '了断', '解脱',
  // 暴力相关
  '杀人', '伤害', '报复', '打人',
  // 其他敏感词
  '毒品', '赌博'
];

// 危机干预关键词
const CRISIS_KEYWORDS = [
  '自杀', '自残', '轻生', '想死', '不想活',
  '结束生命', '了断'
];

/**
 * 检查文本是否包含敏感词
 * @param {string} text - 要检查的文本
 * @returns {object} - { hasSensitive: boolean, matchedWords: array, isCrisis: boolean }
 */
function checkSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return {
      hasSensitive: false,
      matchedWords: [],
      isCrisis: false
    };
  }
  
  const lowerText = text.toLowerCase();
  const matchedWords = [];
  let isCrisis = false;
  
  // 检查每个敏感词
  SENSITIVE_WORDS.forEach(word => {
    if (lowerText.includes(word.toLowerCase())) {
      matchedWords.push(word);
      
      // 检查是否是危机关键词
      if (CRISIS_KEYWORDS.includes(word)) {
        isCrisis = true;
      }
    }
  });
  
  return {
    hasSensitive: matchedWords.length > 0,
    matchedWords: [...new Set(matchedWords)], // 去重
    isCrisis: isCrisis
  };
}

/**
 * 过滤敏感词（用*替换）
 * @param {string} text - 要过滤的文本
 * @returns {string} - 过滤后的文本
 */
function filterSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return text;
  }
  
  let filteredText = text;
  
  SENSITIVE_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const replacement = '*'.repeat(word.length);
    filteredText = filteredText.replace(regex, replacement);
  });
  
  return filteredText;
}

/**
 * 获取危机干预回复
 * @returns {string} - 危机干预回复文本
 */
function getCrisisInterventionResponse() {
  const responses = [
    `我注意到您可能正在经历一段非常困难的时期。您的生命很宝贵，请不要放弃。

如果您需要立即帮助，请联系：
- 全国24小时心理危机干预热线：400-161-9995
- 北京心理危机干预热线：010-82951332
- 生命教育与危机干预中心：400-840-1000

您也可以：
- 联系身边信任的朋友或家人
- 前往最近的医院急诊科
- 联系学校的心理咨询中心

请记住，这种痛苦是暂时的，总会有解决办法。您并不孤单，有很多人愿意帮助您。`,

    `我理解您现在可能感到非常痛苦和绝望。但请相信，这种感受是可以改变的。

请立即寻求帮助：
- 心理援助热线：400-161-9995（24小时）
- 或发送短信到：12355
- 紧急情况请拨打：110 或 120

您的生命对很多人来说都很重要。请给自己一个机会，让专业人士帮助您度过这个困难时期。

如果您愿意，可以告诉我更多关于您的感受，我会尽力倾听和支持您。`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

/**
 * 获取一般敏感词回复
 * @param {array} matchedWords - 匹配到的敏感词
 * @returns {string} - 回复文本
 */
function getSensitiveResponse(matchedWords) {
  return `我理解您可能正在经历一些困难。作为AI助手，我希望能为您提供积极、健康的支持。

如果您需要专业帮助，建议您：
- 联系专业的心理咨询师
- 拨打心理援助热线：400-161-9995
- 寻求学校心理咨询中心的帮助

让我们聊一些积极的话题，或者您可以告诉我其他需要帮助的地方。`;
}

module.exports = {
  checkSensitiveWords,
  filterSensitiveWords,
  getCrisisInterventionResponse,
  getSensitiveResponse,
  SENSITIVE_WORDS,
  CRISIS_KEYWORDS
};
