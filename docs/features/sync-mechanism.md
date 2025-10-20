# 离线同步机制详细文档

## 文档信息
- **创建日期**: 2025-10-21
- **版本**: 1.0.0
- **状态**: 已实现

---

## 概述

离线同步机制是翎心CraneHeart应用的核心功能之一，确保用户在离线状态下产生的数据能够在网络恢复后自动上传到云端，实现无缝的跨设备数据同步。

## 核心特性

### 1. 自动同步
- 网络恢复时自动触发同步
- 智能重试机制（最多3次）
- 批量同步优化性能

### 2. 冲突处理
- 时间戳优先策略
- 合并策略（部分数据）
- 用户手动选择（重要数据）

### 3. 数据完整性
- 事务保证原子性
- 去重机制防止重复
- 校验和验证数据正确性

---

## 架构设计

### 系统架构图

```
┌─────────────────┐
│   客户端应用    │
│                 │
│  ┌───────────┐  │
│  │ 业务逻辑  │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ 缓存管理器 │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ 离线队列  │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │ 同步引擎  │  │
│  └─────┬─────┘  │
└────────┼────────┘
         │
    网络连接
         │
┌────────▼────────┐
│   云端服务器    │
│                 │
│  ┌───────────┐  │
│  │offline-sync│ │
│  │  云函数    │  │
│  └─────┬─────┘  │
│        │        │
│  ┌─────▼─────┐  │
│  │  数据库   │  │
│  └───────────┘  │
└─────────────────┘
```

### 数据流程

```
离线操作 → 加入队列 → 持久化 → 网络恢复 → 批量同步 → 云端处理 → 更新状态 → 清理队列
```

---

## 同步流程

### 1. 离线操作记录

```javascript
// 用户在离线状态下执行操作
async function performOfflineAction(action, data) {
  // 检查网络状态
  if (networkMonitor.isOffline()) {
    // 加入离线队列
    const queueId = await cacheManager.addToOfflineQueue(action, data);
    
    console.log('操作已保存到离线队列:', queueId);
    
    // 提示用户
    uni.showToast({
      title: '已保存到本地，网络恢复后自动上传',
      icon: 'success'
    });
    
    return { offline: true, queueId };
  }
  
  // 在线直接执行
  return await executeOnlineAction(action, data);
}
```

### 2. 队列持久化

```javascript
// 队列项结构
const queueItem = {
  id: 'offline_1634567890123_abc123',
  action: 'save_assessment',
  data: {
    scaleId: 'stress',
    answers: [...],
    score: 85,
    completedAt: '2025-10-21T12:00:00Z'
  },
  timestamp: 1634567890123,
  retryCount: 0,
  maxRetries: 3
};

// 持久化到本地存储
await cacheManager.db.put(
  'general',
  'offline_queue',
  queueItems,
  0 // 不过期
);
```

### 3. 网络恢复检测

```javascript
// 监听网络恢复事件
networkMonitor.on('recovered', async () => {
  console.log('网络已恢复，开始同步离线数据');
  
  // 加载离线队列
  await cacheManager.loadOfflineQueue();
  
  // 触发同步
  const result = await cacheManager.syncOfflineQueue();
  
  // 通知用户
  if (result.success > 0) {
    uni.showToast({
      title: `已同步${result.success}项数据`,
      icon: 'success'
    });
  }
});
```

### 4. 批量同步执行

```javascript
// 批量同步离线队列
async syncOfflineQueue() {
  if (this.syncInProgress || this.offlineQueue.length === 0) {
    return { success: 0, failed: 0 };
  }
  
  this.syncInProgress = true;
  
  const successIds = [];
  const failedItems = [];
  
  // 分批同步（每批10项）
  const batchSize = 10;
  for (let i = 0; i < this.offlineQueue.length; i += batchSize) {
    const batch = this.offlineQueue.slice(i, i + batchSize);
    
    try {
      // 调用云函数批量同步
      const result = await uniCloud.callFunction({
        name: 'offline-sync',
        data: {
          action: 'batch_sync',
          batchItems: batch
        }
      });
      
      if (result.result.code === 0) {
        // 记录成功的项
        result.result.data.results.forEach(r => {
          successIds.push(r.itemId);
        });
        
        // 记录失败的项（用于重试）
        result.result.data.errors.forEach(e => {
          const item = batch[e.index];
          item.retryCount++;
          if (item.retryCount < item.maxRetries) {
            failedItems.push(item);
          }
        });
      }
    } catch (e) {
      console.error('批量同步失败:', e);
      
      // 增加重试计数
      batch.forEach(item => {
        item.retryCount++;
        if (item.retryCount < item.maxRetries) {
          failedItems.push(item);
        }
      });
    }
  }
  
  // 更新队列（只保留失败且未超过重试次数的项）
  this.offlineQueue = failedItems;
  await this.saveOfflineQueue();
  
  this.syncInProgress = false;
  
  return {
    success: successIds.length,
    failed: failedItems.length
  };
}
```

