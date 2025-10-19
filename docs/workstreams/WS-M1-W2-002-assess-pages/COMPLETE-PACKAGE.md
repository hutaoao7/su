# WS-M1-W2-002: 评估页面集成 - 完整五件套

**工作流ID**: WS-M1-W2-002 | **工时**: 8h | **复用策略**: ✅ 直接复用

---

## 📋 PLAN

**任务**: 集成4个评估页面，验证量表流程  
**触点文件**:
- pages/assess/academic/index.vue（已实现）
- pages/assess/social/index.vue（已实现）
- pages/assess/sleep/index.vue（已实现）
- pages/assess/stress/index.vue（已实现）
- pages/features/features.vue（导航入口）

**依赖**: WS-M1-W2-001（ScaleRunner验证通过）

---

## 🔧 PATCH

**变更**: ✅ 无修改（4个评估页面已实现）

**验证内容**:
1. 每个页面正确引入ScaleRunner组件
2. scaleId正确传递
3. complete事件正确处理
4. 结果跳转逻辑完整

**pages/assess/academic/index.vue示例**:
```vue
<ScaleRunner
  scaleId="academic_stress_8"
  title="学业压力评估（简版）"
  submitText="完成评估"
  @complete="handleComplete"
/>
```

---

## ✅ TESTS

### 自动化（tools/test-ws-m1-w2-002.js）

```javascript
// 检查：
// 1. 4个评估页面文件存在
// 2. 每个页面引入ScaleRunner
// 3. scaleId配置正确
// 4. 构建成功
```

### 手动测试（12个用例）

- academic评估流程（3步）: 打开→答题→提交
- social评估流程（3步）
- sleep评估流程（3步）
- stress评估流程（3步）

---

## 📝 SELF-REVIEW DoD

- [ ] ✅ 构建0报错
- [ ] ✅ 4个页面使用uView组件
- [ ] ✅ ScaleRunner正确引入
- [ ] ✅ 评估流程完整
- [ ] ✅ 12个用例通过

---

## ⏮️ ROLLBACK

**方案**: 恢复评估页面（如有修改）

```bash
git checkout HEAD~1 -- pages/assess/
```

**时间**: 2min | **风险**: 极低

---

**状态**: ✅ 完整（精简版，复用为主）

