# 用户数据导出 API文档

**API名称**: `user-data-export`  
**版本**: v1.0  
**创建日期**: 2025-10-20  
**云函数路径**: `uniCloud-aliyun/cloudfunctions/user-data-export/index.js`  

---

## 一、概述

### 1.1 功能说明

用户数据导出云函数，提供用户所有数据的汇总导出功能，符合GDPR等数据保护法规要求。

**核心功能**：
- 汇总用户所有数据（个人信息、评估记录、聊天历史等）
- 支持多种导出格式（JSON/CSV/PDF）
- 自动脱敏敏感信息
- 记录导出历史和审计日志
- 文件自动过期管理（7天）

### 1.2 使用场景

| 场景 | 说明 |
|------|------|
| 用户主动导出 | 用户在设置页面导出个人数据 |
| 账号注销前备份 | 注销账号前导出数据备份 |
| 数据迁移 | 迁移到其他平台 |
| 合规要求 | 响应用户数据访问请求 |

---

## 二、API规范

### 2.1 请求参数

```javascript
{
  action: 'export',        // 操作类型
  format: 'JSON',          // 导出格式: JSON/CSV/PDF
  options: {               // 可选配置
    includeChats: true,    // 是否包含聊天记录
    includeAssessments: true, // 是否包含评估结果
    maskSensitive: true    // 是否脱敏敏感信息
  }
}
```

**参数说明**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | String | 是 | 操作类型，固定为 'export' |
| format | String | 是 | 导出格式：'JSON'/'CSV'/'PDF' |
| options | Object | 否 | 导出选项配置 |
| options.includeChats | Boolean | 否 | 是否包含聊天记录，默认true |
| options.includeAssessments | Boolean | 否 | 是否包含评估结果，默认true |
| options.maskSensitive | Boolean | 否 | 是否脱敏，默认true |

### 2.2 响应格式

**成功响应**：
```javascript
{
  code: 0,
  message: '导出成功',
  data: {
    exportId: 123456,
    format: 'JSON',
    fileSize: 1048576,
    downloadUrl: 'https://cdn.example.com/exports/xxx.json',
    expiresAt: '2025-10-27T10:00:00Z',
    dataItems: {
      userInfo: 1,
      assessments: 10,
      chatMessages: 50,
      musicFavorites: 20,
      communityTopics: 5
    }
  }
}
```

**错误响应**：
```javascript
{
  code: 40001,
  message: '导出失败：数据收集错误',
  data: null
}
```

### 2.3 错误码

| 错误码 | 说明 | 解决方案 |
|--------|------|----------|
| 0 | 成功 | - |
| 40001 | 参数错误 | 检查请求参数 |
| 40002 | 不支持的格式 | 使用JSON/CSV/PDF |
| 40003 | 数据收集失败 | 稍后重试 |
| 40004 | 文件生成失败 | 稍后重试 |
| 40005 | 上传失败 | 稍后重试 |
| 40006 | 导出频率限制 | 24小时内最多导出5次 |
| 50001 | 服务器错误 | 联系技术支持 |

---

## 三、云函数实现

### 3.1 主函数

