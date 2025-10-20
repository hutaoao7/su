# 撤回同意与账号注销 API

## 概述

撤回同意和账号注销接口，支持用户撤回对各项协议的同意，以及申请永久注销账号。

**云函数名称**: `consent-revoke`  
**请求方式**: POST  
**认证方式**: Token认证  

## 功能特性

- ✅ 撤回指定同意项
- ✅ 记录撤回原因
- ✅ 账号注销申请
- ✅ 7天冷静期保护
- ✅ 取消注销申请
- ✅ 查询撤回状态
- ✅ 数据永久删除
- ✅ 审计日志记录

## API接口列表

### 1. 撤回同意

撤回用户对特定协议的同意。

**请求参数**:

```javascript
{
  action: 'revoke_consent',     // 操作类型（必需）
  token: 'user_token',          // 用户Token（必需）
  revokedItems: [               // 撤回的同意项（必需）
    'privacy',                  // 隐私政策
    'user',                     // 用户协议
    'data_collection',          // 数据收集
    'marketing'                 // 营销推广
  ],
  reason: 'privacy_concern',    // 撤回原因（可选）
  customReason: '详细说明',      // 自定义原因（可选）
  timestamp: 1703001234567,     // 时间戳（可选）
  deviceInfo: {                 // 设备信息（可选）
    platform: 'mp-weixin',
    model: 'iPhone 12'
  }
}
```

**响应成功**:

```javascript
{
  code: 200,
  message: '撤回成功',
  data: {
    revokedItems: ['privacy', 'marketing'],
    timestamp: 1703001234567,
    logId: 'log_id_xxx'
  }
}
```

**响应失败**:

```javascript
{
  code: 400,
  message: '请选择要撤回的同意项'
}
```

### 2. 申请账号注销

提交账号永久注销申请，进入7天冷静期。

**请求参数**:

```javascript
{
  action: 'delete_account',      // 操作类型（必需）
  token: 'user_token',           // 用户Token（必需）
  reason: 'no_longer_use',       // 注销原因（可选）
  customReason: '不再使用',       // 自定义原因（可选）
  confirmDelete: true,           // 确认删除（必需）
  timestamp: 1703001234567,      // 时间戳（可选）
  deviceInfo: {                  // 设备信息（可选）
    platform: 'mp-weixin',
    model: 'iPhone 12'
  }
}
```

**响应成功**:

```javascript
{
  code: 200,
  message: '注销申请已提交',
  data: {
    requestId: 'request_id_xxx',
    scheduledAt: 1703605234567,  // 7天后的时间戳
    cooldownDays: 7
  }
}
```

**响应失败**:

```javascript
{
  code: 400,
  message: '您已有进行中的注销申请'
}
```

### 3. 取消注销申请

在冷静期内取消账号注销申请。

**请求参数**:

```javascript
{
  action: 'cancel_deletion',     // 操作类型（必需）
  token: 'user_token',           // 用户Token（必需）
  timestamp: 1703001234567       // 时间戳（可选）
}
```

**响应成功**:

```javascript
{
  code: 200,
  message: '注销申请已取消',
  data: {
    requestId: 'request_id_xxx',
    cancelledAt: 1703001234567
  }
}
```

**响应失败**:

```javascript
{
  code: 400,
  message: '没有进行中的注销申请'
}
```

### 4. 查询撤回状态

查询用户的撤回记录和当前状态。

**请求参数**:

```javascript
{
  action: 'check_status',        // 操作类型（必需）
  token: 'user_token'            // 用户Token（必需）
}
```

**响应成功**:

```javascript
{
  code: 200,
  data: {
    revokeLogs: [               // 撤回日志列表
      {
        _id: 'log_id_xxx',
        action_type: 'revoke_consent',
        revoked_items: ['privacy'],
        reason: 'privacy_concern',
        status: 'completed',
        created_at: 1703001234567
      }
    ],
    revokedConsents: ['privacy', 'marketing'],  // 已撤回的同意项
    hasPendingDeletion: false,                  // 是否有待处理的注销
    deletionScheduledAt: null                   // 注销计划时间
  }
}
```

## 撤回原因枚举

```javascript
const REVOKE_REASONS = {
  privacy_concern: '担心隐私泄露',
  no_longer_use: '不再使用此应用',
  too_many_permissions: '权限要求过多',
  data_security: '数据安全顾虑',
  service_quality: '服务质量不满意',
  other: '其他原因'
}
```

## 数据库设计

### consent_revoke_logs表

```sql
CREATE TABLE consent_revoke_logs (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL,          -- 用户ID
  action_type varchar(50),        -- 操作类型
  revoked_items jsonb,            -- 撤回项列表
  reason varchar(100),            -- 撤回原因
  custom_reason text,             -- 自定义原因
  status varchar(20),             -- 状态
  scheduled_at timestamptz,       -- 计划执行时间
  cancelled_at timestamptz,       -- 取消时间
  completed_at timestamptz,       -- 完成时间
  error_message text,             -- 错误信息
  device_info jsonb,              -- 设备信息
  created_at timestamptz,         -- 创建时间
  updated_at timestamptz          -- 更新时间
)
```

## 云函数实现示例

