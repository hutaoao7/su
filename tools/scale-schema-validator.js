/**
 * 量表JSON Schema验证工具
 * 用于验证量表JSON文件的格式是否符合规范
 * 
 * 使用方法：
 * node tools/scale-schema-validator.js <scale-file-path>
 * 或
 * npm run validate:scale <scale-file-path>
 */

const fs = require('fs');
const path = require('path');

/**
 * 量表JSON Schema定义
 */
const scaleSchema = {
  required: ['id', 'title', 'questions', 'options', 'scoring'],
  properties: {
    id: { type: 'string', description: '量表唯一标识符' },
    title: { type: 'string', description: '量表名称' },
    description: { type: 'string', description: '量表描述（可选）' },
    version: { type: 'string', description: '量表版本（可选）' },
    questions: {
      type: 'array',
      minItems: 1,
      description: '题目列表',
      items: {
        required: ['id', 'text'],
        properties: {
          id: { type: 'string', description: '题目ID' },
          text: { type: 'string', description: '题目文本' },
          type: { 
            type: 'string', 
            enum: ['select', 'time', 'number'], 
            description: '题目类型（可选，默认select）' 
          },
          field: { type: 'string', description: '字段名（用于特殊类型）' },
          reverse: { type: 'boolean', description: '是否反向计分' },
          dimension: { type: 'string', description: '所属维度（可选）' }
        }
      }
    },
    options: {
      type: 'array',
      minItems: 2,
      description: '选项列表',
      items: {
        type: 'string'
      }
    },
    values: {
      type: 'array',
      description: '选项对应的分值（可选）',
      items: {
        type: 'number'
      }
    },
    scoring: {
      required: ['max', 'levels'],
      properties: {
        max: { type: 'number', description: '最高分' },
        min: { type: 'number', description: '最低分（可选，默认0）' },
        levels: {
          type: 'array',
          minItems: 1,
          description: '等级定义',
          items: {
            required: ['level', 'range', 'label'],
            properties: {
              level: { type: 'string', description: '等级标识' },
              range: { type: 'array', description: '分数范围 [min, max]' },
              label: { type: 'string', description: '等级标签' },
              description: { type: 'string', description: '等级描述（可选）' }
            }
          }
        }
      }
    },
    dimensions: {
      type: 'array',
      description: '维度定义（可选）',
      items: {
        required: ['id', 'name'],
        properties: {
          id: { type: 'string', description: '维度ID' },
          name: { type: 'string', description: '维度名称' },
          description: { type: 'string', description: '维度描述（可选）' }
        }
      }
    }
  }
};

/**
 * 验证错误收集器
 */
