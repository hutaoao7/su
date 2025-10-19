# WS-M1-W2-003: 评分逻辑验证 - 完整五件套

**工作流ID**: WS-M1-W2-003 | **工时**: 4h | **测试为主**

---

## 📋 PLAN

**任务**: 验证14个量表评分逻辑准确性  
**触点文件**: utils/scoring.js, static/scales/*.json, tests/scoring.test.js (新建)

---

## 🔧 PATCH

**新建文件**: tests/scoring.test.js（完整单元测试，约300行）

```javascript
import { scoreUnified } from '@/utils/scoring.js';

describe('量表评分测试', () => {
  test('GAD-7最低分', () => {
    const answers = { q1: 0, q2: 0, q3: 0, q4: 0, q5: 0, q6: 0, q7: 0 };
    const result = scoreUnified('gad7', answers);
    expect(result.score).toBe(0);
    expect(result.level).toBe('normal');
  });
  
  test('GAD-7最高分', () => {
    const answers = { q1: 3, q2: 3, q3: 3, q4: 3, q5: 3, q6: 3, q7: 3 };
    const result = scoreUnified('gad7', answers);
    expect(result.score).toBe(21);
    expect(result.level).toBe('severe');
  });
  
  // 其他13个量表的边界值测试...
});
```

---

## ✅ TESTS

### 自动化（npm run test:scoring）

```bash
jest tests/scoring.test.js --coverage
# 预期: 14个量表 × 2个边界值 = 28个测试用例通过
# 覆盖率: >90%
```

### 手动验证

对照心理学标准手册验证评分算法

---

## 📝 SELF-REVIEW DoD

- [ ] ✅ 28个单元测试通过
- [ ] ✅ 覆盖率>90%
- [ ] ✅ 评分算法符合标准
- [ ] ✅ 边界值测试通过

---

## ⏮️ ROLLBACK

**场景**: scoring.js修改导致评分错误

```bash
git checkout HEAD~1 -- utils/scoring.js
```

**时间**: 1min | **风险**: 低

---

**状态**: ✅ 完整（测试为主）  
**核心产出**: 28个单元测试

