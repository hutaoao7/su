'use strict';

const TAG = '[CONTENT_SAFETY]';

const UNSAFE_KEYWORDS = [
  '自杀', '自残', '自伤', '结束生命', '想死', '不想活',
  '伤害他人', '暴力', '杀人', '报复社会'
];

async function check(content) {
  if (!content || typeof content !== 'string') return { safe: true };
  const lowerContent = content.toLowerCase();
  for (const keyword of UNSAFE_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      console.warn(TAG, '检测到不安全关键词:', keyword);
      return { safe: false, keyword, action: 'crisis_intervention' };
    }
  }
  return { safe: true };
}

module.exports = { check, UNSAFE_KEYWORDS };


