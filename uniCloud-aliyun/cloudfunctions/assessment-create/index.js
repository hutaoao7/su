'use strict';

/**
 * assessment-create云函数
 * 创建评估记录并计算结果
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');
const { scoreUnified } = require('./scoring');

const TAG = '[ASSESSMENT-CREATE]';

// 创建Supabase客户端
function getSupabaseClient() {
  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
}

// Token验证（复用user-update-profile的逻辑）
function verifyToken(context) {
  const token = context.UNI_ID_TOKEN || context.TOKEN;
  
  if (!token) {
    return { success: false, uid: null, message: '未登录' };
  }
  
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { success: false, uid: null, message: 'Token格式不正确' };
    }
    
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const uid = payload.sub || payload.uid;
    
    if (!uid) {
      return { success: false, uid: null, message: 'Token中未包含用户ID' };
    }
    
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return { success: false, uid: null, message: 'Token已过期' };
    }
    
    return { success: true, uid: uid, message: 'ok' };
  } catch (error) {
    console.error(TAG, 'Token解析失败:', error);
    return { success: false, uid: null, message: 'Token解析失败' };
  }
}

exports.main = async (event, context) => {
  try {
    console.log(TAG, '========== 请求开始 ==========');
    
    // 1. 验证Token
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        code: 40301,
        msg: authResult.message,
        data: null
      };
    }
    
    const userId = authResult.uid;
    const { scale_id, answers, completion_time, session_id } = event;
    
    // 2. 参数校验
    if (!scale_id) {
      return {
        code: 40001,
        msg: '缺少量表ID',
        data: null
      };
    }
    
    if (!answers || typeof answers !== 'object') {
      return {
        code: 40001,
        msg: '答案格式错误',
        data: null
      };
    }
    
    const supabase = getSupabaseClient();
    
    // 3. 检查量表是否存在
    const { data: scale, error: scaleError } = await supabase
      .from('assessment_scales')
      .select('*')
      .eq('scale_id', scale_id)
      .eq('is_active', true)
      .single();
    
    if (scaleError || !scale) {
      return {
        code: 40002,
        msg: '量表不存在或已禁用',
        data: null
      };
    }
    
    // 4. 验证答案完整性
    const answerCount = Object.keys(answers).length;
    if (answerCount < scale.question_count) {
      return {
        code: 40003,
        msg: '答案不完整',
        data: { 
          expected: scale.question_count,
          actual: answerCount
        }
      };
    }
    
    // 5. 计算评分
    const scoreResult = scoreUnified(scale_id, answers);
    
    if (!scoreResult) {
      return {
        code: 50001,
        msg: '评分计算失败',
        data: null
      };
    }
    
    // 6. 创建评估记录
    const { data: assessment, error: assessError } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        scale_id: scale_id,
        session_id: session_id,
        total_score: scoreResult.score,
        level: scoreResult.level,
        completion_time: completion_time,
        status: 'completed',
        started_at: new Date(Date.now() - (completion_time || 0) * 1000).toISOString(),
        completed_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (assessError || !assessment) {
      console.error('创建评估记录失败:', assessError);
      return {
        code: 50002,
        msg: '保存评估记录失败',
        data: null
      };
    }
    
    // 7. 保存答案详情
    const answerRecords = Object.entries(answers).map(([qId, value]) => ({
      assessment_id: assessment.id,
      question_id: qId,
      answer_value: String(value),
      answer_score: null  // 可以根据量表规则计算单题分数
    }));
    
    const { error: answersError } = await supabase
      .from('assessment_answers')
      .insert(answerRecords);
    
    if (answersError) {
      console.error('保存答案详情失败:', answersError);
    }
    
    // 8. 保存评估结果
    const { error: resultError } = await supabase
      .from('assessment_results')
      .insert({
        assessment_id: assessment.id,
        user_id: userId,
        scale_id: scale_id,
        total_score: scoreResult.score,
        max_score: scoreResult.maxScore || null,
        score_percentage: scoreResult.maxScore ? (scoreResult.score / scoreResult.maxScore * 100) : null,
        level: scoreResult.level,
        level_description: scoreResult.description || null,
        suggestions: scoreResult.suggestions ? JSON.stringify(scoreResult.suggestions) : null,
        risk_factors: scoreResult.riskFactors ? JSON.stringify(scoreResult.riskFactors) : null
      });
    
    if (resultError) {
      console.error('保存评估结果失败:', resultError);
    }
    
    // 9. 返回结果
    return {
      code: 0,
      msg: '评估创建成功',
      data: {
        assessment_id: assessment.id,
        result: {
          total_score: scoreResult.score,
          max_score: scoreResult.maxScore,
          score_percentage: scoreResult.maxScore ? (scoreResult.score / scoreResult.maxScore * 100).toFixed(2) : null,
          level: scoreResult.level,
          level_description: scoreResult.description,
          suggestions: scoreResult.suggestions || [],
          risk_factors: scoreResult.riskFactors || []
        }
      }
    };
    
  } catch (error) {
    console.error('assessment-create错误:', error);
    
    return {
      code: -1,
      msg: '服务器错误',
      data: null
    };
  }
};

