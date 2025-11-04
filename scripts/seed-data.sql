-- =====================================================
-- 测试/开发环境种子数据
-- =====================================================
-- 项目：CraneHeart (翎心)
-- 用途：快速初始化测试或开发环境的基础数据
-- 警告：⚠️ 仅用于开发/测试环境，勿在生产环境执行！
-- 作者：CraneHeart Team
-- 日期：2025-11-04
-- 版本：1.0.0
-- =====================================================

-- 安全检查：确认当前数据库不是生产环境
DO $$
BEGIN
    IF current_database() IN ('craneheart_prod', 'craneheart_production') THEN
        RAISE EXCEPTION '❌ 禁止在生产环境执行种子数据脚本！';
    END IF;
    
    RAISE NOTICE '✅ 当前数据库：%, 继续执行种子数据初始化...', current_database();
END $$;

-- 开始事务
BEGIN;

-- =====================================================
-- 1. 清空现有测试数据（可选）
-- =====================================================
-- 如需清空现有数据，取消以下注释
/*
TRUNCATE TABLE 
    error_logs,
    event_logs,
    chat_messages,
    chat_sessions,
    community_comments,
    community_topics,
    cdk_redemptions,
    cdks,
    assessments,
    users
CASCADE;

RAISE NOTICE '已清空现有测试数据';
*/

-- =====================================================
-- 2. 管理员账号
-- =====================================================
INSERT INTO users (id, openid, nickname, avatar, role, consent_status, status, created_at, updated_at) 
VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin_test_openid_001',
    '系统管理员',
    'https://avatars.githubusercontent.com/admin',
    'admin',
    'agreed',
    'active',
    NOW() - INTERVAL '365 days',
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    role = EXCLUDED.role,
    updated_at = NOW();

RAISE NOTICE '✅ 已创建管理员账号';

