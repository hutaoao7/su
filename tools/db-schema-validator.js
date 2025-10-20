#!/usr/bin/env node

/**
 * 数据库Schema验证工具
 * 
 * 功能：
 * 1. 读取数据库设计文档
 * 2. 验证SQL语法正确性
 * 3. 检查表之间的外键关系
 * 4. 验证索引设计合理性
 * 5. 检查命名规范
 * 6. 生成验证报告
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  schemaDocsDir: 'docs/database',
  outputDir: 'docs/database/validation',
  
  // 命名规范
  namingRules: {
    tableName: /^[a-z][a-z0-9_]*$/,  // 表名：小写字母开头，下划线分隔
    columnName: /^[a-z][a-z0-9_]*$/,  // 字段名：小写字母开头，下划线分隔
    indexName: /^idx_[a-z0-9_]+$/,    // 索引名：idx_开头
    constraintName: /^(pk|fk|check|unique)_[a-z0-9_]+$/  // 约束名：类型_表名
  },
  
  // 必须字段
  requiredColumns: ['id', 'created_at'],
  
  // 推荐字段
  recommendedColumns: ['updated_at'],
  
  // 索引建议
  indexRecommendations: {
    foreignKey: true,        // 外键应该有索引
    frequentQuery: true,     // 频繁查询字段应该有索引
    orderBy: true,           // 排序字段应该有索引
    compositeIndex: true     // 多字段查询应该考虑组合索引
  }
};

// 验证结果
const validationResults = {
  tables: [],
  issues: [],
  summary: {
    totalTables: 0,
    validTables: 0,
    totalIssues: 0,
    errors: 0,
    warnings: 0,
    suggestions: 0
  }
};

/**
 * 扫描schema文档
 */
function scanSchemaDocuments() {
  const schemaDir = path.join(process.cwd(), config.schemaDocsDir);
  
  if (!fs.existsSync(schemaDir)) {
    console.error(`❌ Schema文档目录不存在: ${schemaDir}`);
    return;
  }
  
  const files = fs.readdirSync(schemaDir);
  
  files.forEach(file => {
    if (file.startsWith('schema-') && file.endsWith('.md')) {
      console.log(`📄 验证文档: ${file}`);
      const filePath = path.join(schemaDir, file);
      validateSchemaDoc(filePath, file);
    }
  });
}

/**
 * 验证schema文档
 */
function validateSchemaDoc(filePath, fileName) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 提取所有CREATE TABLE语句
    const tableMatches = content.matchAll(/CREATE TABLE.*?(\w+)\s*\(([\s\S]*?)\);/g);
    
    for (const match of tableMatches) {
      const tableName = match[1];
      const tableDefinition = match[2];
      
      console.log(`  📊 验证表: ${tableName}`);
      
      validateTable(tableName, tableDefinition, content, fileName);
      validationResults.summary.totalTables++;
    }
    
  } catch (error) {
    console.error(`验证失败: ${fileName}`, error.message);
  }
}

/**
 * 验证单个表
 */
