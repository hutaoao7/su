@echo off
setlocal enabledelayedexpansion
set "REG=https://registry.npmmirror.com"
set "PROXY="
set "PKGS=jsonwebtoken@9 bcryptjs@2"
set "FN_DIR=uniCloud-aliyun\cloudfunctions"
set "LIST=auth-register auth-login auth-me auth-refresh"
set "LOG=%TEMP%\unicloud-install-%RANDOM%.log"
set "ROOT=%CD%"

echo === UniCloud deps install ===
echo Registry: %REG%
if defined PROXY (echo Proxy: !PROXY!) else (echo Proxy: none)
echo Log: %LOG%
echo Root: %ROOT%
echo.

if not exist "%FN_DIR%" (echo [ERROR] Missing %FN_DIR% & pause & exit /b 1)

set "npm_config_registry=%REG%"
if defined PROXY (
  set "npm_config_proxy=!PROXY!"
  set "npm_config_https_proxy=!PROXY!"
)

set FAIL=0

for %%d in (%LIST%) do (
  set "DIR=%FN_DIR%\%%d"
  if exist "!DIR!" (
    echo --- Installing in: !DIR! ---
    pushd "!DIR!"
    if exist package-lock.json del /f /q package-lock.json >nul 2>>"%LOG%"
    if exist node_modules rmdir /s /q node_modules >nul 2>>"%LOG%"
    call npm cache clean --force >nul 2>>"%LOG%"
    call npm install %PKGS% --no-audit --no-fund --foreground-scripts --loglevel=error >>"%LOG%" 2>&1
    if errorlevel 1 (
      echo [ERROR] Install failed: %%d
      echo See log: %LOG%
      set FAIL=1
      popd
    ) else (
      if exist node_modules\jsonwebtoken (
        if exist node_modules\bcryptjs (
          echo [OK] Installed: %%d
        ) else (
          echo [ERROR] Missing bcryptjs after install: %%d
          echo See log: %LOG%
          set FAIL=1
        )
      ) else (
        echo [ERROR] Missing jsonwebtoken after install: %%d
        echo See log: %LOG%
        set FAIL=1
      )
      popd
    )
    echo.
  ) else (
    echo [SKIP] Missing: !DIR!
  )
)

if "%FAIL%"=="0" (
  echo === Done. All deps installed successfully ===
) else (
  echo === Finished with errors. See log: %LOG% ===
)
echo Log: %LOG%
pause
