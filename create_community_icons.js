const fs = require('fs');
const path = require('path');

// 创建Canvas并生成图标
function createIcon(isActive) {
  // 创建Canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = 81;
  canvas.height = 81;
  
  // 清空画布
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // 绘制圆形背景
  ctx.beginPath();
  ctx.arc(40.5, 40.5, 35, 0, Math.PI * 2);
  ctx.fillStyle = isActive ? '#6A5ACD' : '#CCCCCC'; // 活跃状态使用紫蓝色，非活跃状态使用灰色
  ctx.fill();
  
  // 绘制文字
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('社', 40.5, 40.5);
  
  // 将Canvas转为Base64图片
  return canvas.toDataURL('image/png').replace(/^data:image\/\w+;base64,/, '');
}

// 将Base64字符串转为Buffer并保存为文件
function saveIconFile(base64Data, filePath) {
  const buffer = Buffer.from(base64Data, 'base64');
  
  // 确保目录存在
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // 写入文件
  fs.writeFileSync(filePath, buffer);
  console.log(`图标已保存到: ${filePath}`);
}

// 生成并保存图标
try {
  const normalIcon = createIcon(false);
  const activeIcon = createIcon(true);
  
  saveIconFile(normalIcon, 'static/images/community.png');
  saveIconFile(activeIcon, 'static/images/community-active.png');
  
  console.log('社区图标生成完成！');
} catch (error) {
  console.error('生成图标时出错:', error);
} 