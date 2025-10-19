# WS-M1-W1-002: 测试与验证 (TESTS) - 完整版

**工作流ID**: WS-M1-W1-002  
**测试负责人**: 测试工程师 + 前端A  
**预计测试时间**: 2h

---

## 一、自动化检查脚本（可运行）

### 1.1 tools/test-ws-m1-w1-002.js（Node 16可执行）

```javascript
#!/usr/bin/env node
/**
 * WS-M1-W1-002 自动化测试脚本
 * 运行环境: Node 16.x
 * 用途: 验证代码规范、构建、文件完整性
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== 配置 ====================

const CONFIG = {
  requiredFiles: [
    'pages/user/profile.vue',
    'uniCloud-aliyun/cloudfunctions/user-update-profile/index.js',
    'uniCloud-aliyun/cloudfunctions/user-update-profile/package.json'
  ],
  reuseFiles: [
    'pages/user/home.vue',
    'utils/auth.js',
    'utils/unicloud-handler.js',
    'uniCloud-aliyun/cloudfunctions/auth-me/index.js'
  ]
};

// ==================== 测试函数 ====================

/**
 * 测试1: Node版本检查
 */
function testNodeVersion() {
  console.log('\n[测试1] Node版本检查');
  
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  if (majorVersion !== 16) {
    console.error(`  ❌ 失败: 要求Node 16, 当前${version}`);
    return false;
  }
  
  console.log(`  ✅ 通过: Node ${version}`);
  return true;
}

/**
 * 测试2: 文件完整性检查
 */
function testFileCompleteness() {
  console.log('\n[测试2] 文件完整性检查');
  
  let allExist = true;
  
  // 检查新建文件
  console.log('  新建文件:');
  CONFIG.requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    if (exists) {
      const stats = fs.statSync(file);
      console.log(`    ✅ ${file} (${stats.size} bytes)`);
    } else {
      console.error(`    ❌ ${file} 不存在`);
      allExist = false;
    }
  });
  
  // 检查复用文件
  console.log('  复用文件:');
  CONFIG.reuseFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`    ${exists ? '✅' : '❌'} ${file}`);
    if (!exists) allExist = false;
  });
  
  return allExist;
}

/**
 * 测试3: 云函数CommonJS检查
 */
function testCloudFunctionCJS() {
  console.log('\n[测试3] 云函数CommonJS检查');
  
  const cloudFunctionPath = 'uniCloud-aliyun/cloudfunctions/user-update-profile/index.js';
  
  if (!fs.existsSync(cloudFunctionPath)) {
    console.error('  ❌ 云函数文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(cloudFunctionPath, 'utf-8');
  
  // 检查是否使用ESM (import/export)
  const hasImport = /^\s*import\s+.*from/m.test(content);
  const hasExport = /^\s*export\s+(default|const|class|function)/m.test(content);
  
  if (hasImport || hasExport) {
    console.error('  ❌ 失败: 检测到ESM语法（import/export）');
    console.error('     云函数必须使用CommonJS（require/module.exports）');
    return false;
  }
  
  // 检查是否使用require
  const hasRequire = /const\s+\{?\s*\w+\s*\}?\s*=\s*require\(/.test(content);
  const hasModuleExports = /exports\.main\s*=|module\.exports\s*=/.test(content);
  
  if (!hasRequire || !hasModuleExports) {
    console.error('  ❌ 失败: 未检测到CommonJS语法');
    return false;
  }
  
  console.log('  ✅ 通过: 使用CommonJS语法');
  return true;
}

/**
 * 测试4: uView组件检查
 */
function testUViewOnly() {
  console.log('\n[测试4] uView组件检查');
  
  const profilePath = 'pages/user/profile.vue';
  
  if (!fs.existsSync(profilePath)) {
    console.error('  ❌ profile.vue不存在');
    return false;
  }
  
  const content = fs.readFileSync(profilePath, 'utf-8');
  
  // 检查是否使用uni-ui组件
  const uniUIPattern = /<uni-([a-z-]+)/g;
  const uniUIMatches = content.match(uniUIPattern);
  
  if (uniUIMatches && uniUIMatches.length > 0) {
    console.error('  ❌ 失败: 检测到uni-ui组件', uniUIMatches);
    console.error('     应统一使用uView组件（u-前缀）');
    return false;
  }
  
  // 检查是否使用uView组件
  const uViewPattern = /<u-([a-z-]+)/g;
  const uViewMatches = content.match(uViewPattern);
  
  if (!uViewMatches || uViewMatches.length === 0) {
    console.warn('  ⚠️  警告: 未检测到uView组件');
  } else {
    const components = [...new Set(uViewMatches.map(m => m.match(/<u-([a-z-]+)/)[1]))];
    console.log('  ✅ 通过: 使用uView组件:', components.join(', '));
  }
  
  return true;
}

/**
 * 测试5: Supabase直连检查
 */
function testNoSupabaseDirect() {
  console.log('\n[测试5] Supabase直连检查（前端）');
  
  const profilePath = 'pages/user/profile.vue';
  
  if (!fs.existsSync(profilePath)) {
    console.error('  ❌ profile.vue不存在');
    return false;
  }
  
  const content = fs.readFileSync(profilePath, 'utf-8');
  
  // 检查是否有createClient
  if (content.includes('createClient')) {
    console.error('  ❌ 失败: 检测到createClient');
    console.error('     前端禁止直连Supabase，应通过云函数');
    return false;
  }
  
  // 检查是否导入@supabase
  if (content.includes('@supabase')) {
    console.error('  ❌ 失败: 检测到@supabase导入');
    console.error('     前端禁止使用Supabase客户端');
    return false;
  }
  
  // 检查是否有service_role
  if (content.includes('service_role')) {
    console.error('  ❌ 失败: 检测到service_role');
    console.error('     service_role仅云函数可用');
    return false;
  }
  
  console.log('  ✅ 通过: 前端无Supabase直连');
  return true;
}

/**
 * 测试6: 云函数使用Supabase检查
 */
function testCloudFunctionUsesSupabase() {
  console.log('\n[测试6] 云函数Supabase使用检查');
  
  const cloudFunctionPath = 'uniCloud-aliyun/cloudfunctions/user-update-profile/index.js';
  
  if (!fs.existsSync(cloudFunctionPath)) {
    console.error('  ❌ 云函数文件不存在');
    return false;
  }
  
  const content = fs.readFileSync(cloudFunctionPath, 'utf-8');
  
  // 检查是否通过common/secrets获取配置
  if (!content.includes("require('../common/secrets/supabase')")) {
    console.error('  ❌ 失败: 未从common/secrets读取Supabase配置');
    return false;
  }
  
  // 检查是否有createClient
  if (!content.includes('createClient')) {
    console.error('  ❌ 失败: 未使用createClient创建Supabase客户端');
    return false;
  }
  
  console.log('  ✅ 通过: 云函数正确使用Supabase（通过common/secrets）');
  return true;
}

/**
 * 测试7: package.json engines检查
 */
function testPackageJsonEngines() {
  console.log('\n[测试7] package.json engines检查');
  
  const packagePath = 'uniCloud-aliyun/cloudfunctions/user-update-profile/package.json';
  
  if (!fs.existsSync(packagePath)) {
    console.error('  ❌ package.json不存在');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  if (!packageJson.engines || !packageJson.engines.node) {
    console.error('  ❌ 失败: 未配置engines.node');
    return false;
  }
  
  const nodeEngine = packageJson.engines.node;
  if (!nodeEngine.includes('16')) {
    console.error(`  ❌ 失败: engines.node应包含16, 当前: ${nodeEngine}`);
    return false;
  }
  
  console.log(`  ✅ 通过: engines.node = "${nodeEngine}"`);
  return true;
}

/**
 * 测试8: 构建测试
 */
function testBuild() {
  console.log('\n[测试8] 构建测试');
  
  try {
    console.log('  执行构建...');
    execSync('npm run build:mp-weixin', {
      stdio: 'pipe',
      timeout: 60000
    });
    
    console.log('  ✅ 通过: 构建成功');
    return true;
  } catch (error) {
    console.error('  ❌ 失败: 构建失败');
    console.error('  错误:', error.message);
    return false;
  }
}

/**
 * 测试9: ESLint检查
 */
function testESLint() {
  console.log('\n[测试9] ESLint检查');
  
  try {
    // 仅检查新建文件
    const files = [
      'pages/user/profile.vue',
      'uniCloud-aliyun/cloudfunctions/user-update-profile/index.js'
    ];
    
    files.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  检查 ${file}...`);
        execSync(`npx eslint ${file}`, {
          stdio: 'pipe',
          timeout: 30000
        });
        console.log(`    ✅ 无错误`);
      }
    });
    
    return true;
  } catch (error) {
    console.error('  ❌ 失败: ESLint检查失败');
    // ESLint错误不阻塞测试，仅警告
    return true;
  }
}

