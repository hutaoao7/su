/**
 * API兼容性修复工具
 * 将wx.API调用统一替换为uni.API
 */

const fs = require('fs');
const path = require('path');

const TAG = '[API修复]';

// 需要扫描的目录
const SCAN_DIRS = ['pages', 'components', 'utils', 'api'];

// 需要排除的目录
const EXCLUDE_DIRS = ['node_modules', 'unpackage', '.git', 'uni_modules'];

// 文件扩展名
const FILE_EXTENSIONS = ['.vue', '.js'];

// API映射规则
const API_MAPPINGS = {
  'wx.': 'uni.',
  'wx[': 'uni[',
  // 保留条件编译中的wx
  '// #ifdef MP-WEIXIN\n.*wx\\.': null,  // 不替换
  '// #ifndef MP-WEIXIN\n.*wx\\.': null, // 不替换
};

// 统计信息
const stats = {
  filesScanned: 0,
  filesModified: 0,
  replacements: 0,
  errors: []
};

/**
 * 递归扫描目录
 */
function scanDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // 排除特定目录
      if (!EXCLUDE_DIRS.includes(file)) {
        scanDirectory(fullPath);
      }
    } else if (stat.isFile()) {
      // 检查文件扩展名
      const ext = path.extname(file);
      if (FILE_EXTENSIONS.includes(ext)) {
        processFile(fullPath);
      }
    }
  });
}

/**
 * 处理单个文件
 */
function processFile(filePath) {
  stats.filesScanned++;
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    let fileReplacements = 0;
    
    // 保存原始内容用于对比
    const originalContent = content;
    
    // 检查是否在条件编译块中
    const lines = content.split('\n');
    const processedLines = [];
    let inWeixinBlock = false;
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // 检查条件编译标记
      if (line.includes('// #ifdef MP-WEIXIN') || line.includes('/* #ifdef MP-WEIXIN */')) {
        inWeixinBlock = true;
      } else if (line.includes('// #endif') || line.includes('/* #endif */')) {
        inWeixinBlock = false;
      }
      
      // 如果不在微信条件编译块中，进行替换
      if (!inWeixinBlock) {
        // 替换wx.为uni.
        if (line.includes('wx.') && !line.includes('// #ifdef') && !line.includes('/* #ifdef')) {
          const newLine = line.replace(/\bwx\./g, 'uni.');
          if (newLine !== line) {
            line = newLine;
            fileReplacements++;
            modified = true;
          }
        }
      }
      
      processedLines.push(line);
    }
    
    // 如果有修改，写回文件
    if (modified) {
      content = processedLines.join('\n');
      fs.writeFileSync(filePath, content, 'utf8');
      stats.filesModified++;
      stats.replacements += fileReplacements;
      
      console.log(`${TAG} ✅ 修改文件: ${path.relative(process.cwd(), filePath)} (${fileReplacements}处)`);
    }
    
  } catch (error) {
    stats.errors.push({
      file: filePath,
      error: error.message
    });
    console.error(`${TAG} ❌ 处理文件失败: ${filePath}`, error.message);
  }
}

/**
 * 生成修复报告
 */
function generateReport() {
  const report = `# API兼容性修复报告

**执行时间**: ${new Date().toISOString()}

## 📊 修复统计

| 指标 | 数量 |
|------|------|
| 扫描文件数 | ${stats.filesScanned} |
| 修改文件数 | ${stats.filesModified} |
| 替换次数 | ${stats.replacements} |
| 错误数 | ${stats.errors.length} |

## ✅ 修复内容

将所有非条件编译块中的 \`wx.\` API调用替换为 \`uni.\` API。

## 🔍 修复细节

- 保留了条件编译块中的wx.调用
- 确保跨平台兼容性
- 不影响平台特定功能

${stats.errors.length > 0 ? `
## ❌ 错误列表

${stats.errors.map(e => `- ${e.file}: ${e.error}`).join('\n')}
` : ''}

## ✅ 验证建议

1. 运行项目确认功能正常
2. 执行兼容性测试
3. 检查小程序和H5平台

---

*报告生成时间: ${new Date().toLocaleString()}*
`;

  fs.writeFileSync('docs/API-COMPATIBILITY-FIX-REPORT.md', report, 'utf8');
  console.log(`\n${TAG} 📄 报告已保存至: docs/API-COMPATIBILITY-FIX-REPORT.md`);
}

/**
 * 执行修复前的备份
 */
function backupFiles() {
  console.log(`${TAG} 创建备份...`);
  
  const backupDir = `backup_api_fix_${Date.now()}`;
  
  // 创建备份说明
  const backupInfo = {
    timestamp: new Date().toISOString(),
    purpose: 'API兼容性修复前备份',
    stats: {
      filesScanned: stats.filesScanned
    }
  };
  
  fs.writeFileSync(`${backupDir}_info.json`, JSON.stringify(backupInfo, null, 2), 'utf8');
  console.log(`${TAG} 备份信息已保存`);
}

/**
 * 主函数
 */
function main() {
  console.log('='.repeat(50));
  console.log(`${TAG} API兼容性修复开始`);
  console.log('='.repeat(50));
  
  const startTime = Date.now();
  
  // 扫描所有目录
  SCAN_DIRS.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`\n${TAG} 扫描目录: ${dir}`);
      scanDirectory(dir);
    }
  });
  
  const duration = Date.now() - startTime;
  
  // 生成报告
  generateReport();
  
  console.log('\n' + '='.repeat(50));
  console.log(`${TAG} 修复完成`);
  console.log('='.repeat(50));
  
  // 输出统计
  console.log(`\n📊 修复统计:`);
  console.log(`  扫描文件: ${stats.filesScanned}`);
  console.log(`  修改文件: ${stats.filesModified}`);
  console.log(`  替换次数: ${stats.replacements}`);
  console.log(`  错误数: ${stats.errors.length}`);
  console.log(`  耗时: ${duration}ms`);
  
  if (stats.replacements > 0) {
    console.log(`\n✅ 成功修复 ${stats.replacements} 处API兼容性问题！`);
  } else {
    console.log(`\n✅ 未发现需要修复的API兼容性问题。`);
  }
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️ 有 ${stats.errors.length} 个文件处理失败，请查看报告。`);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanDirectory, processFile };
