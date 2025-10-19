# WS-M1-W1-001: 回滚方案 (ROLLBACK)

**工作流ID**: WS-M1-W1-001  
**分支**: `feat/WS-M1-W1-001-wechat-login-enhance`  
**风险等级**: 低（仅新增工具函数，核心流程未改动）

---

## 一、回滚触发条件

### 1.1 必须回滚场景（P0）

- [ ] 新增的错误处理器导致登录失败率>20%
- [ ] 网络检测逻辑导致正常网络无法登录
- [ ] 引入的bug导致登录流程中断
- [ ] 性能严重下降（登录时长>10s）

### 1.2 可选回滚场景（P1-P2）

- [ ] 错误提示有误导性（可快速修复）
- [ ] 重试机制有小问题（可关闭重试）
- [ ] 性能轻微下降（<20%）

---

## 二、回滚方案

### 方案A：完全回滚（推荐）

**适用场景**: 新增代码导致严重问题

**步骤**:
1. 删除新增的 login-error-handler.js
2. 恢复 wechat-login.js 到原状态
3. 验证原有登录流程

**预计时间**: 10min

**风险**: 极低（回到已验证状态）

---

### 方案B：部分回滚

**适用场景**: 仅个别功能有问题

**步骤**:
1. 保留 login-error-handler.js
2. wechat-login.js 不使用错误处理器
3. 原有流程保持不变

**预计时间**: 5min

---

## 三、完全回滚步骤（方案A）

### Step 1: 备份当前状态（5min）

```bash
# 创建回滚分支
git checkout -b backup/WS-M1-W1-001-rollback-$(date +%Y%m%d-%H%M)

# 记录问题
echo "回滚原因: " > rollback-reason.txt
# 填写具体原因
```

---

### Step 2: 删除新增文件（2min）

```bash
# 删除错误处理器
rm utils/login-error-handler.js

# 删除测试文件（如已创建）
rm tests/login-error-handler.test.js
```

---

### Step 3: 恢复wechat-login.js（3min）

```diff
-// 导入错误处理器
-import { handleLoginError, checkNetworkStatus } from './login-error-handler.js';
-
 // 微信登录工具函数
-export const wechatLogin = async () => {
+export const wechatLogin = () => {
   return new Promise((resolve, reject) => {
     console.log('[WX_LOGIN] starting wx.login');
     
-    // 检查网络状态
-    checkNetworkStatus().then(networkStatus => {
-      if (!networkStatus.isConnected) {
-        console.error('[WX_LOGIN] 网络未连接');
-        uni.showToast({ 
-          title: '网络未连接，请检查网络设置', 
-          icon: 'none',
-          duration: 3000
-        });
-        reject(new Error('NETWORK_ERROR'));
-        return;
-      }
-      
-      console.log('[WX_LOGIN] 网络正常，继续登录');
-      performLogin();
-    });
-    
-    function performLogin() {
       // 每次都获取新的 code
       wx.login({
         success: ({ code }) => {
           if (!code) {
             console.error('[WX_LOGIN] wx.login success but no code received');
-            const errorInfo = handleLoginError({ code: 'NO_CODE' });
-            uni.showToast({ 
-              title: errorInfo.userMessage, 
-              icon: 'none',
-              duration: 3000
-            });
+            uni.showToast({ title: '未获取到授权码', icon: 'none' });
             reject(new Error('未获取到code'));
             return;
           }
           
           console.log('[WX_LOGIN] got wx.login code:', code.substring(0, 8) + '...');
           
           // 调用云函数
           console.log('[WX_LOGIN] calling auth-login cloud function');
           uniCloud.callFunction({
             name: 'auth-login',
-            data: { code },
-            timeout: 6000
+            data: { code }
           }).then(({ result }) => {
             // ... 原有逻辑保持不变 ...
             
             if (ok) {
               // 成功
             } else {
-              const errorInfo = handleLoginError({ errCode: r.errCode, errMsg: r.errMsg });
-              uni.showToast({ title: errorInfo.userMessage, icon: 'none', duration: 3000 });
-              reject(errorInfo);
+              const errMsg = r?.errMsg || '登录服务异常';
+              uni.showToast({ title: errMsg, icon: 'none' });
+              reject(new Error(errMsg));
             }
           }).catch(err => {
             console.error('[WX_LOGIN] cloud function call error:', err);
-            const errorInfo = handleLoginError(err);
-            uni.showToast({ title: errorInfo.userMessage, icon: 'none', duration: 3000 });
+            uni.showToast({ title: '网络错误，请重试', icon: 'none' });
             reject(err);
           });
         },
         fail: (err) => {
           console.error('[WX_LOGIN] wx.login fail:', err);
-          const errorInfo = handleLoginError(err);
-          uni.showToast({ title: errorInfo.userMessage || '微信授权失败，请重试', icon: 'none', duration: 3000 });
+          uni.showToast({ title: '微信授权失败', icon: 'none' });
           reject(err);
         }
       });
-    }
   });
 };
 
-// 导出带重试能力的版本
-import { withRetry } from './login-error-handler.js';
-export const wechatLoginWithRetry = withRetry(wechatLogin, {
-  maxRetries: 1,
-  delay: 1000,
-});
-
 // 检查登录状态
 export const checkLoginStatus = () => {
   // ... 保持不变 ...
 };
```

