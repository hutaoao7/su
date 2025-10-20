#!/usr/bin/env node

/**
 * 分包页面适配检查工具
 * 
 * 功能：
 * 1. 检查所有分包页面的UI适配
 * 2. 生成适配报告
 * 3. 提供修复建议
 */

const fs = require('fs');
const path = require('path');

// 分包页面目录
const SUB_PAGES_DIR = 'pages-sub';

// 检查规则
const checkRules = [
  {
    name: 'Safe Area适配',
    check: (content) => {
      const hasFixed = /position\s*:\s*fixed/.test(content);
      const hasSafeArea = /safe-area-inset/.test(content);
      const hasBottom = /bottom\s*:\s*0|padding-bottom/.test(content);
      
      if (hasFixed && hasBottom && !hasSafeArea) {
        return { passed: false, message: '固定定位缺少safe-area-inset适配' };
      }
      return { passed: true };
    }
  },
  {
    name: '触摸区域大小',
    check: (content) => {
      const smallSize = /(?:width|height)\s*:\s*(?:[1-3]\d|[0-9])(?:px|rpx)/.test(content);
      const hasButton = /<button|\.btn|\.icon-btn/.test(content);
      
      if (smallSize && hasButton) {
        return { passed: false, message: '检测到过小的触摸区域' };
      }
      return { passed: true };
    }
  },
  {
    name: '响应式布局',
    check: (content) => {
      const hasComplexLayout = /flex|grid/.test(content);
      const hasMediaQuery = /@media/.test(content);
      const isLarge = content.length > 1000;
      
      if (hasComplexLayout && !hasMediaQuery && isLarge) {
        return { passed: false, message: '复杂布局缺少媒体查询' };
      }
      return { passed: true };
    }
  },
  {
    name: 'rpx单位使用',
    check: (content) => {
      const pxCount = (content.match(/:\s*\d+px\s*[;}]/g) || []).length;
      const rpxCount = (content.match(/:\s*\d+rpx\s*[;}]/g) || []).length;
      
      if (pxCount > 5 && rpxCount === 0) {
        return { passed: false, message: '过多使用px单位，建议使用rpx' };
      }
      return { passed: true };
    }
  },
  {
    name: '字体可读性',
    check: (content) => {
      const smallFont = /font-size\s*:\s*(?:[0-9]|1[0-1])(?:px|rpx)/.test(content);
      
      if (smallFont) {
        return { passed: false, message: '检测到过小的字体' };
      }
      return { passed: true };
    }
  }
];

// 统计
const stats = {
  total: 0,
  passed: 0,
  failed: 0,
  issues: []
};

/**
 * 递归扫描分包目录
 */
function scanSubPages(dir, baseDir = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.join(baseDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanSubPages(filePath, relativePath);
    } else if (stat.isFile() && file.endsWith('.vue')) {
      checkPage(filePath, relativePath);
    }
  });
}

/**
 * 检查页面
 */
function checkPage(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let pageIssues = [];
    
    checkRules.forEach(rule => {
      const result = rule.check(content);
      if (!result.passed) {
        pageIssues.push({
          rule: rule.name,
          message: result.message
        });
      }
    });
    
    stats.total++;
    
    if (pageIssues.length === 0) {
      stats.passed++;
      console.log(`✅ ${relativePath}`);
    } else {
      stats.failed++;
      console.log(`❌ ${relativePath}`);
      pageIssues.forEach(issue => {
        console.log(`   - ${issue.rule}: ${issue.message}`);
      });
      
      stats.issues.push({
        file: relativePath,
        issues: pageIssues
      });
    }
  } catch (error) {
    console.error(`检查失败: ${filePath}`, error.message);
  }
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 分包页面适配检查报告');
  console.log('='.repeat(60));
  console.log(`\n总页面数: ${stats.total}`);
  console.log(`✅ 已适配: ${stats.passed}`);
  console.log(`❌ 待适配: ${stats.failed}`);
  console.log(`适配率: ${((stats.passed / stats.total) * 100).toFixed(1)}%`);
  
  if (stats.issues.length > 0) {
    console.log('\n📋 问题详情:');
    stats.issues.forEach(item => {
      console.log(`\n${item.file}:`);
      item.issues.forEach(issue => {
        console.log(`  - ${issue.rule}: ${issue.message}`);
      });
    });
  }
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始检查分包页面适配...\n');
  
  const fullPath = path.join(process.cwd(), SUB_PAGES_DIR);
  if (fs.existsSync(fullPath)) {
    scanSubPages(fullPath, SUB_PAGES_DIR);
  } else {
    console.log(`⚠️  分包目录不存在: ${SUB_PAGES_DIR}`);
  }
  
  generateReport();
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanSubPages, checkPage, stats };

