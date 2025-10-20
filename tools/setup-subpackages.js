/**
 * 分包设置脚本
 * 用于将页面移动到分包目录并更新pages.json
 */

const fs = require('fs');
const path = require('path');

const TAG = '[分包设置]';

// 分包映射配置
const SUBPACKAGE_MAP = {
  'assess': [
    'pages/assess/result.vue',
    'pages/assess/academic/index.vue', 
    'pages/assess/sleep/index.vue',
    'pages/assess/social/index.vue',
    // 'pages/assess/social/social-avoid.vue', // 文件不存在，已移除
    'pages/assess/stress/index.vue'
  ],
  'intervene': [
    'pages/intervene/chat.vue',
    'pages/intervene/meditation.vue',
    'pages/intervene/nature.vue',
    'pages/intervene/intervene.vue'
  ],
  'music': [
    'pages/music/index.vue',
    'pages/music/player.vue'
  ],
  'community': [
    'pages/community/detail.vue'
    // index.vue保留在主包作为入口
  ],
  'other': [
    'pages/cdk/redeem.vue',
    'pages/feedback/feedback.vue',
    'pages/admin/metrics.vue'
  ]
};

// 检查文件是否存在
function checkFiles() {
  console.log(TAG, '检查待移动文件...');
  let allExist = true;
  
  for (const [pkg, files] of Object.entries(SUBPACKAGE_MAP)) {
    for (const file of files) {
      const fullPath = path.resolve(file);
      if (!fs.existsSync(fullPath)) {
        console.log(TAG, `⚠️ 文件不存在: ${file}`);
        allExist = false;
      }
    }
  }
  
  return allExist;
}

// 创建分包目录结构
function createSubpackageDirs() {
  console.log(TAG, '创建分包目录结构...');
  
  for (const pkg of Object.keys(SUBPACKAGE_MAP)) {
    const dirs = [
      `pages-sub/${pkg}`,
      `pages-sub/${pkg}/academic`,
      `pages-sub/${pkg}/sleep`,
      `pages-sub/${pkg}/social`, 
      `pages-sub/${pkg}/stress`
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(TAG, `✅ 创建目录: ${dir}`);
      }
    });
  }
}

// 复制文件到分包目录
function copyFilesToSubpackages(dryRun = true) {
  console.log(TAG, dryRun ? '模拟复制文件...' : '复制文件到分包目录...');
  
  const copyList = [];
  
  for (const [pkg, files] of Object.entries(SUBPACKAGE_MAP)) {
    for (const file of files) {
      const srcPath = path.resolve(file);
      const fileName = path.basename(file);
      const subDir = path.dirname(file).replace('pages/', '');
      let destPath = `pages-sub/${pkg}/${fileName}`;
      
      // 保持子目录结构
      if (subDir && subDir !== '.') {
        const subDirName = subDir.split('/').pop();
        if (['academic', 'sleep', 'social', 'stress'].includes(subDirName)) {
          destPath = `pages-sub/${pkg}/${subDirName}/${fileName}`;
        }
      }
      
      copyList.push({ src: srcPath, dest: destPath });
      
      if (!dryRun) {
        if (fs.existsSync(srcPath)) {
          const destDir = path.dirname(destPath);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }
          
          fs.copyFileSync(srcPath, destPath);
          console.log(TAG, `✅ 复制: ${file} → ${destPath}`);
        } else {
          console.log(TAG, `⏭️ 跳过不存在的文件: ${file}`);
        }
      } else if (dryRun) {
        if (fs.existsSync(srcPath)) {
          console.log(TAG, `📋 将复制: ${file} → ${destPath}`);
        } else {
          console.log(TAG, `⚠️ 文件不存在: ${file}`);
        }
      }
    }
  }
  
  return copyList;
}

