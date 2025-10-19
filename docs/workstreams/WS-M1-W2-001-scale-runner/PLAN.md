# WS-M1-W2-001: 量表执行器 - 计划文档

**工作流ID**: WS-M1-W2-001 | **工时**: 8h | **复用策略**: 验证为主+小改

---

## 输入/输出

**输入**:
- `components/scale/ScaleRunner.vue` (830行，已实现)
- `utils/scoring.js` (已实现)
- `static/scales/*.json` (14个量表文件)

**输出**:
- ✅ ScaleRunner所有题型验证通过
- ✅ 14个量表数据验证通过
- ✅ 进度保存功能完善
- ✅ 错误处理优化
- ✅ 单元测试覆盖（14个量表）

---

## 触点文件

### 复用验证（主要）

| 文件 | 行数 | 功能 | 验证重点 |
|------|------|------|----------|
| components/scale/ScaleRunner.vue | 830 | 量表执行器 | 题型支持、导航、提交 |
| utils/scoring.js | - | 评分逻辑 | 14个量表评分正确性 |
| static/scales/*.json | - | 量表数据 | JSON格式、字段完整 |

### 小改（可选优化）

| 文件 | 优化内容 | 工时 |
|------|----------|------|
| ScaleRunner.vue | 进度保存优化、错误提示 | 2h |

---

## 数据流

```
pages/assess/xxx/index.vue
  ↓
<ScaleRunner scaleId="gad7" title="GAD-7" />
  ↓
ScaleRunner.onLoad()
  ├─ 加载量表JSON：uni.request(`/static/scales/${scaleId}.json`)
  ├─ 初始化answers: {}
  └─ 加载已保存进度（如有）
  ↓
用户答题
  ├─ selectOption(questionId, value)
  └─ answers[questionId] = value
  ↓
用户点击"提交"
  ├─ 检查所有题目已答
  ├─ 调用scoring.js评分：scoreUnified(scaleId, answers)
  ├─ 返回：{ score, level, scaleId }
  └─ $emit('complete', result)
  ↓
父页面接收complete事件
  ├─ 保存结果到storage/Supabase
  └─ 跳转结果页
```

---

## 验证计划

### 题型验证（3种）

1. **select选择题**: 单选，radio样式
2. **time时间输入**: u-input type="text"，格式"HH:MM"
3. **number数字输入**: u-input type="number"

### 量表验证（14个）

逐个加载测试，确保JSON格式正确。

---

## 成功标准

- [ ] 14个量表全部可正常加载
- [ ] 3种题型全部支持
- [ ] 提交后评分正确
- [ ] 进度可保存和恢复
- [ ] u-input组件正常（依赖WS-M0-001）

---

**计划状态**: ✅ 已完成

