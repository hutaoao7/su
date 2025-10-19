# WS-M1-W1-001: 测试与验证 (TESTS)

**工作流ID**: WS-M1-W1-001  
**测试时间**: 2h

---

## 一、单元测试

### 1.1 login-error-handler.js测试

创建 `tests/login-error-handler.test.js`:

```javascript
import { handleLoginError, checkNetworkStatus, withRetry } from '@/utils/login-error-handler.js';

describe('login-error-handler', () => {
  describe('handleLoginError', () => {
    test('应正确处理微信code过期错误', () => {
      const error = { errCode: 40029 };
      const result = handleLoginError(error);
      
      expect(result.code).toBe(40029);
      expect(result.retry).toBe(true);
      expect(result.action).toBe('relogin');
      expect(result.userMessage).toContain('过期');
    });
    
    test('应正确处理网络错误', () => {
      const error = { code: 'NETWORK_ERROR' };
      const result = handleLoginError(error);
      
      expect(result.retry).toBe(true);
      expect(result.action).toBe('check_network');
      expect(result.userMessage).toContain('网络');
    });
    
    test('应处理未知错误', () => {
      const error = { message: '未知错误' };
      const result = handleLoginError(error);
      
      expect(result.code).toBe('UNKNOWN');
      expect(result.retry).toBe(true);
    });
  });
  
  describe('withRetry', () => {
    test('成功时不应重试', async () => {
      let callCount = 0;
      const mockFn = jest.fn(async () => {
        callCount++;
        return 'success';
      });
      
      const fnWithRetry = withRetry(mockFn, { maxRetries: 2 });
      const result = await fnWithRetry();
      
      expect(callCount).toBe(1);
      expect(result).toBe('success');
    });
    
    test('失败时应重试', async () => {
      let callCount = 0;
      const mockFn = jest.fn(async () => {
        callCount++;
        if (callCount < 2) {
          throw { code: 502, message: '服务不可用' };
        }
        return 'success';
      });
      
      const fnWithRetry = withRetry(mockFn, { maxRetries: 2, delay: 100 });
      const result = await fnWithRetry();
      
      expect(callCount).toBe(2);
      expect(result).toBe('success');
    });
  });
});
```

**运行**:
```bash
npm run test:login
```

---

## 二、手动功能测试

### 2.1 正常登录流程

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开登录页 | 页面正常显示 | | ⬜ 待测 |
| 2 | 查看调试信息 | 显示"未登录" | | ⬜ 待测 |
| 3 | 勾选协议 | 勾选框打勾，按钮可用 | | ⬜ 待测 |
| 4 | 点击登录按钮 | 按钮显示"登录中..."，加载图标旋转 | | ⬜ 待测 |
| 5 | 等待登录完成 | 显示"登录成功"Toast | | ⬜ 待测 |
| 6 | 自动跳转 | 跳转到个人中心页 | | ⬜ 待测 |
| 7 | 查看个人中心 | 显示已登录状态 | | ⬜ 待测 |

**预期时长**: 2-3秒

---

### 2.2 网络异常测试

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开登录页 | 正常显示 | | ⬜ 待测 |
| 2 | 开启飞行模式 | - | | ⬜ 待测 |
| 3 | 勾选协议并点击登录 | Toast提示"网络未连接，请检查网络设置" | | ⬜ 待测 |
| 4 | 关闭飞行模式 | - | | ⬜ 待测 |
| 5 | 再次点击登录 | 正常登录 | | ⬜ 待测 |

**预期提示**: "网络未连接，请检查网络设置"

---

### 2.3 code过期测试

**测试方法**: 
1. 获取code后延迟5分钟再调用云函数
2. 或Mock云函数返回errCode=40029

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 触发code过期场景 | - | | ⬜ 待测 |
| 2 | 观察错误提示 | Toast提示"授权已过期，请重新点击登录按钮" | | ⬜ 待测 |
| 3 | 重新点击登录 | 正常登录 | | ⬜ 待测 |

---

### 2.4 快速重复点击测试

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 勾选协议 | - | | ⬜ 待测 |
| 2 | 快速连续点击登录按钮5次 | 仅触发一次登录 | | ⬜ 待测 |
| 3 | 观察按钮状态 | 登录中按钮禁用 | | ⬜ 待测 |
| 4 | 登录完成 | 按钮恢复可用 | | ⬜ 待测 |

