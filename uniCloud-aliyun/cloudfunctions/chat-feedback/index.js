'use strict';

/**
 * chat-feedback云函数
 * 接收用户对AI回复的评分和反馈
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[CHAT-FEEDBACK]';

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
        success: false,
        code: 40301,
        msg: '未登录',
        data: null
      };
    }
    
    const userId = authResult.uid;
    const {
      sessionId,
      messageContent,
      messageTimestamp,
      rating,
      feedback = '',
      timestamp
    } = event;
    
    // 参数验证
    if (!sessionId || !messageContent || !rating) {
      return {
        success: false,
        code: 40001,
        msg: '参数缺失',
        data: null
      };
    }
    
    // 验证rating值
    if (!['good', 'bad', 'neutral'].includes(rating)) {
      return {
        success: false,
        code: 40002,
        msg: '无效的评分值',
        data: null
      };
    }
    
    const supabase = getSupabaseClient();
    
    // 保存反馈记录
    const feedbackData = {
      user_id: userId,
      session_id: sessionId,
      message_content: messageContent,
      message_timestamp: messageTimestamp || timestamp,
      rating: rating,
      feedback_text: feedback,
      created_at: new Date().toISOString(),
      device_info: context.PLATFORM || 'unknown'
    };
    
    const { data, error } = await supabase
      .from('chat_feedbacks')
      .insert([feedbackData])
      .select();
    
    if (error) {
      console.error(TAG, '保存反馈失败:', error);
      return {
        success: false,
        code: 50001,
        msg: '保存失败',
        data: null
      };
    }
    
    // 统计分析（异步执行，不阻塞响应）
    updateFeedbackStats(supabase, sessionId, rating).catch(err => {
      console.warn(TAG, '更新统计失败:', err);
    });
    
    console.log(TAG, '反馈保存成功');
    
    return {
      success: true,
      code: 0,
      msg: '提交成功',
      data: {
        feedback_id: data[0]?.id,
        timestamp: timestamp
      }
    };
    
  } catch (error) {
    console.error(TAG, '错误:', error);
    
    return {
      success: false,
      code: -1,
      msg: '服务器错误',
      data: null
    };
  }
};

/**
 * 更新反馈统计
 */
async function updateFeedbackStats(supabase, sessionId, rating) {
  try {
    // 查询该会话的评分统计
    const { data: stats, error } = await supabase
      .from('chat_feedbacks')
      .select('rating')
      .eq('session_id', sessionId);
    
    if (error) {
      console.error('查询统计失败:', error);
      return;
    }
    
    // 计算统计数据
    const goodCount = stats.filter(s => s.rating === 'good').length;
    const badCount = stats.filter(s => s.rating === 'bad').length;
    const totalCount = stats.length;
    const satisfaction = totalCount > 0 ? (goodCount / totalCount) * 100 : 0;
    
    // 更新会话表的统计字段
    await supabase
      .from('chat_sessions')
      .update({
        feedback_good_count: goodCount,
        feedback_bad_count: badCount,
        feedback_total_count: totalCount,
        satisfaction_rate: satisfaction,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);
    
    console.log('统计更新成功:', { sessionId, goodCount, badCount, satisfaction });
  } catch (error) {
    console.error('更新统计失败:', error);
  }
}

