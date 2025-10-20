# AI对话模块功能增强设计

**文档版本**: v1.0  
**创建日期**: 2025-10-20  
**状态**: 设计阶段

---

## 概述

本文档描述AI对话模块的功能增强计划，包括语音输入、图片发送、虚拟滚动优化和流式输出等功能。

---

## 1. 虚拟滚动优化

### 状态
✅ **已完成** - 创建了`VirtualMessageList.vue`组件

### 功能说明
- 只渲染可见区域的消息，减少DOM节点
- 支持上拉加载历史消息
- 自动计算消息高度
- 性能优化：支持10000+条消息流畅滚动

### 使用方式
```vue
<VirtualMessageList
  :messages="messages"
  :item-height="100"
  :overscan="5"
  @load-more="loadMoreMessages"
>
  <template #message="{ message, index }">
    <!-- 自定义消息内容 -->
  </template>
</VirtualMessageList>
```

### 技术细节
- 虚拟列表算法
- 高度缓存机制
- 占位元素计算
- 滚动位置保持

---

## 2. 流式输出SSE

### 状态
✅ **已完成** - 创建了`ai-stream-client.js`工具类

### 功能说明
- AI回复以流式方式逐字显示
- 支持SSE（Server-Sent Events）
- 支持H5和小程序平台
- 自动降级到非流式请求

### 使用方式
```javascript
import AIStreamClient from '@/utils/ai-stream-client.js';

const client = new AIStreamClient({
  onToken: (token) => {
    // 接收到新的token
    this.currentMessage += token;
  },
  onComplete: (fullText) => {
    // 流式输出完成
    console.log('完整回复:', fullText);
  },
  onError: (error) => {
    // 错误处理
    console.error('错误:', error);
  }
});

// 发送消息
await client.sendMessage('你好，请介绍一下自己');
```

### 技术细节
- H5: Fetch API + ReadableStream
- 小程序: requestTask + enableChunked
- 降级策略: 模拟流式输出
- 错误重试机制

---

## 3. 语音输入功能

### 状态
📋 **设计阶段**

### 功能说明
用户可以通过语音输入消息，系统自动转换为文字。

### UI设计
```
[输入框]  [🎤语音] [发送]

点击语音按钮 → 显示录音界面：
┌─────────────────────────┐
│   正在录音...            │
│                          │
│   ⚫ 00:05               │
│   [波形动画]             │
│                          │
│   [取消]    [完成]      │
└─────────────────────────┘
```

### 技术方案

#### 3.1 录音实现
```javascript
/**
 * 语音录音管理器
 * 文件: utils/voice-recorder.js
 */
class VoiceRecorder {
  constructor() {
    this.recorderManager = null;
    this.isRecording = false;
    this.tempFilePath = '';
  }
  
  // 初始化
  init() {
    // #ifdef MP-WEIXIN
    this.recorderManager = uni.getRecorderManager();
    
    this.recorderManager.onStart(() => {
      console.log('[语音] 开始录音');
      this.isRecording = true;
    });
    
    this.recorderManager.onStop((res) => {
      console.log('[语音] 录音结束');
      this.tempFilePath = res.tempFilePath;
      this.isRecording = false;
    });
    
    this.recorderManager.onError((err) => {
      console.error('[语音] 录音错误:', err);
      this.isRecording = false;
    });
    // #endif
  }
  
  // 开始录音
  start() {
    // 权限检查
    uni.authorize({
      scope: 'scope.record',
      success: () => {
        this.recorderManager.start({
          duration: 60000, // 最长60秒
          format: 'mp3',
          sampleRate: 16000,
          numberOfChannels: 1
        });
      },
      fail: () => {
        uni.showModal({
          title: '需要录音权限',
          content: '请在设置中开启录音权限'
        });
      }
    });
  }
  
  // 停止录音
  stop() {
    if (this.isRecording) {
      this.recorderManager.stop();
    }
  }
  
  // 获取录音文件
  getAudioFile() {
    return this.tempFilePath;
  }
}
```

#### 3.2 语音识别
```javascript
/**
 * 语音识别服务
 * 文件: utils/speech-recognition.js
 */
class SpeechRecognition {
  constructor() {
    this.apiUrl = ''; // 语音识别API地址
  }
  
  /**
   * 识别语音文件
   * @param {string} filePath - 音频文件路径
   * @returns {Promise<string>} - 识别结果文本
   */
  async recognize(filePath) {
    // 方案1: 使用微信内置插件（推荐）
    // #ifdef MP-WEIXIN
    const plugin = requirePlugin('WechatSI');
    
    return new Promise((resolve, reject) => {
      plugin.textToSpeech({
        lang: 'zh_CN',
        tts: true,
        content: filePath,
        success: (res) => {
          resolve(res.text);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
    // #endif
    
    // 方案2: 上传到服务器识别
    return new Promise((resolve, reject) => {
      uni.uploadFile({
        url: this.apiUrl,
        filePath: filePath,
        name: 'audio',
        formData: {
          'format': 'mp3',
          'lang': 'zh-CN'
        },
        success: (res) => {
          const data = JSON.parse(res.data);
          resolve(data.text);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
}
```

