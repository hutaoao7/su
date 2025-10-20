'use strict';

/**
 * 提交反馈
 */

const { getSupabaseClient } = require('../common/supabase-client');
const { verifyToken, getClientIP, getUserAgent } = require('../common/auth');

exports.main = async (event, context) => {
  const TAG = '[feedback-submit]';
  
  try {
    console.log(TAG, '========== 请求开始 ==========');
    console.log(TAG, '请求参数:', JSON.stringify(event, null, 2));
    
    // 验证token
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        errCode: 401,
        errMsg: authResult.message || '未授权访问'
      };
    }
    
    const uid = authResult.uid;
    
    // 获取反馈参数
    const {
      type,
      title,
      content,
      contact,
      images = [],
      deviceInfo = {}
    } = event;
    
    // 参数验证
    if (!type || !['bug', 'feature', 'complaint', 'other'].includes(type)) {
      return {
        errCode: 400,
        errMsg: '反馈类型无效'
      };
    }
    
    if (!title || title.trim().length < 2) {
      return {
        errCode: 400,
        errMsg: '标题至少需要2个字符'
      };
    }
    
    if (!content || content.trim().length < 10) {
      return {
        errCode: 400,
        errMsg: '内容至少需要10个字符'
      };
    }
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 构建反馈数据
    const feedbackData = {
      user_id: uid,
      type: type,
      title: title.trim(),
      content: content.trim(),
      contact: contact || null,
      images: images.length > 0 ? images : null,
      device_info: {
        ...deviceInfo,
        ip: getClientIP(context),
        userAgent: getUserAgent(context)
      },
      status: 'pending', // pending, processing, resolved, closed
      created_at: new Date().toISOString()
    };
    
    // 插入反馈记录
    const { data: feedback, error } = await supabase
      .from('feedbacks')
      .insert([feedbackData])
      .select()
      .single();
    
    if (error) {
      console.error(TAG, '提交反馈失败:', error);
      return {
        errCode: -1,
        errMsg: '提交失败: ' + error.message
      };
    }
    
    // 发送通知给管理员（可选）
    try {
      // 这里可以添加发送邮件或推送通知的逻辑
      console.log(TAG, '新反馈通知:', {
        feedbackId: feedback.id,
        type: type,
        title: title
      });
    } catch (notifyError) {
      console.error(TAG, '发送通知失败:', notifyError);
      // 不影响主流程
    }
    
    console.log(TAG, '反馈提交成功，ID:', feedback.id);
    console.log(TAG, '========== 请求结束 ==========');
    
    return {
      errCode: 0,
      errMsg: '提交成功',
      data: {
        feedbackId: feedback.id,
        submittedAt: feedback.created_at,
        message: '感谢您的反馈，我们会尽快处理！'
      }
    };
    
  } catch (error) {
    console.error(TAG, '执行错误:', error);
    return {
      errCode: -1,
      errMsg: '系统错误: ' + error.message
    };
  }
};