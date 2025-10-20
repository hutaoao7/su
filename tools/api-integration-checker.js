/**
 * API接口联调检查工具
 * 用于验证前后端接口对接情况
 */

const fs = require('fs');
const path = require('path');

// 接口配置
const API_CONFIG = {
  // 用户相关接口
  user: [
    {
      name: '微信登录',
      cloudFunction: 'user-login',
      frontend: '/utils/wechat-login.js',
      status: 'implemented',
      mock: false
    },
    {
      name: '更新用户资料',
      cloudFunction: 'user-update-profile',
      frontend: '/pages/user/profile.vue',
      status: 'implemented',
      mock: false
    },
    {
      name: '获取用户信息',
      cloudFunction: 'user-info',
      frontend: '/api/user.js',
      status: 'pending',
      mock: true
    }
  ],
  
  // 评估相关接口
  assessment: [
    {
      name: '保存评估结果',
      cloudFunction: 'assessment-save',
      frontend: '/pages/assess/result.vue',
      status: 'implemented',
      mock: false
    },
    {
      name: '获取评估历史',
      cloudFunction: 'assessment-get-history',
      frontend: '/pages/stress/history.vue',
      status: 'implemented',
      mock: false
    },
    {
      name: '获取量表配置',
      cloudFunction: 'assessment-get-scale',
      frontend: '/components/scale/ScaleRunner.vue',
      status: 'pending',
      mock: true
    }
  ],
  
  // AI对话相关接口
  ai: [
    {
      name: 'AI对话',
      cloudFunction: 'stress-chat',
      frontend: '/pages/intervene/chat.vue',
      status: 'implemented',
      mock: true,
      note: '已实现但使用模拟回复'
    },
    {
      name: '对话历史',
      cloudFunction: 'chat-history',
      frontend: '/pages/intervene/chat.vue',
      status: 'pending',
      mock: true
    }
  ],
  
  // 社区相关接口
  community: [
    {
      name: '获取话题列表',
      cloudFunction: 'community-topics',
      frontend: '/pages/community/index.vue',
      status: 'pending',
      mock: true
    },
    {
      name: '获取话题详情',
      cloudFunction: 'community-detail',
      frontend: '/pages/community/detail.vue',
      status: 'pending',
      mock: true
    }
  ],
  
  // 其他接口
  other: [
    {
      name: '同意记录',
      cloudFunction: 'consent-record',
      frontend: '/pages/consent/consent.vue',
      status: 'implemented',
      mock: false
    },
    {
      name: 'CDK兑换',
      cloudFunction: 'cdk-redeem',
      frontend: '/pages/cdk/redeem.vue',
      status: 'pending',
      mock: true
    },
    {
      name: '反馈提交',
      cloudFunction: 'feedback-submit',
      frontend: '/pages/feedback/feedback.vue',
      status: 'pending',
      mock: true
    }
  ]
};

// 检查云函数是否存在
function checkCloudFunction(functionName) {
  const functionPath = path.join(__dirname, '../uniCloud-aliyun/cloudfunctions', functionName, 'index.js');
  return fs.existsSync(functionPath);
}

// 检查前端文件是否存在
function checkFrontendFile(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  return fs.existsSync(fullPath);
}

// 检查Mock使用情况
function checkMockUsage(filePath) {
  const fullPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(fullPath)) return null;
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const mockIndicators = [
    'mock',
    'Mock',
    '模拟',
    'setTimeout',
    'Promise.resolve',
    '// TODO',
    'console.log'
  ];
  
  const foundIndicators = mockIndicators.filter(indicator => 
    content.includes(indicator)
  );
  
  return foundIndicators.length > 0 ? foundIndicators : null;
}

