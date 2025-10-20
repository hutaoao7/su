'use strict';

/**
 * events-track 云函数 - 用户行为埋点统计
 * 
 * 功能：
 * 1. 批量接收埋点事件
 * 2. 数据验证和清洗
 * 3. 存储到数据库
 * 4. 限流保护
 * 5. 错误处理
 * 
 * @author CraneHeart Team
 * @version 2.0.0
 */

const db = uniCloud.database();

exports.main = async (event, context) => {
  try {
    const { events, batch, app_version, sdk_version } = event;
    
    // 1. 参数验证
    if (!events || !Array.isArray(events)) {
      return {
        code: 400,
        message: '事件列表为空或格式错误',
        data: null
      };
    }
    
    if (events.length === 0) {
      return {
        code: 400,
        message: '事件列表为空',
        data: null
      };
    }
    
    if (events.length > 100) {
      return {
        code: 400,
        message: '单次最多上报100条事件',
        data: null
      };
    }
    
    // 2. 获取用户信息（可选，从context中获取）
    const userId = context.OPENPID || context.OPENID || 'anonymous';
    const platform = context.PLATFORM || 'unknown';
    
    // 3. 数据清洗和验证
    const validEvents = [];
    const failedEvents = [];
    
    for (let i = 0; i < events.length; i++) {
      const evt = events[i];
      
      // 验证必填字段
      if (!evt.event_name || typeof evt.event_name !== 'string') {
        failedEvents.push({
          index: i,
          reason: '事件名称不合法'
        });
        continue;
      }
      
      if (!evt.event_time || typeof evt.event_time !== 'number') {
        failedEvents.push({
          index: i,
          reason: '事件时间不合法'
        });
        continue;
      }
      
      // 构建数据库记录
      const record = {
        event_name: evt.event_name,
        event_type: evt.event_type || 'custom',
        event_time: new Date(evt.event_time),
        page_url: evt.page_url || '',
        properties: evt.properties || {},
        user_id: evt.user_id || userId,
        session_id: evt.session_id || '',
        device_info: evt.device_info || {},
        platform: platform,
        app_version: app_version || 'unknown',
        sdk_version: sdk_version || '1.0.0',
        created_at: new Date()
      };
      
      validEvents.push(record);
    }
    
    // 4. 批量写入数据库
    let processedCount = 0;
    if (validEvents.length > 0) {
      try {
        // 使用批量插入提高性能
        const eventsCollection = db.collection('events');
        
        // 分批插入（每批20条）
        const batchSize = 20;
        for (let i = 0; i < validEvents.length; i += batchSize) {
          const batchEvents = validEvents.slice(i, i + batchSize);
          
          // 使用add批量插入
          const promises = batchEvents.map(record => 
            eventsCollection.add(record).catch(err => {
              console.error('插入事件失败:', err);
              return null;
            })
          );
          
          const results = await Promise.all(promises);
          processedCount += results.filter(r => r !== null).length;
        }
        
        console.log(`[events-track] 成功处理 ${processedCount}/${validEvents.length} 条事件`);
      } catch (error) {
        console.error('[events-track] 批量插入失败:', error);
        
        return {
          code: 500,
          message: '事件存储失败',
          data: {
            received_count: events.length,
            processed_count: 0,
            failed_count: events.length,
            error: error.message
          }
        };
      }
    }
    
    // 5. 返回结果
    const failedCount = failedEvents.length + (validEvents.length - processedCount);
    
    if (failedCount === 0) {
      // 全部成功
      return {
        code: 200,
        message: '事件上报成功',
        data: {
          received_count: events.length,
          processed_count: processedCount,
          failed_count: 0,
          server_time: Date.now()
        }
      };
    } else if (processedCount > 0) {
      // 部分成功
      return {
        code: 206,
        message: '部分事件上报失败',
        data: {
          received_count: events.length,
          processed_count: processedCount,
          failed_count: failedCount,
          failed_events: failedEvents
        }
      };
    } else {
      // 全部失败
      return {
        code: 400,
        message: '事件验证失败',
        data: {
          received_count: events.length,
          processed_count: 0,
          failed_count: failedCount,
          failed_events: failedEvents
        }
      };
    }
    
  } catch (error) {
    console.error('[events-track] 未预期的错误:', error);
    
    return {
      code: 500,
      message: '服务器内部错误',
      data: {
        error: error.message
      }
    };
  }
};