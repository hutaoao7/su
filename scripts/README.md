# 数据库运维脚本使用指南

## 📋 脚本列表

| 脚本文件 | 用途 | 运行频率 | 执行时长 |
|---------|------|---------|---------|
| `backup-database.ps1` | 数据库自动备份 | 每天凌晨3点 | 5-15分钟 |
| `cleanup-expired-data.sql` | 清理过期数据 | 每天凌晨2点 | 2-10分钟 |
| `monitor-database.sql` | 性能监控报告 | 每小时/按需 | 1-3分钟 |
| `seed-data.sql` | 种子数据初始化 | 仅开发/测试环境 | 1分钟 |

---

## 🔧 环境准备

### 1. 安装PostgreSQL客户端工具

**Windows**:
```powershell
# 下载并安装PostgreSQL
# https://www.postgresql.org/download/windows/

# 或使用Chocolatey
choco install postgresql
```

**验证安装**:
```powershell
pg_dump --version
psql --version
```

### 2. 配置环境变量

**Windows PowerShell**:
```powershell
# 临时设置（当前会话）
$env:SUPABASE_DB_HOST = "db.xxx.supabase.co"
$env:SUPABASE_DB_USER = "postgres"
$env:SUPABASE_DB_PASSWORD = "your_password"
$env:SUPABASE_DB_NAME = "postgres"
$env:SUPABASE_DB_PORT = "5432"

# 永久设置（系统环境变量）
[System.Environment]::SetEnvironmentVariable('SUPABASE_DB_HOST', 'db.xxx.supabase.co', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_DB_USER', 'postgres', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_DB_PASSWORD', 'your_password', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_DB_NAME', 'postgres', 'User')
[System.Environment]::SetEnvironmentVariable('SUPABASE_DB_PORT', '5432', 'User')
```

---

## 📖 使用说明

### 1. 数据库备份 (`backup-database.ps1`)

#### 基本用法

```powershell
# 使用默认配置
.\backup-database.ps1

# 指定备份目录和保留天数
.\backup-database.ps1 -BackupDir "D:\backups" -RetentionDays 60
```

#### 自动化备份（Windows任务计划程序）

1. 打开"任务计划程序"
2. 创建基本任务
   - 名称：`CraneHeart数据库备份`
   - 触发器：每天凌晨3:00
   - 操作：启动程序
     - 程序：`powershell.exe`
     - 参数：`-ExecutionPolicy Bypass -File "D:\项目路径\scripts\backup-database.ps1"`
   - 条件：仅在计算机使用AC电源时启动

#### 备份文件说明

```
backups/database/
├── craneheart_backup_20251104_030000.dump  # 压缩格式（用于恢复）
├── craneheart_backup_20251104_030000.sql   # 纯文本格式（便于查看）
└── backup.log                              # 备份日志
```

#### 恢复备份

```powershell
# 从.dump文件恢复（完整恢复）
pg_restore -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME -v `
  craneheart_backup_20251104_030000.dump

# 从.sql文件恢复
psql -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME `
  -f craneheart_backup_20251104_030000.sql
```

---

### 2. 清理过期数据 (`cleanup-expired-data.sql`)

#### 手动执行

```powershell
# 设置环境变量后执行
psql -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME `
  -f cleanup-expired-data.sql
```

#### 自动化清理（Windows任务计划程序）

1. 创建批处理脚本 `run-cleanup.bat`:
```batch
@echo off
set PGPASSWORD=%SUPABASE_DB_PASSWORD%
psql -h %SUPABASE_DB_HOST% -U %SUPABASE_DB_USER% -d %SUPABASE_DB_NAME% -f "D:\项目路径\scripts\cleanup-expired-data.sql" >> "D:\logs\cleanup.log" 2>&1
```

2. 在任务计划程序中设置每天凌晨2:00执行

#### 清理内容说明

| 数据类型 | 清理规则 | 保留时长 |
|---------|---------|---------|
| 错误日志 | `error_logs` | 90天 |
| 埋点数据 | `event_logs` | 30天 |
| 已撤回用户数据 | `users` (consent_status='revoked') | 7天冷静期后永久删除 |
| 临时会话 | `user_sessions` (游客) | 24小时 |
| 过期CDK | `cdks` (已过期) | 180天 |
| 已删除社区内容 | `community_topics/comments` | 30天软删除后硬删除 |
| 未完成评估 | `assessments` (in_progress) | 7天 |
| 音乐播放历史 | `music_play_history` | 90天 |

---

### 3. 性能监控 (`monitor-database.sql`)

#### 手动执行

```powershell
# 生成完整监控报告
psql -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME `
  -f monitor-database.sql

# 保存报告到文件
psql -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME `
  -f monitor-database.sql > monitoring_report_$(Get-Date -Format "yyyyMMdd_HHmmss").txt
