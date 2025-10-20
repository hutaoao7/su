#!/usr/bin/env node

/**
 * 发布检查清单生成工具
 * 
 * 功能：
 * 1. 生成发布前检查清单
 * 2. 自动检查项目状态
 * 3. 生成发布报告
 */

const fs = require('fs');
const { execSync } = require('child_process');

// 检查项
const checklist = [
  {
    id: 'git-status',
    name: '检查Git状态',
    check: () => {
      try {
        const status = execSync('git status --porcelain', { encoding: 'utf-8' });
        return { passed: !status.trim(), message: status.trim() ? '有未提交的更改' : '工作区干净' };
      } catch (error) {
        return { passed: false, message: '检查失败' };
      }
    }
  },
  {
    id: 'package-version',
    name: '检查版本号',
    check: () => {
      try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
        return { passed: !!pkg.version, message: `当前版本: ${pkg.version}` };
      } catch (error) {
        return { passed: false, message: '读取package.json失败' };
      }
    }
  },
  {
    id: 'lint',
    name: 'ESLint检查',
    check: () => {
      try {
        execSync('npm run lint', { encoding: 'utf-8', stdio: 'pipe' });
        return { passed: true, message: '代码规范检查通过' };
      } catch (error) {
        return { passed: false, message: '存在代码规范问题' };
      }
    }
  },
  {
    id: 'test',
    name: '运行测试',
    check: () => {
      try {
        execSync('npm test', { encoding: 'utf-8', stdio: 'pipe' });
        return { passed: true, message: '所有测试通过' };
      } catch (error) {
        return { passed: false, message: '测试未通过' };
      }
    }
  }
];

/**
 * 运行检查清单
 */
function runChecklist() {
  console.log('\n' + '='.repeat(80));
  console.log('发布前检查清单');
  console.log('='.repeat(80) + '\n');
  
  const results = [];
  
  checklist.forEach((item, index) => {
    console.log(`[${index + 1}/${checklist.length}] ${item.name}...`);
    
    const result = item.check();
    results.push({
      ...item,
      result
    });
    
    const status = result.passed ? '✅' : '❌';
    console.log(`  ${status} ${result.message}\n`);
  });
  
  // 汇总
  const passedCount = results.filter(r => r.result.passed).length;
  const totalCount = results.length;
  
  console.log('='.repeat(80));
  console.log(`检查完成: ${passedCount}/${totalCount} 项通过`);
  console.log('='.repeat(80) + '\n');
  
  if (passedCount === totalCount) {
    console.log('✅ 所有检查通过，可以发布！\n');
  } else {
    console.log('❌ 存在未通过的检查项，请修复后再发布。\n');
  }
  
  // 生成报告
  generateReport(results);
  
  return passedCount === totalCount;
}

/**
 * 生成报告
 */
function generateReport(results) {
  let markdown = `# 发布检查报告\n\n`;
  markdown += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  
  markdown += `## 检查结果\n\n`;
  
  results.forEach((item, index) => {
    const status = item.result.passed ? '✅' : '❌';
    markdown += `${index + 1}. ${status} ${item.name}\n`;
    markdown += `   ${item.result.message}\n\n`;
  });
  
  const passedCount = results.filter(r => r.result.passed).length;
  markdown += `\n**总计**: ${passedCount}/${results.length} 项通过\n`;
  
  fs.writeFileSync('release-checklist.md', markdown, 'utf-8');
  console.log('📄 报告已生成: release-checklist.md\n');
}

function main() {
  const allPassed = runChecklist();
  process.exit(allPassed ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { runChecklist };