class ValidationErrors {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }

  addError(path, message) {
    this.errors.push({ path, message, type: 'error' });
  }

  addWarning(path, message) {
    this.warnings.push({ path, message, type: 'warning' });
  }

  hasErrors() {
    return this.errors.length > 0;
  }

  getReport() {
    return {
      valid: !this.hasErrors(),
      errorCount: this.errors.length,
      warningCount: this.warnings.length,
      errors: this.errors,
      warnings: this.warnings
    };
  }

  printReport() {
    if (this.errors.length > 0) {
      console.log('\n❌ 验证失败，发现以下错误：\n');
      this.errors.forEach((err, index) => {
        console.log(`  ${index + 1}. [${err.path}] ${err.message}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  发现以下警告：\n');
      this.warnings.forEach((warn, index) => {
        console.log(`  ${index + 1}. [${warn.path}] ${warn.message}`);
      });
    }

    if (!this.hasErrors() && this.warnings.length === 0) {
      console.log('\n✅ 验证通过，量表格式正确！');
    }
  }
}

/**
 * 类型检查
 */
function checkType(value, expectedType) {
  if (expectedType === 'array') {
    return Array.isArray(value);
  }
  if (expectedType === 'number') {
    return typeof value === 'number' && !isNaN(value);
  }
  return typeof value === expectedType;
}

/**
 * 验证对象属性
 */
function validateObject(data, schema, errors, path = 'root') {
  // 检查必需字段
  if (schema.required) {
    schema.required.forEach(field => {
      if (!(field in data)) {
        errors.addError(path, `缺少必需字段: ${field}`);
      }
    });
  }

  // 检查属性
  if (schema.properties) {
    Object.keys(data).forEach(key => {
      const propSchema = schema.properties[key];
      const value = data[key];
      const propPath = `${path}.${key}`;

      if (!propSchema) {
        errors.addWarning(propPath, `未定义的字段: ${key}`);
        return;
      }

      // 类型检查
      if (propSchema.type && !checkType(value, propSchema.type)) {
        errors.addError(propPath, `类型错误: 期望 ${propSchema.type}, 实际 ${typeof value}`);
        return;
      }

      // 枚举检查
      if (propSchema.enum && !propSchema.enum.includes(value)) {
        errors.addError(propPath, `值不在枚举范围: ${propSchema.enum.join(', ')}`);
      }

      // 数组验证
      if (propSchema.type === 'array' && Array.isArray(value)) {
        if (propSchema.minItems && value.length < propSchema.minItems) {
          errors.addError(propPath, `数组长度不足: 至少需要 ${propSchema.minItems} 项`);
        }

        if (propSchema.items) {
          value.forEach((item, index) => {
            const itemPath = `${propPath}[${index}]`;
            if (propSchema.items.properties) {
              validateObject(item, propSchema.items, errors, itemPath);
            }
          });
        }
      }

      // 嵌套对象验证
      if (propSchema.required || propSchema.properties) {
        validateObject(value, propSchema, errors, propPath);
      }
    });
  }
}

/**
 * 业务逻辑验证
 */
function validateBusinessRules(data, errors) {
  // 验证题目ID唯一性
  const questionIds = new Set();
  data.questions.forEach((q, index) => {
    if (questionIds.has(q.id)) {
      errors.addError(`questions[${index}].id`, `题目ID重复: ${q.id}`);
    }
    questionIds.add(q.id);
  });

  // 验证options和values长度一致
  if (data.values && data.values.length !== data.options.length) {
    errors.addError('values', `values长度(${data.values.length})与options长度(${data.options.length})不一致`);
  }

  // 验证分值范围
  if (data.values) {
    const minValue = Math.min(...data.values);
    const maxValue = Math.max(...data.values);
    const totalMin = data.questions.length * minValue;
    const totalMax = data.questions.length * maxValue;

    if (data.scoring.max !== totalMax) {
      errors.addWarning('scoring.max', `建议最大分数为 ${totalMax} (当前: ${data.scoring.max})`);
    }
  }

  // 验证等级范围覆盖完整
  if (data.scoring && data.scoring.levels) {
    const levels = data.scoring.levels;
    
    // 检查范围是否连续
    for (let i = 0; i < levels.length - 1; i++) {
      const current = levels[i];
      const next = levels[i + 1];
      
      if (current.range[1] + 1 !== next.range[0]) {
        errors.addWarning(
          `scoring.levels[${i}]`, 
          `等级范围不连续: [${current.range[0]}, ${current.range[1]}] -> [${next.range[0]}, ${next.range[1]}]`
        );
      }
    }

    // 检查是否覆盖完整分数范围
    const firstLevel = levels[0];
    const lastLevel = levels[levels.length - 1];
    const minScore = data.scoring.min || 0;
    
    if (firstLevel.range[0] !== minScore) {
      errors.addWarning('scoring.levels', `首个等级范围应从 ${minScore} 开始`);
    }
    
    if (lastLevel.range[1] !== data.scoring.max) {
      errors.addWarning('scoring.levels', `最后等级范围应到 ${data.scoring.max} 结束`);
    }
  }

  // 验证维度关联
  if (data.dimensions) {
    const dimensionIds = new Set(data.dimensions.map(d => d.id));
    data.questions.forEach((q, index) => {
      if (q.dimension && !dimensionIds.has(q.dimension)) {
        errors.addError(`questions[${index}].dimension`, `引用了不存在的维度: ${q.dimension}`);
      }
    });
  }
}

/**
 * 验证量表JSON
 */
function validateScale(filePath) {
  console.log(`\n🔍 开始验证量表: ${filePath}\n`);

  const errors = new ValidationErrors();

  // 检查文件是否存在
  if (!fs.existsSync(filePath)) {
    errors.addError('file', `文件不存在: ${filePath}`);
    errors.printReport();
    return errors.getReport();
  }

  // 读取文件
  let data;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    data = JSON.parse(content);
  } catch (err) {
    errors.addError('file', `JSON解析失败: ${err.message}`);
    errors.printReport();
    return errors.getReport();
  }

  // Schema验证
  validateObject(data, scaleSchema, errors);

  // 业务逻辑验证
  if (!errors.hasErrors()) {
    validateBusinessRules(data, errors);
  }

  // 打印报告
  errors.printReport();

  // 输出统计信息
  console.log('\n📊 统计信息:');
  console.log(`  - 题目数量: ${data.questions?.length || 0}`);
  console.log(`  - 选项数量: ${data.options?.length || 0}`);
  console.log(`  - 等级数量: ${data.scoring?.levels?.length || 0}`);
  console.log(`  - 维度数量: ${data.dimensions?.length || 0}`);

  return errors.getReport();
}

/**
 * 批量验证目录下的所有量表
 */
function validateDirectory(dirPath) {
  console.log(`\n📁 批量验证目录: ${dirPath}\n`);

  if (!fs.existsSync(dirPath)) {
    console.error(`❌ 目录不存在: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  const jsonFiles = files.filter(f => f.endsWith('.json'));

  if (jsonFiles.length === 0) {
    console.log('⚠️  目录中没有找到JSON文件');
    return;
  }

  const results = [];
  jsonFiles.forEach(file => {
    const filePath = path.join(dirPath, file);
    const result = validateScale(filePath);
    results.push({ file, ...result });
    console.log('\n' + '='.repeat(60) + '\n');
  });

  // 汇总报告
  console.log('\n📋 批量验证汇总:\n');
  const validCount = results.filter(r => r.valid).length;
  const invalidCount = results.length - validCount;

  results.forEach(r => {
    const icon = r.valid ? '✅' : '❌';
    console.log(`  ${icon} ${r.file} - 错误: ${r.errorCount}, 警告: ${r.warningCount}`);
  });

  console.log(`\n  总计: ${results.length} 个文件`);
  console.log(`  有效: ${validCount}, 无效: ${invalidCount}`);
}

// 命令行入口
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
使用方法:
  node tools/scale-schema-validator.js <file-or-directory>

示例:
  # 验证单个文件
  node tools/scale-schema-validator.js static/scales/phq9.json
  
  # 验证整个目录
  node tools/scale-schema-validator.js static/scales/
    `);
    process.exit(1);
  }

  const target = args[0];
  const stat = fs.statSync(target);

  if (stat.isDirectory()) {
    validateDirectory(target);
  } else {
    const result = validateScale(target);
    process.exit(result.valid ? 0 : 1);
  }
}

// 导出验证函数
module.exports = {
  validateScale,
  validateDirectory,
  scaleSchema
};

