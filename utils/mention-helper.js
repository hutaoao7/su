/**
 * @用户提醒功能辅助工具
 * 功能：
 * 1. 检测@符号并提取关键词
 * 2. 解析评论内容中的@用户
 * 3. 渲染@用户标签
 * 4. 用户搜索和匹配
 */

/**
 * 检测输入内容中的@符号位置和关键词
 * @param {String} content - 输入内容
 * @param {Number} cursorPos - 光标位置
 * @returns {Object|null} { atPos, keyword } 或 null
 */
export function detectMentionTrigger(content, cursorPos) {
  if (!content || cursorPos === undefined) {
    return null;
  }
  
  // 从光标位置向前查找@符号
  let atPos = -1;
  for (let i = cursorPos - 1; i >= 0; i--) {
    const char = content.charAt(i);
    
    // 遇到空格或换行符，说明不在@状态
    if (char === ' ' || char === '\n') {
      break;
    }
    
    // 找到@符号
    if (char === '@') {
      atPos = i;
      break;
    }
  }
  
  // 没有找到@符号
  if (atPos === -1) {
    return null;
  }
  
  // 提取@符号后的关键词
  const keyword = content.substring(atPos + 1, cursorPos);
  
  return {
    atPos,
    keyword
  };
}

/**
 * 解析评论内容中的@用户
 * @param {String} content - 评论内容
 * @returns {Array} 提及的用户ID列表
 * 
 * 格式：@[用户名](user_id)
 * 示例：你好 @[张三](user_123) 和 @[李四](user_456)
 */
export function parseMentions(content) {
  if (!content) {
    return [];
  }
  
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    const userName = match[1];
    const userId = match[2];
    
    if (userId && !mentions.includes(userId)) {
      mentions.push(userId);
    }
  }
  
  return mentions;
}

/**
 * 将@标签插入到内容中
 * @param {String} content - 原内容
 * @param {Number} atPos - @符号位置
 * @param {Number} cursorPos - 光标位置
 * @param {Object} user - 用户对象 { id, name }
 * @returns {Object} { content, cursorPos }
 */
export function insertMention(content, atPos, cursorPos, user) {
  if (!content || atPos === undefined || !user) {
    return { content, cursorPos };
  }
  
  // 构建@标签：@[用户名](user_id)
  const mentionTag = `@[${user.name}](${user.id}) `;
  
  // 替换@符号到光标之间的内容
  const before = content.substring(0, atPos);
  const after = content.substring(cursorPos);
  const newContent = before + mentionTag + after;
  
  // 新的光标位置
  const newCursorPos = before.length + mentionTag.length;
  
  return {
    content: newContent,
    cursorPos: newCursorPos
  };
}

/**
 * 渲染评论内容，高亮@用户
 * @param {String} content - 评论内容
 * @returns {String} HTML内容
 */
export function renderMentions(content) {
  if (!content) {
    return '';
  }
  
  // 转义HTML特殊字符
  let escaped = content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  // 替换@标签为可点击的span
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const rendered = escaped.replace(mentionRegex, (match, userName, userId) => {
    return `<span class="mention-tag" data-user-id="${userId}">@${userName}</span>`;
  });
  
  // 保留换行符
  return rendered.replace(/\n/g, '<br/>');
}

/**
 * 搜索用户（模拟，实际应调用API）
 * @param {String} keyword - 搜索关键词
 * @param {Array} userList - 用户列表
 * @returns {Array} 匹配的用户列表
 */
export function searchUsers(keyword, userList = []) {
  if (!keyword) {
    return userList.slice(0, 10); // 返回前10个用户
  }
  
  const lowerKeyword = keyword.toLowerCase();
  
  return userList.filter(user => {
    const name = (user.name || '').toLowerCase();
    const nickname = (user.nickname || '').toLowerCase();
    
    return name.includes(lowerKeyword) || nickname.includes(lowerKeyword);
  }).slice(0, 10); // 最多返回10个匹配结果
}

/**
 * 获取评论中提及的用户信息
 * @param {String} content - 评论内容
 * @returns {Array} 用户信息列表 [{ id, name }]
 */
export function extractMentionedUsers(content) {
  if (!content) {
    return [];
  }
  
  const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const users = [];
  let match;
  
  while ((match = mentionRegex.exec(content)) !== null) {
    const userName = match[1];
    const userId = match[2];
    
    if (userId && !users.find(u => u.id === userId)) {
      users.push({
        id: userId,
        name: userName
      });
    }
  }
  
  return users;
}

/**
 * 清理内容，移除@标签的格式，仅保留纯文本
 * @param {String} content - 带@标签的内容
 * @returns {String} 纯文本内容
 */
export function stripMentionTags(content) {
  if (!content) {
    return '';
  }
  
  // 将 @[用户名](user_id) 替换为 @用户名
  return content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
}

/**
 * 验证@标签格式是否正确
 * @param {String} content - 内容
 * @returns {Boolean}
 */
export function validateMentionFormat(content) {
  if (!content) {
    return true;
  }
  
  // 检查是否有未闭合的@标签
  const openBrackets = (content.match(/@\[/g) || []).length;
  const closeBrackets = (content.match(/\]\(/g) || []).length;
  const closeParens = (content.match(/\)/g) || []).length;
  
  return openBrackets === closeBrackets && closeBrackets === closeParens;
}

/**
 * 统计评论中@的用户数量
 * @param {String} content - 评论内容
 * @returns {Number}
 */
export function countMentions(content) {
  if (!content) {
    return 0;
  }
  
  const mentions = parseMentions(content);
  return mentions.length;
}

/**
 * 获取可以@的用户列表（从话题参与者中获取）
 * @param {Object} topic - 话题对象
 * @param {Array} comments - 评论列表
 * @returns {Array} 用户列表
 */
export function getAvailableUsers(topic, comments = []) {
  const users = [];
  const userIds = new Set();
  
  // 添加话题作者
  if (topic && topic.author_id) {
    users.push({
      id: topic.author_id,
      name: topic.author_name || '未知用户',
      avatar: topic.author_avatar || '/static/images/default-avatar.png',
      role: 'author'
    });
    userIds.add(topic.author_id);
  }
  
  // 添加评论者
  comments.forEach(comment => {
    if (comment.user_id && !userIds.has(comment.user_id)) {
      users.push({
        id: comment.user_id,
        name: comment.user_name || '未知用户',
        avatar: comment.user_avatar || '/static/images/default-avatar.png',
        role: 'commenter'
      });
      userIds.add(comment.user_id);
    }
  });
  
  return users;
}

export default {
  detectMentionTrigger,
  parseMentions,
  insertMention,
  renderMentions,
  searchUsers,
  extractMentionedUsers,
  stripMentionTags,
  validateMentionFormat,
  countMentions,
  getAvailableUsers
};

