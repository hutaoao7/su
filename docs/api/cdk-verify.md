# API文档：cdk-verify - 验证兑换码有效性

## 基本信息

| 项目 | 内容 |
|------|------|
| **API名称** | 验证兑换码 |
| **云函数名** | `cdk-verify` |
| **请求方式** | POST |
| **认证方式** | Bearer Token（可选） |
| **版本** | v1.0.0 |
| **创建日期** | 2025-10-21 |
| **维护人** | 后端开发团队 |

---

## 功能描述

在用户提交兑换之前，验证兑换码的格式和有效性，提供即时反馈，提升用户体验。

### 主要特性
- ✅ 格式验证：检查兑换码格式是否正确
- 🔍 状态查询：检查兑换码是否可用
- ⏰ 有效期检查：验证是否在有效期内
- 💡 奖励预览：展示兑换码对应的奖励
- 🔒 无副作用：仅查询不实际兑换

---

## 请求参数

### Headers

```javascript
{
  "Content-Type": "application/json",
  "Authorization": "Bearer <access_token>" // 可选，提供则返回更详细信息
}
```

### Body参数

```typescript
interface VerifyRequest {
  code: string;  // 兑换码（必填）
}
```

### 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| code | string | 是 | - | 兑换码，6-32位字符 |

---

## 响应格式

### 成功响应（兑换码有效）

```json
{
  "code": 0,
  "message": "兑换码有效",
  "data": {
    "valid": true,
    "code": "VIP7D-ABCD-1234",
    "type": {
      "type_code": "vip_week",
      "type_name": "VIP周卡",
      "description": "享受7天VIP会员权益"
    },
    "benefit": {
      "benefit_type": "vip",
      "benefit_value": 7,
      "benefit_unit": "天"
    },
    "expires_at": "2025-12-31T23:59:59Z",
    "remaining_uses": 1,
    "max_redeem_count": 1,
    "status": "unused"
  }
}
```

### 成功响应（兑换码无效）

```json
{
  "code": 0,
  "message": "验证完成",
  "data": {
    "valid": false,
    "reason": "CODE_EXPIRED",
    "message": "兑换码已过期"
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误：兑换码格式不正确",
  "error": "INVALID_FORMAT"
}
```

```json
{
  "code": 404,
  "message": "兑换码不存在",
  "error": "CODE_NOT_FOUND"
}
```

```json
{
  "code": 429,
  "message": "请求过于频繁，请稍后再试",
  "error": "RATE_LIMIT_EXCEEDED"
}
```

---

## 状态码说明

| HTTP状态码 | code | 说明 |
|-----------|------|------|
| 200 | 0 | 验证成功 |
| 400 | 400 | 请求参数错误 |
| 404 | 404 | 兑换码不存在 |
| 429 | 429 | 请求过于频繁 |
| 500 | 500 | 服务器内部错误 |

---

## 无效原因类型

| 原因代码 | 说明 | 用户提示 |
|---------|------|---------|
| CODE_NOT_FOUND | 兑换码不存在 | 兑换码无效，请检查后重试 |
| CODE_EXPIRED | 已过期 | 兑换码已过期 |
| CODE_USED | 已被使用 | 兑换码已被使用 |
| CODE_DISABLED | 已禁用 | 兑换码已失效 |
| ALREADY_REDEEMED | 用户已兑换过 | 您已兑换过此码 |
| REDEEM_LIMIT_REACHED | 兑换次数已满 | 兑换次数已达上限 |

---

## 使用示例

### 示例1：基本验证

```javascript
// 前端调用示例
const verifyCode = async (code) => {
  try {
    const result = await uniCloud.callFunction({
      name: 'cdk-verify',
      data: {
        code: code.trim()
      }
    });
    
    if (result.result.code === 0) {
      const data = result.result.data;
      
      if (data.valid) {
        // 显示奖励预览
        console.log('奖励：', data.benefit);
        uni.showToast({
          title: `可兑换: ${data.type.type_name}`,
          icon: 'success'
        });
      } else {
        // 显示无效原因
        uni.showToast({
          title: data.message,
          icon: 'none'
        });
      }
    }
  } catch (error) {
    console.error('验证失败:', error);
  }
};
```

### 示例2：输入时实时验证

