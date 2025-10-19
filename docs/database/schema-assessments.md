# 评估相关表设计文档

## 文档信息
- **创建日期**: 2025-10-18
- **版本**: v1.0.0
- **维护人**: 后端开发团队

## 表结构清单

### 1. assessment_scales - 量表元数据表

#### 表说明
存储所有量表的元信息和配置。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| scale_id | varchar | 50 | 是 | - | 量表标识符（如phq9、gad7） |
| scale_name | varchar | 100 | 是 | - | 量表名称 |
| scale_name_en | varchar | 100 | 否 | null | 量表英文名 |
| category | varchar | 50 | 否 | 'mental_health' | 量表分类 |
| version | varchar | 20 | 否 | '1.0' | 量表版本 |
| question_count | int | - | 是 | - | 题目数量 |
| estimated_duration | int | - | 否 | 5 | 预计完成时间（分钟） |
| description | text | - | 否 | null | 量表描述 |
| instruction | text | - | 否 | null | 答题说明 |
| scoring_method | text | - | 是 | - | 评分方法说明 |
| reference_url | text | - | 否 | null | 参考资料链接 |
| is_active | boolean | - | 否 | true | 是否启用 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引
CREATE UNIQUE INDEX idx_assessment_scales_scale_id ON assessment_scales(scale_id);

-- 普通索引
CREATE INDEX idx_assessment_scales_category ON assessment_scales(category);
CREATE INDEX idx_assessment_scales_is_active ON assessment_scales(is_active);
```

#### 约束条件

```sql
ALTER TABLE assessment_scales 
ADD CONSTRAINT check_question_count 
CHECK (question_count > 0 AND question_count <= 100);

ALTER TABLE assessment_scales 
ADD CONSTRAINT check_estimated_duration 
CHECK (estimated_duration > 0 AND estimated_duration <= 120);
```

---

### 2. assessments - 评估记录表

#### 表说明
存储用户的评估记录主表。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| user_id | uuid | - | 是 | - | 用户ID（外键） |
| scale_id | varchar | 50 | 是 | - | 量表标识符 |
| session_id | varchar | 100 | 否 | null | 会话ID（用于关联答题会话） |
| total_score | decimal | 10,2 | 否 | null | 总分 |
| level | varchar | 50 | 否 | null | 等级（如轻度、中度、重度） |
| completion_time | int | - | 否 | null | 完成时长（秒） |
| status | varchar | 20 | 否 | 'draft' | 状态（draft/completed/abandoned） |
| started_at | timestamptz | - | 否 | now() | 开始时间 |
| completed_at | timestamptz | - | 否 | null | 完成时间 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 普通索引
CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_scale_id ON assessments(scale_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);

-- 复合索引（用于查询用户的特定量表记录）
CREATE INDEX idx_assessments_user_scale ON assessments(user_id, scale_id, created_at DESC);

-- 复合索引（用于查询已完成的评估）
CREATE INDEX idx_assessments_completed ON assessments(user_id, completed_at DESC) WHERE status = 'completed';
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

ALTER TABLE assessments 
ADD CONSTRAINT fk_assessments_scale_id 
FOREIGN KEY (scale_id) 
REFERENCES assessment_scales(scale_id) 
ON DELETE RESTRICT;

-- 检查约束
ALTER TABLE assessments 
ADD CONSTRAINT check_status 
CHECK (status IN ('draft', 'completed', 'abandoned'));

ALTER TABLE assessments 
ADD CONSTRAINT check_completion_time 
CHECK (completion_time IS NULL OR completion_time >= 0);
```

---

### 3. assessment_answers - 评估答案详情表

#### 表说明
存储每次评估的具体答题数据。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| assessment_id | uuid | - | 是 | - | 评估记录ID（外键） |
| question_id | varchar | 50 | 是 | - | 题目ID |
| question_text | text | - | 否 | null | 题目文本（快照） |
| answer_value | text | - | 是 | - | 答案值 |
| answer_text | text | - | 否 | null | 答案文本（快照） |
| answer_score | decimal | 10,2 | 否 | null | 单题得分 |
| answer_time | int | - | 否 | null | 答题耗时（秒） |
| created_at | timestamptz | - | 是 | now() | 答题时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 普通索引
CREATE INDEX idx_assessment_answers_assessment_id ON assessment_answers(assessment_id);
CREATE INDEX idx_assessment_answers_question_id ON assessment_answers(question_id);

