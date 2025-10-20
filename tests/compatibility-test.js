/**
 * 兼容性测试套件
 * 检查多平台兼容性问题
 */

const fs = require('fs');
const path = require('path');

const TAG = '[兼容性测试]';

// 兼容性检查项
const COMPATIBILITY_CHECKS = {
  // 小程序特殊语法检查
  miniprogram: [
    {
      name: '模板语法兼容性',
      pattern: /:\w+=['"`][^'"`]*\+[^'"`]*['"`]/g,
      description: '检查动态属性中的字符串拼接',
      files: ['pages/**/*.vue', 'components/**/*.vue']
    },
    {
      name: 'v-html指令',
      pattern: /v-html=/g,
      description: '小程序不支持v-html',
      files: ['pages/**/*.vue', 'components/**/*.vue']
    },
    {
      name: '动态组件',
      pattern: /<component\s+:is=/g,
      description: '小程序不支持动态组件',
      files: ['pages/**/*.vue', 'components/**/*.vue']
    }
  ],
  
  // H5平台兼容性
  h5: [
    {
      name: 'canvas API',
      pattern: /uni\.createCanvasContext/g,
      description: 'H5中canvas API差异',
      files: ['pages/**/*.vue', 'utils/**/*.js']
    },
    {
      name: '原生API调用',
      pattern: /wx\./g,
      description: '应使用uni.而不是wx.',
      files: ['**/*.js', '**/*.vue']
    }
  ],
  
  // CSS兼容性
  styles: [
    {
      name: 'rpx单位',
      pattern: /\d+rpx/g,
      description: '检查rpx单位使用',
      files: ['**/*.vue', '**/*.scss', '**/*.css']
    },
    {
      name: 'CSS变量',
      pattern: /var\(--/g,
      description: 'CSS变量兼容性',
      files: ['**/*.vue', '**/*.scss', '**/*.css']
    },
    {
      name: 'position:fixed',
      pattern: /position\s*:\s*fixed/g,
      description: '小程序中fixed定位问题',
      files: ['**/*.vue', '**/*.scss', '**/*.css']
    }
  ],
  
  // JavaScript兼容性
  javascript: [
    {
      name: 'ES6+语法',
      pattern: /(?:async|await|=>|\.\.\.|`)/g,
      description: '检查ES6+语法使用',
      files: ['**/*.js', '**/*.vue']
    },
    {
      name: 'Promise',
      pattern: /new\s+Promise|Promise\./g,
      description: 'Promise兼容性',
      files: ['**/*.js']
    },
    {
      name: 'localStorage',
      pattern: /localStorage\./g,
      description: '应使用uni.setStorageSync',
      files: ['**/*.js', '**/*.vue']
    }
  ],
  
  // 组件兼容性
  components: [
    {
      name: 'scroll-view',
      pattern: /<scroll-view/g,
      description: 'scroll-view组件使用',
      files: ['pages/**/*.vue']
    },
    {
      name: 'swiper',
      pattern: /<swiper/g,
      description: 'swiper组件差异',
      files: ['pages/**/*.vue']
    },
    {
      name: '自定义组件',
      pattern: /<u-[a-z-]+/g,
      description: 'uView组件使用',
      files: ['pages/**/*.vue']
    }
  ]
};

// 平台特定配置
const PLATFORM_CONFIGS = {
  'mp-weixin': {
    name: '微信小程序',
    checks: ['miniprogram', 'styles', 'javascript', 'components'],
    specific: {
      maxPackageSize: 2 * 1024 * 1024, // 2MB
      supportedAPIs: ['uni.', 'wx.'],
      unsupportedFeatures: ['v-html', 'dynamic-component']
    }
  },
  'h5': {
    name: 'H5',
    checks: ['h5', 'styles', 'javascript'],
    specific: {
      supportedAPIs: ['uni.'],
      requirePolyfill: ['Promise', 'Object.assign']
    }
  },
  'app-plus': {
    name: 'App',
    checks: ['styles', 'javascript', 'components'],
    specific: {
      supportedAPIs: ['uni.', 'plus.'],
      nativePlugins: true
    }
  }
};

// 递归查找文件
function findFiles(pattern) {
  const results = [];
  const baseDir = process.cwd();
  
  function searchDir(dir) {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          if (!['node_modules', 'unpackage', '.git', 'uni_modules'].includes(file)) {
            searchDir(fullPath);
          }
        } else {
          // 简单的模式匹配
          const ext = path.extname(file);
          if (pattern.includes('*')) {
            if (pattern.includes(ext)) {
              results.push(fullPath);
            }
          } else if (pattern.includes(file)) {
            results.push(fullPath);
          }
        }
      });
    }
  }
  
  // 从不同的起始目录搜索
  ['pages', 'components', 'utils', 'api'].forEach(dir => {
    searchDir(path.join(baseDir, dir));
  });
  
  return results;
}

// 执行兼容性检查
function runCompatibilityCheck(platform) {
  console.log(`\n🔍 检查 ${PLATFORM_CONFIGS[platform].name} 平台兼容性`);
  console.log('='.repeat(50));
  
  const config = PLATFORM_CONFIGS[platform];
  const issues = [];
  
  config.checks.forEach(checkType => {
    const checks = COMPATIBILITY_CHECKS[checkType];
    
    if (checks) {
      console.log(`\n📋 ${checkType} 检查:`);
      
      checks.forEach(check => {
        let totalMatches = 0;
        const fileMatches = [];
        
        check.files.forEach(filePattern => {
          const files = findFiles(filePattern);
          
          files.forEach(file => {
            const content = fs.readFileSync(file, 'utf8');
            const matches = content.match(check.pattern);
            
            if (matches) {
              totalMatches += matches.length;
              fileMatches.push({
                file: path.relative(process.cwd(), file),
                count: matches.length
              });
            }
          });
        });
        
        if (totalMatches > 0) {
          console.log(`  ⚠️ ${check.name}: 发现 ${totalMatches} 处`);
          console.log(`     ${check.description}`);
          
          issues.push({
            type: checkType,
            name: check.name,
            description: check.description,
            count: totalMatches,
            files: fileMatches
          });
        } else {
          console.log(`  ✅ ${check.name}: 通过`);
        }
      });
    }
  });
  
  return {
    platform: platform,
    platformName: config.name,
    issues: issues,
    passed: issues.length === 0
  };
}

// 检查API兼容性
function checkAPICompatibility() {
  console.log('\n📱 API兼容性检查');
  console.log('='.repeat(50));
  
  const apiUsage = {
    'uni.': 0,
    'wx.': 0,
    'plus.': 0,
    'my.': 0,
    'swan.': 0
  };
  
  const files = findFiles('**/*.js').concat(findFiles('**/*.vue'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    Object.keys(apiUsage).forEach(api => {
      const regex = new RegExp(api.replace('.', '\\.'), 'g');
      const matches = content.match(regex);
      if (matches) {
        apiUsage[api] += matches.length;
      }
    });
  });
  
  console.log('\nAPI使用统计:');
  Object.entries(apiUsage).forEach(([api, count]) => {
    if (count > 0) {
      console.log(`  ${api}: ${count} 次`);
    }
  });
  
  // 检查问题
  const issues = [];
  if (apiUsage['wx.'] > 0) {
    issues.push('发现直接使用wx.API，应改为uni.');
  }
  if (apiUsage['my.'] > 0 || apiUsage['swan.'] > 0) {
    issues.push('发现平台特定API，需要条件编译');
  }
  
  return {
    apiUsage,
    issues,
    passed: issues.length === 0
  };
}

// 检查条件编译
function checkConditionalCompile() {
  console.log('\n🔧 条件编译检查');
  console.log('='.repeat(50));
  
  const conditionalPatterns = [
    { pattern: /#ifdef/g, name: 'ifdef' },
    { pattern: /#ifndef/g, name: 'ifndef' },
    { pattern: /#endif/g, name: 'endif' }
  ];
  
  const stats = {
    total: 0,
    byPlatform: {}
  };
  
  const files = findFiles('**/*.js').concat(findFiles('**/*.vue'));
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    
    // 查找所有条件编译
    const ifdefMatches = content.match(/#ifdef\s+(\S+)/g) || [];
    ifdefMatches.forEach(match => {
      const platform = match.replace(/#ifdef\s+/, '');
      stats.byPlatform[platform] = (stats.byPlatform[platform] || 0) + 1;
      stats.total++;
    });
  });
  
  console.log('\n条件编译使用:');
  console.log(`  总计: ${stats.total} 处`);
  console.log('\n按平台分布:');
  Object.entries(stats.byPlatform).forEach(([platform, count]) => {
    console.log(`  ${platform}: ${count} 处`);
  });
  
  return stats;
}

// 生成兼容性报告
function generateCompatibilityReport(results) {
  const report = `# 兼容性测试报告

**执行时间**: ${new Date().toISOString()}

## 📊 测试总览

| 平台 | 兼容性 | 问题数 | 状态 |
|------|--------|--------|------|
${results.platformTests.map(r => 
  `| ${r.platformName} | ${r.passed ? '✅ 通过' : '⚠️ 有问题'} | ${r.issues.length} | ${r.passed ? '正常' : '需优化'} |`
).join('\n')}

## 🔍 详细问题

${results.platformTests.filter(r => r.issues.length > 0).map(r => `
### ${r.platformName}

${r.issues.map(issue => `
#### ${issue.name}
- **类型**: ${issue.type}
- **描述**: ${issue.description}
- **出现次数**: ${issue.count}
- **涉及文件**: ${issue.files.slice(0, 3).map(f => f.file).join(', ')}${issue.files.length > 3 ? '...' : ''}
`).join('\n')}
`).join('\n')}

## 📱 API兼容性

${results.apiCheck.passed ? '✅ **API使用规范**' : '⚠️ **发现API兼容性问题**'}

### API使用统计
${Object.entries(results.apiCheck.apiUsage)
  .filter(([_, count]) => count > 0)
  .map(([api, count]) => `- ${api}: ${count} 次`)
  .join('\n')}

${results.apiCheck.issues.length > 0 ? `
### 问题
${results.apiCheck.issues.map(issue => `- ${issue}`).join('\n')}
` : ''}

## 🔧 条件编译

- **总使用**: ${results.conditionalCompile.total} 处
- **平台分布**:
${Object.entries(results.conditionalCompile.byPlatform)
  .map(([platform, count]) => `  - ${platform}: ${count} 处`)
  .join('\n')}

## 📈 兼容性评分

| 指标 | 分数 | 说明 |
|------|------|------|
| 代码规范性 | ${results.apiCheck.passed ? 95 : 75}/100 | ${results.apiCheck.passed ? 'API使用规范' : '存在平台特定API'} |
| 跨平台兼容 | ${results.platformTests.every(t => t.passed) ? 90 : 70}/100 | ${results.platformTests.filter(t => !t.passed).length}个平台有兼容性问题 |
| 条件编译 | ${results.conditionalCompile.total > 0 ? 85 : 60}/100 | ${results.conditionalCompile.total > 0 ? '已使用条件编译' : '未使用条件编译'} |

## 🔧 优化建议

${results.suggestions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

*自动生成于 ${new Date().toLocaleString()}*
`;

  fs.writeFileSync('tests/COMPATIBILITY-TEST-REPORT.md', report, 'utf8');
  console.log('\n📄 兼容性报告已保存至: tests/COMPATIBILITY-TEST-REPORT.md');
}

// 主函数
function main() {
  console.log('=' . repeat(50));
  console.log(TAG, '兼容性测试开始');
  console.log('=' . repeat(50));
  
  const results = {
    platformTests: [],
    apiCheck: null,
    conditionalCompile: null,
    suggestions: []
  };
  
  // 测试各平台兼容性
  ['mp-weixin', 'h5'].forEach(platform => {
    const result = runCompatibilityCheck(platform);
    results.platformTests.push(result);
  });
  
  // API兼容性检查
  results.apiCheck = checkAPICompatibility();
  
  // 条件编译检查
  results.conditionalCompile = checkConditionalCompile();
  
  // 生成建议
  if (!results.apiCheck.passed) {
    results.suggestions.push('将所有wx.API调用改为uni.API');
    results.suggestions.push('使用条件编译处理平台特定功能');
  }
  
  results.platformTests.forEach(test => {
    if (!test.passed) {
      test.issues.forEach(issue => {
        if (issue.name === '模板语法兼容性') {
          results.suggestions.push('避免在模板属性中使用复杂表达式，改用计算属性或方法');
        }
        if (issue.name === 'v-html指令') {
          results.suggestions.push('小程序中使用rich-text组件替代v-html');
        }
      });
    }
  });
  
  if (results.conditionalCompile.total === 0) {
    results.suggestions.push('建议添加条件编译以优化各平台体验');
  }
  
  // 生成报告
  generateCompatibilityReport(results);
  
  console.log('\n' + '=' . repeat(50));
  console.log(TAG, '兼容性测试完成');
  console.log('=' . repeat(50));
  
  // 统计
  const totalIssues = results.platformTests.reduce((sum, t) => sum + t.issues.length, 0);
  const allPassed = results.platformTests.every(t => t.passed) && results.apiCheck.passed;
  
  console.log('\n📊 测试总结:');
  console.log(`  平台数: ${results.platformTests.length}`);
  console.log(`  总问题: ${totalIssues}`);
  console.log(`  API兼容: ${results.apiCheck.passed ? '✅ 通过' : '⚠️ 有问题'}`);
  console.log(`  总体评价: ${allPassed ? '✅ 兼容性良好' : '⚠️ 需要优化'}`);
}

// 执行测试
if (require.main === module) {
  main();
}

module.exports = { runCompatibilityCheck, checkAPICompatibility };
