# stress-chat API文档

## 基本信息

- **云函数名称**: `stress-chat`
- **功能描述**: AI智能对话，提供心理支持和CBT干预
- **请求方式**: uniCloud.callFunction
- **认证要求**: 可选（提供token时记录会话）
- **限流策略**: 每用户每分钟最多10次请求

---

## 请求参数

### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
|--------|------|------|--------|------|
| message | String | 是 | - | 用户发送的消息内容 |
| history | Array | 否 | [] | 聊天历史记录 |
| userId | String | 否 | null | 用户ID（如提供则记录会话） |
| sessionId | String | 否 | null | 会话ID（用于关联历史对话） |
| options | Object | 否 | {} | AI配置选项 |

### history数组结构

```javascript
[
  {
    from: 'self',      // 'self'表示用户，'ai'表示AI
    content: '我最近压力很大'
  },
  {
    from: 'ai',
    content: '我理解你的感受...'
  }
]
```

### options对象结构

| 字段名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| model | String | 'gpt-3.5-turbo' | AI模型选择 |
| temperature | Number | 0.7 | 温度参数（0-1） |
| maxTokens | Number | 400 | 最大token数 |
| personality | String | 'empathetic' | AI人格（empathetic/professional/humorous） |

### 请求示例

```javascript
// 基础对话
const { result } = await uniCloud.callFunction({
  name: 'stress-chat',
  data: {
    message: '我最近学习压力很大，总是失眠',
    history: [
      { from: 'self', content: '你好' },
      { from: 'ai', content: '您好！很高兴为您服务。' }
    ]
  }
});

// 带选项的对话
const { result } = await uniCloud.callFunction({
  name: 'stress-chat',
  data: {
    message: '如何缓解焦虑？',
    userId: 'user-uuid-xxx',
    sessionId: 'session-uuid-yyy',
    options: {
      model: 'gpt-4',
      temperature: 0.8,
      personality: 'professional'
    }
  }
});
```

---

## 响应格式

### 成功响应

```json
{
  "code": 0,
  "msg": "回复成功",
  "data": {
    "content": "我理解您的感受。学习压力和失眠确实会相互影响。让我们一起来分析一下...",
    "isCrisis": false,
    "hasSensitive": false,
    "tokensUsed": 245,
    "model": "gpt-3.5-turbo",
    "sessionId": "session-uuid-xxx"
  }
}
```

### 危机干预响应

```json
{
  "code": 0,
  "msg": "危机干预",
  "data": {
    "content": "我注意到您可能正在经历很大的困扰。请知道，您并不孤单。如果您有紧急需求，请立即拨打以下求助热线：\n\n全国24小时心理危机干预热线：400-161-9995\n北京心理危机研究与干预中心：010-82951332\n\n同时，我建议您尽快联系专业的心理咨询师或医生。",
    "isCrisis": true,
    "hasSensitive": true,
    "crisisHotlines": [
      {
        "name": "全国24小时心理危机干预热线",
        "phone": "400-161-9995"
      },
      {
        "name": "北京心理危机研究与干预中心",
        "phone": "010-82951332"
      }
    ]
  }
}
```

### 敏感内容响应

```json
{
  "code": 0,
  "msg": "敏感内容",
  "data": {
    "content": "我理解您现在可能遇到了一些困难。让我们一起用更积极的方式来看待这个问题...",
    "hasSensitive": true,
    "isCrisis": false
  }
}
```

### 失败响应

```json
{
  "code": -1,
  "msg": "服务暂时不可用，请稍后再试",
  "data": {
    "content": "抱歉，AI服务暂时繁忙，请稍后再试。您也可以尝试：\n1. 进行深呼吸练习\n2. 听一段放松音乐\n3. 记录当下的感受"
  }
}
```

---

## 错误码

| 错误码 | 错误信息 | 说明 | 处理建议 |
|--------|----------|------|----------|
| 0 | 回复成功 | 成功 | - |
| -1 | 消息内容不能为空 | 参数错误 | 检查message参数 |
| -2 | 请求过于频繁 | 触发限流 | 等待后重试 |
| -3 | AI服务不可用 | OpenAI错误 | 使用降级回复 |
| -4 | Token余额不足 | OpenAI配额耗尽 | 通知管理员充值 |
| -5 | 内容违规 | 违反内容政策 | 提示用户修改内容 |

