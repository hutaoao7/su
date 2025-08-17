/**
 * 页面渲染优化工具
 * 用于优化Vue组件的生命周期和渲染流程，防止白屏问题
 */

// 页面渲染状态枚举
export const RENDER_STATUS = {
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  EMPTY: 'empty'
};

/**
 * 页面渲染优化混入
 */
export const renderOptimizationMixin = {
  data() {
    return {
      // 渲染状态
      renderStatus: RENDER_STATUS.LOADING,
      renderError: null,
      renderRetryCount: 0,
      maxRenderRetry: 3,
      
      // 数据加载状态
      dataLoading: false,
      dataError: null,
      
      // 组件可见性
      componentVisible: false,
      
      // 性能监控
      renderStartTime: 0,
      renderEndTime: 0
    };
  },
  
  created() {
    this.renderStartTime = Date.now();
    console.log(`[渲染优化] 组件创建: ${this.$options.name || 'Unknown'}`);
    
    // 设置渲染超时检测
    this.setupRenderTimeout();
  },
  
  mounted() {
    this.renderEndTime = Date.now();
    const renderTime = this.renderEndTime - this.renderStartTime;
    console.log(`[渲染优化] 组件挂载完成: ${this.$options.name || 'Unknown'}, 耗时: ${renderTime}ms`);
    
    // 检查渲染结果
    this.checkRenderResult();
    
    // 设置组件可见性
    this.componentVisible = true;
    
    // 设置渲染状态为成功
    this.renderStatus = RENDER_STATUS.SUCCESS;
  },
  
  beforeDestroy() {
    console.log(`[渲染优化] 组件销毁: ${this.$options.name || 'Unknown'}`);
    
    // 清理定时器
    if (this.renderTimeoutId) {
      clearTimeout(this.renderTimeoutId);
    }
  },
  
  methods: {
    /**
     * 设置渲染超时检测
     */
    setupRenderTimeout() {
      this.renderTimeoutId = setTimeout(() => {
        if (this.renderStatus === RENDER_STATUS.LOADING) {
          console.warn(`[渲染优化] 组件渲染超时: ${this.$options.name || 'Unknown'}`);
          this.handleRenderTimeout();
        }
      }, 5000); // 5秒超时
    },
    
    /**
     * 处理渲染超时
     */
    handleRenderTimeout() {
      this.renderStatus = RENDER_STATUS.ERROR;
      this.renderError = new Error('组件渲染超时');
      
      // 尝试重新渲染
      if (this.renderRetryCount < this.maxRenderRetry) {
        this.retryRender();
      } else {
        console.error(`[渲染优化] 组件渲染失败，已达最大重试次数: ${this.$options.name || 'Unknown'}`);
      }
    },
    
    /**
     * 检查渲染结果
     */
    checkRenderResult() {
      this.$nextTick(() => {
        try {
          // 检查DOM是否正确渲染
          if (!this.$el) {
            throw new Error('组件DOM元素不存在');
          }
          
          // 检查是否有内容
          if (this.$el.children && this.$el.children.length === 0) {
            console.warn(`[渲染优化] 组件内容为空: ${this.$options.name || 'Unknown'}`);
            this.renderStatus = RENDER_STATUS.EMPTY;
          }
          
          // 检查关键元素是否存在
          this.checkCriticalElements();
          
        } catch (error) {
          console.error(`[渲染优化] 渲染检查失败: ${this.$options.name || 'Unknown'}`, error);
          this.renderStatus = RENDER_STATUS.ERROR;
          this.renderError = error;
        }
      });
    },
    
    /**
     * 检查关键元素
     */
    checkCriticalElements() {
      // 子类可以重写此方法来检查特定的关键元素
      // 例如：检查列表是否有数据，图片是否加载等
    },
    
    /**
     * 重试渲染
     */
    retryRender() {
      this.renderRetryCount++;
      console.log(`[渲染优化] 重试渲染 (${this.renderRetryCount}/${this.maxRenderRetry}): ${this.$options.name || 'Unknown'}`);
      
      this.renderStatus = RENDER_STATUS.LOADING;
      this.renderError = null;
      
      // 强制重新渲染
      this.$forceUpdate();
      
      // 重新设置超时检测
      this.setupRenderTimeout();
    },
    
    /**
     * 安全的数据加载
     */
    async safeLoadData(loadFn, options = {}) {
      const {
        showLoading = true,
        defaultData = null,
        retryCount = 3,
        timeout = 10000
      } = options;
      
      if (showLoading) {
        this.dataLoading = true;
      }
      
      let attempt = 0;
      
      while (attempt < retryCount) {
        try {
          // 设置超时
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('数据加载超时')), timeout);
          });
          
          const result = await Promise.race([loadFn(), timeoutPromise]);
          
          this.dataError = null;
          this.dataLoading = false;
          
          return result;
          
        } catch (error) {
          attempt++;
          console.error(`[渲染优化] 数据加载失败 (${attempt}/${retryCount}):`, error);
          
          if (attempt >= retryCount) {
            this.dataError = error;
            this.dataLoading = false;
            
            // 显示错误提示
            this.showDataLoadError(error);
            
            return defaultData;
          }
          
          // 等待一段时间后重试
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    },
    
    /**
     * 显示数据加载错误
     */
    showDataLoadError(error) {
      const errorMessage = this.getErrorMessage(error);
      
      uni.showToast({
        title: errorMessage,
        icon: 'none',
        duration: 3000
      });
    },
    
    /**
     * 获取错误消息
     */
    getErrorMessage(error) {
      if (!error) return '未知错误';
      
      const message = error.message || error.toString();
      
      // 网络错误
      if (message.includes('timeout') || message.includes('超时')) {
        return '请求超时，请检查网络连接';
      }
      
      if (message.includes('network') || message.includes('网络')) {
        return '网络连接异常';
      }
      
      // 服务器错误
      if (message.includes('500') || message.includes('服务器')) {
        return '服务器异常，请稍后重试';
      }
      
      // 权限错误
      if (message.includes('401') || message.includes('403') || message.includes('权限')) {
        return '权限不足，请重新登录';
      }
      
      return '加载失败，请重试';
    },
    
    /**
     * 安全的页面跳转
     */
    safeNavigate(url, method = 'navigateTo') {
      try {
        return uni[method]({
          url,
          fail: (error) => {
            console.error(`[渲染优化] 页面跳转失败: ${url}`, error);
            uni.showToast({
              title: '页面跳转失败',
              icon: 'none',
              duration: 2000
            });
          }
        });
      } catch (error) {
        console.error(`[渲染优化] 页面跳转异常: ${url}`, error);
        return Promise.reject(error);
      }
    },
    
    /**
     * 防抖函数
     */
    debounce(func, wait = 300) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    },
    
    /**
     * 节流函数
     */
    throttle(func, limit = 300) {
      let inThrottle;
      return function executedFunction(...args) {
        if (!inThrottle) {
          func.apply(this, args);
          inThrottle = true;
          setTimeout(() => inThrottle = false, limit);
        }
      };
    },
    
    /**
     * 获取渲染状态类名
     */
    getRenderStatusClass() {
      return {
        'render-loading': this.renderStatus === RENDER_STATUS.LOADING,
        'render-success': this.renderStatus === RENDER_STATUS.SUCCESS,
        'render-error': this.renderStatus === RENDER_STATUS.ERROR,
        'render-empty': this.renderStatus === RENDER_STATUS.EMPTY,
        'data-loading': this.dataLoading
      };
    },
    
    /**
     * 是否显示加载状态
     */
    shouldShowLoading() {
      return this.renderStatus === RENDER_STATUS.LOADING || this.dataLoading;
    },
    
    /**
     * 是否显示错误状态
     */
    shouldShowError() {
      return this.renderStatus === RENDER_STATUS.ERROR || this.dataError;
    },
    
    /**
     * 是否显示空状态
     */
    shouldShowEmpty() {
      return this.renderStatus === RENDER_STATUS.EMPTY;
    }
  },
  
  computed: {
    /**
     * 渲染状态类名
     */
    renderStatusClasses() {
      return this.getRenderStatusClass();
    }
  }
};

