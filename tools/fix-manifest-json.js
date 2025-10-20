/**
 * 修复manifest.json文件
 * 移除JSON中的注释使其能够正确解析
 */

const fs = require('fs');
const path = require('path');

const TAG = '[Manifest修复]';

function removeJsonComments(jsonString) {
  // 移除单行注释 // 
  jsonString = jsonString.replace(/\/\/.*$/gm, '');
  
  // 移除多行注释 /* */
  jsonString = jsonString.replace(/\/\*[\s\S]*?\*\//g, '');
  
  // 移除末尾逗号
  jsonString = jsonString.replace(/,\s*}/g, '}');
  jsonString = jsonString.replace(/,\s*]/g, ']');
  
  return jsonString;
}

function fixManifest() {
  console.log(TAG, '开始修复manifest.json...');
  
  const manifestPath = path.resolve('manifest.json');
  const backupPath = path.resolve('manifest.json.backup');
  
  try {
    // 读取原文件
    const content = fs.readFileSync(manifestPath, 'utf8');
    
    // 备份原文件
    fs.writeFileSync(backupPath, content, 'utf8');
    console.log(TAG, '已备份至:', backupPath);
    
    // 移除注释
    const cleanContent = removeJsonComments(content);
    
    // 验证JSON格式
    try {
      const jsonObj = JSON.parse(cleanContent);
      console.log(TAG, 'JSON解析成功');
      
      // 确保必要字段存在
      if (!jsonObj['mp-weixin']) {
        jsonObj['mp-weixin'] = {
          appid: '',
          setting: {
            urlCheck: false,
            es6: true,
            postcss: true,
            minified: true
          },
          usingComponents: true,
          optimization: {
            subPackages: true
          }
        };
        console.log(TAG, '添加小程序配置');
      }
      
      // 写回文件（格式化的JSON）
      fs.writeFileSync(manifestPath, JSON.stringify(jsonObj, null, 4), 'utf8');
      console.log(TAG, '✅ manifest.json修复成功');
      
      return { success: true, message: '修复成功' };
      
    } catch (parseError) {
      console.error(TAG, '❌ JSON解析失败:', parseError.message);
      
      // 尝试创建一个最小可用的manifest.json
      const minimalManifest = {
        name: '翎心',
        appid: '__UNI__82051A6',
        description: 'CraneHeart心理健康小程序',
        versionName: '1.0.0',
        versionCode: '100',
        transformPx: false,
        'app-plus': {
          usingComponents: true,
          nvueStyleCompiler: 'uni-app',
          compilerVersion: 3,
          splashscreen: {
            alwaysShowBeforeRender: true,
            waiting: true,
            autoclose: true,
            delay: 0
          }
        },
        quickapp: {},
        'mp-weixin': {
          appid: '',
          setting: {
            urlCheck: false,
            es6: true,
            postcss: true,
            minified: true,
            newFeature: true,
            coverView: true,
            autoAudits: false,
            showShadowRootInWxmlPanel: true,
            scopeDataCheck: false,
            checkInvalidKey: true,
            checkSiteMap: true,
            uploadWithSourceMap: true,
            babelSetting: {
              ignore: [],
              disablePlugins: [],
              outputPath: ''
            },
            useCompilerModule: false,
            userConfirmedUseCompilerModuleSwitch: false
          },
          usingComponents: true,
          optimization: {
            subPackages: true
          },
          uniStatistics: {
            enable: false
          }
        },
        'mp-alipay': {
          usingComponents: true,
          uniStatistics: {
            enable: false
          }
        },
        'mp-baidu': {
          usingComponents: true,
          uniStatistics: {
            enable: false
          }
        },
        'mp-toutiao': {
          usingComponents: true,
          uniStatistics: {
            enable: false
          }
        },
        'mp-qq': {
          usingComponents: true,
          uniStatistics: {
            enable: false
          }
        },
        h5: {
          title: '翎心',
          template: '',
          router: {
            mode: 'hash',
            base: ''
          },
          devServer: {
            port: 8080,
            disableHostCheck: true,
            https: false
          },
          uniStatistics: {
            enable: false
          }
        },
        vueVersion: '2',
        uniStatistics: {
          enable: false,
          version: '2'
        }
      };
      
      fs.writeFileSync(manifestPath, JSON.stringify(minimalManifest, null, 4), 'utf8');
      console.log(TAG, '✅ 已创建最小可用的manifest.json');
      
      return { success: true, message: '已创建新的manifest.json' };
    }
    
  } catch (error) {
    console.error(TAG, '❌ 修复失败:', error);
    return { success: false, message: error.message };
  }
}

// 主函数
function main() {
  console.log(TAG, '========== manifest.json修复开始 ==========');
  
  const result = fixManifest();
  
  if (result.success) {
    console.log(TAG, '✅', result.message);
  } else {
    console.log(TAG, '❌', result.message);
    process.exit(1);
  }
  
  console.log(TAG, '========== manifest.json修复完成 ==========');
}

// 执行
main();