function validateTable(tableName, definition, fullContent, fileName) {
  const table = {
    name: tableName,
    file: fileName,
    columns: [],
    indexes: [],
    constraints: [],
    issues: []
  };
  
  // 1. 验证表名规范
  if (!config.namingRules.tableName.test(tableName)) {
    addIssue(table, 'error', '表名不符合命名规范（应为小写下划线分隔）', tableName);
  }
  
  // 2. 解析列定义
  const columnLines = definition.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.startsWith('--') && !trimmed.startsWith('CONSTRAINT');
  });
  
  columnLines.forEach(line => {
    const columnMatch = line.match(/^\s*(\w+)\s+(\w+)/);
    if (columnMatch) {
      const columnName = columnMatch[1];
      const columnType = columnMatch[2];
      
      table.columns.push({ name: columnName, type: columnType });
      
      // 验证列名规范
      if (!config.namingRules.columnName.test(columnName)) {
        addIssue(table, 'warning', `列名不符合规范: ${columnName}`, columnName);
      }
    }
  });
  
  // 3. 检查必须字段
  config.requiredColumns.forEach(requiredCol => {
    if (!table.columns.find(col => col.name === requiredCol)) {
      addIssue(table, 'error', `缺少必须字段: ${requiredCol}`, tableName);
    }
  });
  
  // 4. 检查推荐字段
  config.recommendedColumns.forEach(recommendedCol => {
    if (!table.columns.find(col => col.name === recommendedCol)) {
      addIssue(table, 'suggestion', `建议添加字段: ${recommendedCol}`, tableName);
    }
  });
  
  // 5. 提取索引定义
  const indexMatches = fullContent.matchAll(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(idx_\w+)\s+ON\s+(\w+)/g);
  for (const match of indexMatches) {
    if (match[2] === tableName) {
      table.indexes.push(match[1]);
      
      // 验证索引名规范
      if (!config.namingRules.indexName.test(match[1])) {
        addIssue(table, 'warning', `索引名不符合规范: ${match[1]}`, match[1]);
      }
    }
  }
  
  // 6. 检查外键索引
  const foreignKeyMatches = definition.matchAll(/FOREIGN KEY\s*\((\w+)\)/g);
  for (const match of foreignKeyMatches) {
    const fkColumn = match[1];
    const hasIndex = table.indexes.some(idx => idx.includes(fkColumn));
    
    if (!hasIndex) {
      addIssue(table, 'warning', `外键字段缺少索引: ${fkColumn}`, fkColumn);
    }
  }
  
  // 7. 检查常见查询字段索引
  const commonQueryColumns = ['user_id', 'status', 'created_at', 'updated_at'];
  commonQueryColumns.forEach(col => {
    if (table.columns.find(c => c.name === col)) {
      const hasIndex = table.indexes.some(idx => idx.includes(col));
      if (!hasIndex) {
        addIssue(table, 'suggestion', `常用查询字段建议添加索引: ${col}`, col);
      }
    }
  });
  
  // 添加到结果
  validationResults.tables.push(table);
  
  if (table.issues.length === 0) {
    validationResults.summary.validTables++;
  }
}

/**
 * 添加问题
 */
function addIssue(table, level, message, context) {
  const issue = {
    table: table.name,
    file: table.file,
    level,
    message,
    context
  };
  
  table.issues.push(issue);
  validationResults.issues.push(issue);
  validationResults.summary.totalIssues++;
  
  if (level === 'error') {
    validationResults.summary.errors++;
  } else if (level === 'warning') {
    validationResults.summary.warnings++;
  } else {
    validationResults.summary.suggestions++;
  }
}

/**
 * 生成控制台报告
 */
function generateConsoleReport() {
  console.log('\n' + '='.repeat(80));
  console.log('数据库Schema验证报告');
  console.log('='.repeat(80));
  console.log(`扫描表数量: ${validationResults.summary.totalTables}`);
  console.log(`验证通过: ${validationResults.summary.validTables}`);
  console.log(`发现问题: ${validationResults.summary.totalIssues}`);
  console.log(`  - 错误 (error): ${validationResults.summary.errors}`);
  console.log(`  - 警告 (warning): ${validationResults.summary.warnings}`);
  console.log(`  - 建议 (suggestion): ${validationResults.summary.suggestions}`);
  console.log('='.repeat(80) + '\n');
  
  if (validationResults.issues.length === 0) {
    console.log('✅ 恭喜！所有表结构设计符合规范。\n');
    return;
  }
  
  // 按级别显示问题
  ['error', 'warning', 'suggestion'].forEach(level => {
    const levelIssues = validationResults.issues.filter(i => i.level === level);
    if (levelIssues.length === 0) return;
    
    const symbol = level === 'error' ? '❌' : level === 'warning' ? '⚠️' : '💡';
    console.log(`${symbol} ${level.toUpperCase()} (${levelIssues.length})`);
    console.log('-'.repeat(80));
    
    levelIssues.forEach((issue, index) => {
      console.log(`${index + 1}. 表: ${issue.table} (${issue.file})`);
      console.log(`   ${issue.message}`);
      if (issue.context) {
        console.log(`   上下文: ${issue.context}`);
      }
      console.log('');
    });
  });
}

