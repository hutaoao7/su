/**
 * Vue配置文件
 * 用于打包优化和性能提升
 * 
 * 优化内容：
 * - Gzip压缩（生产环境）
 * - 代码分割（vendor、uview、utils）
 * - Tree-shaking
 * - 资源压缩（图片、字体）
 * - 构建分析（开发环境）
 * 
 * @version 1.1.0
 * @date 2025-11-04
 */

const path = require('path')
const isMpWeixin = process.env.UNI_PLATFORM && process.env.UNI_PLATFORM.startsWith('mp-')
const isProduction = process.env.NODE_ENV === 'production'

// 动态加载插件（避免小程序环境报错）
let CompressionPlugin, BundleAnalyzerPlugin

if (!isMpWeixin) {
  try {
    CompressionPlugin = require('compression-webpack-plugin')
  } catch (e) {
    console.warn('⚠️  compression-webpack-plugin 未安装，Gzip压缩功能不可用')
  }
  
  try {
    const { BundleAnalyzerPlugin: Analyzer } = require('webpack-bundle-analyzer')
    BundleAnalyzerPlugin = Analyzer
  } catch (e) {
    console.warn('⚠️  webpack-bundle-analyzer 未安装，构建分析功能不可用')
  }
}

module.exports = {
  // 仅在 H5 等非小程序平台启用自定义分包与优化，避免 mp-weixin 模块装载顺序问题
  configureWebpack: isMpWeixin
    ? {
        // 小程序端：使用 uni-app 默认打包策略，避免 splitChunks 干扰
      }
    : {
        // 非小程序平台的高级优化配置
        plugins: [
          // Gzip压缩（仅生产环境）
          isProduction && CompressionPlugin && new CompressionPlugin({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 10240, // 只压缩超过10KB的文件
            minRatio: 0.8,    // 压缩比小于0.8才压缩
            deleteOriginalAssets: false // 保留原文件
          }),
          
          // 构建分析（仅开发环境，需手动启用）
          process.env.ANALYZE && BundleAnalyzerPlugin && new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: path.resolve(__dirname, 'dist/bundle-report.html'),
            openAnalyzer: true
          })
        ].filter(Boolean),
        
        optimization: {
          // 代码分割优化
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 10,
            minSize: 20000,  // 最小20KB才分割
            maxSize: 244000, // 最大244KB自动分割
            cacheGroups: {
              // 第三方库
              vendor: {
                name: 'chunk-vendor',
                test: /[\\/]node_modules[\\/]/,
                priority: 10,
                reuseExistingChunk: true
              },
              // uView UI 单独分包
              uview: {
                name: 'chunk-uview',
                test: /[\\/]uni_modules[\\/]uview-ui[\\/]/,
                priority: 20,
                reuseExistingChunk: true
              },
              // 工具类库
              utils: {
                name: 'chunk-utils',
                test: /[\\/]utils[\\/]/,
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true
              },
              // 公共组件
              components: {
                name: 'chunk-components',
                test: /[\\/]components[\\/]/,
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true
              },
              // 其他公共代码
              common: {
                name: 'chunk-common',
                minChunks: 2,
                priority: 1,
                reuseExistingChunk: true
              }
            }
          },
          
          // 运行时代码单独分离
          runtimeChunk: {
            name: 'runtime'
          },
          
          // 启用Tree-shaking
          usedExports: true,
          sideEffects: true
        },
        
        performance: {
          maxEntrypointSize: 2097152,  // 入口文件最大2MB
          maxAssetSize: 524288,         // 资源文件最大512KB
          hints: isProduction ? 'warning' : false
        },
        
        // 解析优化
        resolve: {
          extensions: ['.js', '.vue', '.json'],
          alias: {
            '@': path.resolve(__dirname, 'src'),
            'components': path.resolve(__dirname, 'components'),
            'utils': path.resolve(__dirname, 'utils'),
            'static': path.resolve(__dirname, 'static')
          }
        }
      },

  productionSourceMap: false,

  css: {
    extract: true,
    sourceMap: false,
    loaderOptions: {
      // PostCSS优化
      postcss: {
        plugins: [
          // 自动添加浏览器前缀
          require('autoprefixer')()
        ]
      }
    }
  },

  chainWebpack: config => {
    // =====================================
    // 图片优化
    // =====================================
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => ({
        ...options,
        limit: 4096, // 小于4KB的图片转base64
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'img/[name].[hash:8].[ext]'
          }
        }
      }))

    // =====================================
    // 字体优化
    // =====================================
    config.module
      .rule('fonts')
      .test(/\.(woff2?|eot|ttf|otf)(\?.*)?$/i)
      .use('url-loader')
      .loader('url-loader')
      .options({
        limit: 4096,
        fallback: {
          loader: 'file-loader',
          options: {
            name: 'fonts/[name].[hash:8].[ext]'
          }
        }
      })

    // =====================================
    // SVG优化
    // =====================================
    config.module
      .rule('svg')
      .use('file-loader')
      .loader('file-loader')
      .tap(options => ({
        ...options,
        name: 'img/[name].[hash:8].[ext]'
      }))

    // =====================================
    // 生产环境优化
    // =====================================
    if (!isMpWeixin && isProduction) {
      // 代码压缩优化
      config.optimization.minimizer('terser').tap((args) => {
        const terserOptions = args[0].terserOptions
        terserOptions.compress = {
          ...terserOptions.compress,
          drop_console: true,      // 删除console
          drop_debugger: true,     // 删除debugger
          pure_funcs: ['console.log'], // 删除特定函数
          warnings: false,
          dead_code: true,
          unused: true
        }
        terserOptions.output = {
          ...terserOptions.output,
          comments: false          // 删除注释
        }
        return args
      })

      // HTML压缩
      config.plugin('html').tap(args => {
        args[0].minify = {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true,
          collapseBooleanAttributes: true,
          removeScriptTypeAttributes: true
        }
        return args
      })
    }

    // =====================================
    // 开发环境优化
    // =====================================
    if (!isProduction) {
      // 开发环境禁用缓存（避免热更新问题）
      config.cache(false)
    }

    // =====================================
    // 预加载优化
    // =====================================
    // 禁用prefetch和preload（减少不必要的请求）
    config.plugins.delete('prefetch')
    config.plugins.delete('preload')
  }
}

