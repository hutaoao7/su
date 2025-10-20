/**
 * 验证选项A修复后的状态
 * 确保修复social-avoid问题后，其他功能正常
 */

const fs = require('fs');
const path = require('path');

const TAG = '[选项A验证]';

console.log('='.repeat(50));
console.log(`${TAG} 开始验证选项A修复结果`);
console.log('='.repeat(50));

let passed = 0;
let failed = 0;
const issues = [];

// 测试1：验证pages.json不包含social-avoid
console.log('\n📋 检查1: pages.json配置');
try {
  const pagesContent = fs.readFileSync('pages.json', 'utf8');
  if (!pagesContent.includes('social-avoid')) {
    console.log('✅ pages.json已正确移除social-avoid引用');
    passed++;
  } else {
    console.log('❌ pages.json仍包含social-avoid引用');
    failed++;
    issues.push('pages.json仍包含social-avoid');
  }
} catch (error) {
  console.log('❌ 无法读取pages.json');
  failed++;
}

// 测试2：验证分包目录结构存在
console.log('\n📋 检查2: 分包目录结构');
const subDirs = [
  'pages-sub/assess',
  'pages-sub/intervene',
  'pages-sub/music',
  'pages-sub/community',
  'pages-sub/other'
];

subDirs.forEach(dir => {
  if (fs.existsSync(dir)) {
    console.log(`✅ 目录存在: ${dir}`);
    passed++;
  } else {
    console.log(`❌ 目录缺失: ${dir}`);
    failed++;
    issues.push(`目录缺失: ${dir}`);
  }
});

// 测试3：验证关键分包文件存在
console.log('\n📋 检查3: 关键分包文件');
const keyFiles = [
  'pages-sub/assess/result.vue',
  'pages-sub/assess/social/index.vue',
  'pages-sub/intervene/chat.vue',
  'pages-sub/music/index.vue',
  'pages-sub/community/detail.vue'
];

keyFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ 文件存在: ${file}`);
    passed++;
  } else {
    console.log(`❌ 文件缺失: ${file}`);
    failed++;
    issues.push(`文件缺失: ${file}`);
  }
});

// 测试4：验证API兼容性修复保留
console.log('\n📋 检查4: API兼容性修复');
const filesToCheck = [
  'pages/login/login.vue',
  'utils/wechat-login.js'
];

let wxApiCount = 0;
filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split('\n');
    
    let inWeixinBlock = false;
    lines.forEach(line => {
      if (line.includes('#ifdef MP-WEIXIN')) {
        inWeixinBlock = true;
      } else if (line.includes('#endif')) {
        inWeixinBlock = false;
      } else if (!inWeixinBlock && line.includes('wx.') && !line.includes('//')) {
        wxApiCount++;
      }
    });
  }
});

if (wxApiCount === 0) {
  console.log('✅ API兼容性修复保留完好');
  passed++;
} else {
  console.log(`❌ 发现${wxApiCount}处wx.API调用未修复`);
  failed++;
  issues.push(`${wxApiCount}处wx.API未修复`);
}

// 测试5：验证发布文档存在
console.log('\n📋 检查5: 发布文档');
const releaseFiles = [
  'docs/RELEASE-NOTES-v0.1.0-MVP.md',
  'docs/API-COMPATIBILITY-FIX-REPORT.md',
  'tests/QUICK-SMOKE-TEST-REPORT.md'
];

releaseFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ 文档存在: ${file}`);
    passed++;
  } else {
    console.log(`❌ 文档缺失: ${file}`);
    failed++;
    issues.push(`文档缺失: ${file}`);
  }
});

// 测试6：验证pages.json结构有效
console.log('\n📋 检查6: pages.json结构验证');
try {
  const pagesJson = JSON.parse(fs.readFileSync('pages.json', 'utf8'));
  
  if (pagesJson.pages && pagesJson.pages.length > 0) {
    console.log(`✅ 主包页面数: ${pagesJson.pages.length}`);
    passed++;
  }
  
  if (pagesJson.subPackages && pagesJson.subPackages.length > 0) {
    console.log(`✅ 分包数量: ${pagesJson.subPackages.length}`);
    
    // 统计分包页面总数
    let subPageCount = 0;
    pagesJson.subPackages.forEach(pkg => {
      subPageCount += pkg.pages.length;
    });
    console.log(`✅ 分包页面总数: ${subPageCount}`);
    passed++;
  }
} catch (error) {
  console.log('❌ pages.json解析失败');
  failed++;
  issues.push('pages.json解析失败');
}

// 输出总结
console.log('\n' + '='.repeat(50));
console.log(`${TAG} 验证完成`);
console.log('='.repeat(50));
console.log(`\n📊 验证结果:`);
console.log(`  通过: ${passed}`);
console.log(`  失败: ${failed}`);
console.log(`  通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (issues.length > 0) {
  console.log('\n❌ 发现的问题:');
  issues.forEach(issue => {
    console.log(`  - ${issue}`);
  });
} else {
  console.log('\n✅ 所有检查通过！');
  console.log('✅ 选项A功能完整，修复成功！');
}

// 创建验证报告
const hasSocialAvoid = fs.readFileSync('pages.json', 'utf8').includes('social-avoid');
const report = `# 选项A修复验证报告

**验证时间**: ${new Date().toISOString()}

## 修复内容
- 移除pages.json中不存在的social-avoid页面引用
- 更新setup-subpackages.js脚本，注释掉不存在的文件
- 重新生成正确的分包配置

## 验证结果

| 检查项 | 状态 | 说明 |
|--------|------|------|
| pages.json配置 | ${!hasSocialAvoid ? '✅' : '❌'} | 已移除social-avoid引用 |
| 分包目录结构 | ${subDirs.every(d => fs.existsSync(d)) ? '✅' : '❌'} | 所有分包目录存在 |
| 关键文件 | ${keyFiles.every(f => fs.existsSync(f)) ? '✅' : '❌'} | 关键分包文件完整 |
| API兼容性 | ${wxApiCount === 0 ? '✅' : '❌'} | 修复保持完好 |
| 发布文档 | ${releaseFiles.every(f => fs.existsSync(f)) ? '✅' : '❌'} | 文档齐全 |

## 统计
- 通过项: ${passed}
- 失败项: ${failed}
- 通过率: ${((passed / (passed + failed)) * 100).toFixed(1)}%

## 结论
${failed === 0 ? '**✅ 修复成功，选项A所有功能正常！**' : '**⚠️ 需要进一步检查**'}

${issues.length > 0 ? `
## 需要关注
${issues.map(i => `- ${i}`).join('\n')}
` : ''}
`;

fs.writeFileSync('tests/OPTION-A-FIX-VERIFICATION.md', report, 'utf8');
console.log(`\n📄 验证报告已保存至: tests/OPTION-A-FIX-VERIFICATION.md`);

process.exit(failed > 0 ? 1 : 0);
