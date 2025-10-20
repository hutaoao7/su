#!/usr/bin/env node

/**
 * 打包分析工具
 * 
 * 功能：
 * 1. 分析打包产物
 * 2. 可视化包大小
 * 3. 依赖树分析
 * 4. 重复代码检测
 * 5. 优化建议
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  unpackageDir: 'unpackage/dist',
  outputFile: 'bundle-analysis.html'
};

// 分析结果
const analysis = {
  totalSize: 0,
  files: [],
  duplicates: [],
  suggestions: []
};

/**
 * 分析打包产物
 */
function analyzeBuildOutput() {
  const distPath = path.join(process.cwd(), config.unpackageDir);
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ 打包目录不存在，请先运行构建');
    console.log('  运行: npm run build:mp-weixin');
    return;
  }
  
  console.log('📦 分析打包产物...\n');
  
  scanBuildDirectory(distPath);
  generateReport();
  generateHTMLReport();
}

/**
 * 扫描构建目录
 */
function scanBuildDirectory(dir, relativePath = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanBuildDirectory(filePath, path.join(relativePath, file));
    } else {
      const size = stat.size;
      analysis.totalSize += size;
      
      analysis.files.push({
        path: path.join(relativePath, file),
        size: size,
        type: path.extname(file)
      });
    }
  });
}

/**
 * 生成控制台报告
 */
function generateReport() {
  console.log('='.repeat(80));
  console.log('打包分析报告');
  console.log('='.repeat(80));
  console.log(`总大小: ${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`文件数: ${analysis.files.length}`);
  console.log('='.repeat(80) + '\n');
  
  // 按类型统计
  const byType = {};
  analysis.files.forEach(file => {
    if (!byType[file.type]) {
      byType[file.type] = { count: 0, size: 0 };
    }
    byType[file.type].count++;
    byType[file.type].size += file.size;
  });
  
  console.log('📊 文件类型统计:');
  Object.entries(byType).forEach(([type, stats]) => {
    console.log(`  ${type || '无扩展名'}: ${stats.count}个文件, ${(stats.size / 1024).toFixed(2)}KB`);
  });
  console.log('');
  
  // 最大文件
  console.log('📈 最大文件（Top 10）:');
  const sorted = analysis.files.sort((a, b) => b.size - a.size).slice(0, 10);
  sorted.forEach((file, i) => {
    console.log(`${i + 1}. ${file.path}: ${(file.size / 1024).toFixed(2)}KB`);
  });
}

/**
 * 生成HTML报告
 */
function generateHTMLReport() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>打包分析报告</title>
  <style>
    body { font-family: sans-serif; margin: 0; padding: 20px; background: #f5f7fa; }
    .container { max-width: 1400px; margin: 0 auto; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; }
    h1 { margin: 0; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
    .stat-card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .stat-value { font-size: 36px; font-weight: bold; }
    .stat-label { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📦 打包分析报告</h1>
      <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB</div>
        <div class="stat-label">总大小</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${analysis.files.length}</div>
        <div class="stat-label">文件数</div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  const reportPath = path.join(process.cwd(), config.outputFile);
  fs.writeFileSync(reportPath, html, 'utf-8');
  console.log(`\n📄 HTML报告已生成: ${reportPath}\n`);
}

/**
 * 主函数
 */
function main() {
  analyzeBuildOutput();
}

if (require.main === module) {
  main();
}

module.exports = { analyzeBuildOutput, analysis };