-- 唯一索引（一次评估中每个题目只能有一个答案）
CREATE UNIQUE INDEX idx_assessment_answers_unique 
ON assessment_answers(assessment_id, question_id);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE assessment_answers 
ADD CONSTRAINT fk_assessment_answers_assessment_id 
FOREIGN KEY (assessment_id) 
REFERENCES assessments(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE assessment_answers 
ADD CONSTRAINT check_answer_time 
CHECK (answer_time IS NULL OR answer_time >= 0);
```

---

### 4. assessment_results - 评估结果统计表

#### 表说明
存储评估结果的统计分析数据和建议。

#### 字段定义

| 字段名 | 类型 | 长度 | 是否必填 | 默认值 | 说明 |
|--------|------|------|----------|--------|------|
| id | uuid | - | 是 | uuid_generate_v4() | 主键 |
| assessment_id | uuid | - | 是 | - | 评估记录ID（外键） |
| user_id | uuid | - | 是 | - | 用户ID（冗余，便于查询） |
| scale_id | varchar | 50 | 是 | - | 量表ID（冗余） |
| total_score | decimal | 10,2 | 是 | - | 总分 |
| max_score | decimal | 10,2 | 否 | null | 最高可能分数 |
| score_percentage | decimal | 5,2 | 否 | null | 得分百分比 |
| level | varchar | 50 | 否 | null | 风险等级 |
| level_description | text | - | 否 | null | 等级描述 |
| suggestions | jsonb | - | 否 | null | 建议列表（JSON数组） |
| risk_factors | jsonb | - | 否 | null | 风险因素（JSON数组） |
| strengths | jsonb | - | 否 | null | 优势项（JSON数组） |
| dimension_scores | jsonb | - | 否 | null | 维度分数（JSON对象） |
| compared_to_avg | decimal | 10,2 | 否 | null | 与平均值比较 |
| created_at | timestamptz | - | 是 | now() | 创建时间 |
| updated_at | timestamptz | - | 是 | now() | 更新时间 |

#### 索引策略

```sql
-- 主键索引
PRIMARY KEY (id)

-- 唯一索引（一个评估只有一个结果）
CREATE UNIQUE INDEX idx_assessment_results_assessment_id ON assessment_results(assessment_id);

-- 普通索引
CREATE INDEX idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX idx_assessment_results_scale_id ON assessment_results(scale_id);
CREATE INDEX idx_assessment_results_level ON assessment_results(level);
CREATE INDEX idx_assessment_results_created_at ON assessment_results(created_at DESC);

-- JSONB索引
CREATE INDEX idx_assessment_results_suggestions ON assessment_results USING GIN (suggestions);
CREATE INDEX idx_assessment_results_dimension_scores ON assessment_results USING GIN (dimension_scores);
```

#### 约束条件

```sql
-- 外键约束
ALTER TABLE assessment_results 
ADD CONSTRAINT fk_assessment_results_assessment_id 
FOREIGN KEY (assessment_id) 
REFERENCES assessments(id) 
ON DELETE CASCADE;

ALTER TABLE assessment_results 
ADD CONSTRAINT fk_assessment_results_user_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- 检查约束
ALTER TABLE assessment_results 
ADD CONSTRAINT check_score_percentage 
CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100));
```

---

## 数据迁移脚本

```sql
-- 1. 创建assessment_scales表
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
  
  CONSTRAINT check_question_count CHECK (question_count > 0 AND question_count <= 100),
  CONSTRAINT check_estimated_duration CHECK (estimated_duration > 0 AND estimated_duration <= 120)
);

CREATE UNIQUE INDEX idx_assessment_scales_scale_id ON assessment_scales(scale_id);
CREATE INDEX idx_assessment_scales_category ON assessment_scales(category);
CREATE INDEX idx_assessment_scales_is_active ON assessment_scales(is_active);

-- 2. 创建assessments表
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
  CONSTRAINT check_status CHECK (status IN ('draft', 'completed', 'abandoned')),
  CONSTRAINT check_completion_time CHECK (completion_time IS NULL OR completion_time >= 0)
);

CREATE INDEX idx_assessments_user_id ON assessments(user_id);
CREATE INDEX idx_assessments_scale_id ON assessments(scale_id);
CREATE INDEX idx_assessments_status ON assessments(status);
CREATE INDEX idx_assessments_created_at ON assessments(created_at DESC);
CREATE INDEX idx_assessments_user_scale ON assessments(user_id, scale_id, created_at DESC);
CREATE INDEX idx_assessments_completed ON assessments(user_id, completed_at DESC) WHERE status = 'completed';

-- 3. 创建assessment_answers表
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
  CONSTRAINT check_answer_time CHECK (answer_time IS NULL OR answer_time >= 0)
);

CREATE INDEX idx_assessment_answers_assessment_id ON assessment_answers(assessment_id);
CREATE INDEX idx_assessment_answers_question_id ON assessment_answers(question_id);
CREATE UNIQUE INDEX idx_assessment_answers_unique ON assessment_answers(assessment_id, question_id);

