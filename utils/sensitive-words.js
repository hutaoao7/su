/**
 * 前端敏感词检测工具
 * 用于实时检测用户输入中的敏感内容
 */

// 敏感词列表（与后端保持一致）
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
export function checkSensitiveWords(text) {
  if (!text || typeof text !== 'string') {
    return {
      hasSensitive: false,
      matchedWords: [],
      isCrisis: false,
      positions: []
    };
  }
  
  const lowerText = text.toLowerCase();
  const matchedWords = [];
  const positions = [];
  let isCrisis = false;
  
  // 检查每个敏感词
  SENSITIVE_WORDS.forEach(word => {
    const lowerWord = word.toLowerCase();
    let index = lowerText.indexOf(lowerWord);
    
    while (index !== -1) {
      matchedWords.push(word);
      positions.push({
        word: word,
        start: index,
        end: index + word.length
      });
      
      // 检查是否是危机关键词
      if (CRISIS_KEYWORDS.includes(word)) {
        isCrisis = true;
      }
      
      // 查找下一个匹配
      index = lowerText.indexOf(lowerWord, index + 1);
    }
  });
  
  return {
    hasSensitive: matchedWords.length > 0,
    matchedWords: [...new Set(matchedWords)], // 去重
    isCrisis: isCrisis,
    positions: positions
  };
}

/**
 * 高亮显示敏感词
 * @param {string} text - 原始文本
 * @param {array} positions - 敏感词位置数组
 * @returns {array} - 包含文本片段和是否敏感的数组
 */
export function highlightSensitiveWords(text, positions) {
  if (!text || !positions || positions.length === 0) {
    return [{ text: text, isSensitive: false }];
  }
  
  // 按位置排序
  const sortedPositions = positions.sort((a, b) => a.start - b.start);
  
  const result = [];
  let lastEnd = 0;
  
  sortedPositions.forEach(pos => {
    // 添加非敏感词部分
    if (pos.start > lastEnd) {
      result.push({
        text: text.substring(lastEnd, pos.start),
        isSensitive: false
      });
    }
    
    // 添加敏感词部分
    result.push({
      text: text.substring(pos.start, pos.end),
      isSensitive: true,
      word: pos.word
    });
    
    lastEnd = pos.end;
  });
  
  // 添加最后剩余的非敏感词部分
  if (lastEnd < text.length) {
    result.push({
      text: text.substring(lastEnd),
      isSensitive: false
    });
  }
  
  return result;
}

/**
 * 获取危机干预提示
 * @returns {string} - 危机干预提示文本
 */
export function getCrisisWarning() {
  return `⚠️ 我们注意到您可能正在经历困难时期。

如果您需要立即帮助，请联系：
• 心理危机干预热线：400-161-9995（24小时）
• 生命教育中心：400-840-1000
• 或前往最近的医院急诊科

您的生命很宝贵，请不要放弃。`;
}

/**
 * 获取敏感词警告提示
 * @param {array} matchedWords - 匹配到的敏感词
 * @returns {string} - 警告提示
 */
export function getSensitiveWarning(matchedWords) {
  return `检测到您的消息包含敏感内容（${matchedWords.join('、')}）。\n\n如果您正在经历困难，我们建议寻求专业帮助。`;
}

export default {
  checkSensitiveWords,
  highlightSensitiveWords,
  getCrisisWarning,
  getSensitiveWarning
};

