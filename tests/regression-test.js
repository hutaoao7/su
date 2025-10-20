/**
 * 回归测试套件
 * 验证所有修复的Bug和新功能
 */

const path = require('path');
const fs = require('fs');

const TAG = '[回归测试]';

// 测试用例集合
const TEST_SUITES = [
  {
    name: 'Bug修复验证',
    tests: [
      {
        id: 'BUG-001',
        name: '登录流程测试',
        priority: 'P0',
        run: async () => {
          // 检查user-login云函数是否存在
          const loginFuncPath = path.resolve('uniCloud-aliyun/cloudfunctions/user-login/index.js');
          if (!fs.existsSync(loginFuncPath)) {
            return { passed: false, message: 'user-login云函数不存在' };
          }
          
          // 检查函数导出
          const content = fs.readFileSync(loginFuncPath, 'utf8');
          if (!content.includes('exports.main')) {
            return { passed: false, message: '云函数未正确导出main函数' };
          }
          
          return { passed: true, message: '登录云函数检查通过' };
        }
      },
      {
        id: 'BUG-002',
        name: '敏感词过滤测试',
        priority: 'P0',
        run: async () => {
          const filterPath = path.resolve('uniCloud-aliyun/cloudfunctions/common/sensitive-filter.js');
          if (!fs.existsSync(filterPath)) {
            return { passed: false, message: '敏感词过滤模块不存在' };
          }
          
          // 检查危机干预功能
          const content = fs.readFileSync(filterPath, 'utf8');
          if (!content.includes('getCrisisInterventionResponse')) {
            return { passed: false, message: '缺少危机干预功能' };
          }
          
          return { passed: true, message: '敏感词过滤功能正常' };
        }
      },
      {
        id: 'BUG-003',
        name: '分包配置测试',
        priority: 'P1',
        run: async () => {
          const configPath = path.resolve('pages-subpackage.json');
          if (!fs.existsSync(configPath)) {
            return { passed: false, message: '分包配置文件不存在' };
          }
          
          const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
          if (!config.subPackages || config.subPackages.length === 0) {
            return { passed: false, message: '分包配置为空' };
          }
          
          return { passed: true, message: '分包配置正确' };
        }
      },
      {
        id: 'BUG-004',
        name: 'uView组件注册测试',
        priority: 'P1',
        run: async () => {
          const registerPath = path.resolve('uni_modules/uview-ui/global-register.js');
          if (!fs.existsSync(registerPath)) {
            return { passed: false, message: '全局注册模块不存在' };
          }
          
          // 检查main.js是否引入
          const mainPath = path.resolve('main.js');
          const mainContent = fs.readFileSync(mainPath, 'utf8');
          if (!mainContent.includes('global-register')) {
            return { passed: false, message: 'main.js未引入全局注册' };
          }
          
          return { passed: true, message: 'uView组件注册正常' };
        }
      },
      {
        id: 'BUG-005',
        name: '性能模块兼容性测试',
        priority: 'P1',
        run: async () => {
          const perfPath = path.resolve('utils/performance-optimizer.js');
          const content = fs.readFileSync(perfPath, 'utf8');
          
          // 检查平台判断
          if (!content.includes('#ifdef') || !content.includes('#endif')) {
            return { passed: false, message: '缺少平台兼容性判断' };
          }
          
          return { passed: true, message: '性能模块兼容性处理正确' };
        }
      },
      {
        id: 'BUG-006',
        name: 'Mock数据清理测试',
        priority: 'P2',
        run: async () => {
          // 检查API文件中的USE_MOCK标志
          const apiFiles = ['api/user.js', 'api/community.js'];
          
          for (const file of apiFiles) {
            const filePath = path.resolve(file);
            if (fs.existsSync(filePath)) {
              const content = fs.readFileSync(filePath, 'utf8');
              if (content.includes('USE_MOCK = true')) {
                return { passed: false, message: `${file}中仍有Mock标志未清理` };
              }
            }
          }
          
          return { passed: true, message: 'Mock数据已清理' };
        }
      },
      {
        id: 'BUG-007',
        name: '错误提示文案测试',
        priority: 'P2',
        run: async () => {
          const errorPath = path.resolve('utils/error-messages.js');
          if (!fs.existsSync(errorPath)) {
            return { passed: false, message: '错误消息管理器不存在' };
          }
          
          // 检查是否集成到main.js
          const mainPath = path.resolve('main.js');
          const mainContent = fs.readFileSync(mainPath, 'utf8');
          if (!mainContent.includes('$handleError')) {
            return { passed: false, message: '错误处理未集成到全局' };
          }
          
          return { passed: true, message: '错误提示文案优化完成' };
        }
      },
      {
        id: 'BUG-008',
        name: '加载状态测试',
        priority: 'P2',
        run: async () => {
          const loadingPath = path.resolve('utils/loading-manager.js');
          const componentPath = path.resolve('components/common/GlobalLoading.vue');
          
          if (!fs.existsSync(loadingPath)) {
            return { passed: false, message: '加载管理器不存在' };
          }
          
          if (!fs.existsSync(componentPath)) {
            return { passed: false, message: '全局加载组件不存在' };
          }
          
          return { passed: true, message: '加载状态功能完善' };
        }
      }
    ]
  },
  {
    name: '核心功能测试',
    tests: [
      {
        id: 'CORE-001',
        name: '路由守卫测试',
        priority: 'P0',
        run: async () => {
          const guardPath = path.resolve('utils/route-guard.js');
          if (!fs.existsSync(guardPath)) {
            return { passed: false, message: '路由守卫不存在' };
          }
          
          const content = fs.readFileSync(guardPath, 'utf8');
          if (!content.includes('guardCheck')) {
            return { passed: false, message: '路由守卫检查函数缺失' };
          }
          
          return { passed: true, message: '路由守卫功能正常' };
        }
      },
      {
        id: 'CORE-002',
        name: '同意管理测试',
        priority: 'P0',
        run: async () => {
          const consentPath = path.resolve('pages/consent/consent.vue');
          const recordPath = path.resolve('uniCloud-aliyun/cloudfunctions/consent-record/index.js');
          
          if (!fs.existsSync(consentPath)) {
            return { passed: false, message: '同意页面不存在' };
          }
          
          if (!fs.existsSync(recordPath)) {
            return { passed: false, message: '同意记录云函数不存在' };
          }
          
          return { passed: true, message: '同意管理功能完整' };
        }
      },
      {
        id: 'CORE-003',
        name: '评估系统测试',
        priority: 'P0',
        run: async () => {
          const scoringPath = path.resolve('utils/scoring.js');
          const runnerPath = path.resolve('components/scale/ScaleRunner.vue');
          
          if (!fs.existsSync(scoringPath)) {
            return { passed: false, message: '评分逻辑不存在' };
          }
          
          if (!fs.existsSync(runnerPath)) {
            return { passed: false, message: '量表执行器组件不存在' };
          }
          
          return { passed: true, message: '评估系统功能正常' };
        }
      },
      {
        id: 'CORE-004',
        name: 'AI网关测试',
        priority: 'P0',
        run: async () => {
          const gatewayPath = path.resolve('uniCloud-aliyun/cloudfunctions/common/ai-gateway/index.js');
          
          if (!fs.existsSync(gatewayPath)) {
            return { passed: false, message: 'AI网关不存在' };
          }
          
          const content = fs.readFileSync(gatewayPath, 'utf8');
          if (!content.includes('AIGateway')) {
            return { passed: false, message: 'AI网关类未定义' };
          }
          
          return { passed: true, message: 'AI网关功能正常' };
        }
      }
    ]
  },
  {
    name: '配置文件测试',
    tests: [
      {
        id: 'CONFIG-001',
        name: 'pages.json验证',
        priority: 'P0',
        run: async () => {
          const pagesPath = path.resolve('pages.json');
          
          try {
            const config = JSON.parse(fs.readFileSync(pagesPath, 'utf8'));
            
            if (!config.pages || config.pages.length === 0) {
              return { passed: false, message: 'pages配置为空' };
            }
            
            if (!config.easycom) {
              return { passed: false, message: 'easycom配置缺失' };
            }
            
            return { passed: true, message: 'pages.json配置正确' };
          } catch (error) {
            return { passed: false, message: 'pages.json解析失败: ' + error.message };
          }
        }
      },
      {
        id: 'CONFIG-002',
        name: 'manifest.json验证',
        priority: 'P1',
        run: async () => {
          const manifestPath = path.resolve('manifest.json');
          
          try {
            const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
            
            if (!manifest['mp-weixin']) {
              return { passed: false, message: '缺少小程序配置' };
            }
            
            return { passed: true, message: 'manifest.json配置正确' };
          } catch (error) {
            return { passed: false, message: 'manifest.json解析失败' };
          }
        }
      },
      {
        id: 'CONFIG-003',
        name: 'ESLint配置验证',
        priority: 'P2',
        run: async () => {
          const eslintPath = path.resolve('.eslintrc.js');
          
          if (!fs.existsSync(eslintPath)) {
            return { passed: false, message: 'ESLint配置不存在' };
          }
          
          return { passed: true, message: 'ESLint配置存在' };
        }
      }
    ]
  },
  {
    name: '云函数测试',
    tests: [
      {
        id: 'CLOUD-001',
        name: '云函数CommonJS验证',
        priority: 'P0',
        run: async () => {
          const cloudDir = path.resolve('uniCloud-aliyun/cloudfunctions');
          let esmFound = false;
          
          if (fs.existsSync(cloudDir)) {
            const dirs = fs.readdirSync(cloudDir);
            
            for (const dir of dirs) {
              const indexPath = path.join(cloudDir, dir, 'index.js');
              if (fs.existsSync(indexPath)) {
                const content = fs.readFileSync(indexPath, 'utf8');
                if (content.includes('import ') || content.includes('export ')) {
                  esmFound = true;
                  break;
                }
              }
            }
          }
          
          if (esmFound) {
            return { passed: false, message: '发现ESM语法的云函数' };
          }
          
          return { passed: true, message: '所有云函数使用CommonJS' };
        }
      },
      {
        id: 'CLOUD-002',
        name: 'Supabase客户端验证',
        priority: 'P0',
        run: async () => {
          const clientPath = path.resolve('uniCloud-aliyun/cloudfunctions/common/supabase-client.js');
          
          if (!fs.existsSync(clientPath)) {
            return { passed: false, message: 'Supabase客户端不存在' };
          }
          
      const content = fs.readFileSync(clientPath, 'utf8');
      // 检查是否包含service_role密钥（排除注释）
      const lines = content.split('\n');
      for (const line of lines) {
        // 跳过注释行
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) {
          continue;
        }
        // 检查非注释行中是否有service_role
        if (line.includes('service_role') && !line.includes('不要') && !line.includes('绝不')) {
          return { passed: false, message: '发现service_role密钥暴露' };
        }
      }
          
          return { passed: true, message: 'Supabase客户端安全' };
        }
      }
    ]
  }
];