```

#### 监控内容

1. **数据库连接信息** - 当前数据库版本、连接信息
2. **慢查询统计** - 平均执行时间>1秒的查询（Top 20）
3. **活跃连接数** - 活跃/空闲连接统计
4. **长时间运行查询** - 运行时间>30秒的查询
5. **锁等待检测** - 被阻塞的查询及其阻塞源
6. **表大小统计** - 最大的20个表及其大小
7. **未使用索引** - 从未被使用的索引（建议删除）
8. **表膨胀检测** - dead tuples占比>20%的表
9. **缓存命中率** - 表缓存和索引缓存命中率
10. **表更新频率** - 各表的读写频率统计
11. **数据库大小** - 各数据库的大小统计
12. **事务统计** - 提交/回滚统计
13. **重要配置参数** - 关键性能参数
14. **VACUUM/ANALYZE** - 最近的清理和分析执行情况
15. **复制延迟** - 主从复制延迟（如适用）

#### 告警阈值

以下情况需要立即关注：

- ⚠️ 慢查询平均执行时间 > 5秒
- ⚠️ 长时间运行查询 > 5分钟
- ⚠️ 存在锁等待
- ⚠️ 缓存命中率 < 95%
- ⚠️ 表膨胀率 > 30%
- ⚠️ 事务回滚率 > 5%
- ⚠️ 活跃连接数接近 `max_connections`

---

### 4. 种子数据初始化 (`seed-data.sql`)

#### ⚠️ 警告

**仅用于开发/测试环境，禁止在生产环境执行！**

脚本内置了安全检查，如果数据库名称包含 `prod` 或 `production`，将自动终止执行。

#### 执行方式

```powershell
# 确认当前连接的是测试环境
psql -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME `
  -c "SELECT current_database();"

# 执行种子数据初始化
psql -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME `
  -f seed-data.sql
```

#### 创建的测试数据

| 数据类型 | 数量 | 说明 |
|---------|------|------|
| 管理员账号 | 1个 | `admin_test_openid_001` |
| 测试用户 | 5个 | 小明、小红、VIP用户、新用户、游客 |
| CDK类型 | 3种 | 月卡、季卡、年卡 |
| 测试CDK码 | 5个 | 包含未使用和已使用 |
| 音乐分类 | 5个 | 轻音乐、自然音、冥想、白噪音、钢琴 |
| 示例音乐 | 8首 | 各分类示例曲目 |
| 社区话题 | 3个 | 不同分类的示例话题 |
| 评估记录 | 3个 | 已完成和进行中的评估 |
| 聊天会话 | 2个 | 示例对话会话 |

#### 测试账号

```
管理员：
  OpenID: admin_test_openid_001
  昵称：系统管理员

测试用户：
  OpenID: test_user_openid_002  昵称：测试用户小明
  OpenID: test_user_openid_003  昵称：测试用户小红
  OpenID: test_user_openid_004  昵称：VIP测试用户
  OpenID: test_user_openid_005  昵称：新手用户
  OpenID: guest_openid_006      昵称：游客

测试CDK码：
  月卡：TEST-MONTH-2025-0001, TEST-MONTH-2025-0002
  季卡：TEST-SEASON-2025-0001
  年卡：TEST-YEAR-2025-0001
```

---

## 🔍 故障排查

### 问题1: pg_dump/psql命令未找到

**原因**: PostgreSQL客户端工具未安装或未添加到PATH

**解决**:
```powershell
# 检查安装路径
Get-Command pg_dump
Get-Command psql

# 手动添加到PATH（临时）
$env:PATH += ";C:\Program Files\PostgreSQL\15\bin"
```

### 问题2: 连接数据库失败

**原因**: 环境变量未设置或密码错误

**解决**:
```powershell
# 验证环境变量
echo $env:SUPABASE_DB_HOST
echo $env:SUPABASE_DB_USER

# 测试连接
psql -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME -c "SELECT 1;"
```

### 问题3: 备份文件过大

**原因**: 数据库包含大量数据

**解决**:
```powershell
# 使用最高压缩级别
pg_dump -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME -F c -Z 9 -f backup.dump

# 仅备份特定表
pg_dump -h $env:SUPABASE_DB_HOST -U $env:SUPABASE_DB_USER `
  -d $env:SUPABASE_DB_NAME -t users -t assessments -F c -f partial_backup.dump
```

### 问题4: 清理脚本执行慢

**原因**: 大量过期数据需要删除

**解决**:
```sql
-- 分批删除，避免长时间锁表
DELETE FROM error_logs 
WHERE ctid = ANY(ARRAY(
    SELECT ctid FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days'
    LIMIT 10000
));
```

---

## 📊 最佳实践

### 1. 备份策略

- ✅ 每天自动全量备份
- ✅ 保留最近30天的备份
- ✅ 每月1号额外创建归档备份（永久保留）
- ✅ 定期测试备份恢复流程（每季度1次）

### 2. 清理策略

- ✅ 每天凌晨自动清理（业务低峰期）
- ✅ 清理前自动备份
- ✅ 记录清理统计日志
- ✅ 定期检查清理效果（VACUUM ANALYZE）

### 3. 监控策略

- ✅ 每小时自动生成监控报告
- ✅ 设置告警阈值自动通知
- ✅ 每周汇总性能趋势分析
- ✅ 慢查询自动优化建议

### 4. 安全建议

- ✅ 环境变量中的密码加密存储
- ✅ 备份文件加密传输
- ✅ 限制脚本执行权限
- ✅ 审计日志记录

---

## 📞 技术支持

如有问题，请联系：
- GitHub Issues: [项目地址]
- 邮箱: support@craneheart.com
- 文档: `docs/DATABASE-OPERATIONS.md`

---

## 📝 更新日志

### v1.0.0 (2025-11-04)
- ✅ 初始版本
- ✅ 支持PostgreSQL/Supabase
- ✅ Windows PowerShell脚本
- ✅ 完整的备份/清理/监控功能