-- 4. 创建assessment_results表
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
  CONSTRAINT check_score_percentage CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100))
);

CREATE UNIQUE INDEX idx_assessment_results_assessment_id ON assessment_results(assessment_id);
CREATE INDEX idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX idx_assessment_results_scale_id ON assessment_results(scale_id);
CREATE INDEX idx_assessment_results_level ON assessment_results(level);
CREATE INDEX idx_assessment_results_created_at ON assessment_results(created_at DESC);
CREATE INDEX idx_assessment_results_suggestions ON assessment_results USING GIN (suggestions);
CREATE INDEX idx_assessment_results_dimension_scores ON assessment_results USING GIN (dimension_scores);
```

---

## 种子数据

### 导入量表元数据

```sql
-- 导入14个量表的元数据
INSERT INTO assessment_scales (scale_id, scale_name, scale_name_en, category, question_count, estimated_duration, description, scoring_method) VALUES

-- PHQ-9: 抑郁症筛查量表
('phq9', 'PHQ-9 抑郁症筛查量表', 'Patient Health Questionnaire-9', 'depression', 9, 3, 
'PHQ-9是用于筛查抑郁症的标准化工具，包含9个问题。', 
'总分0-4分：无抑郁症状；5-9分：轻度抑郁；10-14分：中度抑郁；15-19分：中重度抑郁；20-27分：重度抑郁'),

-- GAD-7: 广泛性焦虑量表
('gad7', 'GAD-7 广泛性焦虑量表', 'Generalized Anxiety Disorder-7', 'anxiety', 7, 3, 
'GAD-7是用于筛查广泛性焦虑障碍的简短量表。', 
'总分0-4分：正常；5-9分：轻度焦虑；10-14分：中度焦虑；15-21分：重度焦虑'),

-- PSS-10: 知觉压力量表
('pss10', 'PSS-10 知觉压力量表', 'Perceived Stress Scale-10', 'stress', 10, 4, 
'PSS-10用于测量个体在过去一个月中对压力的知觉程度。', 
'总分0-13分：低压力；14-26分：中等压力；27-40分：高压力'),

-- WHO-5: 幸福感指数量表
('who5', 'WHO-5 幸福感指数', 'WHO-5 Well-Being Index', 'wellbeing', 5, 2, 
'WHO-5是世界卫生组织推荐的简短幸福感测量工具。', 
'总分0-25分，分数越高表示幸福感越强，<13分可能需要关注'),

-- K6: 心理困扰量表
('k6', 'K6 心理困扰量表', 'Kessler Psychological Distress Scale', 'distress', 6, 3, 
'K6用于评估非特异性心理困扰程度。', 
'总分0-12分：正常；13-18分：轻度困扰；19-24分：重度困扰'),

-- K10: 心理困扰量表（扩展版）
('k10', 'K10 心理困扰量表', 'Kessler Psychological Distress Scale-10', 'distress', 10, 4, 
'K10是K6的扩展版本，包含更多题目。', 
'总分10-19分：低水平困扰；20-24分：轻度困扰；25-29分：中度困扰；30-50分：重度困扰'),

-- ASQ-4: 自杀风险筛查
('asq4', 'ASQ-4 自杀风险筛查', 'Ask Suicide-Screening Questions', 'crisis', 4, 2, 
'ASQ-4用于快速筛查自杀风险。', 
'任何一题回答"是"即提示存在风险，需要专业干预'),

-- 学业压力量表
('academic_stress_8', '学业压力量表（8题）', 'Academic Stress Scale', 'stress', 8, 3, 
'评估大学生学业相关的压力水平。', 
'总分8-16分：低压力；17-24分：中等压力；25-32分：高压力'),

-- 社交焦虑量表
('youth_social_anxiety_6', '青少年社交焦虑量表（6题）', 'Youth Social Anxiety Scale', 'anxiety', 6, 3, 
'评估青少年在社交场合的焦虑程度。', 
'总分6-12分：正常；13-18分：轻度焦虑；19-24分：中度焦虑；25-30分：重度焦虑'),

-- 睡眠健康量表
('sleep_health_6', '睡眠健康量表（6题）', 'Sleep Health Scale', 'sleep', 6, 3, 
'评估睡眠质量和睡眠相关问题。', 
'总分6-12分：睡眠质量优；13-18分：一般；19-24分：较差；25-30分：很差'),

-- Mini-SPIN: 社交恐惧症筛查（精简版）
('mini_spin3', 'Mini-SPIN 社交恐惧症筛查', 'Mini Social Phobia Inventory', 'anxiety', 3, 2, 
'快速筛查社交恐惧症的简短量表。', 
'总分≥6分提示可能存在社交恐惧症'),

