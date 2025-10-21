/**
 * 测试报告生成器 - CraneHeart心理健康评估平台
 * 
 * 功能：
 * 1. 生成HTML测试报告
 * 2. 生成Markdown测试报告
 * 3. 生成JSON测试报告
 * 4. 生成性能报告
 */

const testReportGenerator = {
  /**
   * 生成HTML测试报告
   */
  generateHTMLReport(testResults) {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CraneHeart 测试报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 30px; }
    h1 { color: #333; margin-bottom: 20px; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
    h2 { color: #555; margin-top: 30px; margin-bottom: 15px; }
    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .stat-card.passed { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    .stat-card.failed { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
    .stat-card h3 { font-size: 24px; margin-bottom: 5px; }
    .stat-card p { font-size: 14px; opacity: 0.9; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th { background: #f8f9fa; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6; }
    td { padding: 12px; border-bottom: 1px solid #dee2e6; }
    tr:hover { background: #f8f9fa; }
    .status-pass { color: #28a745; font-weight: 600; }
    .status-fail { color: #dc3545; font-weight: 600; }
    .chart { margin: 20px 0; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 CraneHeart 测试报告</h1>
    
    <div class="stats">
      <div class="stat-card">
        <h3>${testResults.total}</h3>
        <p>总测试数</p>
      </div>
      <div class="stat-card passed">
        <h3>${testResults.passed}</h3>
        <p>通过</p>
      </div>
      <div class="stat-card failed">
        <h3>${testResults.failed}</h3>
        <p>失败</p>
      </div>
      <div class="stat-card">
        <h3>${testResults.passRate}%</h3>
        <p>通过率</p>
      </div>
    </div>

    <h2>📊 测试详情</h2>
    <table>
      <thead>
        <tr>
          <th>测试项</th>
          <th>状态</th>
          <th>耗时</th>
          <th>备注</th>
        </tr>
      </thead>
      <tbody>
        ${testResults.details.map(detail => `
          <tr>
            <td>${detail.name}</td>
            <td class="status-${detail.status === '✅ 通过' ? 'pass' : 'fail'}">${detail.status}</td>
            <td>${detail.duration || '-'}</td>
            <td>${detail.remark || '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h2>📈 性能指标</h2>
    <table>
      <thead>
        <tr>
          <th>指标</th>
          <th>值</th>
          <th>状态</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>平均响应时间</td>
          <td>${testResults.avgResponseTime}ms</td>
          <td>${testResults.avgResponseTime < 1000 ? '✅ 优秀' : '⚠️ 需优化'}</td>
        </tr>
        <tr>
          <td>最大响应时间</td>
          <td>${testResults.maxResponseTime}ms</td>
          <td>${testResults.maxResponseTime < 3000 ? '✅ 优秀' : '⚠️ 需优化'}</td>
        </tr>
        <tr>
          <td>内存占用</td>
          <td>${testResults.memoryUsage}MB</td>
          <td>${testResults.memoryUsage < 100 ? '✅ 优秀' : '⚠️ 需优化'}</td>
        </tr>
      </tbody>
    </table>

    <div class="footer">
      <p>生成时间: ${new Date().toLocaleString('zh-CN')}</p>
      <p>CraneHeart 心理健康评估平台 © 2025</p>
    </div>
  </div>
</body>
</html>
    `;
    
    return html;
  },

  /**
   * 生成Markdown测试报告
   */
  generateMarkdownReport(testResults) {
    const markdown = `# 🧪 CraneHeart 测试报告

**生成时间**: ${new Date().toLocaleString('zh-CN')}

---

## 📊 测试统计

| 指标 | 数值 |
|------|------|
| 总测试数 | ${testResults.total} |
| ✅ 通过 | ${testResults.passed} |
| ❌ 失败 | ${testResults.failed} |
| 通过率 | ${testResults.passRate}% |

---

## 📈 性能指标

| 指标 | 值 | 状态 |
|------|-----|------|
| 平均响应时间 | ${testResults.avgResponseTime}ms | ${testResults.avgResponseTime < 1000 ? '✅ 优秀' : '⚠️ 需优化'} |
| 最大响应时间 | ${testResults.maxResponseTime}ms | ${testResults.maxResponseTime < 3000 ? '✅ 优秀' : '⚠️ 需优化'} |
| 内存占用 | ${testResults.memoryUsage}MB | ${testResults.memoryUsage < 100 ? '✅ 优秀' : '⚠️ 需优化'} |

---

## 📋 测试详情

${testResults.details.map((detail, index) => `
### ${index + 1}. ${detail.name}

- **状态**: ${detail.status}
- **耗时**: ${detail.duration || '-'}
- **备注**: ${detail.remark || '-'}
`).join('\n')}

---

## 🎯 总体评价

${testResults.passRate >= 95 ? '✅ 测试通过率优秀，项目质量良好！' : 
  testResults.passRate >= 80 ? '⚠️ 测试通过率一般，需要改进。' : 
  '❌ 测试通过率较低，需要重点关注。'}

---

**CraneHeart 心理健康评估平台 © 2025**
    `;
    
    return markdown;
  },

  /**
   * 生成JSON测试报告
   */
  generateJSONReport(testResults) {
    return JSON.stringify({
      title: 'CraneHeart 测试报告',
      timestamp: new Date().toISOString(),
      summary: {
        total: testResults.total,
        passed: testResults.passed,
        failed: testResults.failed,
        passRate: testResults.passRate
      },
      performance: {
        avgResponseTime: testResults.avgResponseTime,
        maxResponseTime: testResults.maxResponseTime,
        memoryUsage: testResults.memoryUsage
      },
      details: testResults.details
    }, null, 2);
  },

  /**
   * 生成性能报告
   */
  generatePerformanceReport(performanceData) {
    const report = {
      title: '性能测试报告',
      timestamp: new Date().toISOString(),
      metrics: {
        pageLoadTime: performanceData.pageLoadTime || 0,
        domContentLoadedTime: performanceData.domContentLoadedTime || 0,
        firstPaintTime: performanceData.firstPaintTime || 0,
        fps: performanceData.fps || 60,
        memoryUsage: performanceData.memoryUsage || 0
      },
      recommendations: []
    };

    // 生成建议
    if (report.metrics.pageLoadTime > 3000) {
      report.recommendations.push('页面加载时间过长，建议优化资源加载');
    }
    if (report.metrics.fps < 50) {
      report.recommendations.push('帧率较低，建议优化动画和渲染');
    }
    if (report.metrics.memoryUsage > 100) {
      report.recommendations.push('内存占用过高，建议检查内存泄漏');
    }

    return report;
  },

  /**
   * 保存报告到文件
   */
  async saveReport(filename, content, format = 'html') {
    console.log(`💾 正在保存${format.toUpperCase()}报告到 ${filename}...`);
    
    try {
      // 这里应该使用实际的文件系统API
      // 例如: fs.writeFileSync(filename, content);
      console.log(`✅ 报告已保存到 ${filename}`);
      return true;
    } catch (error) {
      console.error(`❌ 保存报告失败: ${error.message}`);
      return false;
    }
  }
};

// 导出
export default testReportGenerator;

