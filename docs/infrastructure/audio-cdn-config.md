# 音频CDN配置文档

## 文档信息

- **创建日期**: 2025-10-20
- **版本**: v1.0.0
- **维护人**: 运维团队

---

## 一、CDN服务商选择

### 推荐方案：阿里云OSS + CDN

**选择理由**：
1. 与uniCloud阿里云版本天然集成
2. 国内访问速度快，节点覆盖广
3. 价格合理，按量计费
4. 完善的监控和日志系统
5. 支持音频流媒体加速

**替代方案**：
- 腾讯云COS + CDN
- 七牛云Kodo + CDN
- 又拍云存储 + CDN

---

## 二、OSS存储配置

### 2.1 创建OSS Bucket

```bash
# 阿里云CLI创建Bucket
aliyun oss mb oss://craneheart-audio \
  --region oss-cn-hangzhou \
  --acl public-read \
  --storage-class Standard
```

**Bucket配置**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| Bucket名称 | craneheart-audio | 音频专用存储桶 |
| 地域 | 华东1（杭州） | oss-cn-hangzhou |
| 存储类型 | 标准存储 | 高频访问 |
| 读写权限 | 公共读 | 允许匿名读取 |
| 版本控制 | 关闭 | 音频文件不需要版本 |

### 2.2 目录结构设计

```
craneheart-audio/
├── audio/                    # 音频文件目录
│   ├── meditation/          # 冥想引导
│   │   ├── breath_01.mp3
│   │   ├── breath_02.mp3
│   │   └── ...
│   ├── nature/              # 自然音效
│   │   ├── forest_01.mp3
│   │   ├── ocean_01.mp3
│   │   └── ...
│   ├── music/               # 放松音乐
│   │   ├── piano_01.mp3
│   │   └── ...
│   ├── sleep/               # 助眠音乐
│   │   ├── white_noise.mp3
│   │   └── ...
│   └── focus/               # 专注音乐
│       └── ...
├── covers/                  # 封面图片目录
│   ├── meditation/
│   ├── nature/
│   └── ...
└── transcoded/              # 转码后文件（多码率）
    ├── 128k/
    ├── 192k/
    └── 320k/
```

### 2.3 命名规范

**音频文件命名**：
```
格式：{category}_{type}_{number}.{format}
示例：
  - meditation_breath_01.mp3      # 冥想-呼吸练习-01
  - nature_forest_01.mp3          # 自然-森林-01
  - music_piano_relax_01.mp3      # 音乐-钢琴放松-01
  - sleep_white_noise_01.mp3      # 助眠-白噪音-01
```

**封面图命名**：
```
格式：{track_id}_cover.{format}
示例：
  - meditation_breath_01_cover.jpg
  - nature_forest_01_cover.jpg
```

---

## 三、CDN配置

### 3.1 创建CDN域名

**域名配置**：

| 配置项 | 值 | 说明 |
|--------|-----|------|
| 加速域名 | audio.craneheart.com | 音频加速域名 |
| 业务类型 | 音视频点播加速 | VOD |
| 源站类型 | OSS域名 | craneheart-audio.oss-cn-hangzhou.aliyuncs.com |
| 端口 | 80, 443 | 支持HTTPS |
| 回源协议 | HTTPS | 安全传输 |

### 3.2 缓存策略

```javascript
// 缓存配置规则
const cacheRules = [
  {
    path: '/audio/**/*.mp3',
    cacheTime: 2592000, // 30天
    cacheType: 'cache'
  },
  {
    path: '/audio/**/*.m4a',
    cacheTime: 2592000, // 30天
    cacheType: 'cache'
  },
  {
    path: '/covers/**/*.jpg',
    cacheTime: 1209600, // 14天
    cacheType: 'cache'
  },
  {
    path: '/covers/**/*.png',
    cacheTime: 1209600, // 14天
    cacheType: 'cache'
  }
];
```

**缓存规则说明**：
- 音频文件：30天长缓存（文件不常变更）
- 封面图片：14天中等缓存
- 源站不缓存（s-maxage=0）
- 支持客户端缓存（max-age）