-- =====================================================
-- 3. 测试用户（5个）
-- =====================================================
INSERT INTO users (id, openid, nickname, avatar, role, consent_status, status, created_at, updated_at) 
VALUES
-- 活跃用户1
(
    '00000000-0000-0000-0000-000000000002',
    'test_user_openid_002',
    '测试用户小明',
    'https://thispersondoesnotexist.com/image?1',
    'user',
    'agreed',
    'active',
    NOW() - INTERVAL '30 days',
    NOW()
),
-- 活跃用户2
(
    '00000000-0000-0000-0000-000000000003',
    'test_user_openid_003',
    '测试用户小红',
    'https://thispersondoesnotexist.com/image?2',
    'user',
    'agreed',
    'active',
    NOW() - INTERVAL '60 days',
    NOW()
),
-- VIP用户
(
    '00000000-0000-0000-0000-000000000004',
    'test_user_openid_004',
    'VIP测试用户',
    'https://thispersondoesnotexist.com/image?3',
    'vip',
    'agreed',
    'active',
    NOW() - INTERVAL '90 days',
    NOW()
),
-- 新用户
(
    '00000000-0000-0000-0000-000000000005',
    'test_user_openid_005',
    '新手用户',
    'https://thispersondoesnotexist.com/image?4',
    'user',
    'agreed',
    'active',
    NOW() - INTERVAL '3 days',
    NOW()
),
-- 游客
(
    '00000000-0000-0000-0000-000000000006',
    'guest_openid_006',
    '游客',
    NULL,
    'guest',
    'pending',
    'active',
    NOW(),
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    updated_at = NOW();

RAISE NOTICE '✅ 已创建5个测试用户';

-- =====================================================
-- 4. CDK类型
-- =====================================================
INSERT INTO cdk_types (id, name, description, duration_days, features, created_at) 
VALUES
(
    '10000000-0000-0000-0000-000000000001',
    'VIP月卡',
    '30天VIP会员，享受专属权益',
    30,
    '{"premium_content": true, "ad_free": true, "priority_support": true}'::jsonb,
    NOW()
),
(
    '10000000-0000-0000-0000-000000000002',
    'VIP季卡',
    '90天VIP会员，超值优惠',
    90,
    '{"premium_content": true, "ad_free": true, "priority_support": true, "exclusive_badge": true}'::jsonb,
    NOW()
),
(
    '10000000-0000-0000-0000-000000000003',
    'VIP年卡',
    '365天VIP会员，年度最佳选择',
    365,
    '{"premium_content": true, "ad_free": true, "priority_support": true, "exclusive_badge": true, "custom_theme": true}'::jsonb,
    NOW()
)
ON CONFLICT (id) DO UPDATE SET
    description = EXCLUDED.description,
    features = EXCLUDED.features;

RAISE NOTICE '✅ 已创建3种CDK类型';

-- =====================================================
-- 5. CDK兑换码（测试用）
-- =====================================================
INSERT INTO cdks (code, type_id, status, expire_at, created_by, created_at) 
VALUES
('TEST-MONTH-2025-0001', '10000000-0000-0000-0000-000000000001', 'active', NOW() + INTERVAL '90 days', '00000000-0000-0000-0000-000000000001', NOW()),
('TEST-MONTH-2025-0002', '10000000-0000-0000-0000-000000000001', 'active', NOW() + INTERVAL '90 days', '00000000-0000-0000-0000-000000000001', NOW()),
('TEST-SEASON-2025-0001', '10000000-0000-0000-0000-000000000002', 'active', NOW() + INTERVAL '180 days', '00000000-0000-0000-0000-000000000001', NOW()),
('TEST-YEAR-2025-0001', '10000000-0000-0000-0000-000000000003', 'active', NOW() + INTERVAL '365 days', '00000000-0000-0000-0000-000000000001', NOW()),
('TEST-USED-2025-0001', '10000000-0000-0000-0000-000000000001', 'used', NOW() + INTERVAL '90 days', '00000000-0000-0000-0000-000000000001', NOW() - INTERVAL '10 days')
ON CONFLICT (code) DO NOTHING;

RAISE NOTICE '✅ 已创建5个测试CDK';

-- =====================================================
-- 6. 音乐分类
-- =====================================================
INSERT INTO music_categories (name, name_en, description, icon, sort_order, status) 
VALUES
('轻音乐', 'Light Music', '舒缓放松的轻音乐，帮助你减压放松', 'music', 1, 'active'),
('自然音', 'Nature Sounds', '大自然的声音，沉浸式放松体验', 'leaf', 2, 'active'),
('冥想音乐', 'Meditation', '专业冥想引导音乐，提升专注力', 'meditation', 3, 'active'),
('白噪音', 'White Noise', '助眠白噪音，改善睡眠质量', 'sound', 4, 'active'),
('钢琴曲', 'Piano', '优美的钢琴曲，陶冶情操', 'piano', 5, 'active')
ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order;

RAISE NOTICE '✅ 已创建5个音乐分类';

-- =====================================================
-- 7. 示例音乐（使用静态资源）
-- =====================================================
INSERT INTO music_tracks (id, title, artist, category_id, duration, file_url, cover_url, is_premium, status) 
SELECT 
    gen_random_uuid(),
    title,
    artist,
    (SELECT id FROM music_categories WHERE name = category LIMIT 1),
    duration,
    file_url,
    cover_url,
    is_premium,
    'active'
FROM (VALUES
    ('森林晨曦', '自然之声', '自然音', 180, 'cloud://music/nature/forest_morning.mp3', 'cloud://covers/forest.jpg', false),
    ('海浪轻拂', '自然之声', '自然音', 240, 'cloud://music/nature/ocean_waves.mp3', 'cloud://covers/ocean.jpg', false),
    ('雨后清新', '自然之声', '自然音', 200, 'cloud://music/nature/after_rain.mp3', 'cloud://covers/rain.jpg', false),
    ('月光奏鸣曲', '贝多芬', '钢琴曲', 360, 'cloud://music/piano/moonlight_sonata.mp3', 'cloud://covers/piano.jpg', true),
    ('夜的钢琴曲', '石进', '钢琴曲', 280, 'cloud://music/piano/night_piano.mp3', 'cloud://covers/night.jpg', false),
    ('深度冥想', '禅音坊', '冥想音乐', 600, 'cloud://music/meditation/deep_meditation.mp3', 'cloud://covers/meditation.jpg', false),
    ('正念呼吸', '禅音坊', '冥想音乐', 480, 'cloud://music/meditation/mindful_breathing.mp3', 'cloud://covers/zen.jpg', false),
    ('白噪音-雨声', '睡眠助手', '白噪音', 3600, 'cloud://music/whitenoise/rain.mp3', 'cloud://covers/whitenoise.jpg', false)
) AS data(title, artist, category, duration, file_url, cover_url, is_premium)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✅ 已创建8首示例音乐';

-- =====================================================
-- 8. 社区话题分类
-- =====================================================
-- 注：分类已在代码中硬编码，此处仅作记录
-- 分类：mood(心情)、study(学习)、life(生活)、emotion(情感)、help(求助)

-- =====================================================
-- 9. 示例社区话题
-- =====================================================
INSERT INTO community_topics (id, user_id, title, content, category, images, status, created_at, updated_at) 
VALUES
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    '今天心情不错，分享一下',
    '天气很好，出去散步了一圈，感觉整个人都轻松了很多。大家有什么减压的好方法吗？',
    'mood',
    '[]'::jsonb,
    'published',
    NOW() - INTERVAL '2 days',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    '期末考试压力好大',
    '马上要期末考试了，复习不完怎么办？每天都很焦虑，睡不好觉...有学习减压的建议吗？',
    'study',
    '[]'::jsonb,
    'published',
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000004',
    '推荐一个冥想APP',
    '最近在用翎心CraneHeart，感觉冥想音乐很不错，大家有在用吗？',
    'life',
    '[]'::jsonb,
    'published',
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✅ 已创建3个示例话题';

-- =====================================================
-- 10. 示例评估记录
-- =====================================================
INSERT INTO assessments (id, user_id, scale_type, scale_version, status, total_score, result, created_at, completed_at) 
VALUES
-- 压力评估
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    'PSS-10',
    '1.0.0',
    'completed',
    18,
    '{"level": "moderate", "score": 18, "dimensions": {"perceived_stress": 18}}'::jsonb,
    NOW() - INTERVAL '7 days',
    NOW() - INTERVAL '7 days'
),
-- 睡眠评估
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    'PSQI',
    '1.0.0',
    'completed',
    9,
    '{"level": "moderate", "score": 9, "dimensions": {"sleep_quality": 9}}'::jsonb,
    NOW() - INTERVAL '5 days',
    NOW() - INTERVAL '5 days'
),
-- 进行中的评估
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000005',
    'GAD-7',
    '1.0.0',
    'in_progress',
    NULL,
    NULL,
    NOW() - INTERVAL '1 hour',
    NULL
)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✅ 已创建3个示例评估记录';

