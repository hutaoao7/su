# consent-record API文档

## 基本信息

- **云函数名称**: `consent-record`
- **功能描述**: 记录和管理用户同意协议的操作
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token验证
- **限流策略**: 每用户每分钟最多5次请求

---

## 业务说明

本接口提供用户协议同意的完整管理，包括：
1. 记录用户同意（注册时、协议更新时）
2. 检查用户同意状态
3. 获取协议版本信息
4. 撤回同意并请求数据删除

### 业务场景

**场景1：用户注册**
```
用户注册 → 展示协议 → 用户勾选同意 → 调用consent-record记录 → 完成注册
```

**场景2：协议更新**
```
检测到协议版本更新 → 弹窗提示用户 → 用户阅读并同意 → 记录新版本同意
```

**场景3：撤回同意**
```
用户申请注销 → 展示撤回页面 → 用户确认 → 记录撤回 → 数据删除流程
```

---

## Action类型说明

| Action | 说明 | 认证 | 限流 |
|--------|------|------|------|
| record | 记录用户同意 | 是 | 5/min |
| check | 检查同意状态 | 是 | 10/min |
| get_versions | 获取协议版本列表 | 否 | 20/min |
| get_content | 获取协议内容 | 否 | 20/min |
| revoke | 撤回同意 | 是 | 1/hour |

---

## 1. 记录用户同意 (record)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "record" |
| agreement_type | String | 是 | 协议类型（user_agreement/privacy_policy/disclaimer） |
| version | String | 是 | 协议版本号（如"1.0.0"） |
| agreed | Boolean | 是 | 是否同意（true） |
| device_info | Object | 否 | 设备信息 |

### 协议类型说明

- `user_agreement`: 用户协议
- `privacy_policy`: 隐私政策
- `disclaimer`: 免责声明

### 请求示例

```javascript
// 记录用户同意
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'record',
    agreement_type: 'user_agreement',
    version: '1.0.0',
    agreed: true,
    device_info: {
      platform: 'mp-weixin',
      system: 'iOS 17.0',
      model: 'iPhone 15 Pro',
      version: '8.0.5'
    }
  }
});

// 批量记录（注册时）
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'record_batch',
    agreements: [
      {
        agreement_type: 'user_agreement',
        version: '1.0.0',
        agreed: true
      },
      {
        agreement_type: 'privacy_policy',
        version: '1.0.0',
        agreed: true
      }
    ],
    device_info: { ... }
  }
});
```

### 响应数据

**成功响应**
```javascript
{
  "code": 200,
  "message": "同意记录已保存",
  "data": {
    "record_id": "consent-uuid-1",
    "user_id": "user-uuid-1",
    "agreement_type": "user_agreement",
    "version": "1.0.0",
    "agreed_at": "2025-10-20T12:00:00Z"
  }
}
```

**错误响应**
```javascript
{
  "code": 400,
  "message": "必须同意用户协议才能继续",
  "data": {
    "field": "agreed",
    "required": true
  }
}
```

### 业务逻辑

- 自动记录用户IP地址
- 记录同意的时间戳
- 同一用户对同一协议的不同版本可以有多条记录
- 最新的同意记录为有效记录

---

## 2. 检查同意状态 (check)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "check" |
| agreement_type | String | 否 | 协议类型（不填则检查全部） |

### 请求示例

```javascript
// 检查用户是否同意所有协议
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'check'
  }
});

// 检查特定协议
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'check',
    agreement_type: 'privacy_policy'
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "all_agreed": true, // 是否全部同意
    "agreements": {
      "user_agreement": {
        "agreed": true,
        "version": "1.0.0",
        "agreed_at": "2025-10-20T12:00:00Z",
        "is_latest": true // 是否是最新版本
      },
      "privacy_policy": {
        "agreed": true,
        "version": "1.0.0",
        "agreed_at": "2025-10-20T12:00:00Z",
        "is_latest": true
      },
      "disclaimer": {
        "agreed": false,
        "version": null,
        "agreed_at": null,
        "is_latest": false
      }
    },
    "needs_update": [], // 需要更新同意的协议列表
    "missing": ["disclaimer"] // 未同意的协议列表
  }
}
```

