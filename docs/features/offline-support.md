# 离线支持功能文档

## 文档信息
- **创建日期**: 2025-10-21
- **版本**: 1.0.0
- **状态**: 已实现

---

## 功能概述

离线支持功能允许用户在无网络环境下继续使用应用的核心功能，包括答题评估、查看历史结果等。网络恢复后，本地数据会自动同步到云端。

## 核心特性

### 1. 离线缓存管理（cache-manager.js）
- **IndexedDB存储**（H5端）：高性能的浏览器端数据库
- **localStorage降级**（小程序端）：兼容不支持IndexedDB的环境
- **LRU淘汰策略**：自动清理最少使用的缓存数据
- **容量限制**：各类数据设置独立的容量上限
- **过期管理**：自动清理过期数据，默认7天有效期

### 2. 网络状态监测（network-monitor.js）
- **实时监测**：持续监控网络连接状态
- **网络类型识别**：WiFi、4G、5G等网络类型
- **网络质量评估**：根据响应时间评估网络质量
- **事件通知**：网络状态变化时触发回调
- **建议提示**：根据网络状况给出使用建议

### 3. 离线队列管理
- **操作队列**：离线时的操作加入队列
- **自动同步**：网络恢复时自动上传
- **重试机制**：失败操作最多重试3次
- **状态追踪**：记录每个操作的同步状态

### 4. 数据类型支持
- ✅ **量表数据**：14个心理量表完整缓存
- ✅ **评估结果**：历史评估结果本地存储
- ✅ **聊天记录**：AI对话历史（已集成）
- ✅ **音乐数据**：播放列表和收藏（预留）
- ✅ **通用缓存**：其他业务数据

---

## 技术实现

### 1. 缓存管理器架构

```javascript
// 初始化
import cacheManager from '@/utils/cache-manager.js';

await cacheManager.init();

// 缓存量表
await cacheManager.cacheScale('stress', scaleData);

// 获取缓存的量表
const scale = await cacheManager.getScale('stress');

// 缓存评估结果
await cacheManager.cacheResult('result_001', resultData);

// 获取缓存的结果
const result = await cacheManager.getResult('result_001');

// 添加到离线队列
await cacheManager.addToOfflineQueue('save_assessment', {
  scaleId: 'stress',
  answers: [...]
});

// 手动触发同步
await cacheManager.syncOfflineQueue();

// 获取缓存统计
const stats = await cacheManager.getStats();

// 清空所有缓存
await cacheManager.clearAll();
```

### 2. 网络监测器使用

```javascript
// 初始化
import networkMonitor from '@/utils/network-monitor.js';

// 开始监测
networkMonitor.start();

// 监听网络状态变化
const unsubscribe = networkMonitor.on('change', (event) => {
  console.log('网络状态:', event.data.status);
  console.log('网络类型:', event.data.networkType);
  console.log('网络质量:', event.data.quality);
});

// 监听网络恢复
networkMonitor.on('recovered', (event) => {
  console.log('网络已恢复，开始同步数据');
  // 触发数据同步
});

// 监听离线
networkMonitor.on('offline', (event) => {
  console.log('网络已断开，进入离线模式');
  // 切换到离线模式UI
});

// 获取当前状态
const status = networkMonitor.getStatus();

// 检查是否在线
if (networkMonitor.isOnline()) {
  // 执行需要网络的操作
}

// 检查是否弱网
if (networkMonitor.isWeakNetwork()) {
  // 降低数据加载量
}

// 停止监测
networkMonitor.stop();

// 移除监听器
unsubscribe();
```

### 3. 离线管理页面集成

```javascript
// 在pages.json中配置路由
{
  "path": "pages-sub/other/offline-manager",
  "style": {
    "navigationStyle": "custom"
  }
}

// 导航到离线管理页面
uni.navigateTo({
  url: '/pages-sub/other/offline-manager'
});
```

---

## 存储配置

### 容量限制

| 数据类型 | 容量上限 | 说明 |
|---------|---------|------|
| SCALES | 10 MB | 量表数据 |
| RESULTS | 20 MB | 评估结果 |
| CHATS | 50 MB | 聊天记录 |
| MUSIC | 100 MB | 音乐数据 |
| GENERAL | 30 MB | 通用缓存 |

### 过期策略

- **默认TTL**: 7天
- **自动清理**: 每小时检查一次过期数据
- **LRU淘汰**: 容量超限时淘汰最少使用的数据

---

## 离线队列机制

### 队列项结构

```javascript
{
  id: 'offline_1634567890123_abc123',
  action: 'save_assessment',
  data: {
    // 操作数据
  },
  timestamp: 1634567890123,
  retryCount: 0
}
```

### 支持的操作类型

1. **save_assessment**: 保存评估结果
2. **save_chat**: 保存聊天记录
3. **update_profile**: 更新用户信息
4. **upload_feedback**: 上传反馈

### 同步流程

1. 用户在离线状态下执行操作
2. 操作数据加入离线队列
3. 队列持久化到本地存储
4. 网络恢复后自动触发同步
5. 逐个上传队列项到服务器
6. 上传成功则从队列移除
7. 上传失败则重试（最多3次）
8. 超过重试次数的项目标记为失败

---

## 用户界面

### 离线管理页面功能

1. **网络状态卡片**
   - 显示当前网络状态（在线/离线）
   - 显示网络类型（WiFi、4G等）
   - 显示网络质量评估
   - 显示响应时间
   - 给出使用建议