-- =====================================================
-- 11. 示例聊天会话
-- =====================================================
INSERT INTO chat_sessions (id, user_id, title, message_count, created_at, updated_at) 
VALUES
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000002',
    '压力管理咨询',
    10,
    NOW() - INTERVAL '3 days',
    NOW() - INTERVAL '2 days'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000003',
    '睡眠问题求助',
    5,
    NOW() - INTERVAL '1 day',
    NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE '✅ 已创建2个示例聊天会话';

-- =====================================================
-- 12. 系统配置表（如存在）
-- =====================================================
INSERT INTO system_configs (config_key, config_value, description, created_at, updated_at)
VALUES
('maintenance_mode', 'false', '维护模式开关', NOW(), NOW()),
('max_upload_size', '10485760', '最大上传文件大小(10MB)', NOW(), NOW()),
('image_moderation', 'true', '图片审核开关', NOW(), NOW()),
('ai_model', 'gpt-3.5-turbo', '默认AI模型', NOW(), NOW())
ON CONFLICT (config_key) DO UPDATE SET
    config_value = EXCLUDED.config_value,
    updated_at = NOW();

RAISE NOTICE '✅ 已创建系统配置';

-- 提交事务
COMMIT;

-- =====================================================
-- 种子数据初始化完成
-- =====================================================
\echo ''
\echo '========================================='
\echo '✅ 种子数据初始化完成！'
\echo '========================================='
\echo ''
\echo '已创建以下测试数据：'
\echo '- 1个管理员账号 (ID: 00000000-0000-0000-0000-000000000001)'
\echo '- 5个测试用户 (ID: 00000000-0000-0000-0000-00000000000[2-6])'
\echo '- 3种CDK类型'
\echo '- 5个测试CDK码'
\echo '- 5个音乐分类'
\echo '- 8首示例音乐'
\echo '- 3个社区话题'
\echo '- 3个评估记录'
\echo '- 2个聊天会话'
\echo '- 系统配置项'
\echo ''
\echo '测试账号信息：'
\echo '  管理员：openid = admin_test_openid_001'
\echo '  用户1：openid = test_user_openid_002 (小明)'
\echo '  用户2：openid = test_user_openid_003 (小红)'
\echo '  VIP用户：openid = test_user_openid_004'
\echo '  新用户：openid = test_user_openid_005'
\echo '  游客：openid = guest_openid_006'
\echo ''
\echo '测试CDK码：'
\echo '  月卡：TEST-MONTH-2025-0001, TEST-MONTH-2025-0002'
\echo '  季卡：TEST-SEASON-2025-0001'
\echo '  年卡：TEST-YEAR-2025-0001'
\echo ''
\echo '========================================='

