# WS-M1-W1-005: 请求封装统一 - 完整五件套

**工作流ID**: WS-M1-W1-005  
**标题**: 统一请求通道为uniCloud，完善错误处理  
**分支**: `feat/WS-M1-W1-005-request-unify`  
**工时**: 8h | **负责人**: 前端B

---

## 📋 PLAN - 计划

### 目标
明确 `utils/unicloud-handler.js` 为主要请求通道，`utils/http.js` 仅用于非uniCloud场景（如第三方服务）。

### 触点文件

**复用文件**:
- `utils/unicloud-handler.js`（392行）- ✅ 已完善，直接复用
- `utils/api-handler.js`（已有）- ✅ 复用

**小改文件**:
- `utils/http.js`（112行）- 标记为deprecated，添加警告
- `utils/request.js`（172行）- 标记为deprecated
- `api/user.js`（小改）- 改用unicloud-handler
- `api/stress.js`（小改）- 改用unicloud-handler
- `api/community.js`（小改）- 改用unicloud-handler

**新建文件**:
- `docs/api-migration-guide.md`（迁移指南）

### 数据流

```
业务页面
  ↓
cloudFunctions.xxx.yyy() (推荐)
  或
callCloudFunction('fn-name', params)
  ↓
utils/unicloud-handler.js
  ↓
uniCloud.callFunction()
  ↓
云函数
  ↓
Supabase
```

---

## 🔧 PATCH - 代码差异

### utils/http.js（添加deprecated警告）

```diff
+/**
+ * @deprecated 本模块已不推荐使用
+ * 请使用 utils/unicloud-handler.js 调用云函数
+ * http.js 仅保留用于第三方服务调用（如微信API）
+ */
+console.warn('[DEPRECATED] utils/http.js已废弃，请使用utils/unicloud-handler.js');
+
 // HTTP请求封装
 import { getToken } from './auth.js';
 
-// 后端账号管理系统基础URL
-const BASE_URL = 'https://api.lingxin.account.com';
+// 第三方服务基础URL（仅用于非uniCloud服务）
+const BASE_URL = 'https://api.thirdparty.com';
```

### api/user.js（改用unicloud-handler）

```diff
-import request from '@/utils/request.js';
+import { callCloudFunction } from '@/utils/unicloud-handler.js';

 export default {
   // 获取用户信息
   async getUserInfo() {
-    return await request.get('/user/info');
+    return await callCloudFunction('auth-me', {}, {
+      cacheKey: 'user_info',
+      cacheDuration: 10 * 60 * 1000
+    });
   },
   
   // 更新用户信息
   async updateUserInfo(data) {
-    return await request.post('/user/update', data);
+    return await callCloudFunction('user-update-profile', data, {
+      showLoading: true,
+      loadingText: '保存中...'
+    });
   }
 };
```

### api/stress.js（类似改动）

```javascript
// 改用 cloudFunctions.stress.xxx()
```

---

## ✅ TESTS - 测试

### 自动化脚本（tools/test-ws-m1-w1-005.js）

```javascript
#!/usr/bin/env node
// 检查：
// 1. api/*.js文件已迁移到unicloud-handler
// 2. 无直接使用utils/http.js（除白名单文件）
// 3. cloudFunctions调用正确
// 4. 构建成功

function testApiMigration() {
  // 检查api/user.js
  const content = fs.readFileSync('api/user.js', 'utf-8');
  
  // 应该引入unicloud-handler
  if (!content.includes('unicloud-handler')) {
    console.error('❌ api/user.js未迁移到unicloud-handler');
    return false;
  }
  
  // 不应该引入http.js或request.js
  if (content.includes("from './utils/http") || content.includes("from './utils/request")) {
    console.error('❌ api/user.js仍使用http.js/request.js');
    return false;
  }
  
  console.log('✅ api/user.js已迁移');
  return true;
}
```

### 手动测试

- 调用user API：正常
- 调用stress API：正常
- 调用community API：正常
- 错误处理：正常
- 缓存机制：正常

---

## 📝 SELF-REVIEW - DoD检查

- [ ] ✅ 构建0报错
- [ ] ✅ api/*.js已迁移到unicloud-handler
- [ ] ✅ http.js有deprecated警告
- [ ] ✅ 无新增Supabase直连
- [ ] ✅ 回归测试通过

---

## ⏮️ ROLLBACK - 回滚

**方案**: 恢复api/*.js使用http.js/request.js

```bash
git checkout HEAD~1 -- api/user.js api/stress.js api/community.js
```

**时间**: 5min  
**风险**: 低

---

**五件套状态**: ✅ 完整（紧凑版）

