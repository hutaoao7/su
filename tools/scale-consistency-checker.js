/**
 * 量表数据一致性检查工具
 * 用于跨量表检查数据一致性、命名规范、元数据完整性
 * 
 * 功能：
 * 1. 检查量表JSON与数据库元数据的一致性
 * 2. 检查量表命名规范（ID、文件名）
 * 3. 检查评分规则合理性
 * 4. 检查题目数量一致性
 * 5. 生成详细的一致性报告
 * 
 * 使用方法：
 * node tools/scale-consistency-checker.js
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// 配置
// ============================================================================

const CONFIG = {
  scalesDir: path.join(__dirname, '../static/scales'),
  dbSchemaFile: path.join(__dirname, '../docs/database/schema-assessments.md'),
  outputReportFile: path.join(__dirname, '../docs/SCALE-CONSISTENCY-REPORT.md'),
  
  // 量表元数据（从数据库迁移脚本提取）
  dbScaleMetadata: [
    { scale_id: 'phq9', scale_name: 'PHQ-9 抑郁症筛查量表', question_count: 9, category: 'depression' },
    { scale_id: 'gad7', scale_name: 'GAD-7 广泛性焦虑量表', question_count: 7, category: 'anxiety' },
    { scale_id: 'pss10', scale_name: 'PSS-10 知觉压力量表', question_count: 10, category: 'stress' },
    { scale_id: 'who5', scale_name: 'WHO-5 幸福感指数', question_count: 5, category: 'wellbeing' },
    { scale_id: 'k6', scale_name: 'K6 心理困扰量表', question_count: 6, category: 'distress' },
    { scale_id: 'k10', scale_name: 'K10 心理困扰量表', question_count: 10, category: 'distress' },
    { scale_id: 'asq4', scale_name: 'ASQ-4 自杀风险筛查', question_count: 4, category: 'crisis' },
    { scale_id: 'academic_stress_8', scale_name: '学业压力量表（8题）', question_count: 8, category: 'stress' },
    { scale_id: 'youth_social_anxiety_6', scale_name: '青少年社交焦虑量表（6题）', question_count: 6, category: 'anxiety' },
    { scale_id: 'sleep_health_6', scale_name: '睡眠健康量表（6题）', question_count: 6, category: 'sleep' },
    { scale_id: 'mini_spin3', scale_name: 'Mini-SPIN 社交恐惧症筛查', question_count: 3, category: 'anxiety' },
    { scale_id: 'spin17', scale_name: 'SPIN-17 社交恐惧症量表', question_count: 17, category: 'anxiety' },
    { scale_id: 'essa16', scale_name: 'ESSA-16 学业倦怠量表', question_count: 16, category: 'burnout' },
    { scale_id: 'psqi19', scale_name: 'PSQI-19 睡眠质量指数', question_count: 19, category: 'sleep' }
  ],
  
  // 命名规范
  namingConvention: {
    idPattern: /^[a-z0-9_]+$/,  // ID只能包含小写字母、数字、下划线
    filePattern: /^[a-z0-9_]+\.json$/  // 文件名只能包含小写字母、数字、下划线和.json后缀
  }
};

// ============================================================================
// 数据模型
// ============================================================================

class ConsistencyIssue {
  constructor(level, category, scaleId, field, message, suggestion = null) {
    this.level = level;  // 'error', 'warning', 'info'
    this.category = category;  // 'metadata', 'naming', 'scoring', 'count', 'format'
    this.scaleId = scaleId;
    this.field = field;
    this.message = message;
    this.suggestion = suggestion;
  }
}

class ConsistencyReport {
  constructor() {
    this.issues = [];
    this.scaleResults = new Map();
    this.summary = {
      totalScales: 0,
      validScales: 0,
      errorCount: 0,
      warningCount: 0,
      infoCount: 0
    };
  }

  addIssue(issue) {
    this.issues.push(issue);
    
    // 更新统计
    if (issue.level === 'error') this.summary.errorCount++;
    else if (issue.level === 'warning') this.summary.warningCount++;
    else if (issue.level === 'info') this.summary.infoCount++;
  }

  setScaleResult(scaleId, valid) {
    this.scaleResults.set(scaleId, valid);
    if (valid) this.summary.validScales++;
  }

  getIssuesByScale(scaleId) {
    return this.issues.filter(issue => issue.scaleId === scaleId);
  }

  getIssuesByLevel(level) {
    return this.issues.filter(issue => issue.level === level);
  }

  hasErrors() {
    return this.summary.errorCount > 0;
  }
}

// ============================================================================
// 检查器类
// ============================================================================

class ScaleConsistencyChecker {
  constructor(config) {
    this.config = config;
    this.report = new ConsistencyReport();
    this.scaleFiles = [];
    this.scaleData = new Map();
  }

  /**
   * 运行完整检查
   */
  async run() {
    console.log('🔍 量表数据一致性检查工具\n');
    console.log('=' .repeat(70));
    
    // 步骤1: 扫描量表文件
    this.scanScaleFiles();
    
    // 步骤2: 加载量表数据
    this.loadScaleData();
    
    // 步骤3: 执行各项检查
    this.checkFileNaming();
    this.checkMetadataConsistency();
    this.checkQuestionCount();
    this.checkScoringRules();
    this.checkFormatUniformity();
    this.checkMissingScales();
    
    // 步骤4: 生成报告
    this.printConsoleReport();
    this.generateMarkdownReport();
    
    console.log('\n' + '='.repeat(70));
    console.log('✅ 检查完成！');
    console.log(`📄 详细报告已保存至: ${this.config.outputReportFile}`);
    
    return this.report;
  }

  /**
   * 扫描量表文件
   */
  scanScaleFiles() {
    console.log('\n📁 步骤1: 扫描量表文件...');
    
    if (!fs.existsSync(this.config.scalesDir)) {
      console.error(`❌ 量表目录不存在: ${this.config.scalesDir}`);
      process.exit(1);
    }
    
    const files = fs.readdirSync(this.config.scalesDir);
    this.scaleFiles = files.filter(f => f.endsWith('.json'));
    
    console.log(`   找到 ${this.scaleFiles.length} 个量表文件`);
    this.report.summary.totalScales = this.scaleFiles.length;
  }

  /**
   * 加载量表数据
   */
  loadScaleData() {
    console.log('\n📖 步骤2: 加载量表数据...');
    
    this.scaleFiles.forEach(file => {
      const filePath = path.join(this.config.scalesDir, file);
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(content);
        const scaleId = file.replace('.json', '');
        this.scaleData.set(scaleId, data);
        console.log(`   ✓ ${file}`);
      } catch (err) {
        console.log(`   ✗ ${file} - JSON解析失败`);
        this.report.addIssue(new ConsistencyIssue(
          'error',
          'format',
          file,
          'json',
          `JSON解析失败: ${err.message}`,
          '检查JSON格式是否正确'
        ));
      }
    });
  }

  /**
   * 检查文件命名规范
   */
  checkFileNaming() {
    console.log('\n🏷️  步骤3: 检查文件命名规范...');
    
    this.scaleFiles.forEach(file => {
      const scaleId = file.replace('.json', '');
      
      // 检查文件名格式
      if (!this.config.namingConvention.filePattern.test(file)) {
        this.report.addIssue(new ConsistencyIssue(
          'warning',
          'naming',
          scaleId,
          'filename',
          `文件名不符合命名规范: ${file}`,
          '文件名应只包含小写字母、数字、下划线'
        ));
      }
      
      // 检查量表ID格式
      if (!this.config.namingConvention.idPattern.test(scaleId)) {
        this.report.addIssue(new ConsistencyIssue(
          'warning',
          'naming',
          scaleId,
          'scale_id',
          `量表ID不符合命名规范: ${scaleId}`,
          'ID应只包含小写字母、数字、下划线'
        ));
      }
      
      // 检查文件名与JSON中的ID是否一致
      const data = this.scaleData.get(scaleId);
      if (data && data.id && data.id !== scaleId) {
        this.report.addIssue(new ConsistencyIssue(
          'error',
          'naming',
          scaleId,
          'id',
          `文件名(${scaleId})与JSON中的ID(${data.id})不一致`,
          '确保文件名与JSON中的id字段一致'
        ));
      }
    });
  }

  /**
   * 检查元数据一致性
   */
  checkMetadataConsistency() {
    console.log('\n📋 步骤4: 检查元数据一致性...');
    
    this.config.dbScaleMetadata.forEach(dbMeta => {
      const scaleId = dbMeta.scale_id;
      const fileExists = this.scaleFiles.includes(`${scaleId}.json`);
      
      if (!fileExists) {
        this.report.addIssue(new ConsistencyIssue(
          'error',
          'metadata',
          scaleId,
          'file',
          `数据库中定义了量表 ${scaleId}，但找不到对应的JSON文件`,
          `创建文件: static/scales/${scaleId}.json`
        ));
        return;
      }
      
      const data = this.scaleData.get(scaleId);
      if (!data) return;
      
      // 检查标题一致性
      if (data.title && !data.title.includes(dbMeta.scale_name.split(/[（(]/)[0].trim())) {
        this.report.addIssue(new ConsistencyIssue(
          'warning',
          'metadata',
          scaleId,
          'title',
          `量表名称不一致\n      JSON: ${data.title}\n      DB:   ${dbMeta.scale_name}`,
          '确保JSON中的title与数据库中的scale_name一致'
        ));
      }
    });
  }

  /**
   * 检查题目数量一致性
   */
  checkQuestionCount() {
    console.log('\n🔢 步骤5: 检查题目数量一致性...');
    
    this.config.dbScaleMetadata.forEach(dbMeta => {
      const scaleId = dbMeta.scale_id;
      const data = this.scaleData.get(scaleId);
      
      if (!data) return;
      
      // 获取实际题目数量（兼容不同格式）
      let actualCount = 0;
      if (data.items) {
        actualCount = data.items.length;
      } else if (data.questions) {
        actualCount = data.questions.length;
      }
      
      const expectedCount = dbMeta.question_count;
      
      if (actualCount !== expectedCount) {
        this.report.addIssue(new ConsistencyIssue(
          'error',
          'count',
          scaleId,
          'question_count',
          `题目数量不匹配: 实际${actualCount}题，期望${expectedCount}题`,
          '确保JSON中的题目数量与数据库定义一致'
        ));
      } else {
        console.log(`   ✓ ${scaleId}: ${actualCount}题`);
      }
    });
  }

  /**
   * 检查评分规则合理性
   */
  checkScoringRules() {
    console.log('\n📊 步骤6: 检查评分规则合理性...');
    
    this.scaleData.forEach((data, scaleId) => {
      if (!data.scoring) {
        this.report.addIssue(new ConsistencyIssue(
          'warning',
          'scoring',
          scaleId,
          'scoring',
          '缺少评分规则定义',
          '添加scoring字段定义评分规则'
        ));
        return;
      }
      
      const scoring = data.scoring;
      
      // 检查range字段
      if (scoring.range) {
        const [min, max] = scoring.range;
        
        // 检查最小值是否为0
        if (min !== 0) {
          this.report.addIssue(new ConsistencyIssue(
            'info',
            'scoring',
            scaleId,
            'range.min',
            `分数范围最小值不是0: ${min}`,
            null
          ));
        }
        
        // 检查bands/levels是否覆盖完整范围
        const bands = scoring.bands || scoring.levels;
        if (bands) {
          const firstBand = bands[0];
          const lastBand = bands[bands.length - 1];
          
          if (firstBand.range[0] !== min) {
            this.report.addIssue(new ConsistencyIssue(
              'warning',
              'scoring',
              scaleId,
              'bands',
              `首个等级范围不是从${min}开始`,
              '确保等级范围覆盖完整分数范围'
            ));
          }
          
          if (lastBand.range[1] !== max) {
            this.report.addIssue(new ConsistencyIssue(
              'warning',
              'scoring',
              scaleId,
              'bands',
              `最后等级范围不是到${max}结束`,
              '确保等级范围覆盖完整分数范围'
            ));
          }
          
          // 检查等级范围是否连续
          for (let i = 0; i < bands.length - 1; i++) {
            const current = bands[i];
            const next = bands[i + 1];
            
            if (current.range[1] + 1 !== next.range[0]) {
              this.report.addIssue(new ConsistencyIssue(
                'warning',
                'scoring',
                scaleId,
                'bands',
                `等级范围不连续: [${current.range[0]}, ${current.range[1]}] -> [${next.range[0]}, ${next.range[1]}]`,
                '等级范围应该连续，无缝覆盖所有分数'
              ));
            }
          }
        }
      }
      
      // 检查max字段
      if (scoring.max !== undefined) {
        const scale = data.scale || data.values;
        const items = data.items || data.questions;
        
        if (scale && items) {
          const maxPossible = Math.max(...scale) * items.length;
          
          if (scoring.max !== maxPossible) {
            this.report.addIssue(new ConsistencyIssue(
              'warning',
              'scoring',
              scaleId,
              'max',
              `最高分不匹配: 定义为${scoring.max}，计算值为${maxPossible}`,
              `根据scale和items计算：max(${scale}) × ${items.length} = ${maxPossible}`
            ));
          }
        }
      }
    });
  }

  /**
   * 检查格式统一性
   */
  checkFormatUniformity() {
    console.log('\n📐 步骤7: 检查格式统一性...');
    
    // 统计不同的字段命名
    const fieldUsage = {
      questions: [],
      items: [],
      bands: [],
      levels: [],
      values: [],
      scale: []
    };
    
    this.scaleData.forEach((data, scaleId) => {
      if (data.questions) fieldUsage.questions.push(scaleId);
      if (data.items) fieldUsage.items.push(scaleId);
      if (data.scoring?.bands) fieldUsage.bands.push(scaleId);
      if (data.scoring?.levels) fieldUsage.levels.push(scaleId);
      if (data.values) fieldUsage.values.push(scaleId);
      if (data.scale) fieldUsage.scale.push(scaleId);
    });
    
    // 检查不一致的命名
    if (fieldUsage.questions.length > 0 && fieldUsage.items.length > 0) {
      this.report.addIssue(new ConsistencyIssue(
        'warning',
        'format',
        'all',
        'questions_vs_items',
        `题目字段命名不统一：${fieldUsage.questions.length}个使用'questions'，${fieldUsage.items.length}个使用'items'`,
        '建议统一使用一种命名（推荐：questions）'
      ));
    }
    
    if (fieldUsage.bands.length > 0 && fieldUsage.levels.length > 0) {
      this.report.addIssue(new ConsistencyIssue(
        'warning',
        'format',
        'all',
        'bands_vs_levels',
        `等级字段命名不统一：${fieldUsage.bands.length}个使用'bands'，${fieldUsage.levels.length}个使用'levels'`,
        '建议统一使用一种命名（推荐：levels）'
      ));
    }
    
    if (fieldUsage.values.length > 0 && fieldUsage.scale.length > 0) {
      this.report.addIssue(new ConsistencyIssue(
        'info',
        'format',
        'all',
        'values_vs_scale',
        `分值字段命名不统一：${fieldUsage.values.length}个使用'values'，${fieldUsage.scale.length}个使用'scale'`,
        '建议统一使用一种命名（推荐：values）'
      ));
    }
  }

  /**
   * 检查缺失的量表
   */
  checkMissingScales() {
    console.log('\n❓ 步骤8: 检查缺失的量表...');
    
    const fileScaleIds = Array.from(this.scaleData.keys());
    const dbScaleIds = this.config.dbScaleMetadata.map(m => m.scale_id);
    
    // 检查数据库中有但文件中没有的
    dbScaleIds.forEach(id => {
      if (!fileScaleIds.includes(id)) {
        console.log(`   ✗ 缺失: ${id}`);
      }
    });
    
    // 检查文件中有但数据库中没有的
    fileScaleIds.forEach(id => {
      if (!dbScaleIds.includes(id)) {
        this.report.addIssue(new ConsistencyIssue(
          'warning',
          'metadata',
          id,
          'db_missing',
          `JSON文件存在但数据库中未定义元数据`,
          `在数据库迁移脚本中添加 ${id} 的元数据`
        ));
      }
    });
  }

  /**
   * 打印控制台报告
   */
  printConsoleReport() {
    console.log('\n\n' + '='.repeat(70));
    console.log('📊 一致性检查报告汇总');
    console.log('='.repeat(70));
    
    console.log('\n统计信息:');
    console.log(`  总量表数: ${this.report.summary.totalScales}`);
    console.log(`  有效量表: ${this.report.summary.validScales}`);
    console.log(`  错误数量: ${this.report.summary.errorCount}`);
    console.log(`  警告数量: ${this.report.summary.warningCount}`);
    console.log(`  提示数量: ${this.report.summary.infoCount}`);
    
    if (this.report.summary.errorCount > 0) {
      console.log('\n❌ 发现错误:');
      this.report.getIssuesByLevel('error').forEach((issue, index) => {
        console.log(`\n  ${index + 1}. [${issue.scaleId}] ${issue.field}`);
        console.log(`     ${issue.message}`);
        if (issue.suggestion) {
          console.log(`     💡 建议: ${issue.suggestion}`);
        }
      });
    }
    
    if (this.report.summary.warningCount > 0) {
      console.log('\n⚠️  发现警告:');
      this.report.getIssuesByLevel('warning').slice(0, 5).forEach((issue, index) => {
        console.log(`\n  ${index + 1}. [${issue.scaleId}] ${issue.field}`);
        console.log(`     ${issue.message}`);
      });
      
      if (this.report.summary.warningCount > 5) {
        console.log(`\n  ... 还有 ${this.report.summary.warningCount - 5} 个警告（详见报告文件）`);
      }
    }
  }

  /**
   * 生成Markdown报告
   */
  generateMarkdownReport() {
    const lines = [];
    
    lines.push('# 量表数据一致性检查报告');
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toISOString()}`);
    lines.push(`**检查工具**: scale-consistency-checker.js`);
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // 汇总统计
    lines.push('## 📊 汇总统计');
    lines.push('');
    lines.push('| 项目 | 数量 |');
    lines.push('|------|------|');
    lines.push(`| 总量表数 | ${this.report.summary.totalScales} |`);
    lines.push(`| 有效量表 | ${this.report.summary.validScales} |`);
    lines.push(`| 错误数量 | ${this.report.summary.errorCount} |`);
    lines.push(`| 警告数量 | ${this.report.summary.warningCount} |`);
    lines.push(`| 提示数量 | ${this.report.summary.infoCount} |`);
    lines.push('');
    
    // 结论
    lines.push('## 🎯 检查结论');
    lines.push('');
    if (this.report.summary.errorCount === 0) {
      lines.push('✅ **通过** - 未发现严重错误');
    } else {
      lines.push('❌ **未通过** - 发现严重错误，需要修复');
    }
    lines.push('');
    lines.push('---');
    lines.push('');
    
    // 问题详情（按类别）
    const categories = ['error', 'warning', 'info'];
    const categoryNames = { error: '错误', warning: '警告', info: '提示' };
    const categoryIcons = { error: '❌', warning: '⚠️', info: 'ℹ️' };
    
    categories.forEach(level => {
      const issues = this.report.getIssuesByLevel(level);
      if (issues.length === 0) return;
      
      lines.push(`## ${categoryIcons[level]} ${categoryNames[level]}（${issues.length}个）`);
      lines.push('');
      
      // 按量表分组
      const byScale = new Map();
      issues.forEach(issue => {
        if (!byScale.has(issue.scaleId)) {
          byScale.set(issue.scaleId, []);
        }
        byScale.get(issue.scaleId).push(issue);
      });
      
      byScale.forEach((scaleIssues, scaleId) => {
        lines.push(`### ${scaleId}`);
        lines.push('');
        
        scaleIssues.forEach((issue, index) => {
          lines.push(`${index + 1}. **${issue.field}**: ${issue.message}`);
          if (issue.suggestion) {
            lines.push(`   - 💡 建议: ${issue.suggestion}`);
          }
          lines.push('');
        });
      });
    });
    
    // 量表清单
    lines.push('---');
    lines.push('');
    lines.push('## 📋 量表清单');
    lines.push('');
    lines.push('| 量表ID | JSON文件 | 数据库元数据 | 题目数量 | 状态 |');
    lines.push('|--------|----------|--------------|----------|------|');
    
    this.config.dbScaleMetadata.forEach(dbMeta => {
      const scaleId = dbMeta.scale_id;
      const hasFile = this.scaleFiles.includes(`${scaleId}.json`);
      const data = this.scaleData.get(scaleId);
      let actualCount = 0;
      if (data) {
        actualCount = (data.items || data.questions || []).length;
      }
      const expectedCount = dbMeta.question_count;
      const countMatch = actualCount === expectedCount;
      
      const status = hasFile && countMatch ? '✅' : '❌';
      
      lines.push(`| ${scaleId} | ${hasFile ? '✓' : '✗'} | ✓ | ${actualCount}/${expectedCount} | ${status} |`);
    });
    
    lines.push('');
    lines.push('---');
    lines.push('');
    lines.push('## 📌 修复建议');
    lines.push('');
    lines.push('### 高优先级（错误）');
    lines.push('');
    const errors = this.report.getIssuesByLevel('error');
    if (errors.length > 0) {
      errors.forEach((issue, index) => {
        lines.push(`${index + 1}. [${issue.scaleId}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`   - ${issue.suggestion}`);
        }
        lines.push('');
      });
    } else {
      lines.push('无');
      lines.push('');
    }
    
    lines.push('### 中优先级（警告）');
    lines.push('');
    const warnings = this.report.getIssuesByLevel('warning');
    if (warnings.length > 0) {
      warnings.slice(0, 10).forEach((issue, index) => {
        lines.push(`${index + 1}. [${issue.scaleId}] ${issue.message}`);
      });
      if (warnings.length > 10) {
        lines.push(`... 还有 ${warnings.length - 10} 个警告`);
      }
      lines.push('');
    } else {
      lines.push('无');
      lines.push('');
    }
    
    lines.push('---');
    lines.push('');
    lines.push('**报告生成**: 由 scale-consistency-checker.js 自动生成');
    lines.push('');
    
    // 写入文件
    const reportContent = lines.join('\n');
    fs.writeFileSync(this.config.outputReportFile, reportContent, 'utf-8');
  }
}

// ============================================================================
// 主函数
// ============================================================================

async function main() {
  const checker = new ScaleConsistencyChecker(CONFIG);
  const report = await checker.run();
  
  // 返回退出码
  process.exit(report.hasErrors() ? 1 : 0);
}

// 执行
if (require.main === module) {
  main().catch(err => {
    console.error('❌ 检查失败:', err);
    process.exit(1);
  });
}

module.exports = ScaleConsistencyChecker;