### 使用场景

**场景1：登录后检查**
```javascript
// 用户登录后，检查是否需要重新同意协议
onShow() {
  const checkResult = await checkConsent();
  
  if (!checkResult.data.all_agreed) {
    // 跳转到协议页面
    uni.navigateTo({
      url: '/pages/consent/consent'
    });
  }
}
```

**场景2：协议更新提醒**
```javascript
// 检测到协议版本更新
if (checkResult.data.needs_update.length > 0) {
  uni.showModal({
    title: '协议更新提示',
    content: '用户协议已更新，请重新阅读并同意',
    success: () => {
      // 跳转到协议页面
    }
  });
}
```

---

## 3. 获取协议版本列表 (get_versions)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "get_versions" |
| agreement_type | String | 否 | 协议类型（不填则返回全部） |
| only_active | Boolean | 否 | 仅返回有效版本（默认true） |

### 请求示例

```javascript
// 获取所有协议的最新版本
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'get_versions',
    only_active: true
  }
});

// 获取用户协议的所有历史版本
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'get_versions',
    agreement_type: 'user_agreement',
    only_active: false
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "versions": [
      {
        "id": "version-uuid-1",
        "agreement_type": "user_agreement",
        "version": "1.1.0",
        "title": "翎心用户协议",
        "effective_date": "2025-10-01",
        "is_active": true,
        "created_at": "2025-09-20T10:00:00Z"
      },
      {
        "id": "version-uuid-2",
        "agreement_type": "user_agreement",
        "version": "1.0.0",
        "title": "翎心用户协议",
        "effective_date": "2025-01-01",
        "is_active": false,
        "created_at": "2024-12-01T10:00:00Z"
      }
    ],
    "latest_versions": {
      "user_agreement": "1.1.0",
      "privacy_policy": "1.0.0",
      "disclaimer": "1.0.0"
    }
  }
}
```

---

## 4. 获取协议内容 (get_content)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "get_content" |
| agreement_type | String | 是 | 协议类型 |
| version | String | 否 | 版本号（不填则返回最新版本） |

### 请求示例

```javascript
// 获取最新的用户协议
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'get_content',
    agreement_type: 'user_agreement'
  }
});

// 获取特定版本的隐私政策
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'get_content',
    agreement_type: 'privacy_policy',
    version: '1.0.0'
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "查询成功",
  "data": {
    "id": "version-uuid-1",
    "agreement_type": "user_agreement",
    "version": "1.1.0",
    "title": "翎心用户协议",
    "content": "# 翎心用户协议\n\n## 第一条 总则\n...",
    "effective_date": "2025-10-01",
    "is_active": true,
    "word_count": 5280 // 字数统计
  }
}
```

---

## 5. 撤回同意 (revoke)

### 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| action | String | 是 | "revoke" |
| revoke_reason | String | 是 | 撤回原因 |
| revoke_detail | String | 否 | 详细说明 |
| data_deletion_requested | Boolean | 是 | 是否请求删除数据 |

### 撤回原因枚举

- `privacy_concern`: 隐私担忧
- `not_using`: 不再使用
- `service_issue`: 服务问题
- `other`: 其他原因

### 请求示例

```javascript
// 撤回同意并请求删除数据
const { result } = await uniCloud.callFunction({
  name: 'consent-record',
  data: {
    action: 'revoke',
    revoke_reason: 'privacy_concern',
    revoke_detail: '担心个人信息泄露',
    data_deletion_requested: true
  }
});
```

### 响应数据

