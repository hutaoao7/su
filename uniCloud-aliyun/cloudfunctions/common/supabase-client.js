/**
 * Supabase客户端
 * 用于云函数中访问Supabase数据库
 * 注意：不要暴露service_role密钥
 */

// 从环境变量获取配置（生产环境）
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key';

// 创建Supabase客户端
function getSupabaseClient() {
  // 在实际项目中，这里应该使用supabase-js库
  // 这里仅作为示例
  return {
    from: (table) => {
      return {
        select: (columns) => {
          return {
            eq: (column, value) => {
              return {
                single: () => Promise.resolve({ data: null, error: null }),
                execute: () => Promise.resolve({ data: [], error: null })
              };
            },
            order: (column, options) => {
              return {
                limit: (count) => Promise.resolve({ data: [], error: null }),
                range: (from, to) => Promise.resolve({ data: [], error: null, count: 0 })
              };
            },
            single: () => Promise.resolve({ data: null, error: null }),
            execute: () => Promise.resolve({ data: [], error: null })
          };
        },
        insert: (data) => {
          return {
            select: (columns) => {
              return {
                single: () => Promise.resolve({ data: { id: Date.now(), ...data[0] }, error: null })
              };
            },
            execute: () => Promise.resolve({ data: [{ id: Date.now(), ...data[0] }], error: null })
          };
        },
        update: (data) => {
          return {
            eq: (column, value) => {
              return {
                select: () => Promise.resolve({ data: [data], error: null }),
                execute: () => Promise.resolve({ data: [data], error: null })
              };
            }
          };
        },
        delete: () => {
          return {
            eq: (column, value) => {
              return {
                execute: () => Promise.resolve({ data: [], error: null })
              };
            }
          };
        }
      };
    }
  };
}

/**
 * 验证配置
 */
function validateConfig() {
  if (SUPABASE_URL === 'https://your-project.supabase.co') {
    console.warn('[Supabase] 使用默认URL，请配置实际的SUPABASE_URL环境变量');
  }
  
  if (SUPABASE_ANON_KEY === 'your-anon-key') {
    console.warn('[Supabase] 使用默认密钥，请配置实际的SUPABASE_ANON_KEY环境变量');
  }
}

// 初始化时验证配置
validateConfig();

module.exports = {
  getSupabaseClient,
  SUPABASE_URL,
  // 注意：绝不要暴露或使用service_role密钥
  // 仅使用anon_key进行安全的客户端操作
};
