/**
 * 分包路径验证脚本
 * 用于验证所有页面路径是否正确配置
 */

const fs = require('fs');
const path = require('path');

// 读取pages.json配置
const pagesConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../pages.json'), 'utf-8'));

// 收集所有有效路径
const validPaths = new Set();

// 收集主包页面
pagesConfig.pages?.forEach(page => {
  validPaths.add('/' + page.path);
});

// 收集分包页面
pagesConfig.subPackages?.forEach(subPackage => {
  subPackage.pages?.forEach(page => {
    validPaths.add(`/${subPackage.root}/${page.path}`);
  });
});

// 需要验证的文件列表
const filesToCheck = [
  'pages/features/features.vue',
  'pages/user/home.vue',
  'pages/home/home.vue',
  'pages/index/index.vue',
  'pages/settings/settings.vue',
  'common/features.js'
];

// 路径模式匹配
const pathPatterns = [
  /navigateTo\s*\(\s*['"`]([^'"`]+)['"`]/g,
  /url\s*:\s*['"`]([^'"`]+)['"`]/g,
  /route\s*:\s*['"`]([^'"`]+)['"`]/g,
  /navigateTo\s*\(\s*{\s*url\s*:\s*['"`]([^'"`]+)['"`]/g
];

console.log('====================================');
console.log('分包路径验证报告');
console.log('====================================\n');

console.log('有效路径列表:');
console.log('-'.repeat(50));
validPaths.forEach(p => console.log(`✅ ${p}`));
console.log('\n');

let totalErrors = 0;
let totalWarnings = 0;

// 检查每个文件
filesToCheck.forEach(filePath => {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  文件不存在: ${filePath}`);
    totalWarnings++;
    return;
  }
  
  const content = fs.readFileSync(fullPath, 'utf-8');
  const errors = [];
  const foundPaths = new Set();
  
  // 使用所有模式匹配路径
  pathPatterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern);
    while ((match = regex.exec(content)) !== null) {
      const extractedPath = match[1];
      if (extractedPath && extractedPath.startsWith('/')) {
        foundPaths.add(extractedPath);
      }
    }
  });
  
  // 验证找到的路径
  foundPaths.forEach(foundPath => {
    // 跳过一些特殊路径
    if (foundPath.includes('$') || foundPath.includes('{')) {
      return;
    }
    
    // 处理带查询参数的路径
    const pathWithoutQuery = foundPath.split('?')[0];
    
    // 检查是否是有效路径
    if (!validPaths.has(pathWithoutQuery)) {
      // 检查是否是主包路径（不在分包中的页面）
      const mainPagePath = pathWithoutQuery.replace('/pages/', '');
      const isMainPage = pagesConfig.pages?.some(p => p.path === `pages/${mainPagePath}`);
      
      if (!isMainPage) {
        errors.push({
          path: foundPath,
          line: getLineNumber(content, foundPath)
        });
      }
    }
  });
  
  // 输出结果
  if (errors.length > 0) {
    console.log(`❌ ${filePath}`);
    console.log('-'.repeat(50));
    errors.forEach(error => {
      console.log(`  错误路径: ${error.path} (行 ${error.line})`);
      totalErrors++;
    });
    console.log('');
  } else if (foundPaths.size > 0) {
    console.log(`✅ ${filePath} - 所有路径正确`);
  }
});

// 获取行号
function getLineNumber(content, searchStr) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(searchStr)) {
      return i + 1;
    }
  }
  return -1;
}

console.log('\n====================================');
console.log('验证结果汇总');
console.log('====================================');
console.log(`✅ 有效路径数: ${validPaths.size}`);
console.log(`❌ 错误数: ${totalErrors}`);
console.log(`⚠️  警告数: ${totalWarnings}`);

if (totalErrors === 0) {
  console.log('\n🎉 所有路径验证通过！');
} else {
  console.log('\n⚠️  发现路径配置错误，请检查并修复。');
}

// 输出修复建议
if (totalErrors > 0) {
  console.log('\n修复建议:');
  console.log('-'.repeat(50));
  console.log('1. 检查pages.json中的分包配置');
  console.log('2. 确保使用正确的分包路径格式: /pages-sub/[分包名]/[页面路径]');
  console.log('3. 主包页面使用: /pages/[页面路径]');
}

process.exit(totalErrors > 0 ? 1 : 0);
