#!/usr/bin/env node

/**
 * API文档自动生成工具
 * 
 * 功能：
 * 1. 扫描所有云函数
 * 2. 解析云函数代码结构
 * 3. 提取参数、返回值、错误码
 * 4. 生成Markdown格式API文档
 * 5. 生成Postman集合
 * 6. 生成OpenAPI (Swagger) 规范
 */

const fs = require('fs');
const path = require('path');

// 配置
const config = {
  cloudFunctionsDir: 'uniCloud-aliyun/cloudfunctions',
  outputDir: 'docs/api',
  excludeFunctions: ['common'],
  
  // 文档模板
  template: {
    title: '# {{name}} API文档',
    description: '## 基本信息\n\n- **云函数名称**: `{{name}}`\n- **功能描述**: {{description}}\n- **请求方式**: uniCloud.callFunction\n- **认证要求**: {{authRequired}}\n- **限流策略**: {{rateLimit}}',
    parameters: '## 请求参数\n\n{{parameters}}',
    response: '## 响应格式\n\n{{response}}',
    errors: '## 错误码\n\n{{errors}}',
    examples: '## 使用示例\n\n{{examples}}'
  }
};

// 结果存储
const apiDocs = [];

/**
 * 扫描云函数目录
 */
function scanCloudFunctions() {
  const functionsPath = path.join(process.cwd(), config.cloudFunctionsDir);
  
  if (!fs.existsSync(functionsPath)) {
    console.error(`❌ 云函数目录不存在: ${functionsPath}`);
    return;
  }
  
  const folders = fs.readdirSync(functionsPath);
  
  folders.forEach(folder => {
    if (config.excludeFunctions.includes(folder)) {
      return;
    }
    
    const functionPath = path.join(functionsPath, folder);
    const stat = fs.statSync(functionPath);
    
    if (stat.isDirectory()) {
      const indexPath = path.join(functionPath, 'index.js');
      if (fs.existsSync(indexPath)) {
        console.log(`📄 处理云函数: ${folder}`);
        parseCloudFunction(folder, indexPath);
      }
    }
  });
}

/**
 * 解析云函数代码
 */
function parseCloudFunction(name, filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // 提取信息
    const info = {
      name,
      description: extractDescription(content),
      parameters: extractParameters(content),
      response: extractResponse(content),
      errors: extractErrors(content),
      authRequired: checkAuthRequired(content),
      rateLimit: extractRateLimit(content),
      examples: extractExamples(content)
    };
    
    apiDocs.push(info);
    
    // 生成文档
    generateMarkdownDoc(info);
    
  } catch (error) {
    console.error(`解析失败: ${name}`, error.message);
  }
}

/**
 * 提取函数描述
 */
function extractDescription(content) {
  // 查找注释中的描述
  const descMatch = content.match(/\/\*\*[\s\S]*?\*\s*(.*?)\n/);
  if (descMatch) {
    return descMatch[1].trim();
  }
  
  // 查找exports.main上方的注释
  const mainMatch = content.match(/\/\*\*([\s\S]*?)\*\/[\s\S]*?exports\.main/);
  if (mainMatch) {
    const lines = mainMatch[1].split('\n')
      .map(line => line.replace(/^\s*\*\s?/, '').trim())
      .filter(line => line && !line.startsWith('@'));
    return lines.join('\n');
  }
  
  return '待补充描述';
}

/**
 * 提取参数信息
 */
function extractParameters(content) {
  const params = [];
  
  // 查找 event 解构
  const destructMatch = content.match(/const\s*\{\s*([^}]+)\s*\}\s*=\s*event/);
  if (destructMatch) {
    const paramNames = destructMatch[1].split(',').map(p => p.trim().split('=')[0].trim());
    
    paramNames.forEach(name => {
      // 查找参数的注释说明
      const paramDocMatch = content.match(new RegExp(`@param\\s*\\{([^}]+)\\}\\s*${name}\\s*-?\\s*(.+)`));
      
      params.push({
        name,
        type: paramDocMatch ? paramDocMatch[1].trim() : 'String',
        required: !name.includes('='),
        description: paramDocMatch ? paramDocMatch[2].trim() : '待补充说明'
      });
    });
  }
  
  return params;
}

