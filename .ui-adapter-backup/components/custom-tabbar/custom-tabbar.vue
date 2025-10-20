<template>
  <view class="custom-tabbar">
    <!-- 顶部边框线 -->
    <view class="tabbar-border"></view>
    
    <!-- TabBar主体 -->
    <view class="tabbar-content">
      <view 
        v-for="(item, index) in tabList" 
        :key="index"
        class="tab-item"
        @tap="switchTab(index, item.pagePath)"
      >
        <!-- 图标容器 -->
        <view class="icon-wrapper">
          <!-- 首页图标 -->
          <view v-if="item.key === 'home'" class="icon-home" :class="{ active: currentIndex === index }">
            <view class="home-roof"></view>
            <view class="home-base"></view>
          </view>
          
          <!-- 探索图标 -->
          <view v-else-if="item.key === 'explore'" class="icon-explore" :class="{ active: currentIndex === index }">
            <view class="explore-circle"></view>
            <view class="explore-line"></view>
          </view>
          
          <!-- AI倾诉图标 -->
          <view v-else-if="item.key === 'chat'" class="icon-chat" :class="{ active: currentIndex === index }">
            <view class="chat-bubble">
              <view class="chat-tail"></view>
            </view>
          </view>
          
          <!-- 社区图标 -->
          <view v-else-if="item.key === 'community'" class="icon-community" :class="{ active: currentIndex === index }">
            <view class="community-circle"></view>
            <view class="community-line"></view>
          </view>
          
          <!-- 个人中心图标 -->
          <view v-else-if="item.key === 'profile'" class="icon-profile" :class="{ active: currentIndex === index }">
            <view class="profile-head"></view>
            <view class="profile-body"></view>
          </view>
        </view>
        
        <!-- 文字 -->
        <text class="tab-text" :class="{ active: currentIndex === index }">
          {{ item.text }}
        </text>
      </view>
    </view>
    
    <!-- 安全区域占位 -->
    <view class="safe-area"></view>
  </view>
</template>

<script>
import tabBarManager from '@/utils/tabbar-manager.js';

export default {
  name: 'CustomTabbar',
  data() {
    return {
      currentIndex: 0,
      tabList: [
        {
          key: 'home',
          pagePath: '/pages/home/home',
          text: '首页'
        },
        {
          key: 'explore',
          pagePath: '/pages/features/features',
          text: '探索'
        },
        {
          key: 'chat',
          pagePath: '/pages/intervene/chat',
          text: 'AI倾诉'
        },
        {
          key: 'community',
          pagePath: '/pages/community/index',
          text: '社区'
        },
        {
          key: 'profile',
          pagePath: '/pages/user/home',
          text: '我的'
        }
      ]
    }
  },
  created() {
    // 从全局管理器获取当前索引
    this.currentIndex = tabBarManager.getCurrentIndex();
    
    // 添加监听器，监听状态变化
    this.onIndexChange = (newIndex) => {
      this.currentIndex = newIndex;
    };
    tabBarManager.addListener(this.onIndexChange);
  },
  
  mounted() {
    // 组件挂载后，再次确保状态同步
    this.$nextTick(() => {
      tabBarManager.updateFromCurrentPage();
      this.currentIndex = tabBarManager.getCurrentIndex();
    });
  },
  
  beforeDestroy() {
    // 移除监听器，防止内存泄漏
    if (this.onIndexChange) {
      tabBarManager.removeListener(this.onIndexChange);
    }
  },
  methods: {
    switchTab(index, path) {
      if (this.currentIndex === index) return;
      
      // 立即更新本地状态，提供即时反馈
      this.currentIndex = index;
      
      // 更新全局状态
      tabBarManager.setCurrentIndex(index);
      
      // 判断是否为tabBar页面，使用switchTab，否则使用navigateTo
      const tabBarPages = this.tabList.map(item => item.pagePath);
      if (tabBarPages.includes(path)) {
        uni.switchTab({
          url: path,
          success: () => {
            // 成功后再次确保状态同步
            setTimeout(() => {
              tabBarManager.updateFromCurrentPage();
            }, 100);
          },
          fail: (err) => {
            console.error('switchTab failed:', err);
            // 失败时恢复状态
            tabBarManager.updateFromCurrentPage();
            this.currentIndex = tabBarManager.getCurrentIndex();
          }
        });
      }
    },
    setCurrentIndex(index) {
      this.currentIndex = index;
    }
  }
}
</script>