**机制**: loginLoading flag防止重复点击

---

### 2.5 协议未勾选测试

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开登录页 | 协议未勾选，按钮禁用 | | ⬜ 待测 |
| 2 | 点击禁用的按钮 | 无响应或Toast提示 | | ⬜ 待测 |
| 3 | 勾选协议 | 按钮变为可用 | | ⬜ 待测 |
| 4 | 点击登录 | 正常登录 | | ⬜ 待测 |

---

### 2.6 Token过期测试

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 手动设置过期Token | uni.setStorageSync('uni_id_token_expired', Date.now() - 1000) | | ⬜ 待测 |
| 2 | 打开任意需要登录的页面 | - | | ⬜ 待测 |
| 3 | 调用isAuthed() | 返回false，自动清理数据 | | ⬜ 待测 |
| 4 | 路由守卫触发 | 跳转到登录页 | | ⬜ 待测 |

---

### 2.7 登录成功后跳转测试

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 从个人中心进入登录页 | fromPage记录 | | ⬜ 待测 |
| 2 | 登录成功 | switchTab到个人中心 | | ⬜ 待测 |
| 3 | 从其他页面进入登录页（如CDK兑换） | fromPage记录 | | ⬜ 待测 |
| 4 | 登录成功 | 返回原页面（或首页） | | ⬜ 待测 |

---

## 三、异常场景测试

### 3.1 云函数返回异常

**Mock云函数返回**:

```javascript
// 测试1: errCode非0
{ errCode: 500, errMsg: '服务器异常' }
// 预期: Toast提示"服务暂时不可用，请稍后重试"

// 测试2: 缺少data
{ errCode: 0, data: null }
// 预期: Toast提示"登录数据异常"

// 测试3: 缺少token
{ errCode: 0, data: { uid: 'xxx' } }
// 预期: Toast提示"登录数据不完整"
```

---

### 3.2 存储失败测试

**Mock存储失败**:

```javascript
// 临时替换uni.setStorageSync
const originalSetStorage = uni.setStorageSync;
uni.setStorageSync = () => {
  throw new Error('存储失败');
};

// 执行登录
// 预期: Toast提示"登录数据保存失败，请检查存储权限"

// 恢复
uni.setStorageSync = originalSetStorage;
```

---

## 四、性能测试

### 4.1 登录耗时测试

**测试方法**:

```javascript
const startTime = Date.now();

await wechatLogin();

const endTime = Date.now();
const duration = endTime - startTime;

console.log('登录耗时:', duration, 'ms');
```

**目标**: < 3000ms

| 网络环境 | 目标时间 | 实际时间 | 是否达标 |
|---------|---------|----------|----------|
| WiFi | <2s | ___ ms | ⬜ |
| 4G | <3s | ___ ms | ⬜ |
| 3G | <5s | ___ ms | ⬜ |

---

### 4.2 内存占用测试

**测试方法**:

```javascript
// 登录前
const before = wx.getPerformance().getMemoryInfo();

// 执行登录
await wechatLogin();

// 登录后
const after = wx.getPerformance().getMemoryInfo();

console.log('内存增长:', (after.totalSize - before.totalSize) / 1024, 'KB');
```

**目标**: 内存增长 < 1MB

---

## 五、兼容性测试

### 5.1 平台兼容性

| 平台 | 版本 | 测试结果 | 备注 |
|------|------|----------|------|
| 微信小程序 | 最新版 | ⬜ 待测 | 主要平台 |
| 微信小程序 | 7.0.x | ⬜ 待测 | 老版本 |
| 微信小程序 | 8.0.x | ⬜ 待测 | 新版本 |

### 5.2 设备兼容性

| 设备 | 系统 | 测试结果 | 备注 |
|------|------|----------|------|
| iPhone SE | iOS 13 | ⬜ 待测 | 老设备 |
| iPhone 12 | iOS 15 | ⬜ 待测 | 标准 |
| 小米 | Android 10 | ⬜ 待测 | Android |

---