/**
 * 页面级别的渲染优化混入
 */
export const pageRenderOptimizationMixin = {
  mixins: [renderOptimizationMixin],
  
  data() {
    return {
      // 页面级别的状态
      pageReady: false,
      pageError: null,
      
      // 页面数据
      pageData: {},
      
      // 页面配置
      pageConfig: {
        enablePullRefresh: false,
        enableReachBottom: false,
        loadingText: '加载中...',
        emptyText: '暂无数据',
        errorText: '加载失败'
      }
    };
  },
  
  onLoad(options) {
    console.log(`[页面渲染] 页面加载: ${this.$options.name || this.route}`);
    
    // 初始化页面
    this.initPage(options);
  },
  
  onShow() {
    console.log(`[页面渲染] 页面显示: ${this.$options.name || this.route}`);
    
    // 检查页面状态
    this.checkPageStatus();
  },
  
  onReady() {
    console.log(`[页面渲染] 页面就绪: ${this.$options.name || this.route}`);
    this.pageReady = true;
  },
  
  onPullDownRefresh() {
    if (this.pageConfig.enablePullRefresh) {
      this.handlePullRefresh();
    }
  },
  
  onReachBottom() {
    if (this.pageConfig.enableReachBottom) {
      this.handleReachBottom();
    }
  },
  
  methods: {
    /**
     * 初始化页面
     */
    async initPage(options = {}) {
      try {
        // 设置页面参数
        this.pageOptions = options;
        
        // 加载页面数据
        await this.loadPageData();
        
        // 页面初始化完成
        this.onPageInitComplete();
        
      } catch (error) {
        console.error(`[页面渲染] 页面初始化失败:`, error);
        this.pageError = error;
        this.renderStatus = RENDER_STATUS.ERROR;
      }
    },
    
    /**
     * 加载页面数据
     */
    async loadPageData() {
      // 子类需要重写此方法
      console.log(`[页面渲染] 加载页面数据: ${this.$options.name || this.route}`);
    },
    
    /**
     * 页面初始化完成回调
     */
    onPageInitComplete() {
      console.log(`[页面渲染] 页面初始化完成: ${this.$options.name || this.route}`);
    },
    
    /**
     * 检查页面状态
     */
    checkPageStatus() {
      if (!this.pageReady) {
        console.warn(`[页面渲染] 页面未就绪: ${this.$options.name || this.route}`);
      }
      
      if (this.pageError) {
        console.error(`[页面渲染] 页面存在错误: ${this.$options.name || this.route}`, this.pageError);
      }
    },
    
    /**
     * 处理下拉刷新
     */
    async handlePullRefresh() {
      try {
        console.log(`[页面渲染] 下拉刷新: ${this.$options.name || this.route}`);
        
        await this.loadPageData();
        
        uni.showToast({
          title: '刷新成功',
          icon: 'success',
          duration: 1500
        });
        
      } catch (error) {
        console.error(`[页面渲染] 下拉刷新失败:`, error);
        
        uni.showToast({
          title: '刷新失败',
          icon: 'none',
          duration: 2000
        });
      } finally {
        uni.stopPullDownRefresh();
      }
    },
    
    /**
     * 处理上拉加载
     */
    async handleReachBottom() {
      try {
        console.log(`[页面渲染] 上拉加载: ${this.$options.name || this.route}`);
        
        // 子类需要重写此方法
        await this.loadMoreData();
        
      } catch (error) {
        console.error(`[页面渲染] 上拉加载失败:`, error);
        
        uni.showToast({
          title: '加载失败',
          icon: 'none',
          duration: 2000
        });
      }
    },
    
    /**
     * 加载更多数据
     */
    async loadMoreData() {
      // 子类需要重写此方法
      console.log(`[页面渲染] 加载更多数据: ${this.$options.name || this.route}`);
    },
    
    /**
     * 重新加载页面
     */
    async reloadPage() {
      console.log(`[页面渲染] 重新加载页面: ${this.$options.name || this.route}`);
      
      // 重置状态
      this.renderStatus = RENDER_STATUS.LOADING;
      this.pageError = null;
      this.dataError = null;
      
      // 重新初始化
      await this.initPage(this.pageOptions);
    }
  }
};

