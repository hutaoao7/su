/**
 * Vue配置文件
 * 用于打包优化和性能提升
 */

const isMpWeixin = process.env.UNI_PLATFORM && process.env.UNI_PLATFORM.startsWith('mp-')

module.exports = {
  // 仅在 H5 等非小程序平台启用自定义分包与优化，避免 mp-weixin 模块装载顺序问题
  configureWebpack: isMpWeixin
    ? {
        // 小程序端：使用 uni-app 默认打包策略，避免 splitChunks 干扰
      }
    : {
        optimization: {
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                name: 'vendor',
                test: /[\\/]node_modules[\\/]/,
                priority: 10
              },
              // 避免与 uni-app 的 common 命名冲突，使用自定义名称
              common_lib: {
                name: 'common_lib',
                minChunks: 2,
                priority: 5,
                reuseExistingChunk: true
              }
            }
          }
        },
        performance: {
          maxEntrypointSize: 2097152,
          maxAssetSize: 524288,
          hints: 'warning'
        }
      },

  productionSourceMap: false,

  css: {
    extract: true,
    sourceMap: false
  },

  chainWebpack: config => {
    // 图片压缩
    config.module
      .rule('images')
      .use('url-loader')
      .loader('url-loader')
      .tap(options => ({
        ...options,
        limit: 4096
      }));

    if (!isMpWeixin && process.env.NODE_ENV === 'production') {
      config.optimization.minimizer('terser').tap((args) => {
        args[0].terserOptions.compress.drop_console = true;
        args[0].terserOptions.compress.drop_debugger = true;
        return args;
      });
    }
  }
};

