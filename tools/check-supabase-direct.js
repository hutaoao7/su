#!/usr/bin/env node
/**
 * Supabase直连检查脚本
 * 检查前端是否直连Supabase（违反架构规范）
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  scanDirs: ['pages/**/*.{vue,js}', 'components/**/*.{vue,js}', 'utils/**/*.js'],
  excludeDirs: ['node_modules', 'uni_modules', 'unpackage'],
  violations: {
    createClient: /createClient|create\s*\(\s*['"]supabase/gi,
    supabaseImport: /@supabase\/|from\s+['"].*supabase/gi,
    serviceRole: /service_role|serviceRole/gi,
  },
};

// 结果统计
const results = {
  total: 0,
  violations: [],
  clean: [],
};

/**
 * 扫描单个文件
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const fileResult = {
    path: filePath,
    violations: [],
  };

  // 检查createClient
  if (CONFIG.violations.createClient.test(content)) {
    fileResult.violations.push({
      type: 'createClient',
      message: '检测到Supabase客户端实例化，前端禁止直连',
    });
  }

  // 检查import
  if (CONFIG.violations.supabaseImport.test(content)) {
    fileResult.violations.push({
      type: 'import',
      message: '检测到Supabase库导入，前端禁止使用',
    });
  }

  // 检查service_role
  if (CONFIG.violations.serviceRole.test(content)) {
    fileResult.violations.push({
      type: 'serviceRole',
      message: '检测到service_role密钥，前端禁止出现',
    });
  }

  results.total++;

  if (fileResult.violations.length > 0) {
    results.violations.push(fileResult);
  } else {
    results.clean.push(filePath);
  }

  return fileResult;
}

/**
 * 主函数
 */
async function main() {
  console.log('===== Supabase直连检查 =====\n');

  // 扫描所有文件（使用简单的文件遍历，不依赖glob包）
  const files = [];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        if (!CONFIG.excludeDirs.includes(item.name)) {
          scanDir(fullPath);
        }
      } else if (item.isFile() && /\.(vue|js)$/.test(item.name)) {
        files.push(fullPath);
      }
    }
  }
  
  ['pages', 'components', 'utils'].forEach(dir => scanDir(dir));

  console.log(`扫描文件数: ${files.length}\n`);

  files.forEach(scanFile);

  // 输出报告
  console.log('===== 检查结果 =====\n');
  console.log(`✅ 正常文件: ${results.clean.length}`);
  console.log(`❌ 违规文件: ${results.violations.length}\n`);

  // 输出违规详情
  if (results.violations.length > 0) {
    console.log('===== 违规详情 =====\n');
    results.violations.forEach(file => {
      console.log(`❌ ${file.path}`);
      file.violations.forEach(v => {
        console.log(`   [${v.type}] ${v.message}`);
      });
      console.log();
    });
    
    console.log('⚠️  修复建议:');
    console.log('  1. 移除前端的Supabase引用');
    console.log('  2. 通过云函数访问Supabase');
    console.log('  3. 使用 utils/unicloud-handler.js 调用云函数\n');
  }

  // 退出码
  const exitCode = results.violations.length > 0 ? 1 : 0;
  console.log(exitCode === 0 ? '✅ 检查通过' : '❌ 检查失败');
  process.exit(exitCode);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanFile };

