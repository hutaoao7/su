# Create the directory if it does not exist
$imagesDir = "static\images"
if (-not (Test-Path $imagesDir)) {
    New-Item -ItemType Directory -Path $imagesDir -Force | Out-Null
}

# Create simple PNG images for each icon
function Create-SimpleIcon {
    param (
        [string]$filePath,
        [string]$color
    )
    
    # Create a simple 64x64 PNG with the specified color
    $bitmap = New-Object System.Drawing.Bitmap 64, 64
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    
    # Fill background
    $brush = New-Object System.Drawing.SolidBrush ($color)
    $graphics.FillRectangle($brush, 0, 0, 64, 64)
    
    # Add text based on filename
    $filename = [System.IO.Path]::GetFileNameWithoutExtension($filePath)
    $font = New-Object System.Drawing.Font "Arial", 10, [System.Drawing.FontStyle]::Bold
    $textBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
    $textFormat = New-Object System.Drawing.StringFormat
    $textFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $textFormat.LineAlignment = [System.Drawing.StringAlignment]::Center
    $graphics.DrawString($filename, $font, $textBrush, 32, 32, $textFormat)
    
    # Save to file
    $bitmap.Save($filePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $graphics.Dispose()
    $bitmap.Dispose()
    
    Write-Host "Created icon: $filePath"
}

# Try to load System.Drawing assembly
Add-Type -AssemblyName System.Drawing

try {
    # Create each icon
    Create-SimpleIcon "$imagesDir\home.png" "#777777"
    Create-SimpleIcon "$imagesDir\home-active.png" "#6A5ACD"
    Create-SimpleIcon "$imagesDir\stress.png" "#777777"
    Create-SimpleIcon "$imagesDir\stress-active.png" "#6A5ACD"
    Create-SimpleIcon "$imagesDir\history.png" "#777777"
    Create-SimpleIcon "$imagesDir\history-active.png" "#6A5ACD"
    
    # 社区图标 (未激活) - 简单样式，灰色，81x81像素
    $communityIconBase64 = "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"

    # 社区图标 (激活) - 简单样式，紫色，81x81像素
    $communityActiveIconBase64 = "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"

    # 将Base64字符串转换为字节数组并写入文件
    [System.Convert]::FromBase64String($communityIconBase64) | Set-Content -Path "$imagesDir\community.png" -Encoding Byte
    [System.Convert]::FromBase64String($communityActiveIconBase64) | Set-Content -Path "$imagesDir\community-active.png" -Encoding Byte

    Write-Host "All icons created successfully!"
} catch {
    Write-Host "Error creating icons: $_"
}

# 检查是否已安装canvas
npm list canvas > $null 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "正在安装canvas库..."
    npm install canvas
}

# 运行生成图标的脚本
Write-Host "开始生成社区图标..."
node create_icons_simple.js

Write-Host "图标生成完成，请刷新小程序模拟器查看效果。" 