### 3.3 防盗链配置

```javascript
// Referer白名单
const refererWhitelist = [
  'https://craneheart.com',
  'https://*.craneheart.com',
  'https://servicewechat.com', // 微信小程序
];

// Referer配置
{
  allowEmpty: false,        // 不允许空Referer
  whitelist: refererWhitelist,
  blacklist: [],
  enableUA: false           // 不启用User-Agent检测
}
```

### 3.4 HTTPS配置

```bash
# 上传SSL证书
aliyun cdn SetDomainServerCertificate \
  --DomainName audio.craneheart.com \
  --ServerCertificateStatus on \
  --CertName craneheart-2025 \
  --ServerCertificate "$(cat cert.pem)" \
  --PrivateKey "$(cat key.pem)"
```

**HTTPS设置**：
- 强制HTTPS跳转：开启
- HTTPS安全加速：开启
- HTTP/2：开启
- TLS版本：TLS 1.2+

---

## 四、音频处理

### 4.1 上传前处理

**推荐格式**：
- 主格式：MP3（320kbps CBR）
- 备选格式：M4A（AAC 256kbps）
- 采样率：44.1kHz
- 声道：立体声（Stereo）

**处理流程**：
```bash
# 使用FFmpeg转码
ffmpeg -i input.wav \
  -codec:a libmp3lame \
  -b:a 320k \
  -ar 44100 \
  -ac 2 \
  -f mp3 \
  output.mp3

# 生成封面缩略图（从视频提取或使用默认图）
ffmpeg -i output.mp3 \
  -an -vcodec copy \
  cover.jpg
```

### 4.2 OSS音频转码（可选）

阿里云OSS支持实时音频转码，可生成多码率版本：

```javascript
// OSS音频转码样式
const transcodeStyles = {
  '128k': 'audio/mp3,b_128k',
  '192k': 'audio/mp3,b_192k',
  '320k': 'audio/mp3,b_320k'
};

// 使用示例
const audioUrl = 'https://audio.craneheart.com/audio/meditation/breath_01.mp3';
const lowQualityUrl = `${audioUrl}?x-oss-process=audio/mp3,b_128k`;
```

### 4.3 文件大小限制

| 类型 | 建议大小 | 最大限制 |
|------|----------|----------|
| 短音频（< 5分钟） | < 5MB | 10MB |
| 中音频（5-15分钟） | < 15MB | 30MB |
| 长音频（> 15分钟） | < 30MB | 50MB |
| 封面图 | < 200KB | 500KB |

---

## 五、前端集成

### 5.1 环境配置

```javascript
// config/cdn.js
export default {
  // CDN域名
  audioDomain: 'https://audio.craneheart.com',
  coverDomain: 'https://audio.craneheart.com',
  
  // 路径模板
  audioPath: '/audio/{category}/{filename}',
  coverPath: '/covers/{category}/{filename}',
  
  // 转码参数（可选）
  transcodeParams: {
    low: '?x-oss-process=audio/mp3,b_128k',
    medium: '?x-oss-process=audio/mp3,b_192k',
    high: ''  // 原始文件
  },
  
  // 超时设置
  timeout: 30000 // 30秒
};
```

### 5.2 URL构建工具