```javascript
{
  "code": 200,
  "message": "撤回请求已提交",
  "data": {
    "revoke_id": "revoke-uuid-1",
    "user_id": "user-uuid-1",
    "revoked_at": "2025-10-20T12:00:00Z",
    "data_deletion_requested": true,
    "estimated_deletion_date": "2025-10-27T12:00:00Z", // 预计删除日期（7天后）
    "process": {
      "step1": "撤回记录已保存",
      "step2": "账号已冻结",
      "step3": "数据删除任务已创建",
      "step4": "7天后自动删除数据"
    }
  }
}
```

### 撤回流程

```
用户提交撤回请求
    ↓
1. 保存撤回记录
    ↓
2. 冻结用户账号（不可登录）
    ↓
3. 发送确认邮件（如有邮箱）
    ↓
4. 等待7天冷静期
    ↓
5. 执行数据删除
    ↓
6. 删除完成通知
```

### 数据删除范围

如果用户请求删除数据，将删除：
- ✅ 用户基本信息
- ✅ 用户档案
- ✅ 评估记录和结果
- ✅ AI对话记录
- ✅ 社区发帖和评论
- ✅ 收藏和点赞记录
- ⚠️ 保留日志（脱敏）用于安全审计

---

## 错误码说明

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 参数错误 | 检查请求参数 |
| 401 | 未登录 | 调用auth-login获取Token |
| 403 | 权限不足 | 某些操作需要特定权限 |
| 404 | 协议版本不存在 | 检查version参数 |
| 409 | 重复记录 | 该协议版本已同意 |
| 429 | 请求过于频繁 | 等待限流解除 |
| 500 | 服务器错误 | 稍后重试 |

### 详细错误示例

**1. 未同意协议**
```javascript
{
  "code": 400,
  "message": "必须同意用户协议才能继续",
  "data": {
    "missing_agreements": ["user_agreement", "privacy_policy"]
  }
}
```

**2. 协议版本不存在**
```javascript
{
  "code": 404,
  "message": "协议版本不存在",
  "data": {
    "agreement_type": "user_agreement",
    "version": "2.0.0",
    "latest_version": "1.1.0"
  }
}
```

**3. 撤回冷静期**
```javascript
{
  "code": 409,
  "message": "您最近已提交撤回请求，请在冷静期后操作",
  "data": {
    "last_revoke_at": "2025-10-15T12:00:00Z",
    "can_revoke_after": "2025-10-22T12:00:00Z" // 7天后
  }
}
```

---

## 数据库设计

### agreement_versions表（协议版本）

```sql
CREATE TABLE agreement_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_type varchar(50) NOT NULL, -- 协议类型
  version varchar(20) NOT NULL,        -- 版本号
  title varchar(200) NOT NULL,         -- 标题
  content text NOT NULL,               -- 内容（Markdown）
  effective_date date NOT NULL,        -- 生效日期
  is_active boolean DEFAULT true,      -- 是否有效
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT check_agreement_type 
    CHECK (agreement_type IN ('user_agreement', 'privacy_policy', 'disclaimer'))
);

-- 唯一索引
CREATE UNIQUE INDEX idx_agreement_versions_type_version 
  ON agreement_versions(agreement_type, version);
```

### consent_records表（同意记录）

```sql
CREATE TABLE consent_records (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,              -- 用户ID
  agreement_type varchar(50) NOT NULL,-- 协议类型
  version varchar(20) NOT NULL,       -- 版本号
  agreed boolean DEFAULT true,        -- 是否同意
  agreed_at timestamptz DEFAULT now(),-- 同意时间
  ip_address inet,                    -- IP地址
  device_info jsonb,                  -- 设备信息
  created_at timestamptz DEFAULT now(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX idx_consent_records_user_type 
  ON consent_records(user_id, agreement_type);
```

### 相关查询SQL

