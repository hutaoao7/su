/**
 * 分析优化后的包结构
 */

const fs = require('fs');
const path = require('path');

// 读取pages.json
const pagesConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../pages.json'), 'utf-8'));

console.log('====================================');
console.log('优化后的包结构分析');
console.log('====================================\n');

// 主包分析
console.log('【主包内容】');
console.log('-'.repeat(50));
console.log(`主包页面数量：${pagesConfig.pages.length}个\n`);

pagesConfig.pages.forEach((page, index) => {
  console.log(`${index + 1}. ${page.path}`);
  console.log(`   标题：${page.style?.navigationBarTitleText || '未设置'}`);
});

// TabBar分析
console.log('\n\n【TabBar页面】（必须在主包）');
console.log('-'.repeat(50));
const tabBarPages = pagesConfig.tabBar?.list || [];
tabBarPages.forEach((tab, index) => {
  console.log(`${index + 1}. ${tab.pagePath} - ${tab.text}`);
});

// 分包分析
console.log('\n\n【分包结构】');
console.log('-'.repeat(50));

let totalSubPackagePages = 0;
pagesConfig.subPackages?.forEach(sub => {
  console.log(`\n📦 ${sub.name} (${sub.root})`);
  console.log(`   页面数量：${sub.pages.length}个`);
  console.log('   页面列表：');
  sub.pages.forEach((page, index) => {
    console.log(`   ${index + 1}. ${page.path} - ${page.style?.navigationBarTitleText || '未设置'}`);
  });
  totalSubPackagePages += sub.pages.length;
});

// 预加载配置
console.log('\n\n【预加载配置】');
console.log('-'.repeat(50));
Object.entries(pagesConfig.preloadRule || {}).forEach(([page, rule]) => {
  console.log(`\n页面：${page}`);
  console.log(`预加载分包：${rule.packages.join(', ')}`);
});

// 优化配置检查
console.log('\n\n【优化配置检查】');
console.log('-'.repeat(50));

// 检查manifest.json
const manifestPath = path.join(__dirname, '../manifest.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const wxConfig = manifest['mp-weixin'];
  
  console.log('\nJS压缩配置：');
  console.log(`  - ES6转换：${wxConfig?.setting?.es6 ? '✅ 已启用' : '❌ 未启用'}`);
  console.log(`  - PostCSS：${wxConfig?.setting?.postcss ? '✅ 已启用' : '❌ 未启用'}`);
  console.log(`  - 代码压缩：${wxConfig?.setting?.minified ? '✅ 已启用' : '❌ 未启用'}`);
  console.log(`  - 文件名混淆：${wxConfig?.setting?.uglifyFileName ? '✅ 已启用' : '❌ 未启用'}`);
  
  console.log('\n组件加载配置：');
  console.log(`  - 按需加载：${wxConfig?.lazyCodeLoading === 'requiredComponents' ? '✅ 已启用' : '❌ 未启用'}`);
}

// 统计汇总
console.log('\n\n====================================');
console.log('优化效果汇总');
console.log('====================================');

console.log('\n包结构统计：');
console.log(`  - 主包页面：${pagesConfig.pages.length}个`);
console.log(`  - 分包数量：${pagesConfig.subPackages?.length || 0}个`);
console.log(`  - 分包页面总数：${totalSubPackagePages}个`);
console.log(`  - 页面总数：${pagesConfig.pages.length + totalSubPackagePages}个`);

// 优化建议
console.log('\n\n====================================');
console.log('进一步优化建议');
console.log('====================================');

const suggestions = [];

// 检查主包页面数
if (pagesConfig.pages.length > 5) {
  suggestions.push('主包仍有' + pagesConfig.pages.length + '个页面，建议进一步精简');
}

// 检查是否有未配置预加载的分包
const preloadedPackages = new Set();
Object.values(pagesConfig.preloadRule || {}).forEach(rule => {
  rule.packages.forEach(pkg => preloadedPackages.add(pkg));
});

pagesConfig.subPackages?.forEach(sub => {
  if (!preloadedPackages.has(sub.name)) {
    suggestions.push(`分包"${sub.name}"未配置预加载，考虑添加预加载规则`);
  }
});

if (suggestions.length > 0) {
  suggestions.forEach((suggestion, index) => {
    console.log(`${index + 1}. ${suggestion}`);
  });
} else {
  console.log('✅ 当前优化配置良好，暂无进一步建议');
}

console.log('\n\n提示：编译项目后可查看实际包体积变化');
