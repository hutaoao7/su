/**
 * CSS资源加载优化工具
 * 解决CSS文件加载失败导致的样式丢失问题
 */

// CSS加载状态管理
const cssLoadStatus = new Map();
const loadedCSS = new Set();
const failedCSS = new Set();

// 关键CSS文件列表
const criticalCSS = [
  '/static/css/liquid-glass.css',
  '/static/css/theme.css'
];

// 内联关键CSS（作为降级方案）
const inlineCSS = {
  'liquid-glass': `
    .liquid-glass, .glass {
      backdrop-filter: blur(18px) saturate(140%);
      -webkit-backdrop-filter: blur(18px) saturate(140%);
      background: linear-gradient(145deg, rgba(255,255,255,.55), rgba(255,255,255,.25));
      border: 1px solid rgba(0,0,0,.06);
      border-radius: 16px;
      box-shadow: 0 10px 24px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.5);
      transition: all 0.3s ease;
    }
    .card {
      border-radius:16px;
      padding:12px;
      background: linear-gradient(145deg, rgba(255,255,255,.6), rgba(255,255,255,.35));
      border:1px solid rgba(0,0,0,.06);
    }
    .btn-primary {
      border-radius:12px;
      padding:10px 14px;
      font-weight:600;
      background:linear-gradient(135deg,#5AC8FA,#0A84FF);
      color:#fff;
      box-shadow:0 8px 16px rgba(10,132,255,.25);
      border: none;
      transition: all 0.3s ease;
    }
    .btn-primary:active {
      transform: scale(0.95);
      opacity: 0.8;
    }
    .page-title { font-size:20px;font-weight:700;margin:12px; }
    .section { margin:12px; }
    .row { display:flex;gap:10px;align-items:center;flex-wrap:wrap; }
    .empty { padding:24px;text-align:center;color:rgba(60,60,67,.6); }
  `,
  
  'theme': `
    .text-primary { color: #1D1D1F; font-weight: 600; }
    .text-secondary { color: #6E6E73; font-weight: 400; }
    .text-muted { color: rgba(60,60,67,0.6); font-weight: 400; }
    .text-accent { color: #007AFF; font-weight: 500; }
    .title-large { font-size: 28px; font-weight: 700; color: #1D1D1F; line-height: 1.2; }
    .title-medium { font-size: 22px; font-weight: 600; color: #1D1D1F; line-height: 1.3; }
    .title-small { font-size: 18px; font-weight: 600; color: #1D1D1F; line-height: 1.4; }
    .disabled { opacity: 0.5; pointer-events: none; filter: grayscale(0.3); }
    .loading { position: relative; pointer-events: none; }
    .loading::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top: 2px solid #007AFF;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `
};

/**
 * 初始化CSS加载器
 */
export function initCSSLoader() {
  console.log('[CSS加载器] 初始化开始');
  
  // 检查关键CSS是否已加载
  checkCriticalCSS();
  
  // 注入内联CSS作为降级方案
  injectFallbackCSS();
  
  console.log('[CSS加载器] 初始化完成');
}

/**
 * 检查关键CSS文件
 */
function checkCriticalCSS() {
  criticalCSS.forEach(cssPath => {
    checkCSSLoaded(cssPath)
      .then(() => {
        console.log('[CSS加载器] CSS文件检查通过:', cssPath);
        loadedCSS.add(cssPath);
      })
      .catch(error => {
        console.warn('[CSS加载器] CSS文件检查失败:', cssPath, error);
        failedCSS.add(cssPath);
        // 尝试重新加载
        loadCSSFile(cssPath);
      });
  });
}

/**
 * 检查CSS是否已加载
 */
function checkCSSLoaded(cssPath) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    // 在H5端检查link标签
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    const isLoaded = Array.from(links).some(link => 
      link.href.includes(cssPath.replace('/static/', ''))
    );
    
    if (isLoaded) {
      resolve(true);
    } else {
      reject(new Error('CSS文件未找到'));
    }
    // #endif
    
    // #ifndef H5
    // 小程序和App端默认认为已加载
    resolve(true);
    // #endif
  });
}

/**
 * 动态加载CSS文件
 */
