# 离线数据同步API文档

**文档版本**: v1.0.0  
**最后更新**: 2025-10-20  
**负责云函数**: `offline-sync`

---

## 概述

本文档描述翎心CraneHeart应用的离线数据同步机制，包括离线缓存、自动同步、冲突处理等功能。

---

## 功能特性

### 核心功能
1. **离线缓存**: 支持量表、评估结果、聊天记录、用户数据的离线缓存
2. **自动同步**: 网络恢复后自动同步离线期间产生的数据
3. **冲突检测**: 检测客户端和服务器数据的冲突
4. **冲突解决**: 支持多种冲突解决策略（服务器优先/客户端优先/手动选择）
5. **网络监听**: 实时监听网络状态变化
6. **同步队列**: 失败数据自动加入队列，支持重试

### 支持的数据类型
- **scales**: 量表数据（只读，不需要同步到服务器）
- **results**: 评估结果
- **chats**: 聊天记录
- **user_data**: 用户个人信息

---

## 架构设计

### 整体架构

```
┌─────────────────┐
│   前端应用层    │
│  (Vue组件)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  缓存管理层      │
│ (cache-manager) │
│  - 数据缓存      │
│  - 网络监听      │
│  - 同步队列      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   存储层        │
│ IndexedDB (H5)  │
│ localStorage    │
│    (小程序)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   同步层        │
│ offline-sync    │
│   (云函数)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   数据库层      │
│  (Supabase)     │
└─────────────────┘
```

### 数据流

**离线写入流程**:
```
1. 用户操作（保存数据） 
   ↓
2. cache-manager.set()
   ↓
3. 保存到IndexedDB/localStorage
   ↓
4. 标记为needSync=true
   ↓
5. 加入同步队列（如果离线）
```

**在线同步流程**:
```
1. 网络状态变化 (offline → online)
   ↓
2. cache-manager监听到online事件
   ↓
3. 自动触发syncOfflineData()
   ↓
4. 遍历同步队列
   ↓
5. 调用offline-sync云函数
   ↓
6. 检查冲突
   ├─ 无冲突 → 直接写入数据库
   └─ 有冲突 → 根据策略处理
   ↓
7. 同步成功，从队列移除
```

---

## API接口

### 1. 同步单个数据项

**云函数**: `offline-sync`

**请求参数**:
```javascript
{
  "action": "sync_single",
  "storeType": "results",        // 数据类型
  "key": "result_123456",        // 数据键
  "data": {                      // 数据内容
    "scale_id": "pss10",
    "score": 18,
    "level": "moderate",
    ...
  },
  "timestamp": 1697800000000     // 客户端时间戳
}
```

**响应数据**:
```javascript
{
  "errCode": 0,
  "errMsg": "success"
}
```

**冲突响应**:
```javascript
{
  "errCode": 409,
  "errMsg": "conflict",
  "serverData": {
    "scale_id": "pss10",
    "score": 20,
    "updated_at": "2025-10-20T10:30:00Z"
  }
}
```

---

### 2. 批量同步数据

**云函数**: `offline-sync`

**请求参数**:
```javascript
{
  "action": "sync_batch",
  "items": [
    {
      "storeType": "results",
      "key": "result_123456",
      "data": {...},
      "timestamp": 1697800000000
    },
    {
      "storeType": "chats",
      "key": "message_789012",
      "data": {...},
      "timestamp": 1697800100000
    }
  ]
}
```

**响应数据**:
```javascript
{
  "errCode": 0,
  "errMsg": "success",
  "results": {
    "success": 8,
    "failed": 1,
    "conflicts": 1,
    "items": [
      {
        "storeType": "results",
        "key": "result_123456",
        "status": "success",
        "errMsg": "success"
      },
      {
        "storeType": "chats",
        "key": "message_789012",
        "status": "failed",
        "errMsg": "network timeout"
      }
    ]
  }
}
```

---

### 3. 检查数据冲突

**云函数**: `offline-sync`

**请求参数**:
```javascript
{
  "action": "check_conflict",
  "storeType": "results",
  "key": "result_123456",
  "timestamp": 1697800000000
}
```

**响应数据**:
```javascript
// 无冲突
{
  "errCode": 0,
  "errMsg": "no conflict",
  "conflict": false
}

// 有冲突
{
  "errCode": 409,
  "errMsg": "conflict",
  "conflict": true,
  "serverTimestamp": 1697800100000,
  "clientTimestamp": 1697800000000
}
```

