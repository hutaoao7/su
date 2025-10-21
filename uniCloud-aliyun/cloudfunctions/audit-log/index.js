'use strict';

const db = uniCloud.database();
const auth = require('../common/auth');

/**
 * 审计日志云函数
 * 处理审计日志查询、导出等操作
 */
exports.main = async (event, context) => {
  console.log('[audit-log] 请求参数:', event);
  
  const { action, token, startDate, endDate, limit = 100 } = event;
  
  try {
    // 验证Token并获取用户信息
    const userInfo = await auth.verifyToken(token);
    if (!userInfo) {
      return {
        code: 401,
        message: '未授权，请先登录'
      };
    }
    
    // 根据action执行不同操作
    switch (action) {
      case 'query_audit_records':
        // 任务3: 查询审计记录
        return await queryAuditRecords(userInfo, { startDate, endDate, limit });
      
      case 'export_audit_report':
        // 任务3: 导出审计报告
        return await exportAuditReport(userInfo, { startDate, endDate });
      
      case 'undo_action':
        // 撤销操作
        return await undoAction(userInfo, event.recordId);
      
      default:
        return {
          code: 400,
          message: '不支持的操作类型'
        };
    }
  } catch (error) {
    console.error('[audit-log] 错误:', error);
    return {
      code: 500,
      message: error.message || '服务器错误'
    };
  }
};

/**
 * 任务3: 查询审计记录
 */
async function queryAuditRecords(userInfo, params) {
  try {
    const { startDate, endDate, limit } = params;
    const userId = userInfo._id || userInfo.uid;
    
    // 构建查询条件
    let query = db.collection('consent_revoke_logs')
      .where({
        user_id: userId
      });
    
    // 添加时间范围筛选
    if (startDate && endDate) {
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000);
      
      query = query.where({
        created_at: db.command.gte(startTime)
      }).where({
        created_at: db.command.lte(endTime)
      });
    }
    
    // 查询记录
    const res = await query
      .orderBy('created_at', 'desc')
      .limit(limit)
      .get();
    
    // 格式化返回数据
    const records = res.data.map(record => ({
      id: record._id,
      actionType: record.action_type,
      reason: record.reason,
      customReason: record.custom_reason,
      revokedItems: record.revoked_items,
      status: record.status,
      timestamp: record.created_at,
      scheduledAt: record.scheduled_at,
      completedAt: record.completed_at,
      deviceInfo: record.device_info
    }));
    
    console.log('[audit-log] 查询到', records.length, '条记录');
    
    return {
      code: 200,
      message: '查询成功',
      data: records
    };
  } catch (error) {
    console.error('[audit-log] 查询审计记录失败:', error);
    return {
      code: 500,
      message: '查询审计记录失败'
    };
  }
}

/**
 * 任务3: 导出审计报告
 */
async function exportAuditReport(userInfo, params) {
  try {
    const { startDate, endDate } = params;
    const userId = userInfo._id || userInfo.uid;
    
    // 查询所有审计记录
    let query = db.collection('consent_revoke_logs')
      .where({
        user_id: userId
      });
    
    if (startDate && endDate) {
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime() + (24 * 60 * 60 * 1000);
      
      query = query.where({
        created_at: db.command.gte(startTime)
      }).where({
        created_at: db.command.lte(endTime)
      });
    }
    
    const res = await query.get();
    
    // 生成报告ID
    const reportId = `audit_${userId}_${Date.now()}`;
    
    // 记录导出
    await db.collection('audit_export_logs').add({
      user_id: userId,
      report_id: reportId,
      record_count: res.data.length,
      start_date: startDate,
      end_date: endDate,
      format: 'pdf',
      status: 'completed',
      created_at: Date.now(),
      expires_at: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7天后过期
    });
    
    console.log('[audit-log] 报告已生成:', reportId);
    
    return {
      code: 200,
      message: '报告已生成',
      data: {
        reportId: reportId,
        recordCount: res.data.length,
        downloadUrl: `/api/audit-report/${reportId}` // 可选的下载链接
      }
    };
  } catch (error) {
    console.error('[audit-log] 导出审计报告失败:', error);
    return {
      code: 500,
      message: '导出审计报告失败'
    };
  }
}

/**
 * 撤销操作
 */
async function undoAction(userInfo, recordId) {
  try {
    const userId = userInfo._id || userInfo.uid;
    
    // 查找记录
    const recordRes = await db.collection('consent_revoke_logs')
      .doc(recordId)
      .get();
    
    if (!recordRes.data || recordRes.data.user_id !== userId) {
      return {
        code: 403,
        message: '无权限访问此记录'
      };
    }
    
    const record = recordRes.data;
    
    // 检查是否可以撤销
    if (record.status !== 'pending') {
      return {
        code: 400,
        message: '此操作无法撤销'
      };
    }
    
    // 检查是否在7天内
    const daysPassed = (Date.now() - new Date(record.created_at).getTime()) / (24 * 60 * 60 * 1000);
    if (daysPassed >= 7) {
      return {
        code: 400,
        message: '撤销期已过期'
      };
    }
    
    // 更新记录状态
    await db.collection('consent_revoke_logs')
      .doc(recordId)
      .update({
        status: 'cancelled',
        cancelled_at: Date.now(),
        updated_at: Date.now()
      });
    
    console.log('[audit-log] 操作已撤销:', recordId);
    
    return {
      code: 200,
      message: '撤销成功'
    };
  } catch (error) {
    console.error('[audit-log] 撤销操作失败:', error);
    return {
      code: 500,
      message: '撤销操作失败'
    };
  }
}