---

## AI网关架构

### 处理流程

```
用户消息
  ↓
【1. 敏感词检测】
  ├─ 危机词（自杀、自残等） → 危机干预回复
  ├─ 敏感词（辱骂、政治等） → 引导性回复
  └─ 正常内容 → 继续
  ↓
【2. 限流检查】
  ├─ 超过限制 → 返回限流错误
  └─ 未超限 → 继续
  ↓
【3. 内容安全检测】
  ├─ 不安全 → 安全回复
  └─ 安全 → 继续
  ↓
【4. 调用OpenAI】
  ├─ 成功 → 返回AI回复
  ├─ 失败 → 重试（最多3次）
  └─ 最终失败 → 降级回复
  ↓
【5. 记录日志】
  ├─ 保存消息到数据库
  ├─ 更新使用统计
  └─ 返回结果
```

### 敏感词分类

**危机词（立即干预）**:
- 自杀相关：自杀、结束生命、不想活等
- 自残相关：自残、伤害自己、割腕等
- 严重抑郁：活着没意义、世界没希望等

**一般敏感词（引导处理）**:
- 辱骂词汇
- 政治敏感
- 暴力倾向
- 歧视性语言

### 降级策略

当OpenAI服务不可用时，使用预设模板回复：

```javascript
const fallbackTemplates = [
  '我理解您现在的感受。压力和困扰是很正常的，让我们一起来面对。',
  '感谢您的分享。您能说说具体是什么让您感到困扰吗？',
  '这确实是一个值得关注的问题。您有尝试过什么方法来应对吗？',
  '我在这里倾听您的诉说。请慢慢说，不用着急。',
  '您的感受很重要。让我们一起找到适合您的解决方案。'
];
```

---

## 内容安全策略

### 1. 输入过滤

```javascript
// 敏感词检测
function checkSensitiveWords(text) {
  const crisisKeywords = ['自杀', '不想活', '结束生命', '自残'];
  const sensitiveKeywords = ['政治', '暴力', '歧视'];
  
  const hasCrisis = crisisKeywords.some(word => text.includes(word));
  const hasSensitive = sensitiveKeywords.some(word => text.includes(word));
  
  return {
    hasSensitive: hasCrisis || hasSensitive,
    isCrisis: hasCrisis,
    matchedWords: [...crisisKeywords, ...sensitiveKeywords].filter(word => text.includes(word))
  };
}
```

### 2. 输出审核

- 检查AI回复中的不当内容
- 过滤可能的医疗诊断建议
- 移除可能的药物推荐

### 3. 记录与审计

- 所有危机干预会话记录到数据库
- 敏感对话标记为需要人工review
- 定期审计AI回复质量

---

## 性能优化

### 1. 缓存策略

```javascript
// 对常见问题使用缓存回复
const cache = {
  '如何缓解压力': '缓解压力的方法有很多...',
  '失眠怎么办': '改善睡眠质量可以尝试...'
};

// 检查缓存
if (cache[message]) {
  return cache[message];
}
```

### 2. 流式输出

```javascript
// 使用SSE实现流式输出（未来版本）
const stream = await openai.createChatCompletionStream({
  model: 'gpt-3.5-turbo',
  messages,
  stream: true
});

for await (const chunk of stream) {
  // 实时返回chunk给前端
  emitChunk(chunk);
}
```

### 3. 请求优化

- 控制history长度（最多10条）
- 压缩历史消息
- 异步记录日志

---

## 使用限制

### 1. Token限制

- 免费用户：每日100次对话
- VIP用户：每日500次对话
- 单次对话最多400 tokens

### 2. 内容限制

- 单条消息最长1000字符
- 历史记录最多保留10条
- 敏感内容自动过滤

### 3. 频率限制

- 每分钟最多10次请求
- 每小时最多100次请求
- 触发限流后5分钟恢复

