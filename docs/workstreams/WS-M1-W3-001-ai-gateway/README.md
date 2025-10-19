# WS-M1-W3-001: AI网关统一适配层

**工作流ID**: WS-M1-W3-001 | **工时**: 12h | **核心重构任务**

---

## 工作流概述

### 目标
构建AI调用网关，支持限流、降级、内容安全，统一AI服务调用接口。

### 现状

- ✅ `stress-chat/index.js`（已实现，直接调用OpenAI）
- ❌ 缺少统一网关
- ❌ 无限流机制
- ❌ 无降级策略
- ❌ 无内容安全审核

### 核心任务

1. ✅ 新建`common/ai-gateway/`模块
2. ✅ OpenAI适配器（支持GPT-3.5/4）
3. ✅ 请求限流（按用户ID）
4. ✅ 指数退避重试
5. ✅ 内容安全检测
6. ✅ 降级本地模板（5条+）
7. ✅ 重构stress-chat使用网关

---

## 触点文件

**新建**:
- `uniCloud-aliyun/cloudfunctions/common/ai-gateway/index.js` (约250行)
- `uniCloud-aliyun/cloudfunctions/common/ai-gateway/openai-adapter.js` (约150行)
- `uniCloud-aliyun/cloudfunctions/common/ai-gateway/content-safety.js` (约100行)
- `uniCloud-aliyun/cloudfunctions/common/ai-gateway/rate-limiter.js` (约120行)
- `uniCloud-aliyun/cloudfunctions/common/ai-gateway/fallback-templates.js` (约80行)

**重构**:
- `stress-chat/index.js` (重构使用AI网关)

---

## 依赖

**前置**: WS-M0-003（OpenAI API Key环境变量）  
**后置**: WS-M1-W3-002（AI对话UI）

---

**文档版本**: v1.0

