#!/usr/bin/env node

/**
 * UI适配自动修复工具
 * 
 * 功能：
 * 1. 自动检测并修复safe-area-inset缺失
 * 2. 修复fixed定位的安全区域适配
 * 3. 添加TabBar底部padding
 * 4. 修复导航栏顶部margin
 * 5. 优化触摸区域大小
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  scanDirs: ['pages', 'pages-sub', 'components'],
  excludeDirs: ['node_modules', 'uni_modules', 'unpackage', '.git'],
  backupDir: '.ui-adapter-backup'
};

// 修复规则
const fixRules = [
  {
    name: '添加safe-area-inset-bottom到fixed定位',
    pattern: /position\s*:\s*fixed\s*;[\s\S]*?bottom\s*:\s*0\s*;/,
    check: (content) => {
      return /position\s*:\s*fixed/.test(content) && 
             /bottom\s*:\s*0/.test(content) && 
             !/safe-area-inset-bottom/.test(content);
    },
    fix: (content) => {
      // 替换 bottom: 0; 为 bottom: calc(0px + env(safe-area-inset-bottom));
      return content.replace(
        /bottom\s*:\s*0\s*;/g,
        'bottom: calc(0px + env(safe-area-inset-bottom));'
      );
    }
  },
  {
    name: '添加safe-area-inset-top到fixed定位',
    pattern: /position\s*:\s*fixed\s*;[\s\S]*?top\s*:\s*0\s*;/,
    check: (content) => {
      return /position\s*:\s*fixed/.test(content) && 
             /top\s*:\s*0/.test(content) && 
             !/safe-area-inset-top/.test(content);
    },
    fix: (content) => {
      return content.replace(
        /top\s*:\s*0\s*;/g,
        'top: calc(0px + env(safe-area-inset-top));'
      );
    }
  },
  {
    name: '添加padding-bottom到页面容器',
    pattern: /class=".*-page"/,
    check: (content) => {
      return /class=".*-page"/.test(content) && 
             !/padding-bottom.*safe-area-inset-bottom/.test(content) &&
             /position\s*:\s*fixed.*bottom/.test(content);
    },
    fix: (content) => {
      return content.replace(
        /padding-bottom:\s*\d+(?:px|rpx);/g,
        'padding-bottom: calc(100px + env(safe-area-inset-bottom));'
      );
    }
  },
  {
    name: '修复过小的触摸区域',
    pattern: /(?:width|height)\s*:\s*(?:[1-3]\d|[0-9])(?:px|rpx)/,
    check: (content) => {
      return /(?:width|height)\s*:\s*(?:[1-3]\d|[0-9])(?:px|rpx)/.test(content);
    },
    fix: (content) => {
      // 将小于44px的宽度/高度改为至少44px
      return content.replace(
        /(?:width|height)\s*:\s*(\d{1,2})(?:px|rpx)/g,
        (match, size) => {
          const numSize = parseInt(size);
          if (numSize < 44) {
            const unit = match.includes('px') ? 'px' : 'rpx';
            return `${match.split(':')[0]}: 44${unit}`;
          }
          return match;
        }
      );
    }
  },
  {
    name: '添加padding-top到自定义导航栏',
    pattern: /navigationStyle.*custom/,
    check: (content) => {
      return /navigationStyle.*custom/.test(content) && 
             !/padding-top.*safe-area-inset-top/.test(content);
    },
    fix: (content) => {
      return content.replace(
        /padding-top:\s*\d+(?:px|rpx);/g,
        'padding-top: calc(44px + env(safe-area-inset-top));'
      );
    }
  }
];

// 统计
const stats = {
  scanned: 0,
  fixed: 0,
  errors: 0,
  files: []
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
      if (config.excludeDirs.includes(file)) return;
      scanDirectory(filePath, relativePath);
    } else if (stat.isFile() && file.endsWith('.vue')) {
      stats.scanned++;
      fixFile(filePath, relativePath);
    }
  });
}

/**
 * 修复单个文件
 */
function fixFile(filePath, relativePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf-8');
    let originalContent = content;
    let fileFixed = false;

    // 应用所有修复规则
    fixRules.forEach(rule => {
      if (rule.check(content)) {
        const fixed = rule.fix(content);
        if (fixed !== content) {
          content = fixed;
          fileFixed = true;
          console.log(`  ✅ ${rule.name}`);
        }
      }
    });

    // 如果有修改，保存文件
    if (fileFixed) {
      // 创建备份
      const backupPath = path.join(config.backupDir, relativePath + '.bak');
      const backupDir = path.dirname(backupPath);
      
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      fs.writeFileSync(backupPath, originalContent, 'utf-8');
      fs.writeFileSync(filePath, content, 'utf-8');
      
      stats.fixed++;
      stats.files.push({
        file: relativePath,
        status: 'fixed',
        backup: backupPath
      });
      
      console.log(`📝 已修复: ${relativePath}\n`);
    }
  } catch (error) {
    stats.errors++;
    console.error(`❌ 修复失败: ${relativePath}`, error.message);
  }
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 UI适配修复报告');
  console.log('='.repeat(60));
  console.log(`\n扫描文件数: ${stats.scanned}`);
  console.log(`已修复文件: ${stats.fixed}`);
  console.log(`错误数: ${stats.errors}`);
  
  if (stats.fixed > 0) {
    console.log('\n✅ 已修复的文件:');
    stats.files.forEach(file => {
      console.log(`  - ${file.file}`);
      console.log(`    备份: ${file.backup}`);
    });
    
    console.log('\n💡 提示: 所有原始文件已备份到 .ui-adapter-backup 目录');
    console.log('如需恢复，可以从备份目录复制文件回来');
  } else {
    console.log('\n✨ 所有文件都已符合UI适配规范！');
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始修复UI适配问题...\n');
  
  // 扫描指定目录
  config.scanDirs.forEach(dir => {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      console.log(`📁 扫描目录: ${dir}`);
      scanDirectory(fullPath, dir);
    }
  });
  
  // 生成报告
  generateReport();
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanDirectory, fixFile, config, stats };

