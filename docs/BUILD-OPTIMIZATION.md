# 构建优化说明文档

## 📊 优化概览

本文档说明翎心CraneHeart项目的构建优化配置，包括代码分割、资源压缩、性能优化等。

**版本**: 1.1.0  
**日期**: 2025-11-04  
**优化目标**: 包体积减少30%+，首屏加载速度提升50%

---

## 🎯 优化内容

### 1. Gzip压缩（生产环境）

**配置位置**: `vue.config.js` L48-54

**功能**:
- 对JS/CSS/HTML/SVG文件进行Gzip压缩
- 只压缩超过10KB的文件
- 压缩比小于0.8才压缩（确保有效）
- 保留原文件（兼容不支持Gzip的服务器）

**效果**:
- 带宽节省: ~70%
- 传输速度: 提升3-5倍

**使用**:
```bash
npm run build:h5
# 查看dist目录，会生成.gz文件
```

---

### 2. 代码分割优化

**配置位置**: `vue.config.js` L66-110

**分包策略**:

| 分包名称 | 包含内容 | 优先级 | 说明 |
|---------|---------|--------|------|
| `chunk-uview` | uView UI组件库 | 20 | 最高优先级，独立分包 |
| `chunk-vendor` | 第三方库(node_modules) | 10 | Vue、Vuex等核心库 |
| `chunk-utils` | 工具类(utils/) | 5 | 公共工具函数 |
| `chunk-components` | 组件(components/) | 5 | 公共业务组件 |
| `chunk-common` | 其他公共代码 | 1 | 多次引用的代码 |
| `runtime` | Webpack运行时 | - | 独立分离 |

**分割规则**:
- 最小分割大小: 20KB
- 最大分割大小: 244KB（超过自动分割）
- 最大初始请求数: 10个

**效果**:
- 按需加载，减少首屏体积
- 提高缓存命中率（第三方库不常变）
- 并行加载，提升速度

---

### 3. Tree-shaking优化

**配置位置**: 
- `vue.config.js` L118-119
- `package.json` L115-121

**功能**:
- 启用`usedExports`：标记未使用的导出
- 启用`sideEffects`：允许删除无副作用的代码
- 配置`sideEffects`数组：保留CSS/Vue等有副作用的文件

**效果**:
- 自动移除未使用的代码
- 减少包体积15-25%

**示例**:
```javascript
// utils/index.js
export function usedFunction() { /* ... */ }
export function unusedFunction() { /* ... */ } // 会被删除

// 使用
import { usedFunction } from './utils'
```

---

### 4. 资源优化

#### 4.1 图片优化

**配置位置**: `vue.config.js` L160-173

**策略**:
- 小于4KB的图片 → 转为Base64内联
- 大于4KB的图片 → 使用文件加载，添加hash
- 文件命名: `img/[name].[hash:8].[ext]`

**效果**:
- 减少HTTP请求（小图片）
- 优化缓存（hash命名）

#### 4.2 字体优化

**配置位置**: `vue.config.js` L178-191

**策略**:
- 小于4KB的字体 → 转为Base64
- 大于4KB的字体 → 文件加载
- 支持格式: woff2, woff, eot, ttf, otf

#### 4.3 SVG优化

**配置位置**: `vue.config.js` L196-203

**策略**:
- 文件加载 + hash命名
- 保持矢量特性，不转Base64

---

### 5. 代码压缩

**配置位置**: `vue.config.js` L210-226

**Terser压缩选项**:
- ✅ `drop_console`: 删除所有console
- ✅ `drop_debugger`: 删除debugger语句
- ✅ `pure_funcs`: 删除特定函数（如console.log）
- ✅ `dead_code`: 删除不可达代码
- ✅ `unused`: 删除未使用的变量
- ✅ `comments`: 删除注释

**HTML压缩选项** (L229-237):
- 删除注释
- 压缩空白字符
- 删除属性引号（可选）
- 删除布尔属性值

