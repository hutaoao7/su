# cdk-redeem API文档

## 接口概述

**接口名称**: CDK兑换码兑换  
**云函数名**: `cdk-redeem`  
**版本**: v1.0  
**更新日期**: 2025-10-20

## 功能说明

用户输入兑换码进行兑换，系统验证码的有效性并发放对应奖励。

## 接口地址

```javascript
uniCloud.callFunction({
  name: 'cdk-redeem',
  data: { ... }
})
```

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | String | 是 | 兑换码（6-32位字母数字） |

### 请求示例

```javascript
const res = await uniCloud.callFunction({
  name: 'cdk-redeem',
  data: {
    code: 'ABCD1234EFGH5678'
  }
});
```

## 返回数据

### 成功响应

```json
{
  "code": 0,
  "msg": "兑换成功",
  "data": {
    "reward": "VIP会员7天",
    "type": "vip",
    "duration": 7,
    "expireAt": "2025-10-27T12:00:00.000Z"
  }
}
```

### 错误响应

```json
{
  "code": 1001,
  "msg": "兑换码无效",
  "data": null
}
```

## 错误码说明

| 错误码 | 说明 | 处理建议 |
|--------|------|----------|
| 0 | 兑换成功 | 显示奖励信息 |
| 1001 | 兑换码无效 | 请用户检查兑换码是否正确 |
| 1002 | 兑换码已过期 | 提示兑换码已过期 |
| 1003 | 兑换码已被使用 | 提示该兑换码已被使用 |
| 1004 | 操作过于频繁 | 提示用户稍后再试 |
| 401 | 未登录 | 跳转到登录页面 |
| 500 | 服务器错误 | 稍后重试 |

## 兑换码类型

### VIP会员卡

```json
{
  "type": "vip",
  "reward": "VIP会员7天",
  "duration": 7
}
```

### 功能解锁

```json
{
  "type": "feature",
  "reward": "AI对话次数+100",
  "feature": "ai_chat",
  "amount": 100
}
```

### 音乐权益

```json
{
  "type": "music",
  "reward": "音乐包月卡",
  "duration": 30
}
```

### 积分/金币

```json
{
  "type": "points",
  "reward": "积分+500",
  "amount": 500
}
```

## 使用示例

### 完整的兑换流程

```javascript
<template>
  <view class="redeem-page">
    <input v-model="code" placeholder="请输入兑换码" />
    <button @click="redeem">兑换</button>
    
    <view v-if="result" class="result">
      <text>{{ result.reward }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      code: '',
      result: null
    };
  },
  
  methods: {
    async redeem() {
      // 1. 验证格式
      if (!this.validateCode()) {
        uni.showToast({
          title: '兑换码格式不正确',
          icon: 'none'
        });
        return;
      }
      
      // 2. 调用兑换接口
      try {
        const res = await uniCloud.callFunction({
          name: 'cdk-redeem',
          data: {
            code: this.code.trim()
          }
        });
        
        if (res.result.code === 0) {
          // 兑换成功
          this.result = res.result.data;
          
          uni.showToast({
            title: '兑换成功！',
            icon: 'success'
          });
          
          // 保存到历史记录
          this.saveHistory({
            code: this.code,
            reward: res.result.data.reward,
            timestamp: Date.now()
          });
          
          // 清空输入
          this.code = '';
        } else {
          // 兑换失败
          this.handleError(res.result.code, res.result.msg);
        }
      } catch (error) {
        console.error('兑换失败:', error);
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      }
    },
    
    // 验证兑换码格式
    validateCode() {
      const code = this.code.trim();
      
      // 长度检查
      if (code.length < 6 || code.length > 32) {
        return false;
      }
      
      // 格式检查（只允许字母、数字、连字符）
      const pattern = /^[A-Z0-9-]+$/i;
      return pattern.test(code);
    },
    
    // 处理错误
    handleError(code, msg) {
      const errorMessages = {
        1001: '兑换码无效，请检查后重试',
        1002: '兑换码已过期',
        1003: '该兑换码已被使用',
        1004: '操作过于频繁，请稍后再试'
      };
      
      uni.showToast({
        title: errorMessages[code] || msg || '兑换失败',
        icon: 'none'
      });
    },
    
    // 保存历史记录
    saveHistory(record) {
      const history = uni.getStorageSync('cdk_history') || [];
      history.unshift(record);
      
      // 保留最近50条
      if (history.length > 50) {
        history.splice(50);
      }
      
      uni.setStorageSync('cdk_history', history);
    }
  }
};
</script>
```

## 数据库表结构

### cdk_codes 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | ObjectID | 主键 |
| code | String | 兑换码（唯一索引） |
| type | String | 类型（vip/feature/music/points） |
| reward | String | 奖励描述 |
| value | Mixed | 奖励值（JSON） |
| status | String | 状态（active/redeemed/expired） |
| createdAt | Date | 创建时间 |
| expiredAt | Date | 过期时间 |
| redeemedAt | Date | 兑换时间 |
| redeemedBy | String | 兑换用户ID |