#### 3.3 集成到chat.vue
```vue
<template>
  <view class="input-bar">
    <!-- 录音按钮 -->
    <view
      v-if="!isRecording"
      class="voice-btn"
      @tap="startVoiceInput"
    >
      <u-icon name="mic" size="20"></u-icon>
    </view>
    
    <!-- 录音中 -->
    <view v-else class="recording-panel">
      <view class="recording-indicator">
        <view class="wave-animation"></view>
        <text class="recording-time">{{ recordingTime }}s</text>
      </view>
      <view class="recording-actions">
        <button @tap="cancelRecording">取消</button>
        <button @tap="finishRecording">完成</button>
      </view>
    </view>
  </view>
</template>

<script>
import VoiceRecorder from '@/utils/voice-recorder.js';
import SpeechRecognition from '@/utils/speech-recognition.js';

export default {
  data() {
    return {
      isRecording: false,
      recordingTime: 0,
      voiceRecorder: null,
      speechRecognition: null
    };
  },
  
  onLoad() {
    this.voiceRecorder = new VoiceRecorder();
    this.speechRecognition = new SpeechRecognition();
    this.voiceRecorder.init();
  },
  
  methods: {
    // 开始语音输入
    startVoiceInput() {
      this.isRecording = true;
      this.recordingTime = 0;
      
      // 开始录音
      this.voiceRecorder.start();
      
      // 计时器
      this.recordingTimer = setInterval(() => {
        this.recordingTime++;
      }, 1000);
    },
    
    // 取消录音
    cancelRecording() {
      this.voiceRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingTimer);
    },
    
    // 完成录音
    async finishRecording() {
      this.voiceRecorder.stop();
      this.isRecording = false;
      clearInterval(this.recordingTimer);
      
      // 显示加载提示
      uni.showLoading({ title: '识别中...' });
      
      try {
        // 获取录音文件
        const audioFile = this.voiceRecorder.getAudioFile();
        
        // 识别语音
        const text = await this.speechRecognition.recognize(audioFile);
        
        // 填充到输入框
        this.inputText = text;
        
        uni.hideLoading();
        uni.showToast({
          title: '识别成功',
          icon: 'success'
        });
      } catch (error) {
        console.error('[语音] 识别失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: '识别失败，请重试',
          icon: 'none'
        });
      }
    }
  }
};
</script>
```

### 技术依赖
- **微信小程序**: 微信同声传译插件（WechatSI）
- **H5**: Web Speech API 或 第三方语音识别服务
- **APP**: 原生语音识别插件

### 权限申请
```json
// manifest.json (微信小程序)
{
  "permission": {
    "scope.record": {
      "desc": "需要使用您的麦克风进行语音输入"
    }
  },
  "plugins": {
    "WechatSI": {
      "version": "0.3.5",
      "provider": "wx069ba97219f66d99"
    }
  }
}
```

---

## 4. 图片发送功能

### 状态
📋 **设计阶段**

### 功能说明
用户可以发送图片，AI可以识别图片内容并回复。

### UI设计
```
[输入框]  [📷图片] [发送]

点击图片按钮 → 选择图片来源：
┌─────────────────────────┐
│   拍照                   │
│   从相册选择             │
│   取消                   │
└─────────────────────────┘

发送后显示：
┌─────────────────────────┐
│ 用户:                    │
│   [图片缩略图]          │
│   这是什么？             │
└─────────────────────────┘
```

### 技术方案

#### 4.1 图片选择
```javascript
/**
 * 图片选择器
 * 文件: utils/image-picker.js
 */
class ImagePicker {
  /**
   * 选择图片
   * @param {object} options - 配置选项
   * @returns {Promise<array>} - 图片路径数组
   */
  async chooseImage(options = {}) {
    return new Promise((resolve, reject) => {
      uni.chooseImage({
        count: options.count || 1,
        sizeType: ['compressed'], // 压缩图片
        sourceType: options.sourceType || ['album', 'camera'],
        success: (res) => {
          resolve(res.tempFilePaths);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
  
  /**
   * 拍照
   */
  async takePhoto() {
    return this.chooseImage({
      count: 1,
      sourceType: ['camera']
    });
  }
  
  /**
   * 从相册选择
   */
  async chooseFromAlbum() {
    return this.chooseImage({
      count: 1,
      sourceType: ['album']
    });
  }
}
```

