'use strict';

/**
 * user-update-profile 云函数
 * 功能：更新用户个人资料信息到Supabase数据库
 */

const { createClient } = require('@supabase/supabase-js');
const supabaseConfig = require('../common/secrets/supabase');

const TAG = '[USER-UPDATE-PROFILE]';

// 参数校验规则
const VALIDATION_RULES = {
  nickname: {
    type: 'string',
    required: false,
    minLength: 2,
    maxLength: 20,
    pattern: /^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/,
    message: '昵称长度2-20字符，仅支持中英文、数字、下划线、连字符'
  },
  avatar: {
    type: 'string',
    required: false,
    pattern: /^https?:\/\/.+$/,
    message: '头像URL格式不正确'
  },
  gender: {
    type: 'string',
    required: false,
    enum: ['male', 'female', 'other', ''],
    message: '性别值不合法，仅支持: male, female, other'
  },
  birthday: {
    type: 'string',
    required: false,
    pattern: /^\d{4}-\d{2}-\d{2}$/,
    message: '生日格式应为YYYY-MM-DD'
  },
  bio: {
    type: 'string',
    required: false,
    maxLength: 200,
    message: '个人简介不超过200字'
  }
};

function verifyToken(context) {
  const token = context.UNI_ID_TOKEN || context.TOKEN;
  
  if (!token) {
    return {
      success: false,
      uid: null,
      message: '未提供token，请先登录'
    };
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
      return { success: false, uid: null, message: 'Token已过期，请重新登录' };
    }
    
    return { success: true, uid: uid, message: 'ok' };
  } catch (error) {
    console.error(TAG, 'Token解析失败:', error);
    return { success: false, uid: null, message: 'Token解析失败' };
  }
}

function validateField(field, value) {
  const rule = VALIDATION_RULES[field];
  if (!rule) {
    return { valid: true, error: '' };
  }
  
  if (!value && !rule.required) {
    return { valid: true, error: '' };
  }
  
  if (rule.type && typeof value !== rule.type) {
    return { valid: false, error: `${field}类型错误` };
  }
  
  if (rule.required && !value) {
    return { valid: false, error: `${field}不能为空` };
  }
  
  if (rule.type === 'string' && value) {
    if (rule.minLength && value.length < rule.minLength) {
      return { valid: false, error: `${field}长度不能少于${rule.minLength}字符` };
    }
    if (rule.maxLength && value.length > rule.maxLength) {
      return { valid: false, error: `${field}长度不能超过${rule.maxLength}字符` };
    }
  }
  
  if (rule.pattern && value && !rule.pattern.test(value)) {
    return { valid: false, error: rule.message };
  }
  
  if (rule.enum && value && !rule.enum.includes(value)) {
    return { valid: false, error: rule.message };
  }
  
  return { valid: true, error: '' };
}

function validateUpdates(updates) {
  const errors = [];
  
  for (const [field, value] of Object.entries(updates)) {
    const validation = validateField(field, value);
    if (!validation.valid) {
      errors.push({
        field: field,
        message: validation.error
      });
    }
  }
  
  return errors;
}

function getSupabaseClient() {
  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey);
}

exports.main = async (event, context) => {
  try {
    console.log(TAG, '========== 请求开始 ==========');
    
    const authResult = verifyToken(context);
    if (!authResult.success) {
      return {
        errCode: 401,
        errMsg: authResult.message,
        data: null
      };
    }
    
    const uid = authResult.uid;
    console.log(TAG, '✅ Token验证通过, uid:', uid);
    
    const { nickname, avatar, gender, birthday, bio } = event;
    
    const updates = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (avatar !== undefined) updates.avatar = avatar;
    if (gender !== undefined) updates.gender = gender;
    if (birthday !== undefined) updates.birthday = birthday;
    if (bio !== undefined) updates.bio = bio;
    
    if (Object.keys(updates).length === 0) {
      return {
        errCode: 400,
        errMsg: '未提供任何更新字段',
        data: null
      };
    }
    
    const validationErrors = validateUpdates(updates);
    if (validationErrors.length > 0) {
      return {
        errCode: 400,
        errMsg: validationErrors[0].message,
        field: validationErrors[0].field,
        data: null
      };
    }
    
    console.log(TAG, '✅ 参数校验通过');
    
    const supabase = getSupabaseClient();
    updates.updated_at = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', uid)
      .select()
      .single();
    
    if (error) {
      console.error(TAG, 'Supabase更新失败:', error);
      return {
        errCode: 500,
        errMsg: `数据库更新失败: ${error.message}`,
        data: null
      };
    }
    
    console.log(TAG, '✅ Supabase更新成功');
    
    return {
      errCode: 0,
      errMsg: '更新成功',
      data: {
        userInfo: {
          id: data.id,
          uid: data.id,
          nickname: data.nickname,
          avatar: data.avatar,
          gender: data.gender,
          birthday: data.birthday,
          bio: data.bio,
          updated_at: data.updated_at
        }
      }
    };
    
  } catch (error) {
    console.error(TAG, '异常:', error);
    return {
      errCode: 500,
      errMsg: error.message || String(error),
      data: null
    };
  }
};

