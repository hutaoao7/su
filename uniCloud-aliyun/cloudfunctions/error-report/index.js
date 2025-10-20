'use strict';

/**
 * error-report云函数
 * 功能：接收并记录前端错误日志
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[ERROR-REPORT]';

// 创建Supabase客户端
function getSupabaseClient() {
  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
}

exports.main = async (event, context) => {
  const { errors, log, batch_id } = event;
  
  try {
    console.log(TAG, '接收错误上报');
    const supabase = getSupabaseClient();
    
    // 批量上报错误
    if (errors && Array.isArray(errors)) {
      const errorRecords = errors.map(error => ({
        user_id: error.userId || null,
        error_type: error.type || 'unknown',
        error_message: error.message || '',
        error_stack: error.stack || null,
        page_path: error.page || null,
        user_agent: error.userAgent ? JSON.stringify(error.userAgent) : null,
        device_info: error.deviceInfo ? JSON.stringify(error.deviceInfo) : null,
        operation_trace: error.operationTrace ? JSON.stringify(error.operationTrace) : null,
        severity: error.severity || 'error',
        is_handled: false
      }));
      
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert(errorRecords);
      
      if (dbError) {
        console.error('保存错误日志失败:', dbError);
        return {
          code: -1,
          msg: '保存失败',
          data: null
        };
      }
      
      console.log(`成功记录${errors.length}个错误`);
      
      return {
        code: 0,
        msg: '错误已记录',
        data: {
          count: errors.length,
          batch_id: batch_id
        }
      };
    }
    
    // 单条错误上报
    if (log) {
      const { error: dbError } = await supabase
        .from('error_logs')
        .insert({
          user_id: log.userId || null,
          error_type: log.type || 'unknown',
          error_message: log.message || '',
          error_stack: log.stack || null,
          page_path: log.page || null,
          severity: 'error'
        });
      
      if (dbError) {
        console.error('保存错误日志失败:', dbError);
        return {
          code: -1,
          msg: '保存失败',
          data: null
        };
      }
      
      return {
        code: 0,
        msg: '错误已记录',
        data: null
      };
    }
    
    return {
      code: 40001,
      msg: '缺少错误数据',
      data: null
    };
    
  } catch (error) {
    console.error('error-report云函数错误:', error);
    
    return {
      code: -1,
      msg: '服务器错误',
      data: null
    };
  }
};


