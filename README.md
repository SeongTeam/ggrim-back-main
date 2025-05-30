
## Code convention

ref : https://github.com/basarat/typescript-book/blob/master/docs/styleguide/styleguide.md


### method & function

- Controller method name should specify returned data's name
    - Service method name is optional. But service method should specify returned data's name, If it returns data not managed by service.

```ts
@Controller('user')
Class UserController(private only service : UserService){

    //controller method name should specify returned data's name
    @Get('/:id')
    async findUser(@Param('id') id : string){
        return this.service.getById(id);
    }

    @Get('/:id/sale')
    async findSaleByUser(@Param('id') id : string){
        const user = await this.service.getById(id);

        //should specify 'Sale' because Sale data is not managed by UserService
        return this.service.getSale(user);
    }
}
``` 

### HTTP API 

1. 의미를 바로 알아볼 수 있도록 작성하고, 소문자를 사용한다. 
❌ GET /users/writing ❌ GET /users/Post-Comments ⭕ GET /users/post-comments
- URI가 길어지는 경우 언더바(_) 대신 하이픈(-)을 사용한다. 
❌ GET /users/profile_image ⭕ GET /users/profile-image

2. 리소스에 대한 행위를 HTTP Method로 표현한다.
- ❌ get/users/ ⭕ GET /users/ resource

|action | HTTP Method | Example |
|-------|-------------|---------|
|리소스 목록 조회|GET	|GET /users|
리소스 단건 조회|	GET|	GET /users/{user_id}|
리소스 생성	POST|	POST| /users|
리소스 수정 (전체 수정)|	PUT|	PUT /users/{user_id}|
리소스 수정 (부분 수정)|	PATCH|	PATCH /users/{user_id}|
리소스 삭제|	DELETE|	DELETE /users/{user_id}|

3. Resource는 되도록 명사를 사용한다. 
❌ GET /users/show/1 ⭕ GET /users/1
- 파일 확장자는 포함시키지 않는다.
❌ GET /users/photo.jpg ⭕ GET /users/photo (이때, payload의 포맷은 headers에 accept를 사용한다.)
- URI에 작성되는 영어는 단수형으로 작성한다.(이때, 반환되는 리소스가 복수 또는 단수인지는 확인해야한다.)
❌ GET /product ⭕ GET /products
- 리소스의 상태 변경이 필요한 경우, 동사를 사용할 수 있다.
```http
POST /auth/login # Post 요청으로 로그인 처리

POST /auth/logout # Post 요청으로 로그아웃 처리
```

4. URI 사이에 연관 관계가 있는 경우 /리소스/고유ID/관계 있는 리소스 순으로 작성한다.
❌ GET /users/profile/{user_id} ⭕ GET /users/{user_id}/profile

```http
GET /users/{user_id}/posts  # 특정 사용자의 모든 게시글 조회
```

```http
GET /posts/{post_id}/comments  # 특정 게시글의 댓글 조회
```

```http
POST /users/{user_id}/likes/posts/{post_id}
```

5. 마지막에 슬래시(/)를 포함하지 않는다. 
❌ GET /users/ ⭕ GET /users
- 후행 슬래시(/)는 의미가 전혀 없고 혼란을 야기할 수 있다.

### TODO Convention

-   템플릿은 다음과 같다.
-   // 또는 /\* \*/을 사용한다.

```ts
// TODO: <설명>
// - [ ] <할 일>
//  -> <할 일 > 설명 ( 생략가능 )
// - [ ] <추가 작업>
// ! 주의: <경고할 사항>
// ? 질문: <의문점 또는 개선 방향>
// * 참고: <관련 정보나 링크>
```

-   예시

```ts
// TODO: 로그인 폼 UI 개선
// - [ ] 에러 메시지 추가
// - [ ] 버튼 클릭 시 로딩 스피너 표시
// ! 주의: 다크 모드에서 색상이 깨질 가능성 있음
// ? 질문: Tailwind에서 애니메이션 효과 적용하는 방법 고려
// * 참고: https://tailwindcss.com/docs/animation

function LoginForm() {
    return <form>{/* 로그인 폼 */}</form>;
}

// TODO: 유저 인증 기능 구현
// - [ ] JWT 토큰 발급 및 검증
// - [ ] 비밀번호 해싱 및 저장
// ! 주의: refresh token 저장 시 보안 고려 필요
// ? 질문: 세션 방식과 JWT 중 어떤 것이 더 적절할까?
// * 참고: https://docs.nestjs.com/security/authentication

@Post('login')
async login(@Body() loginDto: LoginDto) {
  return this.authService.login(loginDto);
}
```

## BoilerPlate Code

ref : https://awesome-nestjs.com/resources/boilerplate.html

## App Function
- need to know
    - [ ]  : means that function is not tested(auto, manual) 
    - [x]  : means that function is tested(auto, manual) 

