#!/usr/bin/env node
/**
 * UI组件库一致性检查脚本
 * 用途: 检测项目中是否混用uni-ui和uView组件
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  scanDirs: ['pages', 'components'],
  allowedPrefixes: ['u-'], // 允许的组件前缀
  bannedPrefixes: ['uni-'], // 禁止的组件前缀（除非在白名单）
  whitelist: ['uni-app', 'uni.'], // 白名单（API调用等）
};

// 结果统计
const results = {
  total: 0,
  uViewComponents: new Set(),
  uniUIComponents: new Set(),
  files: {
    clean: [],
    warning: [],
    error: [],
  },
};

/**
 * 扫描单个文件
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileResult = {
    path: filePath,
    uViewComponents: [],
    uniUIComponents: [],
    issues: [],
  };

  // 检测 u- 组件
  const uViewPattern = /<u-([a-z-]+)/g;
  let match;
  while ((match = uViewPattern.exec(content)) !== null) {
    const componentName = `u-${match[1]}`;
    fileResult.uViewComponents.push(componentName);
    results.uViewComponents.add(componentName);
  }

  // 检测 uni- 组件
  const uniUIPattern = /<uni-([a-z-]+)/g;
  while ((match = uniUIPattern.exec(content)) !== null) {
    const componentName = `uni-${match[1]}`;
    // 检查是否在白名单
    const isWhitelisted = CONFIG.whitelist.some(item => content.includes(item));
    if (!isWhitelisted) {
      fileResult.uniUIComponents.push(componentName);
      results.uniUIComponents.add(componentName);
      fileResult.issues.push({
        type: 'error',
        message: `发现uni-ui组件: ${componentName}，应使用uView组件替代`,
      });
    }
  }

  results.total++;

  // 分类文件
  if (fileResult.issues.length > 0) {
    results.files.error.push(fileResult);
  } else if (fileResult.uViewComponents.length > 0) {
    results.files.clean.push(fileResult);
  }

  return fileResult;
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir) {
  const files = [];
  
  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory()) {
        scan(fullPath);
      } else if (item.isFile() && item.name.endsWith('.vue')) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

/**
 * 检查uView是否安装
 */
function checkUViewInstalled() {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error('❌ 未找到package.json');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const hasUView = packageJson.dependencies && packageJson.dependencies['uview-ui'];
  
  if (!hasUView) {
    console.error('❌ uView未安装，请运行: npm install uview-ui');
    return false;
  }

  console.log(`✅ uView已安装: ${packageJson.dependencies['uview-ui']}`);
  return true;
}

/**
 * 主函数
 */
function main() {
  console.log('===== UI组件库一致性检查 =====\n');

  // 检查uView是否安装
  if (!checkUViewInstalled()) {
    process.exit(1);
  }

  // 扫描所有.vue文件
  let allFiles = [];
  CONFIG.scanDirs.forEach(dir => {
    allFiles = allFiles.concat(scanDirectory(dir));
  });

  console.log(`扫描文件数: ${allFiles.length}\n`);

  allFiles.forEach(scanFile);

  // 输出报告
  console.log('===== 检查结果 =====\n');
  console.log(`✅ 正常文件: ${results.files.clean.length}`);
  console.log(`⚠️  警告文件: ${results.files.warning.length}`);
  console.log(`❌ 错误文件: ${results.files.error.length}\n`);

  if (results.uViewComponents.size > 0) {
    console.log(`uView组件 (${results.uViewComponents.size}个):`);
    Array.from(results.uViewComponents).sort().forEach(comp => {
      console.log(`  - ${comp}`);
    });
    console.log();
  }

  if (results.uniUIComponents.size > 0) {
    console.log(`⚠️  uni-ui组件 (${results.uniUIComponents.size}个，需替换):`);
    Array.from(results.uniUIComponents).sort().forEach(comp => {
      console.log(`  - ${comp}`);
    });
    console.log();
  }

  // 输出错误详情
  if (results.files.error.length > 0) {
    console.log('===== 错误详情 =====\n');
    results.files.error.forEach(file => {
      console.log(`❌ ${file.path}`);
      file.issues.forEach(issue => {
        console.log(`   ${issue.message}`);
      });
      console.log();
    });
  }

  // 退出码
  const exitCode = results.files.error.length > 0 ? 1 : 0;
  console.log(exitCode === 0 ? '✅ 检查通过' : '❌ 检查失败');
  process.exit(exitCode);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanFile, checkUViewInstalled };