**1. 检查用户是否同意所有协议**
```sql
-- 获取用户最新的同意记录
WITH latest_consents AS (
  SELECT DISTINCT ON (user_id, agreement_type)
    user_id,
    agreement_type,
    version,
    agreed_at
  FROM consent_records
  WHERE user_id = $1
  ORDER BY user_id, agreement_type, agreed_at DESC
),
latest_versions AS (
  SELECT 
    agreement_type,
    version
  FROM agreement_versions
  WHERE is_active = true
)
SELECT 
  lv.agreement_type,
  lv.version AS latest_version,
  lc.version AS user_version,
  CASE 
    WHEN lc.version IS NULL THEN 'not_agreed'
    WHEN lc.version < lv.version THEN 'needs_update'
    ELSE 'up_to_date'
  END AS status
FROM latest_versions lv
LEFT JOIN latest_consents lc 
  ON lv.agreement_type = lc.agreement_type;
```

**2. 获取协议更新历史**
```sql
SELECT 
  version,
  title,
  effective_date,
  is_active,
  created_at
FROM agreement_versions
WHERE agreement_type = $1
ORDER BY effective_date DESC;
```

---

## 云函数实现示例

### 基本结构

```javascript
// cloud-functions/consent-record/index.js
'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, ...params } = event;
  
  // Token验证
  const auth = context.UNICLOUD_AUTH_TOKEN;
  
  // record和revoke需要登录
  const needsAuth = ['record', 'record_batch', 'check', 'revoke'];
  if (needsAuth.includes(action) && (!auth || !auth.uid)) {
    return { code: 401, message: '请先登录' };
  }
  
  switch (action) {
    case 'record':
      return await recordConsent(params, auth, context);
    case 'record_batch':
      return await recordConsentBatch(params, auth, context);
    case 'check':
      return await checkConsent(params, auth);
    case 'get_versions':
      return await getVersions(params);
    case 'get_content':
      return await getContent(params);
    case 'revoke':
      return await revokeConsent(params, auth, context);
    default:
      return { code: 400, message: '无效的action' };
  }
};

// 记录用户同意
async function recordConsent(params, auth, context) {
  const { agreement_type, version, agreed, device_info } = params;
  
  // 参数校验
  if (!agreement_type || !version) {
    return { code: 400, message: '缺少必要参数' };
  }
  
  if (!agreed) {
    return { code: 400, message: '必须同意协议才能继续' };
  }
  
  // 验证协议版本是否存在
  const versionCheck = await db.collection('agreement_versions')
    .where({
      agreement_type,
      version
    })
    .get();
  
  if (versionCheck.data.length === 0) {
    return { 
      code: 404, 
      message: '协议版本不存在',
      data: { agreement_type, version }
    };
  }
  
  // 获取客户端IP
  const clientIP = context.CLIENTIP;
  
  // 插入同意记录
  const res = await db.collection('consent_records').add({
    user_id: auth.uid,
    agreement_type,
    version,
    agreed: true,
    agreed_at: new Date(),
    ip_address: clientIP,
    device_info: device_info || {}
  });
  
  return {
    code: 200,
    message: '同意记录已保存',
    data: {
      record_id: res.id,
      user_id: auth.uid,
      agreement_type,
      version,
      agreed_at: new Date().toISOString()
    }
  };
}

// 批量记录同意
async function recordConsentBatch(params, auth, context) {
  const { agreements, device_info } = params;
  
  if (!Array.isArray(agreements) || agreements.length === 0) {
    return { code: 400, message: 'agreements必须是非空数组' };
  }
  
  const clientIP = context.CLIENTIP;
  const records = [];
  
  for (const agreement of agreements) {
    const { agreement_type, version, agreed } = agreement;
    
    if (!agreed) {
      return {
        code: 400,
        message: `必须同意${agreement_type}`,
        data: { agreement_type }
      };
    }
    
    records.push({
      user_id: auth.uid,
      agreement_type,
      version,
      agreed: true,
      agreed_at: new Date(),
      ip_address: clientIP,
      device_info: device_info || {}
    });
  }
  
  // 批量插入
  const res = await db.collection('consent_records').add(records);
  
  return {
    code: 200,
    message: '同意记录已批量保存',
    data: {
      count: records.length,
      records: res.ids
    }
  };
}

// 检查同意状态
async function checkConsent(params, auth) {
  const { agreement_type } = params;
  
  // 获取用户最新的同意记录
  const where = { user_id: auth.uid };
  if (agreement_type) {
    where.agreement_type = agreement_type;
  }
  
  const consents = await db.collection('consent_records')
    .aggregate()
    .match(where)
    .sort({ agreed_at: -1 })
    .group({
      _id: '$agreement_type',
      version: dbCmd.$.first('$version'),
      agreed_at: dbCmd.$.first('$agreed_at')
    })
    .end();
  
  // 获取最新协议版本
  const latestVersions = await db.collection('agreement_versions')
    .where({ is_active: true })
    .get();
  
  // 构建结果
  const agreements = {};
  const needsUpdate = [];
  const missing = [];
  
  const versionMap = {};
  for (const v of latestVersions.data) {
    versionMap[v.agreement_type] = v.version;
  }
  
  for (const type of ['user_agreement', 'privacy_policy', 'disclaimer']) {
    const userConsent = consents.data.find(c => c._id === type);
    const latestVersion = versionMap[type];
    
    if (!userConsent) {
      missing.push(type);
      agreements[type] = {
        agreed: false,
        version: null,
        agreed_at: null,
        is_latest: false
      };
    } else {
      const isLatest = userConsent.version === latestVersion;
      if (!isLatest) {
        needsUpdate.push(type);
      }
      
      agreements[type] = {
        agreed: true,
        version: userConsent.version,
        agreed_at: userConsent.agreed_at,
        is_latest: isLatest
      };
    }
  }
  
  return {
    code: 200,
    message: '查询成功',
    data: {
      all_agreed: missing.length === 0 && needsUpdate.length === 0,
      agreements,
      needs_update: needsUpdate,
      missing
    }
  };
}

// 获取协议版本列表
async function getVersions(params) {
  const { agreement_type, only_active = true } = params;
  
  const where = {};
  if (agreement_type) {
    where.agreement_type = agreement_type;
  }
  if (only_active) {
    where.is_active = true;
  }
  
  const res = await db.collection('agreement_versions')
    .where(where)
    .orderBy('effective_date', 'desc')
    .field({
      id: true,
      agreement_type: true,
      version: true,
      title: true,
      effective_date: true,
      is_active: true,
      created_at: true
    })
    .get();
  
  // 获取最新版本
  const latestVersions = {};
  for (const item of res.data) {
    if (!latestVersions[item.agreement_type]) {
      latestVersions[item.agreement_type] = item.version;
    }
  }
  
  return {
    code: 200,
    message: '查询成功',
    data: {
      versions: res.data,
      latest_versions: latestVersions
    }
  };
}

// 获取协议内容
async function getContent(params) {
  const { agreement_type, version } = params;
  
  if (!agreement_type) {
    return { code: 400, message: '缺少agreement_type参数' };
  }
  
  const where = { agreement_type };
  
  if (version) {
    where.version = version;
  } else {
    where.is_active = true;
  }
  
  const res = await db.collection('agreement_versions')
    .where(where)
    .orderBy('effective_date', 'desc')
    .limit(1)
    .get();
  
  if (res.data.length === 0) {
    return { 
      code: 404, 
      message: '协议不存在',
      data: { agreement_type, version }
    };
  }
  
  const content = res.data[0];
  
  return {
    code: 200,
    message: '查询成功',
    data: {
      ...content,
      word_count: content.content.length
    }
  };
}

// 撤回同意
async function revokeConsent(params, auth, context) {
  const { revoke_reason, revoke_detail, data_deletion_requested } = params;
  
  if (!revoke_reason) {
    return { code: 400, message: '请提供撤回原因' };
  }
  
  // 检查是否在冷静期
  const lastRevoke = await db.collection('consent_revoke_logs')
    .where({ user_id: auth.uid })
    .orderBy('revoked_at', 'desc')
    .limit(1)
    .get();
  
  if (lastRevoke.data.length > 0) {
    const daysSinceRevoke = Math.floor(
      (Date.now() - new Date(lastRevoke.data[0].revoked_at).getTime()) / (24 * 3600 * 1000)
    );
    
    if (daysSinceRevoke < 7) {
      return {
        code: 409,
        message: '您最近已提交撤回请求，请在冷静期后操作',
        data: {
          last_revoke_at: lastRevoke.data[0].revoked_at,
          can_revoke_after: new Date(
            new Date(lastRevoke.data[0].revoked_at).getTime() + 7 * 24 * 3600 * 1000
          ).toISOString()
        }
      };
    }
  }
  
  // 记录撤回
  const res = await db.collection('consent_revoke_logs').add({
    user_id: auth.uid,
    revoke_reason,
    revoke_detail,
    data_deletion_requested,
    revoked_at: new Date()
  });
  
  // 冻结用户账号
  await db.collection('users').doc(auth.uid).update({
    account_status: 'revoked',
    revoked_at: new Date()
  });
  
  // 如果请求删除数据，创建删除任务
  if (data_deletion_requested) {
    const deletionDate = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    
    await db.collection('data_deletion_tasks').add({
      user_id: auth.uid,
      scheduled_at: deletionDate,
      status: 'pending'
    });
  }
  
  return {
    code: 200,
    message: '撤回请求已提交',
    data: {
      revoke_id: res.id,
      user_id: auth.uid,
      revoked_at: new Date().toISOString(),
      data_deletion_requested,
      estimated_deletion_date: data_deletion_requested 
        ? new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()
        : null,
      process: {
        step1: '撤回记录已保存',
        step2: '账号已冻结',
        step3: data_deletion_requested ? '数据删除任务已创建' : '不删除数据',
        step4: data_deletion_requested ? '7天后自动删除数据' : null
      }
    }
  };
}
```