```javascript
// utils/audio-url-builder.js
import cdnConfig from '@/config/cdn.js';

/**
 * 构建音频URL
 */
export function buildAudioUrl(trackId, quality = 'high') {
  // trackId格式：meditation_breath_01
  const parts = trackId.split('_');
  const category = parts[0];
  const filename = `${trackId}.mp3`;
  
  let url = `${cdnConfig.audioDomain}/audio/${category}/${filename}`;
  
  // 添加转码参数
  if (quality !== 'high' && cdnConfig.transcodeParams[quality]) {
    url += cdnConfig.transcodeParams[quality];
  }
  
  return url;
}

/**
 * 构建封面URL
 */
export function buildCoverUrl(trackId) {
  const parts = trackId.split('_');
  const category = parts[0];
  const filename = `${trackId}_cover.jpg`;
  
  return `${cdnConfig.coverDomain}/covers/${category}/${filename}`;
}

/**
 * 根据网络状况选择质量
 */
export function getAdaptiveQuality() {
  // #ifdef H5
  if (navigator.connection) {
    const effectiveType = navigator.connection.effectiveType;
    switch (effectiveType) {
      case 'slow-2g':
      case '2g':
        return 'low';
      case '3g':
        return 'medium';
      case '4g':
      default:
        return 'high';
    }
  }
  // #endif
  
  // 小程序使用网络类型判断
  // #ifdef MP-WEIXIN
  return new Promise((resolve) => {
    uni.getNetworkType({
      success: (res) => {
        const networkType = res.networkType;
        if (networkType === 'wifi') {
          resolve('high');
        } else if (networkType === '4g') {
          resolve('medium');
        } else {
          resolve('low');
        }
      },
      fail: () => {
        resolve('medium'); // 默认中等质量
      }
    });
  });
  // #endif
  
  return 'high'; // 默认高质量
}
```

### 5.3 使用示例

```vue
<template>
  <view>
    <audio :src="audioUrl" />
  </view>
</template>

<script>
import { buildAudioUrl, getAdaptiveQuality } from '@/utils/audio-url-builder.js';

export default {
  data() {
    return {
      audioUrl: ''
    };
  },
  
  async onLoad() {
    // 自动选择质量
    const quality = await getAdaptiveQuality();
    this.audioUrl = buildAudioUrl('meditation_breath_01', quality);
  }
};
</script>
```

---

## 六、监控与运维

### 6.1 监控指标

**需要监控的指标**：

1. **流量监控**
   - 日流量
   - 峰值带宽
   - 请求量

2. **命中率监控**
   - CDN缓存命中率（目标 > 95%）
   - 回源率
   - 回源带宽

3. **性能监控**
   - 平均响应时间
   - 下载速度
   - 首字节时间（TTFB）

4. **错误监控**
   - 4xx错误率
   - 5xx错误率
   - 连接超时率

### 6.2 日志分析

```bash
# OSS访问日志路径
oss://craneheart-logs/audio-access/YYYY/MM/DD/

# 日志字段
# [时间] [请求IP] [Referer] [URI] [HTTP状态码] [响应大小] [响应时间]

# 分析热门音频
cat access.log | awk '{print $6}' | sort | uniq -c | sort -rn | head -20

# 分析错误请求
cat access.log | awk '$7 >= 400' | wc -l
```

### 6.3 报警配置

```javascript
// 阿里云云监控报警规则
const alarmRules = [
  {
    name: 'CDN命中率过低',
    metric: 'cdn_hit_rate',
    threshold: 90, // 低于90%报警
    period: 300, // 5分钟
    action: 'sms+email'
  },
  {
    name: 'CDN流量异常',
    metric: 'cdn_traffic',
    threshold: 10000000, // 10GB/小时
    period: 3600,
    action: 'sms+email+phone'
  },
  {
    name: '4xx错误率过高',
    metric: 'cdn_4xx_rate',
    threshold: 5, // 超过5%
    period: 300,
    action: 'sms'
  },
  {
    name: '5xx错误率过高',
    metric: 'cdn_5xx_rate',
    threshold: 1, // 超过1%
    period: 300,
    action: 'sms+email+phone'
  }
];
```

---

## 七、成本估算

### 7.1 OSS存储成本

**假设**：
- 音频文件：1000首，平均10MB/首
- 封面图：1000张，平均100KB/张
- 总存储：约10GB

**月度成本**：
```
存储费用：10GB × ¥0.12/GB/月 = ¥1.2/月
```

### 7.2 CDN流量成本

**假设**：
- DAU：10000人
- 人均播放：3首/天
- 平均大小：10MB/首
- 日流量：10000 × 3 × 10MB = 300GB/天
- 月流量：9000GB = 9TB

**月度成本**：
```
CDN流量费用（阶梯计费）：
  - 0-10TB: 9TB × ¥0.24/GB = ¥2160/月
  
总成本：¥1.2 + ¥2160 = ¥2161.2/月
```

