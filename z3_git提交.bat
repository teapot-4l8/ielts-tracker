@echo off
chcp 65001 >nul

echo 正在执行 git add .
git add .

echo.
set /p msg=请输入提交说明：

echo.
echo 正在执行 git commit...
git commit -m "%msg%"

echo.
echo 正在执行 git push...
git push

echo.
echo 操作完成。
pause