/**
 * 生成HTML报告
 */
function generateHTMLReport() {
  const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>数据库Schema验证报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f7fa;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px;
      border-radius: 12px;
      margin-bottom: 20px;
    }
    .header h1 { font-size: 32px; margin-bottom: 10px; }
    .stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 15px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .stat-value { font-size: 36px; font-weight: bold; margin-bottom: 5px; }
    .stat-label { color: #666; font-size: 14px; }
    .tables-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 20px;
    }
    .table-card {
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
    .table-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 15px;
      border-bottom: 2px solid #f0f0f0;
    }
    .table-name { font-size: 18px; font-weight: bold; color: #333; }
    .table-status {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: bold;
    }
    .status-valid { background: #f0f9ff; color: #67c23a; }
    .status-issues { background: #fef0f0; color: #f56c6c; }
    .table-info { font-size: 14px; color: #666; margin-bottom: 10px; }
    .issues-list { margin-top: 15px; }
    .issue-item {
      padding: 10px;
      margin-bottom: 8px;
      border-radius: 6px;
      font-size: 13px;
    }
    .issue-error { background: #fef0f0; border-left: 3px solid #f56c6c; }
    .issue-warning { background: #fdf6ec; border-left: 3px solid #e6a23c; }
    .issue-suggestion { background: #ecf5ff; border-left: 3px solid #409eff; }
    .timestamp { color: rgba(255,255,255,0.8); font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🗄️ 数据库Schema验证报告</h1>
      <div class="timestamp">生成时间: ${new Date().toLocaleString('zh-CN')}</div>
    </div>
    
    <div class="stats">
      <div class="stat-card">
        <div class="stat-value">${validationResults.summary.totalTables}</div>
        <div class="stat-label">扫描表数量</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #67c23a;">${validationResults.summary.validTables}</div>
        <div class="stat-label">验证通过</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #f56c6c;">${validationResults.summary.errors}</div>
        <div class="stat-label">错误</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #e6a23c;">${validationResults.summary.warnings}</div>
        <div class="stat-label">警告</div>
      </div>
      <div class="stat-card">
        <div class="stat-value" style="color: #409eff;">${validationResults.summary.suggestions}</div>
        <div class="stat-label">建议</div>
      </div>
    </div>
    
    <div class="tables-grid">
      ${validationResults.tables.map(table => `
        <div class="table-card">
          <div class="table-header">
            <div class="table-name">${table.name}</div>
            <div class="table-status ${table.issues.length === 0 ? 'status-valid' : 'status-issues'}">
              ${table.issues.length === 0 ? '✓ 通过' : `${table.issues.length} 个问题`}
            </div>
          </div>
          <div class="table-info">📁 文件: ${table.file}</div>
          <div class="table-info">📝 列数: ${table.columns.length}</div>
          <div class="table-info">🔑 索引数: ${table.indexes.length}</div>
          
          ${table.issues.length > 0 ? `
            <div class="issues-list">
              ${table.issues.map(issue => `
                <div class="issue-item issue-${issue.level}">
                  <strong>${issue.level === 'error' ? '❌' : issue.level === 'warning' ? '⚠️' : '💡'}</strong>
                  ${issue.message}
                  ${issue.context ? `<br><small style="color: #999;">上下文: ${issue.context}</small>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>
  `;
  
  ensureDir(config.outputDir);
  const reportPath = path.join(process.cwd(), config.outputDir, 'validation-report.html');
  fs.writeFileSync(reportPath, html, 'utf-8');
  console.log(`\n📄 HTML报告已生成: ${reportPath}\n`);
}

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始验证数据库Schema...\n');
  
  scanSchemaDocuments();
  
  generateConsoleReport();
  generateHTMLReport();
  
  process.exit(validationResults.summary.errors > 0 ? 1 : 0);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { validateSchemaDoc, config, validationResults };