### 5. 云端处理

```javascript
// offline-sync云函数处理批量同步
async function handleBatchSync(userId, batchItems) {
  const results = [];
  const errors = [];
  
  // 开启事务
  const transaction = await db.startTransaction();
  
  try {
    for (let i = 0; i < batchItems.length; i++) {
      const item = batchItems[i];
      
      try {
        let result;
        
        switch (item.action) {
          case 'save_assessment':
            result = await handleSaveAssessment(userId, item.data, transaction);
            break;
            
          case 'save_chat':
            result = await handleSaveChat(userId, item.data, transaction);
            break;
            
          default:
            throw new Error(`不支持的操作: ${item.action}`);
        }
        
        results.push({
          index: i,
          itemId: item.id,
          success: true,
          result
        });
        
      } catch (e) {
        errors.push({
          index: i,
          itemId: item.id,
          success: false,
          error: e.message
        });
      }
    }
    
    // 提交事务
    await transaction.commit();
    
    return {
      total: batchItems.length,
      success: results.length,
      failed: errors.length,
      results,
      errors
    };
    
  } catch (e) {
    // 回滚事务
    await transaction.rollback();
    throw e;
  }
}
```

---

## 冲突处理策略

### 1. 时间戳优先策略

用于大多数数据类型，以最新的时间戳为准。

```javascript
async function resolveConflict_Timestamp(localData, remoteData) {
  const localTime = new Date(localData.updatedAt).getTime();
  const remoteTime = new Date(remoteData.updatedAt).getTime();
  
  if (localTime > remoteTime) {
    // 本地数据更新，使用本地
    return {
      action: 'use_local',
      data: localData
    };
  } else {
    // 远程数据更新，使用远程
    return {
      action: 'use_remote',
      data: remoteData
    };
  }
}
```

### 2. 合并策略

用于部分可合并的数据，如聊天记录。

```javascript
async function resolveConflict_Merge(localMessages, remoteMessages) {
  // 按时间戳合并消息
  const allMessages = [...localMessages, ...remoteMessages];
  
  // 去重（根据消息ID或时间戳）
  const uniqueMessages = [];
  const seen = new Set();
  
  for (const msg of allMessages) {
    const key = msg.id || msg.timestamp;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueMessages.push(msg);
    }
  }
  
  // 按时间排序
  uniqueMessages.sort((a, b) => 
    new Date(a.timestamp) - new Date(b.timestamp)
  );
  
  return {
    action: 'merge',
    data: uniqueMessages
  };
}
```

### 3. 用户选择策略

用于重要数据，让用户手动选择。

```javascript
async function resolveConflict_UserChoice(localData, remoteData) {
  return new Promise((resolve) => {
    uni.showModal({
      title: '数据冲突',
      content: '本地和云端数据不一致，请选择保留哪个版本',
      confirmText: '保留本地',
      cancelText: '保留云端',
      success: (res) => {
        if (res.confirm) {
          resolve({
            action: 'use_local',
            data: localData
          });
        } else {
          resolve({
            action: 'use_remote',
            data: remoteData
          });
        }
      }
    });
  });
}
```

---

## 数据去重机制

### 评估结果去重

```javascript
async function deduplicateAssessment(userId, scaleId, completedAt) {
  // 检查是否已存在相同时间的评估
  const existing = await db.collection('assessment_results')
    .where({
      user_id: userId,
      scale_id: scaleId,
      completed_at: completedAt
    })
    .get();
  
  if (existing.data.length > 0) {
    return {
      isDuplicate: true,
      existingId: existing.data[0]._id
    };
  }
  
  return {
    isDuplicate: false
  };
}
```

### 聊天记录去重

```javascript
async function deduplicateMessages(sessionId, messages) {
  // 获取已存在的消息时间戳
  const existingMessages = await db.collection('chat_messages')
    .where({ session_id: sessionId })
    .field({ timestamp: true })
    .get();
  
  const existingTimestamps = new Set(
    existingMessages.data.map(m => new Date(m.timestamp).getTime())
  );
  
  // 过滤出新消息
  const newMessages = messages.filter(
    msg => !existingTimestamps.has(new Date(msg.timestamp).getTime())
  );
  
  return {
    newMessages,
    duplicateCount: messages.length - newMessages.length
  };
}
```

---

## 错误处理

### 1. 网络错误

