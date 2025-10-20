'use strict';

// 密钥清洗函数：去除空格和换行
function cleanKey(key) {
  return key ? String(key).trim().replace(/\s+/g, '') : '';
}

// 确保 URL 为 https 并去除尾部斜杠
function ensureHttps(url) {
  if (!url) return '';
  let cleanUrl = String(url).trim();
  
  // 强制 https
  if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace('http://', 'https://');
  }
  if (!cleanUrl.startsWith('https://')) {
    cleanUrl = 'https://' + cleanUrl;
  }
  
  // 去除尾部斜杠
  if (cleanUrl.endsWith('/')) {
    cleanUrl = cleanUrl.slice(0, -1);
  }
  
  return cleanUrl;
}

const rawUrl = process.env.SUPABASE_URL || 'https://pigbgzyknweghavrayfb.supabase.co';
const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_secret_bq-w_T8VMQFkc6xATumTRQ_7n5rk-OY';

module.exports = {
  url: ensureHttps(rawUrl),
  serviceRoleKey: cleanKey(rawKey)
};
