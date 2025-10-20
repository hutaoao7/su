# AI人格设置功能文档

## 功能概述

AI人格设置功能允许用户根据自己的偏好选择不同的AI对话风格，提供更加个性化的心理支持体验。

**版本**: v1.0.0  
**创建日期**: 2025-10-21  
**状态**: ✅ 已实现

---

## 功能特性

### 支持的AI人格类型

| 人格类型 | 图标 | 描述 | 适用场景 |
|---------|------|------|----------|
| **温柔模式** | 🌸 | 温暖、共情、鼓励式的对话风格 | 需要情感支持和理解时 |
| **专业模式** | 📋 | 严谨、结构化、循证的对话风格 | 需要专业分析和建议时 |
| **幽默模式** | 😄 | 轻松、有趣、积极的对话风格 | 希望以轻松方式缓解压力时 |

### 核心功能

1. ✅ **人格切换**: 用户可以随时切换AI人格
2. ✅ **偏好保存**: 自动保存用户的人格偏好
3. ✅ **示例预览**: 显示每种人格的回复示例
4. ✅ **无缝切换**: 切换后立即生效，不影响历史对话
5. ✅ **视觉反馈**: 顶部显示当前人格图标

---

## 技术实现

### 前端实现

#### 1. AI人格配置文件

**文件**: `utils/ai-personality.js`

```javascript
// 人格类型枚举
export const PersonalityType = {
  GENTLE: 'gentle',       // 温柔模式
  PROFESSIONAL: 'professional', // 专业模式
  HUMOROUS: 'humorous'    // 幽默模式
};

// 人格配置
export const PersonalityConfig = {
  [PersonalityType.GENTLE]: {
    id: 'gentle',
    name: '温柔模式',
    icon: '🌸',
    description: '温暖、共情、鼓励式的对话风格',
    color: '#FF9AA2',
    systemPrompt: '...',  // 完整的系统提示词
    examples: [...]        // 示例回复
  },
  // ...其他人格配置
};
```

#### 2. chat.vue集成

**状态管理**:
```javascript
data() {
  return {
    currentPersonality: PersonalityType.GENTLE, // 当前人格
    showPersonalityPopup: false, // 显示选择弹窗
    personalities: getAllPersonalities(), // 所有人格列表
  }
}
```

**人格切换逻辑**:
```javascript
selectPersonality(personalityId) {
  // 更新当前人格
  this.currentPersonality = personalityId;
  
  // 保存偏好到本地存储
  savePersonalityPreference(personalityId);
  
  // 显示切换提示
  const systemMessage = {
    role: 'system',
    content: `（您已切换AI人格：${oldPersonality.name} → ${newPersonality.name}）`,
    timestamp: Date.now(),
    isSystem: true
  };
  this.messages.push(systemMessage);
}
```

**发送消息时携带人格**:
```javascript
await uniCloud.callFunction({
  name: 'stress-chat',
  data: {
    messages: messagesToSend,
    personality: this.currentPersonality, // 传入当前人格
    stream: false
  }
});
```

### 后端实现

#### stress-chat云函数

**文件**: `uniCloud-aliyun/cloudfunctions/stress-chat/index.js`

**人格提示词配置**:
```javascript
const PERSONALITY_PROMPTS = {
  gentle: `你是一位温柔、富有同理心的心理咨询师...`,
  professional: `你是一位经验丰富、专业严谨的心理咨询师...`,
  humorous: `你是一位幽默风趣、善于用轻松方式引导的心理咨询师...`
};
```

**使用人格参数**:
```javascript
async function generateChatResponse(userId, userMessage, chatHistory = [], personality = 'gentle') {
  // 根据人格选择系统提示词
  const systemPrompt = PERSONALITY_PROMPTS[personality] || DEFAULT_SYSTEM_PROMPT;
  
  // 构建消息列表
  const messages = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: userMessage }
  ];
  
  // 调用AI
  const reply = await aiGateway.chat(userId, messages, {...});
  return reply;
}
```

---

## UI设计

### 人格选择按钮

- **位置**: 顶部操作栏左侧
- **样式**: 渐变紫色背景，显示当前人格图标
- **交互**: 点击打开人格选择弹窗

### 人格选择弹窗

**布局**:
```
┌─────────────────────────┐
│  选择AI人格        [X]  │ ← 标题栏
├─────────────────────────┤
│ 🌸  温柔模式        ✓  │ ← 人格列表
│     温暖、共情...        │
├─────────────────────────┤
│ 📋  专业模式            │
│     严谨、结构化...      │
├─────────────────────────┤
│ 😄  幽默模式            │
│     轻松、有趣...        │
├─────────────────────────┤
│ 示例回复风格：          │ ← 示例区域
│  我能感受到你现在...    │
│  你已经做得很好...      │
└─────────────────────────┘
```

**交互效果**:
- 当前选中人格高亮显示（蓝色背景）
- 点击人格立即切换并关闭弹窗
- 底部实时显示当前人格的示例回复

### 系统消息显示

- 人格切换时在聊天中插入系统提示
- 居中灰色斜体文字，半透明背景
- 示例：`（您已切换AI人格：温柔模式 → 专业模式）`

