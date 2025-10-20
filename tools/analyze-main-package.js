/**
 * 分析主包组成
 */

const fs = require('fs');
const path = require('path');

// 读取pages.json
const pagesConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../pages.json'), 'utf-8'));

console.log('====================================');
console.log('主包页面分析');
console.log('====================================\n');

// 统计主包页面
console.log('当前主包页面（共' + pagesConfig.pages.length + '个）：');
console.log('-'.repeat(50));

const mainPages = pagesConfig.pages.map(page => {
  return {
    path: page.path,
    title: page.style?.navigationBarTitleText || '未设置标题'
  };
});

// 分类统计
const categories = {
  core: [],      // 核心页面（必须在主包）
  feature: [],   // 功能页面（可移到分包）
  consent: [],   // 协议页面（可移到分包）
  stress: [],    // 压力检测相关（可移到分包）
  other: []      // 其他页面
};

mainPages.forEach(page => {
  console.log(`📄 ${page.path} - ${page.title}`);
  
  if (page.path.includes('home/home') || 
      page.path.includes('index/index') || 
      page.path.includes('login/login')) {
    categories.core.push(page);
  } else if (page.path.includes('consent/')) {
    categories.consent.push(page);
  } else if (page.path.includes('stress/')) {
    categories.stress.push(page);
  } else if (page.path.includes('features/features') || 
             page.path.includes('community/index')) {
    categories.feature.push(page);
  } else {
    categories.other.push(page);
  }
});

// TabBar页面
console.log('\n\nTabBar页面（必须在主包）：');
console.log('-'.repeat(50));
const tabBarPages = pagesConfig.tabBar?.list || [];
tabBarPages.forEach(tab => {
  console.log(`🏠 ${tab.pagePath} - ${tab.text}`);
});

// 分包情况
console.log('\n\n现有分包：');
console.log('-'.repeat(50));
pagesConfig.subPackages?.forEach(sub => {
  console.log(`📦 ${sub.root} (${sub.name}) - 包含 ${sub.pages.length} 个页面`);
});

// 建议
console.log('\n\n====================================');
console.log('优化建议');
console.log('====================================\n');

console.log('1. 必须保留在主包的页面：');
console.log('   - 启动页：pages/index/index');
console.log('   - 首页：pages/home/home');
console.log('   - 登录页：pages/login/login');
console.log('   - TabBar页面：' + tabBarPages.map(t => t.pagePath).join(', '));

console.log('\n2. 建议移到分包的页面：');
console.log('   - 协议页面（3个）：可移到 pages-sub/consent');
console.log('   - 压力检测页面（5个）：可移到 pages-sub/stress');
console.log('   - 设置页面：可移到 pages-sub/other');
console.log('   - 测试页面：可移到 pages-sub/other');

console.log('\n3. 预计优化效果：');
console.log('   - 主包页面数：从 17 个减少到 5-6 个');
console.log('   - 预计减少主包大小：40-50%');

// 检查静态资源
console.log('\n\n====================================');
console.log('静态资源分析');
console.log('====================================\n');

const checkDirectory = (dir, extensions) => {
  const results = [];
  
  function walk(currentPath) {
    if (!fs.existsSync(currentPath)) return;
    
    const files = fs.readdirSync(currentPath);
    files.forEach(file => {
      const filePath = path.join(currentPath, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walk(filePath);
      } else if (extensions.some(ext => file.endsWith(ext))) {
        results.push({
          path: filePath.replace(path.join(__dirname, '..'), ''),
          size: stat.size
        });
      }
    });
  }
  
  walk(dir);
  return results;
};

// 检查图片
const images = checkDirectory(path.join(__dirname, '../static/images'), ['.png', '.jpg', '.jpeg']);
console.log('图片文件：');
images.sort((a, b) => b.size - a.size).forEach(img => {
  const sizeKB = (img.size / 1024).toFixed(2);
  console.log(`  ${img.path} - ${sizeKB} KB`);
});

// 检查JSON数据文件
const jsonFiles = checkDirectory(path.join(__dirname, '../static'), ['.json']);
console.log('\n\nJSON数据文件：');
let totalJsonSize = 0;
jsonFiles.sort((a, b) => b.size - a.size).forEach(json => {
  const sizeKB = (json.size / 1024).toFixed(2);
  totalJsonSize += json.size;
  console.log(`  ${json.path} - ${sizeKB} KB`);
});
console.log(`JSON文件总大小：${(totalJsonSize / 1024).toFixed(2)} KB`);

// 总结
console.log('\n\n====================================');
console.log('优化优先级');
console.log('====================================');
console.log('1. 【高】移动非核心页面到分包（可减少50%+主包页面）');
console.log('2. 【中】压缩图片文件');
console.log('3. 【中】延迟加载JSON数据文件');
console.log('4. 【低】优化第三方库引入');
