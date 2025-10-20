# API文档：cdk-batchCreate - 批量创建兑换码

## 基本信息

| 项目 | 内容 |
|------|------|
| **API名称** | 批量创建兑换码 |
| **云函数名** | `cdk-batchCreate` |
| **请求方式** | POST |
| **认证方式** | Bearer Token（必须，管理员权限） |
| **版本** | v1.0.0 |
| **创建日期** | 2025-10-21 |
| **维护人** | 后端开发团队 |

---

## 功能描述

批量生成CDK兑换码，支持自定义类型、数量、有效期等参数，用于运营活动和用户奖励发放。

### 主要特性
- 🎯 批量生成：一次创建多个兑换码
- 🔧 灵活配置：支持多种类型和参数
- 📦 批次管理：按批次组织兑换码
- ⏰ 有效期设置：自定义过期时间
- 📊 导出功能：生成Excel/CSV文件
- 🔒 权限控制：仅管理员可操作

---

## 请求参数

### Headers

```javascript
{
  "Authorization": "Bearer <admin_token>",  // 管理员Token（必须）
  "Content-Type": "application/json"
}
```

### Body参数

```typescript
interface BatchCreateRequest {
  // 兑换码类型（必填）
  type_code: string;  // 如：'vip_week', 'credits_100'
  
  // 生成数量（必填）
  count: number;  // 1-10000
  
  // 批次标识（选填）
  batch_id?: string;  // 默认自动生成
  
  // 过期时间（选填）
  expires_at?: string;  // ISO 8601格式，不填则永久有效
  
  // 最大兑换次数（选填）
  max_redeem_count?: number;  // 默认1次
  
  // 兑换码前缀（选填）
  prefix?: string;  // 如：'VIP2025-'
  
  // 兑换码长度（选填）
  code_length?: number;  // 默认16位（不含前缀）
  
  // 备注说明（选填）
  remark?: string;
}
```