---

## 前端集成示例

### Vue组件示例

```vue
<template>
  <view class="consent-page">
    <!-- 协议列表 -->
    <view class="agreements">
      <view 
        v-for="agreement in agreements" 
        :key="agreement.type"
        class="agreement-item"
      >
        <checkbox 
          :checked="agreement.agreed"
          @change="handleAgree(agreement.type)"
        />
        <text class="agreement-title">{{ agreement.title }}</text>
        <text class="view-link" @click="viewAgreement(agreement.type)">
          查看详情
        </text>
      </view>
    </view>
    
    <!-- 倒计时按钮 -->
    <button 
      :disabled="!allAgreed || countdown > 0"
      @click="submitConsent"
      class="submit-btn"
    >
      {{ countdown > 0 ? `请仔细阅读(${countdown}s)` : '同意并继续' }}
    </button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      agreements: [
        {
          type: 'user_agreement',
          title: '《用户协议》',
          agreed: false,
          version: '1.0.0'
        },
        {
          type: 'privacy_policy',
          title: '《隐私政策》',
          agreed: false,
          version: '1.0.0'
        }
      ],
      countdown: 5, // 5秒倒计时
      timer: null
    };
  },
  
  computed: {
    allAgreed() {
      return this.agreements.every(a => a.agreed);
    }
  },
  
  mounted() {
    this.startCountdown();
  },
  
  beforeDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  },
  
  methods: {
    // 开始倒计时
    startCountdown() {
      this.timer = setInterval(() => {
        if (this.countdown > 0) {
          this.countdown--;
        } else {
          clearInterval(this.timer);
        }
      }, 1000);
    },
    
    // 勾选协议
    handleAgree(type) {
      const agreement = this.agreements.find(a => a.type === type);
      if (agreement) {
        agreement.agreed = !agreement.agreed;
      }
    },
    
    // 查看协议详情
    viewAgreement(type) {
      uni.navigateTo({
        url: `/pages/consent/detail?type=${type}`
      });
    },
    
    // 提交同意
    async submitConsent() {
      if (!this.allAgreed) {
        uni.showToast({
          title: '请先同意所有协议',
          icon: 'none'
        });
        return;
      }
      
      uni.showLoading({ title: '提交中...' });
      
      try {
        // 批量记录同意
        const { result } = await uniCloud.callFunction({
          name: 'consent-record',
          data: {
            action: 'record_batch',
            agreements: this.agreements.map(a => ({
              agreement_type: a.type,
              version: a.version,
              agreed: true
            })),
            device_info: this.getDeviceInfo()
          }
        });
        
        if (result.code === 200) {
          uni.showToast({
            title: '提交成功',
            icon: 'success'
          });
          
          // 返回上一页或跳转到首页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        } else {
          throw new Error(result.message);
        }
      } catch (err) {
        console.error('提交同意失败', err);
        uni.showToast({
          title: err.message || '提交失败',
          icon: 'none'
        });
      } finally {
        uni.hideLoading();
      }
    },
    
    // 获取设备信息
    getDeviceInfo() {
      const systemInfo = uni.getSystemInfoSync();
      return {
        platform: systemInfo.platform,
        system: systemInfo.system,
        model: systemInfo.model,
        version: systemInfo.version,
        brand: systemInfo.brand
      };
    }
  }
};
</script>

<style scoped>
.consent-page {
  padding: 40rpx;
}

.agreements {
  margin-bottom: 60rpx;
}

.agreement-item {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
}

.agreement-title {
  flex: 1;
  margin-left: 20rpx;
  font-size: 28rpx;
}

.view-link {
  color: #007aff;
  font-size: 26rpx;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: #007aff;
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
}

.submit-btn[disabled] {
  background: #ccc;
}
</style>
```