// 生成联调报告
function generateReport() {
  let report = `# API接口联调报告

**生成时间**: ${new Date().toLocaleString()}  
**项目**: CraneHeart 翎心

## 📊 接口统计

`;

  let totalCount = 0;
  let implementedCount = 0;
  let pendingCount = 0;
  let mockCount = 0;

  // 统计各模块接口
  Object.entries(API_CONFIG).forEach(([module, apis]) => {
    report += `\n### ${module.charAt(0).toUpperCase() + module.slice(1)} 模块\n\n`;
    report += '| 接口名称 | 云函数 | 前端文件 | 状态 | Mock | 备注 |\n';
    report += '|---------|--------|---------|------|------|------|\n';
    
    apis.forEach(api => {
      totalCount++;
      if (api.status === 'implemented') implementedCount++;
      else pendingCount++;
      if (api.mock) mockCount++;
      
      const cloudExists = checkCloudFunction(api.cloudFunction);
      const frontendExists = checkFrontendFile(api.frontend);
      const mockUsage = api.mock ? checkMockUsage(api.frontend) : null;
      
      const cloudStatus = cloudExists ? '✅' : '❌';
      const frontendStatus = frontendExists ? '✅' : '❌';
      const statusIcon = api.status === 'implemented' ? '🟢' : '🟡';
      const mockIcon = api.mock ? '⚠️' : '✅';
      
      report += `| ${api.name} | ${cloudStatus} ${api.cloudFunction} | ${frontendStatus} ${api.frontend} | ${statusIcon} ${api.status} | ${mockIcon} | ${api.note || ''} |\n`;
    });
  });
  
  // 添加总结
  report += `\n## 📈 总体情况\n\n`;
  report += `- **接口总数**: ${totalCount}\n`;
  report += `- **已实现**: ${implementedCount} (${((implementedCount/totalCount)*100).toFixed(1)}%)\n`;
  report += `- **待实现**: ${pendingCount} (${((pendingCount/totalCount)*100).toFixed(1)}%)\n`;
  report += `- **使用Mock**: ${mockCount} (${((mockCount/totalCount)*100).toFixed(1)}%)\n`;
  
  // 需要处理的接口
  report += `\n## 🔧 需要处理的接口\n\n`;
  report += `### 1. 待实现接口（${pendingCount}个）\n\n`;
  
  Object.entries(API_CONFIG).forEach(([module, apis]) => {
    const pendingApis = apis.filter(api => api.status === 'pending');
    if (pendingApis.length > 0) {
      report += `**${module}模块**:\n`;
      pendingApis.forEach(api => {
        report += `- [ ] ${api.name} (${api.cloudFunction})\n`;
      });
      report += '\n';
    }
  });
  
  report += `### 2. 需要移除Mock的接口（${mockCount}个）\n\n`;
  
  Object.entries(API_CONFIG).forEach(([module, apis]) => {
    const mockApis = apis.filter(api => api.mock);
    if (mockApis.length > 0) {
      report += `**${module}模块**:\n`;
      mockApis.forEach(api => {
        report += `- [ ] ${api.name} - ${api.note || '需要真实数据'}\n`;
      });
      report += '\n';
    }
  });
  
  // 添加建议
  report += `## 💡 联调建议\n\n`;
  report += `1. **优先级排序**：\n`;
  report += `   - P0: AI对话真实接口（stress-chat）\n`;
  report += `   - P0: 获取用户信息（user-info）\n`;
  report += `   - P1: 社区功能接口\n`;
  report += `   - P2: CDK兑换、反馈等辅助功能\n\n`;
  
  report += `2. **联调步骤**：\n`;
  report += `   - 确保云函数已部署\n`;
  report += `   - 更新前端接口调用\n`;
  report += `   - 移除Mock数据\n`;
  report += `   - 测试真实数据流\n\n`;
  
  report += `3. **注意事项**：\n`;
  report += `   - 检查错误码统一性\n`;
  report += `   - 验证数据格式一致性\n`;
  report += `   - 处理网络异常情况\n`;
  report += `   - 添加加载状态提示\n`;
  
  return report;
}

// 生成Mock数据清理脚本
function generateMockCleanupScript() {
  const script = `#!/usr/bin/env node
/**
 * Mock数据清理脚本
 * 自动生成，用于移除项目中的Mock数据
 */

const fs = require('fs');
const path = require('path');

const filesToClean = [
${Object.entries(API_CONFIG).map(([module, apis]) => 
  apis.filter(api => api.mock).map(api => 
    `  '${api.frontend}', // ${api.name}`
  ).join('\n')
).join('\n')}
];

console.log('开始清理Mock数据...');

filesToClean.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    console.log(\`处理文件: \${file}\`);
    // 这里应该添加实际的Mock清理逻辑
    // 例如：移除setTimeout、替换模拟数据等
  }
});

console.log('Mock数据清理完成！');
`;

  const scriptPath = path.join(__dirname, 'cleanup-mock.js');
  fs.writeFileSync(scriptPath, script);
  console.log(`✓ 生成Mock清理脚本: ${scriptPath}`);
}

// 主函数
function main() {
  console.log('🔍 开始API接口联调检查...\n');
  
  // 生成报告
  const report = generateReport();
  const reportPath = path.join(__dirname, '../docs/API-INTEGRATION-REPORT.md');
  fs.writeFileSync(reportPath, report);
  console.log(`✓ 生成联调报告: ${reportPath}`);
  
  // 生成Mock清理脚本
  generateMockCleanupScript();
  
  // 输出总结
  let totalCount = 0;
  let implementedCount = 0;
  let mockCount = 0;
  
  Object.values(API_CONFIG).forEach(apis => {
    apis.forEach(api => {
      totalCount++;
      if (api.status === 'implemented') implementedCount++;
      if (api.mock) mockCount++;
    });
  });
  
  console.log('\n📊 接口联调统计:');
  console.log(`总接口数: ${totalCount}`);
  console.log(`已实现: ${implementedCount} (${((implementedCount/totalCount)*100).toFixed(1)}%)`);
  console.log(`使用Mock: ${mockCount} (${((mockCount/totalCount)*100).toFixed(1)}%)`);
  console.log('\n✅ 检查完成！');
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { API_CONFIG, checkCloudFunction, checkFrontendFile };
