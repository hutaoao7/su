# 量表数据一致性检查报告

**生成时间**: 2025-10-20T03:24:34.633Z
**检查工具**: scale-consistency-checker.js

---

## 📊 汇总统计

| 项目 | 数量 |
|------|------|
| 总量表数 | 14 |
| 有效量表 | 0 |
| 错误数量 | 1 |
| 警告数量 | 19 |
| 提示数量 | 0 |

## 🎯 检查结论

❌ **未通过** - 发现严重错误，需要修复

---

## ❌ 错误（1个）

### psqi19

1. **question_count**: 题目数量不匹配: 实际9题，期望19题
   - 💡 建议: 确保JSON中的题目数量与数据库定义一致

## ⚠️ 警告（19个）

### phq9

1. **title**: 量表名称不一致
      JSON: 抑郁自评量表（PHQ-9/PHQ-A）
      DB:   PHQ-9 抑郁症筛查量表
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### gad7

1. **title**: 量表名称不一致
      JSON: 广泛性焦虑量表（GAD-7）
      DB:   GAD-7 广泛性焦虑量表
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

2. **bands**: 首个等级范围不是从0开始
   - 💡 建议: 确保等级范围覆盖完整分数范围

### pss10

1. **title**: 量表名称不一致
      JSON: 知觉压力量表（PSS-10）
      DB:   PSS-10 知觉压力量表
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### who5

1. **title**: 量表名称不一致
      JSON: 世界卫生组织五项幸福感指数（WHO-5）
      DB:   WHO-5 幸福感指数
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### k6

1. **title**: 量表名称不一致
      JSON: K6 心理痛苦量表
      DB:   K6 心理困扰量表
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### k10

1. **title**: 量表名称不一致
      JSON: K10 心理痛苦量表
      DB:   K10 心理困扰量表
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### asq4

1. **title**: 量表名称不一致
      JSON: 自杀风险快速筛查（ASQ）
      DB:   ASQ-4 自杀风险筛查
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### academic_stress_8

1. **title**: 量表名称不一致
      JSON: 学业压力简表（试用版）
      DB:   学业压力量表（8题）
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### youth_social_anxiety_6

1. **title**: 量表名称不一致
      JSON: 青少年社交焦虑简表（试用版）
      DB:   青少年社交焦虑量表（6题）
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### sleep_health_6

1. **title**: 量表名称不一致
      JSON: 睡眠健康简表（试用版）
      DB:   睡眠健康量表（6题）
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

### mini_spin3

1. **title**: 量表名称不一致
      JSON: 社交焦虑快筛（Mini-SPIN）
      DB:   Mini-SPIN 社交恐惧症筛查
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

2. **scoring**: 缺少评分规则定义
   - 💡 建议: 添加scoring字段定义评分规则

### spin17

1. **title**: 量表名称不一致
      JSON: 社交焦虑量表（SPIN-17）
      DB:   SPIN-17 社交恐惧症量表
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

2. **scoring**: 缺少评分规则定义
   - 💡 建议: 添加scoring字段定义评分规则

### essa16

1. **title**: 量表名称不一致
      JSON: 学业压力自评（ESSA-16）
      DB:   ESSA-16 学业倦怠量表
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

2. **scoring**: 缺少评分规则定义
   - 💡 建议: 添加scoring字段定义评分规则

### psqi19

1. **title**: 量表名称不一致
      JSON: 匹兹堡睡眠质量指数（PSQI-19）
      DB:   PSQI-19 睡眠质量指数
   - 💡 建议: 确保JSON中的title与数据库中的scale_name一致

2. **scoring**: 缺少评分规则定义
   - 💡 建议: 添加scoring字段定义评分规则

---

## 📋 量表清单

| 量表ID | JSON文件 | 数据库元数据 | 题目数量 | 状态 |
|--------|----------|--------------|----------|------|
| phq9 | ✓ | ✓ | 9/9 | ✅ |
| gad7 | ✓ | ✓ | 7/7 | ✅ |
| pss10 | ✓ | ✓ | 10/10 | ✅ |
| who5 | ✓ | ✓ | 5/5 | ✅ |
| k6 | ✓ | ✓ | 6/6 | ✅ |
| k10 | ✓ | ✓ | 10/10 | ✅ |
| asq4 | ✓ | ✓ | 4/4 | ✅ |
| academic_stress_8 | ✓ | ✓ | 8/8 | ✅ |
| youth_social_anxiety_6 | ✓ | ✓ | 6/6 | ✅ |
| sleep_health_6 | ✓ | ✓ | 6/6 | ✅ |
| mini_spin3 | ✓ | ✓ | 3/3 | ✅ |
| spin17 | ✓ | ✓ | 17/17 | ✅ |
| essa16 | ✓ | ✓ | 16/16 | ✅ |
| psqi19 | ✓ | ✓ | 9/19 | ❌ |

---

## 📌 修复建议

### 高优先级（错误）

1. [psqi19] 题目数量不匹配: 实际9题，期望19题
   - 确保JSON中的题目数量与数据库定义一致

### 中优先级（警告）

1. [phq9] 量表名称不一致
      JSON: 抑郁自评量表（PHQ-9/PHQ-A）
      DB:   PHQ-9 抑郁症筛查量表
2. [gad7] 量表名称不一致
      JSON: 广泛性焦虑量表（GAD-7）
      DB:   GAD-7 广泛性焦虑量表
3. [pss10] 量表名称不一致
      JSON: 知觉压力量表（PSS-10）
      DB:   PSS-10 知觉压力量表
4. [who5] 量表名称不一致
      JSON: 世界卫生组织五项幸福感指数（WHO-5）
      DB:   WHO-5 幸福感指数
5. [k6] 量表名称不一致
      JSON: K6 心理痛苦量表
      DB:   K6 心理困扰量表
6. [k10] 量表名称不一致
      JSON: K10 心理痛苦量表
      DB:   K10 心理困扰量表
7. [asq4] 量表名称不一致
      JSON: 自杀风险快速筛查（ASQ）
      DB:   ASQ-4 自杀风险筛查
8. [academic_stress_8] 量表名称不一致
      JSON: 学业压力简表（试用版）
      DB:   学业压力量表（8题）
9. [youth_social_anxiety_6] 量表名称不一致
      JSON: 青少年社交焦虑简表（试用版）
      DB:   青少年社交焦虑量表（6题）
10. [sleep_health_6] 量表名称不一致
      JSON: 睡眠健康简表（试用版）
      DB:   睡眠健康量表（6题）
... 还有 9 个警告

---

**报告生成**: 由 scale-consistency-checker.js 自动生成
