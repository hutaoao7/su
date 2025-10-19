# WS-M0-001: 测试与验证 (TESTS)

**工作流ID**: WS-M0-001  
**测试负责人**: 测试工程师 + 前端开发  
**测试时间**: 2h

---

## 一、自动化检查脚本

### 1.1 tools/check-ui-consistency.js

**用途**: 自动检测UI组件库使用一致性

**运行方式**:
```bash
node tools/check-ui-consistency.js
```

**检查项**:
1. ✅ 检查uView是否安装（package.json）
2. ✅ 扫描所有.vue文件
3. ✅ 识别u-组件使用情况
4. ✅ 识别uni-组件混用（报错）
5. ✅ 输出组件使用统计

**成功标准**:
```
✅ uView已安装: ^2.0.36
✅ 未发现uni-ui组件混用
✅ 所有u-组件可正常引用
✅ 检查通过
```

**失败场景**:
```
❌ 错误文件: 2
❌ pages/xxx/xxx.vue
   发现uni-ui组件: uni-popup，应使用uView组件替代
❌ 检查失败
```

---

### 1.2 tools/check-engines.js

**用途**: 检查Node版本和依赖

```javascript
#!/usr/bin/env node
/**
 * 环境检查脚本
 */

const fs = require('fs');
const { execSync } = require('child_process');

function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  console.log(`Node版本: ${version}`);
  
  if (majorVersion !== 16) {
    console.error(`❌ 要求Node 16 LTS，当前: ${version}`);
    return false;
  }
  
  console.log('✅ Node版本检查通过');
  return true;
}

function checkPackageInstalled(packageName) {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const installed = packageJson.dependencies && packageJson.dependencies[packageName];
  
  if (!installed) {
    console.error(`❌ ${packageName} 未安装`);
    return false;
  }
  
  console.log(`✅ ${packageName}: ${installed}`);
  return true;
}

function main() {
  console.log('===== 环境检查 =====\n');
  
  const checks = [
    checkNodeVersion(),
    checkPackageInstalled('uview-ui'),
    checkPackageInstalled('vue'),
  ];
  
  const allPassed = checks.every(check => check);
  
  if (allPassed) {
    console.log('\n✅ 所有检查通过');
    process.exit(0);
  } else {
    console.log('\n❌ 检查失败');
    process.exit(1);
  }
}

main();
```

**运行方式**:
```bash
node tools/check-engines.js
```

---

## 二、构建验证

### 2.1 开发环境构建

```bash
# 微信小程序
npm run dev:mp-weixin

# H5
npm run dev:h5

# APP
npm run dev:app-plus
```

**检查项**:
- [ ] 构建成功，无error
- [ ] 无uView相关warning
- [ ] dist目录生成正常

**预期时间**: 30s-1min

---

### 2.2 生产环境构建

```bash
npm run build:mp-weixin
```

**检查项**:
- [ ] 构建成功
- [ ] 包体积检查（主包<2MB）
- [ ] 无console报错

**包体积检查**:
```bash
# 检查构建产物大小
du -sh unpackage/dist/build/mp-weixin/

# 预期: < 2MB (主包)
```

---

## 三、手动功能测试

### 3.1 pages/user/home.vue

**测试场景1: u-popup弹窗**

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开个人中心页 | 页面正常显示 | | 待测 |
| 2 | 点击"订阅设置"按钮 | u-popup从底部弹出 | | 待测 |
| 3 | 查看弹窗样式 | 圆角24px，高度60% | | 待测 |
| 4 | 点击遮罩关闭 | 弹窗关闭 | | 待测 |

**测试场景2: u-switch开关**

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 查看订阅项 | 显示多个switch开关 | | 待测 |
| 2 | 点击switch | 状态切换，颜色变化 | | 待测 |
| 3 | 再次点击 | 恢复原状态 | | 待测 |

**截图位置**: `docs/workstreams/WS-M0-001-ui-lib-unify/screenshots/user-home-*.png`

---

### 3.2 pages/features/features.vue

**测试场景: u-icon图标**

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开功能探索页 | 页面正常显示 | | 待测 |
| 2 | 查看卡片图标 | 图标正常显示，颜色#0A84FF | | 待测 |
| 3 | 检查图标名称 | file-text, account, moon, heart | | 待测 |

**注意**: 如果图标显示异常，需检查图标名称是否在uView图标库中。

**图标库查询**: https://www.uviewui.com/components/icon.html

---

### 3.3 components/scale/ScaleRunner.vue

**测试场景1: u-input文本输入**

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开任意评估页面 | 评估页面加载 | | 待测 |
| 2 | 到达时间输入题 | 显示u-input | | 待测 |
| 3 | 输入"23:30" | 可正常输入 | | 待测 |
| 4 | 触发blur事件 | handleTimeInput被调用 | | 待测 |

**测试场景2: u-input数字输入**

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 到达数字输入题 | 显示u-input type="number" | | 待测 |
| 2 | 输入数字 | 可正常输入 | | 待测 |
| 3 | 输入非数字 | 被阻止或提示 | | 待测 |

---

### 3.4 pages/cdk/redeem.vue

**测试场景: CDK兑换输入**

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开CDK兑换页 | 页面正常显示 | | 待测 |
| 2 | u-input输入CDK | 可输入16位字符 | | 待测 |
| 3 | 点击兑换按钮 | 触发兑换逻辑 | | 待测 |

---

## 四、样式一致性测试

### 4.1 组件样式检查

**检查项**:
- [ ] u-popup: 圆角、高度、背景色正常
- [ ] u-switch: 激活/未激活状态颜色正常
- [ ] u-icon: 大小、颜色正常
- [ ] u-input: 边框、placeholder、输入文字样式正常
- [ ] u-button: 类型样式（primary/default/warning）正常