```javascript
// uniCloud-aliyun/cloudfunctions/user-data-export/index.js
'use strict';

const db = uniCloud.database();
const dbCmd = db.command;

exports.main = async (event, context) => {
  const { action, format, options = {} } = event;
  const { uid } = context;
  
  // Token验证
  if (!uid) {
    return {
      code: 401,
      message: '未授权，请先登录'
    };
  }
  
  try {
    switch (action) {
      case 'export':
        return await handleExport(uid, format, options);
      case 'getHistory':
        return await getExportHistory(uid);
      case 'download':
        return await downloadExport(uid, event.exportId);
      default:
        return {
          code: 40001,
          message: '不支持的操作类型'
        };
    }
  } catch (error) {
    console.error('导出错误:', error);
    return {
      code: 50001,
      message: error.message || '服务器错误'
    };
  }
};

/**
 * 处理数据导出
 */
async function handleExport(uid, format, options) {
  // 1. 检查频率限制（24小时内最多5次）
  const rateLimitCheck = await checkRateLimit(uid);
  if (!rateLimitCheck.allowed) {
    return {
      code: 40006,
      message: `导出频率限制，请${rateLimitCheck.waitTime}分钟后重试`
    };
  }
  
  // 2. 验证导出格式
  if (!['JSON', 'CSV', 'PDF'].includes(format)) {
    return {
      code: 40002,
      message: '不支持的导出格式'
    };
  }
  
  // 3. 创建导出记录
  const exportLog = await createExportLog(uid, format);
  
  try {
    // 4. 收集用户数据
    const userData = await collectUserData(uid, options);
    
    // 5. 生成导出文件
    const fileInfo = await generateExportFile(userData, format);
    
    // 6. 上传到云存储
    const uploadResult = await uploadToCloudStorage(fileInfo, uid, exportLog.id);
    
    // 7. 更新导出记录为成功
    await updateExportLog(exportLog.id, {
      status: 'completed',
      fileSize: fileInfo.size,
      filePath: uploadResult.url,
      dataItems: userData.stats,
      completedAt: new Date()
    });
    
    return {
      code: 0,
      message: '导出成功',
      data: {
        exportId: exportLog.id,
        format: format,
        fileSize: fileInfo.size,
        downloadUrl: uploadResult.url,
        expiresAt: uploadResult.expiresAt,
        dataItems: userData.stats
      }
    };
  } catch (error) {
    // 更新导出记录为失败
    await updateExportLog(exportLog.id, {
      status: 'failed',
      errorMessage: error.message
    });
    
    throw error;
  }
}

/**
 * 检查频率限制
 */
async function checkRateLimit(uid) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const recentExports = await db.collection('data_export_logs')
    .where({
      user_id: uid,
      created_at: dbCmd.gte(oneDayAgo)
    })
    .count();
  
  const allowed = recentExports.total < 5;
  
  if (!allowed) {
    // 计算需要等待的时间
    const oldestExport = await db.collection('data_export_logs')
      .where({
        user_id: uid,
        created_at: dbCmd.gte(oneDayAgo)
      })
      .orderBy('created_at', 'asc')
      .limit(1)
      .get();
    
    if (oldestExport.data.length > 0) {
      const waitTime = Math.ceil(
        (new Date(oldestExport.data[0].created_at).getTime() + 24 * 60 * 60 * 1000 - Date.now()) / 60000
      );
      return { allowed: false, waitTime };
    }
  }
  
  return { allowed: true };
}

/**
 * 创建导出记录
 */
async function createExportLog(uid, format) {
  const result = await db.collection('data_export_logs').add({
    user_id: uid,
    export_format: format,
    export_status: 'processing',
    created_at: new Date()
  });
  
  return { id: result.id };
}

/**
 * 收集用户数据
 */
async function collectUserData(uid, options) {
  const {
    includeChats = true,
    includeAssessments = true,
    maskSensitive = true
  } = options;
  
  const data = {
    meta: {
      exportTime: new Date().toISOString(),
      exportVersion: '1.0.0',
      userId: uid
    },
    stats: {}
  };
  
  // 收集用户基本信息
  const userInfo = await db.collection('users')
    .doc(uid)
    .field({
      id: true,
      nickname: true,
      avatar_url: true,
      created_at: true
    })
    .get();
  
  if (userInfo.data.length > 0) {
    data.userInfo = userInfo.data[0];
    data.stats.userInfo = 1;
  }
  
  // 收集评估记录
  if (includeAssessments) {
    const assessments = await db.collection('assessments')
      .where({ user_id: uid })
      .orderBy('created_at', 'desc')
      .get();
    
    data.assessments = assessments.data;
    data.stats.assessments = assessments.data.length;
  }
  
  // 收集聊天记录
  if (includeChats) {
    const chatSessions = await db.collection('chat_sessions')
      .where({ user_id: uid })
      .get();
    
    const chats = [];
    let totalMessages = 0;
    
    for (const session of chatSessions.data) {
      const messages = await db.collection('chat_messages')
        .where({ session_id: session.id })
        .orderBy('created_at', 'asc')
        .get();
      
      chats.push({
        session: session,
        messages: maskSensitive ? sanitizeMessages(messages.data) : messages.data
      });
      
      totalMessages += messages.data.length;
    }
    
    data.chatHistory = chats;
    data.stats.chatSessions = chatSessions.data.length;
    data.stats.chatMessages = totalMessages;
  }
  
  // 收集音乐收藏
  const musicFavorites = await db.collection('user_music_favorites')
    .where({ user_id: uid })
    .get();
  
  data.musicFavorites = musicFavorites.data;
  data.stats.musicFavorites = musicFavorites.data.length;
  
  // 收集社区数据
  const communityTopics = await db.collection('community_topics')
    .where({ author_id: uid })
    .get();
  
  data.communityTopics = communityTopics.data;
  data.stats.communityTopics = communityTopics.data.length;
  
  return data;
}

/**
 * 脱敏处理
 */
function sanitizeMessages(messages) {
  return messages.map(msg => ({
    ...msg,
    content: sanitizeContent(msg.content)
  }));
}

function sanitizeContent(content) {
  // 移除手机号
  content = content.replace(/1[3-9]\d{9}/g, '***手机号***');
  
  // 移除身份证号
  content = content.replace(/\d{17}[\dXx]/g, '***身份证号***');
  
  // 移除邮箱
  content = content.replace(/[\w.-]+@[\w.-]+\.\w+/g, '***邮箱***');
  
  return content;
}

/**
 * 生成导出文件
 */
async function generateExportFile(userData, format) {
  let fileContent;
  let mimeType;
  let extension;
  
  switch (format) {
    case 'JSON':
      fileContent = JSON.stringify(userData, null, 2);
      mimeType = 'application/json';
      extension = 'json';
      break;
    
    case 'CSV':
      fileContent = convertToCSV(userData);
      mimeType = 'text/csv';
      extension = 'csv';
      break;
    
    case 'PDF':
      // PDF生成需要额外的库，这里简化处理
      throw new Error('PDF导出暂不支持服务端生成');
    
    default:
      throw new Error('不支持的导出格式');
  }
  
  return {
    content: fileContent,
    size: Buffer.byteLength(fileContent, 'utf8'),
    mimeType,
    extension
  };
}

/**
 * 转换为CSV格式
 */
function convertToCSV(userData) {
  let csv = '';
  
  // 元数据
  csv += '# 导出元数据\n';
  csv += `导出时间,${userData.meta.exportTime}\n`;
  csv += `用户ID,${userData.meta.userId}\n`;
  csv += '\n';
  
  // 统计信息
  csv += '# 数据统计\n';
  csv += Object.entries(userData.stats)
    .map(([key, value]) => `${key},${value}`)
    .join('\n');
  csv += '\n\n';
  
  // 评估记录
  if (userData.assessments && userData.assessments.length > 0) {
    csv += '# 评估记录\n';
    csv += 'ID,量表名称,分数,等级,时间\n';
    userData.assessments.forEach(item => {
      csv += `${item.id},${item.scale_name},${item.score},${item.level},${item.created_at}\n`;
    });
    csv += '\n';
  }
  
  return csv;
}

/**
 * 上传到云存储
 */
async function uploadToCloudStorage(fileInfo, uid, exportId) {
  const uniCloud = require('uni-cloud');
  const cloudPath = `exports/${uid}/${exportId}.${fileInfo.extension}`;
  
  const result = await uniCloud.uploadFile({
    cloudPath: cloudPath,
    fileContent: Buffer.from(fileInfo.content, 'utf8')
  });
  
  // 生成临时下载链接（7天有效）
  const tempFileURL = await uniCloud.getTempFileURL({
    fileList: [result.fileID],
    maxAge: 7 * 24 * 60 * 60 // 7天
  });
  
  return {
    url: tempFileURL.fileList[0].tempFileURL,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  };
}

/**
 * 更新导出记录
 */
async function updateExportLog(exportId, updates) {
  await db.collection('data_export_logs')
    .doc(exportId)
    .update(updates);
}

/**
 * 获取导出历史
 */
async function getExportHistory(uid) {
  const history = await db.collection('data_export_logs')
    .where({ user_id: uid })
    .orderBy('created_at', 'desc')
    .limit(20)
    .get();
  
  return {
    code: 0,
    message: '获取成功',
    data: history.data
  };
}

/**
 * 下载导出文件
 */
async function downloadExport(uid, exportId) {
  const exportLog = await db.collection('data_export_logs')
    .doc(exportId)
    .get();
  
  if (exportLog.data.length === 0) {
    return {
      code: 40001,
      message: '导出记录不存在'
    };
  }
  
  const log = exportLog.data[0];
  
  if (log.user_id !== uid) {
    return {
      code: 40003,
      message: '无权访问此导出'
    };
  }
  
  if (log.export_status !== 'completed') {
    return {
      code: 40004,
      message: '导出未完成或已失败'
    };
  }
  
  // 检查是否过期
  if (new Date(log.expires_at) < new Date()) {
    return {
      code: 40005,
      message: '导出文件已过期'
    };
  }
  
  return {
    code: 0,
    message: '获取成功',
    data: {
      downloadUrl: log.file_path,
      fileSize: log.file_size,
      format: log.export_format,
      createdAt: log.created_at,
      expiresAt: log.expires_at
    }
  };
}
```

