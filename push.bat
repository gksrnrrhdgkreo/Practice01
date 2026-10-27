@echo off
chcp 65001 > nul
echo ==============================================
echo  🫧 버블파이터 웹 - 깃허브 자동 푸시 스크립트
echo ==============================================
echo.

git add .
set /p commit_msg="커밋 메시지를 입력하세요 (엔터 시 기본값): "
if "%commit_msg%"=="" set commit_msg=update: Bubble Fighter Web

git commit -m "%commit_msg%"
git push origin main

echo.
echo [완료] 깃허브 푸시가 완료되었습니다!
pause
