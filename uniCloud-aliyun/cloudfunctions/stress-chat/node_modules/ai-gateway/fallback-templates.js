'use strict';

/**
 * 降级模板
 * 当AI服务不可用时使用的CBT回复模板
 */

const TAG = '[FALLBACK_TEMPLATES]';

// 通用降级回复模板
const FALLBACK_TEMPLATES = [
  '我理解你现在的感受。尝试深呼吸几次，感受当下，然后我们可以一起探讨这个问题。',
  '听起来你正在经历一些压力。从CBT的角度，我们可以尝试识别导致这种感受的具体想法，然后质疑它们的合理性。',
  '你描述的感受很常见。让我们尝试一种CBT技术：想象一下，如果你的好朋友遇到同样的情况，你会给他们什么建议？',
  '我理解这种情况会让人感到压力。CBT建议我们关注可控因素，制定具体的小步骤来改善情况。',
  '从你的描述中，我注意到一些"非黑即白"的思维模式。生活中的许多情况其实存在灰色地带。你能尝试找出一个介于最好和最坏情况之间的中间可能性吗？',
  '这听起来确实很有挑战性。让我们一起运用认知重构的方法，找出这个想法中可能存在的认知偏差。'
];

// 危机情况的安全回复
const SAFE_RESPONSE = '我注意到您可能正在经历困难时刻。您的安全非常重要。\n\n如果您有自伤或伤害他人的想法，请立即：\n• 拨打心理危机干预热线：400-161-9995\n• 联系当地精神卫生中心\n• 前往最近的医院急诊科\n\n您不是一个人，总有人愿意帮助您。';

/**
 * 获取降级回复
 * @param {string} userMessage - 用户消息（可选，用于简单匹配）
 * @returns {string} 降级回复内容
 */
function getFallbackResponse(userMessage = '') {
  console.log(TAG, '使用降级模板');
  
  // 简单的关键词匹配（可选）
  // 未来可以根据userMessage选择更合适的模板
  
  // 随机返回一个模板
  const randomIndex = Math.floor(Math.random() * FALLBACK_TEMPLATES.length);
  return FALLBACK_TEMPLATES[randomIndex];
}

/**
 * 获取危机情况的安全回复
 * @returns {string} 安全回复内容
 */
function getSafeResponse() {
  console.log(TAG, '使用危机干预安全回复');
  return SAFE_RESPONSE;
}

module.exports = {
  getFallbackResponse,
  getSafeResponse,
  FALLBACK_TEMPLATES
};