/**
 * 列表页面渲染优化混入
 */
export const listRenderOptimizationMixin = {
  mixins: [pageRenderOptimizationMixin],
  
  data() {
    return {
      // 列表数据
      listData: [],
      
      // 分页信息
      pagination: {
        current: 1,
        pageSize: 20,
        total: 0,
        hasMore: true
      },
      
      // 列表状态
      listLoading: false,
      listError: null
    };
  },
  
  methods: {
    /**
     * 检查关键元素（重写父类方法）
     */
    checkCriticalElements() {
      // 检查列表是否有数据
      if (Array.isArray(this.listData) && this.listData.length === 0) {
        this.renderStatus = RENDER_STATUS.EMPTY;
      }
    },
    
    /**
     * 加载列表数据
     */
    async loadListData(reset = false) {
      try {
        if (reset) {
          this.pagination.current = 1;
          this.pagination.hasMore = true;
        }
        
        this.listLoading = true;
        this.listError = null;
        
        const result = await this.fetchListData();
        
        if (reset) {
          this.listData = result.data || [];
        } else {
          this.listData = [...this.listData, ...(result.data || [])];
        }
        
        // 更新分页信息
        this.pagination.total = result.total || 0;
        this.pagination.hasMore = this.listData.length < this.pagination.total;
        
        // 更新渲染状态
        if (this.listData.length === 0) {
          this.renderStatus = RENDER_STATUS.EMPTY;
        } else {
          this.renderStatus = RENDER_STATUS.SUCCESS;
        }
        
      } catch (error) {
        console.error('[列表渲染] 加载列表数据失败:', error);
        this.listError = error;
        this.renderStatus = RENDER_STATUS.ERROR;
      } finally {
        this.listLoading = false;
      }
    },
    
    /**
     * 获取列表数据（子类需要重写）
     */
    async fetchListData() {
      throw new Error('fetchListData方法需要在子类中实现');
    },
    
    /**
     * 加载页面数据（重写父类方法）
     */
    async loadPageData() {
      await this.loadListData(true);
    },
    
    /**
     * 加载更多数据（重写父类方法）
     */
    async loadMoreData() {
      if (!this.pagination.hasMore || this.listLoading) {
        return;
      }
      
      this.pagination.current++;
      await this.loadListData(false);
    }
  }
};

// 导出工具函数
export const RenderOptimizationUtils = {
  /**
   * 创建安全的异步操作
   */
  createSafeAsync(asyncFn, options = {}) {
    const { timeout = 10000, retryCount = 3, fallback = null } = options;
    
    return async function(...args) {
      let attempt = 0;
      
      while (attempt < retryCount) {
        try {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('操作超时')), timeout);
          });
          
          const result = await Promise.race([asyncFn.apply(this, args), timeoutPromise]);
          return result;
          
        } catch (error) {
          attempt++;
          console.error(`[安全异步] 操作失败 (${attempt}/${retryCount}):`, error);
          
          if (attempt >= retryCount) {
            return fallback;
          }
          
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    };
  },
  
  /**
   * 检查组件是否正常渲染
   */
  checkComponentHealth(component) {
    if (!component || !component.$el) {
      return { healthy: false, reason: '组件DOM不存在' };
    }
    
    if (component.$el.children && component.$el.children.length === 0) {
      return { healthy: false, reason: '组件内容为空' };
    }
    
    return { healthy: true };
  }
};

export default {
  renderOptimizationMixin,
  pageRenderOptimizationMixin,
  listRenderOptimizationMixin,
  RenderOptimizationUtils,
  RENDER_STATUS
};