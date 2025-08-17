# 云函数触发器配置

## HTTP触发器路径配置

### 兑换码系统
- POST /api/v1/cdk/batchCreate → cdk-batchCreate
- POST /api/v1/cdk/redeem → cdk-redeem  
- POST /api/v1/cdk/verify → cdk-verify

### 事件追踪
- POST /api/v1/events/track → events-track

### 管理员统计
- GET /api/v1/admin/metrics → admin-metrics

### 微信登录（可选）
- POST /api/v1/auth/wxLogin → auth-wxlogin

## 数据库表结构

### cdk_batches
```json
{
  "_id": "ObjectId",
  "prefix": "String",
  "count": "Number", 
  "length": "Number",
  "expiresAt": "Date",
  "type": "String",
  "metadata": "Object",
  "createdAt": "Date",
  "createdBy": "String"
}
```

### cdk_codes
```json
{
  "_id": "ObjectId",
  "code": "String", // 唯一索引
  "batchId": "String",
  "status": "String", // unused|redeemed|expired
  "userId": "String",
  "redeemedAt": "Date", 
  "expiresAt": "Date",
  "type": "String",
  "metadata": "Object"
}
```

### cdk_redemptions
```json
{
  "_id": "ObjectId",
  "code": "String",
  "userId": "String", 
  "batchId": "String",
  "redeemedAt": "Date",
  "client": "Object"
}
```

### events
```json
{
  "_id": "ObjectId",
  "userId": "String",
  "type": "String",
  "detail": "Object", 
  "ts": "Date",
  "client": "Object"
}
```

## 索引配置

### cdk_codes
- code: 唯一索引
- status: 普通索引
- batchId: 普通索引
- expiresAt: 普通索引

### cdk_redemptions  
- userId: 普通索引
- redeemedAt: 降序索引

### events
- type: 普通索引
- ts: 降序索引
- userId: 普通索引

### cdk_batches
- createdAt: 降序索引