---

## 性能优化建议

### 1. 缓存策略
```javascript
// 协议内容缓存（本地缓存1天）
const CACHE_KEY = 'agreement_cache';
const CACHE_DURATION = 24 * 3600 * 1000; // 1天

async function getAgreementContent(type) {
  const cacheKey = `${CACHE_KEY}_${type}`;
  const cached = uni.getStorageSync(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  // 从服务器获取
  const { result } = await uniCloud.callFunction({
    name: 'consent-record',
    data: { action: 'get_content', agreement_type: type }
  });
  
  // 缓存
  uni.setStorageSync(cacheKey, {
    data: result.data,
    timestamp: Date.now()
  });
  
  return result.data;
}
```

### 2. 批量操作
- 注册时批量记录3个协议，1次请求完成
- 避免循环调用API

### 3. 索引优化
- `(user_id, agreement_type)` 复合索引
- `is_active` 字段索引用于快速筛选有效版本

---

## 安全防护

### 1. 强制同意验证
```javascript
// 注册时必须同意所有协议
if (!allAgreed) {
  return { code: 400, message: '必须同意所有协议' };
}
```

### 2. 冷静期保护
- 撤回同意后7天内不可再次撤回
- 防止恶意操作

### 3. 数据删除保护
- 7天冷静期后才执行删除
- 用户可以在冷静期内撤销删除请求

---

## 监控指标

| 指标 | 目标值 |
|-----|-------|
| 同意记录响应时间 | < 200ms |
| 协议内容查询 | < 100ms |
| 撤回请求处理 | < 500ms |
| 同意记录成功率 | > 99% |

---

## 变更日志

### v1.0.0 (2025-10-20)
- ✅ 记录用户同意功能
- ✅ 检查同意状态
- ✅ 获取协议版本和内容
- ✅ 撤回同意和数据删除
- ✅ 批量记录同意
- ✅ 7天冷静期机制
- ✅ 完整的错误处理

---

**文档维护**: 开发团队  
**最后更新**: 2025-10-20  
**版本**: v1.0.0

