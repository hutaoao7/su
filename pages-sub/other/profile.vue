<template>
  <view class="profile-page">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 主内容区 -->
    <view v-else class="main-content">
      <!-- 头像编辑区 -->
      <view class="avatar-section">
        <view class="avatar-container" @tap="handleAvatarClick">
          <image 
            v-if="formData.avatar" 
            :src="formData.avatar" 
            class="avatar-image"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text class="placeholder-text">未设置头像</text>
          </view>
          <view class="avatar-mask">
            <text class="camera-icon">📷</text>
            <text class="mask-text">更换头像</text>
          </view>
        </view>
        <view class="avatar-tip">
          <text class="tip-text">点击上传头像（支持JPG/PNG，不超过2MB）</text>
        </view>
        <view class="uid-display">
          <text class="uid-label">用户ID: </text>
          <text class="uid-value">{{ uid }}</text>
        </view>
      </view>

      <!-- 表单区域 -->
      <view class="form-section">
        <!-- 昵称 -->
        <view class="form-item">
          <text class="form-label">昵称 <text class="required">*</text></text>
          <input 
            class="form-input"
            v-model="formData.nickname" 
            placeholder="请输入昵称（2-20字符）"
            maxlength="20"
            :disabled="saving"
            @blur="validateNickname"
          />
          <text v-if="errors.nickname" class="error-text">{{ errors.nickname }}</text>
        </view>

        <!-- 性别 -->
        <view class="form-item">
          <text class="form-label">性别</text>
          <view class="radio-group">
            <view 
              v-for="item in genderOptions" 
              :key="item.value"
              class="radio-item"
              :class="{ active: formData.gender === item.value }"
              @tap="formData.gender = item.value"
            >
              <text class="radio-text">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <!-- 生日 -->
        <view class="form-item">
          <text class="form-label">生日</text>
          <picker
            mode="date"
            :value="formData.birthday"
            :start="minDate"
            :end="maxDate"
            @change="onBirthdayChange"
            :disabled="saving"
          >
            <view class="picker-input" :class="{ 'has-value': formData.birthday }">
              <text class="picker-text">{{ formData.birthday || '请选择出生日期' }}</text>
              <text class="picker-arrow">📅</text>
            </view>
          </picker>
        </view>

        <!-- 个人简介 -->
        <view class="form-item">
          <text class="form-label">个人简介</text>
          <textarea 
            class="form-textarea"
            v-model="formData.bio" 
            placeholder="介绍一下自己吧（最多200字）"
            maxlength="200"
            :disabled="saving"
          />
          <text class="char-count">{{ formData.bio.length }}/200</text>
        </view>
      </view>

      <!-- 信息提示 -->
      <view class="info-section">
        <view class="info-item">
          <text class="info-icon">ℹ️</text>
          <text class="info-text">修改后的资料将实时同步到云端</text>
        </view>
      </view>
    </view>

    <!-- 保存按钮（固定底部） -->
    <view class="save-section" v-if="!loading">
      <button 
        class="save-button"
        :class="{ disabled: !canSave || saving }"
        :disabled="!canSave || saving"
        @tap="handleSave"
      >
        {{ saving ? '保存中...' : '保存' }}
      </button>
    </view>

    <!-- 头像上传遮罩 -->
    <view v-if="uploading" class="uploading-mask">
      <view class="uploading-content">
        <text class="uploading-text">上传中...</text>
        <text class="uploading-progress">{{ uploadProgress }}%</text>
      </view>
    </view>
    
    <!-- 隐藏的canvas用于图片裁剪 -->
    <!-- #ifdef MP-WEIXIN -->
    <canvas canvas-id="avatar-canvas" style="width: 800px; height: 800px; position: fixed; left: -9999px; top: -9999px;"></canvas>
    <!-- #endif -->
  </view>
</template>

<script>
import { 
  isAuthed, 
  getLoginData, 
  getUid
} from '@/utils/auth.js';
import { callCloudFunction } from '@/utils/unicloud-handler.js';

