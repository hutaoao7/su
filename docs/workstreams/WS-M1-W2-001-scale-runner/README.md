# WS-M1-W2-001: 量表执行器组件完善

**工作流ID**: WS-M1-W2-001  
**标题**: 完善ScaleRunner组件，支持所有题型  
**分支**: `feat/WS-M1-W2-001-scale-runner`  
**阶段**: M1-Week2 评估功能  
**负责人**: 前端A  
**预计工时**: 8h

---

## 工作流概述

### 目标
完善 `components/scale/ScaleRunner.vue` 组件，确保支持所有题型，提供稳定的量表执行核心能力。

### 现状分析

**components/scale/ScaleRunner.vue**（约830行，已实现）:
- ✅ 支持select选择题（单选）
- ✅ 支持time时间输入题
- ✅ 支持number数字输入题
- ✅ 进度条显示
- ✅ 上一题/下一题导航
- ⚠️ 使用u-input（uView，依赖WS-M0-001）
- ✅ 题目数据从static/scales/*.json加载
- ✅ 调用utils/scoring.js进行评分

**utils/scoring.js**（已实现）:
- ✅ scoreUnified统一评分函数
- ✅ 支持14个量表
- ✅ 返回score+level

**static/scales/（14个JSON文件）**:
- ✅ academic_stress_8.json
- ✅ gad7.json
- ✅ phq9.json
- ✅ 其他11个量表

**结论**: ✅ **直接复用为主，小改为辅**

---

## 核心任务

1. ✅ 验证ScaleRunner支持所有题型
2. ✅ 验证14个量表JSON格式正确
3. ✅ 补充进度保存与恢复功能
4. ✅ 优化用户体验（加载状态、错误提示）
5. ✅ 单元测试覆盖

---

## 依赖关系

**前置**: WS-M0-001（uView统一，ScaleRunner使用u-input）  
**后置**: WS-M1-W2-002（评估页面集成），WS-M1-W2-003（评分逻辑验证）

---

## 风险提示

| 风险项 | 可能性 | 影响度 | 缓解措施 | 状态 |
|--------|--------|--------|----------|------|
| 量表JSON格式错误 | 中 | 高 | 逐个验证+schema校验 | ⬜ 待验证 |
| u-input组件问题 | 低 | 中 | WS-M0-001已解决 | ⬜ 待验证 |
| 进度保存失败 | 中 | 低 | try-catch+降级 | ⬜ 待验证 |

---

**文档版本**: v1.0  
**创建日期**: 2025-10-12

