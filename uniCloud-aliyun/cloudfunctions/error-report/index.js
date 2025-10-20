/**
 * error-report 云函数
 * 
 * 功能：接收和处理客户端错误上报
 * 
 * @author CraneHeart Team
 * @date 2025-10-21
 */

'use strict';

const db = uniCloud.database();

exports.main = async (event, context) => {
  console.log('[error-report] 收到错误上报:', event);
  
  // 获取客户端信息
  const clientIP = context.CLIENTIP;
  const clientUA = context.CLIENTUA;
  
  const { errors, timestamp } = event;
  
  // 验证数据
  if (!errors || !Array.isArray(errors) || errors.length === 0) {
    return {
      code: 400,
      message: '无效的错误数据'
    };
  }
  
  try {
    // 批量保存错误
    const errorRecords = errors.map(error => ({
      // 基本信息
      error_id: error.id,
      error_type: error.type,
      error_level: error.level,
      error_message: error.message,
      error_stack: error.stack,
      fingerprint: error.fingerprint,
      
      // 上下文信息
      page: error.context?.page || '',
      route: error.context?.route || {},
      platform: error.context?.platform || '',
      system_info: error.context?.systemInfo || {},
      user_agent: error.context?.userAgent || clientUA,
      
      // 操作轨迹
      breadcrumbs: error.breadcrumbs || [],
      
      // 额外信息
      context: error.context || {},
      
      // 客户端信息
      client_ip: clientIP,
      client_ua: clientUA,
      
      // 时间戳
      error_timestamp: error.timestamp,
      report_timestamp: timestamp || Date.now(),
      created_at: new Date()
    }));
    
    // 批量插入数据库
    const result = await db.collection('error_logs').add(errorRecords);
    
    console.log(`[error-report] 成功保存${errorRecords.length}个错误`);
    
    // 检查是否有致命错误，发送告警
    const fatalErrors = errors.filter(e => e.level === 'fatal');
    if (fatalErrors.length > 0) {
      await sendAlert(fatalErrors, clientIP);
    }
    
    return {
      code: 0,
      message: '错误上报成功',
      data: {
        saved: errorRecords.length,
        ids: result.ids
      }
    };
    
  } catch (e) {
    console.error('[error-report] 保存错误失败:', e);
    
    return {
      code: 500,
      message: '保存错误失败: ' + e.message
    };
  }
};

/**
 * 发送告警（致命错误）
 */
async function sendAlert(fatalErrors, clientIP) {
  try {
    console.log(`[error-report] 检测到${fatalErrors.length}个致命错误，发送告警`);
    
    // TODO: 实现告警逻辑（邮件/短信/钉钉等）
    // 这里只记录日志
    fatalErrors.forEach(error => {
      console.error('[FATAL ERROR]', {
        message: error.message,
        page: error.context?.page,
        clientIP: clientIP,
        timestamp: error.timestamp
      });
    });
    
  } catch (e) {
    console.error('[error-report] 发送告警失败:', e);
  }
}