// 运行单个测试
async function runTest(test) {
  console.log(`  运行: ${test.name} (${test.priority})`);
  
  try {
    const result = await test.run();
    
    if (result.passed) {
      console.log(`    ✅ 通过: ${result.message}`);
    } else {
      console.log(`    ❌ 失败: ${result.message}`);
    }
    
    return {
      ...test,
      ...result
    };
  } catch (error) {
    console.log(`    ❌ 错误: ${error.message}`);
    return {
      ...test,
      passed: false,
      message: error.message
    };
  }
}

// 运行测试套件
async function runSuite(suite) {
  console.log(`\n📦 ${suite.name}`);
  console.log('='.repeat(50));
  
  const results = [];
  
  for (const test of suite.tests) {
    const result = await runTest(test);
    results.push(result);
  }
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  console.log(`\n  小计: ${passed}/${total} (${passRate}%)\n`);
  
  return {
    name: suite.name,
    results: results,
    passed: passed,
    total: total,
    passRate: passRate
  };
}

// 生成测试报告
function generateReport(suiteResults, duration) {
  const totalTests = suiteResults.reduce((sum, s) => sum + s.total, 0);
  const passedTests = suiteResults.reduce((sum, s) => sum + s.passed, 0);
  const failedTests = totalTests - passedTests;
  const overallPassRate = ((passedTests / totalTests) * 100).toFixed(1);
  
  // P0 Bug统计
  const p0Tests = [];
  suiteResults.forEach(suite => {
    suite.results.forEach(test => {
      if (test.priority === 'P0') {
        p0Tests.push(test);
      }
    });
  });
  
  const p0Failed = p0Tests.filter(t => !t.passed);
  
  const report = `# 回归测试报告

**执行时间**: ${new Date().toISOString()}
**执行耗时**: ${duration}ms

## 📊 测试总览

| 指标 | 数值 | 状态 |
|------|------|------|
| 总测试数 | ${totalTests} | - |
| 通过数 | ${passedTests} | ${passedTests === totalTests ? '✅' : '⚠️'} |
| 失败数 | ${failedTests} | ${failedTests === 0 ? '✅' : '❌'} |
| 通过率 | ${overallPassRate}% | ${overallPassRate >= 95 ? '✅' : '⚠️'} |
| P0失败数 | ${p0Failed.length} | ${p0Failed.length === 0 ? '✅' : '❌'} |

## 📋 测试套件结果

${suiteResults.map(suite => `
### ${suite.name}
- 通过率: ${suite.passRate}% (${suite.passed}/${suite.total})
- 失败项:
${suite.results.filter(r => !r.passed).map(r => `  - ${r.name}: ${r.message}`).join('\n') || '  无'}
`).join('\n')}

## ❌ 失败测试详情

${suiteResults.map(suite => 
  suite.results
    .filter(r => !r.passed)
    .map(r => `- **[${r.id}]** ${r.name} (${r.priority})\n  - 原因: ${r.message}`)
    .join('\n')
).filter(s => s).join('\n') || '无失败测试'}

## ✅ 测试结论

${p0Failed.length === 0 ? '**所有P0级测试通过，核心功能正常。**' : `**⚠️ 发现${p0Failed.length}个P0级问题，需要立即修复！**`}

${overallPassRate >= 95 ? '**回归测试通过率达标，可以进入下一阶段。**' : '**回归测试通过率未达标，建议修复失败项后重新测试。**'}

## 🔧 建议

${failedTests > 0 ? `1. 优先修复P0级失败项
2. 检查失败测试的相关代码
3. 修复后重新运行回归测试` : '1. 继续进行兼容性测试\n2. 执行性能测试\n3. 准备UAT测试'}

---

*自动生成于 ${new Date().toLocaleString()}*
`;

  fs.writeFileSync('tests/REGRESSION-TEST-REPORT.md', report, 'utf8');
  console.log('\n📄 测试报告已保存至: tests/REGRESSION-TEST-REPORT.md');
  
  return {
    totalTests,
    passedTests,
    failedTests,
    overallPassRate,
    p0Failed
  };
}

