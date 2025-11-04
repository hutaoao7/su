-- =====================================================
-- 数据库过期数据清理脚本
-- =====================================================
-- 项目：CraneHeart (翎心)
-- 用途：定期清理过期数据，释放存储空间，提升性能
-- 运行频率：建议每天凌晨2点自动执行
-- 作者：CraneHeart Team
-- 日期：2025-11-04
-- 版本：1.0.0
-- =====================================================

-- 开始事务
BEGIN;

-- 创建临时表记录清理统计
CREATE TEMP TABLE cleanup_stats (
    table_name VARCHAR(100),
    deleted_count INTEGER,
    execution_time INTERVAL
);

-- =====================================================
-- 1. 清理90天前的错误日志
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    DELETE FROM error_logs 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    INSERT INTO cleanup_stats VALUES (
        'error_logs',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理error_logs: % 条记录', deleted_rows;
END $$;

-- =====================================================
-- 2. 清理30天前的埋点数据
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    DELETE FROM event_logs 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    INSERT INTO cleanup_stats VALUES (
        'event_logs',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理event_logs: % 条记录', deleted_rows;
END $$;

-- =====================================================
-- 3. 清理已撤回用户的数据（冷静期7天后永久删除）
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
    revoked_user_ids UUID[];
BEGIN
    start_time := clock_timestamp();
    
    -- 获取需要删除的用户ID
    SELECT ARRAY_AGG(id) INTO revoked_user_ids
    FROM users 
    WHERE consent_status = 'revoked' 
      AND updated_at < NOW() - INTERVAL '7 days';
    
    -- 如果有需要删除的用户
    IF revoked_user_ids IS NOT NULL THEN
        -- 删除关联的评估记录
        DELETE FROM assessments WHERE user_id = ANY(revoked_user_ids);
        
        -- 删除关联的聊天记录
        DELETE FROM chat_messages WHERE user_id = ANY(revoked_user_ids);
        DELETE FROM chat_sessions WHERE user_id = ANY(revoked_user_ids);
        
        -- 删除关联的社区内容
        DELETE FROM community_comments WHERE user_id = ANY(revoked_user_ids);
        DELETE FROM community_topics WHERE user_id = ANY(revoked_user_ids);
        
        -- 删除关联的CDK记录
        DELETE FROM cdk_redemptions WHERE user_id = ANY(revoked_user_ids);
        
        -- 删除用户记录
        DELETE FROM users WHERE id = ANY(revoked_user_ids);
        
        GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    ELSE
        deleted_rows := 0;
    END IF;
    
    INSERT INTO cleanup_stats VALUES (
        'revoked_users',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理已撤回用户: % 个用户及其关联数据', deleted_rows;
END $$;

-- =====================================================
-- 4. 清理临时会话（24小时未活跃）
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    DELETE FROM user_sessions 
    WHERE last_active_at < NOW() - INTERVAL '24 hours'
      AND session_type = 'guest';  -- 只清理游客会话
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    INSERT INTO cleanup_stats VALUES (
        'user_sessions',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理临时会话: % 条记录', deleted_rows;
END $$;

-- =====================================================
-- 5. 清理过期的CDK兑换码（已过期180天）
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    DELETE FROM cdks 
    WHERE status = 'expired' 
      AND expire_at < NOW() - INTERVAL '180 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    INSERT INTO cleanup_stats VALUES (
        'expired_cdks',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理过期CDK: % 条记录', deleted_rows;
END $$;

-- =====================================================
-- 6. 清理已删除的社区内容（软删除30天后硬删除）
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    -- 清理已删除的话题
    DELETE FROM community_topics 
    WHERE status = 'deleted' 
      AND updated_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    -- 清理已删除的评论
    DELETE FROM community_comments 
    WHERE status = 'deleted' 
      AND updated_at < NOW() - INTERVAL '30 days';
    
    INSERT INTO cleanup_stats VALUES (
        'deleted_community_content',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理已删除社区内容: % 条记录', deleted_rows;
END $$;

-- =====================================================
-- 7. 清理未完成的评估记录（超过7天未完成）
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    DELETE FROM assessments 
    WHERE status = 'in_progress' 
      AND created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    INSERT INTO cleanup_stats VALUES (
        'incomplete_assessments',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理未完成评估: % 条记录', deleted_rows;
END $$;

-- =====================================================
-- 8. 清理过期的音乐播放历史（保留90天）
-- =====================================================
DO $$
DECLARE
    start_time TIMESTAMP;
    deleted_rows INTEGER;
BEGIN
    start_time := clock_timestamp();
    
    DELETE FROM music_play_history 
    WHERE played_at < NOW() - INTERVAL '90 days';
    
    GET DIAGNOSTICS deleted_rows = ROW_COUNT;
    
    INSERT INTO cleanup_stats VALUES (
        'music_play_history',
        deleted_rows,
        clock_timestamp() - start_time
    );
    
    RAISE NOTICE '清理音乐播放历史: % 条记录', deleted_rows;
END $$;

-- =====================================================
-- 9. 清理Redis缓存键（通过触发器或外部脚本）
-- 注：此步骤需要在应用层或Redis层执行
-- =====================================================
-- 清理模式：
-- - chat:session:* (超过30天未访问)
-- - cache:* (超过7天未访问)
-- - analytics:* (超过24小时的临时统计数据)

-- =====================================================
-- 10. 输出清理统计报告
-- =====================================================
DO $$
DECLARE
    total_deleted INTEGER;
    total_time INTERVAL;
    report_text TEXT;
BEGIN
    -- 计算总计
    SELECT 
        SUM(deleted_count),
        SUM(execution_time)
    INTO total_deleted, total_time
    FROM cleanup_stats;
    
    -- 生成报告
    report_text := E'\n========== 数据清理统计报告 ==========\n';
    report_text := report_text || '清理时间: ' || NOW()::TEXT || E'\n\n';
    
    -- 表格头
    report_text := report_text || RPAD('表名', 30) || RPAD('删除记录数', 15) || '执行时间' || E'\n';
    report_text := report_text || REPEAT('-', 60) || E'\n';
    
    -- 表格内容
    FOR rec IN 
        SELECT table_name, deleted_count, execution_time 
        FROM cleanup_stats 
        ORDER BY table_name
    LOOP
        report_text := report_text || 
            RPAD(rec.table_name, 30) || 
            RPAD(rec.deleted_count::TEXT, 15) || 
            rec.execution_time::TEXT || E'\n';
    END LOOP;
    
    -- 总计
    report_text := report_text || REPEAT('-', 60) || E'\n';
    report_text := report_text || 
        RPAD('总计', 30) || 
        RPAD(total_deleted::TEXT, 15) || 
        total_time::TEXT || E'\n';
    report_text := report_text || '========================================' || E'\n';
    
    RAISE NOTICE '%', report_text;
    
    -- 记录到系统日志表（如果存在）
    INSERT INTO system_logs (log_type, log_level, message, created_at)
    VALUES ('database_cleanup', 'info', report_text, NOW())
    ON CONFLICT DO NOTHING;  -- 如果表不存在则跳过
    
END $$;

-- 提交事务
COMMIT;

-- =====================================================
-- 执行VACUUM清理回收空间
-- =====================================================
-- 注：VACUUM不能在事务中执行，需要单独运行
-- 建议在清理完成后手动或通过定时任务执行：
-- VACUUM ANALYZE error_logs;
-- VACUUM ANALYZE event_logs;
-- VACUUM ANALYZE assessments;
-- VACUUM ANALYZE chat_messages;

-- =====================================================
-- 定时任务设置说明
-- =====================================================
-- Windows (任务计划程序):
-- 1. 创建基本任务
-- 2. 触发器：每天凌晨2:00
-- 3. 操作：启动程序
--    程序：psql
--    参数：-h $PGHOST -U $PGUSER -d $PGDATABASE -f cleanup-expired-data.sql
-- 4. 条件：仅在计算机使用AC电源时启动
--
-- Linux (crontab):
-- 0 2 * * * psql -h $PGHOST -U $PGUSER -d $PGDATABASE -f /path/to/cleanup-expired-data.sql >> /var/log/cleanup.log 2>&1
-- =====================================================