**效果**:
- 代码体积减少20-30%
- 提升加载速度

---

### 6. CSS优化

**配置位置**: `vue.config.js` L142-154

**功能**:
- CSS提取为独立文件
- 禁用SourceMap（生产环境）
- 自动添加浏览器前缀（autoprefixer）

**效果**:
- 并行加载CSS和JS
- 更好的缓存策略

---

### 7. 性能预算

**配置位置**: `vue.config.js` L122-126

**限制**:
- 入口文件最大: 2MB
- 资源文件最大: 512KB
- 超过限制会产生警告

**作用**:
- 防止包体积失控
- 及时发现性能问题

---

### 8. 路径别名

**配置位置**: `vue.config.js` L129-136

**别名配置**:
```javascript
{
  '@': './src',
  'components': './components',
  'utils': './utils',
  'static': './static'
}
```

**使用**:
```javascript
// 旧写法
import { formatDate } from '../../utils/date'

// 新写法（推荐）
import { formatDate } from 'utils/date'
```

---

### 9. 预加载优化

**配置位置**: `vue.config.js` L253-254

**功能**:
- 禁用`prefetch`：不预加载异步chunk
- 禁用`preload`：不预加载同级chunk

**原因**:
- 减少不必要的网络请求
- 避免浪费带宽
- 让用户按需加载

---

## 📈 预期效果

### 构建产物对比

| 指标 | 优化前 | 优化后 | 提升 |
|-----|-------|-------|-----|
| 主包大小 | ~2.0MB | ~1.2MB | ↓40% |
| Vendor包 | 混合在主包 | 独立400KB | 缓存优化 |
| uView包 | 混合在主包 | 独立300KB | 按需加载 |
| 首屏加载 | ~3.0s | ~1.5s | ↓50% |
| Gzip后大小 | ~2.0MB | ~350KB | ↓82% |

### 性能指标

| 指标 | 目标值 | 说明 |
|-----|-------|-----|
| First Contentful Paint | < 1.5s | 首次内容绘制 |
| Largest Contentful Paint | < 2.5s | 最大内容绘制 |
| Time to Interactive | < 3.5s | 可交互时间 |
| Total Blocking Time | < 300ms | 总阻塞时间 |
| Cumulative Layout Shift | < 0.1 | 累计布局偏移 |

---

## 🛠️ 使用指南

### 1. 安装依赖

```bash
# 安装新增的构建优化依赖
npm install
```

**新增依赖**:
- `compression-webpack-plugin@^6.1.1` - Gzip压缩
- `webpack-bundle-analyzer@^4.7.0` - 构建分析
- `autoprefixer@^9.8.8` - CSS前缀

---

### 2. 构建命令

#### 标准构建（H5）

```bash
npm run build:h5
```

**输出**:
- `dist/build/h5/` - 构建产物
- `*.js` - 原始文件
- `*.js.gz` - Gzip压缩文件

#### 构建分析

```bash
npm run build:h5:analyze
```

**输出**:
- 自动打开浏览器显示构建分析报告
- 报告位置: `dist/bundle-report.html`

**分析内容**:
- 每个包的大小
- 依赖关系
- 重复代码检测
- 优化建议

#### 微信小程序构建

```bash
npm run build:mp-weixin
```

**注意**: 小程序不启用部分H5优化（如splitChunks），使用uni-app默认策略。

---

### 3. 查看构建报告

#### 方式1: 使用webpack-bundle-analyzer

```bash
npm run build:h5:analyze
```

#### 方式2: 使用现有工具

```bash
npm run analyze:bundle
```

---

### 4. 验证优化效果

#### 检查文件大小

```bash
# Windows PowerShell
Get-ChildItem -Path dist/build/h5 -Recurse -File | 
  Measure-Object -Property Length -Sum | 
  Select-Object @{Name="TotalSizeMB";Expression={[math]::Round($_.Sum / 1MB, 2)}}
```