## 六、一键测试脚本

### test-ws-m1-w1-001.sh

```bash
#!/bin/bash
# WS-M1-W1-001 一键验证脚本

echo "===== WS-M1-W1-001 测试开始 ====="

# 1. 检查新文件
echo "\n[1/5] 检查新文件..."
if [ ! -f "utils/login-error-handler.js" ]; then
  echo "❌ login-error-handler.js不存在"
  exit 1
fi
echo "✅ login-error-handler.js存在"

# 2. ESLint检查
echo "\n[2/5] ESLint检查..."
npx eslint utils/login-error-handler.js utils/wechat-login.js > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ ESLint检查失败"
  exit 1
fi
echo "✅ ESLint检查通过"

# 3. 单元测试
echo "\n[3/5] 单元测试..."
if [ -f "tests/login-error-handler.test.js" ]; then
  npm run test:login > /dev/null 2>&1
  if [ $? -ne 0 ]; then
    echo "❌ 单元测试失败"
    exit 1
  fi
  echo "✅ 单元测试通过"
else
  echo "⚠️  单元测试文件不存在，跳过"
fi

# 4. 构建测试
echo "\n[4/5] 构建测试..."
npm run build:mp-weixin > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi
echo "✅ 构建成功"

# 5. 检查复用文件未改动
echo "\n[5/5] 验证复用文件..."
if git diff --name-only | grep -q "pages/login/login.vue"; then
  echo "⚠️  login.vue有改动（应仅为可选优化）"
else
  echo "✅ 复用文件未改动"
fi

echo "\n===== 自动化测试完成 ====="
echo "✅ 所有自动化检查通过"
echo "\n请继续手动功能测试:"
echo "  1. 正常登录流程"
echo "  2. 网络异常测试"
echo "  3. code过期测试"
echo "  4. 快速重复点击测试"
```

**运行**:
```bash
chmod +x test-ws-m1-w1-001.sh
./test-ws-m1-w1-001.sh
```

---

## 七、测试用例清单

### 功能测试（10个用例）

- [ ] TC-001: 首次正常登录
- [ ] TC-002: 二次登录（Token有效）
- [ ] TC-003: Token过期后重新登录
- [ ] TC-004: 网络断开场景
- [ ] TC-005: code过期场景
- [ ] TC-006: 快速重复点击
- [ ] TC-007: 协议未勾选
- [ ] TC-008: 云函数异常
- [ ] TC-009: 存储失败
- [ ] TC-010: 登录后跳转

### 性能测试（2个用例）

- [ ] PT-001: 登录耗时 < 3s
- [ ] PT-002: 内存增长 < 1MB

### 兼容性测试（3个用例）

- [ ] CT-001: 微信小程序多版本
- [ ] CT-002: 多设备测试
- [ ] CT-003: 多系统版本

---

## 八、测试报告模板

```markdown
## WS-M1-W1-001 测试报告

### 测试信息
- 测试人: ___
- 测试日期: ___
- 测试环境: 微信小程序 / H5

### 测试结果

#### 单元测试
- login-error-handler.test.js: ✅ 通过 / ❌ 失败
- 覆盖率: ___%

#### 功能测试（10/10）
- 正常流程: ✅ 通过 / ❌ 失败
- 异常流程: ✅ 通过 / ❌ 失败
- 边界场景: ✅ 通过 / ❌ 失败

#### 性能测试
- 登录耗时: ___ms (目标<3000ms)
- 内存占用: ___KB (目标<1024KB)

#### 兼容性测试
- 微信小程序: ✅ 通过 / ❌ 失败
- 多设备: ✅ 通过 / ❌ 失败

### 发现问题
1. [P_] 问题描述...

### 测试结论
- [ ] ✅ 通过，可以合并
- [ ] ⚠️ 有问题，需修复
- [ ] ❌ 失败，需重新开发

### 用户体验评分
- 加载提示: ☆☆☆☆☆ (1-5星)
- 错误提示: ☆☆☆☆☆
- 操作流畅度: ☆☆☆☆☆
- 总体评分: ☆☆☆☆☆
```

---

**测试状态**: 待执行  
**测试负责人**: _______  
**预计测试时间**: 2h