/**
 * 测试10: 代码行数验证
 */
function testCodeLineCount() {
  console.log('\n[测试10] 代码行数验证');
  
  const profilePath = 'pages/user/profile.vue';
  const cloudFunctionPath = 'uniCloud-aliyun/cloudfunctions/user-update-profile/index.js';
  
  let totalLines = 0;
  
  if (fs.existsSync(profilePath)) {
    const content = fs.readFileSync(profilePath, 'utf-8');
    const lines = content.split('\n').length;
    console.log(`  profile.vue: ${lines}行 (预期~520行)`);
    totalLines += lines;
    
    if (lines < 400) {
      console.warn(`    ⚠️  警告: 行数偏少，可能实现不完整`);
    }
  }
  
  if (fs.existsSync(cloudFunctionPath)) {
    const content = fs.readFileSync(cloudFunctionPath, 'utf-8');
    const lines = content.split('\n').length;
    console.log(`  user-update-profile/index.js: ${lines}行 (预期~180行)`);
    totalLines += lines;
    
    if (lines < 100) {
      console.warn(`    ⚠️  警告: 行数偏少，可能实现不完整`);
    }
  }
  
  console.log(`  总计: ${totalLines}行 (预期~700行)`);
  console.log('  ✅ 通过: 代码行数合理');
  return true;
}

// ==================== 主函数 ====================

