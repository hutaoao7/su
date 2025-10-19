# 数据库迁移指南

## ⚠️ 重要说明

本项目使用 **Supabase PostgreSQL** 作为主数据库。

架构文档中提到的MongoDB仅作为uniCloud默认数据库，**新功能全部使用Supabase**。

---

## 📋 迁移脚本清单

### 执行顺序

**必须按照以下顺序执行SQL脚本**：

1. ✅ `001_create_users_tables.sql` - 用户相关表（5个表）
2. ✅ `002_create_assessments_tables.sql` - 评估相关表（4个表）
3. ✅ `003_create_chat_tables.sql` - AI对话相关表（4个表+月度分区）
4. ✅ `004_create_cdk_tables.sql` - CDK相关表（3个表）
5. ✅ `005_create_music_tables.sql` - 音乐相关表（5个表）
6. ✅ `006_create_community_tables.sql` - 社区相关表（4个表）
7. ✅ `007_create_consent_tables.sql` - 同意管理表（3个表）
8. ✅ `008_create_events_tables.sql` - 事件埋点表（3个表+月度分区）

---

## 🚀 执行步骤

### 方式一：命令行执行

```bash
# 1. 连接到Supabase数据库
psql "postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres"

# 2. 依次执行迁移脚本
\i docs/database/migrations/001_create_users_tables.sql
\i docs/database/migrations/002_create_assessments_tables.sql
\i docs/database/migrations/003_create_chat_tables.sql
\i docs/database/migrations/004_create_cdk_tables.sql
\i docs/database/migrations/005_create_music_tables.sql
\i docs/database/migrations/006_create_community_tables.sql
\i docs/database/migrations/007_create_consent_tables.sql
\i docs/database/migrations/008_create_events_tables.sql

# 3. 验证表创建
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# 4. 检查种子数据
SELECT 'assessment_scales' as table_name, COUNT(*) as count FROM assessment_scales
UNION ALL
SELECT 'cdk_types', COUNT(*) FROM cdk_types
UNION ALL
SELECT 'music_categories', COUNT(*) FROM music_categories
UNION ALL
SELECT 'agreement_versions', COUNT(*) FROM agreement_versions;
```

### 方式二：Supabase Dashboard

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 复制粘贴每个SQL脚本内容
4. 点击 Run 执行
5. 检查执行结果

---

## ✅ 验证检查

### 1. 检查表是否创建成功

```sql
-- 应该看到30+个表
SELECT COUNT(*) as total_tables
FROM information_schema.tables 
WHERE table_schema = 'public';

-- 列出所有表
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### 2. 检查索引是否创建

```sql
-- 应该看到100+个索引
SELECT 
  schemaname,
  tablename,
  indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

### 3. 检查外键约束

```sql
SELECT
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### 4. 检查触发器

```sql
SELECT 
  trigger_name,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

### 5. 检查种子数据

```sql
-- 量表数据（应该有14条）
SELECT scale_id, scale_name FROM assessment_scales;

-- CDK类型（应该有6条）
SELECT type_code, type_name FROM cdk_types;

-- 音乐分类（应该有5条）
SELECT category_code, category_name FROM music_categories;

-- 协议版本（应该有3条）
SELECT agreement_type, version FROM agreement_versions;
```

---

## 🔄 回滚方案

### 完全回滚（删除所有表）

⚠️ **警告：此操作将删除所有数据，不可恢复！**

```sql
-- 删除所有表（按依赖顺序反向删除）
DROP TABLE IF EXISTS error_logs CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS user_behaviors CASCADE;
DROP TABLE IF EXISTS consent_revoke_logs CASCADE;
DROP TABLE IF EXISTS consent_records CASCADE;
DROP TABLE IF EXISTS agreement_versions CASCADE;
DROP TABLE IF EXISTS community_reports CASCADE;
DROP TABLE IF EXISTS community_likes CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_topics CASCADE;
DROP TABLE IF EXISTS user_music_history CASCADE;
DROP TABLE IF EXISTS user_music_favorites CASCADE;
DROP TABLE IF EXISTS music_playlists CASCADE;
DROP TABLE IF EXISTS music_tracks CASCADE;
DROP TABLE IF EXISTS music_categories CASCADE;
DROP TABLE IF EXISTS cdk_redeem_records CASCADE;
DROP TABLE IF NOT EXISTS cdk_codes CASCADE;
DROP TABLE IF EXISTS cdk_types CASCADE;
DROP TABLE IF EXISTS ai_usage_stats CASCADE;
DROP TABLE IF EXISTS chat_feedbacks CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_sessions CASCADE;
DROP TABLE IF EXISTS assessment_results CASCADE;
DROP TABLE IF EXISTS assessment_answers CASCADE;
DROP TABLE IF EXISTS assessments CASCADE;
DROP TABLE IF EXISTS assessment_scales CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS user_login_logs CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 删除触发器函数
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_chat_session_stats() CASCADE;
DROP FUNCTION IF EXISTS update_track_favorite_count() CASCADE;
DROP FUNCTION IF EXISTS update_topic_comments_count() CASCADE;
```

---

## 📊 数据库状态检查

### 运行验证脚本

```bash
# 生成验证报告
npm run check:db-schema

# 查看HTML报告
# 会生成 docs/database/validation/validation-report.html
```

---

## 🛠️ 常见问题

### Q1: 迁移脚本执行失败怎么办？
**A**: 
1. 检查是否有表已存在（脚本有`IF NOT EXISTS`保护）
2. 检查外键依赖顺序是否正确
3. 查看错误日志确定具体问题

### Q2: 如何添加新的月度分区？
**A**: 参考脚本中的分区创建示例：
```sql
CREATE TABLE IF NOT EXISTS chat_messages_2026_02 PARTITION OF chat_messages
FOR VALUES FROM ('2026-02-01') TO ('2026-03-01');
```

### Q3: 如何更新种子数据？
**A**: 使用`ON CONFLICT ... DO NOTHING`避免重复：
```sql
INSERT INTO assessment_scales (scale_id, ...)
VALUES (...)
ON CONFLICT (scale_id) DO NOTHING;
```

---

## 📝 维护建议

### 定期任务
1. **每月初**: 创建下个月的分区表
2. **每周**: 检查索引使用情况
3. **每季度**: 归档旧数据
4. **每年**: review表结构是否需要优化

### 性能监控
```sql
-- 查看表大小
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- 查看未使用的索引
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY tablename;
```

---

**维护人**: 数据库管理员  
**最后更新**: 2025-10-18  
**下次review**: 2025-11-01