---

## 最佳实践

### 1. 前端集成

```javascript
// 封装AI对话方法
export async function sendChatMessage(message, history = []) {
  try {
    // 1. 参数验证
    if (!message || message.trim() === '') {
      throw new Error('消息不能为空');
    }
    
    if (message.length > 1000) {
      throw new Error('消息长度不能超过1000字');
    }
    
    // 2. 控制历史记录长度
    const trimmedHistory = history.slice(-10);
    
    // 3. 调用云函数
    const { result } = await uniCloud.callFunction({
      name: 'stress-chat',
      data: {
        message: message.trim(),
        history: trimmedHistory
      },
      timeout: 30000  // 30秒超时（AI回复可能较慢）
    });
    
    // 4. 处理响应
    if (result.code === 0) {
      // 检查是否危机干预
      if (result.data.isCrisis) {
        // 显示紧急求助入口
        showCrisisIntervention(result.data);
      }
      
      return result.data.content;
    } else {
      throw new Error(result.msg);
    }
    
  } catch (error) {
    console.error('AI对话失败:', error);
    
    // 使用本地降级回复
    return getFallbackResponse();
  }
}

// 本地降级回复
function getFallbackResponse() {
  const fallbacks = [
    '我理解您的感受。请继续说说您的想法。',
    '这确实是一个重要的话题。能具体说说吗？',
    '我在认真倾听。请慢慢说，不用着急。'
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}
```

### 2. 历史记录管理

```javascript
// 管理聊天历史
class ChatHistoryManager {
  constructor() {
    this.history = [];
    this.maxLength = 10;
  }
  
  // 添加用户消息
  addUserMessage(content) {
    this.history.push({
      from: 'self',
      content,
      timestamp: Date.now()
    });
    this.trim();
  }
  
  // 添加AI消息
  addAIMessage(content) {
    this.history.push({
      from: 'ai',
      content,
      timestamp: Date.now()
    });
    this.trim();
  }
  
  // 裁剪历史记录
  trim() {
    if (this.history.length > this.maxLength) {
      this.history = this.history.slice(-this.maxLength);
    }
  }
  
  // 获取历史记录
  getHistory() {
    return this.history;
  }
  
  // 清空历史
  clear() {
    this.history = [];
  }
}
```

---

## AI模型配置

### 模型选择

| 模型 | 特点 | 成本 | 适用场景 |
|------|------|------|----------|
| gpt-3.5-turbo | 快速、经济 | $0.002/1K tokens | 普通对话 |
| gpt-4 | 高质量、深度 | $0.03/1K tokens | VIP用户、复杂问题 |
| gpt-4-turbo | 高质量、更快 | $0.01/1K tokens | VIP用户、长对话 |

### 人格配置

**温柔型（empathetic）**:
```javascript
{
  systemPrompt: '你是一位温柔、富有同理心的心理咨询师...',
  temperature: 0.7,
  tone: 'warm, supportive'
}
```

**专业型（professional）**:
```javascript
{
  systemPrompt: '你是一位专业、严谨的心理治疗师...',
  temperature: 0.5,
  tone: 'professional, scientific'
}
```

**幽默型（humorous）**:
```javascript
{
  systemPrompt: '你是一位幽默、轻松的心理顾问...',
  temperature: 0.8,
  tone: 'humorous, casual'
}
```

---

## 错误处理

### 网络错误

```javascript
try {
  const result = await sendChatMessage(message, history);
} catch (error) {
  if (error.message.includes('timeout')) {
    // 超时错误
    uni.showToast({
      title: 'AI思考时间较长，请稍后...',
      icon: 'none'
    });
  } else if (error.message.includes('network')) {
    // 网络错误
    uni.showToast({
      title: '网络连接失败，请检查网络',
      icon: 'none'
    });
  } else {
    // 其他错误
    uni.showToast({
      title: error.message,
      icon: 'none'
    });
  }
}
```

### OpenAI错误

- **Token余额不足**: 使用降级模板回复
- **速率限制**: 自动重试（指数退避）
- **内容违规**: 返回友好提示，要求修改问题

