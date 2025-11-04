<#
.SYNOPSIS
    数据库备份脚本 (PostgreSQL/Supabase)

.DESCRIPTION
    自动备份CraneHeart项目数据库
    - 使用pg_dump进行完整备份
    - 保留最近30天的备份文件
    - 支持手动和自动（计划任务）运行

.PARAMETER BackupDir
    备份文件存储目录，默认为项目根目录的backups文件夹

.PARAMETER RetentionDays
    备份保留天数，默认30天

.EXAMPLE
    .\backup-database.ps1
    使用默认配置备份数据库

.EXAMPLE
    .\backup-database.ps1 -BackupDir "D:\backups" -RetentionDays 60
    指定备份目录和保留天数

.NOTES
    Author: CraneHeart Team
    Date: 2025-11-04
    Version: 1.0.0
#>

param(
    [string]$BackupDir = "$PSScriptRoot\..\backups\database",
    [int]$RetentionDays = 30
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 日志函数
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] [$Level] $Message"
    Write-Host $logMessage
    Add-Content -Path "$BackupDir\backup.log" -Value $logMessage
}

# 主函数
function Backup-Database {
    try {
        Write-Log "========== 数据库备份开始 =========="
        
        # 1. 创建备份目录
        if (-not (Test-Path $BackupDir)) {
            New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
            Write-Log "创建备份目录: $BackupDir"
        }
        
        # 2. 检查环境变量
        $pgHost = $env:SUPABASE_DB_HOST
        $pgUser = $env:SUPABASE_DB_USER
        $pgPassword = $env:SUPABASE_DB_PASSWORD
        $pgDatabase = $env:SUPABASE_DB_NAME
        $pgPort = if ($env:SUPABASE_DB_PORT) { $env:SUPABASE_DB_PORT } else { "5432" }
        
        if (-not $pgHost -or -not $pgUser -or -not $pgPassword -or -not $pgDatabase) {
            Write-Log "错误：缺少数据库连接环境变量" "ERROR"
            Write-Log "请设置以下环境变量：" "ERROR"
            Write-Log "  SUPABASE_DB_HOST - 数据库主机地址" "ERROR"
            Write-Log "  SUPABASE_DB_USER - 数据库用户名" "ERROR"
            Write-Log "  SUPABASE_DB_PASSWORD - 数据库密码" "ERROR"
            Write-Log "  SUPABASE_DB_NAME - 数据库名称" "ERROR"
            Write-Log "  SUPABASE_DB_PORT - 数据库端口（可选，默认5432）" "ERROR"
            exit 1
        }
        
        Write-Log "数据库连接配置: $pgUser@$pgHost:$pgPort/$pgDatabase"
        
        # 3. 生成备份文件名
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $backupFile = Join-Path $BackupDir "craneheart_backup_$timestamp.dump"
        $backupSqlFile = Join-Path $BackupDir "craneheart_backup_$timestamp.sql"
        
        # 4. 检查pg_dump是否可用
        try {
            $pgDumpVersion = & pg_dump --version 2>&1
            Write-Log "pg_dump版本: $pgDumpVersion"
        } catch {
            Write-Log "错误：未找到pg_dump命令" "ERROR"
            Write-Log "请安装PostgreSQL客户端工具：https://www.postgresql.org/download/windows/" "ERROR"
            exit 1
        }
        
        # 5. 执行备份（自定义格式）
        Write-Log "开始备份到: $backupFile"
        
        $env:PGPASSWORD = $pgPassword
        
        $pgDumpArgs = @(
            "-h", $pgHost,
            "-U", $pgUser,
            "-p", $pgPort,
            "-d", $pgDatabase,
            "-F", "c",           # 自定义格式（压缩）
            "-b",                # 包含大对象
            "-v",                # 详细输出
            "-f", $backupFile
        )
        
        & pg_dump @pgDumpArgs 2>&1 | ForEach-Object {
            if ($_ -match "error|fatal") {
                Write-Log $_ "ERROR"
            } else {
                Write-Log $_
            }
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "pg_dump执行失败，退出代码: $LASTEXITCODE"
        }
        
        # 6. 同时生成SQL格式备份（便于查看）
        Write-Log "生成SQL格式备份: $backupSqlFile"
        
        $pgDumpSqlArgs = @(
            "-h", $pgHost,
            "-U", $pgUser,
            "-p", $pgPort,
            "-d", $pgDatabase,
            "-F", "p",           # 纯文本格式
            "--no-owner",        # 不导出所有者
            "--no-acl",          # 不导出权限
            "-f", $backupSqlFile
        )
        
        & pg_dump @pgDumpSqlArgs 2>&1 | Out-Null
        
        # 清除密码环境变量
        Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
        
        # 7. 验证备份文件
        if (Test-Path $backupFile) {
            $fileSize = (Get-Item $backupFile).Length
            $fileSizeMB = [math]::Round($fileSize / 1MB, 2)
            Write-Log "备份成功！文件大小: $fileSizeMB MB" "SUCCESS"
        } else {
            throw "备份文件未生成"
        }
        
        # 8. 清理过期备份
        Write-Log "清理 $RetentionDays 天前的备份文件..."
        
        $cutoffDate = (Get-Date).AddDays(-$RetentionDays)
        $deletedCount = 0
        
        Get-ChildItem -Path $BackupDir -Filter "craneheart_backup_*.dump" | 
            Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
            ForEach-Object {
                Write-Log "删除过期备份: $($_.Name)"
                Remove-Item $_.FullName -Force
                $deletedCount++
            }
        
        Get-ChildItem -Path $BackupDir -Filter "craneheart_backup_*.sql" | 
            Where-Object { $_.LastWriteTime -lt $cutoffDate } | 
            ForEach-Object {
                Remove-Item $_.FullName -Force
            }
        
        Write-Log "已清理 $deletedCount 个过期备份文件"
        
        # 9. 备份统计
        $totalBackups = (Get-ChildItem -Path $BackupDir -Filter "craneheart_backup_*.dump").Count
        $totalSize = (Get-ChildItem -Path $BackupDir -Filter "craneheart_backup_*.*" | 
                      Measure-Object -Property Length -Sum).Sum
        $totalSizeMB = [math]::Round($totalSize / 1MB, 2)
        
        Write-Log "当前备份文件数: $totalBackups 个，总大小: $totalSizeMB MB"
        Write-Log "========== 数据库备份完成 =========="
        
        return $backupFile
        
    } catch {
        Write-Log "备份失败: $($_.Exception.Message)" "ERROR"
        Write-Log $_.ScriptStackTrace "ERROR"
        exit 1
    }
}

# 执行备份
Backup-Database