---

## 人格详细说明

### 温柔模式 🌸

**特点**:
- 使用温暖、柔和的语言
- 表达深切的理解和共情
- 多使用鼓励和肯定的表达
- 耐心倾听，不急于给建议

**示例回复**:
> "我能感受到你现在的压力和焦虑，这些感受都是很正常的。让我们一起来看看..."

**适用场景**:
- 情绪低落需要安慰
- 遇到挫折需要鼓励
- 寻求情感支持

### 专业模式 📋

**特点**:
- 使用专业但易懂的语言
- 提供结构化的分析和建议
- 基于循证的心理学理论
- 逻辑清晰，条理分明

**示例回复**:
> "根据认知行为疗法的理论框架，我们可以分析一下你的思维模式。让我们用ABC模型来看..."

**适用场景**:
- 需要专业分析
- 希望系统性解决问题
- 想要学习心理学知识

### 幽默模式 😄

**特点**:
- 适当使用幽默和俏皮话
- 保持轻松愉快的氛围
- 用比喻和有趣的例子
- 积极乐观，充满正能量

**示例回复**:
> "哈哈，听起来你的大脑又在上演'灾难大片'了！让我们给这部电影换个结局..."

**适用场景**:
- 压力过大需要放松
- 希望轻松对话
- 对问题不那么严重

---

## 数据存储

### 本地存储

**存储键**: `ai_personality_preference`  
**存储值**: `'gentle'` | `'professional'` | `'humorous'`

**API**:
```javascript
// 保存偏好
savePersonalityPreference('professional');

// 获取偏好
const preference = getPersonalityPreference(); // 默认返回 'gentle'
```

### 会话记录

- 系统消息（人格切换提示）会保存到消息历史
- 标记 `isSystem: true` 以区分普通消息
- 发送到AI时会过滤掉系统消息

---

## 用户体验优化

### 1. 初次使用引导

- 首次打开聊天时默认使用温柔模式
- 欢迎消息中提示当前人格："您好！我是您的心理支持AI（温柔模式）..."

### 2. 人格切换反馈

- ✅ Toast提示："已切换至专业模式"
- ✅ 系统消息插入聊天记录
- ✅ 顶部图标立即更新

### 3. 示例实时预览

- 选择不同人格时，底部示例区域实时更新
- 帮助用户了解每种人格的回复风格

### 4. 视觉一致性

- 每种人格有独特的配色
- 温柔模式：粉色系
- 专业模式：蓝色系
- 幽默模式：橙色系

---

## 性能优化

### 1. 偏好加载

- 页面加载时优先读取本地偏好
- 避免重复查询，提升响应速度

### 2. 人格配置

- 所有人格配置在前端本地定义
- 无需网络请求，切换即时响应

### 3. 消息过滤

- 发送AI时自动过滤系统消息
- 避免无关信息影响AI判断

---

## 测试建议

### 功能测试

1. **人格切换测试**
   - [ ] 切换至专业模式，检查回复风格
   - [ ] 切换至幽默模式，检查回复风格
   - [ ] 切换回温柔模式，检查回复风格

2. **偏好保存测试**
   - [ ] 选择专业模式后关闭应用
   - [ ] 重新打开，检查是否保留专业模式

3. **系统消息测试**
   - [ ] 切换人格后检查系统提示
   - [ ] 验证系统消息不会发送给AI

### UI测试

1. **弹窗显示**
   - [ ] 点击人格按钮打开弹窗
   - [ ] 弹窗正常显示所有人格
   - [ ] 当前人格正确高亮

2. **示例预览**
   - [ ] 示例区域显示正确
   - [ ] 切换人格时示例同步更新

3. **响应式测试**
   - [ ] 不同屏幕尺寸下显示正常
   - [ ] iPhone SE 到 Pro Max 都正常

---

## 扩展性

### 添加新人格

1. 在 `utils/ai-personality.js` 中添加配置：

```javascript
export const PersonalityType = {
  // ...现有类型
  EMPATHETIC: 'empathetic'  // 新增
};

export const PersonalityConfig = {
  // ...现有配置
  [PersonalityType.EMPATHETIC]: {
    id: 'empathetic',
    name: '共情模式',
    icon: '💙',
    description: '深度共情、情感连接',
    color: '#4A90E2',
    systemPrompt: '...',
    examples: [...]
  }
};
```

2. 在 `stress-chat/index.js` 中添加提示词：

```javascript
const PERSONALITY_PROMPTS = {
  // ...现有提示词
  empathetic: `你是一位具有深度共情能力的心理咨询师...`
};
```

3. 无需修改其他代码，新人格自动生效

### 多语言支持

- 人格配置可扩展为多语言版本
- 根据用户语言设置加载对应配置

---

## 相关文档

- [stress-chat API文档](../api/stress-chat.md)
- [chat.vue组件文档](../frontend/chat-component.md)
- [AI网关文档](../backend/ai-gateway.md)

---

**维护者**: 翎心CraneHeart团队  
**更新日期**: 2025-10-21

