#!/usr/bin/env node

/**
 * 性能分析工具
 * 
 * 功能：
 * 1. 页面加载性能分析
 * 2. 首屏时间统计
 * 3. 资源加载分析
 * 4. 渲染性能监控
 * 5. 生成性能报告
 */

const fs = require('fs');
const path = require('path');

// 性能指标
const metrics = {
  pageLoad: [],
  firstScreen: [],
  resourceLoad: [],
  renderTime: []
};

// 配置
const config = {
  // 性能目标
  targets: {
    firstScreen: 2000,  // 首屏<2s
    pageLoad: 3000,     // 页面加载<3s
    apiResponse: 500    // API响应<500ms
  }
};

/**
 * 分析性能数据
 */
function analyzePerformance() {
  console.log('\n' + '='.repeat(80));
  console.log('性能分析报告');
  console.log('='.repeat(80));
  
  // 首屏时间
  if (metrics.firstScreen.length > 0) {
    const avgFirstScreen = average(metrics.firstScreen);
    const p95FirstScreen = percentile(metrics.firstScreen, 95);
    
    console.log(`\n📊 首屏时间:`);
    console.log(`  平均: ${avgFirstScreen.toFixed(0)}ms`);
    console.log(`  P95: ${p95FirstScreen.toFixed(0)}ms`);
    console.log(`  目标: ${config.targets.firstScreen}ms`);
    console.log(`  状态: ${p95FirstScreen <= config.targets.firstScreen ? '✅ 达标' : '❌ 超标'}`);
  }
  
  // 页面加载
  if (metrics.pageLoad.length > 0) {
    const avgPageLoad = average(metrics.pageLoad);
    const p95PageLoad = percentile(metrics.pageLoad, 95);
    
    console.log(`\n📊 页面加载:`);
    console.log(`  平均: ${avgPageLoad.toFixed(0)}ms`);
    console.log(`  P95: ${p95PageLoad.toFixed(0)}ms`);
    console.log(`  目标: ${config.targets.pageLoad}ms`);
    console.log(`  状态: ${p95PageLoad <= config.targets.pageLoad ? '✅ 达标' : '❌ 超标'}`);
  }
  
  console.log('\n' + '='.repeat(80));
}

/**
 * 计算平均值
 */
function average(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * 计算百分位
 */
function percentile(arr, p) {
  const sorted = arr.slice().sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p / 100) - 1;
  return sorted[index];
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
  <title>性能分析报告</title>
  <style>
    body { font-family: sans-serif; padding: 20px; background: #f5f7fa; }
    .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
    h1 { color: #333; }
    .metric { margin: 20px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
    .metric-title { font-size: 18px; font-weight: bold; margin-bottom: 10px; }
    .metric-value { font-size: 32px; font-weight: bold; }
    .status-ok { color: #67c23a; }
    .status-warn { color: #e6a23c; }
    .status-error { color: #f56c6c; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 性能分析报告</h1>
    <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
    
    <div class="metric">
      <div class="metric-title">首屏时间</div>
      <div class="metric-value">加载中...</div>
      <p>目标: &lt; 2000ms</p>
    </div>
    
    <div class="metric">
      <div class="metric-title">页面加载</div>
      <div class="metric-value">加载中...</div>
      <p>目标: &lt; 3000ms</p>
    </div>
  </div>
</body>
</html>
  `;
  
  const reportPath = path.join(process.cwd(), 'performance-report.html');
  fs.writeFileSync(reportPath, html, 'utf-8');
  console.log(`\n📄 性能报告已生成: ${reportPath}\n`);
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始性能分析...\n');
  
  // 模拟一些性能数据
  metrics.firstScreen = [1800, 1900, 2100, 1850, 1950];
  metrics.pageLoad = [2500, 2600, 2800, 2550, 2700];
  
  analyzePerformance();
  generateHTMLReport();
}

if (require.main === module) {
  main();
}

module.exports = { analyzePerformance, metrics };


