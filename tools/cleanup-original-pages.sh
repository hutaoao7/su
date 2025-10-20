#!/bin/bash
# 清理原始页面文件（可选）
# 警告：运行此脚本将删除原始页面文件！

echo "⚠️ 此操作将删除原始页面文件，是否继续？(y/n)"
read -r confirm

if [ "$confirm" = "y" ]; then
  rm -f "pages/assess/result.vue" && echo "删除: pages/assess/result.vue"
  rm -f "pages/assess/academic/index.vue" && echo "删除: pages/assess/academic/index.vue"
  rm -f "pages/assess/sleep/index.vue" && echo "删除: pages/assess/sleep/index.vue"
  rm -f "pages/assess/social/anxiety.vue" && echo "删除: pages/assess/social/anxiety.vue"
  rm -f "pages/assess/social/support.vue" && echo "删除: pages/assess/social/support.vue"
  rm -f "pages/assess/stress/index.vue" && echo "删除: pages/assess/stress/index.vue"
  rm -f "pages/intervene/chat.vue" && echo "删除: pages/intervene/chat.vue"
  rm -f "pages/intervene/meditation.vue" && echo "删除: pages/intervene/meditation.vue"
  rm -f "pages/intervene/nature.vue" && echo "删除: pages/intervene/nature.vue"
  rm -f "pages/music/index.vue" && echo "删除: pages/music/index.vue"
  rm -f "pages/music/player.vue" && echo "删除: pages/music/player.vue"
  rm -f "pages/community/detail.vue" && echo "删除: pages/community/detail.vue"
  rm -f "pages/feedback/feedback.vue" && echo "删除: pages/feedback/feedback.vue"
  rm -f "pages/cdk/redeem.vue" && echo "删除: pages/cdk/redeem.vue"
  rm -f "pages/admin/metrics.vue" && echo "删除: pages/admin/metrics.vue"
  echo "✅ 清理完成"
else
  echo "❌ 已取消"
fi
