#!/usr/bin/env node

/**
 * 组件分析工具
 * 
 * 功能：
 * 1. 分析组件依赖关系
 * 2. 检测循环依赖
 * 3. 检测未使用组件
 * 4. 统计组件大小
 * 5. 生成依赖图
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  componentsDir: 'components',
  pagesDir: 'pages',
  pagesSubDir: 'pages-sub',
  outputDir: 'docs/analysis'
};

// 分析结果
const analysis = {
  components: [],
  dependencies: {},
  circularDeps: [],
  unusedComponents: [],
  componentSizes: {}
};

/**
 * 扫描组件目录
 */
function scanComponents() {
  const componentsPath = path.join(process.cwd(), config.componentsDir);
  
  if (!fs.existsSync(componentsPath)) {
    console.error('组件目录不存在');
    return;
  }
  
  scanDirectory(componentsPath, '');
}

/**
 * 递归扫描目录
 */
function scanDirectory(dir, relativePath) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      scanDirectory(filePath, path.join(relativePath, file));
    } else if (file.endsWith('.vue')) {
      analyzeComponent(filePath, path.join(relativePath, file));
    }
  });
}

/**
 * 分析单个组件
 */
function analyzeComponent(filePath, relativePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const size = Buffer.byteLength(content, 'utf8');
    
    // 提取组件名
    const componentName = path.basename(relativePath, '.vue');
    
    // 提取依赖
    const deps = extractDependencies(content);
    
    // 记录
    analysis.components.push({
      name: componentName,
      path: relativePath,
      size: size
    });
    
    analysis.dependencies[componentName] = deps;
    analysis.componentSizes[componentName] = size;
    
    console.log(`✓ ${componentName} (${(size / 1024).toFixed(2)}KB, ${deps.length}个依赖)`);
  } catch (error) {
    console.error(`分析失败: ${relativePath}`, error.message);
  }
}

/**
 * 提取组件依赖
 */
function extractDependencies(content) {
  const deps = [];
  
  // 匹配import语句
  const importMatches = content.matchAll(/import\s+(\w+)\s+from\s+['"]([^'"]+)['"]/g);
  for (const match of importMatches) {
    if (match[2].includes('components')) {
      deps.push(match[1]);
    }
  }
  
  // 匹配components注册
  const componentsMatch = content.match(/components:\s*\{([^}]+)\}/);
  if (componentsMatch) {
    const componentNames = componentsMatch[1].match(/\w+/g);
    if (componentNames) {
      deps.push(...componentNames);
    }
  }
  
  return [...new Set(deps)];  // 去重
}

/**
 * 检测循环依赖
 */
function detectCircularDeps() {
  for (const [component, deps] of Object.entries(analysis.dependencies)) {
    const visited = new Set();
    const path = [];
    
    if (hasCircularDep(component, deps, visited, path)) {
      analysis.circularDeps.push(path.join(' -> '));
    }
  }
}

/**
 * 递归检测循环依赖
 */
function hasCircularDep(component, deps, visited, path) {
  if (path.includes(component)) {
    path.push(component);
    return true;
  }
  
  if (visited.has(component)) {
    return false;
  }
  
  visited.add(component);
  path.push(component);
  
  for (const dep of deps) {
    const depDeps = analysis.dependencies[dep] || [];
    if (hasCircularDep(dep, depDeps, visited, path)) {
      return true;
    }
  }
  
  path.pop();
  return false;
}

/**
 * 检测未使用组件
 */
function detectUnusedComponents() {
  // 扫描所有页面
  const usedComponents = new Set();
  
  [config.pagesDir, config.pagesSubDir].forEach(dir => {
    const dirPath = path.join(process.cwd(), dir);
    if (fs.existsSync(dirPath)) {
      findUsedComponents(dirPath, usedComponents);
    }
  });
  
  // 找出未使用的组件
  analysis.components.forEach(comp => {
    if (!usedComponents.has(comp.name)) {
      analysis.unusedComponents.push(comp.name);
    }
  });
}

/**
 * 查找使用的组件
 */
function findUsedComponents(dir, usedComponents) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      findUsedComponents(filePath, usedComponents);
    } else if (file.endsWith('.vue')) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const deps = extractDependencies(content);
      deps.forEach(dep => usedComponents.add(dep));
    }
  });
}

/**
 * 生成报告
 */
function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('组件分析报告');
  console.log('='.repeat(80));
  console.log(`总组件数: ${analysis.components.length}`);
  console.log(`总大小: ${(Object.values(analysis.componentSizes).reduce((a, b) => a + b, 0) / 1024).toFixed(2)}KB`);
  console.log(`循环依赖: ${analysis.circularDeps.length}`);
  console.log(`未使用组件: ${analysis.unusedComponents.length}`);
  console.log('='.repeat(80) + '\n');
  
  if (analysis.circularDeps.length > 0) {
    console.log('⚠️ 循环依赖:');
    analysis.circularDeps.forEach((dep, i) => {
      console.log(`${i + 1}. ${dep}`);
    });
    console.log('');
  }
  
  if (analysis.unusedComponents.length > 0) {
    console.log('💡 未使用组件:');
    analysis.unusedComponents.forEach((comp, i) => {
      console.log(`${i + 1}. ${comp}`);
    });
    console.log('');
  }
  
  // 组件大小排行
  console.log('📊 组件大小排行（Top 10）:');
  const sorted = Object.entries(analysis.componentSizes)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
  
  sorted.forEach(([name, size], i) => {
    console.log(`${i + 1}. ${name}: ${(size / 1024).toFixed(2)}KB`);
  });
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始分析组件...\n');
  
  scanComponents();
  detectCircularDeps();
  detectUnusedComponents();
  generateReport();
  
  process.exit(analysis.circularDeps.length > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { scanComponents, detectCircularDeps, analysis };


