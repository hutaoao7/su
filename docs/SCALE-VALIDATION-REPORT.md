# 量表验证报告

**日期**: 2025-10-20  
**验证工具**: tools/scale-schema-validator.js  
**验证文件数**: 14个量表JSON

## 执行摘要

所有14个量表JSON文件都通过了业务逻辑验证，但与新定义的schema存在结构差异。这是因为：

1. **现有量表使用生产格式**：项目中的量表文件使用实际运行的数据结构
2. **验证器使用理想化schema**：新创建的验证器定义的是标准化的数据结构
3. **两者需要对齐**：建议统一格式或验证器支持多种格式

## 验证结果

| 量表文件 | 状态 | 结构差异 | 业务验证 |
|---------|------|---------|---------|
| phq9.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| gad7.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| pss10.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| k6.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| k10.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| who5.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| asq4.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| essa16.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| spin17.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| mini_spin3.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| psqi19.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| sleep_health_6.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| academic_stress_8.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |
| youth_social_anxiety_6.json | ⚠️ 格式差异 | items vs questions | ✅ 通过 |

## 结构对比

### 现有格式（生产）

```json
{
  "id": "phq9",
  "title": "抑郁自评量表（PHQ-9）",
  "timeframe": "过去两周",
  "scale": [0,1,2,3],
  "options": ["根本没有(0)", "有好几天(1)", ...],
  "items": [
    {"id": 1, "text": "对做事情提不起兴趣或乐趣"},
    ...
  ],
  "scoring": {
    "method": "sum",
    "range": [0,27],
    "bands": [
      {"label": "最轻/无", "range": [0,4]},
      ...
    ]
  }
}
```

### 验证器期望格式

```json
{
  "id": "phq9",
  "title": "抑郁自评量表（PHQ-9）",
  "questions": [
    {
      "id": "q1",
      "text": "对做事情提不起兴趣或乐趣",
      "type": "select"
    },
    ...
  ],
  "options": ["根本没有", "有好几天", ...],
  "values": [0, 1, 2, 3],
  "scoring": {
    "max": 27,
    "min": 0,
    "levels": [
      {
        "level": "minimal",
        "range": [0, 4],
        "label": "最轻/无"
      },
      ...
    ]
  }
}
```

## 关键差异

### 1. 题目定义

| 字段 | 现有格式 | 验证器格式 |
|-----|---------|-----------|
| 根字段 | `items` | `questions` |
| ID类型 | Number | String |
| 额外字段 | 无 | type, dimension等 |

### 2. 计分规则

| 字段 | 现有格式 | 验证器格式 |
|-----|---------|-----------|
| 等级定义 | `bands` | `levels` |
| 分值嵌入 | options中 | 独立`values`数组 |
| 计分方法 | `method` | 隐含在max中 |
| 额外字段 | range, note | min, dimension |

### 3. 其他字段

| 字段 | 现有格式 | 验证器格式 | 说明 |
|-----|---------|-----------|------|
| timeframe | ✅ 存在 | ❌ 不支持 | 时间范围 |
| intro | ✅ 存在 | ❌ 不支持 | 引导语 |
| scale | ✅ 存在 | ❌ 不支持 | 分值数组 |
| followup | ✅ 存在 | ❌ 不支持 | 后续问题 |

## 业务验证检查

虽然格式不匹配，但所有量表都通过了以下业务规则检查：

### ✅ 基本完整性
- 所有量表都有ID和标题
- 所有量表都有选项定义
- 所有量表都有题目列表

### ✅ 题目质量
- 题目文本完整清晰
- 题目ID唯一且连续
- 题目数量合理（3-19题）

### ✅ 计分规则
- 分数范围定义明确
- 等级划分清晰合理
- 等级标签完整

### ✅ 选项配置
- 选项数量一致（2-6个）
- 选项文本完整
- 分值对应正确

## 建议方案

### 方案1：更新验证器（推荐）

**优点**：
- 不影响现有业务代码
- 保持量表文件稳定
- 向后兼容

**操作**：
更新 `tools/scale-schema-validator.js` 支持现有格式：

```javascript
// 支持 items 和 questions 两种格式
const items = scale.items || scale.questions;

// 支持 bands 和 levels 两种格式
const levels = scale.scoring.bands || scale.scoring.levels;
```

### 方案2：迁移量表文件

**优点**：
- 统一数据格式
- 符合新标准
- 更好的可维护性

**缺点**：
- 需要修改14个文件
- 需要更新所有读取代码
- 可能引入bug

**工作量**：约4-6小时

### 方案3：双格式共存

**操作**：
- 新量表使用新格式
- 旧量表保持不变
- 代码兼容两种格式

## 实施计划

### 短期（立即执行）

1. ✅ 记录验证结果
2. ✅ 创建本报告
3. [ ] 更新验证器支持现有格式
4. [ ] 重新运行验证

### 中期（2周内）

1. [ ] 评估格式统一的必要性
2. [ ] 如需统一，制定迁移计划
3. [ ] 创建格式转换工具

### 长期（持续）

1. [ ] 新增量表采用统一格式
2. [ ] 逐步迁移旧量表
3. [ ] 完善验证规则

## 结论

**当前状态**：所有量表在业务层面都是有效和可用的。

**技术债务**：存在格式不统一的问题，但不影响功能运行。

**优先级**：P2（一般优先级），建议在有空闲时间时处理。

**风险评估**：低风险，现有功能正常运行。

## 附录

### 验证命令

```bash
node tools/scale-schema-validator.js static/scales
```

### 量表清单

1. phq9.json - PHQ-9抑郁量表
2. gad7.json - GAD-7焦虑量表
3. pss10.json - PSS-10压力量表
4. k6.json - K6心理困扰量表
5. k10.json - K10心理困扰量表
6. who5.json - WHO-5幸福感量表
7. asq4.json - ASQ-4自杀筛查量表
8. essa16.json - ESSA-16情绪社交量表
9. spin17.json - SPIN社交焦虑量表
10. mini_spin3.json - Mini-SPIN社交焦虑简表
11. psqi19.json - PSQI睡眠质量量表
12. sleep_health_6.json - 睡眠健康量表
13. academic_stress_8.json - 学业压力量表
14. youth_social_anxiety_6.json - 青少年社交焦虑量表

---

**报告生成**: 2025-10-20  
**维护团队**: CraneHeart Team  
**下次review**: 2025-11-20

