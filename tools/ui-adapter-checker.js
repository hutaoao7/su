#!/usr/bin/env node

/**
 * UI适配检测工具
 * 
 * 功能：
 * 1. 扫描所有.vue文件
 * 2. 检测safe-area-inset使用情况
 * 3. 检测rpx单位使用
 * 4. 检测fixed定位
 * 5. 检测TabBar遮挡
 * 6. 检测导航栏遮挡
 * 7. 检测屏幕尺寸适配
 * 8. 检测触摸区域大小（≥44px）
 * 9. 生成HTML报告
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  // 需要扫描的目录
  scanDirs: [
    'pages',
    'pages-sub',
    'components'
  ],
  // 排除的目录
  excludeDirs: [
    'node_modules',
    'uni_modules',
    'unpackage',
    '.git'
  ],
  // 检测规则
  rules: {
    safeAreaInset: {
      name: 'Safe Area适配',
      level: 'warning',
      check: (content, filePath) => {
        const hasPaddingBottom = /padding-bottom|margin-bottom/.test(content);
        const hasSafeAreaInset = /safe-area-inset-(top|bottom|left|right)/.test(content);
        const hasFixed = /position\s*:\s*fixed/.test(content);
        const hasTabBar = filePath.includes('TabBar') || filePath.includes('tabbar');
        
        if ((hasPaddingBottom || hasFixed || hasTabBar) && !hasSafeAreaInset) {
          return {
            passed: false,
            message: '检测到固定定位或底部padding，但缺少safe-area-inset适配'
          };
        }
        return { passed: true };
      }
    },
    rpxUnit: {
      name: 'rpx单位使用',
      level: 'info',
      check: (content) => {
        const pxCount = (content.match(/:\s*\d+px\s*[;}]/g) || []).length;
        const rpxCount = (content.match(/:\s*\d+rpx\s*[;}]/g) || []).length;
        
        if (pxCount > rpxCount * 0.2 && rpxCount > 0) {
          return {
            passed: false,
            message: `px使用过多（px:${pxCount}, rpx:${rpxCount}），建议使用rpx单位`
          };
        }
        return { passed: true };
      }
    },
    fixedPosition: {
      name: 'fixed定位检测',
      level: 'warning',
      check: (content) => {
        const fixedMatch = content.match(/position\s*:\s*fixed/g);
        if (!fixedMatch) return { passed: true };
        
        // 检查是否有bottom或top属性
        const hasBottomTop = /bottom\s*:|top\s*:/.test(content);
        const hasSafeArea = /safe-area-inset/.test(content);
        
        if (hasBottomTop && !hasSafeArea) {
          return {
            passed: false,
            message: '使用fixed定位且有top/bottom属性，但缺少safe-area-inset适配'
          };
        }
        return { passed: true };
      }
    },
    touchArea: {
      name: '触摸区域大小',
      level: 'warning',
      check: (content) => {
        // 检测button、checkbox等交互元素
        const buttonMatch = content.match(/<button|\.btn|\.checkbox|\.radio/g);
        if (!buttonMatch) return { passed: true };
        
        // 简单检测：查找width/height小于44px或88rpx的情况
        const smallSizeMatch = content.match(/(?:width|height)\s*:\s*(?:[1-3]\d|[0-9])(?:px|rpx)/g);
        
        if (smallSizeMatch && buttonMatch) {
          return {
            passed: false,
            message: '检测到可能过小的触摸区域，建议至少44px（88rpx）',
            details: smallSizeMatch.slice(0, 3).join(', ')
          };
        }
        return { passed: true };
      }
    },
    responsiveLayout: {
      name: '响应式布局',
      level: 'info',
      check: (content) => {
        const hasMediaQuery = /@media/.test(content);
        const hasComplexLayout = /flex|grid/.test(content);
        
        if (hasComplexLayout && !hasMediaQuery && content.length > 1000) {
          return {
            passed: false,
            message: '复杂布局但缺少媒体查询，建议添加响应式适配'
          };
        }
        return { passed: true };
      }
    },
    tabBarBlocking: {
      name: 'TabBar遮挡检测',
      level: 'error',
      check: (content, filePath) => {
        const hasTabBar = /custom-tabbar|<custom-tabbar/.test(content);
        const hasBottomContent = /position\s*:\s*fixed.*bottom|padding-bottom/.test(content);
        const hasTabBarPadding = /calc\(.*env\(safe-area-inset-bottom\)|TabBar.*height/i.test(content);
        
        if (hasTabBar && hasBottomContent && !hasTabBarPadding) {
          return {
            passed: false,
            message: '页面包含TabBar，底部内容可能被遮挡，建议添加bottom padding'
          };
        }
        return { passed: true };
      }
    },
    navBarBlocking: {
      name: '导航栏遮挡检测',
      level: 'warning',
      check: (content) => {
        const hasCustomNav = /navigationStyle.*custom|<NavBar|<nav-bar/.test(content);
        const hasTopContent = /position\s*:\s*fixed.*top|margin-top/.test(content);
        const hasStatusBarHeight = /status-bar-height|getSystemInfo/.test(content);
        
        if (hasCustomNav && hasTopContent && !hasStatusBarHeight) {
          return {
            passed: false,
            message: '使用自定义导航栏，顶部内容可能被遮挡，建议添加statusBarHeight'
          };
        }
        return { passed: true };
      }
    }
  }
};

// 扫描结果
const results = {
  totalFiles: 0,
  scannedFiles: 0,
  issues: [],
  summary: {
    error: 0,
    warning: 0,
    info: 0
  }
};

/**
 * 递归扫描目录
 */
