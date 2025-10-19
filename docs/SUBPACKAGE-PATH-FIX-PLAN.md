# 分包路径错误修复方案

## 问题描述
真机预览时多个模块点击无反应，原因是代码中使用的页面路径与实际分包配置不一致。

## 错误路径对照表

### 1. 心理干预模块
| 功能 | 错误路径 | 正确路径 |
|------|---------|---------|
| AI倾诉 | /pages/intervene/chat | /pages-sub/intervene/chat |
| 正念冥想 | /pages/intervene/meditation | /pages-sub/intervene/meditation |
| 自然音疗 | /pages/intervene/nature | /pages-sub/intervene/nature |
| 干预方案 | /pages/intervene/intervene | /pages-sub/intervene/intervene |

### 2. 其他功能模块
| 功能 | 错误路径 | 正确路径 |
|------|---------|---------|
| 问题反馈 | /pages/feedback/feedback | /pages-sub/other/feedback |
| CDK兑换 | /pages/cdk/redeem | /pages-sub/other/redeem |
| 数据统计 | /pages/admin/metrics | /pages-sub/other/metrics |

### 3. 评估模块
| 功能 | 错误路径 | 正确路径 |
|------|---------|---------|
| 评估结果 | /pages/assess/result | /pages-sub/assess/result |
| 学业压力 | /pages/assess/academic/index | /pages-sub/assess/academic/index |
| 睡眠质量 | /pages/assess/sleep/index | /pages-sub/assess/sleep/index |
| 社交焦虑 | /pages/assess/social/index | /pages-sub/assess/social/index |
| 压力评估 | /pages/assess/stress/index | /pages-sub/assess/stress/index |

### 4. 音乐模块
| 功能 | 错误路径 | 正确路径 |
|------|---------|---------|
| 音乐列表 | /pages/music/index | /pages-sub/music/index |
| 播放器 | /pages/music/player | /pages-sub/music/player |

### 5. 社区模块
| 功能 | 错误路径 | 正确路径 |
|------|---------|---------|
| 话题详情 | /pages/community/detail | /pages-sub/community/detail |

## 需要修改的文件清单

### 核心文件（必须修改）
1. **pages/features/features.vue** - 功能入口页面
2. **pages/user/home.vue** - 用户中心快捷入口
3. **common/features.js** - 功能配置文件
4. **components/common/FeatureCard.vue** - 功能卡片组件
5. **pages/home/home.vue** - 首页功能入口

### 可能涉及的文件
1. **pages/stress/intervention.vue** - 压力干预跳转
2. **pages/stress/detect.vue** - 检测后的跳转
3. **pages/intervene/intervene.vue** - 干预方案页跳转
4. **utils/router.js** - 路由工具（如果有）
5. **pages/community/index.vue** - 社区页跳转

## 修复步骤

### Step 1: 修复功能探索页面 (pages/features/features.vue)
- 修改所有干预模块路径
- 修改评估模块路径
- 确保navigateTo使用正确的分包路径

### Step 2: 修复用户中心 (pages/user/home.vue)
- 修改CDK兑换路径
- 修改问题反馈路径
- 修改其他快捷入口路径

### Step 3: 修复功能配置 (common/features.js)
- 统一更新所有功能路径配置
- 确保与pages.json中的分包配置一致

### Step 4: 修复其他页面跳转
- 搜索并替换所有错误路径
- 确保所有navigateTo/redirectTo使用正确路径

### Step 5: 优化分包预下载
- 在pages.json中配置preloadRule
- 确保分包在需要时提前加载

## 验证方案

### 1. 单元测试
- 测试每个功能模块的跳转
- 验证路径是否正确

### 2. 真机测试
- 在真机上逐个点击测试
- 确认所有功能正常跳转

### 3. 性能测试
- 检查分包加载时间
- 优化预加载策略

## 注意事项

1. **向后兼容**：保持主包中的核心页面不变
2. **错误处理**：添加跳转失败的提示
3. **分包大小**：确保每个分包不超过2MB
4. **加载策略**：合理配置分包预下载

## 回滚方案

如果修复后出现问题：
1. 恢复原始文件
2. 将分包页面移回主包
3. 重新配置pages.json
