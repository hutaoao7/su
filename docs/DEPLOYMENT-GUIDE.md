# 翎心CraneHeart 部署运维指南

## 🚀 部署流程

### 一、数据库部署

#### 1. Supabase配置

**步骤**：
1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 创建新项目
3. 记录项目URL和service_role_key
4. 进入SQL Editor

#### 2. 执行数据库迁移

```bash
# 方式A：使用psql命令行
psql "postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# 依次执行8个迁移脚本
\i docs/database/migrations/001_create_users_tables.sql
\i docs/database/migrations/002_create_assessments_tables.sql
\i docs/database/migrations/003_create_chat_tables.sql
\i docs/database/migrations/004_create_cdk_tables.sql
\i docs/database/migrations/005_create_music_tables.sql
\i docs/database/migrations/006_create_community_tables.sql
\i docs/database/migrations/007_create_consent_tables.sql
\i docs/database/migrations/008_create_events_tables.sql

# 方式B：Supabase Dashboard
# 复制SQL内容到SQL Editor执行
```

#### 3. 验证数据库

```sql
-- 检查表数量（应该是30+个）
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- 检查种子数据
SELECT 'assessment_scales' as table, COUNT(*) FROM assessment_scales
UNION ALL
SELECT 'cdk_types', COUNT(*) FROM cdk_types
UNION ALL
SELECT 'music_categories', COUNT(*) FROM music_categories;
```

---

### 二、云函数部署

#### 1. 配置云函数

**在HBuilderX中**：
1. 右键 `uniCloud-aliyun` 目录
2. 选择"关联云服务空间"
3. 选择您的uniCloud服务空间

#### 2. 配置环境变量

**在uniCloud控制台**：
1. 进入"云函数"
2. 选择"公共模块"或单个云函数
3. 添加环境变量：
   - `SUPABASE_URL`: Supabase项目URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Service Role密钥
   - `OPENAI_API_KEY`: OpenAI API密钥
   - `JWT_SECRET`: JWT签名密钥

#### 3. 上传云函数

**批量上传**：
1. 右键 `cloudfunctions` 目录
2. 选择"上传所有云函数"
3. 等待上传完成

**单个上传**：
1. 右键单个云函数目录
2. 选择"上传部署"
3. 查看日志确认成功

#### 4. 测试云函数

```javascript
// 在云函数控制台测试
{
  "code": "test_code_123"
}

// 或使用HBuilderX的云函数测试功能
```

---

### 三、小程序部署

#### 1. 配置小程序信息

**manifest.json**：
```json
{
  "mp-weixin": {
    "appid": "your-appid",
    "setting": {
      "urlCheck": true
    }
  }
}
```

#### 2. 构建小程序

```bash
# 在HBuilderX中
# 发行 → 小程序-微信

# 或使用命令行
npm run build:mp-weixin
```

#### 3. 上传微信

1. 打开微信开发者工具
2. 导入项目（unpackage/dist/build/mp-weixin）
3. 点击"上传"
4. 填写版本号和备注
5. 提交审核

---

### 四、监控配置

#### 1. 错误监控

**已集成error-report云函数**：
```javascript
// 前端自动上报错误
import errorTracker from '@/utils/error-tracker.js';
errorTracker.init({ report: true });
```

**查看错误日志**：
```sql
-- 最近的错误
SELECT * FROM error_logs 
ORDER BY created_at DESC 
LIMIT 100;

-- 错误统计
SELECT 
  error_type,
  COUNT(*) as count,
  MAX(created_at) as last_occurrence
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY error_type
ORDER BY count DESC;
```

#### 2. 性能监控

**埋点数据查询**：
```sql
-- 页面浏览统计
SELECT 
  page_path,
  COUNT(*) as views
FROM events
WHERE event_name = 'page_view'
AND created_at >= NOW() - INTERVAL '7 days'
GROUP BY page_path
ORDER BY views DESC;

-- 用户活跃度
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as dau
FROM events
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

### 五、运维任务

#### 每日任务
```bash
# 1. 检查错误日志
SELECT COUNT(*) FROM error_logs WHERE created_at >= NOW() - INTERVAL '24 hours';

# 2. 检查系统健康
# 访问 Supabase Dashboard → Database → Health

# 3. 检查云函数日志
# uniCloud控制台 → 云函数 → 日志
```

#### 每周任务
```bash
# 1. 数据库备份
pg_dump > backup_$(date +%Y%m%d).sql

# 2. 性能分析
npm run analyze:performance

# 3. 清理过期数据
DELETE FROM assessments 
WHERE status = 'draft' 
AND created_at < NOW() - INTERVAL '30 days';
```

#### 每月任务
```bash
# 1. 创建下月分区
# 参考 003_create_chat_tables.sql 中的分区创建

# 2. 归档旧数据
# 将6个月前的数据移到归档表

# 3. 优化索引
REINDEX DATABASE postgres;

# 4. 更新统计信息
ANALYZE;
```

---

### 六、回滚方案

#### 小程序回滚
1. 登录微信公众平台
2. 进入"版本管理"
3. 点击"回退版本"
4. 选择要回退的版本
5. 确认回退

#### 云函数回滚
1. 进入uniCloud控制台
2. 选择云函数
3. 点击"版本管理"
4. 回退到指定版本

#### 数据库回滚
```bash
# 使用备份恢复
psql < backup_20251018.sql

# 或使用Supabase的Point-in-Time Recovery
# Dashboard → Database → Backups
```

---

### 七、故障处理

#### 常见问题

**1. 云函数超时**
- 检查数据库查询是否有慢查询
- 优化查询语句，添加索引
- 增加云函数超时时间

**2. 数据库连接失败**
- 检查Supabase服务状态
- 验证连接字符串和密钥
- 检查网络连接

**3. 小程序加载慢**
- 运行 `npm run analyze:bundle` 分析包大小
- 优化图片资源
- 启用分包加载

---

### 八、安全检查清单

- [ ] 环境变量已正确配置
- [ ] 数据库密钥未泄露
- [ ] API接口有Token验证
- [ ] 用户输入有参数校验
- [ ] 敏感数据已加密
- [ ] 日志中无敏感信息
- [ ] 已配置访问限流
- [ ] 已启用HTTPS

---

## 📞 紧急联系

**技术负责人**: [待定]  
**运维负责人**: [待定]  
**紧急电话**: [待定]  

---

**文档版本**: v1.0  
**最后更新**: 2025-10-18  
**下次更新**: 有重大变更时