function loadCSSFile(cssPath) {
  return new Promise((resolve, reject) => {
    // #ifdef H5
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = cssPath;
    
    link.onload = () => {
      console.log('[CSS加载器] CSS文件加载成功:', cssPath);
      loadedCSS.add(cssPath);
      failedCSS.delete(cssPath);
      resolve(cssPath);
    };
    
    link.onerror = () => {
      console.error('[CSS加载器] CSS文件加载失败:', cssPath);
      failedCSS.add(cssPath);
      reject(new Error('CSS文件加载失败'));
    };
    
    document.head.appendChild(link);
    // #endif
    
    // #ifndef H5
    // 小程序和App端无法动态加载CSS，直接返回成功
    console.log('[CSS加载器] 小程序/App端跳过CSS动态加载:', cssPath);
    resolve(cssPath);
    // #endif
  });
}

/**
 * 注入降级CSS
 */
function injectFallbackCSS() {
  // #ifdef H5
  // 检查是否需要注入降级CSS
  const needFallback = criticalCSS.some(css => failedCSS.has(css));
  
  if (needFallback || criticalCSS.length === 0) {
    console.log('[CSS加载器] 注入降级CSS');
    
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = 'fallback-css';
    
    // 合并所有内联CSS
    const combinedCSS = Object.values(inlineCSS).join('\n');
    style.textContent = combinedCSS;
    
    document.head.appendChild(style);
  }
  // #endif
  
  // #ifndef H5
  // 小程序和App端通过全局样式处理
  console.log('[CSS加载器] 小程序/App端使用全局样式');
  // #endif
}

/**
 * 确保关键样式可用
 */
export function ensureCriticalStyles() {
  return new Promise((resolve) => {
    // 检查关键样式类是否存在
    const testElement = document.createElement('div');
    testElement.className = 'liquid-glass';
    testElement.style.visibility = 'hidden';
    testElement.style.position = 'absolute';
    document.body.appendChild(testElement);
    
    setTimeout(() => {
      const computedStyle = window.getComputedStyle(testElement);
      const hasBackdropFilter = computedStyle.backdropFilter !== 'none';
      const hasBackground = computedStyle.background !== 'rgba(0, 0, 0, 0)';
      
      document.body.removeChild(testElement);
      
      if (!hasBackdropFilter && !hasBackground) {
        console.warn('[CSS加载器] 关键样式缺失，注入降级CSS');
        injectFallbackCSS();
      }
      
      resolve(true);
    }, 100);
  });
}

/**
 * CSS加载状态检查混入
 */
export const cssStatusMixin = {
  data() {
    return {
      cssLoaded: false,
      cssError: false
    };
  },
  
  async created() {
    await this.checkCSSStatus();
  },
  
  methods: {
    async checkCSSStatus() {
      try {
        // #ifdef H5
        await ensureCriticalStyles();
        // #endif
        
        this.cssLoaded = true;
        console.log(`[${this.$options.name}] CSS状态检查完成`);
      } catch (error) {
        this.cssError = true;
        console.error(`[${this.$options.name}] CSS状态检查失败:`, error);
      }
    }
  }
};

/**
 * 样式修复工具
 */
export const styleUtils = {
  /**
   * 添加降级样式类
   */
  addFallbackClass(element, className) {
    if (!element) return;
    
    // 检查原始样式是否生效
    const computedStyle = window.getComputedStyle(element);
    const needsFallback = this.checkStyleNeedsFallback(computedStyle, className);
    
    if (needsFallback) {
      element.classList.add(`${className}-fallback`);
    }
  },
  
  /**
   * 检查样式是否需要降级
   */
  checkStyleNeedsFallback(computedStyle, className) {
    switch (className) {
      case 'liquid-glass':
      case 'glass':
        return computedStyle.backdropFilter === 'none' && 
               computedStyle.background === 'rgba(0, 0, 0, 0)';
      case 'btn-primary':
        return computedStyle.background === 'rgba(0, 0, 0, 0)';
      default:
        return false;
    }
  },
  
  /**
   * 批量修复页面样式
   */
  fixPageStyles() {
    const criticalClasses = ['liquid-glass', 'glass', 'btn-primary', 'card'];
    
    criticalClasses.forEach(className => {
      const elements = document.querySelectorAll(`.${className}`);
      elements.forEach(element => {
        this.addFallbackClass(element, className);
      });
    });
  }
};

/**
 * 获取CSS加载统计
 */
export function getCSSStats() {
  return {
    loaded: Array.from(loadedCSS),
    failed: Array.from(failedCSS),
    loadedCount: loadedCSS.size,
    failedCount: failedCSS.size
  };
}

/**
 * 重置CSS加载状态
 */
export function resetCSSStatus() {
  loadedCSS.clear();
  failedCSS.clear();
  cssLoadStatus.clear();
  console.log('[CSS加载器] 状态已重置');
}

console.log('[CSS加载器] 模块加载完成');