**说明**: 恢复到原有的简单错误处理

---

### Step 4: 验证原有功能（10min）

```bash
# 1. 构建测试
npm run build:mp-weixin

# 2. 启动开发环境
npm run dev:mp-weixin

# 3. 手动测试登录流程
# - 正常登录
# - 网络异常（预期：简单提示"网络错误"）

# 4. 验证登录成功
# - 查看个人中心登录态
```

**验证清单**:
- [ ] 构建成功
- [ ] 登录流程正常
- [ ] Token正确保存
- [ ] 跳转正常

---

### Step 5: 提交回滚（5min）

```bash
git add .
git commit -m "Revert: WS-M1-W1-001 微信登录优化

原因: [填写回滚原因]
- 错误处理器导致问题
- 恢复原有简单处理

变更:
- 删除 login-error-handler.js
- 恢复 wechat-login.js
- 原有登录流程正常

测试:
- 构建通过
- 登录流程验证通过
"

git push origin main
```

---

## 四、部分回滚步骤（方案B）

### 场景1: 仅网络检测有问题

**步骤**:

1. **保留错误处理器文件**
   - login-error-handler.js 不删除

2. **wechat-login.js 不使用网络检测**
   ```diff
   -checkNetworkStatus().then(networkStatus => {
   -  if (!networkStatus.isConnected) {
   -    // 网络检测逻辑
   -  }
   -});
   +// 移除网络检测，直接执行登录
   ```

3. **保留错误提示优化**
   - 继续使用 handleLoginError()
   - 仅移除网络检测部分

---

### 场景2: 仅重试机制有问题

**步骤**:

1. **保留错误处理器**
2. **不导出 wechatLoginWithRetry**
   ```diff
   -export const wechatLoginWithRetry = withRetry(wechatLogin, {
   -  maxRetries: 1,
   -  delay: 1000,
   -});
   ```

3. **使用原有版本**
   - 页面继续使用 wechatLogin()
   - 不使用重试版本

---

## 五、回滚验证清单

### 5.1 功能验证

- [ ] 正常登录流程
- [ ] 网络异常场景
- [ ] code过期场景
- [ ] 登录态正确
- [ ] 跳转正常

### 5.2 性能验证

- [ ] 登录时长未增加
- [ ] 内存占用正常

### 5.3 体验验证

- [ ] 加载提示正常（原有）
- [ ] 错误提示正常（原有）
- [ ] 可以重试（手动点击）

---

## 六、回滚后处理

### 6.1 问题分析

```markdown
## 回滚分析

### 问题现象
[描述具体问题]

### 根本原因
- [ ] 代码bug
- [ ] 逻辑错误
- [ ] 环境问题
- [ ] 测试不充分

### 改进措施
1. 短期: ...
2. 中期: ...
3. 长期: ...
```

---

### 6.2 新方案

**选项1**: 修复bug后重新实施  
**选项2**: 简化方案，分阶段实施  
**选项3**: 暂不实施，M2阶段再考虑

---

## 七、预防措施（未来）

### 7.1 充分测试

- [ ] 单元测试覆盖所有函数
- [ ] 功能测试覆盖所有场景
- [ ] 性能测试确保无退化

### 7.2 小范围试点

- [ ] 仅1-2个开发者先使用
- [ ] 观察1-2天
- [ ] 无问题再推广

### 7.3 灰度发布

- [ ] 10% 用户
- [ ] 观察登录成功率
- [ ] 逐步扩大

---

## 八、联系人

### 技术支持

- **前端Lead**: _______
- **Tech Lead**: _______

### 紧急联系

- **项目经理**: _______

---

**回滚方案状态**: 已准备  
**最后更新**: 2025-10-12  
**审核人**: _______

