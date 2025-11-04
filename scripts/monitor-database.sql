-- =====================================================
-- 数据库性能监控脚本
-- =====================================================
-- 项目：CraneHeart (翎心)
-- 用途：监控数据库性能，发现潜在问题
-- 运行频率：建议每小时执行一次，或按需执行
-- 作者：CraneHeart Team
-- 日期：2025-11-04
-- 版本：1.0.0
-- =====================================================

-- 设置输出格式
\pset border 2
\pset format wrapped

\echo '========================================='
\echo '数据库性能监控报告'
\echo '生成时间：' `date`
\echo '========================================='
\echo ''

-- =====================================================
-- 1. 数据库连接信息
-- =====================================================
\echo '===== 1. 数据库连接信息 ====='
SELECT 
    current_database() AS database_name,
    current_user AS current_user,
    version() AS postgresql_version,
    NOW() AS current_time;
\echo ''

-- =====================================================
-- 2. 慢查询统计（平均执行时间 > 1秒）
-- =====================================================
\echo '===== 2. 慢查询统计（Top 20）====='
\echo '说明：显示平均执行时间超过1秒的查询'
\echo ''

SELECT 
    ROUND(mean_exec_time::numeric, 2) AS avg_time_ms,
    calls AS call_count,
    ROUND(total_exec_time::numeric, 2) AS total_time_ms,
    ROUND((100 * total_exec_time / SUM(total_exec_time) OVER())::numeric, 2) AS percentage,
    LEFT(query, 100) AS query_preview
FROM pg_stat_statements
WHERE mean_exec_time > 1000  -- 超过1秒
ORDER BY mean_exec_time DESC
LIMIT 20;

\echo ''
\echo '注：如果看不到数据，需要启用pg_stat_statements扩展：'
\echo 'CREATE EXTENSION IF NOT EXISTS pg_stat_statements;'
\echo ''

-- =====================================================
-- 3. 当前活跃连接数
-- =====================================================
\echo '===== 3. 当前活跃连接 ====='

SELECT 
    COUNT(*) FILTER (WHERE state = 'active') AS active_connections,
    COUNT(*) FILTER (WHERE state = 'idle') AS idle_connections,
    COUNT(*) FILTER (WHERE state = 'idle in transaction') AS idle_in_transaction,
    COUNT(*) AS total_connections,
    (SELECT setting::int FROM pg_settings WHERE name = 'max_connections') AS max_connections
FROM pg_stat_activity;

\echo ''

-- =====================================================
-- 4. 长时间运行的查询（> 30秒）
-- =====================================================
\echo '===== 4. 长时间运行的查询 ====='

SELECT 
    pid,
    usename AS username,
    application_name,
    client_addr,
    state,
    NOW() - query_start AS duration,
    LEFT(query, 100) AS query_preview
FROM pg_stat_activity
WHERE state != 'idle'
  AND NOW() - query_start > INTERVAL '30 seconds'
ORDER BY duration DESC;

\echo ''

-- =====================================================
-- 5. 锁等待检测
-- =====================================================
\echo '===== 5. 锁等待检测 ====='
\echo '说明：显示当前被阻塞的查询及其阻塞源'
\echo ''

SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_query,
    blocking_activity.query AS blocking_query,
    NOW() - blocked_activity.query_start AS blocked_duration
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
    ON blocking_locks.locktype = blocked_locks.locktype
    AND blocking_locks.database IS NOT DISTINCT FROM blocked_locks.database
    AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
    AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
    AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
    AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
    AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
    AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
    AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
    AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
    AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;

\echo ''

-- =====================================================
-- 6. 表大小统计（Top 20）
-- =====================================================
\echo '===== 6. 表大小统计（Top 20）====='

SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
    ROUND(100 * pg_total_relation_size(schemaname||'.'||tablename) / 
          NULLIF(SUM(pg_total_relation_size(schemaname||'.'||tablename)) OVER (), 0), 2) AS percentage
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 20;

\echo ''

-- =====================================================
-- 7. 索引使用统计
-- =====================================================
\echo '===== 7. 未使用的索引（建议删除）====='

SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    indexname AS index_name,
    pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) AS index_size,
    idx_scan AS scan_count
FROM pg_stat_user_indexes
WHERE idx_scan = 0  -- 从未被使用
  AND indexrelname NOT LIKE '%_pkey'  -- 排除主键
ORDER BY pg_relation_size(schemaname||'.'||indexname) DESC
LIMIT 20;

\echo ''

-- =====================================================
-- 8. 表膨胀检测（估算）
-- =====================================================
\echo '===== 8. 表膨胀检测 ====='
\echo '说明：显示可能存在严重膨胀的表（dead tuples > 20%）'
\echo ''

SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    n_live_tup AS live_rows,
    n_dead_tup AS dead_rows,
    ROUND(100 * n_dead_tup / NULLIF(n_live_tup + n_dead_tup, 0), 2) AS dead_percentage,
    last_vacuum,
    last_autovacuum
FROM pg_stat_user_tables
WHERE n_dead_tup > 0
  AND n_live_tup > 0
  AND (100 * n_dead_tup / (n_live_tup + n_dead_tup)) > 20  -- 超过20%