-- SPIN-17: 社交恐惧症量表（完整版）
('spin17', 'SPIN-17 社交恐惧症量表', 'Social Phobia Inventory', 'anxiety', 17, 6, 
'完整版社交恐惧症评估工具。', 
'总分0-20分：正常；21-30分：轻度；31-40分：中度；41-68分：重度'),

-- ESSA-16: 学业倦怠量表
('essa16', 'ESSA-16 学业倦怠量表', 'Educational-Study Satisfaction Assessment', 'burnout', 16, 5, 
'评估学生的学业倦怠程度。', 
'总分16-32分：无倦怠；33-48分：轻度；49-64分：中度；65-80分：重度'),

-- PSQI-19: 睡眠质量指数
('psqi19', 'PSQI-19 睡眠质量指数', 'Pittsburgh Sleep Quality Index', 'sleep', 19, 8, 
'评估过去一个月的睡眠质量。', 
'总分0-5分：睡眠质量很好；6-10分：一般；11-15分：较差；16-21分：很差');
```

---

## 数据清理策略

### 自动清理草稿评估（30天未完成）

```sql
-- 删除30天未完成的草稿评估
DELETE FROM assessments 
WHERE status = 'draft' 
AND created_at < now() - interval '30 days';
```

### 归档旧评估数据（1年前）

```sql
-- 创建归档表
CREATE TABLE assessments_archive (LIKE assessments INCLUDING ALL);

-- 移动1年前的数据
INSERT INTO assessments_archive 
SELECT * FROM assessments 
WHERE created_at < now() - interval '1 year';

DELETE FROM assessments 
WHERE created_at < now() - interval '1 year';
```

---

## 统计查询示例

### 1. 用户评估完成率

```sql
SELECT 
  u.id,
  u.nickname,
  COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed') as completed_count,
  COUNT(DISTINCT a.id) as total_count,
  ROUND(COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'completed')::decimal / NULLIF(COUNT(DISTINCT a.id), 0) * 100, 2) as completion_rate
FROM users u
LEFT JOIN assessments a ON a.user_id = u.id
GROUP BY u.id, u.nickname;
```

### 2. 量表使用统计

```sql
SELECT 
  s.scale_id,
  s.scale_name,
  COUNT(a.id) as total_assessments,
  COUNT(a.id) FILTER (WHERE a.status = 'completed') as completed_assessments,
  AVG(a.completion_time) FILTER (WHERE a.status = 'completed') as avg_completion_time,
  AVG(r.total_score) FILTER (WHERE a.status = 'completed') as avg_score
FROM assessment_scales s
LEFT JOIN assessments a ON a.scale_id = s.scale_id
LEFT JOIN assessment_results r ON r.assessment_id = a.id
GROUP BY s.scale_id, s.scale_name
ORDER BY total_assessments DESC;
```

### 3. 用户压力趋势分析

```sql
SELECT 
  DATE_TRUNC('week', a.completed_at) as week,
  AVG(r.total_score) as avg_score,
  COUNT(*) as assessment_count
FROM assessments a
JOIN assessment_results r ON r.assessment_id = a.id
WHERE a.user_id = :user_id
AND a.scale_id = 'pss10'
AND a.status = 'completed'
AND a.completed_at >= now() - interval '3 months'
GROUP BY DATE_TRUNC('week', a.completed_at)
ORDER BY week DESC;
```

---

## 性能优化建议

### 1. 分区策略
对于评估数据量大的场景，建议对assessments表按月分区：

```sql
CREATE TABLE assessments (
  id uuid DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  scale_id varchar(50) NOT NULL,
  -- ...其他字段
  created_at timestamptz DEFAULT now()
) PARTITION BY RANGE (created_at);

-- 创建月度分区
CREATE TABLE assessments_2025_10 PARTITION OF assessments
FOR VALUES FROM ('2025-10-01') TO ('2025-11-01');
```

### 2. 索引优化
- 经常查询的字段组合创建复合索引
- JSONB字段使用GIN索引
- 大表避免全表扫描

### 3. 数据归档
- 定期归档1年前的历史数据
- 保留最近数据在主表以保证查询性能

---

## 安全注意事项

### 1. 数据脱敏
- 查询答案内容时需要脱敏处理
- 导出数据时移除敏感信息

### 2. 访问控制
- 用户只能查询自己的评估记录
- 管理员可查询统计数据，但不可见具体答案

### 3. 数据保留
- 用户注销时，评估数据可选择：
  - 匿名化保留（用于统计）
  - 完全删除（符合GDPR）

---

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本，包含4个核心表 | 开发团队 |

---

**维护说明**: 本文档需要随着评估功能扩展及时更新量表元数据。

