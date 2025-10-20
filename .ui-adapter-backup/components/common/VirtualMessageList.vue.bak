<template>
  <view class="virtual-message-list">
    <!-- 滚动容器 -->
    <scroll-view
      class="scroll-container"
      scroll-y
      :scroll-top="scrollTop"
      :scroll-into-view="scrollIntoView"
      scroll-with-animation
      @scroll="handleScroll"
      @scrolltoupper="handleScrollToUpper"
    >
      <!-- 顶部占位 -->
      <view class="placeholder-top" :style="{ height: topPlaceholderHeight + 'px' }"></view>
      
      <!-- 可见区域的消息 -->
      <view
        v-for="(msg, index) in visibleMessages"
        :key="msg._uniqueId"
        :id="'msg-' + msg._originalIndex"
        class="message-wrapper"
        :data-index="msg._originalIndex"
      >
        <!-- 插槽：自定义消息内容 -->
        <slot
          name="message"
          :message="msg"
          :index="msg._originalIndex"
        ></slot>
      </view>
      
      <!-- 底部占位 -->
      <view class="placeholder-bottom" :style="{ height: bottomPlaceholderHeight + 'px' }"></view>
      
      <!-- 加载更多提示 -->
      <view v-if="showLoadMore" class="load-more">
        <view class="loading-spinner"></view>
        <text class="loading-text">加载更多...</text>
      </view>
    </scroll-view>
  </view>
</template>

<script>
/**
 * 虚拟消息列表组件
 * 
 * 功能：
 * - 虚拟滚动，只渲染可见区域的消息
 * - 支持上拉加载历史消息
 * - 自动计算消息高度
 * - 支持滚动到指定消息
 * - 性能优化：大量消息时保持流畅
 * 
 * Props:
 * - messages: Array - 消息列表
 * - itemHeight: Number - 预估的单条消息高度
 * - overscan: Number - 预渲染的额外消息数量
 * - onLoadMore: Function - 加载更多回调
 * 
 * Events:
 * - scroll: 滚动事件
 * - load-more: 触发加载更多
 * 
 * Slots:
 * - message: 消息内容（必须）
 * 
 * 使用示例：
 * <VirtualMessageList
 *   :messages="messages"
 *   :item-height="100"
 *   :overscan="5"
 *   @load-more="loadMoreMessages"
 * >
 *   <template #message="{ message, index }">
 *     <view class="message">{{ message.content }}</view>
 *   </template>
 * </VirtualMessageList>
 */