### 参数说明

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| type_code | string | 是 | - | CDK类型代码 |
| count | number | 是 | - | 生成数量，范围1-10000 |
| batch_id | string | 否 | 自动生成 | 批次ID，格式：BATCH_YYYYMMDD_HHMMSS |
| expires_at | string | 否 | null | 过期时间（ISO 8601） |
| max_redeem_count | number | 否 | 1 | 每个码最多可兑换次数 |
| prefix | string | 否 | '' | 兑换码前缀，最多8个字符 |
| code_length | number | 否 | 16 | 随机部分长度，范围8-32 |
| remark | string | 否 | '' | 批次备注说明 |

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "message": "批量创建成功",
  "data": {
    "batch_id": "BATCH_20251021_143000",
    "type_code": "vip_week",
    "type_name": "VIP周卡",
    "total_count": 100,
    "created_count": 100,
    "failed_count": 0,
    "codes": [
      {
        "code": "VIP2025-A1B2C3D4E5F6G7H8",
        "type_code": "vip_week",
        "status": "unused",
        "expires_at": "2025-12-31T23:59:59Z",
        "created_at": "2025-10-21T14:30:00Z"
      }
      // ... 更多兑换码
    ],
    "download_url": "https://cdn.example.com/cdk/batch_xxx.xlsx",
    "created_at": "2025-10-21T14:30:00Z"
  }
}
```

### 错误响应

```json
{
  "code": 400,
  "message": "请求参数错误：count必须在1-10000之间",
  "error": "INVALID_PARAMS"
}
```

```json
{
  "code": 403,
  "message": "权限不足，需要管理员权限",
  "error": "FORBIDDEN"
}
```

```json
{
  "code": 404,
  "message": "CDK类型不存在",
  "error": "TYPE_NOT_FOUND"
}
```

```json
{
  "code": 500,
  "message": "批量创建失败",
  "error": "CREATE_FAILED",
  "details": {
    "created_count": 85,
    "failed_count": 15,
    "error_message": "部分兑换码创建失败"
  }
}
```

---

## 状态码说明

| HTTP状态码 | code | 说明 |
|-----------|------|------|
| 200 | 0 | 创建成功 |
| 400 | 400 | 请求参数错误 |
| 401 | 401 | 未授权（Token无效） |
| 403 | 403 | 权限不足（非管理员） |
| 404 | 404 | CDK类型不存在 |
| 429 | 429 | 请求过于频繁 |
| 500 | 500 | 服务器内部错误 |

---

## 使用示例

### 示例1：创建100个VIP周卡兑换码

```javascript
const createVIPCodes = async () => {
  try {
    const result = await uniCloud.callFunction({
      name: 'cdk-batchCreate',
      data: {
        type_code: 'vip_week',
        count: 100,
        prefix: 'VIP2025-',
        expires_at: '2025-12-31T23:59:59Z',
        remark: '双十一活动兑换码'
      }
    });
    
    if (result.result.code === 0) {
      const data = result.result.data;
      console.log(`成功创建 ${data.created_count} 个兑换码`);
      console.log('批次ID:', data.batch_id);
      console.log('下载地址:', data.download_url);
      
      // 显示部分兑换码
      data.codes.slice(0, 5).forEach((item, index) => {
        console.log(`${index + 1}. ${item.code}`);
      });
    }
  } catch (error) {
    console.error('创建失败:', error);
  }
};
```

### 示例2：创建积分兑换码（多次使用）

```javascript
const createCreditsCodes = async () => {
  try {
    const result = await uniCloud.callFunction({
      name: 'cdk-batchCreate',
      data: {
        type_code: 'credits_100',
        count: 50,
        max_redeem_count: 10,  // 每个码可使用10次
        prefix: 'CREDIT-',
        code_length: 12,
        remark: '社区活动奖励'
      }
    });
    
    if (result.result.code === 0) {
      uni.showToast({
        title: '创建成功',
        icon: 'success'
      });
    }
  } catch (error) {
    console.error('创建失败:', error);
  }
};
```

### 示例3：管理后台批量创建页面

```vue
<template>
  <view class="batch-create-page">
    <u-form :model="form" ref="uForm">
      <u-form-item label="兑换码类型" required>
        <u-picker
          v-model="form.type_code"
          :columns="cdkTypes"
          @confirm="handleTypeSelect"
        />
      </u-form-item>
      
      <u-form-item label="生成数量" required>
        <u-input
          v-model="form.count"
          type="number"
          placeholder="请输入1-10000"
        />
      </u-form-item>
      
      <u-form-item label="兑换码前缀">
        <u-input
          v-model="form.prefix"
          placeholder="如：VIP2025-"
          maxlength="8"
        />
      </u-form-item>
      
      <u-form-item label="过期时间">
        <u-datetime-picker
          v-model="form.expires_at"
          mode="datetime"
        />
      </u-form-item>
      
      <u-form-item label="最大兑换次数">
        <u-input
          v-model="form.max_redeem_count"
          type="number"
          placeholder="默认1次"
        />
      </u-form-item>
      
      <u-form-item label="批次备注">
        <u-textarea
          v-model="form.remark"
          placeholder="请输入批次说明"
        />
      </u-form-item>
    </u-form>
    
    <view class="button-group">
      <u-button
        type="primary"
        :loading="loading"
        @click="handleCreate"
      >
        批量创建
      </u-button>
      
      <u-button
        v-if="result"
        type="success"
        plain
        @click="handleDownload"
      >
        下载兑换码
      </u-button>
    </view>
    
    <!-- 创建结果 -->
    <view v-if="result" class="result-card">
      <view class="result-item">
        <text class="label">批次ID：</text>
        <text>{{ result.batch_id }}</text>
      </view>
      <view class="result-item">
        <text class="label">成功创建：</text>
        <text class="success">{{ result.created_count }}</text>
      </view>
      <view class="result-item">
        <text class="label">创建失败：</text>
        <text class="error">{{ result.failed_count }}</text>
      </view>
      
      <!-- 显示前10个兑换码 -->
      <view class="code-preview">
        <text class="preview-title">前10个兑换码预览：</text>
        <view
          v-for="(item, index) in result.codes.slice(0, 10)"
          :key="index"
          class="code-item"
        >
          <text class="code-text">{{ item.code }}</text>
          <u-icon
            name="copy"
            @click="copyCode(item.code)"
          />
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      form: {
        type_code: '',
        count: 100,
        prefix: '',
        expires_at: null,
        max_redeem_count: 1,
        remark: ''
      },
      cdkTypes: [
        { label: 'VIP周卡', value: 'vip_week' },
        { label: 'VIP月卡', value: 'vip_month' },
        { label: '积分100', value: 'credits_100' },
        { label: '积分500', value: 'credits_500' }
      ],
      loading: false,
      result: null
    };
  },
  
  methods: {
    // 创建兑换码
    async handleCreate() {
      // 验证表单
      if (!this.form.type_code) {
        uni.showToast({
          title: '请选择兑换码类型',
          icon: 'none'
        });
        return;
      }
      
      if (!this.form.count || this.form.count < 1 || this.form.count > 10000) {
        uni.showToast({
          title: '数量必须在1-10000之间',
          icon: 'none'
        });
        return;
      }
      
      this.loading = true;
      this.result = null;
      
      try {
        const result = await uniCloud.callFunction({
          name: 'cdk-batchCreate',
          data: {
            ...this.form,
            count: parseInt(this.form.count),
            max_redeem_count: parseInt(this.form.max_redeem_count) || 1
          }
        });
        
        if (result.result.code === 0) {
          this.result = result.result.data;
          
          uni.showToast({
            title: '创建成功',
            icon: 'success'
          });
        } else {
          uni.showToast({
            title: result.result.message || '创建失败',
            icon: 'none'
          });
        }
      } catch (error) {
        console.error('创建失败:', error);
        uni.showToast({
          title: '网络错误，请稍后重试',
          icon: 'none'
        });
      } finally {
        this.loading = false;
      }
    },
    
    // 下载兑换码
    handleDownload() {
      if (this.result && this.result.download_url) {
        // #ifdef H5
        window.open(this.result.download_url, '_blank');
        // #endif
        
        // #ifdef MP-WEIXIN
        uni.downloadFile({
          url: this.result.download_url,
          success: (res) => {
            const filePath = res.tempFilePath;
            uni.openDocument({
              filePath: filePath,
              fileType: 'xlsx'
            });
          }
        });
        // #endif
      }
    },
    
    // 复制兑换码
    copyCode(code) {
      uni.setClipboardData({
        data: code,
        success: () => {
          uni.showToast({
            title: '已复制',
            icon: 'success'
          });
        }
      });
    }
  }
};
</script>
```

---

## 兑换码生成算法

### 生成规则

```javascript
/**
 * 生成兑换码
 * @param {string} prefix - 前缀
 * @param {number} length - 长度
 * @returns {string} 兑换码
 */
