const fs = require('fs');
const { createCanvas } = require('canvas');

// 定义颜色
const normalColor = '#777777';
const activeColor = '#6A5ACD';

// 创建图标函数
function createIcon(text, isActive, outputPath) {
    const canvas = createCanvas(64, 64);
    const ctx = canvas.getContext('2d');
    const color = isActive ? activeColor : normalColor;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制背景
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 根据不同的图标类型绘制不同的图标
    if (text === 'HOME') {
        // 绘制房子图标
        ctx.fillStyle = color;
        
        // 屋顶
        ctx.beginPath();
        ctx.moveTo(32, 12);
        ctx.lineTo(52, 26);
        ctx.lineTo(12, 26);
        ctx.closePath();
        ctx.fill();
        
        // 房子主体
        ctx.fillRect(16, 26, 32, 26);
        
        // 门
        ctx.fillStyle = '#f8f8f8';
        ctx.fillRect(28, 36, 8, 16);
    } else if (text === 'STRESS') {
        // 绘制压力检测图标（类似大脑或表情图标）
        ctx.fillStyle = color;
        
        // 绘制类似大脑形状
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制面部表情（类似笑脸或皱眉）
        ctx.fillStyle = '#f8f8f8';
        // 眼睛
        ctx.fillRect(22, 26, 6, 6);
        ctx.fillRect(38, 26, 6, 6);
        
        // 嘴巴（开心或不开心）
        ctx.beginPath();
        if (isActive) {
            // 笑脸
            ctx.arc(32, 38, 8, 0, Math.PI, false);
        } else {
            // 皱眉
            ctx.arc(32, 44, 8, Math.PI, Math.PI * 2, false);
        }
        ctx.stroke();
    } else if (text === 'HISTORY') {
        // 绘制历史图标（类似时钟或历史记录）
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        // 绘制圆圈（表示时钟）
        ctx.beginPath();
        ctx.arc(32, 32, 20, 0, Math.PI * 2);
        ctx.stroke();
        
        // 绘制时钟指针
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(32, 32);
        ctx.lineTo(32, 18);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(32, 32);
        ctx.lineTo(40, 32);
        ctx.stroke();
    }
    
    // 添加文字标签
    ctx.fillStyle = color;
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(text, 32, 58);
    
    // 将Canvas转换为PNG并保存
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);
    console.log(`已创建图标: ${outputPath}`);
}

console.log('开始生成TabBar图标...');

// 创建所有图标
createIcon('HOME', false, 'static/images/home.png');
createIcon('HOME', true, 'static/images/home-active.png');
createIcon('STRESS', false, 'static/images/stress.png');
createIcon('STRESS', true, 'static/images/stress-active.png');
createIcon('HISTORY', false, 'static/images/history.png');
createIcon('HISTORY', true, 'static/images/history-active.png');

console.log('所有图标已创建完成！'); 