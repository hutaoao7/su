#!/usr/bin/env node
/**
 * 云函数ESM检查脚本
 * 检查云函数是否使用ESM语法（应使用CJS）
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  cloudFunctionsDir: 'uniCloud-aliyun/cloudfunctions',
  excludeDirs: ['node_modules'],
  esmPatterns: {
    import: /^\s*import\s+.*from/gm,
    export: /^\s*export\s+(default|const|class|function)/gm,
  },
};

// 结果统计
const results = {
  total: 0,
  violations: [],
  clean: [],
};

/**
 * 扫描单个云函数文件
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileResult = {
    path: filePath,
    violations: [],
  };

  // 检查import语法
  const importMatches = content.match(CONFIG.esmPatterns.import);
  if (importMatches) {
    fileResult.violations.push({
      type: 'import',
      count: importMatches.length,
      message: `检测到${importMatches.length}处import语法，云函数必须使用require`,
      examples: importMatches.slice(0, 3), // 最多显示3个示例
    });
  }

  // 检查export语法
  const exportMatches = content.match(CONFIG.esmPatterns.export);
  if (exportMatches) {
    fileResult.violations.push({
      type: 'export',
      count: exportMatches.length,
      message: `检测到${exportMatches.length}处export语法，云函数必须使用module.exports`,
      examples: exportMatches.slice(0, 3),
    });
  }

  results.total++;

  if (fileResult.violations.length > 0) {
    results.violations.push(fileResult);
  } else {
    results.clean.push(filePath);
  }

  return fileResult;
}

/**
 * 递归扫描目录
 */
function scanDir(dir) {
  const files = [];
  
  function scan(currentDir) {
    if (!fs.existsSync(currentDir)) return;
    
    const items = fs.readdirSync(currentDir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item.name);
      
      if (item.isDirectory() && !CONFIG.excludeDirs.includes(item.name)) {
        scan(fullPath);
      } else if (item.isFile() && item.name === 'index.js') {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

/**
 * 主函数
 */
function main() {
  console.log('===== 云函数ESM检查 =====\n');

  // 检查云函数目录是否存在
  if (!fs.existsSync(CONFIG.cloudFunctionsDir)) {
    console.error(`❌ 云函数目录不存在: ${CONFIG.cloudFunctionsDir}`);
    process.exit(1);
  }

  // 扫描所有云函数文件
  const files = scanDir(CONFIG.cloudFunctionsDir);

  console.log(`扫描文件数: ${files.length}\n`);

  files.forEach(scanFile);

  // 输出报告
  console.log('===== 检查结果 =====\n');
  console.log(`✅ 正常文件（CJS）: ${results.clean.length}`);
  console.log(`❌ 违规文件（ESM）: ${results.violations.length}\n`);

  // 输出违规详情
  if (results.violations.length > 0) {
    console.log('===== 违规详情 =====\n');
    results.violations.forEach(file => {
      console.log(`❌ ${file.path}`);
      file.violations.forEach(v => {
        console.log(`   [${v.type}] ${v.message}`);
        if (v.examples && v.examples.length > 0) {
          console.log(`   示例:`);
          v.examples.forEach(ex => {
            console.log(`     ${ex.trim()}`);
          });
        }
      });
      console.log();
    });
    
    console.log('⚠️  修复建议:');
    console.log('  1. 将 import 改为 const ... = require(...)');
    console.log('  2. 将 export default 改为 module.exports = ');
    console.log('  3. 将 export const 改为 exports.xxx = \n');
  }

  // 退出码
  const exitCode = results.violations.length > 0 ? 1 : 0;
  console.log(exitCode === 0 ? '✅ 检查通过，所有云函数使用CJS' : '❌ 检查失败');
  process.exit(exitCode);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanFile };

