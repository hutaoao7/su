#!/usr/bin/env node

/**
 * 组件库适配检查工具
 * 
 * 功能：
 * 1. 检查所有组件的UI适配
 * 2. 生成适配报告
 * 3. 提供修复建议
 */

const fs = require('fs');
const path = require('path');

// 组件目录
const COMPONENTS_DIR = 'components';

// 检查规则
const checkRules = [
  {
    name: '响应式设计',
    check: (content) => {
      const hasFixedSize = /width\s*:\s*\d+(?:px|rpx)|height\s*:\s*\d+(?:px|rpx)/.test(content);
      const hasFlexible = /flex|%|auto/.test(content);
      
      if (hasFixedSize && !hasFlexible) {
        return { passed: false, message: '组件使用固定尺寸，缺少灵活性' };
      }
      return { passed: true };
    }
  },
  {
    name: '触摸区域大小',
    check: (content) => {
      const smallSize = /(?:width|height)\s*:\s*(?:[1-3]\d|[0-9])(?:px|rpx)/.test(content);
      const isInteractive = /button|checkbox|radio|input|select/.test(content);
      
      if (smallSize && isInteractive) {
        return { passed: false, message: '交互组件的触摸区域过小' };
      }
      return { passed: true };
    }
  },
  {
    name: '文本可读性',
    check: (content) => {
      const smallFont = /font-size\s*:\s*(?:[0-9]|1[0-1])(?:px|rpx)/.test(content);
      const hasText = /<text|<span|<p|<label/.test(content);
      
      if (smallFont && hasText) {
        return { passed: false, message: '文本字体过小，影响可读性' };
      }
      return { passed: true };
    }
  },
  {
    name: '颜色对比度',
    check: (content) => {
      // 简单检测浅色背景+浅色文字
      const lightBg = /background(?:-color)?\s*:\s*#(?:[fF]{2}[a-fA-F0-9]{4}|[fF]{3})/.test(content);
      const lightText = /color\s*:\s*#(?:[cdefCDEF]{2}[a-fA-F0-9]{4}|[cdefCDEF]{3})/.test(content);
      
      if (lightBg && lightText) {
        return { passed: false, message: '颜色对比度不足，影响可读性' };
      }
      return { passed: true };
    }
  },
  {
    name: 'Safe Area适配',
    check: (content) => {
      const hasFixed = /position\s*:\s*fixed/.test(content);
      const hasSafeArea = /safe-area-inset/.test(content);
      
      if (hasFixed && !hasSafeArea) {
        return { passed: false, message: '固定定位组件缺少safe-area-inset适配' };
      }
      return { passed: true };
    }
  },
  {
    name: '无障碍支持',
    check: (content) => {
      const hasAriaLabel = /aria-label|role=/.test(content);
      const isInteractive = /button|input|select|checkbox/.test(content);
      
      if (isInteractive && !hasAriaLabel) {
        return { passed: false, message: '交互组件缺少无障碍标签' };
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
 * 递归扫描组件目录
 */
function scanComponents(dir, baseDir = '') {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const relativePath = path.join(baseDir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanComponents(filePath, relativePath);
    } else if (stat.isFile() && file.endsWith('.vue')) {
      checkComponent(filePath, relativePath);
    }
  });
}

/**
 * 检查组件
 */
function checkComponent(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    let componentIssues = [];
    
    checkRules.forEach(rule => {
      const result = rule.check(content);
      if (!result.passed) {
        componentIssues.push({
          rule: rule.name,
          message: result.message
        });
      }
    });
    
    stats.total++;
    
    if (componentIssues.length === 0) {
      stats.passed++;
      console.log(`✅ ${relativePath}`);
    } else {
      stats.failed++;
      console.log(`❌ ${relativePath}`);
      componentIssues.forEach(issue => {
        console.log(`   - ${issue.rule}: ${issue.message}`);
      });
      
      stats.issues.push({
        file: relativePath,
        issues: componentIssues
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
  console.log('📊 组件库适配检查报告');
  console.log('='.repeat(60));
  console.log(`\n总组件数: ${stats.total}`);
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
  console.log('🚀 开始检查组件库适配...\n');
  
  const fullPath = path.join(process.cwd(), COMPONENTS_DIR);
  if (fs.existsSync(fullPath)) {
    scanComponents(fullPath, COMPONENTS_DIR);
  } else {
    console.log(`⚠️  组件目录不存在: ${COMPONENTS_DIR}`);
  }
  
  generateReport();
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanComponents, checkComponent, stats };

