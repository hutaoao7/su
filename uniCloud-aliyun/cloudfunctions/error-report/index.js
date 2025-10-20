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
  console.log('[error-report] 收到请求:', event);
  
  const { action = 'report' } = event;
  
  // 路由分发
  switch (action) {
    case 'report':
      return await handleErrorReport(event, context);
    case 'get_dashboard':
      return await getDashboardData(event, context);
    default:
      return {
        code: 400,
        message: '无效的操作类型'
      };
  }
};

/**
 * 处理错误上报
 */
async function handleErrorReport(event, context) {
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

/**
 * 获取看板数据
 */
async function getDashboardData(event, context) {
  try {
    const { timeRange = 24 } = event; // 默认24小时
    
    const now = new Date();
    const startTime = new Date(now.getTime() - timeRange * 60 * 60 * 1000);
    
    // 并发查询各项数据
    const [overview, trend, typeDistribution, topErrors, pageErrors] = await Promise.all([
      getOverviewData(startTime, now),
      getTrendData(startTime, now),
      getTypeDistribution(startTime, now),
      getTopErrors(startTime, now),
      getPageErrors(startTime, now)
    ]);
    
    return {
      code: 0,
      message: '获取看板数据成功',
      data: {
        overview,
        trend,
        typeDistribution,
        topErrors,
        pageErrors
      }
    };
    
  } catch (e) {
    console.error('[error-report] 获取看板数据失败:', e);
    
    return {
      code: 500,
      message: '获取看板数据失败: ' + e.message
    };
  }
}

/**
 * 获取概览数据
 */
async function getOverviewData(startTime, endTime) {
  const $ = db.command.aggregate;
  
  // 今日错误数
  const todayStart = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
  const todayErrors = await db.collection('error_logs')
    .where({
      created_at: $.gte(todayStart)
    })
    .count();
  
  // 昨日错误数（用于计算变化）
  const yesterdayStart = new Date(todayStart.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayErrors = await db.collection('error_logs')
    .where({
      created_at: $.gte(yesterdayStart).and($.lt(todayStart))
    })
    .count();
  
  // 致命错误数
  const fatalErrors = await db.collection('error_logs')
    .where({
      created_at: $.gte(todayStart),
      error_level: 'fatal'
    })
    .count();
  
  // 昨日致命错误数
  const yesterdayFatal = await db.collection('error_logs')
    .where({
      created_at: $.gte(yesterdayStart).and($.lt(todayStart)),
      error_level: 'fatal'
    })
    .count();
  
  // 受影响用户数（去重）
  const affectedUsers = await db.collection('error_logs')
    .where({
      created_at: $.gte(todayStart)
    })
    .field({
      'context.userId': true
    })
    .get();
  
  const uniqueUsers = new Set(
    affectedUsers.data
      .filter(item => item.context && item.context.userId)
      .map(item => item.context.userId)
  );
  
  // 错误率（假设总PV存储在其他表，这里简化计算）
  const totalPV = 10000; // 示例值
  const errorRate = (todayErrors.total / totalPV) * 100;
  
  return {
    todayErrors: todayErrors.total || 0,
    errorChange: yesterdayErrors.total > 0 
      ? ((todayErrors.total - yesterdayErrors.total) / yesterdayErrors.total * 100).toFixed(1) 
      : 0,
    
    fatalErrors: fatalErrors.total || 0,
    fatalChange: yesterdayFatal.total > 0 
      ? ((fatalErrors.total - yesterdayFatal.total) / yesterdayFatal.total * 100).toFixed(1) 
      : 0,
    
    affectedUsers: uniqueUsers.size,
    userChange: 0, // 简化处理
    
    errorRate: errorRate,
    rateChange: 0 // 简化处理
  };
}

/**
 * 获取趋势数据（24小时，每小时一个数据点）
 */
async function getTrendData(startTime, endTime) {
  const $ = db.command.aggregate;
  
  // 聚合查询按小时统计
  const result = await db.collection('error_logs')
    .aggregate()
    .match({
      created_at: $.gte(startTime).and($.lte(endTime))
    })
    .group({
      _id: {
        $dateToString: {
          date: '$created_at',
          format: '%Y-%m-%d-%H'
        }
      },
      count: $.sum(1)
    })
    .end();
  
  // 生成24小时完整数据（填充缺失的小时）
  const trendData = [];
  for (let i = 0; i < 24; i++) {
    const hour = new Date(endTime.getTime() - (23 - i) * 60 * 60 * 1000).getHours();
    const dateStr = new Date(endTime.getTime() - (23 - i) * 60 * 60 * 1000).toISOString().slice(0, 13);
    
    const found = result.data.find(item => item._id && item._id.includes(dateStr.slice(0, 13)));
    
    trendData.push({
      hour: hour,
      count: found ? found.count : 0
    });
  }
  
  return trendData;
}

/**
 * 获取类型分布
 */
async function getTypeDistribution(startTime, endTime) {
  const $ = db.command.aggregate;
  
  const result = await db.collection('error_logs')
    .aggregate()
    .match({
      created_at: $.gte(startTime).and($.lte(endTime))
    })
    .group({
      _id: '$error_type',
      count: $.sum(1)
    })
    .end();
  
  // 类型标签映射
  const typeLabels = {
    'vue': 'Vue错误',
    'promise': 'Promise错误',
    'js': 'JS错误',
    'resource': '资源错误',
    'api': 'API错误',
    'custom': '自定义错误'
  };
  
  return result.data.map(item => ({
    type: item._id,
    label: typeLabels[item._id] || item._id,
    count: item.count
  }));
}

/**
 * 获取高频错误Top 10
 */
async function getTopErrors(startTime, endTime) {
  const $ = db.command.aggregate;
  
  const result = await db.collection('error_logs')
    .aggregate()
    .match({
      created_at: $.gte(startTime).and($.lte(endTime))
    })
    .group({
      _id: '$fingerprint',
      message: $.first('$error_message'),
      type: $.first('$error_type'),
      level: $.first('$error_level'),
      count: $.sum(1),
      affected_users: $.addToSet('$context.userId')
    })
    .sort({
      count: -1
    })
    .limit(10)
    .end();
  
  return result.data.map(item => ({
    fingerprint: item._id,
    message: item.message,
    type: item.type,
    level: item.level,
    count: item.count,
    affected_users: item.affected_users ? item.affected_users.filter(u => u).length : 0
  }));
}

/**
 * 获取页面错误统计Top 10
 */
async function getPageErrors(startTime, endTime) {
  const $ = db.command.aggregate;
  
  const result = await db.collection('error_logs')
    .aggregate()
    .match({
      created_at: $.gte(startTime).and($.lte(endTime))
    })
    .group({
      _id: '$page',
      count: $.sum(1)
    })
    .sort({
      count: -1
    })
    .limit(10)
    .end();
  
  return result.data
    .filter(item => item._id) // 过滤空页面
    .map(item => ({
      page: item._id,
      count: item.count
    }));
}