```javascript
// consent-revoke/index.js
'use strict';

const db = uniCloud.database()

exports.main = async (event, context) => {
  const { action, token, ...params } = event
  
  // 验证Token
  const userInfo = await verifyToken(token)
  if (!userInfo) {
    return {
      code: 401,
      message: 'Token无效或已过期'
    }
  }
  
  // 根据操作类型处理
  switch (action) {
    case 'revoke_consent':
      return await handleRevokeConsent(userInfo, params)
      
    case 'delete_account':
      return await handleDeleteAccount(userInfo, params)
      
    case 'cancel_deletion':
      return await handleCancelDeletion(userInfo, params)
      
    case 'check_status':
      return await checkRevokeStatus(userInfo)
      
    default:
      return {
        code: 400,
        message: '无效的操作类型'
      }
  }
}

// 处理撤回同意
async function handleRevokeConsent(userInfo, params) {
  const transaction = await db.startTransaction()
  
  try {
    // 记录撤回日志
    await transaction.collection('consent_revoke_logs').add({
      user_id: userInfo._id,
      action_type: 'revoke_consent',
      revoked_items: params.revokedItems,
      reason: params.reason,
      custom_reason: params.customReason,
      status: 'completed',
      created_at: Date.now()
    })
    
    // 更新同意记录状态
    for (const item of params.revokedItems) {
      await transaction.collection('consent_records')
        .where({
          user_id: userInfo._id,
          agreement_type: item
        })
        .update({
          status: 'revoked',
          revoked_at: Date.now()
        })
    }
    
    await transaction.commit()
    
    return {
      code: 200,
      message: '撤回成功'
    }
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
```

## 前端调用示例

```vue
<script>
export default {
  methods: {
    // 撤回同意
    async revokeConsent() {
      const res = await uniCloud.callFunction({
        name: 'consent-revoke',
        data: {
          action: 'revoke_consent',
          token: uni.getStorageSync('token'),
          revokedItems: ['privacy', 'marketing'],
          reason: 'privacy_concern'
        }
      })
      
      if (res.result.code === 200) {
        uni.showToast({
          title: '撤回成功',
          icon: 'success'
        })
      }
    },
    
    // 申请账号注销
    async deleteAccount() {
      const res = await uniCloud.callFunction({
        name: 'consent-revoke',
        data: {
          action: 'delete_account',
          token: uni.getStorageSync('token'),
          reason: 'no_longer_use',
          confirmDelete: true
        }
      })
      
      if (res.result.code === 200) {
        uni.showModal({
          title: '注销申请已提交',
          content: `您的账号将在${res.result.data.cooldownDays}天后注销`,
          showCancel: false
        })
      }
    },
    
    // 取消注销
    async cancelDeletion() {
      const res = await uniCloud.callFunction({
        name: 'consent-revoke',
        data: {
          action: 'cancel_deletion',
          token: uni.getStorageSync('token')
        }
      })
      
      if (res.result.code === 200) {
        uni.showToast({
          title: '已取消注销',
          icon: 'success'
        })
      }
    },
    
    // 查询状态
    async checkStatus() {
      const res = await uniCloud.callFunction({
        name: 'consent-revoke',
        data: {
          action: 'check_status',
          token: uni.getStorageSync('token')
        }
      })
      
      if (res.result.code === 200) {
        console.log('撤回状态:', res.result.data)
      }
    }
  }
}
</script>
```

## 定时任务处理

云函数支持定时触发器，自动处理到期的账号注销：

```javascript
// 定时任务：每天凌晨2点执行
exports.processScheduledDeletions = async () => {
  const now = Date.now()
  
  // 查找到期的注销申请
  const pendingRes = await db.collection('consent_revoke_logs')
    .where({
      action_type: 'delete_account',
      status: 'pending',
      scheduled_at: db.command.lte(now)
    })
    .get()
  
  for (const deletion of pendingRes.data) {
    try {
      // 执行数据删除
      await deleteUserData(deletion.user_id)
      
      // 更新状态
      await db.collection('consent_revoke_logs')
        .doc(deletion._id)
        .update({
          status: 'completed',
          completed_at: now
        })
    } catch (error) {
      // 记录错误
      await db.collection('consent_revoke_logs')
        .doc(deletion._id)
        .update({
          status: 'failed',
          error_message: error.message
        })
    }
  }
}
```

## 安全性考虑

1. **Token验证**: 所有操作必须验证用户身份
2. **冷静期保护**: 账号注销有7天冷静期，可随时取消
3. **二次确认**: 重要操作需要明确确认
4. **审计日志**: 记录所有撤回和注销操作
5. **数据备份**: 删除前可导出数据
6. **IP记录**: 记录操作IP地址用于审计

## 合规性说明

本接口设计符合以下法规要求：

- **GDPR**: 支持用户撤回同意和数据删除权
- **CCPA**: 提供用户数据控制权
- **个人信息保护法**: 保障用户的知情同意权和撤回权

## 性能优化

1. **事务处理**: 使用数据库事务确保数据一致性
2. **批量操作**: 批量更新撤回的同意项
3. **索引优化**: 为常用查询字段创建索引
4. **定时清理**: 自动清理90天前的日志记录

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 401 | 未授权访问 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 操作冲突（如重复申请） |
| 500 | 服务器内部错误 |

## 注意事项

1. 账号注销后所有数据将被永久删除，不可恢复
2. 建议在注销前先导出个人数据
3. 撤回同意可能导致部分功能不可用
4. 冷静期内重新登录将自动取消注销申请
5. 数据删除包括但不限于个人信息、评估记录、聊天历史等

## 更新日志

- **v1.0.0** (2025-10-21): 初始版本，支持撤回同意和账号注销
- **v1.1.0** (待定): 计划添加批量撤回和部分数据删除功能
