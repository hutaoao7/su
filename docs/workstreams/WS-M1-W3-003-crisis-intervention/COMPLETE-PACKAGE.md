# WS-M1-W3-003: 危机干预 - 完整五件套

**工作流ID**: WS-M1-W3-003 | **工时**: 4h | **新建功能**

**触点文件**: pages/intervene/crisis.vue (新建), utils/crisis-detector.js (新建)

**PATCH**:
- 新建crisis.vue（300行）：紧急求助入口、心理热线展示
- 新建crisis-detector.js（100行）：危机关键词检测
- 关键词：自杀、自伤、伤害他人等

**TESTS**: 关键词检测测试（10个用例）, 热线拨打测试

**DoD**: ✅ 构建0报错, 关键词检测准确, 热线可拨打

**ROLLBACK**: 删除crisis.vue和crisis-detector.js

**状态**: ✅ 完整（新建页面+检测逻辑）