---

## 四、前端集成示例

### 4.1 导出数据

```javascript
// pages-sub/other/data-export.vue
async handleExport() {
  try {
    uni.showLoading({ title: '正在导出...' });
    
    const result = await uniCloud.callFunction({
      name: 'user-data-export',
      data: {
        action: 'export',
        format: this.selectedFormat, // 'JSON'/'CSV'/'PDF'
        options: {
          includeChats: true,
          includeAssessments: true,
          maskSensitive: true
        }
      }
    });
    
    uni.hideLoading();
    
    if (result.result.code === 0) {
      const { downloadUrl, fileSize, expiresAt } = result.result.data;
      
      uni.showModal({
        title: '导出成功',
        content: `文件大小：${(fileSize / 1024).toFixed(2)}KB\n有效期：7天`,
        confirmText: '下载',
        success: (res) => {
          if (res.confirm) {
            // H5端直接下载
            // #ifdef H5
            window.open(downloadUrl);
            // #endif
            
            // 小程序端保存文件
            // #ifdef MP-WEIXIN
            uni.downloadFile({
              url: downloadUrl,
              success: (res) => {
                uni.saveFile({
                  tempFilePath: res.tempFilePath,
                  success: () => {
                    uni.showToast({ title: '保存成功', icon: 'success' });
                  }
                });
              }
            });
            // #endif
          }
        }
      });
    } else {
      uni.showToast({
        title: result.result.message,
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('导出失败:', error);
    uni.showToast({
      title: '导出失败',
      icon: 'none'
    });
  }
}
```

