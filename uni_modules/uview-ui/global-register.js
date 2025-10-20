/**
 * uView组件全局注册配置
 * 确保分包中也能使用uView组件
 */

// 分包组件注册配置
const SUBPACKAGE_CONFIG = {
  // 确保分包中可以访问uView组件
  globalComponents: true,
  
  // 组件按需加载配置
  lazyLoad: false,  // 分包中不使用懒加载，避免加载问题
  
  // 组件作用域
  scope: 'global'
};

/**
 * 注册全局组件
 * @param {Object} Vue - Vue实例
 */
function registerGlobalComponents(Vue) {
  // 确保uView已经初始化
  if (!Vue.prototype.$u) {
    console.warn('[uView] 请先调用 Vue.use(uView) 初始化uView');
    return;
  }
  
  // 设置分包配置
  Vue.prototype.$u.config = Vue.prototype.$u.config || {};
  Vue.prototype.$u.config.subpackage = SUBPACKAGE_CONFIG;
  
  console.log('[uView] 全局组件注册配置已应用');
}

/**
 * 检查组件是否在分包中可用
 * @param {String} componentName - 组件名
 * @returns {Boolean}
 */
function checkComponentAvailability(componentName) {
  // 所有u-开头的组件都应该可用
  if (componentName && componentName.startsWith('u-')) {
    return true;
  }
  return false;
}

/**
 * 分包组件加载器
 * 用于处理分包中的组件加载问题
 */
const SubpackageComponentLoader = {
  /**
   * 加载组件
   * @param {String} name - 组件名
   * @returns {Promise}
   */
  load(name) {
    return new Promise((resolve, reject) => {
      // 检查组件可用性
      if (!checkComponentAvailability(name)) {
        reject(new Error(`组件 ${name} 在分包中不可用`));
        return;
      }
      
      // 组件路径映射
      const componentPath = `@/uni_modules/uview-ui/components/${name}/${name}.vue`;
      
      // 动态导入组件
      try {
        // uni-app中使用require
        const component = require(componentPath.replace('@/', ''));
        resolve(component.default || component);
      } catch (error) {
        console.error(`[uView] 加载组件 ${name} 失败:`, error);
        reject(error);
      }
    });
  }
};

/**
 * 修复分包中的组件引用
 */
function fixSubpackageImports() {
  // #ifdef MP-WEIXIN
  // 小程序分包特殊处理
  if (typeof getCurrentPages === 'function') {
    const pages = getCurrentPages();
    if (pages && pages.length > 0) {
      const currentPage = pages[pages.length - 1];
      const route = currentPage.route || '';
      
      // 检查是否在分包中
      if (route.startsWith('pages-sub/')) {
        console.log('[uView] 检测到分包页面，应用分包组件配置');
        // 这里可以添加分包特定的组件配置
      }
    }
  }
  // #endif
}

// 导出配置和工具函数
module.exports = {
  registerGlobalComponents,
  checkComponentAvailability,
  SubpackageComponentLoader,
  fixSubpackageImports,
  SUBPACKAGE_CONFIG
};