export default {
  name: 'UserProfile',
  
  data() {
    return {
      // 表单数据
      formData: {
        nickname: '',
        avatar: '',
        gender: '',
        birthday: '',
        bio: ''
      },
      
      // 原始数据
      originalData: {},
      
      // 状态
      loading: true,
      saving: false,
      uploading: false,
      uploadProgress: 0,
      
      // 错误
      errors: {
        nickname: ''
      },
      
      // 用户信息
      uid: '',
      
      // 性别选项
      genderOptions: [
        { label: '男', value: 'male' },
        { label: '女', value: 'female' },
        { label: '其他', value: 'other' }
      ],
      
      // 防抖定时器
      saveDebounceTimer: null,
      lastSaveTime: 0,
      saveDebounceDelay: 1000  // 1秒防抖
    };
  },
  
  computed: {
    // 是否有修改
    isModified() {
      return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
    },
    
    // 是否可以保存
    canSave() {
      if (!this.isModified) {
        return false;
      }
      
      if (!this.formData.nickname || this.formData.nickname.length < 2) {
        return false;
      }
      
      return true;
    },
    
    // 最小日期（100年前）
    minDate() {
      const year = new Date().getFullYear() - 100;
      return `${year}-01-01`;
    },
    
    // 最大日期（今天）
    maxDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  },
  
  onLoad() {
    console.log('[PROFILE_EDIT] 页面加载');
    
    if (!isAuthed()) {
      uni.showToast({
        title: '请先登录',
        icon: 'none',
        duration: 2000
      });
      setTimeout(() => {
        uni.navigateTo({ url: '/pages/login/login' });
      }, 500);
      return;
    }
    
    this.loadUserInfo();
  },
  
  onBackPress() {
    // 监听系统返回按钮
    if (this.isModified) {
      uni.showModal({
        title: '提示',
        content: '资料已修改但未保存，确定放弃修改？',
        confirmText: '放弃',
        cancelText: '继续编辑',
        success: (res) => {
          if (res.confirm) {
            uni.navigateBack();
          }
        }
      });
      return true; // 阻止默认返回
    }
    return false; // 执行默认返回
  },
  
  methods: {
    async loadUserInfo() {
      try {
        this.loading = true;
        
        const loginData = getLoginData();
        this.uid = loginData.uid || '';
        const userInfo = loginData.userInfo || {};
        
        this.formData = {
          nickname: userInfo.nickname || '',
          avatar: userInfo.avatar || '',
          gender: userInfo.gender || '',
          birthday: userInfo.birthday || '',
          bio: userInfo.bio || ''
        };
        
        this.originalData = JSON.parse(JSON.stringify(this.formData));
        
        this.loading = false;
        
      } catch (error) {
        console.error('[PROFILE_EDIT] 加载失败:', error);
        this.loading = false;
        uni.showToast({
          title: '加载失败，请重试',
          icon: 'none'
        });
      }
    },
    
    handleAvatarClick() {
      if (this.saving || this.uploading) {
        return;
      }
      
      uni.showActionSheet({
        itemList: ['从相册选择', '拍照'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.chooseAndUploadAvatar(['album']);
          } else if (res.tapIndex === 1) {
            this.chooseAndUploadAvatar(['camera']);
          }
        }
      });
    },
    
    // 裁剪图片为正方形
    cropImage(imagePath) {
      return new Promise((resolve, reject) => {
        // 获取图片信息
        uni.getImageInfo({
          src: imagePath,
          success: (imageInfo) => {
            const { width, height } = imageInfo;
            
            // 计算裁剪区域（中心正方形）
            const size = Math.min(width, height);
            const left = (width - size) / 2;
            const top = (height - size) / 2;
            
            // 创建canvas进行裁剪
            // #ifdef MP-WEIXIN
            const ctx = uni.createCanvasContext('avatar-canvas');
            
            // 绘制裁剪后的图片
            ctx.drawImage(imagePath, -left, -top, width, height);
            
            ctx.draw(false, () => {
              // 导出裁剪后的图片
              uni.canvasToTempFilePath({
                canvasId: 'avatar-canvas',
                destWidth: 800,  // 固定输出800x800
                destHeight: 800,
                success: (res) => {
                  resolve({ tempFilePath: res.tempFilePath });
                },
                fail: reject
              });
            });
            // #endif
            
            // #ifndef MP-WEIXIN
            // 非小程序环境，直接返回原图
            resolve({ tempFilePath: imagePath });
            // #endif
          },
          fail: reject
        });
      });
    },
    
    async chooseAndUploadAvatar(sourceType) {
      try {
        this.uploading = true;
        this.uploadProgress = 0;
        
        // 1. 选择图片
        const chooseResult = await uni.chooseImage({
          count: 1,
          sizeType: ['original'],  // 先选择原图，后续裁剪
          sourceType: sourceType
        });
        
        let tempFilePath = chooseResult.tempFilePaths[0];
        this.uploadProgress = 10;
        
        // 2. 裁剪图片（正方形）
        try {
          const cropResult = await this.cropImage(tempFilePath);
          tempFilePath = cropResult.tempFilePath;
          this.uploadProgress = 20;
        } catch (cropError) {
          console.warn('[PROFILE_EDIT] 裁剪跳过:', cropError);
          // 裁剪失败则使用原图
        }
        
        const cloudPath = `avatars/${this.uid}_${Date.now()}.jpg`;
        
        const uploadResult = await uniCloud.uploadFile({
          filePath: tempFilePath,
          cloudPath: cloudPath,
          onUploadProgress: (progressEvent) => {
            const percent = Math.floor((progressEvent.loaded / progressEvent.total) * 60);
            this.uploadProgress = 30 + percent;
          }
        });
        
        this.uploadProgress = 100;
        
        const fileURL = uploadResult.fileID || uploadResult.tempFileURL;
        this.formData.avatar = fileURL;
        
        uni.showToast({
          title: '头像上传成功',
          icon: 'success'
        });
        
        this.uploading = false;
        this.uploadProgress = 0;
        
      } catch (error) {
        console.error('[PROFILE_EDIT] 头像上传失败:', error);
        this.uploading = false;
        uni.showToast({
          title: '头像上传失败',
          icon: 'none'
        });
      }
    },
    
    // 生日选择器变更
    onBirthdayChange(e) {
      this.formData.birthday = e.detail.value;
      console.log('[PROFILE_EDIT] 生日已选择:', this.formData.birthday);
    },
    
    validateNickname() {
      const nickname = this.formData.nickname;
      
      if (!nickname) {
        this.errors.nickname = '昵称不能为空';
        return false;
      }
      
      if (nickname.length < 2 || nickname.length > 20) {
        this.errors.nickname = '昵称长度应为2-20字符';
        return false;
      }
      
      if (!/^[a-zA-Z0-9\u4e00-\u9fa5_-]+$/.test(nickname)) {
        this.errors.nickname = '昵称仅支持中英文、数字、下划线';
        return false;
      }
      
      this.errors.nickname = '';
      return true;
    },
    
    async handleSave() {
      // 防抖检查
      const now = Date.now();
      if (now - this.lastSaveTime < this.saveDebounceDelay) {
        const remainingTime = Math.ceil((this.saveDebounceDelay - (now - this.lastSaveTime)) / 1000);
        uni.showToast({
          title: `请等待${remainingTime}秒后再保存`,
          icon: 'none',
          duration: 1000
        });
        return;
      }
      
      if (this.saving || !this.canSave) {
        return;
      }
      
      if (!this.validateNickname()) {
        uni.showToast({
          title: this.errors.nickname,
          icon: 'none'
        });
        return;
      }
      
      try {
        this.saving = true;
        this.lastSaveTime = now;  // 记录保存时间
        
        const result = await callCloudFunction('user-update-profile', {
          nickname: this.formData.nickname,
          avatar: this.formData.avatar,
          gender: this.formData.gender,
          birthday: this.formData.birthday,
          bio: this.formData.bio
        }, {
          showLoading: true,
          loadingText: '保存中...',
          timeout: 10000
        });
        
        if (result && result.userInfo) {
          const loginData = getLoginData();
          const newUserInfo = {
            ...loginData.userInfo,
            ...result.userInfo
          };
          
          uni.setStorageSync('uni_id_user_info', JSON.stringify(newUserInfo));
          
          uni.$emit('AUTH_CHANGED', { authed: true });
          
          uni.showToast({
            title: '保存成功',
            icon: 'success',
            duration: 1500
          });
          
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        }
        
        this.saving = false;
        
      } catch (error) {
        console.error('[PROFILE_EDIT] 保存失败:', error);
        this.saving = false;
        
        uni.showToast({
          title: '保存失败，请重试',
          icon: 'none'
        });
      }
    },
    
  }
};
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #F0F0F5;
  /* 添加顶部安全区域 */
  padding-top: constant(safe-area-inset-top);
  padding-top: env(safe-area-inset-top);
  /* 底部留出保存按钮和安全区域的空间 */
  padding-bottom: calc(160rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(160rpx + env(safe-area-inset-bottom));
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

.main-content {
  padding-top: 20rpx;
}

.avatar-section {
  background: #FFFFFF;
  padding: 60rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 32rpx;
}

.avatar-container {
  width: 160rpx;
  height: 160rpx;
  border-radius: 80rpx;
  position: relative;
  overflow: hidden;
}

.avatar-image {
  width: 100%;
  height: 100%;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: #E3E3E8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.placeholder-text {
  font-size: 24rpx;
  color: #8E8E93;
}

.avatar-mask {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 50rpx;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}

.camera-icon {
  font-size: 24rpx;
  color: #FFFFFF;
}

.mask-text {
  font-size: 22rpx;
  color: #FFFFFF;
}

.avatar-tip {
  margin-top: 24rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #8E8E93;
}

.uid-display {
  margin-top: 16rpx;
}

.uid-label {
  font-size: 24rpx;
  color: #8E8E93;
}

.uid-value {
  font-size: 24rpx;
  color: #666;
  font-family: monospace;
}

.form-section {
  margin: 0 32rpx 32rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  padding: 40rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.required {
  color: #FA3534;
}

.form-input {
  width: 100%;
  height: 88rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
}

.picker-input {
  width: 100%;
  height: 88rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 0 24rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker-text {
  font-size: 28rpx;
  color: #999;
  flex: 1;
}

.picker-input.has-value .picker-text {
  color: #333;
}

.picker-arrow {
  font-size: 28rpx;
  margin-left: 16rpx;
}

.form-textarea {
  width: 100%;
  min-height: 200rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 24rpx;
  font-size: 28rpx;
  color: #333;
}

.error-text {
  display: block;
  font-size: 24rpx;
  color: #FA3534;
  margin-top: 8rpx;
}

.char-count {
  display: block;
  text-align: right;
  font-size: 24rpx;
  color: #8E8E93;
  margin-top: 8rpx;
}

.radio-group {
  display: flex;
  gap: 16rpx;
}

.radio-item {
  flex: 1;
  height: 72rpx;
  background: #F5F5F5;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.radio-item.active {
  background: #007AFF;
}

.radio-text {
  font-size: 28rpx;
  color: #333;
}

.radio-item.active .radio-text {
  color: #FFFFFF;
}

.info-section {
  margin: 0 32rpx 32rpx;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 16rpx;
}

.info-icon {
  font-size: 28rpx;
}

.info-text {
  font-size: 24rpx;
  color: #666;
}

.save-section {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 32rpx;
  /* 添加底部安全区域 */
  padding-bottom: calc(32rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(32rpx + env(safe-area-inset-bottom));
  background: #FFFFFF;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.08);
  z-index: 999;
}

.save-button {
  width: 100%;
  height: 96rpx;
  background: #007AFF;
  color: #FFFFFF;
  border: none;
  border-radius: 48rpx;
  font-size: 32rpx;
  font-weight: 600;
}

.save-button.disabled {
  background: #C7C7CC;
  opacity: 0.6;
}

.uploading-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.uploading-content {
  padding: 60rpx 80rpx;
  background: #FFFFFF;
  border-radius: 24rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24rpx;
}

.uploading-text {
  font-size: 28rpx;
  color: #333;
}

.uploading-progress {
  font-size: 32rpx;
  color: #007AFF;
  font-weight: 600;
}
</style>
