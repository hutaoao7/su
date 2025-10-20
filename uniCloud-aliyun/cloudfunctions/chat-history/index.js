'use strict';

/**
 * chat-history云函数
 * 获取聊天历史记录
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[CHAT-HISTORY]';

// 创建Supabase客户端
function getSupabaseClient() {
  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
}

// Token验证
function verifyToken(context) {
  const token = context.UNI_ID_TOKEN || context.TOKEN;
  
  if (!token) {
    return { success: false, uid: null };
  }
  
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const uid = payload.sub || payload.uid;
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { success: false, uid: null };
    }
    
    return { success: true, uid: uid };
  } catch (error) {
    return { success: false, uid: null };
  }
}

exports.main = async (event, context) => {
  try {
    console.log(TAG, '请求开始');
    
    // 验证Token
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        code: 40301,
        msg: '未登录',
        data: null
      };
    }
    
    const userId = authResult.uid;
    const { session_id, page = 1, page_size = 50 } = event;
    
    const supabase = getSupabaseClient();
    
    // 如果提供session_id，获取该会话的消息
    if (session_id) {
      const { data: messages, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', session_id)
        .eq('user_id', userId)
        .order('created_at', { ascending: true })
        .range((page - 1) * page_size, page * page_size - 1);
      
      if (error) {
        console.error('查询聊天记录失败:', error);
        return {
          code: 50002,
          msg: '查询失败',
          data: null
        };
      }
      
      return {
        code: 0,
        msg: '查询成功',
        data: {
          session_id: session_id,
          messages: messages || [],
          page: page,
          page_size: page_size
        }
      };
    }
    
    // 否则获取用户的所有会话列表
    const { data: sessions, error: sessionsError } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_message_at', { ascending: false })
      .range((page - 1) * page_size, page * page_size - 1);
    
    if (sessionsError) {
      console.error('查询会话列表失败:', sessionsError);
      return {
        code: 50002,
        msg: '查询失败',
        data: null
      };
    }
    
    return {
      code: 0,
      msg: '查询成功',
      data: {
        sessions: sessions || [],
        page: page,
        page_size: page_size
      }
    };
    
  } catch (error) {
    console.error('chat-history错误:', error);
    
    return {
      code: -1,
      msg: '服务器错误',
      data: null
    };
  }
};
