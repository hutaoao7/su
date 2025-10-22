# ============================================================================
# 数据库迁移脚本修复工具
# 功能：将docs目录中的SQL迁移脚本复制到uniCloud实际执行目录
# 创建日期：2025-10-22
# ============================================================================

param(
    [switch]$DryRun = $false,
    [switch]$Verbose = $false
)

# 设置颜色输出
$Host.UI.RawUI.ForegroundColor = "White"

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Cyan
}

# ============================================================================
# 主程序
# ============================================================================

Write-Host "`n" -NoNewline
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "    数据库迁移脚本修复工具" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

# 获取项目根目录
$projectRoot = Split-Path -Parent $PSScriptRoot
Write-Info "项目根目录: $projectRoot"

# 定义源目录和目标目录
$sourceDir = Join-Path $projectRoot "docs\database\migrations"
$targetDir = Join-Path $projectRoot "uniCloud-aliyun\database\migrations"

Write-Info "源目录: $sourceDir"
Write-Info "目标目录: $targetDir"
Write-Host ""

# 检查源目录是否存在
if (-not (Test-Path $sourceDir)) {
    Write-Error "源目录不存在: $sourceDir"
    exit 1
}

# 检查目标目录是否存在，不存在则创建
if (-not (Test-Path $targetDir)) {
    Write-Warning "目标目录不存在，正在创建..."
    if (-not $DryRun) {
        New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
        Write-Success "目标目录创建成功"
    } else {
        Write-Info "[DRY RUN] 将创建目录: $targetDir"
    }
} else {
    Write-Success "目标目录已存在"
}

Write-Host ""

# 获取源目录中的所有SQL文件
$sqlFiles = Get-ChildItem -Path $sourceDir -Filter "*.sql"

if ($sqlFiles.Count -eq 0) {
    Write-Warning "源目录中没有找到SQL文件"
    exit 0
}

Write-Info "找到 $($sqlFiles.Count) 个SQL文件"
Write-Host ""

# 创建备份目录（如果不是DryRun模式）
$backupDir = Join-Path $targetDir "backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
$needBackup = $false

if (-not $DryRun) {
    $existingFiles = Get-ChildItem -Path $targetDir -Filter "*.sql" -ErrorAction SilentlyContinue
    if ($existingFiles.Count -gt 0) {
        $needBackup = $true
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
        Write-Info "创建备份目录: $backupDir"
        Write-Host ""
    }
}

# 复制文件
$copiedCount = 0
$skippedCount = 0
$errorCount = 0

Write-Host "开始处理文件:" -ForegroundColor Yellow
Write-Host "----------------------------------------"

foreach ($file in $sqlFiles) {
    $targetFile = Join-Path $targetDir $file.Name
    $fileExists = Test-Path $targetFile
    
    try {
        if ($DryRun) {
            # Dry Run模式：只显示将要执行的操作
            if ($fileExists) {
                Write-Warning "[DRY RUN] 将覆盖: $($file.Name)"
            } else {
                Write-Info "[DRY RUN] 将复制: $($file.Name)"
            }
            $copiedCount++
        } else {
            # 实际执行模式
            
            # 如果文件已存在且需要备份，先备份
            if ($fileExists -and $needBackup) {
                $backupFile = Join-Path $backupDir $file.Name
                Copy-Item -Path $targetFile -Destination $backupFile -Force
                if ($Verbose) {
                    Write-Info "  备份: $($file.Name)"
                }
            }
            
            # 复制文件
            Copy-Item -Path $file.FullName -Destination $targetFile -Force
            
            if ($fileExists) {
                Write-Success "已覆盖: $($file.Name)"
            } else {
                Write-Success "已复制: $($file.Name)"
            }
            
            $copiedCount++
            
            # 显示文件大小（如果开启Verbose）
            if ($Verbose) {
                $fileSize = (Get-Item $targetFile).Length
                $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
                Write-Info "  大小: $fileSizeKB KB"
            }
        }
    }
    catch {
        Write-Error "处理失败: $($file.Name) - $($_.Exception.Message)"
        $errorCount++
    }
}

Write-Host "----------------------------------------"
Write-Host ""

# 显示统计信息
Write-Host "处理完成！" -ForegroundColor Magenta
Write-Host "----------------------------------------"
Write-Success "成功处理: $copiedCount 个文件"
if ($errorCount -gt 0) {
    Write-Error "失败: $errorCount 个文件"
}
if ($needBackup -and -not $DryRun) {
    Write-Info "原文件已备份到: $backupDir"
}
Write-Host ""

# 验证目标目录
if (-not $DryRun) {
    Write-Host "验证目标目录..." -ForegroundColor Yellow
    $targetFiles = Get-ChildItem -Path $targetDir -Filter "*.sql" | Where-Object { $_.Name -notlike "backup_*" }
    Write-Info "目标目录现有 $($targetFiles.Count) 个SQL文件："
    
    foreach ($file in $targetFiles | Sort-Object Name) {
        $fileSize = [math]::Round((Get-Item $file.FullName).Length / 1KB, 2)
        Write-Host "  • $($file.Name) ($fileSize KB)" -ForegroundColor Gray
    }
    Write-Host ""
}

# 显示需要执行的后续步骤
Write-Host "后续步骤:" -ForegroundColor Yellow
Write-Host "----------------------------------------"
Write-Host "1. 检查SQL文件内容是否正确"
Write-Host "2. 在uniCloud控制台执行数据库迁移"
Write-Host "3. 验证数据库表是否创建成功"
Write-Host "4. 更新任务清单，标记为已部署"
Write-Host ""

# 如果是DryRun模式，提示如何实际执行
if ($DryRun) {
    Write-Warning "这是DRY RUN模式，未实际复制文件"
    Write-Info "要实际执行，请运行："
    Write-Host "  .\scripts\fix-database-migration.ps1" -ForegroundColor Green
    Write-Host ""
}

Write-Success "脚本执行完成！"
Write-Host ""