```javascript
try {
  const result = await uniCloud.callFunction({
    name: 'offline-sync',
    data: syncData
  });
} catch (e) {
  if (e.errCode === 'NETWORK_ERROR') {
    // 网络错误，保留在队列中稍后重试
    console.log('网络错误，稍后重试');
    return { retry: true };
  }
  
  throw e;
}
```

### 2. 服务器错误

```javascript
const result = await uniCloud.callFunction({
  name: 'offline-sync',
  data: syncData
});

if (result.result.code === 500) {
  // 服务器错误，增加重试计数
  item.retryCount++;
  
  if (item.retryCount < 3) {
    // 继续重试
    return { retry: true };
  } else {
    // 超过重试次数，标记为失败
    return { retry: false, failed: true };
  }
}
```

### 3. 数据错误

```javascript
if (result.result.code === 400) {
  // 数据验证失败，不再重试
  console.error('数据错误:', result.result.message);
  
  // 从队列中移除
  return { retry: false, failed: true };
}
```

---

## 性能优化

### 1. 批量同步

```javascript
// 每次同步最多10项
const BATCH_SIZE = 10;

for (let i = 0; i < queue.length; i += BATCH_SIZE) {
  const batch = queue.slice(i, i + BATCH_SIZE);
  await syncBatch(batch);
}
```

### 2. 并发控制

```javascript
// 使用信号量控制并发
const maxConcurrent = 3;
const semaphore = new Semaphore(maxConcurrent);

const promises = batches.map(async (batch) => {
  await semaphore.acquire();
  
  try {
    return await syncBatch(batch);
  } finally {
    semaphore.release();
  }
});

await Promise.all(promises);
```

### 3. 压缩传输

```javascript
// 压缩大数据
if (dataSize > 10240) { // 大于10KB
  const compressed = await compressData(data);
  syncData.compressed = true;
  syncData.data = compressed;
}
```

---

## 监控和日志

### 同步日志表设计

```sql
CREATE TABLE sync_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- pending/success/failed
  client_ip VARCHAR(50),
  client_ua TEXT,
  sync_time TIMESTAMP NOT NULL,
  result JSONB,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_logs_user ON sync_logs(user_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_time ON sync_logs(sync_time DESC);
```

### 统计查询

```sql
-- 同步成功率统计
SELECT 
  action,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as success,
  ROUND(100.0 * SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) / COUNT(*), 2) as success_rate
FROM sync_logs
WHERE sync_time >= NOW() - INTERVAL '7 days'
GROUP BY action;

-- 失败原因分析
SELECT 
  error,
  COUNT(*) as count
FROM sync_logs
WHERE status = 'failed'
  AND sync_time >= NOW() - INTERVAL '7 days'
GROUP BY error
ORDER BY count DESC
LIMIT 10;
```

---

## 最佳实践

### 1. 及时同步

```javascript
// 应用进入前台时检查并同步
onShow() {
  if (networkMonitor.isOnline() && cacheManager.offlineQueue.length > 0) {
    cacheManager.syncOfflineQueue();
  }
}
```

### 2. 用户提示

```javascript
// 显示同步进度
uni.showLoading({
  title: `同步中 (${current}/${total})`
});

// 同步完成提示
uni.showToast({
  title: '同步完成',
  icon: 'success'
});
```

### 3. 失败处理

```javascript
// 对于重要数据，提供手动重试
if (result.failed > 0) {
  uni.showModal({
    title: '部分数据同步失败',
    content: `有${result.failed}项数据未能同步，是否重试？`,
    success: (res) => {
      if (res.confirm) {
        cacheManager.syncOfflineQueue();
      }
    }
  });
}
```

---

## 常见问题

### Q1: 同步失败怎么办？
**A**: 系统会自动重试最多3次。如果仍然失败，数据会保留在离线队列中，用户可以手动触发同步。

### Q2: 会不会重复上传？
**A**: 不会。云端有去重机制，根据时间戳或唯一ID识别重复数据。

### Q3: 离线数据会丢失吗？
**A**: 不会。离线数据持久化在本地存储中，除非用户主动清除缓存。

### Q4: 同步很慢怎么办？
**A**: 
- 检查网络状况
- 减少单次同步的数据量
- 使用WiFi网络同步大量数据

---

## 未来优化

### 短期
- [ ] 增量同步（只同步变化的部分）
- [ ] 断点续传（大文件支持）
- [ ] 智能调度（选择最佳同步时机）

### 中期
- [ ] P2P同步（设备间直接同步）
- [ ] 冲突自动解决（AI辅助）
- [ ] 实时同步（WebSocket）

### 长期
- [ ] 分布式同步
- [ ] 多端协同编辑
- [ ] 版本控制系统

---

## 技术支持

如有问题或建议，请联系开发团队。

**文档版本**: 1.0.0  
**更新日期**: 2025-10-21