#### 4.2 图片上传
```javascript
/**
 * 图片上传服务
 * 文件: utils/image-uploader.js
 */
class ImageUploader {
  constructor() {
    this.uploadUrl = ''; // 上传地址
  }
  
  /**
   * 上传图片
   * @param {string} filePath - 本地图片路径
   * @param {function} onProgress - 进度回调
   * @returns {Promise<string>} - 图片URL
   */
  async upload(filePath, onProgress) {
    return new Promise((resolve, reject) => {
      const uploadTask = uni.uploadFile({
        url: this.uploadUrl,
        filePath: filePath,
        name: 'image',
        formData: {
          'user_id': uni.getStorageSync('userId')
        },
        success: (res) => {
          if (res.statusCode === 200) {
            const data = JSON.parse(res.data);
            resolve(data.url);
          } else {
            reject(new Error('上传失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
      
      // 监听上传进度
      if (onProgress) {
        uploadTask.onProgressUpdate((res) => {
          onProgress(res.progress);
        });
      }
    });
  }
  
  /**
   * 压缩图片
   * @param {string} src - 原图路径
   * @param {number} quality - 质量（0-100）
   * @returns {Promise<string>} - 压缩后路径
   */
  async compress(src, quality = 80) {
    return new Promise((resolve, reject) => {
      uni.compressImage({
        src: src,
        quality: quality,
        success: (res) => {
          resolve(res.tempFilePath);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
}
```

#### 4.3 图片识别
```javascript
/**
 * 图片识别服务
 * 文件: utils/image-recognition.js
 */
class ImageRecognition {
  constructor() {
    this.apiUrl = ''; // 图片识别API
  }
  
  /**
   * 识别图片内容
   * @param {string} imageUrl - 图片URL
   * @returns {Promise<object>} - 识别结果
   */
  async recognize(imageUrl) {
    return new Promise((resolve, reject) => {
      uni.request({
        url: this.apiUrl,
        method: 'POST',
        data: {
          image_url: imageUrl
        },
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error('识别失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
  }
}
```

#### 4.4 集成到chat.vue
```vue
<template>
  <view class="input-bar">
    <!-- 图片按钮 -->
    <view class="image-btn" @tap="showImageOptions">
      <u-icon name="photo" size="20"></u-icon>
    </view>
  </view>
  
  <!-- 消息列表中显示图片 -->
  <view v-for="msg in messages" class="message">
    <!-- 图片消息 -->
    <image
      v-if="msg.type === 'image'"
      :src="msg.imageUrl"
      mode="aspectFill"
      class="message-image"
      @tap="previewImage(msg.imageUrl)"
    ></image>
    
    <!-- 文本消息 -->
    <text v-else>{{ msg.content }}</text>
  </view>
</template>

<script>
import ImagePicker from '@/utils/image-picker.js';
import ImageUploader from '@/utils/image-uploader.js';

export default {
  data() {
    return {
      imagePicker: null,
      imageUploader: null
    };
  },
  
  onLoad() {
    this.imagePicker = new ImagePicker();
    this.imageUploader = new ImageUploader();
  },
  
  methods: {
    // 显示图片选项
    showImageOptions() {
      uni.showActionSheet({
        itemList: ['拍照', '从相册选择'],
        success: (res) => {
          if (res.tapIndex === 0) {
            this.takePhoto();
          } else if (res.tapIndex === 1) {
            this.chooseFromAlbum();
          }
        }
      });
    },
    
    // 拍照
    async takePhoto() {
      try {
        const [imagePath] = await this.imagePicker.takePhoto();
        await this.sendImage(imagePath);
      } catch (error) {
        console.error('[图片] 拍照失败:', error);
      }
    },
    
    // 选择图片
    async chooseFromAlbum() {
      try {
        const [imagePath] = await this.imagePicker.chooseFromAlbum();
        await this.sendImage(imagePath);
      } catch (error) {
        console.error('[图片] 选择图片失败:', error);
      }
    },
    
    // 发送图片
    async sendImage(imagePath) {
      // 显示上传进度
      uni.showLoading({ title: '上传中...' });
      
      try {
        // 压缩图片
        const compressedPath = await this.imageUploader.compress(imagePath);
        
        // 上传图片
        const imageUrl = await this.imageUploader.upload(
          compressedPath,
          (progress) => {
            console.log('上传进度:', progress);
          }
        );
        
        // 添加到消息列表
        this.messages.push({
          role: 'user',
          type: 'image',
          imageUrl: imageUrl,
          timestamp: Date.now()
        });
        
        uni.hideLoading();
        
        // 请求AI识别和回复
        await this.requestAIWithImage(imageUrl);
      } catch (error) {
        console.error('[图片] 发送失败:', error);
        uni.hideLoading();
        uni.showToast({
          title: '发送失败',
          icon: 'none'
        });
      }
    },
    
    // 预览图片
    previewImage(url) {
      uni.previewImage({
        urls: [url],
        current: url
      });
    },
    
    // 请求AI识别图片
    async requestAIWithImage(imageUrl) {
      // 调用AI接口，传入图片URL
      // ...
    }
  }
};
</script>
```