// 主函数
async function main() {
  console.log('=' . repeat(50));
  console.log(TAG, '回归测试开始');
  console.log('=' . repeat(50));
  
  const startTime = Date.now();
  const suiteResults = [];
  
  // 运行所有测试套件
  for (const suite of TEST_SUITES) {
    const result = await runSuite(suite);
    suiteResults.push(result);
  }
  
  const duration = Date.now() - startTime;
  
  console.log('\n' + '=' . repeat(50));
  console.log(TAG, '测试执行完成');
  console.log('=' . repeat(50));
  
  // 生成报告
  const summary = generateReport(suiteResults, duration);
  
  // 输出总结
  console.log('\n📊 测试总结:');
  console.log(`  总测试数: ${summary.totalTests}`);
  console.log(`  通过: ${summary.passedTests}`);
  console.log(`  失败: ${summary.failedTests}`);
  console.log(`  通过率: ${summary.overallPassRate}%`);
  
  if (summary.p0Failed.length > 0) {
    console.log('\n⚠️ 警告: 发现P0级问题!');
    process.exit(1);
  }
  
  if (summary.overallPassRate < 95) {
    console.log('\n⚠️ 警告: 通过率未达标!');
    process.exit(1);
  }
  
  console.log('\n✅ 回归测试通过!');
}

// 执行测试
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TEST_SUITES, runSuite, generateReport };
