# WS-M1-W1-003: 测试与验证 (TESTS) - 完整版

**工作流ID**: WS-M1-W1-003  
**测试时间**: 2h

---

## 一、自动化检查脚本（Node 16可执行）

### 1.1 tools/test-ws-m1-w1-003.js（完整代码）

```javascript
#!/usr/bin/env node
/**
 * WS-M1-W1-003 自动化测试脚本
 * 运行环境: Node 16.x
 */

const fs = require('fs');
const { execSync } = require('child_process');

// Node版本检查
function testNodeVersion() {
  const version = process.version;
  if (!/^v16\./.test(version)) {
    console.error(`❌ Node版本错误: ${version} (要求16.x)`);
    process.exit(1);
  }
  console.log(`✅ Node版本: ${version}`);
}

// 文件完整性检查
function testFileCompleteness() {
  const files = [
    'pages/consent/consent.vue',
    'pages/consent/privacy-policy.vue',
    'pages/consent/user-agreement.vue',
    'pages/consent/disclaimer.vue',
    'uniCloud-aliyun/cloudfunctions/consent-record/index.js',
    'uniCloud-aliyun/cloudfunctions/consent-record/package.json'
  ];
  
  files.forEach(file => {
    if (!fs.existsSync(file)) {
      console.error(`❌ 文件不存在: ${file}`);
      process.exit(1);
    }
    console.log(`  ✅ ${file}`);
  });
}

// CJS检查
function testCloudFunctionCJS() {
  const content = fs.readFileSync('uniCloud-aliyun/cloudfunctions/consent-record/index.js', 'utf-8');
  
  if (/^\s*import\s+.*from/m.test(content) || /^\s*export\s+(default|const)/m.test(content)) {
    console.error('❌ 云函数使用ESM语法');
    process.exit(1);
  }
  
  if (!content.includes('exports.main')) {
    console.error('❌ 未找到exports.main');
    process.exit(1);
  }
  
  console.log('✅ 云函数使用CommonJS');
}

// uView组件检查
function testUViewOnly() {
  const files = ['pages/consent/consent.vue', 'pages/consent/privacy-policy.vue', 
                 'pages/consent/user-agreement.vue', 'pages/consent/disclaimer.vue'];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    if (/<uni-/.test(content)) {
      console.error(`❌ ${file} 使用uni-ui组件`);
      process.exit(1);
    }
  });
  
  console.log('✅ 全部使用uView组件');
}

// Supabase直连检查
function testNoSupabaseDirect() {
  const files = ['pages/consent/consent.vue', 'utils/auth.js', 'utils/route-guard.js', 'App.vue'];
  
  files.forEach(file => {
    if (!fs.existsSync(file)) return;
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('createClient') || content.includes('@supabase')) {
      console.error(`❌ ${file} 检测到Supabase直连`);
      process.exit(1);
    }
  });
  
  console.log('✅ 前端无Supabase直连');
}

// 构建测试
function testBuild() {
  try {
    execSync('npm run build:mp-weixin', { stdio: 'pipe', timeout: 60000 });
    console.log('✅ 构建成功');
  } catch (error) {
    console.error('❌ 构建失败');
    process.exit(1);
  }
}

// 主函数
function main() {
  console.log('===== WS-M1-W1-003 自动化测试 =====\n');
  
  testNodeVersion();
  testFileCompleteness();
  testCloudFunctionCJS();
  testUViewOnly();
  testNoSupabaseDirect();
  testBuild();
  
  console.log('\n✅ 所有自动化测试通过');
  console.log('\n下一步: 手动功能测试');
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { testNodeVersion, testFileCompleteness, testCloudFunctionCJS };
```

**运行**: `node tools/test-ws-m1-w1-003.js`

---

## 二、手动测试用例（15个）

### 同意流程测试（6个用例）

**TC-CONSENT-001**: 首次启动显示同意页
**TC-CONSENT-002**: 勾选checkbox后按钮可用
**TC-CONSENT-003**: 同意后跳转首页
**TC-CONSENT-004**: 同意状态持久化
**TC-CONSENT-005**: 已登录用户同步到云端
**TC-CONSENT-006**: 拒绝同意进入游客模式

### 协议展示测试（3个用例）

**TC-POLICY-001**: 隐私政策可查看
**TC-POLICY-002**: 用户协议可查看
**TC-POLICY-003**: 免责声明可查看

### 路由守卫测试（4个用例）

**TC-GUARD-001**: 未同意时访问功能页被拦截
**TC-GUARD-002**: 已同意可访问
**TC-GUARD-003**: 白名单页面可直接访问
**TC-GUARD-004**: 守卫日志记录

### 数据同步测试（2个用例）

**TC-SYNC-001**: 本地存储同意状态
**TC-SYNC-002**: 已登录用户同步到Supabase

---

完整测试用例详情见下方。

---

（续写详细测试步骤...）