function scanDirectory(dir, baseDir = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.join(baseDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过排除的目录
      if (config.excludeDirs.includes(file)) {
        return;
      }
      scanDirectory(filePath, relativePath);
    } else if (stat.isFile() && file.endsWith('.vue')) {
      results.totalFiles++;
      checkFile(filePath, relativePath);
    }
  });
}

/**
 * 检查单个文件
 */
function checkFile(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    results.scannedFiles++;
    
    // 对每个规则进行检查
    Object.entries(config.rules).forEach(([ruleId, rule]) => {
      const result = rule.check(content, relativePath);
      
      if (!result.passed) {
        const issue = {
          file: relativePath,
          rule: rule.name,
          level: rule.level,
          message: result.message,
          details: result.details || ''
        };
        
        results.issues.push(issue);
        results.summary[rule.level]++;
      }
    });
  } catch (error) {
    console.error(`检查文件失败: ${relativePath}`, error.message);
  }
}

/**
 * 生成控制台报告
 */
function generateConsoleReport() {
  console.log('\n' + '='.repeat(80));
  console.log('UI适配检测报告');
  console.log('='.repeat(80));
  console.log(`扫描文件数: ${results.scannedFiles}/${results.totalFiles}`);
  console.log(`发现问题数: ${results.issues.length}`);
  console.log(`  - 错误 (error): ${results.summary.error}`);
  console.log(`  - 警告 (warning): ${results.summary.warning}`);
  console.log(`  - 提示 (info): ${results.summary.info}`);
  console.log('='.repeat(80) + '\n');
  
  if (results.issues.length === 0) {
    console.log('✅ 恭喜！未发现UI适配问题。\n');
    return;
  }
  
  // 按级别分组显示
  ['error', 'warning', 'info'].forEach(level => {
    const levelIssues = results.issues.filter(issue => issue.level === level);
    if (levelIssues.length === 0) return;
    
    const levelSymbol = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${levelSymbol} ${level.toUpperCase()} (${levelIssues.length})`);
    console.log('-'.repeat(80));
    
    levelIssues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.file}`);
      console.log(`   规则: ${issue.rule}`);
      console.log(`   问题: ${issue.message}`);
      if (issue.details) {
        console.log(`   详情: ${issue.details}`);
      }
      console.log('');
    });
  });
}

/**
 * 生成HTML报告
 */
function generateHTMLReport() {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>UI适配检测报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .stat-label { color: #666; font-size: 14px; }
    .issues { background: white; border-radius: 8px; padding: 20px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .issue {
      border-left: 4px solid #ccc;
      padding: 15px;
      margin-bottom: 15px;
      background: #f9fafb;
      border-radius: 4px;
    }
    .issue.error { border-color: #f56c6c; }
    .issue.warning { border-color: #e6a23c; }
    .issue.info { border-color: #409eff; }
    .issue-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .issue-file { font-weight: bold; color: #333; }
    .issue-level {
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: bold;
    }
    .level-error { background: #fef0f0; color: #f56c6c; }
    .level-warning { background: #fdf6ec; color: #e6a23c; }
    .level-info { background: #ecf5ff; color: #409eff; }
    .issue-rule { color: #666; font-size: 14px; margin-bottom: 5px; }
    .issue-message { color: #333; }
    .issue-details { color: #999; font-size: 12px; margin-top: 5px; font-family: monospace; }
    .success {
      background: #f0f9ff;
      border: 2px solid #67c23a;
      color: #67c23a;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      font-size: 18px;
      font-weight: bold;
    }
    .timestamp { color: rgba(255,255,255,0.8); font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 UI适配检测报告</h1>
      <div class="timestamp">生成时间: ${new Date().toLocaleString('zh-CN')}</div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${results.scannedFiles}</div>
        <div class="stat-label">扫描文件数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #f56c6c;">${results.summary.error}</div>
        <div class="stat-label">错误</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #e6a23c;">${results.summary.warning}</div>
        <div class="stat-label">警告</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #409eff;">${results.summary.info}</div>
        <div class="stat-label">提示</div>
      </div>
    </div>
    
    ${results.issues.length === 0 ? `
      <div class="success">
        ✅ 恭喜！未发现UI适配问题。
      </div>
    ` : `
      <div class="issues">
        <h2 style="margin-bottom: 20px;">问题列表 (${results.issues.length})</h2>
        ${results.issues.map(issue => `
          <div class="issue ${issue.level}">
            <div class="issue-header">
              <div class="issue-file">${issue.file}</div>
              <div class="issue-level level-${issue.level}">${issue.level.toUpperCase()}</div>
            </div>
            <div class="issue-rule">📋 ${issue.rule}</div>
            <div class="issue-message">${issue.message}</div>
            ${issue.details ? `<div class="issue-details">${issue.details}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `}
  </div>
</body>
</html>
  `;
  
  const reportPath = path.join(process.cwd(), 'ui-adapter-report.html');
  fs.writeFileSync(reportPath, html, 'utf-8');
  console.log(`\n📄 HTML报告已生成: ${reportPath}\n`);
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始扫描UI适配问题...\n');
  
  // 扫描指定目录
  config.scanDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 扫描目录: ${dir}`);
      scanDirectory(fullPath, dir);
    }
  });
  
  // 生成报告
  generateConsoleReport();
  generateHTMLReport();
  
  // 返回退出码
  process.exit(results.summary.error > 0 ? 1 : 0);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanDirectory, checkFile, config, results };

