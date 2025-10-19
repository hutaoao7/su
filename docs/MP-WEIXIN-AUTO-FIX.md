# 微信小程序自动修复说明

## 📋 问题背景

uni-app 编译微信小程序时，生成的 `app.json` 文件可能不完整，缺少 `pages`、`subPackages`、`tabBar` 等配置，导致小程序报错："pages 不能为空"。

## ✅ 已添加的自动化脚本

### 1. 生产构建（自动修复）

```bash
npm run build:mp-weixin
```

**说明**：此命令会自动执行以下操作：
1. 编译微信小程序生产版本
2. 自动运行修复脚本，生成完整的 `app.json`
3. 备份原始文件到 `app-backup.json`

### 2. 手动修复

```bash
npm run fix:mp-weixin
```

**说明**：独立的修复脚本，适用于以下场景：
- 使用 HBuilderX 编译后需要修复
- 开发模式编译后需要修复
- 任何需要重新生成 `app.json` 的情况

## 🔧 使用场景

### 场景 1: 使用 HBuilderX 编译

如果您使用 HBuilderX 的可视化界面编译微信小程序：

1. 在 HBuilderX 中点击"运行" -> "运行到小程序模拟器" -> "微信开发者工具"
2. 编译完成后，运行修复命令：
   ```bash
   npm run fix:mp-weixin
   ```

### 场景 2: 使用命令行生产构建

直接使用自动化命令，无需手动修复：

```bash
npm run build:mp-weixin
```

### 场景 3: 开发模式

开发模式使用 watch 监听，无法自动修复。编译后手动执行：

```bash
# 在 HBuilderX 中启动开发模式
# 或运行: npm run dev:mp-weixin

# 编译完成后，在另一个终端执行修复
npm run fix:mp-weixin
```

## 📝 修复脚本做了什么

`tools/fix-mp-weixin-build.js` 脚本会：

1. ✅ 读取项目根目录的 `pages.json` 配置
2. ✅ 将 uni-app 格式转换为微信小程序 `app.json` 格式
3. ✅ 生成完整的配置项：
   - `pages`: 主包页面路径
   - `subPackages`: 分包配置
   - `window`: 全局窗口样式
   - `tabBar`: 底部导航栏
   - `usingComponents`: 全局组件
4. ✅ 备份原始文件（如果存在）
5. ✅ 写入新的 `app.json` 到编译目录

## 🎯 验证修复结果

修复完成后，检查文件 `unpackage/dist/dev/mp-weixin/app.json` 应该包含：

```json
{
  "pages": [
    "pages/home/home",
    "pages/user/home",
    // ... 更多页面
  ],
  "subPackages": [
    {
      "root": "pages-sub/assess",
      "name": "assess",
      "pages": ["result", "academic/index", ...]
    },
    // ... 更多分包
  ],
  "window": { ... },
  "tabBar": { ... },
  "usingComponents": { ... }
}
```

## ⚠️ 注意事项

1. **每次编译后都需要修复**：如果使用 HBuilderX 编译，每次编译后都需要运行 `npm run fix:mp-weixin`
2. **自动化仅限命令行构建**：只有使用 `npm run build:mp-weixin` 才会自动修复
3. **开发模式手动修复**：watch 模式无法自动执行后续命令，需手动修复
4. **备份文件**：修复脚本会自动备份原文件，无需担心数据丢失
5. **tabBar 图标路径**：必须在 `pages.json` 中明确指定 `iconPath` 和 `selectedIconPath`，否则可能导致图标找不到的错误

## 🐛 常见问题

### 问题1: tabBar 图标找不到

**错误信息**：
```
Error: app.json: ["tabBar"]["list"][0]["iconPath"]: "static/images/首页.png" 未找到
```

**原因**：`pages.json` 中的 `tabBar.list` 没有指定图标路径，修复脚本会使用 `text` 字段自动生成路径，但可能与实际文件名不匹配。

**解决方案**：在 `pages.json` 中明确指定图标路径：

```json
"tabBar": {
  "list": [
    { 
      "pagePath": "pages/home/home", 
      "text": "首页",
      "iconPath": "static/images/home.png",
      "selectedIconPath": "static/images/home-active.png"
    }
  ]
}
```

### 问题2: pages 不能为空

**错误信息**：
```
Error: app.json: pages 不能为空
```

**原因**：uni-app 编译后生成的 `app.json` 缺少 `pages` 配置。

**解决方案**：运行修复脚本 `npm run fix:mp-weixin`

## 🚀 推荐工作流

### 开发阶段
```bash
# 方式1: 使用 HBuilderX 可视化编译
# 1. 在 HBuilderX 中运行到微信开发者工具
# 2. 编译完成后执行: npm run fix:mp-weixin

# 方式2: 纯命令行
# Terminal 1: 开发模式（无需此步骤，直接用 HBuilderX）
# npm run dev:mp-weixin

# Terminal 2: 首次编译后修复一次
npm run fix:mp-weixin
```

### 生产构建
```bash
# 一条命令搞定，自动修复
npm run build:mp-weixin
```

## 📞 问题排查

如果修复后仍有问题：

1. **检查 pages.json**：确保源文件配置正确
2. **清理缓存**：
   ```bash
   # 删除编译目录
   rm -rf unpackage/dist/dev/mp-weixin
   # 重新编译
   npm run build:mp-weixin
   ```
3. **查看备份**：检查 `app-backup.json` 对比差异
4. **微信开发者工具**：尝试清除缓存并重新编译

## 📄 相关文件

- 修复脚本：`tools/fix-mp-weixin-build.js`
- 源配置：`pages.json`
- 目标文件：`unpackage/dist/dev/mp-weixin/app.json`
- 包配置：`package.json` (scripts 部分)

---

**最后更新时间**: 2025-10-13

