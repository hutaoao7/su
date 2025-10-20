'use strict';

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[ASSESSMENT-GET-HISTORY]';

function verifyToken(context) {
  const token = context.UNI_ID_TOKEN || context.TOKEN;
  
  if (!token) {
    return { success: false, uid: null };
  }
  
  try {
    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
    const uid = payload.sub || payload.uid;
    return { success: true, uid };
  } catch (error) {
    return { success: false, uid: null };
  }
}

exports.main = async (event, context) => {
  try {
    console.log(TAG, '请求开始');
    
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        errCode: 401,
        errMsg: '未授权',
        data: null
      };
    }
    
    const uid = authResult.uid;
    const { limit = 20, offset = 0 } = event;
    
    const supabase = createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
    
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      console.error(TAG, 'Supabase查询失败:', error);
      return {
        errCode: 500,
        errMsg: '查询失败',
        data: null
      };
    }
    
    console.log(TAG, '查询成功，记录数:', data.length);
    
    return {
      errCode: 0,
      errMsg: 'ok',
      data: {
        records: data,
        total: data.length
      }
    };
    
  } catch (error) {
    console.error(TAG, '异常:', error);
    return {
      errCode: 500,
      errMsg: error.message,
      data: null
    };
  }
};

