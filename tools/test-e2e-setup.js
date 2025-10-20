/**
 * E2E测试环境配置脚本
 * 用于准备端到端测试环境
 */

const fs = require('fs');
const path = require('path');

// 配置常量
const E2E_CONFIG = {
  testDir: 'tests/e2e',
  testCases: [
    // 登录注册流程
    {
      category: '登录注册',
      cases: [
        { id: 'TC-001', name: '微信登录成功', priority: 'P0' },
        { id: 'TC-002', name: '登录失败重试', priority: 'P1' },
        { id: 'TC-003', name: '用户协议同意流程', priority: 'P0' },
        { id: 'TC-004', name: '首次登录引导', priority: 'P1' }
      ]
    },
    // 评估功能
    {
      category: '心理评估',
      cases: [
        { id: 'TC-101', name: '学业压力评估完整流程', priority: 'P0' },
        { id: 'TC-102', name: '社交焦虑评估完整流程', priority: 'P0' },
        { id: 'TC-103', name: '睡眠质量评估完整流程', priority: 'P0' },
        { id: 'TC-104', name: '一般压力评估完整流程', priority: 'P0' },
        { id: 'TC-105', name: '评估中断恢复', priority: 'P1' },
        { id: 'TC-106', name: '评估结果查看', priority: 'P0' },
        { id: 'TC-107', name: '评估历史记录', priority: 'P1' }
      ]
    },
    // AI对话
    {
      category: 'AI对话',
      cases: [
        { id: 'TC-201', name: 'AI对话发送消息', priority: 'P0' },
        { id: 'TC-202', name: 'AI回复接收', priority: 'P0' },
        { id: 'TC-203', name: '对话历史记录', priority: 'P1' },
        { id: 'TC-204', name: '敏感词过滤', priority: 'P0' },
        { id: 'TC-205', name: '长文本输入', priority: 'P2' }
      ]
    },
    // 冥想音疗
    {
      category: '冥想音疗',
      cases: [
        { id: 'TC-301', name: '音频播放控制', priority: 'P0' },
        { id: 'TC-302', name: '播放列表切换', priority: 'P1' },
        { id: 'TC-303', name: '收藏功能', priority: 'P2' },
        { id: 'TC-304', name: '后台播放', priority: 'P1' }
      ]
    },
    // CDK兑换
    {
      category: 'CDK兑换',
      cases: [
        { id: 'TC-401', name: 'CDK兑换成功', priority: 'P0' },
        { id: 'TC-402', name: '无效CDK提示', priority: 'P0' },
        { id: 'TC-403', name: '已使用CDK提示', priority: 'P1' },
        { id: 'TC-404', name: '兑换历史查看', priority: 'P2' }
      ]
    },
    // 个人中心
    {
      category: '个人中心',
      cases: [
        { id: 'TC-501', name: '个人信息编辑', priority: 'P0' },
        { id: 'TC-502', name: '头像上传', priority: 'P1' },
        { id: 'TC-503', name: '设置页面功能', priority: 'P1' },
        { id: 'TC-504', name: '退出登录', priority: 'P0' }
      ]
    }
  ]
};

// 创建测试目录结构
function createTestDirs() {
  const dirs = [
    E2E_CONFIG.testDir,
    path.join(E2E_CONFIG.testDir, 'specs'),
    path.join(E2E_CONFIG.testDir, 'reports'),
    path.join(E2E_CONFIG.testDir, 'screenshots')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✓ 创建目录: ${dir}`);
    }
  });
}

// 生成测试用例文档
function generateTestCaseDoc() {
  let markdown = `# 端到端测试用例文档

**生成时间**: ${new Date().toLocaleString()}  
**总用例数**: ${E2E_CONFIG.testCases.reduce((sum, cat) => sum + cat.cases.length, 0)}

## 测试环境

- 平台: 微信小程序
- 测试工具: 微信开发者工具 + 小程序自动化
- Node版本: 16.x

---

## 测试用例清单

`;

  // 按优先级统计
  const stats = { P0: 0, P1: 0, P2: 0 };
  
  E2E_CONFIG.testCases.forEach(category => {
    markdown += `\n### ${category.category}\n\n`;
    markdown += '| 用例编号 | 用例名称 | 优先级 | 状态 |\n';
    markdown += '|---------|---------|--------|------|\n';
    
    category.cases.forEach(testCase => {
      markdown += `| ${testCase.id} | ${testCase.name} | ${testCase.priority} | ⬜ 待测试 |\n`;
      stats[testCase.priority]++;
    });
  });

  markdown += `\n## 优先级统计\n\n`;
  markdown += `- P0 (必须通过): ${stats.P0} 个\n`;
  markdown += `- P1 (应该通过): ${stats.P1} 个\n`;
  markdown += `- P2 (可选通过): ${stats.P2} 个\n`;

  markdown += `\n## 执行计划\n\n`;
  markdown += `1. **第一轮**: 执行所有P0用例，确保核心功能正常\n`;
  markdown += `2. **第二轮**: 执行P1用例，验证重要功能\n`;
  markdown += `3. **第三轮**: 执行P2用例，检查次要功能\n`;
  markdown += `4. **回归测试**: 修复bug后重新执行失败用例\n`;

  const docPath = path.join(E2E_CONFIG.testDir, 'TEST-CASES.md');
  fs.writeFileSync(docPath, markdown);
  console.log(`✓ 生成测试用例文档: ${docPath}`);
}

