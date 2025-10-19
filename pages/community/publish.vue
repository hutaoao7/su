<template>
  <view class="publish-page">
    <!-- 标题输入 -->
    <view class="title-section">
      <input 
        class="title-input"
        v-model="formData.title"
        placeholder="标题（必填，2-100字）"
        maxlength="100"
        :disabled="publishing"
      />
      <text class="char-count">{{ formData.title.length }}/100</text>
    </view>

    <!-- 内容输入 -->
    <view class="content-section">
      <textarea 
        class="content-textarea"
        v-model="formData.content"
        placeholder="分享你的心情或想法..."
        maxlength="2000"
        :auto-height="true"
        :disabled="publishing"
      />
      <text class="char-count">{{ formData.content.length }}/2000</text>
    </view>

    <!-- 图片上传 -->
    <view class="images-section">
      <view class="images-grid">
        <view 
          v-for="(img, index) in formData.images" 
          :key="index"
          class="image-item"
        >
          <image :src="img" class="image-preview" mode="aspectFill" />
          <view class="image-remove" @tap="removeImage(index)">
            <u-icon name="close" size="16" color="#FFFFFF"></u-icon>
          </view>
        </view>
        
        <view 
          v-if="formData.images.length < 9"
          class="image-add"
          @tap="chooseImage"
        >
          <u-icon name="plus" size="32" color="#C7C7CC"></u-icon>
          <text class="add-text">{{ formData.images.length }}/9</text>
        </view>
      </view>
    </view>

    <!-- 分类选择 -->
    <view class="category-section">
      <view class="section-label">选择分类</view>
      <scroll-view scroll-x class="category-scroll">
        <view class="category-list">
          <view 
            v-for="(cat, index) in categories" 
            :key="index"
            class="category-item"
            :class="{ active: formData.category === cat.value }"
            @tap="selectCategory(cat.value)"
          >
            {{ cat.label }}
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- 发布按钮 -->
    <view class="publish-section">
      <button 
        class="publish-btn"
        :disabled="!canPublish || publishing"
        :loading="publishing"
        @tap="handlePublish"
      >
        {{ publishing ? '发布中...' : '发布' }}
      </button>
    </view>
  </view>
</template>

<script>
import { callCloudFunction } from '@/utils/unicloud-handler.js';
import { trackEvent } from '@/utils/analytics.js';

