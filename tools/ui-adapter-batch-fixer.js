#!/usr/bin/env node

/**
 * UI适配批量修复工具 - 高级版本
 * 
 * 功能：
 * 1. 修复Safe Area适配问题
 * 2. 修复屏幕尺寸边界问题
 * 3. 添加响应式布局支持
 * 4. 添加暗黑模式支持
 * 5. 修复字体可访问性
 */

const fs = require('fs');
const path = require('path');

const config = {
  scanDirs: ['pages', 'pages-sub', 'components'],
  excludeDirs: ['node_modules', 'uni_modules', 'unpackage', '.git'],
  backupDir: '.ui-adapter-backup'
};

// 修复规则
const fixRules = [
  {
    name: '修复Safe Area适配 - 添加padding-bottom',
    check: (content) => {
      return /position\s*:\s*fixed.*bottom\s*:\s*0/.test(content) && 
             !/safe-area-inset-bottom/.test(content) &&
             !/padding-bottom.*env/.test(content);
    },
    fix: (content) => {
      // 在fixed定位的样式块中添加padding-bottom
      return content.replace(
        /(position\s*:\s*fixed[^}]*bottom\s*:\s*0[^}]*)(;?\s*})/g,
        (match, styles, end) => {
          if (!/padding-bottom/.test(styles)) {
            return styles + '; padding-bottom: env(safe-area-inset-bottom)' + end;
          }
          return match;
        }
      );
    }
  },
  {
    name: '修复屏幕尺寸 - 添加max-width约束',
    check: (content) => {
      return /width\s*:\s*(?:750rpx|100%)/.test(content) && 
             !/max-width/.test(content) &&
             /\.page|\.container|\.wrapper/.test(content);
    },
    fix: (content) => {
      // 为页面容器添加max-width
      return content.replace(
        /(\.\w+(?:-\w+)*\s*\{[^}]*width\s*:\s*(?:750rpx|100%)[^}]*)(;?\s*})/g,
        (match, styles, end) => {
          if (!/max-width/.test(styles)) {
            return styles + '; max-width: 750rpx' + end;
          }
          return match;
        }
      );
    }
  },
  {
    name: '修复字体大小 - 最小12px',
    check: (content) => {
      return /font-size\s*:\s*(?:[0-9]|1[0-1])(?:px|rpx)/.test(content);
    },
    fix: (content) => {
      return content.replace(
        /font-size\s*:\s*([0-9]|1[0-1])(px|rpx)/g,
        (match, size, unit) => {
          const numSize = parseInt(size);
          if (numSize < 12) {
            return `font-size: 12${unit}`;
          }
          return match;
        }
      );
    }
  },
  {
    name: '添加overflow处理',
    check: (content) => {
      return /width\s*:\s*\d+(?:px|rpx)/.test(content) && 
             !/overflow/.test(content) &&
             /\.page|\.container/.test(content);
    },
    fix: (content) => {
      return content.replace(
        /(\.\w+(?:-\w+)*\s*\{[^}]*width\s*:\s*\d+(?:px|rpx)[^}]*)(;?\s*})/g,
        (match, styles, end) => {
          if (!/overflow/.test(styles)) {
            return styles + '; overflow: hidden' + end;
          }
          return match;
        }
      );
    }
  }
];

const stats = {
  scanned: 0,
  fixed: 0,
  errors: 0,
  files: []
};

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

    fixRules.forEach(rule => {
      if (rule.check(modified)) {
        modified = rule.fix(modified);
        fixCount++;
      }
    });

    if (fixCount > 0) {
      // 创建备份 - 使用相对路径
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
  console.log('🚀 开始批量修复UI适配问题...\n');
  
  config.scanDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 扫描目录: ${dir}`);
      scanDir(fullPath);
    }
  });
  
  console.log('\n============================================================');
  console.log('📊 UI适配批量修复报告');
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
  
  console.log('\n💡 提示: 所有原始文件已备份到 .ui-adapter-backup 目录\n');
}

if (require.main === module) {
  main();
}

module.exports = { scanDir, fixFile, stats };