### DB
- [x] Manage Painting Table
    - [x] Manage Painting's Tag Table
    - [x] Manage Painting's Style Table
    - Detail
        - Main Table which has relation to almost other tables
        - only admin insert and update it ( it will be updated that other user either can do) 
- [x] Manage Artist Table
    - Detail
        - only admin insert and update it ( it will be updated that other user either can do)

### Painting Module
- [x] get Paintings By Title and ArtistName and Tag and Styles
    - [x] provide logic by HTTP Api
- [x] get Paintings By Id list 
- [x] create Painting 
    - [x] provide logic by HTTP Api
- [x] replace Painting
    - [x] provide logic by HTTP Api
- [x] delete Painting
    - [x] provide logic by HTTP Api

#### Tag Module
- child module of Painting Module
- HTTP Api is based on CRUD Lib
    ref : https://gid-oss.github.io/dataui-nestjs-crud
- [x] get Tag
    - [x] provide logic by HTTP Api
- [x] create Tag
    - [x] provide logic by HTTP Api
- [x] delete Tag
    - [x] provide logic by HTTP Api
- [x] replace Tag
    - [x] provide logic by HTTP Api

#### Style Module
- child module of Painting Module
- HTTP Api is based on CRUD Lib
    ref : https://gid-oss.github.io/dataui-nestjs-crud
- [x] get Style
    - [x] provide logic by HTTP Api
- [x] create Style
    - [x] provide logic by HTTP Api
- [x] delete Style
    - [x] provide logic by HTTP Api
- [x] replace Style
    - [x] provide logic by HTTP Api

### Quiz Module
- [x] generate Random Quiz
    - [x] provide logic by HTTP Api
- [x] create Quiz
    - [x] provide logic by HTTP Api
- [x] update Quiz
    - [x] provide logic by HTTP Api
    - detail
        - disable to update Quiz type. the other is able to be updated
- [x] get one Quiz data by id
    - [x] provide logic by HTTP Api
    - detail
        - use other filter option 
            ref : https://gid-oss.github.io/dataui-nestjs-crud/controllers/#options 

# Docker 

## Build image 

1. .env.production 파일 생성
- .sample.env 참조

2. 환경 변수 설정 및 빌드 명령어 실행
```bash
$ docker build --no-cache --progress=plain -t my-nestjs-app . &> build.log
```

3. 환경 변수 주입 및 실행 
```bash
docker run -d \
  -e DB_HOST="your-host" \
  -e DB_PORT="your port" \
  -e DB_USERNAME="username" \
  -e DB_PASSWORD="password" \
  -e DB_DATABASE="database" \
  -e APP_NAME="your-app-name" \
  -e AWS_ACCESS_KEY="aws-access-key" \
  -e AWS_ACCESS_SECRET_KEY="aws-secret-key" \
  -e AWS_BUCKET="bucket-name" \
  -e AWS_INIT_FILE_KEY_PREFIX="key-prefix" \
  -e AWS_REGION="aws-region" \
  -e ENV_HASH_ROUNDS_KEY="hash-round-key" \
  -e ENV_JWT_SECRET_KEY="secret-key" \
  -e ENV_SMTP_PORT="smtp-port"  \
  -e ENV_MAIL_HOST="smtp-host" \
  -e ENV_MAIL_SERVICE="mail-service" \
  -e ENV_SMTP_ID="smtp-id" \
  -e ENV_SMTP_PW="smtp-pw" \
  -e ENV_SMTP_FROM_EMAIL="host mailer service email" \
  -e ENV_SMTP_FROM_NAME="host mailer service name" \
  -e ENV_ADMIN_EMAIL="app-admin-email" \
  -e FRONT_ROUTE_USER_EMAIL_VERIFICATION="front-route-for-email-verification" \
  -e ENV_EMAIL_TEST_ADDRESS="test-receiver-email" \
  -p 3000:3000 \
  my-nestjs-app
```


## Run Container in local

### Log Mount with volume 
- 컨데이터 실행전, 옵션 설정에서 Volume path 설정
    - source : mount할 host pc
    - dest : /app/logs
        - 해당 경로에 web log와 typeorm log 모두 존재



# 배포 환경
## 로그파일 AWS S3 업로드
### 자격 증명 획득
- 단기 자격 증명으로 인증
    - 참조 : https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/cli-authentication-short-term.html
- aws sso 활용

    - 다음 명령어를 입력하여 sso 진행
```bash
aws configure sso --use-device-code
```

    - 참조 : https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html

### aws cli 사용
1. aws cli 설치
```bash
apk update && apk add --no-cache aws-cli

#AWS CLI 버전 확인
aws --version
```
2. aws cli 활용
- 단기 자격 증명에서 인증한 profile_name을 사용하여 명령어 사용
```bash
aws s3 cp {your_local_file} s3://{your-buckets} --profile {your_profile_name}
```