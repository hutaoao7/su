// URL 规范化函数
function normalizeUrl(url) {
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

// 密钥清洗函数
function cleanKey(key) {
  return key ? String(key).trim().replace(/\s+/g, '') : '';
}

// 先尝试加载 supabase 配置模块
let supabase;
try {
  supabase = require('./supabase'); // { url, serviceRoleKey }
} catch (e) {
  supabase = {};
}

// 环境变量兜底 - 避免 TDZ，使用不同变量名
const envUrl = process.env.SUPABASE_URL;
const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabase?.url || !supabase?.serviceRoleKey) {
  if (envUrl && envKey) {
    supabase = { 
      url: normalizeUrl(envUrl), 
      serviceRoleKey: cleanKey(envKey) 
    };
  }
} else {
  // 规范化现有配置
  supabase = {
    url: normalizeUrl(supabase.url),
    serviceRoleKey: cleanKey(supabase.serviceRoleKey)
  };
}

// 安全自检日志（不打印明文）
const mask = (s) => (s ? `${String(s).slice(0, 4)}***(${String(s).length})` : 'none');

console.log('[SECRETS] supabase.url:', mask(supabase?.url), ' key.len:', supabase?.serviceRoleKey ? String(supabase.serviceRoleKey).length : 0);

// 统一导出形状：推荐 { supabase }
module.exports = { supabase };