### cdk_redeem_records 表

| 字段名 | 类型 | 说明 |
|--------|------|------|
| _id | ObjectID | 主键 |
| userId | String | 用户ID |
| code | String | 兑换码 |
| reward | String | 奖励描述 |
| type | String | 类型 |
| status | String | 状态（success/failed） |
| createdAt | Date | 兑换时间 |
| ip | String | IP地址 |

## 业务规则

### 限流规则

- 每个用户每分钟最多兑换5次
- 每个IP每小时最多兑换20次
- 同一兑换码每次只能被一个用户使用

### 有效期规则

- 兑换码创建时指定有效期
- 过期的兑换码无法兑换
- 已兑换的兑换码无法再次使用

### 奖励发放规则

- 兑换成功后立即发放奖励
- VIP会员直接延长有效期
- 功能次数累加到用户账户
- 积分/金币立即到账

## 安全措施

### 防刷机制

1. **限流控制**: 使用Redis限制请求频率
2. **验证码**: 多次失败后要求输入验证码
3. **黑名单**: 异常行为用户加入黑名单
4. **日志记录**: 记录所有兑换行为

### 数据校验

```javascript
// 服务端验证
function validateRedeemRequest(code, userId) {
  // 1. 验证兑换码格式
  if (!code || typeof code !== 'string') {
    throw new Error('兑换码格式不正确');
  }
  
  // 2. 验证长度
  if (code.length < 6 || code.length > 32) {
    throw new Error('兑换码长度不正确');
  }
  
  // 3. 验证字符
  const pattern = /^[A-Z0-9-]+$/i;
  if (!pattern.test(code)) {
    throw new Error('兑换码包含非法字符');
  }
  
  // 4. 验证用户登录状态
  if (!userId) {
    throw new Error('用户未登录');
  }
  
  return true;
}
```

## 测试用例

### 正常兑换流程

```javascript
// 测试用例1: 兑换VIP会员
const res = await uniCloud.callFunction({
  name: 'cdk-redeem',
  data: {
    code: 'VIP7D-ABCD-1234'
  }
});

expect(res.result.code).toBe(0);
expect(res.result.data.type).toBe('vip');
expect(res.result.data.duration).toBe(7);
```

### 异常情况测试

```javascript
// 测试用例2: 无效的兑换码
const res = await uniCloud.callFunction({
  name: 'cdk-redeem',
  data: {
    code: 'INVALID-CODE'
  }
});

expect(res.result.code).toBe(1001);
expect(res.result.msg).toContain('无效');

// 测试用例3: 已过期的兑换码
const res2 = await uniCloud.callFunction({
  name: 'cdk-redeem',
  data: {
    code: 'EXPIRED-CODE'
  }
});

expect(res2.result.code).toBe(1002);
expect(res2.result.msg).toContain('过期');
```

## 性能优化

### 缓存策略

```javascript
// Redis缓存兑换码状态
const cacheKey = `cdk:${code}`;
const cached = await redis.get(cacheKey);

if (cached) {
  // 使用缓存数据
  return JSON.parse(cached);
}

// 从数据库查询
const codeData = await db.collection('cdk_codes')
  .where({ code })
  .get();

// 缓存1小时
await redis.setex(cacheKey, 3600, JSON.stringify(codeData));
```

### 数据库索引

```javascript
// 创建索引优化查询
db.collection('cdk_codes').createIndex({
  code: 1,
  status: 1,
  expiredAt: 1
});

db.collection('cdk_redeem_records').createIndex({
  userId: 1,
  createdAt: -1
});
```

## 监控指标

### 关键指标

- **兑换成功率**: 成功次数 / 总次数
- **平均响应时间**: 兑换接口响应时间
- **失败率分布**: 各类错误码的占比
- **热门兑换码**: 兑换次数最多的码

### 告警规则

- 兑换成功率 < 90%
- 平均响应时间 > 2秒
- 1分钟内失败次数 > 100

## 常见问题

### Q1: 兑换码区分大小写吗？

A: 不区分大小写。系统会自动转换为大写进行验证。

### Q2: 兑换成功后如何查看奖励？

A: 兑换成功后奖励立即生效，可在"我的"页面查看VIP状态或积分余额。

### Q3: 兑换失败如何处理？

A: 根据错误提示检查兑换码是否正确、是否过期或已被使用。如有疑问请联系客服。

### Q4: 可以重复兑换同一个码吗？

A: 不可以。每个兑换码只能使用一次。

---

**维护团队**: CraneHeart API Team  
**最后更新**: 2025-10-20  
**相关文档**: 
- [cdk-verify API文档](./cdk-verify.md)
- [CDK批量创建文档](./cdk-batchCreate.md)
- [数据库设计](../database/schema-cdk-music.md)