### 7.3 成本优化建议

1. **启用CDN缓存预热**
   - 热门音频提前缓存到CDN节点
   - 减少回源，降低OSS请求费用

2. **使用对象存储生命周期管理**
   - 30天未访问的文件转为低频存储
   - 90天未访问的文件转为归档存储

3. **音频压缩优化**
   - 使用高效编码器（如OPUS）
   - 在音质可接受的前提下降低码率

4. **CDN包年**
   - 流量稳定后可购买CDN流量包
   - 价格更优惠（约8折）

---

## 八、安全措施

### 8.1 访问控制

```javascript
// STS临时授权（上传音频时使用）
const stsPolicy = {
  "Version": "1",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "oss:PutObject"
      ],
      "Resource": [
        "acs:oss:*:*:craneheart-audio/audio/*"
      ],
      "Condition": {
        "StringEquals": {
          "oss:x-oss-object-acl": "public-read"
        }
      }
    }
  ]
};
```

### 8.2 内容安全

1. **上传前审核**
   - 文件格式验证
   - 文件大小限制
   - 音频时长检查

2. **内容审核**
   - 使用阿里云内容安全API
   - 自动识别违规内容
   - 人工复审机制

```javascript
// 调用内容安全API
const greenResult = await aliyun.green.scanAudio({
  url: audioUrl,
  scenes: ['antispam', 'porn']
});

if (greenResult.suggestion === 'block') {
  // 删除违规音频
  await deleteAudio(audioUrl);
}
```

### 8.3 DDoS防护

- 启用阿里云DDoS高防
- 设置请求频率限制
- IP黑白名单

---

## 九、灾备方案

### 9.1 跨区域复制

```bash
# 配置OSS跨区域复制
aliyun oss put-bucket-replication \
  --bucket craneheart-audio \
  --target-bucket craneheart-audio-backup \
  --target-location oss-cn-shanghai
```

### 9.2 备份策略

```javascript
// 定时备份脚本（每周执行）
const backupConfig = {
  source: 'craneheart-audio',
  target: 'craneheart-audio-backup',
  schedule: '0 0 * * 0', // 每周日凌晨
  retention: 30 // 保留30天
};
```

---

## 十、附录

### 10.1 常用命令

```bash
# 上传文件到OSS
ossutil cp local.mp3 oss://craneheart-audio/audio/meditation/

# 批量上传
ossutil cp -r ./audio/ oss://craneheart-audio/audio/ --update

# 设置文件ACL
ossutil set-acl oss://craneheart-audio/audio/ public-read -r

# 刷新CDN缓存
aliyun cdn RefreshObjectCaches \
  --ObjectPath https://audio.craneheart.com/audio/meditation/breath_01.mp3 \
  --ObjectType File

# 预热CDN缓存
aliyun cdn PushObjectCache \
  --ObjectPath https://audio.craneheart.com/audio/meditation/breath_01.mp3
```

### 10.2 故障排查

**问题1：音频无法播放**
```
检查步骤：
1. 检查CDN域名是否正常解析
2. 检查文件是否存在于OSS
3. 检查文件ACL是否为public-read
4. 检查防盗链配置
5. 检查CORS配置
```

**问题2：加载速度慢**
```
检查步骤：
1. 检查CDN缓存命中率
2. 检查用户所在地区的CDN节点
3. 检查文件大小是否过大
4. 检查网络质量
5. 考虑启用HTTP/2或QUIC
```

**问题3：流量异常**
```
检查步骤：
1. 查看OSS和CDN访问日志
2. 检查是否存在盗链
3. 检查是否有异常IP
4. 检查是否有爬虫访问
5. 启用更严格的防盗链
```

### 10.3 联系方式

- **OSS技术支持**: https://help.aliyun.com/product/31815.html
- **CDN技术支持**: https://help.aliyun.com/product/27099.html
- **工单系统**: https://workorder.console.aliyun.com/

---

**更新日期**: 2025-10-20  
**下次审核**: 2026-01-20（每季度审核一次）

