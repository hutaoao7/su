'use strict';

/**
 * 获取用户信息云函数
 */

const { getSupabaseClient } = require('../common/supabase-client');
const { verifyToken } = require('../common/auth');

exports.main = async (event, context) => {
  const TAG = '[user-info]';
  
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
    const { targetUserId } = event;
    
    // 确定要查询的用户ID（默认查询自己）
    const queryUserId = targetUserId || uid;
    
    // 获取Supabase客户端
    const supabase = getSupabaseClient();
    
    // 查询用户信息
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        id,
        nickname,
        avatar_url,
        gender,
        birthday,
        bio,
        phone,
        email,
        created_at,
        updated_at
      `)
      .eq('id', queryUserId)
      .single();
    
    if (userError) {
      console.error(TAG, '查询用户信息失败:', userError);
      
      if (userError.code === 'PGRST116') {
        return {
          errCode: 404,
          errMsg: '用户不存在'
        };
      }
      
      return {
        errCode: -1,
        errMsg: '查询失败: ' + userError.message
      };
    }
    
    // 查询用户的其他统计信息（可选）
    const statsPromises = [];
    
    // 查询评估记录数
    statsPromises.push(
      supabase
        .from('assessment_records')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', queryUserId)
    );
    
    // 查询CDK兑换记录数
    statsPromises.push(
      supabase
        .from('cdk_redemptions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', queryUserId)
    );
    
    // 等待所有查询完成
    const [assessmentResult, cdkResult] = await Promise.all(statsPromises);
    
    // 组装返回数据
    const responseData = {
      ...userData,
      stats: {
        assessmentCount: assessmentResult.count || 0,
        cdkCount: cdkResult.count || 0
      }
    };
    
    console.log(TAG, '查询成功，用户ID:', queryUserId);
    console.log(TAG, '========== 请求结束 ==========');
    
    return {
      errCode: 0,
      errMsg: '获取成功',
      data: responseData
    };
    
  } catch (error) {
    console.error(TAG, '执行错误:', error);
    return {
      errCode: -1,
      errMsg: '系统错误: ' + error.message
    };
  }
};