### 4.2 主题一致性

**检查项**:
- [ ] 主色调: #007AFF
- [ ] 圆角: 保持统一（8px/12px/24px）
- [ ] 字体: 保持原有字体
- [ ] 间距: 保持原有间距

---

## 五、兼容性测试

### 5.1 平台兼容性

| 平台 | 版本 | 测试结果 | 备注 |
|------|------|----------|------|
| 微信小程序 | 最新版 | 待测 | 主要平台 |
| 微信小程序 | 7.0.x | 待测 | 兼容旧版 |
| H5 | Chrome | 待测 | - |
| H5 | Safari | 待测 | iOS |
| APP | Android | 待测 | - |
| APP | iOS | 待测 | - |

### 5.2 设备兼容性

| 设备类型 | 屏幕尺寸 | 测试结果 | 备注 |
|---------|----------|----------|------|
| iPhone SE | 375x667 | 待测 | 小屏 |
| iPhone 12 | 390x844 | 待测 | 标准 |
| iPhone 12 Pro Max | 428x926 | 待测 | 大屏 |
| Android | 360x640 | 待测 | 小屏 |
| Pad | 768x1024 | 待测 | 平板 |

---

## 六、性能测试

### 6.1 首屏加载时间

**测试方法**:
```javascript
// 在App.vue onLaunch中
const startTime = Date.now();

// 在首页onReady中
const endTime = Date.now();
console.log('首屏加载时间:', endTime - startTime, 'ms');
```

**目标**: < 2000ms

| 平台 | 首屏时间 | 是否达标 | 备注 |
|------|----------|----------|------|
| 微信小程序 | ___ ms | ⬜ | 目标<2000ms |
| H5 | ___ ms | ⬜ | 目标<2000ms |
| APP | ___ ms | ⬜ | 目标<2000ms |

### 6.2 包体积

```bash
# 检查主包大小
du -h unpackage/dist/build/mp-weixin/*.js

# 检查分包大小
du -h unpackage/dist/build/mp-weixin/pages/
```

**目标**: 主包 < 2MB

| 包 | 大小 | 是否达标 | 备注 |
|----|------|----------|------|
| 主包 | ___ KB | ⬜ | 目标<2048KB |
| 分包1 | ___ KB | ⬜ | - |
| 总计 | ___ KB | ⬜ | 目标<5120KB |

---

## 七、回归测试

### 7.1 原有功能验证

**测试用例**:
- [ ] 微信登录流程
- [ ] 用户信息展示
- [ ] 评估答题流程
- [ ] 结果查看
- [ ] 历史记录
- [ ] CDK兑换
- [ ] 设置页面

**预期**: 所有功能无影响

### 7.2 已知问题验证

如果之前有已知问题，验证是否已修复：
- [ ] 问题1: ___
- [ ] 问题2: ___

---

## 八、测试报告模板

```markdown
## UI组件库统一测试报告

### 测试信息
- 测试人: ___
- 测试日期: ___
- 测试环境: ___

### 测试结果
- 自动化检查: ✅ 通过 / ❌ 失败
- 构建验证: ✅ 通过 / ❌ 失败
- 功能测试: ✅ 通过 / ❌ 失败
- 样式测试: ✅ 通过 / ❌ 失败
- 兼容性测试: ✅ 通过 / ❌ 失败
- 性能测试: ✅ 通过 / ❌ 失败

### 发现问题
1. [P0] 问题描述...
2. [P1] 问题描述...

### 测试结论
- [ ] ✅ 通过，可以合并
- [ ] ⚠️ 有问题，需修复后重测
- [ ] ❌ 失败，需重新开发

### 备注
___
```

---

## 九、快速验证脚本

创建一键验证脚本 `test-ws-m0-001.sh`:

```bash
#!/bin/bash
# WS-M0-001 一键验证脚本

echo "===== WS-M0-001 测试开始 ====="

# 1. 环境检查
echo "\n[1/5] 环境检查..."
node tools/check-engines.js
if [ $? -ne 0 ]; then
  echo "❌ 环境检查失败"
  exit 1
fi

# 2. UI一致性检查
echo "\n[2/5] UI一致性检查..."
node tools/check-ui-consistency.js
if [ $? -ne 0 ]; then
  echo "❌ UI一致性检查失败"
  exit 1
fi

# 3. 依赖安装检查
echo "\n[3/5] 依赖检查..."
npm ls uview-ui > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ uView未安装"
  exit 1
fi
echo "✅ uView已安装"

# 4. 构建测试
echo "\n[4/5] 构建测试..."
npm run build:mp-weixin > /dev/null 2>&1
if [ $? -ne 0 ]; then
  echo "❌ 构建失败"
  exit 1
fi
echo "✅ 构建成功"

# 5. 包体积检查
echo "\n[5/5] 包体积检查..."
MAIN_SIZE=$(du -sk unpackage/dist/build/mp-weixin/ | cut -f1)
if [ $MAIN_SIZE -gt 2048 ]; then
  echo "⚠️  主包超过2MB: ${MAIN_SIZE}KB"
else
  echo "✅ 包体积正常: ${MAIN_SIZE}KB"
fi

echo "\n===== 测试完成 ====="
echo "✅ 所有自动化检查通过"
echo "⚠️  请继续进行手动功能测试"
```

**运行方式**:
```bash
chmod +x test-ws-m0-001.sh
./test-ws-m0-001.sh
```

---

**测试状态**: 待执行  
**测试负责人**: _______  
**测试日期**: _______

