
ARG NODE_VERSION=22-alpine
FROM node:${NODE_VERSION} AS builder

LABEL maintainer="ggrim@back" \
      version="0.1.0" \
      description="test"

ENV BUILD_DIR="/build-back" 


#Set working directory
WORKDIR ${BUILD_DIR}

COPY . ./
RUN echo "build start: "  && pwd && ls -la
RUN npm ci && npm run build

RUN echo "complete build: "  && pwd && ls -la
# 이미지 크기를 줄이기 위해서 어떻게 해야하는가? 빌드->빌드 결과 복사-> 빌드 실행?

# stage :: build-completer
FROM node:${NODE_VERSION} AS build-completer
ARG WORK_DIR="app" \
    BUILD_RESULT_PATH="/build-back/dist"

WORKDIR /${WORK_DIR}

# 필수 파일 복사
COPY package.json package-lock.json run.sh ./
COPY app-config/ ./app-config/
COPY src/modules/mail/templates/ .src/modules/mail/templates/

# Add entrypoint script and set permissions
RUN chmod +x run.sh && \
    echo "Before create image : " && pwd && ls -la && \
    npm ci --omit=dev

# Copy build artifacts from builder stage
COPY --from=builder $BUILD_RESULT_PATH ./dist/

RUN echo "complete create image : " && pwd && ls -la

# /app 디렉토리 전체에 권한 부여
RUN chown -R node:node /${WORK_DIR}

# stage : init 
FROM node:${NODE_VERSION} AS init
ARG WORK_DIR="app"

#디렉토리 복사
COPY --chown=node:node --from=build-completer /${WORK_DIR} /${WORK_DIR}
RUN echo "init image : " && pwd && ls -la

WORKDIR /${WORK_DIR}


# node 이미지에 이미 "node"라는 사용자가 uid/gid 1000번으로 생성되어 있음
USER node

# Expose port
EXPOSE 3000

#TODO 
#ENTRYPOINT 명령어로 변경하여 이미지 사용자 docker run에 의해 덮어쓰기 방지할것.
CMD ["sh","/app/run.sh"]