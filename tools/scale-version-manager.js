/**
 * 量表版本管理工具
 * 用于管理量表的版本控制、变更历史、版本比较和发布
 * 
 * 功能：
 * 1. 量表版本号管理（语义化版本）
 * 2. 变更历史记录和追踪
 * 3. 版本差异对比
 * 4. 版本发布和归档
 * 5. 版本回退功能
 * 
 * 使用方法：
 * node tools/scale-version-manager.js <command> [options]
 * 
 * 命令：
 * - list: 列出所有量表及其版本
 * - info <scaleId>: 查看量表版本信息
 * - compare <scaleId> <version1> <version2>: 比较两个版本
 * - bump <scaleId> <type>: 升级版本（major/minor/patch）
 * - history <scaleId>: 查看变更历史
 * - publish <scaleId>: 发布新版本
 * - rollback <scaleId> <version>: 回退到指定版本
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  scalesDir: path.join(__dirname, '../static/scales'),
  versionsDir: path.join(__dirname, '../static/scales/versions'),
  historyFile: path.join(__dirname, '../static/scales/versions/history.json'),
  manifestFile: path.join(__dirname, '../static/scales/versions/manifest.json'),
  
  // 版本号格式：major.minor.patch
  defaultVersion: '1.0.0',
  
  // 变更类型
  changeTypes: {
    major: '重大更新（不兼容）',
    minor: '功能更新（兼容）',
    patch: '修复更新（兼容）'
  }
};

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 确保目录存在
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * 解析版本号
 */
function parseVersion(version) {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)$/);
  if (!match) {
    throw new Error(`无效的版本号格式: ${version}`);
  }
  return {
    major: parseInt(match[1]),
    minor: parseInt(match[2]),
    patch: parseInt(match[3]),
    toString() {
      return `${this.major}.${this.minor}.${this.patch}`;
    }
  };
}

/**
 * 升级版本号
 */
function bumpVersion(currentVersion, type) {
  const v = parseVersion(currentVersion);
  
  switch (type) {
    case 'major':
      v.major++;
      v.minor = 0;
      v.patch = 0;
      break;
    case 'minor':
      v.minor++;
      v.patch = 0;
      break;
    case 'patch':
      v.patch++;
      break;
    default:
      throw new Error(`无效的升级类型: ${type}`);
  }
  
  return v.toString();
}

/**
 * 比较版本号
 */
function compareVersions(v1, v2) {
  const version1 = parseVersion(v1);
  const version2 = parseVersion(v2);
  
  if (version1.major !== version2.major) {
    return version1.major - version2.major;
  }
  if (version1.minor !== version2.minor) {
    return version1.minor - version2.minor;
  }
  return version1.patch - version2.patch;
}

/**
 * 计算文件哈希
 */
function calculateHash(filePath) {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * 深度比较对象
 */
function deepDiff(obj1, obj2, path = '') {
  const diffs = [];
  
  // 检查类型
  if (typeof obj1 !== typeof obj2) {
    diffs.push({
      path: path || 'root',
      type: 'type_change',
      old: typeof obj1,
      new: typeof obj2
    });
    return diffs;
  }
  
  // 处理数组
  if (Array.isArray(obj1) && Array.isArray(obj2)) {
    if (obj1.length !== obj2.length) {
      diffs.push({
        path: path || 'root',
        type: 'length_change',
        old: obj1.length,
        new: obj2.length
      });
    }
    
    const maxLen = Math.max(obj1.length, obj2.length);
    for (let i = 0; i < maxLen; i++) {
      const currentPath = path ? `${path}[${i}]` : `[${i}]`;
      if (i >= obj1.length) {
        diffs.push({
          path: currentPath,
          type: 'added',
          value: obj2[i]
        });
      } else if (i >= obj2.length) {
        diffs.push({
          path: currentPath,
          type: 'removed',
          value: obj1[i]
        });
      } else if (JSON.stringify(obj1[i]) !== JSON.stringify(obj2[i])) {
        diffs.push(...deepDiff(obj1[i], obj2[i], currentPath));
      }
    }
    
    return diffs;
  }
  
  // 处理对象
  if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = new Set([...keys1, ...keys2]);
    
    allKeys.forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (!(key in obj1)) {
        diffs.push({
          path: currentPath,
          type: 'added',
          value: obj2[key]
        });
      } else if (!(key in obj2)) {
        diffs.push({
          path: currentPath,
          type: 'removed',
          value: obj1[key]
        });
      } else if (JSON.stringify(obj1[key]) !== JSON.stringify(obj2[key])) {
        diffs.push(...deepDiff(obj1[key], obj2[key], currentPath));
      }
    });
    
    return diffs;
  }
  
  // 基本类型
  if (obj1 !== obj2) {
    diffs.push({
      path: path || 'root',
      type: 'value_change',
      old: obj1,
      new: obj2
    });
  }
  
  return diffs;
}