function generateCode(prefix = '', length = 16) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 去除易混淆字符
  let code = prefix;
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
    
    // 每4位添加连字符
    if ((i + 1) % 4 === 0 && i < length - 1) {
      code += '-';
    }
  }
  
  return code.toUpperCase();
}

/**
 * 批量生成兑换码（确保唯一性）
 * @param {number} count - 数量
 * @param {object} options - 配置选项
 * @returns {Array} 兑换码数组
 */
async function batchGenerateCodes(count, options = {}) {
  const {
    prefix = '',
    length = 16,
    maxRetries = 10
  } = options;
  
  const codes = new Set();
  const result = [];
  
  let retries = 0;
  while (codes.size < count && retries < maxRetries * count) {
    const code = generateCode(prefix, length);
    
    // 检查是否已存在
    const exists = await checkCodeExists(code);
    
    if (!exists && !codes.has(code)) {
      codes.add(code);
      result.push({
        code,
        type_code: options.type_code,
        status: 'unused',
        max_redeem_count: options.max_redeem_count || 1,
        current_redeem_count: 0,
        expires_at: options.expires_at || null,
        batch_id: options.batch_id,
        created_at: new Date().toISOString()
      });
    }
    
    retries++;
  }
  
  if (codes.size < count) {
    throw new Error(`仅成功生成 ${codes.size} 个唯一兑换码，目标 ${count} 个`);
  }
  
  return result;
}
```

---

## 数据库操作

### 批量插入

```javascript
// 批量插入兑换码（分批插入，避免超时）
async function batchInsertCodes(codes) {
  const batchSize = 100;
  const batches = [];
  
  for (let i = 0; i < codes.length; i += batchSize) {
    batches.push(codes.slice(i, i + batchSize));
  }
  
  let totalInserted = 0;
  let totalFailed = 0;
  
  for (const batch of batches) {
    try {
      const result = await db.collection('cdk_codes')
        .add(batch);
      
      totalInserted += result.inserted;
    } catch (error) {
      console.error('批次插入失败:', error);
      totalFailed += batch.length;
    }
  }
  
  return {
    created_count: totalInserted,
    failed_count: totalFailed
  };
}
```

### SQL批量插入

```sql
-- PostgreSQL批量插入
INSERT INTO cdk_codes (
  code,
  type_code,
  batch_id,
  status,
  max_redeem_count,
  current_redeem_count,
  expires_at,
  created_by,
  created_at,
  updated_at
)
SELECT
  unnest($1::varchar[]),  -- codes数组
  $2,  -- type_code
  $3,  -- batch_id
  'unused',
  $4,  -- max_redeem_count
  0,
  $5,  -- expires_at
  $6,  -- created_by (admin_user_id)
  now(),
  now()
