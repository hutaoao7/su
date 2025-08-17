/**
 * 静态资源加载优化和错误处理
 * 解决白屏问题中的静态资源加载问题
 */

// 资源加载状态管理
const resourceStatus = new Map();
const resourceCache = new Map();
const failedResources = new Set();

// 默认资源配置
const defaultResources = {
  images: {
    placeholder: '/static/images/placeholder.png',
    error: '/static/images/error.png',
    loading: '/static/images/loading.gif'
  },
  audio: {
    defaultTrack: '/static/audio/default.mp3'
  }
};

/**
 * 初始化资源处理器
 */
export function initResourceHandler() {
  console.log('[资源处理器] 初始化开始');
  
  // 预检查关键资源
  preCheckCriticalResources();
  
  // 创建默认占位资源
  createDefaultPlaceholders();
  
  console.log('[资源处理器] 初始化完成');
}

/**
 * 预检查关键资源
 */
async function preCheckCriticalResources() {
  const criticalResources = [
    '/static/css/liquid-glass.css',
    '/static/css/theme.css',
    '/static/logo.png',
    '/static/images/home.png',
    '/static/images/user.png'
  ];
  
  for (const resource of criticalResources) {
    try {
      await checkResourceExists(resource);
      console.log('[资源处理器] 关键资源检查通过:', resource);
    } catch (error) {
      console.warn('[资源处理器] 关键资源缺失:', resource);
      failedResources.add(resource);
    }
  }
}

/**
 * 检查资源是否存在
 */
function checkResourceExists(resourcePath) {
  return new Promise((resolve, reject) => {
    // 对于图片资源，使用Image对象检查
    if (resourcePath.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
      // #ifdef H5
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = resourcePath;
      // #endif
      
      // #ifndef H5
      // 小程序和App端直接返回成功，因为无法直接检测
      resolve(true);
      // #endif
    } else {
      // 其他资源类型暂时返回成功
      resolve(true);
    }
  });
}

/**
 * 创建默认占位资源
 */
function createDefaultPlaceholders() {
  // 创建默认图片占位符（base64编码的1x1透明图片）
  const transparentPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  
  defaultResources.images.placeholder = transparentPixel;
  defaultResources.images.error = transparentPixel;
  defaultResources.images.loading = transparentPixel;
}

/**
 * 安全加载图片
 * @param {string} src - 图片路径
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回处理后的图片路径
 */
export async function safeLoadImage(src, options = {}) {
  const {
    placeholder = defaultResources.images.placeholder,
    errorImage = defaultResources.images.error,
    timeout = 10000,
    retryCount = 2,
    cache = true
  } = options;
  
  if (!src) {
    return placeholder;
  }
  
  // 检查缓存
  if (cache && resourceCache.has(src)) {
    const cached = resourceCache.get(src);
    if (cached.success) {
      return cached.url;
    } else if (cached.error) {
      return errorImage;
    }
  }
  
  // 检查是否已知失败的资源
  if (failedResources.has(src)) {
    return errorImage;
  }
  
  try {
    // 尝试加载图片
    await loadImageWithRetry(src, retryCount, timeout);
    
    // 缓存成功结果
    if (cache) {
      resourceCache.set(src, { success: true, url: src, timestamp: Date.now() });
    }
    
    return src;
    
  } catch (error) {
    console.warn('[资源处理器] 图片加载失败:', src, error);
    
    // 标记为失败资源
    failedResources.add(src);
    
    // 缓存失败结果
    if (cache) {
      resourceCache.set(src, { success: false, error: true, timestamp: Date.now() });
    }
    
    return errorImage;
  }
}

/**
 * 带重试的图片加载
 */
function loadImageWithRetry(src, retryCount, timeout) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attemptLoad() {
      attempts++;
      
      // #ifdef H5
      const img = new Image();
      const timer = setTimeout(() => {
        reject(new Error('图片加载超时'));
      }, timeout);
      
      img.onload = () => {
        clearTimeout(timer);
        resolve(src);
      };
      
      img.onerror = () => {
        clearTimeout(timer);
        if (attempts <= retryCount) {
          setTimeout(attemptLoad, 1000 * attempts); // 递增延迟重试
        } else {
          reject(new Error('图片加载失败'));
        }
      };
      
      img.src = src;
      // #endif
      
      // #ifndef H5
      // 小程序和App端使用uni.getImageInfo检查
      uni.getImageInfo({
        src: src,
        success: () => {
          resolve(src);
        },
        fail: (error) => {
          if (attempts <= retryCount) {
            setTimeout(attemptLoad, 1000 * attempts);
          } else {
            reject(error);
          }
        }
      });
      // #endif
    }
    
    attemptLoad();
  });
}

/**
 * 安全加载音频
 * @param {string} src - 音频路径
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回处理后的音频路径
 */
export async function safeLoadAudio(src, options = {}) {
  const {
    fallback = defaultResources.audio.defaultTrack,
    timeout = 15000,
    retryCount = 1
  } = options;
  
  if (!src) {
    return fallback;
  }
  
  try {
    await loadAudioWithRetry(src, retryCount, timeout);
    return src;
  } catch (error) {
    console.warn('[资源处理器] 音频加载失败:', src, error);
    return fallback;
  }
}

/**
 * 带重试的音频加载
 */