```vue
<template>
  <view class="verify-container">
    <u-input 
      v-model="code" 
      placeholder="请输入兑换码"
      @blur="handleVerify"
      @input="handleInput"
    />
    
    <!-- 验证状态提示 -->
    <view v-if="verifyStatus === 'valid'" class="hint success">
      <u-icon name="checkmark-circle" color="#67C23A" />
      <text>{{ verifyResult.type.type_name }}</text>
    </view>
    
    <view v-else-if="verifyStatus === 'invalid'" class="hint error">
      <u-icon name="close-circle" color="#F56C6C" />
      <text>{{ verifyResult.message }}</text>
    </view>
    
    <view v-else-if="verifyStatus === 'checking'" class="hint">
      <u-loading size="16" />
      <text>验证中...</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      code: '',
      verifyStatus: '', // '', 'checking', 'valid', 'invalid'
      verifyResult: null,
      debounceTimer: null
    };
  },
  
  methods: {
    // 输入时防抖验证
    handleInput() {
      clearTimeout(this.debounceTimer);
      
      if (this.code.length >= 6) {
        this.verifyStatus = 'checking';
        
        this.debounceTimer = setTimeout(() => {
          this.verifyCode();
        }, 800); // 800ms防抖
      } else {
        this.verifyStatus = '';
      }
    },
    
    // 失焦时立即验证
    handleVerify() {
      clearTimeout(this.debounceTimer);
      
      if (this.code.length >= 6) {
        this.verifyCode();
      }
    },
    
    // 验证兑换码
    async verifyCode() {
      try {
        this.verifyStatus = 'checking';
        
        const result = await uniCloud.callFunction({
          name: 'cdk-verify',
          data: {
            code: this.code.trim()
          }
        });
        
        if (result.result.code === 0) {
          this.verifyResult = result.result.data;
          this.verifyStatus = result.result.data.valid ? 'valid' : 'invalid';
        } else {
          this.verifyStatus = 'invalid';
          this.verifyResult = {
            message: result.result.message
          };
        }
      } catch (error) {
        console.error('验证失败:', error);
        this.verifyStatus = 'invalid';
        this.verifyResult = {
          message: '网络错误，请稍后重试'
        };
      }
    }
  }
};
</script>
```

### 示例3：批量验证

```javascript
// 批量验证多个兑换码
const batchVerify = async (codes) => {
  const results = await Promise.all(
    codes.map(code => 
      uniCloud.callFunction({
        name: 'cdk-verify',
        data: { code }
      })
    )
  );
  
  const validCodes = results
    .filter(res => res.result.code === 0 && res.result.data.valid)
    .map(res => res.result.data);
  
  console.log('有效兑换码:', validCodes);
  return validCodes;
};
```

---

## 数据库查询

### SQL查询示例

```sql
-- 验证兑换码并获取详情
SELECT 
  cc.id,
  cc.code,
  cc.status,
  cc.max_redeem_count,
  cc.current_redeem_count,
  cc.expires_at,
  ct.type_code,
  ct.type_name,
  ct.description,
  ct.benefit_type,
  ct.benefit_value,
  ct.benefit_unit,
  ct.is_active
FROM cdk_codes cc
JOIN cdk_types ct ON ct.type_code = cc.type_code
WHERE cc.code = $1
  AND ct.is_active = true;
```

### 检查用户是否已兑换

```sql
-- 检查用户是否已兑换过该码（如果提供了用户ID）
SELECT EXISTS(
  SELECT 1 
  FROM cdk_redeem_records 
  WHERE code = $1 
    AND user_id = $2 
    AND status = 'success'
) as already_redeemed;
```

---

## 验证逻辑

### 验证流程

```javascript
// 云函数验证逻辑伪代码
async function verifyCDK(code, userId = null) {
  // 1. 格式验证
  if (!validateFormat(code)) {
    return {
      valid: false,
      reason: 'INVALID_FORMAT',
      message: '兑换码格式不正确'
    };
  }
  
  // 2. 查询兑换码
  const cdk = await db.collection('cdk_codes')
    .where({ code })
    .getOne();
  
  if (!cdk) {
    return {
      valid: false,
      reason: 'CODE_NOT_FOUND',
      message: '兑换码不存在'
    };
  }
  
  // 3. 检查状态
  if (cdk.status === 'disabled') {
    return {
      valid: false,
      reason: 'CODE_DISABLED',
      message: '兑换码已失效'
    };
  }
  
  if (cdk.status === 'used' || cdk.current_redeem_count >= cdk.max_redeem_count) {
    return {
      valid: false,
      reason: 'CODE_USED',
      message: '兑换码已被使用'
    };
  }
  
  // 4. 检查过期时间
  if (cdk.expires_at && new Date(cdk.expires_at) < new Date()) {
    // 更新状态为过期
    await db.collection('cdk_codes')
      .doc(cdk._id)
      .update({ status: 'expired' });
    
    return {
      valid: false,
      reason: 'CODE_EXPIRED',
      message: '兑换码已过期'
    };
  }
  
  // 5. 如果提供了用户ID，检查是否已兑换过
  if (userId) {
    const hasRedeemed = await db.collection('cdk_redeem_records')
      .where({
        code: code,
        user_id: userId,
        status: 'success'
      })
      .count();
    
    if (hasRedeemed.total > 0) {
      return {
        valid: false,
        reason: 'ALREADY_REDEEMED',
        message: '您已兑换过此码'
      };
    }
  }
  
  // 6. 查询类型配置
  const cdkType = await db.collection('cdk_types')
    .where({ type_code: cdk.type_code })
    .getOne();
  
  if (!cdkType || !cdkType.is_active) {
    return {
      valid: false,
      reason: 'TYPE_INACTIVE',
      message: '该类型兑换码暂不可用'
    };
  }
  
  // 7. 返回有效信息
  return {
    valid: true,
    code: code,
    type: {
      type_code: cdkType.type_code,
      type_name: cdkType.type_name,
      description: cdkType.description
    },
    benefit: {
      benefit_type: cdkType.benefit_type,
      benefit_value: cdkType.benefit_value,
      benefit_unit: cdkType.benefit_unit
    },
    expires_at: cdk.expires_at,
    remaining_uses: cdk.max_redeem_count - cdk.current_redeem_count,
    max_redeem_count: cdk.max_redeem_count,
    status: cdk.status
  };
}
```