ON CONFLICT (code) DO NOTHING;
```

---

## 导出功能

### Excel导出

```javascript
// 生成Excel文件
const ExcelJS = require('exceljs');

async function exportToExcel(codes, batchInfo) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('兑换码列表');
  
  // 设置列
  worksheet.columns = [
    { header: '序号', key: 'index', width: 8 },
    { header: '兑换码', key: 'code', width: 25 },
    { header: '类型', key: 'type_name', width: 15 },
    { header: '状态', key: 'status', width: 10 },
    { header: '过期时间', key: 'expires_at', width: 20 },
    { header: '创建时间', key: 'created_at', width: 20 }
  ];
  
  // 添加数据
  codes.forEach((item, index) => {
    worksheet.addRow({
      index: index + 1,
      code: item.code,
      type_name: batchInfo.type_name,
      status: item.status,
      expires_at: item.expires_at || '永久',
      created_at: item.created_at
    });
  });
  
  // 样式设置
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };
  
  // 保存文件
  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `cdk_${batchInfo.batch_id}.xlsx`;
  
  // 上传到CDN
  const url = await uploadToCDN(buffer, filename);
  
  return url;
}
```

---

## 性能优化

### 1. 异步处理

```javascript
// 大批量创建使用异步任务
if (count > 1000) {
  // 创建异步任务
  const taskId = await createAsyncTask({
    type: 'batch_create_cdk',
    params: {
      type_code,
      count,
      ...options
    }
  });
  
  return {
    code: 202,
    message: '任务已创建，请稍后查看结果',
    data: {
      task_id: taskId,
      status: 'processing'
    }
  };
}
```

### 2. 并发控制

```javascript
// 使用p-limit控制并发
const pLimit = require('p-limit');
const limit = pLimit(10); // 最多10个并发

const tasks = batches.map(batch => 
  limit(() => insertBatch(batch))
);

const results = await Promise.all(tasks);
```

---

## 安全性

### 1. 权限验证

```javascript
// 验证管理员权限
async function checkAdminPermission(token) {
  const payload = await verifyToken(token);
  
  if (!payload || !payload.user_id) {
    throw new Error('UNAUTHORIZED');
  }
  
  const user = await db.collection('users')
    .doc(payload.user_id)
    .get();
  
  if (!user || user.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  
  return payload.user_id;
}
```

### 2. 操作日志

```javascript
// 记录批量创建操作
await db.collection('admin_operation_logs').add({
  admin_user_id: adminUserId,
  operation_type: 'batch_create_cdk',
  operation_params: {
    type_code,
    count,
    batch_id
  },
  result: {
    created_count,
    failed_count
  },
  ip: clientIP,
  created_at: new Date()
});
```

---

## 监控指标

### 关键指标

| 指标 | 说明 | 目标值 |
|------|------|--------|
| 创建成功率 | 成功/总数 | > 99% |
| 平均创建时间 | 1000个码的耗时 | < 5秒 |
| 唯一性冲突率 | 重复码比例 | < 0.1% |

---

## 测试用例

```javascript
describe('cdk-batchCreate API', () => {
  test('应该成功批量创建兑换码', async () => {
    const result = await callFunction('cdk-batchCreate', {
      type_code: 'vip_week',
      count: 10
    }, {
      headers: {
        Authorization: 'Bearer admin_token'
      }
    });
    
    expect(result.code).toBe(0);
    expect(result.data.created_count).toBe(10);
    expect(result.data.codes).toHaveLength(10);
  });
  
  test('应该拒绝非管理员访问', async () => {
    const result = await callFunction('cdk-batchCreate', {
      type_code: 'vip_week',
      count: 10
    }, {
      headers: {
        Authorization: 'Bearer user_token'
      }
    });
    
    expect(result.code).toBe(403);
    expect(result.error).toBe('FORBIDDEN');
  });
  
  test('应该验证参数范围', async () => {
    const result = await callFunction('cdk-batchCreate', {
      type_code: 'vip_week',
      count: 20000  // 超过限制
    }, {
      headers: {
        Authorization: 'Bearer admin_token'
      }
    });
    
    expect(result.code).toBe(400);
  });
});
```

---

## 更新日志

| 版本 | 日期 | 变更内容 | 负责人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-21 | 初始版本，支持批量创建和导出 | 开发团队 |

---

## 相关文档

- [cdk-redeem API文档](./cdk-redeem.md)
- [cdk-verify API文档](./cdk-verify.md)
- [数据库设计文档](../database/schema-cdk-music.md)

---

**维护说明**:
- 定期清理测试批次
- 监控创建成功率
- 优化生成算法性能