function loadAudioWithRetry(src, retryCount, timeout) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attemptLoad() {
      attempts++;
      
      const audio = uni.createInnerAudioContext();
      const timer = setTimeout(() => {
        audio.destroy();
        reject(new Error('音频加载超时'));
      }, timeout);
      
      audio.onCanplay(() => {
        clearTimeout(timer);
        audio.destroy();
        resolve(src);
      });
      
      audio.onError((error) => {
        clearTimeout(timer);
        audio.destroy();
        
        if (attempts <= retryCount) {
          setTimeout(attemptLoad, 2000 * attempts);
        } else {
          reject(error);
        }
      });
      
      audio.src = src;
    }
    
    attemptLoad();
  });
}

/**
 * 批量预加载资源
 * @param {Array} resources - 资源列表
 * @param {Object} options - 配置选项
 * @returns {Promise} - 返回预加载结果
 */
export async function preloadResources(resources, options = {}) {
  const {
    concurrency = 3,
    showProgress = false,
    timeout = 10000
  } = options;
  
  console.log('[资源处理器] 开始预加载资源:', resources.length);
  
  if (showProgress) {
    uni.showLoading({
      title: `预加载中 0/${resources.length}`,
      mask: true
    });
  }
  
  const results = [];
  let completed = 0;
  
  // 分批预加载
  for (let i = 0; i < resources.length; i += concurrency) {
    const batch = resources.slice(i, i + concurrency);
    
    const batchPromises = batch.map(async (resource, index) => {
      try {
        let result;
        if (resource.type === 'image') {
          result = await safeLoadImage(resource.src, { timeout });
        } else if (resource.type === 'audio') {
          result = await safeLoadAudio(resource.src, { timeout });
        } else {
          result = resource.src;
        }
        
        completed++;
        if (showProgress) {
          uni.showLoading({
            title: `预加载中 ${completed}/${resources.length}`,
            mask: true
          });
        }
        
        return { success: true, src: resource.src, result, index: i + index };
      } catch (error) {
        completed++;
        if (showProgress) {
          uni.showLoading({
            title: `预加载中 ${completed}/${resources.length}`,
            mask: true
          });
        }
        
        return { success: false, src: resource.src, error, index: i + index };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }
  
  if (showProgress) {
    uni.hideLoading();
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log('[资源处理器] 预加载完成:', `${successCount}/${resources.length}`);
  
  return results;
}

/**
 * 清理资源缓存
 */
export function clearResourceCache() {
  resourceCache.clear();
  failedResources.clear();
  console.log('[资源处理器] 缓存已清理');
}

/**
 * 获取资源加载统计
 */
export function getResourceStats() {
  return {
    cacheSize: resourceCache.size,
    failedCount: failedResources.size,
    failedResources: Array.from(failedResources)
  };
}

/**
 * 资源加载混入
 */
export const resourceMixin = {
  data() {
    return {
      resourceLoading: false,
      loadedImages: new Set(),
      failedImages: new Set()
    };
  },
  
  methods: {
    /**
     * 安全加载图片
     */
    async $loadImage(src, options = {}) {
      if (this.loadedImages.has(src)) {
        return src;
      }
      
      if (this.failedImages.has(src)) {
        return options.errorImage || defaultResources.images.error;
      }
      
      try {
        const result = await safeLoadImage(src, options);
        if (result === src) {
          this.loadedImages.add(src);
        } else {
          this.failedImages.add(src);
        }
        return result;
      } catch (error) {
        this.failedImages.add(src);
        return options.errorImage || defaultResources.images.error;
      }
    },
    
    /**
     * 预加载页面资源
     */
    async preloadPageResources(resources) {
      this.resourceLoading = true;
      
      try {
        await preloadResources(resources, {
          showProgress: false,
          concurrency: 2
        });
      } catch (error) {
        console.warn(`[${this.$options.name}] 页面资源预加载失败:`, error);
      } finally {
        this.resourceLoading = false;
      }
    }
  }
};

/**
 * 图片组件增强指令
 */
export const imageDirective = {
  bind(el, binding) {
    const { value, modifiers } = binding;
    const options = {
      placeholder: modifiers.placeholder ? defaultResources.images.placeholder : null,
      errorImage: modifiers.error ? defaultResources.images.error : null,
      lazy: modifiers.lazy || false
    };
    
    if (typeof value === 'string') {
      loadImageSafely(el, value, options);
    } else if (value && value.src) {
      loadImageSafely(el, value.src, { ...options, ...value });
    }
  },
  
  update(el, binding) {
    const { value, modifiers } = binding;
    const options = {
      placeholder: modifiers.placeholder ? defaultResources.images.placeholder : null,
      errorImage: modifiers.error ? defaultResources.images.error : null,
      lazy: modifiers.lazy || false
    };
    
    if (typeof value === 'string') {
      loadImageSafely(el, value, options);
    } else if (value && value.src) {
      loadImageSafely(el, value.src, { ...options, ...value });
    }
  }
};

/**
 * 安全加载图片到元素
 */
async function loadImageSafely(el, src, options) {
  try {
    // 显示占位图
    if (options.placeholder) {
      el.src = options.placeholder;
    }
    
    // 加载实际图片
    const result = await safeLoadImage(src, options);
    el.src = result;
    
  } catch (error) {
    console.warn('[资源处理器] 元素图片加载失败:', src, error);
    if (options.errorImage) {
      el.src = options.errorImage;
    }
  }
}

console.log('[资源处理器] 模块加载完成');