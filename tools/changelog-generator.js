#!/usr/bin/env node

/**
 * 变更日志生成工具
 * 
 * 功能：
 * 1. 解析Git commit
 * 2. 按版本分类
 * 3. 生成Markdown格式
 * 4. 自动标签分类
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 配置
const config = {
  outputFile: 'CHANGELOG.md',
  types: {
    feat: '✨ 新功能',
    fix: '🐛 Bug修复',
    docs: '📝 文档',
    style: '💄 样式',
    refactor: '♻️ 重构',
    perf: '⚡ 性能优化',
    test: '✅ 测试',
    chore: '🔧 构建/工具'
  }
};

/**
 * 获取Git commits
 */
function getCommits(since = '') {
  try {
    const cmd = since 
      ? `git log --pretty=format:"%H|%s|%an|%ad" --date=short --since="${since}"`
      : `git log --pretty=format:"%H|%s|%an|%ad" --date=short`;
    
    const output = execSync(cmd, { encoding: 'utf-8' });
    
    return output.split('\n').map(line => {
      const [hash, subject, author, date] = line.split('|');
      return { hash, subject, author, date };
    }).filter(commit => commit.hash);
  } catch (error) {
    console.error('获取Git commits失败:', error.message);
    return [];
  }
}

/**
 * 解析commit类型
 */
function parseCommit(commit) {
  const match = commit.subject.match(/^(\w+)(?:\(([^)]+)\))?: (.+)$/);
  
  if (match) {
    return {
      ...commit,
      type: match[1],
      scope: match[2],
      message: match[3]
    };
  }
  
  return {
    ...commit,
    type: 'chore',
    scope: null,
    message: commit.subject
  };
}

/**
 * 生成CHANGELOG
 */
function generateChangelog() {
  console.log('📝 生成变更日志...\n');
  
  const commits = getCommits();
  const parsed = commits.map(parseCommit);
  
  // 按类型分组
  const grouped = {};
  parsed.forEach(commit => {
    if (!grouped[commit.type]) {
      grouped[commit.type] = [];
    }
    grouped[commit.type].push(commit);
  });
  
  // 生成Markdown
  let markdown = `# 变更日志\n\n`;
  markdown += `生成时间: ${new Date().toLocaleString('zh-CN')}\n\n`;
  markdown += `---\n\n`;
  
  markdown += `## v0.1.0-MVP (${new Date().toISOString().split('T')[0]})\n\n`;
  
  Object.entries(grouped).forEach(([type, commits]) => {
    const typeName = config.types[type] || type;
    markdown += `### ${typeName}\n\n`;
    
    commits.forEach(commit => {
      const scope = commit.scope ? `**${commit.scope}**: ` : '';
      markdown += `- ${scope}${commit.message} (${commit.hash.substring(0, 7)})\n`;
    });
    
    markdown += `\n`;
  });
  
  // 写入文件
  fs.writeFileSync(config.outputFile, markdown, 'utf-8');
  console.log(`✅ 变更日志已生成: ${config.outputFile}\n`);
}

function main() {
  generateChangelog();
}

if (require.main === module) {
  main();
}

module.exports = { generateChangelog };