#### 检查Gzip压缩率

```bash
# 比较.js和.js.gz文件大小
ls -lh dist/build/h5/static/js/
```

#### 性能测试

1. 使用Chrome DevTools的Lighthouse
2. 运行`npm run analyze:performance`
3. 查看Network面板的加载时间

---

## 🔍 常见问题

### Q1: 为什么小程序不启用splitChunks？

**A**: uni-app对小程序有特殊的分包策略，自定义splitChunks可能导致模块加载顺序问题。因此只在H5等平台启用。

### Q2: Gzip压缩后为什么还有原文件？

**A**: 配置了`deleteOriginalAssets: false`，保留原文件是为了兼容不支持Gzip的服务器或CDN。

### Q3: 为什么禁用prefetch/preload？

**A**: uni-app的页面加载机制与传统SPA不同，预加载可能导致不必要的资源浪费。建议按需加载。

### Q4: Tree-shaking没生效？

**检查**:
1. `package.json`中是否配置了`sideEffects`
2. 导入方式是否使用ES6 `import/export`（不要用CommonJS）
3. Terser是否正确配置

### Q5: 构建分析报告打不开？

**解决**:
```bash
# 手动打开报告
start dist/bundle-report.html  # Windows
open dist/bundle-report.html   # macOS
```

---

## 📚 最佳实践

### 1. 代码分割

✅ **推荐做法**:
```javascript
// 路由懒加载
const Home = () => import('@/pages/home/index.vue')

// 条件加载大型库
if (needChart) {
  import('echarts').then(echarts => {
    // 使用echarts
  })
}
```

❌ **避免**:
```javascript
// 不要在入口文件导入所有内容
import * as utils from './utils'
```

---

### 2. 资源引用

✅ **推荐做法**:
```javascript
// 使用别名
import { api } from 'utils/request'

// 小图片可以直接引入（会转Base64）
import iconSmall from '@/static/icon-small.png'
```

❌ **避免**:
```javascript
// 不要使用相对路径
import { api } from '../../../utils/request'
```

---

### 3. 第三方库

✅ **推荐做法**:
```javascript
// 按需引入
import { debounce } from 'lodash-es'

// 或使用babel-plugin-import自动转换
import { Button } from 'uview-ui'
```

❌ **避免**:
```javascript
// 不要全量引入
import _ from 'lodash'
import uView from 'uview-ui'
```

---

### 4. 图片优化

✅ **推荐做法**:
- 小图标(< 4KB) → 直接import
- 大图片 → 放在static目录
- 使用WebP格式（体积小50%）
- 使用CDN存储

❌ **避免**:
- 不要在代码中Base64大图
- 不要使用未压缩的PNG/JPG

---

## 🔄 持续优化

### 定期检查

**每周**:
- 运行`npm run build:h5:analyze`查看包大小
- 检查是否有意外增大的包

**每月**:
- 更新依赖到最新版本
- 重新评估分包策略
- 运行性能测试

### 优化建议

1. **监控包体积**: 设置CI/CD自动检测包大小变化
2. **代码审查**: 新增代码前检查是否引入大型依赖
3. **定期清理**: 删除未使用的依赖和代码
4. **使用CDN**: 将静态资源托管到CDN

---

## 📞 技术支持

如有问题，请联系：
- GitHub Issues: [项目地址]
- 文档: `docs/BUILD-OPTIMIZATION.md`
- 邮箱: dev@craneheart.com

---

## 📝 更新日志

### v1.1.0 (2025-11-04)
- ✅ 添加Gzip压缩支持
- ✅ 优化代码分割策略
- ✅ 启用Tree-shaking
- ✅ 添加资源优化配置
- ✅ 添加构建分析工具
- ✅ 创建优化文档

### v1.0.0 (2025-10-01)
- ✅ 初始版本
- ✅ 基础splitChunks配置
- ✅ 图片压缩