---

## 性能优化

### 1. 缓存策略

```javascript
// Redis缓存验证结果（短时间缓存）
const cacheKey = `cdk:verify:${code}`;
const cached = await redis.get(cacheKey);

if (cached) {
  return JSON.parse(cached);
}

const result = await verifyCDK(code);

// 有效码缓存5分钟，无效码缓存1小时
const ttl = result.valid ? 300 : 3600;
await redis.setex(cacheKey, ttl, JSON.stringify(result));

return result;
```

### 2. 限流控制

```javascript
// 限制每个IP每分钟最多验证10次
const rateLimitKey = `rate:cdk:verify:${ip}`;
const count = await redis.incr(rateLimitKey);

if (count === 1) {
  await redis.expire(rateLimitKey, 60);
}

if (count > 10) {
  throw new Error('RATE_LIMIT_EXCEEDED');
}
```

### 3. 数据库索引

```sql
-- 确保关键字段有索引
CREATE INDEX IF NOT EXISTS idx_cdk_codes_code ON cdk_codes(code);
CREATE INDEX IF NOT EXISTS idx_cdk_codes_status_expires ON cdk_codes(status, expires_at);
CREATE INDEX IF NOT EXISTS idx_cdk_types_type_code ON cdk_types(type_code);
```

---

## 安全性

### 1. 防止暴力破解

```javascript
// 记录验证失败次数
const failureKey = `cdk:verify:failures:${ip}`;
const failures = await redis.get(failureKey) || 0;

if (failures > 20) {
  // 超过20次失败，要求验证码
  if (!captchaToken || !verifyCaptcha(captchaToken)) {
    throw new Error('CAPTCHA_REQUIRED');
  }
}

// 验证失败时增加计数
if (!result.valid) {
  await redis.incr(failureKey);
  await redis.expire(failureKey, 3600); // 1小时过期
}
```

### 2. 信息脱敏

```javascript
// 对于未登录用户，隐藏部分敏感信息
function sanitizeResult(result, isAuthenticated) {
  if (!isAuthenticated && result.valid) {
    // 不显示剩余使用次数等敏感信息
    delete result.remaining_uses;
    delete result.max_redeem_count;
  }
  
  return result;
}
```

---

## 测试用例

```javascript
describe('cdk-verify API', () => {
  test('应该正确验证有效兑换码', async () => {
    const result = await callFunction('cdk-verify', {
      code: 'VALID-CODE-123'
    });
    
    expect(result.code).toBe(0);
    expect(result.data.valid).toBe(true);
    expect(result.data.type).toBeDefined();
  });
  
  test('应该识别过期的兑换码', async () => {
    const result = await callFunction('cdk-verify', {
      code: 'EXPIRED-CODE'
    });
    
    expect(result.code).toBe(0);
    expect(result.data.valid).toBe(false);
    expect(result.data.reason).toBe('CODE_EXPIRED');
  });
  
  test('应该识别已使用的兑换码', async () => {
    const result = await callFunction('cdk-verify', {
      code: 'USED-CODE'
    });
    
    expect(result.code).toBe(0);
    expect(result.data.valid).toBe(false);
    expect(result.data.reason).toBe('CODE_USED');
  });
  
  test('应该拒绝格式错误的兑换码', async () => {
    const result = await callFunction('cdk-verify', {
      code: 'ABC'
    });
    
    expect(result.code).toBe(400);
    expect(result.error).toBe('INVALID_FORMAT');
  });
  
  test('应该检测用户重复兑换', async () => {
    const result = await callFunction('cdk-verify', {
      code: 'SOME-CODE'
    }, {
      headers: {
        Authorization: 'Bearer user_token'
      }
    });
    
    if (result.data.valid === false && result.data.reason === 'ALREADY_REDEEMED') {
      expect(result.data.message).toContain('已兑换');
    }
  });
});
```

---

## 监控指标

### 关键指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| 响应时间（P95） | 95%请求响应时间 | < 200ms |
| 缓存命中率 | Redis缓存命中率 | > 70% |
| 有效码比例 | 验证有效的比例 | > 50% |
| 错误率 | 验证接口错误率 | < 0.5% |

---

## 更新日志

| 版本 | 日期 | 变更内容 | 负责人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-21 | 初始版本，支持基础验证和奖励预览 | 开发团队 |

---

## 相关文档

- [cdk-redeem API文档](./cdk-redeem.md)
- [cdk-batchCreate API文档](./cdk-batchCreate.md)
- [数据库设计文档](../database/schema-cdk-music.md)

---

**维护说明**:
- 定期清理验证缓存
- 监控暴力破解行为
- 定期更新过期兑换码状态