// ============================================================================
// 版本管理器类
// ============================================================================

class ScaleVersionManager {
  constructor(config) {
    this.config = config;
    this.manifest = this.loadManifest();
    this.history = this.loadHistory();
    
    // 确保目录存在
    ensureDir(this.config.versionsDir);
  }

  /**
   * 加载版本清单
   */
  loadManifest() {
    if (fs.existsSync(this.config.manifestFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.config.manifestFile, 'utf-8'));
      } catch (err) {
        console.warn('⚠️  清单文件损坏，创建新的清单');
      }
    }
    
    return {
      version: '1.0.0',
      updated: new Date().toISOString(),
      scales: {}
    };
  }

  /**
   * 保存版本清单
   */
  saveManifest() {
    this.manifest.updated = new Date().toISOString();
    fs.writeFileSync(
      this.config.manifestFile,
      JSON.stringify(this.manifest, null, 2),
      'utf-8'
    );
  }

  /**
   * 加载变更历史
   */
  loadHistory() {
    if (fs.existsSync(this.config.historyFile)) {
      try {
        return JSON.parse(fs.readFileSync(this.config.historyFile, 'utf-8'));
      } catch (err) {
        console.warn('⚠️  历史文件损坏，创建新的历史');
      }
    }
    
    return {
      version: '1.0.0',
      records: []
    };
  }

  /**
   * 保存变更历史
   */
  saveHistory() {
    fs.writeFileSync(
      this.config.historyFile,
      JSON.stringify(this.history, null, 2),
      'utf-8'
    );
  }

  /**
   * 添加历史记录
   */
  addHistoryRecord(scaleId, action, version, metadata = {}) {
    this.history.records.push({
      id: crypto.randomUUID(),
      scaleId,
      action,
      version,
      timestamp: new Date().toISOString(),
      ...metadata
    });
    
    this.saveHistory();
  }

  /**
   * 列出所有量表及其版本
   */
  listScales() {
    console.log('\n📋 量表版本清单\n');
    console.log('='.repeat(70));
    
    const scaleFiles = fs.readdirSync(this.config.scalesDir)
      .filter(f => f.endsWith('.json'));
    
    console.log(`\n找到 ${scaleFiles.length} 个量表：\n`);
    
    scaleFiles.forEach(file => {
      const scaleId = file.replace('.json', '');
      const scaleInfo = this.manifest.scales[scaleId];
      
      if (scaleInfo) {
        console.log(`  ✓ ${scaleId}`);
        console.log(`    当前版本: ${scaleInfo.currentVersion}`);
        console.log(`    版本数量: ${scaleInfo.versions.length}`);
        console.log(`    最后更新: ${new Date(scaleInfo.lastUpdated).toLocaleString()}`);
      } else {
        console.log(`  • ${scaleId}`);
        console.log(`    当前版本: 未管理`);
        console.log(`    提示: 运行 'init ${scaleId}' 初始化版本管理`);
      }
      console.log('');
    });
    
    console.log('='.repeat(70));
  }

  /**
   * 初始化量表版本管理
   */
  initScale(scaleId) {
    console.log(`\n🔧 初始化量表版本管理: ${scaleId}\n`);
    
    const scaleFile = path.join(this.config.scalesDir, `${scaleId}.json`);
    
    if (!fs.existsSync(scaleFile)) {
      console.error(`❌ 量表文件不存在: ${scaleFile}`);
      return false;
    }
    
    // 读取量表数据
    const scaleData = JSON.parse(fs.readFileSync(scaleFile, 'utf-8'));
    
    // 初始版本号
    const initialVersion = scaleData.version || this.config.defaultVersion;
    
    // 创建版本目录
    const versionDir = path.join(this.config.versionsDir, scaleId);
    ensureDir(versionDir);
    
    // 保存初始版本
    const versionFile = path.join(versionDir, `${initialVersion}.json`);
    fs.copyFileSync(scaleFile, versionFile);
    
    // 更新清单
    this.manifest.scales[scaleId] = {
      id: scaleId,
      currentVersion: initialVersion,
      versions: [
        {
          version: initialVersion,
          hash: calculateHash(versionFile),
          createdAt: new Date().toISOString(),
          message: '初始版本'
        }
      ],
      lastUpdated: new Date().toISOString()
    };
    
    this.saveManifest();
    
    // 添加历史记录
    this.addHistoryRecord(scaleId, 'init', initialVersion, {
      message: '初始化版本管理'
    });
    
    console.log(`✅ 初始化成功`);
    console.log(`   版本号: ${initialVersion}`);
    console.log(`   文件: ${versionFile}`);
    
    return true;
  }

  /**
   * 查看量表版本信息
   */
  showInfo(scaleId) {
    console.log(`\n📄 量表版本信息: ${scaleId}\n`);
    console.log('='.repeat(70));
    
    const scaleInfo = this.manifest.scales[scaleId];
    
    if (!scaleInfo) {
      console.log('\n❌ 该量表未初始化版本管理');
      console.log(`   运行: node tools/scale-version-manager.js init ${scaleId}`);
      return;
    }
    
    console.log(`\nID: ${scaleInfo.id}`);
    console.log(`当前版本: ${scaleInfo.currentVersion}`);
    console.log(`版本总数: ${scaleInfo.versions.length}`);
    console.log(`最后更新: ${new Date(scaleInfo.lastUpdated).toLocaleString()}`);
    
    console.log(`\n版本历史：\n`);
    
    scaleInfo.versions.slice().reverse().forEach((v, index) => {
      const isCurrent = v.version === scaleInfo.currentVersion;
      console.log(`  ${isCurrent ? '→' : ' '} v${v.version}${isCurrent ? ' (当前)' : ''}`);
      console.log(`    创建时间: ${new Date(v.createdAt).toLocaleString()}`);
      console.log(`    说明: ${v.message || '无'}`);
      console.log(`    哈希: ${v.hash.substring(0, 16)}...`);
      console.log('');
    });
    
    console.log('='.repeat(70));
  }

  /**
   * 升级版本
   */
  bump(scaleId, type, message = '') {
    console.log(`\n⬆️  升级版本: ${scaleId} (${type})\n`);
    
    const scaleInfo = this.manifest.scales[scaleId];
    
    if (!scaleInfo) {
      console.log(`❌ 该量表未初始化版本管理，请先运行 init ${scaleId}`);
      return false;
    }
    
    if (!['major', 'minor', 'patch'].includes(type)) {
      console.log(`❌ 无效的升级类型: ${type}`);
      console.log(`   支持的类型: major, minor, patch`);
      return false;
    }
    
    // 计算新版本号
    const currentVersion = scaleInfo.currentVersion;
    const newVersion = bumpVersion(currentVersion, type);
    
    console.log(`   ${currentVersion} → ${newVersion}`);
    console.log(`   类型: ${this.config.changeTypes[type]}`);
    
    // 复制当前版本到新版本
    const scaleFile = path.join(this.config.scalesDir, `${scaleId}.json`);
    const versionDir = path.join(this.config.versionsDir, scaleId);
    const newVersionFile = path.join(versionDir, `${newVersion}.json`);
    
    ensureDir(versionDir);
    fs.copyFileSync(scaleFile, newVersionFile);
    
    // 更新JSON中的版本号
    const scaleData = JSON.parse(fs.readFileSync(newVersionFile, 'utf-8'));
    scaleData.version = newVersion;
    fs.writeFileSync(newVersionFile, JSON.stringify(scaleData, null, 2), 'utf-8');
    
    // 同步更新主文件
    fs.writeFileSync(scaleFile, JSON.stringify(scaleData, null, 2), 'utf-8');
    
    // 更新清单
    scaleInfo.currentVersion = newVersion;
    scaleInfo.versions.push({
      version: newVersion,
      hash: calculateHash(newVersionFile),
      createdAt: new Date().toISOString(),
      message: message || `${type}版本升级`,
      changeType: type
    });
    scaleInfo.lastUpdated = new Date().toISOString();
    
    this.saveManifest();
    
    // 添加历史记录
    this.addHistoryRecord(scaleId, 'bump', newVersion, {
      changeType: type,
      message: message || `${type}版本升级`,
      previousVersion: currentVersion
    });
    
    console.log(`\n✅ 版本升级成功`);
    console.log(`   新版本文件: ${newVersionFile}`);
    
    return true;
  }

  /**
   * 比较两个版本
   */
  compare(scaleId, version1, version2) {
    console.log(`\n🔍 版本比较: ${scaleId}\n`);
    console.log(`   v${version1} ↔ v${version2}`);
    console.log('='.repeat(70));
    
    const versionDir = path.join(this.config.versionsDir, scaleId);
    const file1 = path.join(versionDir, `${version1}.json`);
    const file2 = path.join(versionDir, `${version2}.json`);
    
    if (!fs.existsSync(file1)) {
      console.log(`\n❌ 版本 ${version1} 不存在`);
      return;
    }
    
    if (!fs.existsSync(file2)) {
      console.log(`\n❌ 版本 ${version2} 不存在`);
      return;
    }
    
    const data1 = JSON.parse(fs.readFileSync(file1, 'utf-8'));
    const data2 = JSON.parse(fs.readFileSync(file2, 'utf-8'));
    
    const diffs = deepDiff(data1, data2);
    
    if (diffs.length === 0) {
      console.log('\n✅ 两个版本完全相同');
      return;
    }
    
    console.log(`\n发现 ${diffs.length} 处差异：\n`);
    
    diffs.forEach((diff, index) => {
      console.log(`${index + 1}. [${diff.path}] ${diff.type}`);
      
      switch (diff.type) {
        case 'value_change':
          console.log(`   旧值: ${JSON.stringify(diff.old)}`);
          console.log(`   新值: ${JSON.stringify(diff.new)}`);
          break;
        case 'type_change':
          console.log(`   类型变更: ${diff.old} → ${diff.new}`);
          break;
        case 'length_change':
          console.log(`   数组长度变更: ${diff.old} → ${diff.new}`);
          break;
        case 'added':
          console.log(`   新增: ${JSON.stringify(diff.value).substring(0, 100)}`);
          break;
        case 'removed':
          console.log(`   删除: ${JSON.stringify(diff.value).substring(0, 100)}`);
          break;
      }
      
      console.log('');
    });
    
    console.log('='.repeat(70));
  }

  /**
   * 查看变更历史
   */
  showHistory(scaleId) {
    console.log(`\n📜 变更历史: ${scaleId}\n`);
    console.log('='.repeat(70));
    
    const records = this.history.records
      .filter(r => r.scaleId === scaleId)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    if (records.length === 0) {
      console.log('\n暂无变更历史');
      return;
    }
    
    console.log(`\n共 ${records.length} 条记录：\n`);
    
    records.forEach((record, index) => {
      const date = new Date(record.timestamp);
      console.log(`${index + 1}. [${date.toLocaleString()}]`);
      console.log(`   操作: ${record.action}`);
      console.log(`   版本: ${record.version}`);
      
      if (record.message) {
        console.log(`   说明: ${record.message}`);
      }
      
      if (record.changeType) {
        console.log(`   类型: ${this.config.changeTypes[record.changeType]}`);
      }
      
      console.log('');
    });
    
    console.log('='.repeat(70));
  }

  /**
   * 回退到指定版本
   */
  rollback(scaleId, version) {
    console.log(`\n⏪ 回退版本: ${scaleId} → v${version}\n`);
    
    const scaleInfo = this.manifest.scales[scaleId];
    
    if (!scaleInfo) {
      console.log(`❌ 该量表未初始化版本管理`);
      return false;
    }
    
    const versionExists = scaleInfo.versions.find(v => v.version === version);
    
    if (!versionExists) {
      console.log(`❌ 版本 ${version} 不存在`);
      console.log(`   可用版本: ${scaleInfo.versions.map(v => v.version).join(', ')}`);
      return false;
    }
    
    // 确认操作
    console.log(`   当前版本: ${scaleInfo.currentVersion}`);
    console.log(`   目标版本: ${version}`);
    console.log(`   ⚠️  此操作将覆盖当前的量表文件\n`);
    
    // 复制版本文件
    const versionFile = path.join(this.config.versionsDir, scaleId, `${version}.json`);
    const scaleFile = path.join(this.config.scalesDir, `${scaleId}.json`);
    
    fs.copyFileSync(versionFile, scaleFile);
    
    // 更新清单
    scaleInfo.currentVersion = version;
    scaleInfo.lastUpdated = new Date().toISOString();
    this.saveManifest();
    
    // 添加历史记录
    this.addHistoryRecord(scaleId, 'rollback', version, {
      message: `回退到版本 ${version}`
    });
    
    console.log(`✅ 回退成功`);
    console.log(`   当前版本: ${version}`);
    
    return true;
  }
}