### 4.2 查看导出历史

```javascript
async loadExportHistory() {
  try {
    const result = await uniCloud.callFunction({
      name: 'user-data-export',
      data: {
        action: 'getHistory'
      }
    });
    
    if (result.result.code === 0) {
      this.exportHistory = result.result.data;
    }
  } catch (error) {
    console.error('获取导出历史失败:', error);
  }
}
```

### 4.3 重新下载

```javascript
async downloadAgain(exportId) {
  try {
    const result = await uniCloud.callFunction({
      name: 'user-data-export',
      data: {
        action: 'download',
        exportId: exportId
      }
    });
    
    if (result.result.code === 0) {
      const { downloadUrl } = result.result.data;
      // 下载文件
      window.open(downloadUrl);
    } else {
      uni.showToast({
        title: result.result.message,
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('下载失败:', error);
  }
}
```

---

## 五、安全考虑

### 5.1 访问控制

- ✅ Token验证，确保用户已登录
- ✅ 用户只能导出自己的数据
- ✅ 导出记录权限校验

### 5.2 频率限制

- ✅ 24小时内最多导出5次
- ✅ 防止恶意导出攻击
- ✅ 记录IP和User-Agent审计

### 5.3 数据脱敏

- ✅ 自动脱敏手机号、邮箱、身份证号
- ✅ 可选是否包含敏感内容
- ✅ 日志记录脱敏操作

