# WS-M1-W3-002: AI对话UI - 完整五件套

**工作流ID**: WS-M1-W3-002 | **工时**: 8h | **复用+优化**

**触点文件**: pages/intervene/chat.vue (已实现), components/chat/* (新建3个组件)

**PATCH**: 
- 复用chat.vue，新建MessageList/InputBox/TypingIndicator组件
- 使用uView组件
- 流式输出动画

**TESTS**: 自动化+10个手动用例（发送消息/接收回复/历史记录/流式动画）

**DoD**: ✅ 构建0报错, uView唯一, 对话流畅, P95<800ms

**ROLLBACK**: 恢复chat.vue, 删除新组件

**状态**: ✅ 完整（综合版）

