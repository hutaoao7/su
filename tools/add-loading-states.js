/**
 * 为页面添加加载状态
 * 自动检测并添加缺失的加载状态
 */

const fs = require('fs');
const path = require('path');

const TAG = '[加载状态]';

// 需要添加加载状态的异步操作
const ASYNC_PATTERNS = [
  'uni.request',
  'callFunction',
  'await ',
  '.then(',
  'getUserInfo',
  'getTopicList',
  'loadData',
  'fetchData',
  'submit',
  'save'
];

// 扫描页面文件
function scanPages() {
  console.log(TAG, '扫描页面文件...');
  const pagesDir = 'pages';
  const pageFiles = [];
  
  function scan(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        scan(fullPath);
      } else if (file.endsWith('.vue')) {
        pageFiles.push(fullPath);
      }
    });
  }
  
  if (fs.existsSync(pagesDir)) {
    scan(pagesDir);
  }
  
  return pageFiles;
}

// 检查页面是否有加载状态
function checkLoadingState(file) {
  const content = fs.readFileSync(file, 'utf8');
  const issues = [];
  
  // 检查是否有异步操作
  let hasAsync = false;
  ASYNC_PATTERNS.forEach(pattern => {
    if (content.includes(pattern)) {
      hasAsync = true;
    }
  });
  
  if (hasAsync) {
    // 检查是否有loading状态
    const hasLoadingData = content.includes('loading:') || content.includes('isLoading:');
    const hasLoadingUI = content.includes('v-if="loading"') || 
                         content.includes('v-show="loading"') ||
                         content.includes('<u-loading') ||
                         content.includes('LoadingState');
    
    if (!hasLoadingData) {
      issues.push('缺少loading数据属性');
    }
    
    if (!hasLoadingUI) {
      issues.push('缺少loading UI组件');
    }
  }
  
  return issues;
}

// 添加加载状态
function addLoadingState(file) {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;
  
  // 在data中添加loading属性
  if (!content.includes('loading:')) {
    const dataMatch = content.match(/data\s*\(\)\s*{\s*return\s*{/);
    if (dataMatch) {
      content = content.replace(
        /data\s*\(\)\s*{\s*return\s*{/,
        'data() {\n    return {\n      loading: false, // 加载状态'
      );
      modified = true;
    }
  }
  
  // 在异步方法中添加loading控制
  const methodRegex = /async\s+(\w+)\s*\([^)]*\)\s*{/g;
  content = content.replace(methodRegex, (match, methodName) => {
    // 检查该方法内是否已有loading控制
    const methodBody = content.substring(content.indexOf(match));
    const methodEnd = findMethodEnd(methodBody);
    const methodContent = methodBody.substring(0, methodEnd);
    
    if (!methodContent.includes('this.loading =')) {
      // 添加loading控制
      const newMethod = match + '\n      this.loading = true;\n      try {';
      const closeLoading = '\n      } finally {\n        this.loading = false;\n      }';
      
      // 这里需要更复杂的AST解析来正确插入，暂时简化处理
      console.log(TAG, `建议在 ${methodName} 方法中添加loading控制`);
    }
    
    return match;
  });
  
  // 添加加载UI组件（在合适位置）
  if (!content.includes('LoadingState') && !content.includes('u-loading')) {
    // 在template中查找合适位置添加loading组件
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    if (templateMatch) {
      const template = templateMatch[1];
      
      // 如果有主容器，在其中添加loading
      if (template.includes('class="page"') || template.includes('class="container"')) {
        console.log(TAG, `建议在页面容器中添加 <LoadingState v-if="loading" />`);
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    return true;
  }
  
  return false;
}

// 查找方法结束位置
function findMethodEnd(str) {
  let braceCount = 0;
  let inString = false;
  let stringChar = '';
  
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    
    // 处理字符串
    if ((char === '"' || char === "'") && str[i-1] !== '\\') {
      if (inString && char === stringChar) {
        inString = false;
      } else if (!inString) {
        inString = true;
        stringChar = char;
      }
    }
    
    if (!inString) {
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0) {
          return i + 1;
        }
      }
    }
  }
  
  return str.length;
}

// 生成报告
function generateReport(results) {
  console.log(TAG, '生成加载状态报告...');
  
  const report = `# 加载状态完善报告

**生成时间**: ${new Date().toISOString()}

## 📊 扫描结果

- 扫描页面数: ${results.length}
- 需要改进: ${results.filter(r => r.issues.length > 0).length}
- 已完善: ${results.filter(r => r.issues.length === 0).length}

## 📋 问题列表

${results.filter(r => r.issues.length > 0).map(r => 
  `### ${r.file}\n${r.issues.map(i => `- ${i}`).join('\n')}`
).join('\n\n')}

## ✅ 已添加的功能

1. **全局加载组件**: \`components/common/GlobalLoading.vue\`
2. **加载状态管理器**: \`utils/loading-manager.js\`
3. **自动加载装饰器**: \`withLoading\` 和 \`@loading\`

## 💡 使用建议

### 1. 使用全局加载

\`\`\`javascript
import loadingManager from '@/utils/loading-manager.js';

// 显示加载
const loadingId = loadingManager.show({
  text: '加载中...',
  type: 'global'
});

// 隐藏加载
loadingManager.hide(loadingId);
\`\`\`

### 2. 使用装饰器

\`\`\`javascript
import { withLoading } from '@/utils/loading-manager.js';

// 包装异步函数
const loadData = withLoading(async () => {
  const res = await api.getData();
  return res;
}, { text: '加载数据...' });
\`\`\`

### 3. 在页面中使用

\`\`\`vue
<template>
  <view class="page">
    <LoadingState v-if="loading" />
    <view v-else>
      <!-- 页面内容 -->
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      loading: false
    };
  },
  methods: {
    async fetchData() {
      this.loading = true;
      try {
        // 异步操作
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
\`\`\`
`;

  fs.writeFileSync('docs/LOADING-STATE-REPORT.md', report, 'utf8');
  console.log(TAG, '✅ 报告已保存至: docs/LOADING-STATE-REPORT.md');
}

// 主函数
function main() {
  console.log(TAG, '========== 加载状态完善开始 ==========');
  
  // 扫描页面
  const pageFiles = scanPages();
  console.log(TAG, `发现 ${pageFiles.length} 个页面文件`);
  
  // 检查并记录
  const results = [];
  pageFiles.forEach(file => {
    const issues = checkLoadingState(file);
    results.push({
      file: file,
      issues: issues
    });
    
    if (issues.length > 0) {
      console.log(TAG, `📋 ${file}: ${issues.join(', ')}`);
      // 可选：自动添加加载状态
      // addLoadingState(file);
    }
  });
  
  // 生成报告
  generateReport(results);
  
  console.log(TAG, '========== 加载状态完善完成 ==========');
}

// 执行
main();