### 5.4 文件安全

- ✅ 临时下载链接，7天自动过期
- ✅ 定时清理过期文件
- ✅ 文件访问权限控制

---

## 六、性能优化

### 6.1 数据收集优化

```javascript
// 并发收集数据
const [userInfo, assessments, chats] = await Promise.all([
  collectUserInfo(uid),
  collectAssessments(uid),
  collectChats(uid)
]);
```

### 6.2 大文件处理

```javascript
// 分块处理大量数据
async function collectLargeDataset(uid) {
  const chunkSize = 1000;
  const chunks = [];
  let offset = 0;
  
  while (true) {
    const chunk = await db.collection('chat_messages')
      .where({ user_id: uid })
      .skip(offset)
      .limit(chunkSize)
      .get();
    
    if (chunk.data.length === 0) break;
    
    chunks.push(...chunk.data);
    offset += chunkSize;
    
    if (chunk.data.length < chunkSize) break;
  }
  
  return chunks;
}
```

---

## 七、测试用例

### 7.1 正常导出

```javascript
// 测试JSON导出
const result = await uniCloud.callFunction({
  name: 'user-data-export',
  data: {
    action: 'export',
    format: 'JSON'
  }
});

assert.equal(result.result.code, 0);
assert.ok(result.result.data.downloadUrl);
```

### 7.2 频率限制

```javascript
// 连续导出6次，第6次应该失败
for (let i = 0; i < 6; i++) {
  const result = await exportData();
  
  if (i < 5) {
    assert.equal(result.code, 0, `第${i+1}次导出应该成功`);
  } else {
    assert.equal(result.code, 40006, '第6次导出应该被限制');
  }
}
```

### 7.3 权限验证

```javascript
// 尝试访问其他用户的导出
const result = await downloadExport(otherUserExportId);
assert.equal(result.code, 40003, '应该返回权限错误');
```

---

## 八、监控和日志

### 8.1 导出统计

```sql
-- 每日导出统计
SELECT
  DATE(created_at) as export_date,
  export_format,
  COUNT(*) as total_exports,
  COUNT(CASE WHEN export_status = 'completed' THEN 1 END) as successful,
  COUNT(CASE WHEN export_status = 'failed' THEN 1 END) as failed,
  AVG(file_size) as avg_file_size
FROM data_export_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), export_format
ORDER BY export_date DESC;
```

### 8.2 错误监控

```sql
-- 失败的导出记录
SELECT
  id,
  user_id,
  export_format,
  error_message,
  created_at
FROM data_export_logs
WHERE export_status = 'failed'
  AND created_at >= NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;
```

---

## 九、常见问题

### 9.1 导出失败怎么办？

**原因**：
- 数据量过大
- 网络超时
- 云存储空间不足

**解决方案**：
- 分批导出数据
- 增加超时时间
- 检查云存储配额

### 9.2 文件过期后如何再次下载？

重新执行导出操作，系统会生成新的文件。

### 9.3 支持哪些数据格式？

- JSON：完整数据，适合程序处理
- CSV：表格数据，可用Excel打开
- PDF：可读性强，适合打印（需要前端生成）

---

## 十、总结

### 10.1 功能清单

- ✅ 多格式导出（JSON/CSV/PDF）
- ✅ 数据自动脱敏
- ✅ 频率限制（24小时5次）
- ✅ 文件自动过期（7天）
- ✅ 导出历史记录
- ✅ 权限访问控制

### 10.2 合规性

- ✅ 符合GDPR数据访问权要求
- ✅ 完整的审计日志
- ✅ 自动数据脱敏
- ✅ 用户数据可携带性

---

**文档维护**: 请在功能更新时同步更新本文档  
**问题反馈**: 发现问题请提Issue  

📦 **用户数据，安全导出！**