---

## 监控指标

### 1. 响应时间

- P50: < 2s
- P95: < 5s
- P99: < 10s

### 2. 成功率

- 目标: > 95%
- 包含降级回复的成功率: > 99%

### 3. Token使用

- 平均每次对话: 200-300 tokens
- 每日总消耗监控
- 成本预警阈值

### 4. 内容安全

- 危机干预触发次数
- 敏感词过滤次数
- 人工审核比例

---

## 测试用例

### 单元测试

```javascript
describe('stress-chat云函数', () => {
  test('正常对话', async () => {
    const result = await testCloudFunction('stress-chat', {
      message: '我最近有点焦虑'
    });
    
    expect(result.code).toBe(0);
    expect(result.data.content).toBeDefined();
    expect(result.data.isCrisis).toBe(false);
  });
  
  test('危机干预触发', async () => {
    const result = await testCloudFunction('stress-chat', {
      message: '我不想活了'
    });
    
    expect(result.code).toBe(0);
    expect(result.data.isCrisis).toBe(true);
    expect(result.data.content).toContain('热线');
  });
  
  test('空消息', async () => {
    const result = await testCloudFunction('stress-chat', {
      message: ''
    });
    
    expect(result.code).toBe(-1);
    expect(result.msg).toContain('不能为空');
  });
  
  test('历史记录处理', async () => {
    const result = await testCloudFunction('stress-chat', {
      message: '继续之前的话题',
      history: [
        { from: 'self', content: '我压力很大' },
        { from: 'ai', content: '能具体说说吗？' }
      ]
    });
    
    expect(result.code).toBe(0);
    expect(result.data.content).toBeDefined();
  });
});
```

### 集成测试

```javascript
describe('AI对话集成测试', () => {
  test('多轮对话', async () => {
    const history = [];
    
    // 第1轮
    let result1 = await sendChatMessage('你好', history);
    expect(result1).toBeDefined();
    history.push({ from: 'self', content: '你好' });
    history.push({ from: 'ai', content: result1 });
    
    // 第2轮
    let result2 = await sendChatMessage('我最近失眠', history);
    expect(result2).toContain('失眠');
    history.push({ from: 'self', content: '我最近失眠' });
    history.push({ from: 'ai', content: result2 });
    
    // 第3轮
    let result3 = await sendChatMessage('有什么建议吗', history);
    expect(result3).toBeDefined();
  });
});
```

---

## CBT系统提示词

### 完整提示词

```
你是一位经验丰富的心理咨询师，专门从事认知行为疗法(CBT)。
用户正在经历压力和焦虑，需要你的帮助来重构他们的思维模式。

请遵循以下CBT原则:
1. 识别自动化负面思维
2. 挑战认知歪曲
3. 寻找替代性思考方式
4. 提供实用的减压技巧

回答要温暖、专业，语言亲切自然，长度适中，并鼓励用户积极思考。

不要:
- 做出医疗诊断
- 提供药物建议
- 过度承诺治愈效果
- 使用过于专业的术语

请使用中文回复，并始终保持共情和支持的态度。

特别注意:
- 如果用户表达自杀或自残意图，立即提供危机干预资源
- 如果问题超出心理咨询范围，建议寻求专业医疗帮助
- 保持对话的连贯性，记住之前的对话内容
```

---

## 相关文档

- [AI网关设计文档](../workstreams/WS-M1-W3-001-ai-gateway/)
- [敏感词过滤文档](./common-sensitive-filter.md)
- [限流策略文档](./common-rate-limit.md)
- [聊天表设计文档](../database/schema-chat.md)

---

## 变更历史

| 版本 | 日期 | 变更内容 | 变更人 |
|------|------|----------|--------|
| v1.0.0 | 2025-10-18 | 初始版本 | 开发团队 |
| v1.1.0 | 计划中 | 添加流式输出支持 | - |
| v1.2.0 | 计划中 | 添加多模型切换 | - |

---

**维护说明**: 
- 系统提示词需要根据用户反馈持续优化
- 敏感词库需要定期更新
- 降级模板需要丰富和完善

