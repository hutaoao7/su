'use strict';

/**
 * 内容安全检测
 * 基于关键词的简单检测
 */

const TAG = '[CONTENT_SAFETY]';

// 不安全关键词列表
const UNSAFE_KEYWORDS = [
  '自杀',
  '自残',
  '自伤',
  '结束生命',
  '想死',
  '不想活',
  '伤害他人',
  '暴力',
  '杀人',
  '报复社会'
];

/**
 * 检测内容是否安全
 * @param {string} content - 待检测内容
 * @returns {Promise<{safe: boolean, keyword?: string}>}
 */
async function check(content) {
  if (!content || typeof content !== 'string') {
    return { safe: true };
  }
  
  const lowerContent = content.toLowerCase();
  
  // 检查不安全关键词
  for (const keyword of UNSAFE_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      console.warn(TAG, '检测到不安全关键词:', keyword);
      return {
        safe: false,
        keyword: keyword,
        action: 'crisis_intervention' // 触发危机干预
      };
    }
  }
  
  return { safe: true };
}

module.exports = {
  check,
  UNSAFE_KEYWORDS
};

