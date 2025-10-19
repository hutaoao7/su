-- ============================================================================
-- 数据库迁移脚本：评估相关表
-- 版本：v1.0.0
-- 创建日期：2025-10-18
-- 描述：创建assessment_scales、assessments、assessment_answers、assessment_results表
-- ============================================================================

-- ============================================================================
-- 1. 创建assessment_scales表（量表元数据）
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_scales (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  scale_id varchar(50) NOT NULL,
  scale_name varchar(100) NOT NULL,
  scale_name_en varchar(100),
  category varchar(50) DEFAULT 'mental_health',
  version varchar(20) DEFAULT '1.0',
  question_count int NOT NULL,
  estimated_duration int DEFAULT 5,
  description text,
  instruction text,
  scoring_method text NOT NULL,
  reference_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT check_assessment_scales_question_count CHECK (question_count > 0 AND question_count <= 100),
  CONSTRAINT check_assessment_scales_estimated_duration CHECK (estimated_duration > 0 AND estimated_duration <= 120)
);

-- 创建注释
COMMENT ON TABLE assessment_scales IS '量表元数据表';
COMMENT ON COLUMN assessment_scales.scale_id IS '量表标识符（如phq9、gad7）';
COMMENT ON COLUMN assessment_scales.question_count IS '题目数量';
COMMENT ON COLUMN assessment_scales.estimated_duration IS '预计完成时间（分钟）';
COMMENT ON COLUMN assessment_scales.scoring_method IS '评分方法说明';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_scales_scale_id ON assessment_scales(scale_id);
CREATE INDEX IF NOT EXISTS idx_assessment_scales_category ON assessment_scales(category);
CREATE INDEX IF NOT EXISTS idx_assessment_scales_is_active ON assessment_scales(is_active);

-- ============================================================================
-- 2. 创建assessments表（评估记录）
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  scale_id varchar(50) NOT NULL,
  session_id varchar(100),
  total_score decimal(10,2),
  level varchar(50),
  completion_time int,
  status varchar(20) DEFAULT 'draft',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_assessments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessments_scale_id FOREIGN KEY (scale_id) REFERENCES assessment_scales(scale_id) ON DELETE RESTRICT,
  CONSTRAINT check_assessments_status CHECK (status IN ('draft', 'completed', 'abandoned')),
  CONSTRAINT check_assessments_completion_time CHECK (completion_time IS NULL OR completion_time >= 0)
);

-- 创建注释
COMMENT ON TABLE assessments IS '评估记录主表';
COMMENT ON COLUMN assessments.status IS '状态（draft/completed/abandoned）';
COMMENT ON COLUMN assessments.completion_time IS '完成时长（秒）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_scale_id ON assessments(scale_id);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_user_scale ON assessments(user_id, scale_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessments_completed ON assessments(user_id, completed_at DESC) WHERE status = 'completed';

-- ============================================================================
-- 3. 创建assessment_answers表（答案详情）
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_answers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id uuid NOT NULL,
  question_id varchar(50) NOT NULL,
  question_text text,
  answer_value text NOT NULL,
  answer_text text,
  answer_score decimal(10,2),
  answer_time int,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_assessment_answers_assessment_id FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT check_assessment_answers_answer_time CHECK (answer_time IS NULL OR answer_time >= 0)
);

-- 创建注释
COMMENT ON TABLE assessment_answers IS '评估答案详情表';
COMMENT ON COLUMN assessment_answers.answer_time IS '答题耗时（秒）';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment_id ON assessment_answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question_id ON assessment_answers(question_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_answers_unique ON assessment_answers(assessment_id, question_id);

-- ============================================================================
-- 4. 创建assessment_results表（结果统计）
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessment_results (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  scale_id varchar(50) NOT NULL,
  total_score decimal(10,2) NOT NULL,
  max_score decimal(10,2),
  score_percentage decimal(5,2),
  level varchar(50),
  level_description text,
  suggestions jsonb,
  risk_factors jsonb,
  strengths jsonb,
  dimension_scores jsonb,
  compared_to_avg decimal(10,2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_assessment_results_assessment_id FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE,
  CONSTRAINT fk_assessment_results_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT check_assessment_results_score_percentage CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100))
);

-- 创建注释
COMMENT ON TABLE assessment_results IS '评估结果统计表';
COMMENT ON COLUMN assessment_results.suggestions IS '建议列表（JSON数组）';
COMMENT ON COLUMN assessment_results.dimension_scores IS '维度分数（JSON对象）';

