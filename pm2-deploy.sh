#!/bin/bash

# 1. 환경 변수 설정 (사용자 환경에 맞게 수정)
APP_NAME="ggrim-back"
TARGET_BRANCH="main"

echo "###✅  Starting PM2 Deployment and Persistence Setup ###"

# 2. 기존 프로세스 삭제
pm2 delete $APP_NAME || echo "### Info: No existing process named $APP_NAME to delete."

# 3. Git 브랜치 확인 및 변경
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)

if [ "$CURRENT_BRANCH" != "$TARGET_BRANCH" ]; then
    echo "###✅ Current branch is [$CURRENT_BRANCH]. Switching to [$TARGET_BRANCH]..."
    
    # 원격 업데이트 확인
    git fetch origin
    
    # 브랜치 변경 (로컬에 변경사항이 있으면 실패할 수 있음)
    if git checkout $TARGET_BRANCH; then
        echo "###✅ Successfully switched to $TARGET_BRANCH."
    else
        echo "###❌ Error: Failed to switch branch. Please check for uncommitted changes."
        exit 1
    fi
else
    echo "###✅ Already on branch [$TARGET_BRANCH]."
fi

# 최신 변경 사항 가져오기 (실패 시 종료 처리 추가)
echo "###✅ Pulling latest changes from origin/$TARGET_BRANCH..."
if git pull origin $TARGET_BRANCH; then
    echo "###✅ Successfully updated to the latest version."
else
    echo "###❌ Error: Failed to pull latest changes. Please check for conflicts."
    exit 1
fi

# 4. 프로젝트 디렉토리 이동 및 의존성 설치
echo "###✅ install dependencies"
npm install || { echo "###❌ Error: npm install failed"; exit 1; }

# 5. project build
echo "###✅ build project"
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
    echo "###✅  BUILD SUCCESSFUL: Continuing deployment..."
fi

# 6. PM2로 애플리케이션 실행
echo "###✅ Starting application with PM2..."
echo "###✅ Starting new PM2 process..."
pm2 start npm --name $APP_NAME -- start

# --- 추가된 상태 확인 로직 ---
echo "###✅ Checking PM2 process status..."
# 3초 정도 애플리케이션이 초기화될 시간을 주면 더 정확합니다.
sleep 3

# 프로세스 상태 추출 (online 여부 확인)
STATUS=$(pm2 jlist | jq -r ".[] | select(.name == \"$APP_NAME\") | .pm2_env.status")

if [ "$STATUS" != "online" ]; then
    echo "###❌ Error: Process '$APP_NAME' is in '$STATUS' state."
    echo "###❌ Deployment failed. Checking logs..."
    pm2 logs $APP_NAME --lines 20 --no-daemon & sleep 5 && kill $!
    exit 1
else
    echo "###✅  Process '$APP_NAME' is running successfully (status: $STATUS)."
fi
# ---------------------------

# 7. Persistence(지속성) 설정: 서버 재부팅 시 자동 실행
echo "###✅ Configuring PM2 startup script..."

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