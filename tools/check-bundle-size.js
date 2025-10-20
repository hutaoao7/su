/**
 * 包体积检查工具
 * 用于分析和优化小程序包体积
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  distPath: path.join(__dirname, '../unpackage/dist/mp-weixin'),
  mainPackageLimit: 2 * 1024 * 1024, // 主包限制2MB
  subPackageLimit: 2 * 1024 * 1024,  // 分包限制2MB
  totalLimit: 20 * 1024 * 1024,      // 总包限制20MB
  ignorePatterns: [
    'node_modules',
    '.git',
    '.DS_Store',
    'Thumbs.db'
  ]
};

// 获取文件大小
function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

// 递归获取目录大小
function getDirectorySize(dirPath) {
  let totalSize = 0;
  const files = [];
  
  function traverse(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    items.forEach(item => {
      // 忽略特定文件
      if (CONFIG.ignorePatterns.some(pattern => item.includes(pattern))) {
        return;
      }
      
      const itemPath = path.join(currentPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        traverse(itemPath);
      } else {
        const size = stats.size;
        totalSize += size;
        files.push({
          path: path.relative(dirPath, itemPath),
          size: size
        });
      }
    });
  }
  
  traverse(dirPath);
  
  return { totalSize, files };
}

// 格式化文件大小
function formatSize(bytes) {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + sizes[i];
}

// 分析文件类型
function analyzeFileTypes(files) {
  const typeStats = {};
  
  files.forEach(file => {
    const ext = path.extname(file.path).toLowerCase() || 'no-ext';
    if (!typeStats[ext]) {
      typeStats[ext] = {
        count: 0,
        size: 0,
        files: []
      };
    }
    
    typeStats[ext].count++;
    typeStats[ext].size += file.size;
    typeStats[ext].files.push(file);
  });
  
  return typeStats;
}

// 找出大文件
function findLargeFiles(files, threshold = 100 * 1024) { // 默认100KB
  return files
    .filter(file => file.size > threshold)
    .sort((a, b) => b.size - a.size);
}

// 生成优化建议
function generateOptimizationSuggestions(analysis) {
  const suggestions = [];
  
  // 检查总包体积
  if (analysis.totalSize > CONFIG.mainPackageLimit) {
    suggestions.push({
      level: 'error',
      message: `主包体积超限：${formatSize(analysis.totalSize)} > ${formatSize(CONFIG.mainPackageLimit)}`,
      solution: '需要进行分包处理或删除冗余资源'
    });
  }
  
  // 检查图片资源
  const imageTypes = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
  let totalImageSize = 0;
  
  imageTypes.forEach(ext => {
    if (analysis.typeStats[ext]) {
      totalImageSize += analysis.typeStats[ext].size;
    }
  });
  
  if (totalImageSize > 500 * 1024) { // 图片总大小超过500KB
    suggestions.push({
      level: 'warning',
      message: `图片资源过大：${formatSize(totalImageSize)}`,
      solution: '建议压缩图片或使用CDN'
    });
  }
  
  // 检查大文件
  if (analysis.largeFiles.length > 0) {
    suggestions.push({
      level: 'warning',
      message: `发现 ${analysis.largeFiles.length} 个大文件（>100KB）`,
      solution: '考虑压缩或移到分包/CDN'
    });
  }
  
  // 检查JS文件
  if (analysis.typeStats['.js'] && analysis.typeStats['.js'].size > 1024 * 1024) {
    suggestions.push({
      level: 'warning',
      message: `JS文件总大小：${formatSize(analysis.typeStats['.js'].size)}`,
      solution: '启用代码压缩和Tree Shaking'
    });
  }
  
  return suggestions;
}

// 生成报告
function generateReport(analysis) {
  let report = `# 小程序包体积分析报告

**分析时间**: ${new Date().toLocaleString()}  
**分析路径**: ${CONFIG.distPath}

## 📊 体积概况

- **总体积**: ${formatSize(analysis.totalSize)}
- **文件数量**: ${analysis.files.length}
- **主包限制**: ${formatSize(CONFIG.mainPackageLimit)}
- **状态**: ${analysis.totalSize <= CONFIG.mainPackageLimit ? '✅ 正常' : '❌ 超限'}

## 📈 文件类型分布

| 类型 | 文件数 | 总大小 | 占比 |
|------|--------|--------|------|
`;

  // 按大小排序
  const sortedTypes = Object.entries(analysis.typeStats)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 10); // 只显示前10个
  
  sortedTypes.forEach(([ext, stats]) => {
    const percentage = ((stats.size / analysis.totalSize) * 100).toFixed(2);
    report += `| ${ext} | ${stats.count} | ${formatSize(stats.size)} | ${percentage}% |\n`;
  });
  
  // 大文件列表
  if (analysis.largeFiles.length > 0) {
    report += `\n## 🔍 大文件列表（前10个）\n\n`;
    report += '| 文件路径 | 大小 |\n';
    report += '|---------|------|\n';
    
    analysis.largeFiles.slice(0, 10).forEach(file => {
      report += `| ${file.path} | ${formatSize(file.size)} |\n`;
    });
  }
  
  // 优化建议
  if (analysis.suggestions.length > 0) {
    report += `\n## 💡 优化建议\n\n`;
    
    analysis.suggestions.forEach((suggestion, index) => {
      const icon = suggestion.level === 'error' ? '❌' : '⚠️';
      report += `${index + 1}. ${icon} **${suggestion.message}**\n`;
      report += `   - 解决方案：${suggestion.solution}\n\n`;
    });
  }
  
  // 分包建议
  report += `\n## 📦 分包建议\n\n`;
  report += `根据当前包体积（${formatSize(analysis.totalSize)}），`;
  
  if (analysis.totalSize > CONFIG.mainPackageLimit) {
    report += '**强烈建议**进行分包处理：\n\n';
    report += '1. **功能模块分包**：\n';
    report += '   - 评估模块 → `subpackages/assess`\n';
    report += '   - AI对话模块 → `subpackages/ai`\n';
    report += '   - 音乐模块 → `subpackages/music`\n\n';
    report += '2. **资源优化**：\n';
    report += '   - 图片资源使用CDN或压缩\n';
    report += '   - 音频文件改为网络加载\n';
    report += '   - 删除未使用的依赖\n';
  } else {
    report += '当前未超限，但建议持续关注包体积变化。\n';
  }
  
  return report;
}

// 主函数
function main() {
  console.log('🔍 开始分析小程序包体积...\n');
  
  // 检查dist目录是否存在
  if (!fs.existsSync(CONFIG.distPath)) {
    console.error('❌ 错误：dist目录不存在，请先构建项目');
    console.log(`   路径：${CONFIG.distPath}`);
    process.exit(1);
  }
  
  // 分析包体积
  const { totalSize, files } = getDirectorySize(CONFIG.distPath);
  const typeStats = analyzeFileTypes(files);
  const largeFiles = findLargeFiles(files);
  
  const analysis = {
    totalSize,
    files,
    typeStats,
    largeFiles,
    suggestions: []
  };
  
  // 生成优化建议
  analysis.suggestions = generateOptimizationSuggestions(analysis);
  
  // 生成报告
  const report = generateReport(analysis);
  
  // 保存报告
  const reportPath = path.join(__dirname, '../docs/BUNDLE-SIZE-REPORT.md');
  fs.writeFileSync(reportPath, report);
  
  // 输出结果
  console.log(`📊 包体积分析完成！\n`);
  console.log(`总体积: ${formatSize(totalSize)}`);
  console.log(`文件数: ${files.length}`);
  console.log(`状态: ${totalSize <= CONFIG.mainPackageLimit ? '✅ 正常' : '❌ 超限'}`);
  console.log(`\n📄 详细报告已生成: ${reportPath}\n`);
  
  // 如果超限，返回非0退出码
  process.exit(totalSize > CONFIG.mainPackageLimit ? 1 : 0);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { getDirectorySize, analyzeFileTypes, generateReport };