ORDER BY dead_percentage DESC
LIMIT 20;

\echo ''

-- =====================================================
-- 9. 缓存命中率
-- =====================================================
\echo '===== 9. 缓存命中率 ====='
\echo '说明：命中率应该 > 99%，如果低于95%需要考虑增加shared_buffers'
\echo ''

SELECT 
    'Table Cache' AS cache_type,
    SUM(heap_blks_read) AS disk_reads,
    SUM(heap_blks_hit) AS cache_hits,
    ROUND(100 * SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_hit) + SUM(heap_blks_read), 0), 2) AS hit_rate_percentage
FROM pg_statio_user_tables

UNION ALL

SELECT 
    'Index Cache' AS cache_type,
    SUM(idx_blks_read) AS disk_reads,
    SUM(idx_blks_hit) AS cache_hits,
    ROUND(100 * SUM(idx_blks_hit) / NULLIF(SUM(idx_blks_hit) + SUM(idx_blks_read), 0), 2) AS hit_rate_percentage
FROM pg_statio_user_indexes;

\echo ''

-- =====================================================
-- 10. 表更新频率统计
-- =====================================================
\echo '===== 10. 表更新频率（Top 20）====='

SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    seq_scan AS sequential_scans,
    seq_tup_read AS seq_rows_read,
    idx_scan AS index_scans,
    idx_tup_fetch AS idx_rows_fetched,
    n_tup_ins AS inserts,
    n_tup_upd AS updates,
    n_tup_del AS deletes,
    n_tup_hot_upd AS hot_updates
FROM pg_stat_user_tables
ORDER BY (n_tup_ins + n_tup_upd + n_tup_del) DESC
LIMIT 20;

\echo ''

-- =====================================================
-- 11. 数据库大小统计
-- =====================================================
\echo '===== 11. 数据库大小统计 ====='

SELECT 
    datname AS database_name,
    pg_size_pretty(pg_database_size(datname)) AS database_size,
    (SELECT COUNT(*) FROM pg_stat_activity WHERE datname = pg_database.datname) AS active_connections
FROM pg_database
WHERE datname NOT IN ('template0', 'template1', 'postgres')
ORDER BY pg_database_size(datname) DESC;

\echo ''

-- =====================================================
-- 12. 事务统计
-- =====================================================
\echo '===== 12. 事务统计 ====='

SELECT 
    datname AS database_name,
    xact_commit AS commits,
    xact_rollback AS rollbacks,
    ROUND(100 * xact_rollback / NULLIF(xact_commit + xact_rollback, 0), 2) AS rollback_percentage,
    blks_read AS disk_blocks_read,
    blks_hit AS cache_blocks_hit,
    tup_returned AS rows_returned,
    tup_fetched AS rows_fetched,
    tup_inserted AS rows_inserted,
    tup_updated AS rows_updated,
    tup_deleted AS rows_deleted
FROM pg_stat_database
WHERE datname = current_database();

\echo ''

-- =====================================================
-- 13. 重要配置参数检查
-- =====================================================
\echo '===== 13. 重要配置参数 ====='

SELECT 
    name AS parameter_name,
    setting AS current_value,
    unit,
    category
FROM pg_settings
WHERE name IN (
    'max_connections',
    'shared_buffers',
    'effective_cache_size',
    'work_mem',
    'maintenance_work_mem',
    'checkpoint_completion_target',
    'wal_buffers',
    'default_statistics_target',
    'random_page_cost',
    'effective_io_concurrency',
    'max_worker_processes',
    'max_parallel_workers',
    'autovacuum'
)
ORDER BY name;

\echo ''

-- =====================================================
-- 14. 最近的VACUUM和ANALYZE执行情况
-- =====================================================
\echo '===== 14. VACUUM/ANALYZE执行情况 ====='

SELECT 
    schemaname AS schema_name,
    tablename AS table_name,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    vacuum_count,
    autovacuum_count,
    analyze_count,
    autoanalyze_count
FROM pg_stat_user_tables
ORDER BY GREATEST(
    COALESCE(last_vacuum, '1970-01-01'::timestamp),
    COALESCE(last_autovacuum, '1970-01-01'::timestamp)
) DESC
LIMIT 20;

\echo ''

-- =====================================================
-- 15. 复制延迟监控（如果配置了主从复制）
-- =====================================================
\echo '===== 15. 复制延迟（如适用）====='

SELECT 
    client_addr AS replica_address,
    state,
    sync_state,
    replay_lag,
    write_lag,
    flush_lag
FROM pg_stat_replication;

\echo ''
\echo '注：如果没有数据，说明当前数据库未配置主从复制'
\echo ''

-- =====================================================
-- 报告结束
-- =====================================================
\echo '========================================='
\echo '监控报告生成完成'
\echo '========================================='

-- =====================================================
-- 告警阈值说明
-- =====================================================
-- 以下情况需要关注：
-- 1. 慢查询 > 5秒
-- 2. 长时间运行查询 > 5分钟
-- 3. 存在锁等待
-- 4. 缓存命中率 < 95%
-- 5. 表膨胀率 > 30%
-- 6. 回滚率 > 5%
-- 7. 活跃连接数接近max_connections
-- =====================================================

