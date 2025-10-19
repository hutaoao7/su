# cdk-redeem API文档

## 基本信息

- **云函数名称**: `cdk-redeem`
- **功能描述**: CDK兑换码兑换
- **请求方式**: uniCloud.callFunction
- **认证要求**: 需要Token认证
- **限流策略**: 每用户每小时最多10次兑换尝试

---

## 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| code | String | 是 | CDK兑换码 |

### 请求示例

```javascript
const { result } = await uniCloud.callFunction({
  name: 'cdk-redeem',
  data: {
    code: 'ABCD-1234-EFGH-5678'
  }
});
```

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "msg": "兑换成功",
  "data": {
    "benefit_type": "vip",
    "benefit_value": 30,
    "benefit_unit": "天",
    "valid_until": "2025-11-18T00:00:00Z",
    "message": "恭喜您获得30天VIP会员权益！"
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 说明 |
|--------|----------|------|
| 0 | 兑换成功 | 成功 |
| 40001 | 兑换码不能为空 | 参数错误 |
| 40401 | 兑换码不存在 | CDK无效 |
| 40002 | 兑换码已使用 | CDK已被兑换 |
| 40003 | 兑换码已过期 | CDK过期 |
| 40004 | 兑换码已禁用 | CDK被禁用 |
| 40005 | 您已兑换过此码 | 重复兑换 |
| 42901 | 兑换过于频繁 | 触发限流 |

---

**创建时间**: 2025-10-18


