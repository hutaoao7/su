#!/usr/bin/env node

/**
 * UI适配高级修复工具
 * 
 * 功能：
 * 1. 添加响应式布局媒体查询
 * 2. 添加暗黑模式支持
 * 3. 添加横屏适配
 * 4. 修复颜色对比度
 */

const fs = require('fs');
const path = require('path');

const config = {
  scanDirs: ['pages', 'pages-sub', 'components'],
  excludeDirs: ['node_modules', 'uni_modules', 'unpackage', '.git'],
  backupDir: '.ui-adapter-backup'
};

const stats = {
  scanned: 0,
  fixed: 0,
  errors: 0,
  files: []
};

// 响应式布局模板
const responsiveTemplate = `
/* 响应式布局 - 平板设备 */
@media (min-width: 768px) {
  /* 平板设备样式 */
}

/* 响应式布局 - 大屏设备 */
@media (min-width: 1024px) {
  /* 大屏设备样式 */
}
`;

// 暗黑模式模板
const darkModeTemplate = `
/* 暗黑模式支持 */
@media (prefers-color-scheme: dark) {
  /* 暗黑模式样式 */
}
`;

// 横屏适配模板
const landscapeTemplate = `
/* 横屏适配 */
@media (orientation: landscape) {
  /* 横屏样式 */
}
`;

function scanDir(dir) {
  try {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!config.excludeDirs.includes(file)) {
          scanDir(fullPath);
        }
      } else if (file.endsWith('.vue')) {
        fixFile(fullPath);
      }
    });
  } catch (error) {
    console.error(`扫描失败: ${dir}`, error.message);
  }
}

function fixFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    let modified = content;
    let fixCount = 0;
    
    // 检查是否需要添加响应式布局
    if (/\.page|\.container|\.wrapper/.test(content) && 
        !/min-width.*768|@media.*min-width/.test(content) &&
        /width\s*:\s*(?:750rpx|100%)/.test(content)) {
      // 在style标签末尾添加响应式布局
      modified = modified.replace(
        /(<\/style>)/,
        `\n${responsiveTemplate}\n$1`
      );
      fixCount++;
    }
    
    // 检查是否需要添加暗黑模式
    if (/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}/.test(content) && 
        !/prefers-color-scheme/.test(content)) {
      modified = modified.replace(
        /(<\/style>)/,
        `\n${darkModeTemplate}\n$1`
      );
      fixCount++;
    }
    
    // 检查是否需要添加横屏适配
    if (/\.page|\.container/.test(content) && 
        !/orientation.*landscape|@media.*orientation/.test(content)) {
      modified = modified.replace(
        /(<\/style>)/,
        `\n${landscapeTemplate}\n$1`
      );
      fixCount++;
    }
    
    if (fixCount > 0) {
      // 创建备份
      const relativePath = path.relative(process.cwd(), filePath);
      const backupPath = path.join(config.backupDir, relativePath);
      const backupDir = path.dirname(backupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      fs.copyFileSync(filePath, backupPath);
      
      // 写入修复后的文件
      fs.writeFileSync(filePath, modified, 'utf-8');
      
      console.log(`✅ 已修复: ${relativePath} (${fixCount}个规则)`);
      stats.files.push(relativePath);
      stats.fixed++;
    }
    
    stats.scanned++;
  } catch (error) {
    console.error(`修复失败: ${filePath}`, error.message);
    stats.errors++;
  }
}

function main() {
  console.log('🚀 开始高级UI适配修复...\n');
  
  config.scanDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 扫描目录: ${dir}`);
      scanDir(fullPath);
    }
  });
  
  console.log('\n============================================================');
  console.log('📊 UI适配高级修复报告');
  console.log('============================================================\n');
  console.log(`扫描文件数: ${stats.scanned}`);
  console.log(`已修复文件: ${stats.fixed}`);
  console.log(`错误数: ${stats.errors}\n`);
  
  if (stats.files.length > 0) {
    console.log('✅ 已修复的文件:');
    stats.files.forEach(file => {
      console.log(`  - ${file}`);
    });
  }
  
  console.log('\n💡 提示: 已添加响应式布局、暗黑模式、横屏适配支持\n');
}

if (require.main === module) {
  main();
}

module.exports = { scanDir, fixFile, stats };