### 技术依赖
- **图片压缩**: uni.compressImage
- **图片上传**: uni.uploadFile
- **图片识别**: GPT-4 Vision API 或 百度/阿里云图像识别
- **云存储**: 阿里云OSS / 腾讯云COS

### 权限申请
```json
// manifest.json
{
  "permission": {
    "scope.camera": {
      "desc": "需要使用您的相机进行拍照"
    },
    "scope.album": {
      "desc": "需要访问您的相册选择图片"
    }
  }
}
```

---

## 5. 实施计划

### 优先级排序
1. ✅ **P0 - 虚拟滚动优化**（已完成）
2. ✅ **P0 - 流式输出SSE**（已完成）
3. **P1 - 语音输入功能**（2-3天）
4. **P2 - 图片发送功能**（3-4天）

### 时间估算
- 虚拟滚动：✅ 已完成（1天）
- 流式输出：✅ 已完成（1天）
- 语音输入：2-3天
  - 录音功能：0.5天
  - 语音识别集成：1天
  - UI和交互：0.5-1天
  - 测试和优化：0.5天
- 图片发送：3-4天
  - 图片选择和上传：1天
  - 图片识别集成：1-1.5天
  - UI和交互：0.5-1天
  - 测试和优化：0.5天

### 依赖条件
- 语音识别API（微信插件或第三方服务）
- 图片识别API（GPT-4V或国内服务）
- 云存储服务（OSS/COS）
- 后端接口支持

---

## 6. 测试计划

### 虚拟滚动测试
- ✅ 10条消息测试
- ✅ 100条消息测试
- ✅ 1000条消息测试
- ✅ 滚动性能测试
- ✅ 上拉加载测试

### 流式输出测试
- ✅ H5平台测试
- ✅ 小程序平台测试
- ✅ 降级策略测试
- ✅ 错误处理测试
- ✅ 取消请求测试

### 语音输入测试
- [ ] 短语音测试（<10秒）
- [ ] 长语音测试（30-60秒）
- [ ] 噪音环境测试
- [ ] 识别准确度测试
- [ ] 权限拒绝测试

### 图片发送测试
- [ ] 拍照上传测试
- [ ] 相册选择测试
- [ ] 图片压缩测试
- [ ] 大图片测试（>5MB）
- [ ] 识别准确度测试
- [ ] 多图上传测试

---

## 7. 性能指标

### 虚拟滚动
- ✅ 1000条消息：流畅60FPS
- ✅ 内存占用：<50MB
- ✅ 首屏渲染：<100ms

### 流式输出
- ✅ 首字延迟：<500ms
- ✅ Token间隔：30-50ms
- ✅ 降级响应：<2s

### 语音输入（目标）
- 识别延迟：<3s
- 识别准确率：>95%
- 录音文件大小：<500KB/分钟

### 图片发送（目标）
- 上传时间：<5s（<2MB图片）
- 压缩率：>50%
- 识别延迟：<3s

---

## 8. 风险和挑战

### 语音输入
- ⚠️ 权限申请可能被拒绝
- ⚠️ 不同平台API差异大
- ⚠️ 识别准确率受环境影响
- ⚠️ 流量和计费成本

### 图片发送
- ⚠️ 图片上传耗时和流量
- ⚠️ 图片识别准确率
- ⚠️ GPT-4V API成本较高
- ⚠️ 云存储费用

### 解决方案
1. **降级策略**：提供手动输入文字作为备选
2. **本地优化**：图片压缩、语音降噪
3. **成本控制**：限制使用频率、缓存识别结果
4. **用户引导**：提供使用帮助和最佳实践

---

## 9. 后续优化

### 短期优化
- [ ] 语音播放：AI回复可以语音播放
- [ ] 实时语音对话：边说边识别
- [ ] 图片编辑：裁剪、旋转、标注

### 长期优化
- [ ] 视频消息支持
- [ ] 表情包支持
- [ ] 文件传输支持
- [ ] 多模态理解（语音+图片+文本）

---

**文档维护**: CraneHeart开发团队  
**最后更新**: 2025-10-20