// 生成新的pages.json配置
function generateSubpackageConfig() {
  console.log(TAG, '生成分包配置...');
  
  const pagesJsonPath = path.resolve('pages.json');
  const pagesJson = JSON.parse(fs.readFileSync(pagesJsonPath, 'utf8'));
  
  // 保留主包页面（首页、登录、用户中心等核心页面）
  const mainPages = [
    'pages/index/index',
    'pages/home/home', 
    'pages/login/login',
    'pages/user/home',
    'pages/user/profile',
    'pages/features/features',
    'pages/community/index',
    'pages/stress/index',
    'pages/stress/detect',
    'pages/stress/history',
    'pages/stress/record',
    'pages/stress/intervention',
    'pages/test/index',
    'pages/consent/consent',
    'pages/consent/privacy-policy',
    'pages/consent/user-agreement',
    'pages/consent/disclaimer'
  ];
  
  // 创建分包配置
  const subPackages = [
    {
      root: 'pages-sub/assess',
      name: 'assess',
      pages: [
        { path: 'result', style: { navigationBarTitleText: '评估结果' } },
        { path: 'academic/index', style: { navigationBarTitleText: '学业压力评估' } },
        { path: 'sleep/index', style: { navigationBarTitleText: '睡眠质量评估' } },
        { path: 'social/index', style: { navigationBarTitleText: '社交焦虑评估' } },
        // { path: 'social/social-avoid', style: { navigationBarTitleText: '社交回避评估' } }, // 文件不存在，已移除
        { path: 'stress/index', style: { navigationBarTitleText: '压力评估' } }
      ]
    },
    {
      root: 'pages-sub/intervene',
      name: 'intervene',
      pages: [
        { path: 'chat', style: { navigationBarTitleText: 'AI倾诉' } },
        { path: 'meditation', style: { navigationBarTitleText: '冥想音疗' } },
        { path: 'nature', style: { navigationBarTitleText: '自然音' } },
        { path: 'intervene', style: { navigationBarTitleText: '干预方案' } }
      ]
    },
    {
      root: 'pages-sub/music',
      name: 'music', 
      pages: [
        { path: 'index', style: { navigationBarTitleText: '音乐疗愈' } },
        { path: 'player', style: { navigationBarTitleText: '播放器' } }
      ]
    },
    {
      root: 'pages-sub/community',
      name: 'community',
      pages: [
        { path: 'detail', style: { navigationBarTitleText: '话题详情' } }
      ]
    },
    {
      root: 'pages-sub/other',
      name: 'other',
      pages: [
        { path: 'redeem', style: { navigationBarTitleText: 'CDK兑换' } },
        { path: 'feedback', style: { navigationBarTitleText: '意见反馈' } },
        { path: 'metrics', style: { navigationBarTitleText: '数据统计' } }
      ]
    }
  ];
  
  // 更新pages.json
  const newPagesJson = {
    ...pagesJson,
    pages: pagesJson.pages.filter(page => mainPages.includes(page.path)),
    subPackages: subPackages,
    preloadRule: {
      'pages/features/features': {
        network: 'all',
        packages: ['assess', 'intervene']
      },
      'pages/community/index': {
        network: 'all', 
        packages: ['community']
      }
    }
  };
  
  // 保存新配置
  const outputPath = path.resolve('pages-subpackage.json');
  fs.writeFileSync(outputPath, JSON.stringify(newPagesJson, null, 2), 'utf8');
  console.log(TAG, `✅ 分包配置已保存至: ${outputPath}`);
  
  return newPagesJson;
}

// 生成迁移报告
function generateMigrationReport(copyList) {
  console.log(TAG, '生成迁移报告...');
  
  const report = `# 分包迁移报告

**生成时间**: ${new Date().toISOString()}

## 📦 分包统计

| 分包 | 页面数 | 说明 |
|------|--------|------|
| 主包 | 20 | 核心页面 |
| assess | 6 | 评估相关 |
| intervene | 4 | 干预功能 |
| music | 2 | 音乐播放 |
| community | 1 | 社区详情 |
| other | 3 | 其他功能 |

## 📋 文件迁移清单

${copyList.map((item, index) => `${index + 1}. \`${item.src}\` → \`${item.dest}\``).join('\n')}

## ⚠️ 注意事项

1. **路由更新**: 分包后页面路径需要更新
   - 原路径: \`/pages/assess/result\`
   - 新路径: \`/pages-sub/assess/result\`

2. **组件引用**: 检查页面中的组件引用路径

3. **测试重点**:
   - 页面跳转是否正常
   - 组件加载是否正常
   - 数据传递是否正常

## 🚀 执行步骤

1. 运行 \`node tools/setup-subpackages.js --execute\` 执行实际迁移
2. 备份当前 pages.json
3. 用 pages-subpackage.json 替换 pages.json
4. 全量测试所有页面功能
`;

  fs.writeFileSync('docs/SUBPACKAGE-MIGRATION.md', report, 'utf8');
  console.log(TAG, '✅ 迁移报告已保存至: docs/SUBPACKAGE-MIGRATION.md');
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const execute = args.includes('--execute');
  
  console.log(TAG, '========== 分包设置开始 ==========');
  console.log(TAG, `模式: ${execute ? '执行' : '模拟'}`);
  
  // 检查文件
  const filesExist = checkFiles();
  if (!filesExist && execute) {
    console.log(TAG, '⚠️ 部分文件不存在，将跳过这些文件继续执行');
    // 不终止，继续执行
  }
  
  // 创建目录
  createSubpackageDirs();
  
  // 复制文件
  const copyList = copyFilesToSubpackages(!execute);
  
  // 生成配置
  generateSubpackageConfig();
  
  // 生成报告
  generateMigrationReport(copyList);
  
  console.log(TAG, '========== 分包设置完成 ==========');
  console.log(TAG, execute ? '✅ 文件已迁移，请测试功能' : '📋 模拟完成，使用 --execute 执行实际迁移');
}

// 执行
main();