---

## 前端集成

### 1. 初始化缓存管理器

```javascript
import { CacheManager } from '@/utils/cache-manager.js';

export default {
  async onLaunch() {
    // 初始化缓存管理器
    await CacheManager.init();
    
    // 监听网络状态
    CacheManager.on('online', () => {
      console.log('网络已恢复');
      uni.showToast({
        title: '正在同步离线数据...',
        icon: 'loading'
      });
    });
    
    CacheManager.on('offline', () => {
      console.log('网络已断开');
      uni.showToast({
        title: '网络离线，数据将自动缓存',
        icon: 'none'
      });
    });
    
    CacheManager.on('sync', (results) => {
      console.log('同步完成:', results);
      uni.showToast({
        title: `同步完成：${results.success}条成功`,
        icon: 'success'
      });
    });
  }
};
```

---

### 2. 保存数据到缓存

```javascript
// 保存评估结果
async saveAssessmentResult(result) {
  try {
    // 保存到缓存，标记需要同步
    await CacheManager.set('results', result.id, result, {
      userId: this.userId,
      needSync: true
    });
    
    uni.showToast({
      title: '保存成功',
      icon: 'success'
    });
    
  } catch (error) {
    console.error('保存失败:', error);
    uni.showToast({
      title: '保存失败',
      icon: 'error'
    });
  }
}
```

---

### 3. 从缓存读取数据

```javascript
// 读取评估结果
async loadAssessmentResult(resultId) {
  try {
    // 先从缓存读取
    let result = await CacheManager.get('results', resultId);
    
    // 如果缓存未命中且网络在线，从服务器获取
    if (!result && CacheManager.isOnline()) {
      const response = await this.fetchFromServer(resultId);
      if (response.errCode === 0) {
        result = response.data;
        
        // 保存到缓存
        await CacheManager.set('results', resultId, result, {
          needSync: false
        });
      }
    }
    
    return result;
    
  } catch (error) {
    console.error('读取失败:', error);
    return null;
  }
}
```

---

### 4. 手动触发同步

```javascript
async syncNow() {
  uni.showLoading({
    title: '同步中...'
  });
  
  try {
    await CacheManager.syncOfflineData();
    
    uni.showToast({
      title: '同步成功',
      icon: 'success'
    });
    
  } catch (error) {
    console.error('同步失败:', error);
    uni.showToast({
      title: '同步失败',
      icon: 'error'
    });
  } finally {
    uni.hideLoading();
  }
}
```

---

### 5. 显示离线提示UI

```vue
<template>
  <view class="offline-indicator" v-if="!isOnline">
    <u-icon name="wifi-off" size="16"></u-icon>
    <text class="offline-text">网络离线</text>
    <button class="sync-btn" @tap="syncNow">同步数据</button>
  </view>
</template>

<script>
import { CacheManager } from '@/utils/cache-manager.js';

export default {
  data() {
    return {
      isOnline: true
    };
  },
  
  onLoad() {
    // 初始状态
    this.isOnline = CacheManager.isOnline();
    
    // 监听网络状态变化
    CacheManager.on('online', () => {
      this.isOnline = true;
    });
    
    CacheManager.on('offline', () => {
      this.isOnline = false;
    });
  },
  
  methods: {
    async syncNow() {
      await CacheManager.syncOfflineData();
    }
  }
};
</script>

<style scoped>
.offline-indicator {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background: #FF9500;
  color: white;
  padding: 10rpx 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.offline-text {
  margin: 0 10rpx;
  font-size: 28rpx;
}

.sync-btn {
  margin-left: 20rpx;
  padding: 5rpx 15rpx;
  background: white;
  color: #FF9500;
  border-radius: 8rpx;
  font-size: 24rpx;
}
</style>
```

---

## 冲突处理策略

### 1. 服务器优先（默认）

当检测到冲突时，保留服务器端的数据，丢弃客户端的修改。

```javascript
if (result.errCode === 409) {
  // 服务器数据更新，使用服务器数据
  await CacheManager.set('results', key, result.serverData, {
    needSync: false
  });
  
  uni.showModal({
    title: '数据冲突',
    content: '服务器数据已更新，已自动使用最新数据',
    showCancel: false
  });
}
```

---

### 2. 客户端优先

保留客户端的数据，强制覆盖服务器数据。