2. **缓存统计卡片**
   - 各类数据的缓存数量和大小
   - 离线队列待同步项数
   - 刷新统计按钮
   - 立即同步按钮
   - 清空缓存按钮

3. **离线功能卡片**
   - 离线答题功能状态
   - 结果查看功能状态
   - 自动同步开关
   - 同步提醒开关

4. **使用说明**
   - 离线功能使用指南
   - 注意事项说明

---

## 最佳实践

### 1. 预加载策略

```javascript
// 在应用启动时预加载常用量表
async function preloadScales() {
  const commonScales = ['stress', 'anxiety', 'depression'];
  
  for (const scaleId of commonScales) {
    const cached = await cacheManager.getScale(scaleId);
    
    if (!cached) {
      // 从服务器加载
      const scaleData = await fetchScaleFromServer(scaleId);
      // 缓存到本地
      await cacheManager.cacheScale(scaleId, scaleData);
    }
  }
}
```

### 2. 离线检测

```javascript
// 在执行网络请求前检查网络状态
async function saveAssessment(data) {
  if (networkMonitor.isOffline()) {
    // 离线，加入队列
    await cacheManager.addToOfflineQueue('save_assessment', data);
    
    uni.showToast({
      title: '已保存到本地，网络恢复后自动上传',
      icon: 'success'
    });
    
    return { offline: true };
  }
  
  // 在线，直接上传
  return await uploadToServer(data);
}
```

### 3. 弱网优化

```javascript
// 根据网络质量调整数据加载策略
function getLoadStrategy() {
  const quality = networkMonitor.getStatus().quality;
  
  switch (quality) {
    case 'excellent':
    case 'good':
      return {
        imageQuality: 'high',
        preloadCount: 10
      };
      
    case 'fair':
      return {
        imageQuality: 'medium',
        preloadCount: 5
      };
      
    case 'poor':
      return {
        imageQuality: 'low',
        preloadCount: 2
      };
      
    default:
      return {
        imageQuality: 'low',
        preloadCount: 0
      };
  }
}
```

### 4. 用户提示

```javascript
// 在页面显示网络状态提示
export default {
  data() {
    return {
      showOfflineTip: false
    };
  },
  
  onShow() {
    if (networkMonitor.isOffline()) {
      this.showOfflineTip = true;
    }
    
    // 监听网络状态变化
    this.networkUnsubscribe = networkMonitor.on('change', (event) => {
      this.showOfflineTip = event.data.status === 'offline';
    });
  },
  
  onHide() {
    if (this.networkUnsubscribe) {
      this.networkUnsubscribe();
    }
  }
};
```

---

## 性能优化

### 1. 批量操作
- 多个缓存操作合并为一个事务
- 减少IndexedDB的读写次数

### 2. 异步执行
- 缓存操作使用async/await
- 不阻塞主线程

### 3. 懒加载
- 按需加载缓存数据
- 避免一次性加载大量数据

### 4. 压缩存储
- 大数据可选择压缩后存储
- 节省存储空间

---

## 安全考虑

### 1. 数据加密
- 敏感数据可选择加密存储
- 集成storage-crypto工具

### 2. 数据清理
- 定期清理过期和无效数据
- 防止存储空间耗尽

### 3. 权限控制
- 离线数据仅限当前用户访问
- 退出登录时清空缓存

---

## 测试建议

### 1. 功能测试
- ✅ 离线缓存量表
- ✅ 离线答题保存
- ✅ 网络恢复自动同步
- ✅ 离线队列持久化
- ✅ LRU淘汰机制
- ✅ 过期数据清理

### 2. 性能测试
- 大量数据缓存性能
- 同步队列处理速度
- 内存占用监控

### 3. 兼容性测试
- H5平台IndexedDB
- 小程序平台localStorage
- 不同网络环境测试

---

## 常见问题

### Q1: 为什么我的数据没有同步？
**A**: 检查以下几点：
1. 确认网络已恢复
2. 检查自动同步开关是否开启
3. 查看离线队列是否有待同步项
4. 手动点击"立即同步"按钮

### Q2: 缓存占用空间太大怎么办？
**A**: 
1. 进入离线管理页面查看缓存统计
2. 点击"清空所有缓存"释放空间
3. 系统会自动进行LRU淘汰
4. 可以调整各类数据的容量上限

### Q3: 离线模式下能使用哪些功能？
**A**: 
- ✅ 查看已缓存的量表
- ✅ 完成评估答题
- ✅ 查看历史结果
- ✅ 查看本地聊天记录
- ❌ AI对话（需要网络）
- ❌ 社区互动（需要网络）

### Q4: 数据会丢失吗？
**A**: 
- 离线数据保存在本地存储中，不会丢失
- 网络恢复后会自动上传到云端
- 建议定期在有网络时同步数据

---

## 未来计划

### 短期（1-2周）
- [ ] 优化同步算法，支持增量同步
- [ ] 添加数据压缩功能
- [ ] 实现 Service Worker（H5端）

### 中期（1-2月）
- [ ] 支持更多数据类型离线缓存
- [ ] 实现冲突处理机制
- [ ] 优化弱网环境下的用户体验

### 长期（3月+）
- [ ] 实现完全离线应用模式
- [ ] P2P数据同步
- [ ] 离线数据分析

---

## 技术支持

如有问题或建议，请联系开发团队。

**文档版本**: 1.0.0  
**更新日期**: 2025-10-21

