#!/usr/bin/env node
/**
 * 环境检查脚本
 * 检查Node版本、关键依赖版本
 */

const fs = require('fs');
const { execSync } = require('child_process');

const REQUIRED_NODE_VERSION = 16;
const REQUIRED_PACKAGES = [
  { name: 'vue', minVersion: '2.6.11' },
  { name: 'uview-ui', minVersion: '2.0.0' },
];

/**
 * 检查Node版本
 */
function checkNodeVersion() {
  const version = process.version;
  const majorVersion = parseInt(version.slice(1).split('.')[0]);
  
  console.log(`\n[Node版本检查]`);
  console.log(`  当前版本: ${version}`);
  
  if (majorVersion !== REQUIRED_NODE_VERSION) {
    console.error(`  ❌ 要求Node ${REQUIRED_NODE_VERSION} LTS，当前: ${version}`);
    console.error(`  请安装 Node ${REQUIRED_NODE_VERSION}.x.x`);
    return false;
  }
  
  console.log(`  ✅ Node版本检查通过`);
  return true;
}

/**
 * 检查npm版本
 */
function checkNpmVersion() {
  try {
    const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
    console.log(`\n[npm版本]`);
    console.log(`  当前版本: ${version}`);
    return true;
  } catch (error) {
    console.error(`\n[npm版本]`);
    console.error(`  ❌ npm不可用`);
    return false;
  }
}

/**
 * 检查package.json是否存在
 */
function checkPackageJson() {
  console.log(`\n[package.json检查]`);
  if (!fs.existsSync('package.json')) {
    console.error(`  ❌ 未找到package.json`);
    return false;
  }
  console.log(`  ✅ package.json存在`);
  return true;
}

/**
 * 检查关键依赖
 */
function checkDependencies() {
  console.log(`\n[依赖检查]`);
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let allPassed = true;
  
  REQUIRED_PACKAGES.forEach(({ name, minVersion }) => {
    const installed = dependencies[name];
    if (!installed) {
      console.error(`  ❌ ${name}: 未安装`);
      allPassed = false;
    } else {
      console.log(`  ✅ ${name}: ${installed}`);
    }
  });
  
  return allPassed;
}

/**
 * 检查node_modules是否安装
 */
function checkNodeModules() {
  console.log(`\n[node_modules检查]`);
  if (!fs.existsSync('node_modules')) {
    console.error(`  ❌ node_modules不存在，请运行: npm install`);
    return false;
  }
  console.log(`  ✅ node_modules存在`);
  return true;
}

/**
 * 主函数
 */
function main() {
  console.log('===== 开发环境检查 =====');
  
  const checks = [
    checkNodeVersion(),
    checkNpmVersion(),
    checkPackageJson(),
    checkDependencies(),
    checkNodeModules(),
  ];
  
  const allPassed = checks.every(check => check);
  
  console.log('\n===== 检查结果 =====');
  if (allPassed) {
    console.log('✅ 所有检查通过，环境配置正确');
    process.exit(0);
  } else {
    console.log('❌ 检查失败，请修复以上问题');
    process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { 
  checkNodeVersion, 
  checkDependencies,
  checkNodeModules 
};

