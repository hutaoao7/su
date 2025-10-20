/**
 * 更新错误提示文案
 * 将技术术语替换为用户友好的文案
 */

const fs = require('fs');
const path = require('path');

const TAG = '[错误文案更新]';

// 需要替换的错误文案映射
const ERROR_REPLACEMENTS = {
  // 技术术语 -> 友好文案
  'Network Error': '网络连接失败',
  'Request failed': '请求失败，请重试',
  'Invalid token': '登录已失效',
  'Unauthorized': '请先登录',
  'Access denied': '权限不足',
  'Internal server error': '服务器繁忙',
  '404 Not Found': '内容不存在',
  'Bad request': '请求参数错误',
  'Timeout': '请求超时',
  'Invalid parameter': '参数错误',
  'Database error': '数据处理失败',
  'File not found': '文件不存在',
  'Invalid format': '格式不正确',
  'Connection refused': '连接失败',
  'Service unavailable': '服务暂不可用'
};

// 扫描目录
const SCAN_DIRS = ['pages', 'components', 'api', 'utils'];

// 查找并替换错误文案
function updateErrorMessages() {
  console.log(TAG, '开始更新错误文案...');
  let updatedCount = 0;
  
  SCAN_DIRS.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    scanDirectory(dir, (file) => {
      let content = fs.readFileSync(file, 'utf8');
      let modified = false;
      
      // 替换showToast中的错误文案
      const toastRegex = /uni\.showToast\(\{[\s\S]*?title:\s*['"`]([^'"`]+)['"`]/g;
      content = content.replace(toastRegex, (match, title) => {
        for (const [tech, friendly] of Object.entries(ERROR_REPLACEMENTS)) {
          if (title.toLowerCase().includes(tech.toLowerCase())) {
            modified = true;
            updatedCount++;
            return match.replace(title, friendly);
          }
        }
        return match;
      });
      
      // 替换console.error中的文案
      const errorRegex = /console\.error\(['"`]([^'"`]+)['"`]/g;
      content = content.replace(errorRegex, (match, msg) => {
        // 只替换面向用户的错误，保留调试信息
        if (msg.includes('Error:') || msg.includes('Failed:')) {
          for (const [tech, friendly] of Object.entries(ERROR_REPLACEMENTS)) {
            if (msg.includes(tech)) {
              // 不直接替换console.error，而是添加友好提示
              return match + `;\n        uni.showToast({ title: '${friendly}', icon: 'none' })`;
            }
          }
        }
        return match;
      });
      
      // 替换errMsg中的文案
      const errMsgRegex = /errMsg:\s*['"`]([^'"`]+)['"`]/g;
      content = content.replace(errMsgRegex, (match, msg) => {
        for (const [tech, friendly] of Object.entries(ERROR_REPLACEMENTS)) {
          if (msg.toLowerCase().includes(tech.toLowerCase())) {
            modified = true;
            updatedCount++;
            return match.replace(msg, friendly);
          }
        }
        return match;
      });
      
      if (modified) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(TAG, `✅ 已更新: ${file}`);
      }
    });
  });
  
  console.log(TAG, `共更新 ${updatedCount} 处错误文案`);
}

// 递归扫描目录
function scanDirectory(dir, callback) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== 'unpackage') {
        scanDirectory(fullPath, callback);
      }
    } else if (stat.isFile()) {
      if (fullPath.endsWith('.vue') || fullPath.endsWith('.js')) {
        callback(fullPath);
      }
    }
  });
}

// 集成错误处理模块
function integrateErrorHandler() {
  console.log(TAG, '集成统一错误处理...');
  
  // 在main.js中注入错误处理
  const mainPath = path.resolve('main.js');
  let mainContent = fs.readFileSync(mainPath, 'utf8');
  
  if (!mainContent.includes('error-messages')) {
    const importStatement = `\n// 导入统一错误处理\nimport { handleApiError } from '@/utils/error-messages.js'\nVue.prototype.$handleError = handleApiError\n`;
    
    // 在Vue.config之前插入
    mainContent = mainContent.replace(
      'Vue.config.productionTip = false',
      importStatement + '\nVue.config.productionTip = false'
    );
    
    fs.writeFileSync(mainPath, mainContent, 'utf8');
    console.log(TAG, '✅ 已在main.js中集成错误处理');
  }
}

// 生成报告
function generateReport() {
  const report = `# 错误文案优化报告

**更新时间**: ${new Date().toISOString()}

## 📝 优化内容

1. 替换技术术语为用户友好文案
2. 统一错误提示格式
3. 集成统一错误处理模块

## 🔄 文案映射

${Object.entries(ERROR_REPLACEMENTS).map(([tech, friendly]) => 
  `- \`${tech}\` → **${friendly}**`
).join('\n')}

## ✅ 集成功能

- 统一错误消息管理器: \`utils/error-messages.js\`
- 全局错误处理: \`Vue.prototype.$handleError\`
- 友好提示函数: \`showErrorToast\`, \`showErrorModal\`

## 💡 使用示例

\`\`\`javascript
// 使用统一错误处理
this.$handleError(error, {
  defaultMessage: '操作失败',
  silent: false
});

// 或直接使用
import { showErrorToast } from '@/utils/error-messages.js'
showErrorToast('NETWORK_ERROR');
\`\`\`
`;

  fs.writeFileSync('docs/ERROR-MESSAGE-REPORT.md', report, 'utf8');
  console.log(TAG, '✅ 报告已保存至: docs/ERROR-MESSAGE-REPORT.md');
}

// 主函数
function main() {
  console.log(TAG, '========== 错误文案优化开始 ==========');
  
  updateErrorMessages();
  integrateErrorHandler();
  generateReport();
  
  console.log(TAG, '========== 错误文案优化完成 ==========');
}

// 执行
main();
