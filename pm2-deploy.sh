#!/bin/bash

# 1. 환경 변수 설정 (사용자 환경에 맞게 수정)
APP_NAME="ggrim-back"
APP_ENTRY_POINT="app.js" # 또는 index.js
PROJECT_DIR="/home/ec2-user/my-project"
TARGET_BRANCH="main"

echo "### Starting PM2 Deployment and Persistence Setup ###"

# 2. 기존 프로세스 삭제
pm2 delete $APP_NAME || echo "Info: No existing process named $APP_NAME to delete."

# 3. Git 브랜치 확인 및 변경
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "Current branch is [$CURRENT_BRANCH]. Switching to [$TARGET_BRANCH]..."
    
    # 원격 업데이트 확인
    git fetch origin
    
    # 브랜치 변경 (로컬에 변경사항이 있으면 실패할 수 있음)
    if git checkout $TARGET_BRANCH; then
        echo "Successfully switched to $TARGET_BRANCH."
    else
        echo "Error: Failed to switch branch. Please check for uncommitted changes."
        exit 1
    fi
else
    echo "Already on branch [$TARGET_BRANCH]."
fi

# 4. 프로젝트 디렉토리 이동 및 의존성 설치
echo "install dependencies"
npm install || { echo "❌ Error: npm install failed"; exit 1; }

# 5. project build
echo "build project"
npm run build

# 빌드 명령의 종료 코드($?) 확인 (0이면 성공, 그 외는 실패)
BUILD_STATUS=$?

if [ $BUILD_STATUS -ne 0 ]; then
    echo "----------------------------------------------------"
    echo "❌ BUILD FAILED: Build exited with code $BUILD_STATUS"
    echo "Deployment aborted to prevent service interruption."
    echo "----------------------------------------------------"
    exit 1
else
    echo "✅ BUILD SUCCESSFUL: Continuing deployment..."
fi

# 6. PM2로 애플리케이션 실행
echo "Starting application with PM2..."
pm2 describe $APP_NAME > /dev/null
if [ $? -eq 0 ]; then
    echo "Restarting existing PM2 process..."
    pm2 restart $APP_NAME
else
    echo "Starting new PM2 process..."
    pm2 start npm --name $APP_NAME -- start
fi


# 7. Persistence(지속성) 설정: 서버 재부팅 시 자동 실행
echo "Configuring PM2 startup script..."

# 현재 사용자에 맞는 startup 명령어를 가져와 실행
STARTUP_CMD=$(pm2 startup | grep "sudo env" | tail -n 1)
if [ -n "$STARTUP_CMD" ]; then
    eval $STARTUP_CMD
fi
pm2 save


echo "----------------------------------------------------"
echo "🎉 Deployment Completed Successfully!"
echo "----------------------------------------------------"
pm2 status