export default {
  name: 'VirtualMessageList',
  
  props: {
    // 消息列表
    messages: {
      type: Array,
      default: () => []
    },
    
    // 预估的单条消息高度（用于初始计算）
    itemHeight: {
      type: Number,
      default: 100
    },
    
    // 预渲染的额外消息数量（上下各N条）
    overscan: {
      type: Number,
      default: 5
    },
    
    // 容器高度（不传则自动计算）
    containerHeight: {
      type: Number,
      default: 0
    },
    
    // 是否自动滚动到底部（新消息时）
    autoScrollToBottom: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      // 滚动位置
      scrollTop: 0,
      scrollIntoView: '',
      
      // 容器尺寸
      viewportHeight: 0,
      
      // 消息高度缓存
      itemHeights: new Map(),
      
      // 可见范围
      visibleStartIndex: 0,
      visibleEndIndex: 0,
      
      // 占位高度
      topPlaceholderHeight: 0,
      bottomPlaceholderHeight: 0,
      
      // 加载状态
      showLoadMore: false,
      isLoadingMore: false,
      
      // 唯一ID计数器（用于key）
      uniqueIdCounter: 0
    };
  },
  
  computed: {
    /**
     * 可见区域的消息列表
     */
    visibleMessages() {
      const messages = this.messages.slice(
        this.visibleStartIndex,
        this.visibleEndIndex + 1
      );
      
      // 添加唯一ID和原始索引
      return messages.map((msg, index) => ({
        ...msg,
        _uniqueId: msg._uniqueId || `msg-${this.visibleStartIndex + index}-${this.uniqueIdCounter++}`,
        _originalIndex: this.visibleStartIndex + index
      }));
    },
    
    /**
     * 总消息数
     */
    totalCount() {
      return this.messages.length;
    }
  },
  
  watch: {
    messages: {
      handler(newMessages, oldMessages) {
        // 消息数量变化时重新计算
        if (newMessages.length !== oldMessages?.length) {
          this.$nextTick(() => {
            this.updateVisibleRange();
            
            // 如果是新增消息且开启自动滚动，则滚动到底部
            if (
              this.autoScrollToBottom &&
              newMessages.length > (oldMessages?.length || 0)
            ) {
              this.scrollToBottom();
            }
          });
        }
      },
      deep: true
    }
  },
  
  mounted() {
    this.init();
  },
  
  methods: {
    /**
     * 初始化
     */
    async init() {
      // 获取容器高度
      await this.getViewportHeight();
      
      // 初始化消息高度缓存
      this.initItemHeights();
      
      // 计算可见范围
      this.updateVisibleRange();
      
      // 滚动到底部
      if (this.messages.length > 0) {
        this.scrollToBottom();
      }
    },
    
    /**
     * 获取视口高度
     */
    getViewportHeight() {
      return new Promise((resolve) => {
        if (this.containerHeight > 0) {
          this.viewportHeight = this.containerHeight;
          resolve();
          return;
        }
        
        const query = uni.createSelectorQuery().in(this);
        query.select('.scroll-container')
          .boundingClientRect(data => {
            if (data) {
              this.viewportHeight = data.height;
            } else {
              // 降级方案：使用系统信息
              const systemInfo = uni.getSystemInfoSync();
              this.viewportHeight = systemInfo.windowHeight * 0.7; // 假设占70%
            }
            resolve();
          })
          .exec();
      });
    },
    
    /**
     * 初始化消息高度缓存
     */
    initItemHeights() {
      // 为所有消息设置初始预估高度
      this.messages.forEach((msg, index) => {
        if (!this.itemHeights.has(index)) {
          this.itemHeights.set(index, this.itemHeight);
        }
      });
    },
    
    /**
     * 更新可见范围
     */
    updateVisibleRange() {
      if (this.viewportHeight === 0 || this.totalCount === 0) {
        return;
      }
      
      let accumulatedHeight = 0;
      let startIndex = 0;
      let endIndex = 0;
      
      // 计算起始索引
      for (let i = 0; i < this.totalCount; i++) {
        const height = this.itemHeights.get(i) || this.itemHeight;
        
        if (accumulatedHeight + height >= this.scrollTop) {
          startIndex = Math.max(0, i - this.overscan);
          break;
        }
        
        accumulatedHeight += height;
      }
      
      // 计算结束索引
      accumulatedHeight = 0;
      for (let i = startIndex; i < this.totalCount; i++) {
        const height = this.itemHeights.get(i) || this.itemHeight;
        accumulatedHeight += height;
        
        if (accumulatedHeight >= this.viewportHeight + this.scrollTop - this.getOffsetTop(startIndex)) {
          endIndex = Math.min(this.totalCount - 1, i + this.overscan);
          break;
        }
      }
      
      // 确保至少渲染一屏
      if (endIndex === 0) {
        endIndex = Math.min(
          this.totalCount - 1,
          startIndex + Math.ceil(this.viewportHeight / this.itemHeight) + this.overscan
        );
      }
      
      this.visibleStartIndex = startIndex;
      this.visibleEndIndex = endIndex;
      
      // 更新占位高度
      this.updatePlaceholderHeights();
    },
    
    /**
     * 获取指定索引之前的累计高度
     */
    getOffsetTop(index) {
      let height = 0;
      for (let i = 0; i < index; i++) {
        height += this.itemHeights.get(i) || this.itemHeight;
      }
      return height;
    },
    
    /**
     * 更新占位高度
     */
    updatePlaceholderHeights() {
      // 顶部占位
      this.topPlaceholderHeight = this.getOffsetTop(this.visibleStartIndex);
      
      // 底部占位
      let bottomHeight = 0;
      for (let i = this.visibleEndIndex + 1; i < this.totalCount; i++) {
        bottomHeight += this.itemHeights.get(i) || this.itemHeight;
      }
      this.bottomPlaceholderHeight = bottomHeight;
    },
    
    /**
     * 处理滚动事件
     */
    handleScroll(e) {
      this.scrollTop = e.detail.scrollTop;
      this.updateVisibleRange();
      
      // 触发滚动事件
      this.$emit('scroll', e);
    },
    
    /**
     * 滚动到顶部时触发
     */
    handleScrollToUpper() {
      if (this.isLoadingMore) return;
      
      // 显示加载提示
      this.showLoadMore = true;
      this.isLoadingMore = true;
      
      // 触发加载更多
      this.$emit('load-more', {
        done: () => {
          this.showLoadMore = false;
          this.isLoadingMore = false;
        }
      });
    },
    
    /**
     * 滚动到底部
     */
    scrollToBottom() {
      this.$nextTick(() => {
        if (this.totalCount > 0) {
          // 计算总高度
          let totalHeight = 0;
          for (let i = 0; i < this.totalCount; i++) {
            totalHeight += this.itemHeights.get(i) || this.itemHeight;
          }
          
          // 滚动到底部
          this.scrollTop = Math.max(0, totalHeight - this.viewportHeight);
          this.updateVisibleRange();
        }
      });
    },
    
    /**
     * 滚动到指定消息
     */
    scrollToMessage(index) {
      if (index < 0 || index >= this.totalCount) {
        console.warn('[VirtualMessageList] 无效的消息索引:', index);
        return;
      }
      
      // 计算目标位置
      const targetTop = this.getOffsetTop(index);
      this.scrollTop = targetTop;
      this.updateVisibleRange();
    },
    
    /**
     * 更新消息的实际高度（供外部调用）
     */
    updateItemHeight(index, height) {
      if (height > 0) {
        this.itemHeights.set(index, height);
        this.updatePlaceholderHeights();
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.virtual-message-list {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.scroll-container {
  width: 100%;
  height: 100%;
  overflow-y: auto;
}

.placeholder-top,
.placeholder-bottom {
  width: 100%;
}

.message-wrapper {
  width: 100%;
}

.load-more {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx;
  color: #8E8E93;
  font-size: 24rpx;
}

.loading-spinner {
  width: 32rpx;
  height: 32rpx;
  border: 4rpx solid #E5E5EA;
  border-top-color: #007AFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 12rpx;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 24rpx;
  color: #8E8E93;
}
</style>