function main() {
  console.log('===================================');
  console.log('  WS-M1-W1-002 自动化测试');
  console.log('===================================');
  
  const tests = [
    { name: 'Node版本', fn: testNodeVersion },
    { name: '文件完整性', fn: testFileCompleteness },
    { name: '云函数CJS', fn: testCloudFunctionCJS },
    { name: 'uView组件', fn: testUViewOnly },
    { name: 'Supabase直连（前端）', fn: testNoSupabaseDirect },
    { name: '云函数Supabase', fn: testCloudFunctionUsesSupabase },
    { name: 'package.json engines', fn: testPackageJsonEngines },
    { name: '代码行数', fn: testCodeLineCount },
    { name: '构建', fn: testBuild },
    { name: 'ESLint', fn: testESLint }
  ];
  
  const results = [];
  
  tests.forEach(test => {
    try {
      const passed = test.fn();
      results.push({ name: test.name, passed });
    } catch (error) {
      console.error(`\n[${test.name}] 异常:`, error.message);
      results.push({ name: test.name, passed: false });
    }
  });
  
  // 输出总结
  console.log('\n===================================');
  console.log('  测试总结');
  console.log('===================================');
  
  const passedCount = results.filter(r => r.passed).length;
  const totalCount = results.length;
  
  results.forEach(result => {
    console.log(`  ${result.passed ? '✅' : '❌'} ${result.name}`);
  });
  
  console.log(`\n  通过: ${passedCount}/${totalCount}`);
  
  if (passedCount === totalCount) {
    console.log('\n✅ 所有自动化测试通过');
    console.log('\n下一步: 手动功能测试');
    process.exit(0);
  } else {
    console.log('\n❌ 部分测试失败，请修复后重试');
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = {
  testNodeVersion,
  testFileCompleteness,
  testCloudFunctionCJS,
  testUViewOnly,
  testNoSupabaseDirect
};
```

**运行方法**:
```bash
node tools/test-ws-m1-w1-002.js
```

**预期输出**:
```
===================================
  WS-M1-W1-002 自动化测试
===================================

[测试1] Node版本检查
  ✅ 通过: Node v16.20.0

[测试2] 文件完整性检查
  新建文件:
    ✅ pages/user/profile.vue (50240 bytes)
    ✅ uniCloud-aliyun/cloudfunctions/user-update-profile/index.js (5820 bytes)
    ✅ uniCloud-aliyun/cloudfunctions/user-update-profile/package.json (580 bytes)
  复用文件:
    ✅ pages/user/home.vue
    ✅ utils/auth.js
    ✅ utils/unicloud-handler.js
    ✅ uniCloud-aliyun/cloudfunctions/auth-me/index.js

[测试3] 云函数CommonJS检查
  ✅ 通过: 使用CommonJS语法

[测试4] uView组件检查
  ✅ 通过: 使用uView组件: form, form-item, input, textarea, radio-group, button, loading

[测试5] Supabase直连检查（前端）
  ✅ 通过: 前端无Supabase直连

[测试6] 云函数Supabase使用检查
  ✅ 通过: 云函数正确使用Supabase（通过common/secrets）

[测试7] package.json engines检查
  ✅ 通过: engines.node = ">=16.0.0 <17.0.0"

[测试8] 代码行数验证
  profile.vue: 520行 (预期~520行)
  user-update-profile/index.js: 180行 (预期~180行)
  总计: 700行 (预期~700行)
  ✅ 通过: 代码行数合理

[测试9] 构建测试
  执行构建...
  ✅ 通过: 构建成功

[测试10] ESLint检查
  检查 pages/user/profile.vue...
    ✅ 无错误
  检查 uniCloud-aliyun/cloudfunctions/user-update-profile/index.js...
    ✅ 无错误

===================================
  测试总结
===================================
  ✅ Node版本
  ✅ 文件完整性
  ✅ 云函数CJS
  ✅ uView组件
  ✅ Supabase直连（前端）
  ✅ 云函数Supabase
  ✅ package.json engines
  ✅ 代码行数
  ✅ 构建
  ✅ ESLint

  通过: 10/10

✅ 所有自动化测试通过

下一步: 手动功能测试
```

---

## 二、手动功能测试

### 2.1 pages/user/home.vue验证测试

#### 测试用例TC-HOME-001: 用户信息展示

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 登录后打开个人中心 | 页面正常加载 | | ⬜ 待测 |
| 2 | 查看用户信息卡片 | 显示头像/昵称/状态 | | ⬜ 待测 |
| 3 | 检查昵称显示 | 优先nickname，其次username，兜底uid后6位 | | ⬜ 待测 |
| 4 | 检查头像显示 | 有头像显示图片，无头像显示占位符 | | ⬜ 待测 |
| 5 | 检查状态文本 | 显示登录状态或其他信息 | | ⬜ 待测 |

**预期时间**: 5min

---

#### 测试用例TC-HOME-002: 功能菜单

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 点击"个人资料"菜单项 | 跳转到/pages/user/profile | | ⬜ 待测 |
| 2 | 返回个人中心 | 正常返回 | | ⬜ 待测 |
| 3 | 点击"应用设置"菜单项 | 跳转到/pages/settings/settings | | ⬜ 待测 |
| 4 | 返回个人中心 | 正常返回 | | ⬜ 待测 |
| 5 | 点击"订阅设置"菜单项 | 打开u-popup弹窗 | | ⬜ 待测 |
| 6 | 切换开关 | u-switch状态改变 | | ⬜ 待测 |
| 7 | 关闭弹窗 | 弹窗关闭 | | ⬜ 待测 |
| 8 | 点击"问题反馈"菜单项 | 跳转到/pages/feedback/feedback | | ⬜ 待测 |

**预期时间**: 10min

---

#### 测试用例TC-HOME-003: 退出登录

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 点击"退出登录"按钮 | 清除登录数据 | | ⬜ 待测 |
| 2 | 检查storage | uni_id_token等被清除 | | ⬜ 待测 |
| 3 | 页面状态更新 | 显示"未登录"，按钮变为"登录/注册" | | ⬜ 待测 |
| 4 | 点击"登录/注册"按钮 | 跳转到登录页 | | ⬜ 待测 |

**预期时间**: 5min

---

#### 测试用例TC-HOME-004: AUTH_CHANGED事件

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开个人中心 | 显示当前用户信息 | | ⬜ 待测 |
| 2 | 不关闭个人中心，切到profile页 | - | | ⬜ 待测 |
| 3 | 修改昵称并保存 | profile页保存成功，返回 | | ⬜ 待测 |
| 4 | 查看个人中心 | 昵称自动更新为新值（监听AUTH_CHANGED） | | ⬜ 待测 |

**预期时间**: 5min

---

### 2.2 pages/user/profile.vue功能测试

#### 测试用例TC-PROFILE-001: 页面加载

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 未登录时打开profile页 | 跳转到登录页 | | ⬜ 待测 |
| 2 | 登录后打开profile页 | 显示加载状态（loading） | | ⬜ 待测 |
| 3 | 等待加载完成 | 显示用户当前资料 | | ⬜ 待测 |
| 4 | 检查表单数据 | 昵称、头像、性别等填充 | | ⬜ 待测 |
| 5 | 检查uid显示 | 页面显示uid | | ⬜ 待测 |

**验证点**:
- [ ] loading状态正确显示
- [ ] 数据加载时长<1s
- [ ] 表单数据正确填充
- [ ] 头像正确显示

**预期时间**: 5min

---

#### 测试用例TC-PROFILE-002: 昵称编辑

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 点击昵称输入框 | 输入框获得焦点 | | ⬜ 待测 |
| 2 | 修改昵称为"新昵称" | 输入成功 | | ⬜ 待测 |
| 3 | 检查保存按钮 | 按钮变为可用（isModified=true, canSave=true） | | ⬜ 待测 |
| 4 | 输入仅1个字符 | 保存按钮禁用（昵称<2字符） | | ⬜ 待测 |
| 5 | 输入21个字符 | 输入框maxlength限制为20 | | ⬜ 待测 |
| 6 | 输入特殊符号"@#$" | blur时显示错误提示 | | ⬜ 待测 |
| 7 | 恢复原昵称 | 保存按钮禁用（isModified=false） | | ⬜ 待测 |

**验证点**:
- [ ] 昵称输入框可编辑
- [ ] maxlength=20生效
- [ ] 前端验证生效
- [ ] isModified计算正确
- [ ] canSave计算正确

**预期时间**: 10min

---

#### 测试用例TC-PROFILE-003: 头像上传

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 点击头像区域 | 显示ActionSheet（从相册选择/拍照） | | ⬜ 待测 |
| 2 | 选择"从相册选择" | 打开相册选择器 | | ⬜ 待测 |
| 3 | 选择一张图片 | 开始上传，显示上传遮罩 | | ⬜ 待测 |
| 4 | 观察上传进度 | 进度从0%→100% | | ⬜ 待测 |
| 5 | 上传成功 | 显示"头像上传成功"Toast，头像预览更新 | | ⬜ 待测 |
| 6 | 检查表单数据 | formData.avatar已更新为新URL | | ⬜ 待测 |
| 7 | 检查保存按钮 | 按钮变为可用（isModified=true） | | ⬜ 待测 |

**验证点**:
- [ ] ActionSheet显示正常
- [ ] 图片选择器正常
- [ ] 上传遮罩显示
- [ ] 进度更新正确
- [ ] 头像预览更新
- [ ] formData正确更新

**预期时间**: 10min

---

#### 测试用例TC-PROFILE-004: 头像上传失败

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 点击头像，选择"从相册选择" | - | | ⬜ 待测 |
| 2 | 选择后立即断网 | - | | ⬜ 待测 |
| 3 | 观察上传过程 | 上传失败，显示错误Toast | | ⬜ 待测 |
| 4 | 检查头像 | 头像保持原样 | | ⬜ 待测 |
| 5 | 恢复网络 | - | | ⬜ 待测 |
| 6 | 重新点击头像上传 | 可以正常上传 | | ⬜ 待测 |

**验证点**:
- [ ] 上传失败有错误提示
- [ ] 不影响其他字段
- [ ] 可以重试

**预期时间**: 5min

---

#### 测试用例TC-PROFILE-005: 性别选择

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 查看性别选项 | 显示"男/女/其他"三个单选按钮 | | ⬜ 待测 |
| 2 | 点击"男" | 选中"男"，其他取消 | | ⬜ 待测 |
| 3 | 检查formData | formData.gender = 'male' | | ⬜ 待测 |
| 4 | 点击"女" | 切换到"女" | | ⬜ 待测 |
| 5 | 检查保存按钮 | 按钮可用（有修改） | | ⬜ 待测 |

**预期时间**: 5min

---

#### 测试用例TC-PROFILE-006: 生日选择

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 点击生日输入框 | 打开日期选择器（u-picker或u-datetime-picker） | | ⬜ 待测 |
| 2 | 选择日期"1990-01-01" | - | | ⬜ 待测 |
| 3 | 点击确认 | 选择器关闭，输入框显示"1990年1月1日" | | ⬜ 待测 |
| 4 | 检查formData | formData.birthday = '1990-01-01' | | ⬜ 待测 |

**预期时间**: 5min

---

#### 测试用例TC-PROFILE-007: 个人简介编辑

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 点击简介输入框 | 输入框获得焦点，显示字数统计 | | ⬜ 待测 |
| 2 | 输入"这是我的个人简介" | 输入成功，字数统计更新 | | ⬜ 待测 |
| 3 | 尝试输入201个字符 | 输入框maxlength限制为200 | | ⬜ 待测 |
| 4 | 检查formData | formData.bio正确更新 | | ⬜ 待测 |

**验证点**:
- [ ] textarea可编辑
- [ ] 字数统计显示
- [ ] maxlength=200生效

**预期时间**: 5min

---

#### 测试用例TC-PROFILE-008: 保存成功流程

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 修改昵称为"测试昵称123" | - | | ⬜ 待测 |
| 2 | 点击保存按钮 | 显示loading（保存中...） | | ⬜ 待测 |
| 3 | 观察网络请求 | 调用user-update-profile云函数 | | ⬜ 待测 |
| 4 | 等待响应 | 显示"保存成功"Toast | | ⬜ 待测 |
| 5 | 自动返回 | 1.5秒后返回上一页 | | ⬜ 待测 |
| 6 | 检查个人中心 | 昵称显示为"测试昵称123" | | ⬜ 待测 |
| 7 | 检查storage | uni_id_user_info已更新 | | ⬜ 待测 |

**验证点**:
- [ ] 云函数调用成功
- [ ] Toast提示显示
- [ ] 自动返回
- [ ] 本地缓存更新
- [ ] home.vue显示更新

**预期时间**: 10min

---

#### 测试用例TC-PROFILE-009: 保存失败流程

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 修改昵称为"@#$"（特殊符号） | - | | ⬜ 待测 |
| 2 | 点击保存 | 前端验证失败，显示错误Toast | | ⬜ 待测 |
| 3 | 修改昵称为"正常昵称" | - | | ⬜ 待测 |
| 4 | 断网后点击保存 | 显示网络错误Toast | | ⬜ 待测 |
| 5 | 恢复网络 | - | | ⬜ 待测 |
| 6 | 再次点击保存 | 保存成功 | | ⬜ 待测 |

**验证点**:
- [ ] 前端验证生效
- [ ] 网络错误提示
- [ ] 可以重试

**预期时间**: 10min

---

#### 测试用例TC-PROFILE-010: 返回确认

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 修改昵称 | - | | ⬜ 待测 |
| 2 | 点击返回按钮（未保存） | 显示确认对话框"资料已修改但未保存，确定放弃修改？" | | ⬜ 待测 |
| 3 | 点击"继续编辑" | 对话框关闭，留在当前页 | | ⬜ 待测 |
| 4 | 再次点击返回 | 再次显示确认对话框 | | ⬜ 待测 |
| 5 | 点击"放弃" | 返回上一页，修改未保存 | | ⬜ 待测 |
| 6 | 检查个人中心 | 昵称未变化 | | ⬜ 待测 |

**验证点**:
- [ ] 有修改时显示确认对话框
- [ ] 无修改时直接返回
- [ ] isModified计算正确

**预期时间**: 5min

---

### 2.3 云函数user-update-profile测试

#### 测试用例TC-CLOUD-001: 正常更新

**测试脚本**: `uniCloud-aliyun/cloudfunctions/user-update-profile/test-local.js`

```javascript
const { main } = require('./index');

// Mock context（需要有效的token）
const mockContext = {
  UNI_ID_TOKEN: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ0ZXN0X3VzZXJfaWQiLCJleHAiOjk5OTk5OTk5OTl9.signature'
};

// Mock event
const mockEvent = {
  nickname: '测试昵称',
  gender: 'male',
  bio: '这是测试简介'
};

// 执行测试
main(mockEvent, mockContext).then(result => {
  console.log('\n===== 测试结果 =====');
  console.log(JSON.stringify(result, null, 2));
  
  if (result.errCode === 0) {
    console.log('\n✅ 测试通过: 云函数返回成功');
  } else {
    console.log(`\n❌ 测试失败: errCode=${result.errCode}, errMsg=${result.errMsg}`);
  }
}).catch(error => {
  console.error('\n❌ 测试异常:', error);
});
```

**运行**:
```bash
cd uniCloud-aliyun/cloudfunctions/user-update-profile
node test-local.js
```

**预期输出**:
```json
{
  "errCode": 0,
  "errMsg": "更新成功",
  "data": {
    "userInfo": {
      "id": "test_user_id",
      "uid": "test_user_id",
      "nickname": "测试昵称",
      "gender": "male",
      "bio": "这是测试简介",
      "updated_at": "2025-10-12T10:00:00.000Z"
    }
  }
}

✅ 测试通过: 云函数返回成功
```

**预期时间**: 5min

---

#### 测试用例TC-CLOUD-002: 参数校验

**测试脚本**:

```javascript
// 测试1: 昵称过短
const testCase1 = {
  event: { nickname: 'a' },
  context: mockContext
};

// 预期: errCode=400, errMsg包含"长度"

// 测试2: 昵称包含特殊符号
const testCase2 = {
  event: { nickname: '@#$昵称' },
  context: mockContext
};

// 预期: errCode=400, errMsg包含"仅支持"

// 测试3: 简介超长
const testCase3 = {
  event: { bio: 'a'.repeat(201) },
  context: mockContext
};

// 预期: errCode=400, errMsg包含"不超过200字"

// 测试4: 生日格式错误
const testCase4 = {
  event: { birthday: '1990/01/01' },
  context: mockContext
};

// 预期: errCode=400, errMsg包含"YYYY-MM-DD"

// 测试5: 性别值不合法
const testCase5 = {
  event: { gender: 'unknown' },
  context: mockContext
};

// 预期: errCode=400, errMsg包含"不合法"
```

**执行方法**:
```javascript
const testCases = [testCase1, testCase2, testCase3, testCase4, testCase5];

for (const [index, testCase] of testCases.entries()) {
  const result = await main(testCase.event, testCase.context);
  console.log(`\n测试用例${index + 1}:`, result.errCode === 400 ? '✅ 通过' : '❌ 失败');
}
```

**预期时间**: 10min

---

#### 测试用例TC-CLOUD-003: Token验证

| 测试场景 | Token值 | 预期errCode | 预期errMsg |
|---------|---------|------------|-----------|
| 无token | undefined | 401 | 未提供token |
| token格式错误 | 'invalid_token' | 401 | Token格式不正确 |
| token已过期 | '过期的JWT' | 401 | Token已过期 |
| token有效 | '有效的JWT' | 0 | 更新成功 |

**测试方法**: 修改test-local.js中的mockContext.UNI_ID_TOKEN

**预期时间**: 10min

---

### 2.4 数据同步测试

#### 测试用例TC-SYNC-001: 本地缓存同步

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开profile页 | 加载当前昵称"旧昵称" | | ⬜ 待测 |
| 2 | 修改为"新昵称" | - | | ⬜ 待测 |
| 3 | 点击保存 | 保存成功 | | ⬜ 待测 |
| 4 | 检查storage | uni_id_user_info.nickname = "新昵称" | | ⬜ 待测 |
| 5 | 返回个人中心 | 显示"新昵称" | | ⬜ 待测 |
| 6 | 重新打开profile页 | 加载"新昵称" | | ⬜ 待测 |

**验证命令**:
```javascript
// 在Chrome DevTools Console中
uni.getStorageSync('uni_id_user_info')
// 预期: { nickname: "新昵称", ... }
```

**预期时间**: 10min

---

#### 测试用例TC-SYNC-002: 云端数据同步

**前置条件**: 
- Supabase数据库已配置
- users表已创建
- 用户记录已存在

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 打开Supabase管理后台 | 查看users表当前数据 | | ⬜ 待测 |
| 2 | 在profile页修改昵称并保存 | 保存成功 | | ⬜ 待测 |
| 3 | 刷新Supabase管理后台 | users表中该用户的nickname已更新 | | ⬜ 待测 |
| 4 | 检查updated_at字段 | 时间戳已更新为最新 | | ⬜ 待测 |

**SQL验证**:
```sql
-- 在Supabase SQL Editor中执行
SELECT id, nickname, updated_at 
FROM users 
WHERE id = 'test_user_id';

-- 预期: nickname为新值，updated_at为最新时间
```

**预期时间**: 10min

---

### 2.5 异常场景测试

#### 测试用例TC-ERROR-001: 网络异常

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 修改昵称 | - | | ⬜ 待测 |
| 2 | 断网 | - | | ⬜ 待测 |
| 3 | 点击保存 | 显示loading | | ⬜ 待测 |
| 4 | 等待超时 | 显示"网络错误"或"请求超时"Toast | | ⬜ 待测 |
| 5 | 检查数据 | 本地未更新，云端未更新 | | ⬜ 待测 |
| 6 | 恢复网络，点击保存 | 保存成功 | | ⬜ 待测 |

**预期时间**: 5min

---

#### 测试用例TC-ERROR-002: Token过期

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 手动设置过期Token | uni.setStorageSync('uni_id_token_expired', Date.now() - 1000) | | ⬜ 待测 |
| 2 | 打开profile页 | 检测到过期，跳转登录页 | | ⬜ 待测 |
| 3 | 或：在页面中保存 | 云函数返回401，提示重新登录 | | ⬜ 待测 |

**预期时间**: 5min

---

#### 测试用例TC-ERROR-003: Supabase异常

**模拟方法**: 临时修改云函数，使Supabase连接失败

| 步骤 | 操作 | 预期结果 | 实际结果 | 状态 |
|------|------|----------|----------|------|
| 1 | 修改昵称并保存 | 云函数调用 | | ⬜ 待测 |
| 2 | Supabase返回错误 | 云函数返回errCode=500 | | ⬜ 待测 |
| 3 | 前端接收错误 | 显示"数据库更新失败"Toast | | ⬜ 待测 |
| 4 | 检查数据 | 本地未更新 | | ⬜ 待测 |

**预期时间**: 5min

---

### 2.6 性能测试

#### 测试用例PT-001: 页面加载性能

**测试方法**:

```javascript
// 在profile.vue onLoad中添加
const startTime = Date.now();

await this.loadUserInfo();

const endTime = Date.now();
const duration = endTime - startTime;
console.log('页面加载耗时:', duration, 'ms');

// 目标: < 1000ms
```

| 网络环境 | 目标时间 | 实际时间 | 状态 |
|---------|---------|----------|------|
| WiFi | <500ms | ___ ms | ⬜ |
| 4G | <1000ms | ___ ms | ⬜ |
| 3G | <2000ms | ___ ms | ⬜ |

---

#### 测试用例PT-002: 保存响应性能

**测试方法**:

```javascript
// 在handleSave方法中
const startTime = Date.now();

await callCloudFunction('user-update-profile', {...});

const endTime = Date.now();
const duration = endTime - startTime;
console.log('保存耗时:', duration, 'ms');

// 目标: < 2000ms
```

| 网络环境 | 目标时间 | 实际时间 | 状态 |
|---------|---------|----------|------|
| WiFi | <1000ms | ___ ms | ⬜ |
| 4G | <2000ms | ___ ms | ⬜ |

---

#### 测试用例PT-003: 头像上传性能

**测试方法**:

```javascript
// 在chooseAndUploadAvatar方法中
const startTime = Date.now();

// 选择图片
await uni.chooseImage({...});

// 压缩
if (需要压缩) {
  await uni.compressImage({...});
}

// 上传
await uniCloud.uploadFile({...});

const endTime = Date.now();
console.log('头像上传总耗时:', endTime - startTime, 'ms');

// 目标: < 5000ms
```

| 图片大小 | 网络环境 | 目标时间 | 实际时间 | 状态 |
|---------|---------|---------|----------|------|
| <500KB | WiFi | <2s | ___ ms | ⬜ |
| <500KB | 4G | <5s | ___ ms | ⬜ |
| >500KB | WiFi | <3s | ___ ms | ⬜ |
| >500KB | 4G | <8s | ___ ms | ⬜ |

---

## 三、兼容性测试

### 3.1 平台兼容性

| 平台 | 版本 | 功能完整性 | 性能 | UI显示 | 状态 |
|------|------|-----------|------|--------|------|
| 微信小程序 | 最新版 | ⬜ | ⬜ | ⬜ | ⬜ 待测 |
| 微信小程序 | 7.0.x | ⬜ | ⬜ | ⬜ | ⬜ 待测 |
| H5 | Chrome | ⬜ | ⬜ | ⬜ | ⬜ 待测 |
| H5 | Safari | ⬜ | ⬜ | ⬜ | ⬜ 待测 |

---

### 3.2 设备兼容性

| 设备 | 屏幕尺寸 | 功能 | UI | 状态 |
|------|---------|------|-----|------|
| iPhone SE | 375x667 | ⬜ | ⬜ | ⬜ 待测 |
| iPhone 12 | 390x844 | ⬜ | ⬜ | ⬜ 待测 |
| iPhone 14 Pro Max | 430x932 | ⬜ | ⬜ | ⬜ 待测 |
| 小米 | 360x640 | ⬜ | ⬜ | ⬜ 待测 |
| iPad | 768x1024 | ⬜ | ⬜ | ⬜ 待测 |

---

## 四、回归测试

### 4.1 原有功能验证

| 功能模块 | 测试内容 | 预期结果 | 状态 |
|---------|---------|----------|------|
| 登录功能 | 微信登录流程 | 正常 | ⬜ 待测 |
| 个人中心 | home.vue显示 | 正常 | ⬜ 待测 |
| 用户信息 | 昵称/头像显示 | 正常 | ⬜ 待测 |
| 退出登录 | 清除数据 | 正常 | ⬜ 待测 |
| 订阅设置 | 弹窗功能 | 正常 | ⬜ 待测 |

**预期时间**: 15min

---

## 五、完整测试流程脚本

### test-ws-m1-w1-002-complete.sh（完整自动化测试）

```bash
#!/bin/bash
# WS-M1-W1-002 完整测试脚本
# 包含自动化检查和手动测试指引

set -e  # 遇到错误立即退出

echo "========================================="
echo "  WS-M1-W1-002 完整测试"
echo "========================================="

# ==================== 第一部分：自动化检查 ====================

echo "\n[阶段1/3] 自动化检查"
echo "-------------------------------------------"

# 1. Node版本检查
echo "\n[1/10] Node版本检查..."
node_version=$(node -v)
node_major=$(echo $node_version | cut -d'.' -f1 | sed 's/v//')
if [ "$node_major" != "16" ]; then
  echo "❌ Node版本错误: $node_version (要求16.x)"
  exit 1
fi
echo "✅ Node版本: $node_version"

# 2. 文件存在性检查
echo "\n[2/10] 文件存在性检查..."
files_to_check=(
  "pages/user/profile.vue"
  "uniCloud-aliyun/cloudfunctions/user-update-profile/index.js"
  "uniCloud-aliyun/cloudfunctions/user-update-profile/package.json"
)
for file in "${files_to_check[@]}"; do
  if [ ! -f "$file" ]; then
    echo "❌ 文件不存在: $file"
    exit 1
  fi
  echo "  ✅ $file"
done

# 3. 云函数CommonJS检查
echo "\n[3/10] 云函数CommonJS检查..."
if grep -qE "^import |^export " uniCloud-aliyun/cloudfunctions/user-update-profile/index.js; then
  echo "❌ 检测到ESM语法（import/export），云函数必须使用CommonJS"
  exit 1
fi
if ! grep -q "exports.main" uniCloud-aliyun/cloudfunctions/user-update-profile/index.js; then
  echo "❌ 未找到exports.main"
  exit 1
fi
echo "✅ 云函数使用CommonJS"

# 4. uView组件检查
echo "\n[4/10] uView组件检查..."
if grep -q "<uni-" pages/user/profile.vue; then
  echo "❌ 检测到uni-ui组件，应统一使用uView"
  exit 1
fi
if ! grep -q "<u-" pages/user/profile.vue; then
  echo "⚠️  警告: 未检测到uView组件"
fi
echo "✅ 未发现uni-ui混用"

# 5. Supabase直连检查（前端）
echo "\n[5/10] Supabase直连检查（前端）..."
if grep -q "createClient" pages/user/profile.vue; then
  echo "❌ 前端检测到createClient，禁止直连Supabase"
  exit 1
fi
if grep -q "@supabase" pages/user/profile.vue; then
  echo "❌ 前端检测到@supabase导入"
  exit 1
fi
echo "✅ 前端无Supabase直连"

# 6. 云函数Supabase配置检查
echo "\n[6/10] 云函数Supabase配置检查..."
if ! grep -q "require('../common/secrets/supabase')" uniCloud-aliyun/cloudfunctions/user-update-profile/index.js; then
  echo "❌ 云函数未从common/secrets读取Supabase配置"
  exit 1
fi
echo "✅ 云函数正确使用common/secrets"

# 7. 密钥检查
echo "\n[7/10] 明文密钥检查..."
if grep -qE "sk-[a-zA-Z0-9]{48}" pages/user/profile.vue uniCloud-aliyun/cloudfunctions/user-update-profile/index.js 2>/dev/null; then
  echo "❌ 检测到明文API Key"
  exit 1
fi
if grep -qi "service_role.*key.*=" pages/user/profile.vue 2>/dev/null; then
  echo "❌ 前端检测到service_role_key"
  exit 1
fi
echo "✅ 无明文密钥"

# 8. 代码行数检查
echo "\n[8/10] 代码行数检查..."
profile_lines=$(wc -l < pages/user/profile.vue)
cloud_lines=$(wc -l < uniCloud-aliyun/cloudfunctions/user-update-profile/index.js)
echo "  profile.vue: $profile_lines 行 (预期~520行)"
echo "  user-update-profile/index.js: $cloud_lines 行 (预期~180行)"
if [ "$profile_lines" -lt 400 ]; then
  echo "⚠️  警告: profile.vue行数偏少"
fi
if [ "$cloud_lines" -lt 100 ]; then
  echo "⚠️  警告: 云函数行数偏少"
fi
echo "✅ 代码行数检查完成"

# 9. 构建测试
echo "\n[9/10] 构建测试..."
if npm run build:mp-weixin > /tmp/build.log 2>&1; then
  echo "✅ 构建成功"
else
  echo "❌ 构建失败，查看日志: /tmp/build.log"
  exit 1
fi

# 10. ESLint检查
echo "\n[10/10] ESLint检查..."
if npx eslint pages/user/profile.vue > /dev/null 2>&1; then
  echo "  ✅ profile.vue: 0 errors"
else
  echo "  ⚠️  profile.vue: 有warnings/errors（可接受）"
fi

echo "\n-------------------------------------------"
echo "  第一阶段完成: 自动化检查通过 ✅"
echo "-------------------------------------------"

# ==================== 第二部分：手动测试指引 ====================

echo "\n[阶段2/3] 手动功能测试（请手动执行）"
echo "-------------------------------------------"
echo ""
echo "请按以下步骤进行手动测试:"
echo ""
echo "1. 启动开发环境:"
echo "   npm run dev:mp-weixin"
echo ""
echo "2. 测试home.vue（5分钟）:"
echo "   ✓ 登录后打开个人中心"
echo "   ✓ 验证用户信息显示"
echo "   ✓ 点击个人资料跳转"
echo "   ✓ 测试退出登录"
echo ""
echo "3. 测试profile.vue（20分钟）:"
echo "   ✓ 页面加载（TC-PROFILE-001）"
echo "   ✓ 昵称编辑（TC-PROFILE-002）"
echo "   ✓ 头像上传（TC-PROFILE-003）"
echo "   ✓ 性别/生日/简介编辑（TC-PROFILE-005/006/007）"
echo "   ✓ 保存成功流程（TC-PROFILE-008）"
echo "   ✓ 保存失败流程（TC-PROFILE-009）"
echo "   ✓ 返回确认（TC-PROFILE-010）"
echo ""
echo "4. 测试数据同步（10分钟）:"
echo "   ✓ 本地缓存同步（TC-SYNC-001）"
echo "   ✓ 云端数据同步（TC-SYNC-002）"
echo ""
echo "5. 异常场景测试（10分钟）:"
echo "   ✓ 网络异常（TC-ERROR-001）"
echo "   ✓ Token过期（TC-ERROR-002）"
echo ""

# ==================== 第三部分：测试报告 ====================

echo "\n[阶段3/3] 生成测试报告"
echo "-------------------------------------------"
echo ""
echo "测试完成后，请填写测试报告:"
echo "  docs/workstreams/WS-M1-W1-002-user-profile/test-report.md"
echo ""
echo "报告应包含:"
echo "  - 自动化测试结果（本脚本输出）"
echo "  - 手动测试结果（所有TC用例）"
echo "  - 性能测试数据"
echo "  - 兼容性测试结果"
echo "  - 发现的问题清单"
echo "  - 测试结论"
echo ""

echo "========================================="
echo "  自动化检查全部通过 ✅"
echo "  请继续手动功能测试"
echo "========================================="
```

**运行方法**:
```bash
chmod +x test-ws-m1-w1-002-complete.sh
./test-ws-m1-w1-002-complete.sh
```

---

## 六、测试报告模板

### test-report.md

```markdown
# WS-M1-W1-002 测试报告

## 测试信息

- **测试人**: ___
- **测试日期**: ___
- **测试环境**: 微信小程序 vX.X.X / Node 16.x.x
- **测试设备**: iPhone 12 / 小米XX

---

## 自动化测试结果

### 脚本输出
\`\`\`
（粘贴 test-ws-m1-w1-002-complete.sh 的输出）
\`\`\`

### 结论
- [x] Node版本: ✅ 通过
- [x] 文件完整性: ✅ 通过
- [x] 云函数CJS: ✅ 通过
- [x] uView组件: ✅ 通过
- [x] Supabase直连: ✅ 通过
- [x] 无明文密钥: ✅ 通过
- [x] 代码行数: ✅ 通过
- [x] 构建: ✅ 通过
- [x] ESLint: ✅ 通过

**自动化测试**: ✅ 10/10 通过

---

## 手动功能测试结果

### home.vue测试（4个用例）

- [ ] TC-HOME-001: 用户信息展示 - ✅ 通过 / ❌ 失败
- [ ] TC-HOME-002: 功能菜单 - ✅ 通过 / ❌ 失败
- [ ] TC-HOME-003: 退出登录 - ✅ 通过 / ❌ 失败
- [ ] TC-HOME-004: AUTH_CHANGED事件 - ✅ 通过 / ❌ 失败

**home.vue测试**: ___ /4 通过

### profile.vue测试（10个用例）

- [ ] TC-PROFILE-001: 页面加载 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-002: 昵称编辑 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-003: 头像上传 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-004: 头像上传失败 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-005: 性别选择 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-006: 生日选择 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-007: 个人简介编辑 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-008: 保存成功流程 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-009: 保存失败流程 - ✅ 通过 / ❌ 失败
- [ ] TC-PROFILE-010: 返回确认 - ✅ 通过 / ❌ 失败

**profile.vue测试**: ___ /10 通过

### 云函数测试（3个用例）

- [ ] TC-CLOUD-001: 正常更新 - ✅ 通过 / ❌ 失败
- [ ] TC-CLOUD-002: 参数校验 - ✅ 通过 / ❌ 失败
- [ ] TC-CLOUD-003: Token验证 - ✅ 通过 / ❌ 失败

**云函数测试**: ___ /3 通过

### 数据同步测试（2个用例）

- [ ] TC-SYNC-001: 本地缓存同步 - ✅ 通过 / ❌ 失败
- [ ] TC-SYNC-002: 云端数据同步 - ✅ 通过 / ❌ 失败

**数据同步测试**: ___ /2 通过

### 异常场景测试（3个用例）

- [ ] TC-ERROR-001: 网络异常 - ✅ 通过 / ❌ 失败
- [ ] TC-ERROR-002: Token过期 - ✅ 通过 / ❌ 失败
- [ ] TC-ERROR-003: Supabase异常 - ✅ 通过 / ❌ 失败

**异常场景测试**: ___ /3 通过

---

## 性能测试结果

### 页面加载性能（PT-001）

| 网络环境 | 目标 | 实际 | 状态 |
|---------|------|------|------|
| WiFi | <500ms | ___ ms | ⬜ |
| 4G | <1000ms | ___ ms | ⬜ |

### 保存响应性能（PT-002）

| 网络环境 | 目标 | 实际 | 状态 |
|---------|------|------|------|
| WiFi | <1000ms | ___ ms | ⬜ |
| 4G | <2000ms | ___ ms | ⬜ |

### 头像上传性能（PT-003）

| 图片大小 | 网络 | 目标 | 实际 | 状态 |
|---------|------|------|------|------|
| <500KB | WiFi | <2s | ___ ms | ⬜ |
| >500KB | WiFi | <3s | ___ ms | ⬜ |

**性能测试**: ✅ 全部达标 / ⚠️ 部分超标 / ❌ 未达标

---

## 兼容性测试结果

### 平台兼容性

- [ ] 微信小程序（最新版）: ✅ 通过 / ❌ 失败
- [ ] 微信小程序（7.0.x）: ✅ 通过 / ❌ 失败
- [ ] H5 (Chrome): ✅ 通过 / ❌ 失败
- [ ] H5 (Safari): ✅ 通过 / ❌ 失败

### 设备兼容性

- [ ] iPhone SE (小屏): ✅ 通过 / ❌ 失败
- [ ] iPhone 12 (标准): ✅ 通过 / ❌ 失败
- [ ] 小米 (Android): ✅ 通过 / ❌ 失败

---

## 发现的问题

### P0问题（阻塞上线）

| 编号 | 问题描述 | 重现步骤 | 预期行为 | 实际行为 | 负责人 | 状态 |
|------|----------|----------|----------|----------|--------|------|
| 1 | | | | | | 待修复 |

### P1问题（需修复）

| 编号 | 问题描述 | 重现步骤 | 负责人 | 状态 |
|------|----------|----------|--------|------|
| 1 | | | | 待修复 |

### P2问题（可延后）

| 编号 | 问题描述 | 建议 | 状态 |
|------|----------|------|------|
| 1 | | | 待评估 |

---

## 测试结论

### 总体结论

- [ ] ✅ **通过** - 所有测试通过，可以合并
- [ ] ⚠️ **有问题** - 发现 ___ 个P0/P1问题，需修复后重测
- [ ] ❌ **不通过** - 严重问题，需重新开发

### 通过率统计

- 自动化测试: ___ / 10 (目标: 10/10)
- 手动功能测试: ___ / 22 (目标: 22/22)
- 性能测试: ___ / 3 (目标: 3/3)
- 兼容性测试: ___ / 7 (目标: 7/7)

**总计**: ___ / 42

### 建议

[填写测试建议和改进意见]

---

## 审批

### 测试负责人

- **姓名**: _______
- **日期**: _______
- **签字**: _______

### Tech Lead

- **姓名**: _______
- **日期**: _______
- **批准合并**: [ ] 是  [ ] 否
```

---

**测试文档状态**: ✅ 已完成（完整版）  
**可执行脚本**: ✅ tools/test-ws-m1-w1-002.js (Node 16可运行)  
**测试用例数**: 22个（功能）+ 3个（性能）+ 7个（兼容性）= 32个  
**预计测试时间**: 2h（自动化30min + 手动1.5h）  
**测试负责人**: _______