// ============================================================================
// 命令行接口
// ============================================================================

function printUsage() {
  console.log(`
量表版本管理工具

使用方法:
  node tools/scale-version-manager.js <command> [options]

命令:
  list                              列出所有量表及其版本
  init <scaleId>                    初始化量表版本管理
  info <scaleId>                    查看量表版本信息
  bump <scaleId> <type> [message]   升级版本 (type: major/minor/patch)
  compare <scaleId> <v1> <v2>       比较两个版本
  history <scaleId>                 查看变更历史
  rollback <scaleId> <version>      回退到指定版本

示例:
  # 列出所有量表
  node tools/scale-version-manager.js list
  
  # 初始化量表
  node tools/scale-version-manager.js init phq9
  
  # 升级小版本
  node tools/scale-version-manager.js bump phq9 minor "添加新题目"
  
  # 比较版本
  node tools/scale-version-manager.js compare phq9 1.0.0 1.1.0
  
  # 查看历史
  node tools/scale-version-manager.js history phq9
  
  # 回退版本
  node tools/scale-version-manager.js rollback phq9 1.0.0
  `);
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    printUsage();
    process.exit(0);
  }
  
  const command = args[0];
  const manager = new ScaleVersionManager(CONFIG);
  
  switch (command) {
    case 'list':
      manager.listScales();
      break;
      
    case 'init':
      if (args.length < 2) {
        console.log('❌ 缺少量表ID参数');
        console.log('   使用方法: init <scaleId>');
        process.exit(1);
      }
      manager.initScale(args[1]);
      break;
      
    case 'info':
      if (args.length < 2) {
        console.log('❌ 缺少量表ID参数');
        console.log('   使用方法: info <scaleId>');
        process.exit(1);
      }
      manager.showInfo(args[1]);
      break;
      
    case 'bump':
      if (args.length < 3) {
        console.log('❌ 缺少参数');
        console.log('   使用方法: bump <scaleId> <type> [message]');
        process.exit(1);
      }
      manager.bump(args[1], args[2], args[3] || '');
      break;
      
    case 'compare':
      if (args.length < 4) {
        console.log('❌ 缺少参数');
        console.log('   使用方法: compare <scaleId> <version1> <version2>');
        process.exit(1);
      }
      manager.compare(args[1], args[2], args[3]);
      break;
      
    case 'history':
      if (args.length < 2) {
        console.log('❌ 缺少量表ID参数');
        console.log('   使用方法: history <scaleId>');
        process.exit(1);
      }
      manager.showHistory(args[1]);
      break;
      
    case 'rollback':
      if (args.length < 3) {
        console.log('❌ 缺少参数');
        console.log('   使用方法: rollback <scaleId> <version>');
        process.exit(1);
      }
      manager.rollback(args[1], args[2]);
      break;
      
    default:
      console.log(`❌ 未知命令: ${command}`);
      printUsage();
      process.exit(1);
  }
}

// 执行
if (require.main === module) {
  main();
}

module.exports = ScaleVersionManager;