export default {
  data() {
    return {
      formData: {
        title: '',
        content: '',
        category: 'mood',
        images: []
      },
      publishing: false,
      categories: [
        { label: '心情', value: 'mood' },
        { label: '学习', value: 'study' },
        { label: '生活', value: 'life' },
        { label: '情感', value: 'emotion' },
        { label: '求助', value: 'help' }
      ]
    };
  },
  
  computed: {
    canPublish() {
      return this.formData.title.trim().length >= 2 && 
             this.formData.content.trim().length >= 10;
    }
  },
  
  onLoad() {
    // 恢复草稿
    this.restoreDraft();
  },
  
  onUnload() {
    // 保存草稿
    if (!this.publishing && (this.formData.title || this.formData.content)) {
      this.saveDraft();
    }
  },
  
  methods: {
    selectCategory(value) {
      this.formData.category = value;
      this.saveDraft();
    },
    
    async chooseImage() {
      try {
        const res = await uni.chooseImage({
          count: 9 - this.formData.images.length,
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        });
        
        // 上传图片
        for (const tempPath of res.tempFilePaths) {
          const cloudPath = `community/${Date.now()}_${Math.random().toString(36).substr(2)}.jpg`;
          
          const uploadRes = await uniCloud.uploadFile({
            filePath: tempPath,
            cloudPath: cloudPath
          });
          
          this.formData.images.push(uploadRes.fileID || uploadRes.tempFileURL);
        }
        
        this.saveDraft();
      } catch (error) {
        console.error('[PUBLISH] 选择图片失败:', error);
      }
    },
    
    removeImage(index) {
      this.formData.images.splice(index, 1);
      this.saveDraft();
    },
    
    async handlePublish() {
      if (!this.canPublish) {
        uni.showToast({
          title: '请填写完整信息',
          icon: 'none'
        });
        return;
      }
      
      this.publishing = true;
      
      try {
        const result = await callCloudFunction('community-topics', {
          action: 'create',
          title: this.formData.title.trim(),
          content: this.formData.content.trim(),
          category: this.formData.category,
          images: this.formData.images
        }, {
          showLoading: true,
          loadingText: '发布中...'
        });
        
        if (result && result.topic_id) {
          // 埋点
          trackEvent('topic_publish_success', {
            category: this.formData.category,
            has_images: this.formData.images.length > 0
          });
          
          // 清除草稿
          this.clearDraft();
          
          uni.showToast({
            title: '发布成功',
            icon: 'success'
          });
          
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        }
      } catch (error) {
        console.error('[PUBLISH] 发布失败:', error);
        
        uni.showToast({
          title: '发布失败',
          icon: 'none'
        });
      } finally {
        this.publishing = false;
      }
    },
    
    handleCancel() {
      if (this.formData.title || this.formData.content) {
        uni.showModal({
          title: '提示',
          content: '内容未保存，确定退出吗？',
          success: (res) => {
            if (res.confirm) {
              uni.navigateBack();
            }
          }
        });
      } else {
        uni.navigateBack();
      }
    },
    
    saveDraft() {
      try {
        uni.setStorageSync('topic_draft', JSON.stringify(this.formData));
        console.log('[PUBLISH] 草稿已保存');
      } catch (error) {
        console.error('[PUBLISH] 保存草稿失败:', error);
      }
    },
    
    restoreDraft() {
      try {
        const draft = uni.getStorageSync('topic_draft');
        if (draft) {
          const draftData = JSON.parse(draft);
          
          uni.showModal({
            title: '发现草稿',
            content: '是否恢复上次编辑的内容？',
            success: (res) => {
              if (res.confirm) {
                this.formData = draftData;
                uni.showToast({
                  title: '已恢复草稿',
                  icon: 'success'
                });
              } else {
                this.clearDraft();
              }
            }
          });
        }
      } catch (error) {
        console.error('[PUBLISH] 恢复草稿失败:', error);
      }
    },
    
    clearDraft() {
      try {
        uni.removeStorageSync('topic_draft');
        console.log('[PUBLISH] 草稿已清除');
      } catch (error) {
        console.error('[PUBLISH] 清除草稿失败:', error);
      }
    }
  }
};
</script>

<style scoped>
.publish-page {
  min-height: 100vh;
  background: #F5F5F7;
  padding: 24rpx;
  /* 顶部安全区域 */
  padding-top: calc(24rpx + constant(safe-area-inset-top));
  padding-top: calc(24rpx + env(safe-area-inset-top));
  /* 底部安全区域 */
  padding-bottom: calc(24rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

.title-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.title-input {
  width: 100%;
  font-size: 36rpx;
  font-weight: 600;
  color: #1D1D1F;
}

.content-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.content-textarea {
  width: 100%;
  min-height: 400rpx;
  font-size: 30rpx;
  color: #1D1D1F;
  line-height: 1.8;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #86868B;
  margin-top: 16rpx;
}

.images-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.image-item {
  position: relative;
  padding-bottom: 100%;
}

.image-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}

.image-remove {
  position: absolute;
  top: 8rpx;
  right: 8rpx;
  width: 48rpx;
  height: 48rpx;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-add {
  padding-bottom: 100%;
  background: #F9FAFB;
  border: 2rpx dashed #C7C7CC;
  border-radius: 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.add-text {
  font-size: 24rpx;
  color: #86868B;
  position: absolute;
  bottom: 20rpx;
}

.category-section {
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 16rpx;
}

.section-label {
  font-size: 28rpx;
  font-weight: 600;
  color: #1D1D1F;
  margin-bottom: 20rpx;
}

.category-scroll {
  height: 80rpx;
}

.category-list {
  display: flex;
  gap: 16rpx;
  padding-bottom: 8rpx;
}

.category-item {
  padding: 16rpx 32rpx;
  background: #F9FAFB;
  border-radius: 48rpx;
  font-size: 28rpx;
  color: #1D1D1F;
  white-space: nowrap;
}

.category-item.active {
  background: #0A84FF;
  color: #FFFFFF;
}

.publish-section {
  margin: 48rpx 0;
}

.publish-btn {
  width: 100%;
  height: 96rpx;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #FFFFFF;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.publish-btn[disabled] {
  opacity: 0.5;
}
</style>