// 生成基础测试脚本
function generateBaseTestScript() {
  const scriptContent = `/**
 * E2E测试基础脚本
 * 使用微信小程序自动化测试
 */

const automator = require('miniprogram-automator');
const path = require('path');

// 测试配置
const config = {
  projectPath: path.join(__dirname, '../..'), // 小程序项目路径
  port: 9420, // 调试端口
};

// 启动小程序
async function launchMiniProgram() {
  const miniProgram = await automator.launch({
    projectPath: config.projectPath,
    port: config.port,
  });
  
  return miniProgram;
}

// 等待页面加载
async function waitForPage(page, selector, timeout = 5000) {
  await page.waitFor(selector, { timeout });
}

// 基础测试类
class BaseTest {
  constructor() {
    this.miniProgram = null;
    this.page = null;
  }
  
  async setup() {
    this.miniProgram = await launchMiniProgram();
    this.page = await this.miniProgram.currentPage();
  }
  
  async teardown() {
    if (this.miniProgram) {
      await this.miniProgram.close();
    }
  }
  
  async screenshot(name) {
    await this.page.screenshot({
      path: path.join(__dirname, 'screenshots', \`\${name}.png\`)
    });
  }
}

module.exports = {
  launchMiniProgram,
  waitForPage,
  BaseTest
};
`;

  const scriptPath = path.join(E2E_CONFIG.testDir, 'base-test.js');
  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`✓ 生成基础测试脚本: ${scriptPath}`);
}

// 生成示例测试用例
function generateSampleTest() {
  const sampleContent = `/**
 * 登录流程E2E测试
 * TC-001: 微信登录成功
 */

const { BaseTest } = require('../base-test');
const assert = require('assert');

describe('登录注册流程', () => {
  let test;
  
  beforeEach(async () => {
    test = new BaseTest();
    await test.setup();
  });
  
  afterEach(async () => {
    await test.teardown();
  });
  
  it('TC-001: 微信登录成功', async () => {
    // 1. 检查登录页面
    const loginBtn = await test.page.$('.login-btn');
    assert(loginBtn, '登录按钮应该存在');
    
    // 2. 点击登录
    await loginBtn.tap();
    
    // 3. 等待授权弹窗（模拟环境可能需要mock）
    await test.page.waitFor(1000);
    
    // 4. 检查跳转到首页
    await test.page.waitFor('.home-page', { timeout: 5000 });
    
    // 5. 验证登录状态
    const userInfo = await test.page.$('.user-info');
    assert(userInfo, '用户信息应该显示');
    
    // 截图
    await test.screenshot('login-success');
  });
  
  it('TC-003: 用户协议同意流程', async () => {
    // 1. 导航到同意页面
    await test.miniProgram.navigateTo('/pages/consent/consent');
    
    // 2. 等待页面加载
    await test.page.waitFor('.consent-page');
    
    // 3. 检查协议内容
    const agreementLink = await test.page.$('.agreement-link');
    assert(agreementLink, '用户协议链接应该存在');
    
    // 4. 勾选同意
    const checkbox = await test.page.$('.consent-checkbox');
    await checkbox.tap();
    
    // 5. 点击同意按钮
    const agreeBtn = await test.page.$('.agree-btn');
    await agreeBtn.tap();
    
    // 6. 验证跳转
    await test.page.waitFor('.home-page', { timeout: 5000 });
    
    await test.screenshot('consent-agreed');
  });
});
`;

  const testPath = path.join(E2E_CONFIG.testDir, 'specs', 'login.test.js');
  fs.writeFileSync(testPath, sampleContent);
  console.log(`✓ 生成示例测试用例: ${testPath}`);
}

// 生成测试报告模板
function generateReportTemplate() {
  const template = `# E2E测试报告

**测试日期**: ${new Date().toLocaleString()}  
**测试人员**: AI Assistant  
**测试环境**: 微信小程序开发版

## 测试概况

| 指标 | 数值 |
|------|------|
| 总用例数 | 0 |
| 执行用例数 | 0 |
| 通过用例数 | 0 |
| 失败用例数 | 0 |
| 跳过用例数 | 0 |
| 通过率 | 0% |

## 测试结果详情

### ✅ 通过的用例
（待填写）

### ❌ 失败的用例
（待填写）

### ⏭️ 跳过的用例
（待填写）

## Bug清单

| Bug ID | 优先级 | 描述 | 状态 |
|--------|--------|------|------|
| （待填写） | | | |

## 性能数据

| 页面 | 首屏加载时间 | 内存占用 |
|------|-------------|---------|
| 首页 | - | - |
| 评估页 | - | - |
| AI对话 | - | - |

## 总结与建议

（待填写）
`;

  const reportPath = path.join(E2E_CONFIG.testDir, 'reports', 'TEST-REPORT-TEMPLATE.md');
  fs.writeFileSync(reportPath, template);
  console.log(`✓ 生成测试报告模板: ${reportPath}`);
}

// 主函数
function main() {
  console.log('\n🧪 E2E测试环境配置开始...\n');
  
  try {
    // 1. 创建目录结构
    createTestDirs();
    
    // 2. 生成测试用例文档
    generateTestCaseDoc();
    
    // 3. 生成基础测试脚本
    generateBaseTestScript();
    
    // 4. 生成示例测试
    generateSampleTest();
    
    // 5. 生成报告模板
    generateReportTemplate();
    
    console.log('\n✅ E2E测试环境配置完成！');
    console.log('\n下一步:');
    console.log('1. 安装依赖: npm install miniprogram-automator --save-dev');
    console.log('2. 配置微信开发者工具的自动化端口');
    console.log('3. 运行测试: npm test\n');
    
  } catch (error) {
    console.error('\n❌ 配置失败:', error.message);
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { E2E_CONFIG };
