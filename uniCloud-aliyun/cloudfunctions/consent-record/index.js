'use strict';

/**
 * consent-record云函数
 * 记录用户同意状态到Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[CONSENT-RECORD]';

// 创建Supabase客户端
function getSupabaseClient() {
  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
}

exports.main = async (event, context) => {
  try {
    console.log(TAG, '请求开始');
    const { user_id, agreed, version, agreements } = event;
    
    // 参数校验
    if (!user_id) {
      return {
        code: 40001,
        msg: '缺少用户ID',
        data: null
      };
    }
    
    const supabase = getSupabaseClient();
    
    // 获取IP地址
    const ipAddress = context.CLIENTIP || null;
    
    // 获取设备信息
    const deviceInfo = event.device_info || {};
    
    // 记录每个协议的同意状态
    const records = [];
    
    if (agreements) {
      for (const [agreementType, agreed] of Object.entries(agreements)) {
        if (agreed) {
          records.push({
            user_id: user_id,
            agreement_type: agreementType,
            version: version || '1.0.0',
            agreed: true,
            agreed_at: new Date().toISOString(),
            ip_address: ipAddress,
            device_info: JSON.stringify(deviceInfo)
          });
        }
      }
    } else {
      // 兼容旧版本，记录一条总的同意记录
      records.push({
        user_id: user_id,
        agreement_type: 'all',
        version: version || '1.0.0',
        agreed: agreed !== false,
        agreed_at: new Date().toISOString(),
        ip_address: ipAddress,
        device_info: JSON.stringify(deviceInfo)
      });
    }
    
    // 批量插入
    const { data, error } = await supabase
      .from('consent_records')
      .insert(records)
      .select();
    
    if (error) {
      console.error('记录同意状态失败:', error);
      return {
        code: 50002,
        msg: '保存失败',
        data: null
      };
    }
    
    console.log(`成功记录${records.length}条同意记录`);
    
    return {
      code: 0,
      msg: '记录成功',
      data: {
        recordIds: data.map(r => r.id),
        count: records.length
      }
    };
    
  } catch (error) {
    console.error('consent-record错误:', error);
    
    return {
      code: -1,
      msg: '服务器错误',
      data: null
    };
  }
};