```javascript
if (result.errCode === 409) {
  // 强制使用客户端数据
  await callCloudFunction('offline-sync', {
    action: 'sync_single',
    storeType: 'results',
    key: key,
    data: clientData,
    timestamp: Date.now(),
    force: true  // 强制覆盖
  });
}
```

---

### 3. 手动选择

让用户选择保留哪个版本的数据。

```javascript
if (result.errCode === 409) {
  // 显示冲突对话框
  uni.showModal({
    title: '数据冲突',
    content: '服务器和本地数据不一致，请选择保留哪个版本',
    confirmText: '保留服务器',
    cancelText: '保留本地',
    success: (res) => {
      if (res.confirm) {
        // 保留服务器数据
        CacheManager.set('results', key, result.serverData, {
          needSync: false
        });
      } else {
        // 保留本地数据，强制上传
        callCloudFunction('offline-sync', {
          action: 'sync_single',
          storeType: 'results',
          key: key,
          data: clientData,
          timestamp: Date.now(),
          force: true
        });
      }
    }
  });
}
```

---

### 4. 合并策略

对于某些类型的数据，可以尝试自动合并。

```javascript
if (result.errCode === 409) {
  // 合并数据（示例：用户资料）
  const mergedData = {
    ...result.serverData,
    ...clientData,
    // 保留服务器的某些字段
    id: result.serverData.id,
    created_at: result.serverData.created_at,
    // 使用最新的updated_at
    updated_at: Math.max(
      new Date(result.serverData.updated_at).getTime(),
      clientData.timestamp
    )
  };
  
  // 上传合并后的数据
  await callCloudFunction('offline-sync', {
    action: 'sync_single',
    storeType: 'user_data',
    key: key,
    data: mergedData,
    timestamp: Date.now(),
    force: true
  });
}
```

---

## 性能优化

### 1. 批量同步

建议批量同步以减少网络请求次数：

```javascript
// 收集所有待同步数据
const items = [];
for (const item of syncQueue) {
  items.push({
    storeType: item.storeType,
    key: item.key,
    data: item.data,
    timestamp: item.timestamp
  });
  
  // 每100条发起一次批量请求
  if (items.length >= 100) {
    await callCloudFunction('offline-sync', {
      action: 'sync_batch',
      items: items
    });
    items.length = 0;
  }
}

// 同步剩余数据
if (items.length > 0) {
  await callCloudFunction('offline-sync', {
    action: 'sync_batch',
    items: items
  });
}
```

---

### 2. 智能同步

优先同步重要数据，次要数据延后：

```javascript
// 按优先级排序同步队列
syncQueue.sort((a, b) => {
  const priority = {
    'results': 1,      // 评估结果优先级最高
    'user_data': 2,    // 用户数据次之
    'chats': 3         // 聊天记录最后
  };
  
  return (priority[a.storeType] || 99) - (priority[b.storeType] || 99);
});
```

---

### 3. 增量同步

只同步有变化的数据：

```javascript
// 记录上次同步时间
const lastSyncTime = uni.getStorageSync('last_sync_time') || 0;

// 只同步上次同步后的数据
const itemsToSync = syncQueue.filter(item => {
  return item.timestamp > lastSyncTime;
});

// 更新同步时间
uni.setStorageSync('last_sync_time', Date.now());
```

---

## 安全性

### 1. Token验证

所有同步请求都需要携带Token：

```javascript
const token = uni.getStorageSync('token');
const result = await callCloudFunction('offline-sync', {
  action: 'sync_single',
  ...params
}, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

---

### 2. 数据加密

敏感数据在本地缓存时进行加密：

```javascript
import { encryptData, decryptData } from '@/utils/storage-crypto.js';

// 保存时加密
const encrypted = await encryptData(sensitiveData);
await CacheManager.set('user_data', 'payment_info', encrypted);