/**
 * 提取响应格式
 */
function extractResponse(content) {
  // 查找返回语句
  const returnMatches = content.match(/return\s*\{[\s\S]*?code:\s*[0-9-]+[\s\S]*?\}/g);
  
  if (!returnMatches || returnMatches.length === 0) {
    return { success: {}, error: {} };
  }
  
  // 提取成功响应（code: 0）
  const successMatch = returnMatches.find(m => /code:\s*0/.test(m));
  const errorMatch = returnMatches.find(m => /code:\s*-[0-9]/.test(m));
  
  return {
    success: successMatch ? parseReturnObject(successMatch) : {},
    error: errorMatch ? parseReturnObject(errorMatch) : {}
  };
}

/**
 * 解析返回对象
 */
function parseReturnObject(returnStr) {
  try {
    // 简化处理：提取基本结构
    const codeMatch = returnStr.match(/code:\s*([0-9-]+)/);
    const msgMatch = returnStr.match(/msg:\s*['"`]([^'"`]+)['"`]/);
    
    return {
      code: codeMatch ? codeMatch[1] : '0',
      msg: msgMatch ? msgMatch[1] : '操作成功',
      data: '待补充'
    };
  } catch (error) {
    return {};
  }
}

/**
 * 提取错误码
 */
function extractErrors(content) {
  const errors = [];
  
  // 查找所有错误码定义
  const errorMatches = content.matchAll(/code:\s*(-?\d+)[\s\S]*?msg:\s*['"`]([^'"`]+)['"`]/g);
  
  for (const match of errorMatches) {
    const code = match[1];
    const message = match[2];
    
    if (!errors.find(e => e.code === code)) {
      errors.push({
        code,
        message,
        suggestion: getSuggestionForError(code, message)
      });
    }
  }
  
  return errors;
}

/**
 * 获取错误处理建议
 */
function getSuggestionForError(code, message) {
  if (message.includes('参数')) return '检查请求参数';
  if (message.includes('token') || message.includes('认证')) return '检查用户登录状态';
  if (message.includes('权限')) return '检查用户权限';
  if (message.includes('频繁')) return '降低请求频率';
  return '请稍后重试';
}

/**
 * 检查是否需要认证
 */
function checkAuthRequired(content) {
  if (content.includes('requireAuth') || content.includes('UNI_ID_TOKEN')) {
    return '需要Token认证';
  }
  return '无需认证';
}

/**
 * 提取限流策略
 */
function extractRateLimit(content) {
  if (content.includes('rateLimit')) {
    const match = content.match(/maxRequests:\s*(\d+)/);
    if (match) {
      return `每分钟最多${match[1]}次请求`;
    }
  }
  return '无限流';
}

/**
 * 提取示例代码
 */
function extractExamples(content) {
  // 查找示例注释
  const exampleMatch = content.match(/\/\*\*[\s\S]*?@example([\s\S]*?)\*\//);
  if (exampleMatch) {
    return exampleMatch[1].trim();
  }
  return null;
}

/**
 * 生成Markdown文档
 */
function generateMarkdownDoc(info) {
  const { name, description, parameters, response, errors, authRequired, rateLimit, examples } = info;
  
  let doc = `# ${name} API文档\n\n`;
  doc += `## 基本信息\n\n`;
  doc += `- **云函数名称**: \`${name}\`\n`;
  doc += `- **功能描述**: ${description}\n`;
  doc += `- **请求方式**: uniCloud.callFunction\n`;
  doc += `- **认证要求**: ${authRequired}\n`;
  doc += `- **限流策略**: ${rateLimit}\n\n`;
  
  doc += `---\n\n`;
  
  // 参数
  if (parameters.length > 0) {
    doc += `## 请求参数\n\n`;
    doc += `| 参数名 | 类型 | 必填 | 说明 |\n`;
    doc += `|--------|------|------|------|\n`;
    parameters.forEach(p => {
      doc += `| ${p.name} | ${p.type} | ${p.required ? '是' : '否'} | ${p.description} |\n`;
    });
    doc += `\n`;
  }
  
  // 响应格式
  doc += `## 响应格式\n\n`;
  doc += `### 成功响应\n\n`;
  doc += `\`\`\`json\n`;
  doc += JSON.stringify(response.success, null, 2);
  doc += `\n\`\`\`\n\n`;
  
  if (Object.keys(response.error).length > 0) {
    doc += `### 失败响应\n\n`;
    doc += `\`\`\`json\n`;
    doc += JSON.stringify(response.error, null, 2);
    doc += `\n\`\`\`\n\n`;
  }
  
  // 错误码
  if (errors.length > 0) {
    doc += `## 错误码\n\n`;
    doc += `| 错误码 | 错误信息 | 处理建议 |\n`;
    doc += `|--------|----------|----------|\n`;
    errors.forEach(e => {
      doc += `| ${e.code} | ${e.message} | ${e.suggestion} |\n`;
    });
    doc += `\n`;
  }
  
  // 使用示例
  if (examples) {
    doc += `## 使用示例\n\n`;
    doc += `\`\`\`javascript\n${examples}\n\`\`\`\n\n`;
  } else {
    doc += `## 使用示例\n\n`;
    doc += `\`\`\`javascript\n`;
    doc += `const { result } = await uniCloud.callFunction({\n`;
    doc += `  name: '${name}',\n`;
    doc += `  data: {\n`;
    parameters.forEach((p, i) => {
      doc += `    ${p.name}: ${p.type === 'String' ? "'示例值'" : '0'}${i < parameters.length - 1 ? ',' : ''}\n`;
    });
    doc += `  }\n`;
    doc += `});\n\n`;
    doc += `console.log('结果:', result);\n`;
    doc += `\`\`\`\n\n`;
  }
  
  doc += `---\n\n`;
  doc += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`;
  doc += `**维护说明**: 本文档自动生成，手动修改可能被覆盖\n`;
  
  // 保存文档
  const outputPath = path.join(process.cwd(), config.outputDir, `${name}.md`);
  ensureDir(config.outputDir);
  fs.writeFileSync(outputPath, doc, 'utf-8');
  console.log(`  ✅ 生成文档: ${outputPath}`);
}

/**
 * 生成Postman集合
 */
function generatePostmanCollection() {
  const collection = {
    info: {
      name: '翎心CraneHeart API集合',
      description: '自动生成的API文档集合',
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    item: []
  };
  
  apiDocs.forEach(api => {
    const item = {
      name: api.name,
      request: {
        method: 'POST',
        header: [
          {
            key: 'Content-Type',
            value: 'application/json'
          }
        ],
        body: {
          mode: 'raw',
          raw: JSON.stringify({
            name: api.name,
            data: api.parameters.reduce((acc, p) => {
              acc[p.name] = p.type === 'String' ? '示例值' : 0;
              return acc;
            }, {})
          }, null, 2)
        },
        url: {
          raw: '{{unicloud_url}}',
          host: ['{{unicloud_url}}']
        },
        description: api.description
      },
      response: []
    };
    
    collection.item.push(item);
  });
  
  // 保存Postman集合
  const postmanPath = path.join(process.cwd(), config.outputDir, 'postman-collection.json');
  fs.writeFileSync(postmanPath, JSON.stringify(collection, null, 2), 'utf-8');
  console.log(`\n📦 Postman集合已生成: ${postmanPath}`);
}

/**
 * 生成OpenAPI规范
 */
function generateOpenAPISpec() {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: '翎心CraneHeart API',
      version: '1.0.0',
      description: '翎心心理健康平台API文档'
    },
    servers: [
      {
        url: 'https://unicloud.dcloud.net.cn',
        description: 'uniCloud服务器'
      }
    ],
    paths: {}
  };
  
  apiDocs.forEach(api => {
    const pathKey = `/cloudfunction/${api.name}`;
    
    spec.paths[pathKey] = {
      post: {
        summary: api.description,
        tags: [getCategoryFromName(api.name)],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: api.parameters.reduce((acc, p) => {
                  acc[p.name] = {
                    type: p.type.toLowerCase(),
                    description: p.description
                  };
                  return acc;
                }, {}),
                required: api.parameters.filter(p => p.required).map(p => p.name)
              }
            }
          }
        },
        responses: {
          '200': {
            description: '成功响应',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    code: { type: 'integer' },
                    msg: { type: 'string' },
                    data: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      }
    };
  });
  
  // 保存OpenAPI规范
  const openApiPath = path.join(process.cwd(), config.outputDir, 'openapi.json');
  fs.writeFileSync(openApiPath, JSON.stringify(spec, null, 2), 'utf-8');
  console.log(`📄 OpenAPI规范已生成: ${openApiPath}\n`);
}

/**
 * 生成汇总索引
 */
function generateIndexDoc() {
  let indexDoc = `# API文档索引\n\n`;
  indexDoc += `**生成时间**: ${new Date().toLocaleString('zh-CN')}\n`;
  indexDoc += `**云函数数量**: ${apiDocs.length}\n\n`;
  indexDoc += `---\n\n`;
  
  // 按分类分组
  const categories = {
    '认证模块': [],
    '评估模块': [],
    'AI对话模块': [],
    'CDK模块': [],
    '社区模块': [],
    '其他模块': []
  };
  
  apiDocs.forEach(api => {
    const category = getCategoryFromName(api.name);
    if (categories[category]) {
      categories[category].push(api);
    } else {
      categories['其他模块'].push(api);
    }
  });
  
  // 生成分类列表
  Object.entries(categories).forEach(([category, apis]) => {
    if (apis.length === 0) return;
    
    indexDoc += `## ${category}\n\n`;
    apis.forEach(api => {
      indexDoc += `- [${api.name}](./${api.name}.md) - ${api.description}\n`;
    });
    indexDoc += `\n`;
  });
  
  // 保存索引文档
  const indexPath = path.join(process.cwd(), config.outputDir, 'README.md');
  fs.writeFileSync(indexPath, indexDoc, 'utf-8');
  console.log(`📚 索引文档已生成: ${indexPath}`);
}

/**
 * 根据名称判断分类
 */
function getCategoryFromName(name) {
  if (name.startsWith('auth-')) return '认证模块';
  if (name.startsWith('assessment-') || name.includes('stress-analyzer')) return '评估模块';
  if (name.includes('chat') || name.includes('ai')) return 'AI对话模块';
  if (name.startsWith('cdk-')) return 'CDK模块';
  if (name.startsWith('community-')) return '社区模块';
  return '其他模块';
}

/**
 * 确保目录存在
 */
function ensureDir(dir) {
  const fullPath = path.join(process.cwd(), dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
}

/**
 * 主函数
 */
function main() {
  console.log('🚀 开始生成API文档...\n');
  
  // 扫描云函数
  scanCloudFunctions();
  
  // 生成Postman集合
  if (apiDocs.length > 0) {
    generatePostmanCollection();
    
    // 生成OpenAPI规范
    generateOpenAPISpec();
    
    // 生成索引
    generateIndexDoc();
  }
  
  console.log(`\n✅ 完成！共生成 ${apiDocs.length} 个API文档\n`);
}

// 执行
if (require.main === module) {
  main();
}

module.exports = { scanCloudFunctions, generateMarkdownDoc, config };