-- 创建索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_scale_id ON assessment_results(scale_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_level ON assessment_results(level);
CREATE INDEX IF NOT EXISTS idx_assessment_results_created_at ON assessment_results(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_assessment_results_suggestions ON assessment_results USING GIN (suggestions);
CREATE INDEX IF NOT EXISTS idx_assessment_results_dimension_scores ON assessment_results USING GIN (dimension_scores);

-- ============================================================================
-- 创建触发器
-- ============================================================================

-- 自动更新updated_at
DROP TRIGGER IF EXISTS update_assessments_updated_at ON assessments;
CREATE TRIGGER update_assessments_updated_at 
BEFORE UPDATE ON assessments 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_assessment_results_updated_at ON assessment_results;
CREATE TRIGGER update_assessment_results_updated_at 
BEFORE UPDATE ON assessment_results 
FOR EACH ROW 
EXECUTE PROCEDURE update_updated_at_column();

-- ============================================================================
-- 插入量表元数据
-- ============================================================================

INSERT INTO assessment_scales (scale_id, scale_name, scale_name_en, category, question_count, estimated_duration, description, scoring_method) VALUES

('phq9', 'PHQ-9 抑郁症筛查量表', 'Patient Health Questionnaire-9', 'depression', 9, 3, 
'PHQ-9是用于筛查抑郁症的标准化工具，包含9个问题。', 
'总分0-4分：无抑郁症状；5-9分：轻度抑郁；10-14分：中度抑郁；15-19分：中重度抑郁；20-27分：重度抑郁'),

('gad7', 'GAD-7 广泛性焦虑量表', 'Generalized Anxiety Disorder-7', 'anxiety', 7, 3, 
'GAD-7是用于筛查广泛性焦虑障碍的简短量表。', 
'总分0-4分：正常；5-9分：轻度焦虑；10-14分：中度焦虑；15-21分：重度焦虑'),

('pss10', 'PSS-10 知觉压力量表', 'Perceived Stress Scale-10', 'stress', 10, 4, 
'PSS-10用于测量个体在过去一个月中对压力的知觉程度。', 
'总分0-13分：低压力；14-26分：中等压力；27-40分：高压力'),

('who5', 'WHO-5 幸福感指数', 'WHO-5 Well-Being Index', 'wellbeing', 5, 2, 
'WHO-5是世界卫生组织推荐的简短幸福感测量工具。', 
'总分0-25分，分数越高表示幸福感越强，<13分可能需要关注'),

('k6', 'K6 心理困扰量表', 'Kessler Psychological Distress Scale', 'distress', 6, 3, 
'K6用于评估非特异性心理困扰程度。', 
'总分0-12分：正常；13-18分：轻度困扰；19-24分：重度困扰'),

('k10', 'K10 心理困扰量表', 'Kessler Psychological Distress Scale-10', 'distress', 10, 4, 
'K10是K6的扩展版本，包含更多题目。', 
'总分10-19分：低水平困扰；20-24分：轻度困扰；25-29分：中度困扰；30-50分：重度困扰'),

('asq4', 'ASQ-4 自杀风险筛查', 'Ask Suicide-Screening Questions', 'crisis', 4, 2, 
'ASQ-4用于快速筛查自杀风险。', 
'任何一题回答"是"即提示存在风险，需要专业干预'),

('academic_stress_8', '学业压力量表（8题）', 'Academic Stress Scale', 'stress', 8, 3, 
'评估大学生学业相关的压力水平。', 
'总分8-16分：低压力；17-24分：中等压力；25-32分：高压力'),

('youth_social_anxiety_6', '青少年社交焦虑量表（6题）', 'Youth Social Anxiety Scale', 'anxiety', 6, 3, 
'评估青少年在社交场合的焦虑程度。', 
'总分6-12分：正常；13-18分：轻度焦虑；19-24分：中度焦虑；25-30分：重度焦虑'),

('sleep_health_6', '睡眠健康量表（6题）', 'Sleep Health Scale', 'sleep', 6, 3, 
'评估睡眠质量和睡眠相关问题。', 
'总分6-12分：睡眠质量优；13-18分：一般；19-24分：较差；25-30分：很差'),

('mini_spin3', 'Mini-SPIN 社交恐惧症筛查', 'Mini Social Phobia Inventory', 'anxiety', 3, 2, 
'快速筛查社交恐惧症的简短量表。', 
'总分≥6分提示可能存在社交恐惧症'),

('spin17', 'SPIN-17 社交恐惧症量表', 'Social Phobia Inventory', 'anxiety', 17, 6, 
'完整版社交恐惧症评估工具。', 
'总分0-20分：正常；21-30分：轻度；31-40分：中度；41-68分：重度'),

('essa16', 'ESSA-16 学业倦怠量表', 'Educational-Study Satisfaction Assessment', 'burnout', 16, 5, 
'评估学生的学业倦怠程度。', 
'总分16-32分：无倦怠；33-48分：轻度；49-64分：中度；65-80分：重度'),

('psqi19', 'PSQI-19 睡眠质量指数', 'Pittsburgh Sleep Quality Index', 'sleep', 19, 8, 
'评估过去一个月的睡眠质量。', 
'总分0-5分：睡眠质量很好；6-10分：一般；11-15分：较差；16-21分：很差')

ON CONFLICT (scale_id) DO NOTHING;

-- ============================================================================
-- 验证数据
-- ============================================================================

SELECT '✅ 评估相关表迁移完成' as status;

SELECT 
  'assessment_scales' as table_name,
  COUNT(*) as record_count
FROM assessment_scales
UNION ALL
SELECT 
  'assessments',
  COUNT(*)
FROM assessments
UNION ALL
SELECT 
  'assessment_answers',
  COUNT(*)
FROM assessment_answers
UNION ALL
SELECT 
  'assessment_results',
  COUNT(*)
FROM assessment_results;