<style scoped>
.custom-tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #FFFFFF;
  box-shadow: 0 -1px 6px rgba(0, 0, 0, 0.05);
  z-index: 999;
}

.tabbar-border {
  height: 44px;
  background-color: #F0F0F0;
}

.tabbar-content {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-around;
  height: 50px;
  padding: 0 10px;
  box-sizing: border-box;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  position: relative;
  min-width: 60px;
  padding: 0 5px;
}

.icon-wrapper {
  width: 44px; /* 按测试指南要求：容器26x26 */
  height: 44px;
  position: relative;
  margin-bottom: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 首页图标 */
.icon-home {
  width: 44px; /* 图标本体22x22，避免溢出与重叠 */
  height: 44px;
  position: relative;
}

.home-roof {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 7px solid transparent;
  border-right: 7px solid transparent;
  border-bottom: 6px solid #666666;
}

.home-base {
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px; /* 收紧高度避免与屋顶产生视觉挤压 */
  background: transparent;
  border: 2px solid #666666;
  border-top: none;
}

.icon-home.active .home-roof {
  border-bottom-color: #539df3;
}

.icon-home.active .home-base {
  border-color: #539df3;
}

/* 探索图标 */
.icon-explore {
  width: 44px;
  height: 44px;
  position: relative;
}

.explore-circle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 44px;
  height: 44px;
  border: 2px solid #666666;
  border-radius: 50%;
}

.explore-line {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 44px;
  height: 44px;
  background-color: #666666;
  transform: translate(-50%, -50%) rotate(-45deg); /* 测试指南强调的定位与旋转 */
  transform-origin: center center;
}

.icon-explore.active .explore-circle {
  border-color: #539df3;
}

.icon-explore.active .explore-line {
  background-color: #539df3;
}

/* AI倾诉图标 */
.icon-chat {
  width: 44px;
  height: 44px;
  position: relative;
}

.chat-bubble {
  position: absolute;
  top: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px; /* 收紧高度，留出尾巴位置，避免被裁剪/重叠 */
  border: 2px solid #666666;
  border-radius: 8px;
  background: transparent;
}

.chat-tail {
  position: absolute;
  bottom: -2px; /* 尾巴不超出icon容器，防止被裁剪 */
  left: 5px;
  width: 0;
  height: 0;
  border-left: 3px solid transparent;
  border-right: 3px solid transparent;
  border-top: 3px solid #666666;
}

.icon-chat.active .chat-bubble {
  border-color: #539df3;
}

.icon-chat.active .chat-tail {
  border-top-color: #539df3;
}

/* 社区图标 */
.icon-community {
  width: 44px;
  height: 44px;
  position: relative;
}

.community-circle {
  position: absolute;
  top: 2px; /* 上移1px并缩小，避免与下划线重叠 */
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  border: 2px solid #666666;
  border-radius: 50%;
}

.community-line {
  position: absolute;
  bottom: 3px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  background-color: #666666;
  border-radius: 1px;
}

.icon-community.active .community-circle {
  border-color: #539df3;
}

.icon-community.active .community-line {
  background-color: #539df3;
}

/* 个人中心图标 */
.icon-profile {
  width: 44px;
  height: 44px;
  position: relative;
}

.profile-head {
  position: absolute;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px; /* 略微缩小头部，减轻与躯干的贴合感 */
  border: 2px solid #666666;
  border-radius: 50%;
  background: transparent;
}

.profile-body {
  position: absolute;
  bottom: 2px; /* 下移1px，避免与头部发生视觉重叠 */
  left: 50%;
  transform: translateX(-50%);
  width: 44px;
  height: 44px;
  border: 2px solid #666666;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  border-bottom: none;
  background: transparent;
}

.icon-profile.active .profile-head,
.icon-profile.active .profile-body {
  border-color: #539df3;
}

/* 文字样式 */
.tab-text {
  font-size: 12px;
  color: #666666;
  margin-top: 2px;
  line-height: 1;
}

.tab-text.active {
  color: #539df3;
}

/* 安全区域 */
.safe-area {
  height: constant(safe-area-inset-bottom);
  height: env(safe-area-inset-bottom);
}

/* 响应式适配 */
@media screen and (max-width: 375px) {
  .tabbar-content {
    padding: 0 5px;
  }
  
  .tab-text {
    font-size: 12px;
  }
}
</style>