// 读取时解密
const encrypted = await CacheManager.get('user_data', 'payment_info');
const decrypted = await decryptData(encrypted);
```

---

### 3. 数据校验

同步前验证数据完整性：

```javascript
function validateData(storeType, data) {
  switch (storeType) {
    case 'results':
      if (!data.scale_id || !data.score) {
        throw new Error('评估结果数据不完整');
      }
      break;
      
    case 'user_data':
      if (!data.userId) {
        throw new Error('用户数据缺少userId');
      }
      break;
  }
  
  return true;
}
```

---

## 错误处理

### 常见错误码

| 错误码 | 说明 | 处理方式 |
|--------|------|---------|
| 401 | 未登录 | 跳转到登录页 |
| 409 | 数据冲突 | 根据策略处理冲突 |
| 500 | 服务器错误 | 重试或提示用户 |
| 503 | 服务不可用 | 稍后重试 |

---

### 重试机制

```javascript
async function syncWithRetry(item, maxRetry = 3) {
  for (let i = 0; i < maxRetry; i++) {
    try {
      const result = await callCloudFunction('offline-sync', {
        action: 'sync_single',
        ...item
      });
      
      if (result.errCode === 0) {
        return true;
      }
      
      // 如果是冲突，不重试
      if (result.errCode === 409) {
        return false;
      }
      
      // 其他错误，等待后重试
      await sleep(1000 * (i + 1));
      
    } catch (error) {
      console.error(`同步失败，第${i + 1}次重试:`, error);
    }
  }
  
  return false;
}
```

---

## 测试

### 单元测试

```javascript
describe('CacheManager', () => {
  it('should save data to cache', async () => {
    const result = await CacheManager.set('results', 'test_001', {
      score: 18
    });
    expect(result).toBe(true);
  });
  
  it('should load data from cache', async () => {
    const data = await CacheManager.get('results', 'test_001');
    expect(data.score).toBe(18);
  });
  
  it('should detect network status', () => {
    const isOnline = CacheManager.isOnline();
    expect(typeof isOnline).toBe('boolean');
  });
});
```

---

### E2E测试

```javascript
// 测试离线保存和在线同步
async function testOfflineSync() {
  // 1. 模拟离线状态
  await CacheManager.setNetworkStatus(false);
  
  // 2. 保存数据
  await CacheManager.set('results', 'test_002', {
    score: 20
  }, { needSync: true });
  
  // 3. 验证数据在缓存中
  const cached = await CacheManager.get('results', 'test_002');
  assert(cached !== null);
  
  // 4. 恢复网络
  await CacheManager.setNetworkStatus(true);
  
  // 5. 触发同步
  await CacheManager.syncOfflineData();
  
  // 6. 验证服务器端数据
  const serverData = await fetchFromServer('test_002');
  assert(serverData.score === 20);
}
```

---

## 最佳实践

1. **及时初始化**: 在App.onLaunch中初始化CacheManager
2. **监听事件**: 监听online/offline事件，给用户友好提示
3. **合理缓存**: 不要缓存过多数据，定期清理过期缓存
4. **批量操作**: 尽量使用批量同步，减少网络请求
5. **错误处理**: 妥善处理各种错误情况，不要让应用崩溃
6. **数据加密**: 敏感数据必须加密存储
7. **版本控制**: 记录数据版本，便于冲突检测和处理

---

## 常见问题

### Q1: 如何判断数据是否需要同步？

**A**: 在保存数据时设置`needSync: true`：

```javascript
await CacheManager.set('results', key, data, {
  needSync: true  // 标记需要同步
});
```

---

### Q2: 同步失败怎么办？

**A**: 失败的数据会自动加入同步队列，下次网络恢复时重试。超过3次重试后会被移除队列。

---

### Q3: 如何清理缓存？

**A**: 调用clear方法：

```javascript
// 清空指定类型
await CacheManager.clear('results');

// 清空所有缓存
await CacheManager.clearAll();
```

---

### Q4: IndexedDB和localStorage有什么区别？

**A**: 
- IndexedDB：H5端使用，性能更好，支持大数据量，支持索引查询
- localStorage：小程序端降级方案，容量较小（10MB），API简单

---

## 附录

### A. 数据结构示例

**缓存数据结构**:
```javascript
{
  "id": "1697800000000_abc123",
  "key": "result_123456",
  "data": {
    "scale_id": "pss10",
    "score": 18,
    "level": "moderate"
  },
  "userId": "user_789",
  "timestamp": 1697800000000,
  "synced": false,
  "storeType": "results"
}
```

---

**同步队列项结构**:
```javascript
{
  "id": "1697800000000_abc123",
  "storeType": "results",
  "key": "result_123456",
  "data": {...},
  "timestamp": 1697800000000,
  "addedAt": 1697800000000,
  "retryCount": 0,
  "userId": "user_789"
}
```

---

## 更新日志

- **v1.0.0** (2025-10-20): 初始版本，实现基本离线同步功能

---

**维护人**: CraneHeart Team  
**联系方式**: support@craneheart.com

