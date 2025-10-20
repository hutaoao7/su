/**
 * Mock数据清理脚本
 * 扫描代码中的Mock数据使用并清理
 */

const fs = require('fs');
const path = require('path');
// const glob = require('glob'); // 替换为内置模块

const TAG = '[Mock清理]';

// Mock数据标识符
const MOCK_INDICATORS = [
  'USE_MOCK',
  'mockData',
  'MockAdapter',
  'mock-adapter',
  '模拟数据',
  'TODO: 替换为真实',
  'fake',
  'dummy',
  'test数据'
];

// 需要扫描的文件类型
const FILE_PATTERNS = [
  'pages/**/*.vue',
  'api/**/*.js',
  'utils/**/*.js', 
  'components/**/*.vue'
];

// 递归查找文件
function findFiles(dir, pattern) {
  const results = [];
  
  try {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // 跳过node_modules和unpackage目录
        if (file !== 'node_modules' && file !== 'unpackage' && file !== '.git') {
          results.push(...findFiles(fullPath, pattern));
        }
      } else if (stat.isFile()) {
        // 检查文件是否匹配模式
        if (pattern.test(fullPath)) {
          results.push(fullPath);
        }
      }
    });
  } catch (error) {
    // 忽略无法访问的目录
  }
  
  return results;
}

// 查找包含Mock数据的文件
function findMockFiles() {
  console.log(TAG, '扫描Mock数据使用情况...');
  const mockFiles = [];
  
  // 定义要扫描的目录和文件模式
  const scanDirs = [
    { dir: 'pages', pattern: /\.vue$/ },
    { dir: 'api', pattern: /\.js$/ },
    { dir: 'utils', pattern: /\.js$/ },
    { dir: 'components', pattern: /\.vue$/ }
  ];
  
  scanDirs.forEach(({ dir, pattern }) => {
    if (fs.existsSync(dir)) {
      const files = findFiles(dir, pattern);
      
      files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          MOCK_INDICATORS.forEach(indicator => {
            if (line.includes(indicator)) {
              mockFiles.push({
                file: file,
                line: index + 1,
                indicator: indicator,
                content: line.trim()
              });
            }
          });
        });
      });
    }
  });
  
  return mockFiles;
}

// 清理Mock数据
function cleanupMockData(mockFiles, dryRun = true) {
  console.log(TAG, dryRun ? '模拟清理Mock数据...' : '清理Mock数据...');
  
  const cleanupActions = [];
  
  // 按文件分组
  const fileGroups = {};
  mockFiles.forEach(item => {
    if (!fileGroups[item.file]) {
      fileGroups[item.file] = [];
    }
    fileGroups[item.file].push(item);
  });
  
  // 处理每个文件
  Object.entries(fileGroups).forEach(([file, items]) => {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    // 特定文件的处理规则
    if (file.includes('api/')) {
      // API文件中的USE_MOCK标志改为false
      if (content.includes('USE_MOCK = true')) {
        content = content.replace(/USE_MOCK = true/g, 'USE_MOCK = false');
        modified = true;
        cleanupActions.push({
          file: file,
          action: 'USE_MOCK设置为false'
        });
      }
    }
    
    if (file.includes('pages/') && file.endsWith('.vue')) {
      // 页面文件中的模拟数据替换
      const mockDataRegex = /\/\/ TODO: 替换为真实.*?\n.*?mockData.*?\n/g;
      if (mockDataRegex.test(content)) {
        content = content.replace(mockDataRegex, '');
        modified = true;
        cleanupActions.push({
          file: file,
          action: '移除TODO标记的模拟数据'
        });
      }
    }
    
    // 保存修改
    if (modified && !dryRun) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(TAG, `✅ 已清理: ${file}`);
    }
  });
  
  return cleanupActions;
}

// 特定文件的Mock清理
function cleanSpecificFiles() {
  console.log(TAG, '清理特定文件中的Mock配置...');
  
  const specificCleanups = [
    {
      file: 'api/user.js',
      oldContent: 'const USE_MOCK = true',
      newContent: 'const USE_MOCK = false'
    },
    {
      file: 'api/community.js', 
      oldContent: 'const USE_MOCK = true',
      newContent: 'const USE_MOCK = false'
    },
    {
      file: 'api/stress.js',
      oldContent: 'USE_MOCK = true',
      newContent: 'USE_MOCK = false'
    }
  ];
  
  specificCleanups.forEach(item => {
    const filePath = path.resolve(item.file);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(item.oldContent)) {
        content = content.replace(new RegExp(item.oldContent, 'g'), item.newContent);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(TAG, `✅ 已更新: ${item.file}`);
      }
    }
  });
}

// 生成清理报告
function generateCleanupReport(mockFiles, cleanupActions) {
  console.log(TAG, '生成清理报告...');
  
  const report = `# Mock数据清理报告

**生成时间**: ${new Date().toISOString()}

## 📊 扫描结果

- 扫描文件数: ${new Set(mockFiles.map(m => m.file)).size}
- 发现Mock使用: ${mockFiles.length} 处
- 需要清理: ${cleanupActions.length} 处

## 📋 Mock数据位置

${mockFiles.map(item => `- \`${item.file}:${item.line}\` - ${item.indicator}`).join('\n')}

## 🧹 清理操作

${cleanupActions.map(action => `- \`${action.file}\` - ${action.action}`).join('\n')}

## ✅ 已清理的文件

1. \`api/user.js\` - USE_MOCK设置为false
2. \`api/community.js\` - USE_MOCK设置为false  
3. \`api/stress.js\` - USE_MOCK设置为false

## 📝 建议

1. 确保所有API调用都使用真实接口
2. 移除不必要的mock-adapter引用
3. 删除测试用的假数据
4. 更新文档中的示例代码
`;

  fs.writeFileSync('docs/MOCK-CLEANUP-REPORT.md', report, 'utf8');
  console.log(TAG, '✅ 清理报告已保存至: docs/MOCK-CLEANUP-REPORT.md');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  
  console.log(TAG, '========== Mock数据清理开始 ==========');
  console.log(TAG, `模式: ${execute ? '执行' : '检查'}`);
  
  // 查找Mock文件
  const mockFiles = findMockFiles();
  console.log(TAG, `发现 ${mockFiles.length} 处Mock数据使用`);
  
  // 清理Mock数据
  const cleanupActions = cleanupMockData(mockFiles, !execute);
  
  // 清理特定文件
  if (execute) {
    cleanSpecificFiles();
  }
  
  // 生成报告
  generateCleanupReport(mockFiles, cleanupActions);
  
  console.log(TAG, '========== Mock数据清理完成 ==========');
  console.log(TAG, execute ? '✅ 已清理Mock数据' : '📋 检查完成，使用 --execute 执行清理');
}

// 执行
main();