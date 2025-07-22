

## Tech Stack

### Nest.js (with express)

- Advantage
    1. 코드베이스 구조화 컨벤션 제공
        - 익숙한 MVC 패턴을 적용하기 용이  
    2. 높은 이식성 라이브러리 생태계 
- DisAdvantage
    1. 기능 구현 비용 하한선이 높음
        - 새로운 기능 구현시, Module, service 등의 클래스 구현 필수적이며, 높은 추상화 설계가 필요 
    2. 프레임워크와 관련된 개념 및 라이브러리 학습 비용 높음.
        - IoC, DI, Decorator 등의 개념 숙지 비용 필요
        - Pipe Line 구축시 RxJs 라이브러리 등의 이해 필요.

### Postgres DB
- Advantage
    1. 사용 무료
    2. 사용 경험 있음 
- DisAdvantage

### TypeORM
- Advantage
    1. nest.js와 호환성이 높음
    2. `QueryBuilder`를 통해 복잡한 쿼리문 생성 및 조합 가능
- DisAdvantage 
    1. 공식 문서 설명 부족
        - DB 동작에 대한 이해가 부족하다면, 높은 추상화와 암묵적 기능 때문에 버그 발생 가능

### Class-Validator & Class-transformer
- Advantage
    1. nest.js와 typeORM과 호환성이 높음
    2. 다양한 Validate 라이브러리 제공
- DisAdvantage
    1. 데코레이터 문법을 통한 높은 추상화와 암묵적 기능이 있으므로, 코드를 통해 문제를 발견하기 어려움.


## Structure

### DB

- [ERD Link](https://www.erdcloud.com/d/NyQYfCikoSsYqgKTs)

### src/modules

- nest.js App 모듈과 서브 모듈의 집합이다.
- 각 서브디렉토리는 서브 모듈의 집합이다.
    - 단, `src/utils/`는 각 모듈에서 사용되는 라이브러리 집합이다.

### src/types

- 3rd party 라이브러리의 병합 타입 집합이다.

### src/utils

- util 모듈 집합이다.

### test/

- nest.js App 테스트 집합이다.

### migration/

- TypeORM migration 집합이다.

## Convention

### Project Structure

### Code Convention

1. Module 
- 각각의 모듈은 별도의 파일로 관리한다.
- 모듈은 `src/modules/<domain>/` 도메인 이름에 해당하는 폴더에 위치해야한다.
- 폴더의 이름은 `kebab-case` 형식이다. 
- 파일의 이름은 `<camelCase>.module.ts` 형식이다.
- 클래스 이름은 `<PascalCase>Module` 형식이다.
- 서브 모듈은 상위 모듈 폴더의 하위 폴더에 위치해야한다.
- 서브 모듈 생성보다는 서비스 클래스 추가를 지향한다.
    - 서브 모듈이 필요한 상황이라면, 서브 모듈을 추가한다.

2. Controller
- 각각의 컨트롤러는 별도의 파일로 관리한다.
- 컨트롤러는 해당 컨트롤러의 `import` 모듈과 동일한 폴더 또는 그 하위 폴더에 위치해야한다.
- 파일의 이름은 `<camelCase>.controller.ts` 형식이다.
- 클래스 이름은 `<PascalCase>Controller` 형식이다.
- 컨트롤러 클래스는 외부 모듈의 Controller 주입을 자제한다.
- 컨트롤러 클래스의 `HTTP API` 메소드는 GET,POST와 상관없이 `url`를 기준으로 그룹화하며 정렬을 지향한다.
    - 단, `HTTP API` 메소드의 마운트 순서를 바꾸기 위해서라면, 그룹화를 무시할 수 있다.
- 컨트롤러의 `base url`은 컨트롤러의 이름을 `kebab-case`형식으로 설정해야한다. 

3. Provider
- 각각의 프로바이더는 별도의 파일로 관리한다.
- 프로바이더는 해당 프로바이더의 `import` 모듈과 동일한 폴더 또는 그 하위 폴더에 위치해야한다.
- 파일의 이름은 `<camelCase>.<provider>.ts` 형식이다.
    - 예시 : `painting.service.ts` , `auth.exception.filter.ts` , `auth.interceptor.ts`;
- 클래스 이름은 `<PascalCase><Provider>` 형식이다.
    - 예시 : `PaintingService` , `AuthExceptionFilter` , `AuthInterceptor`;
- Service
    - DB entity 접근은 오직 `Service`만을 통해 진행한다.
    - 외부 모듈의 컨트롤러, 프로바이더에서 재사용할 로직은 서비스에만 정의한다.
- Guard
    - Guard 로직은 true 만을 반환한다. 예외 상황시에는 Exception을 던진다.
- Pipe
    - 입력 DTO의 데이터 유효성 검사 및 형변환 로직만 정의한다.
 
4. Entity
- 각각의 엔티티는 별도의 파일로 관리한다.
- 엔티티 파일은 헤당 엔티티를 관리하는 서비스 파일과 같은 폴더 내에서 `entity` 폴더 내에 정의한다.
- 엔티티 파일 이름은 `<camelCase>.entity.ts` 형식이다.
- 모든 엔티티 클래스는 `CustomBaseEntity` 클래스를 상속받는다.
- 엔티티 클래스는 TypeORM 데코레이터 사용만을 지향한다.
    - `class-validator` 또는 `class-transformer` 데코레이터는 사용은 DTO 클래스에서 사용한다.
    - 엔티티 클래스내에서 안정성 및 보안성을 위해서 다른 데코레이터가 필요하다면 사용하도록한다.
- 엔티티 클래스의 필드 중에서 DB 어트리뷰트로 직접 맵핑되는 필드는 `snake_case` 형식을 사용한다.
    - 조인(관계) 필드는 `camelCase`형식을 지향한다.

    >snake_case 형식을 선택한 이유는 엔티티 클래스 필드와 DB 테이블 어트리뷰트 간의 맵핑관계를 혼동하지 않기 위함이다.
    >- 다만 DB 테이블에 직접적으로 맵핑되지 않는 클래스 필드는 TypeORM 내부로직임을 나타내기 위해서 기존 필드 관습인 camelCase를 선택하였다. 
    
- 엔티티 클래스에서 외래키 어트리뷰트와 맵핑되는 필드를 정의하여 `N : 1`과 `1 : 1` 조인(관계)사용을 명시한다.
- 왜래키 어트리뷰트와 맵핑되는 필드의 이름은 `<table>_id` 형식을 지향한다.

5. DTO
- 각각의 DTO는 별도의 파일로 관리한다.
- DTO 파일은 해당 DTO를 사용하는 컨트롤러 또는 프로바이더와 같은 폴더내에 있는 `dto` 폴더 내에 정의한다.
    - 요청 DTO는 `<folder>/dto/request` 내에 정의한다. 
    - 응답 DTO는 `<folder>/dto/response` 내에 정의한다.
- DTO 파일 이름은 `<camelCase>.ts` 형식을 사용한다. 
- DTO는 **클래스만을 사용한다.**
- DTO 클래스 이름은 `<CamelCase>` 형식을 사용한다.
    - 요청 DTO 클래스는 `<Name>DTO` 형식을 사용한다.
    - 응답 DTO 클래스는 `<Name>Response` 형식을 사용한다.
- DTO 클래스는 `class-validator`, `class-transformer` 등의 데코레이터를 사용한다.



7. type & interface
- 타입 선언시 `*.ts` 또는 `*.d.ts` 파일 내에 그룹화한다.
- 타입 선언 파일은 `/src/modules/<domain>/types` 내에 위치시킨다.
- 타입 선언시 `interface` 사용을 지향한다.
- 별칭 타입 , 유니언 타입, 인터섹션 타입 선언시 `type` 사용을 지향한다.
- 3rd 파티 라이브러리의 타입을 보강하는 경우, `src/types/<3rd-party>.d.ts` 파일에서 보강한다.

6. metadata 
- 각각의 메타데이터는 별도의 파일로 관리한다.
- 메타데이터 파일은 관련된 `<domain>/metadata` 폴더에 위치한다.
- 메타데이터 데코레이터 객체는 `PascalCase`를 사용한다.
- 메타데이터 키는 상수로 관리한다. 

8. decorator

- 각각의 데코레이터는 별도의 파일로 관리한다.
- 데코레이터 파일은 관련된 `<domain>/decorator` 폴더에 위치한다.
- 데코레이터 객체는 `PascalCase`를 사용한다.

9. constant 
- 상수는 객체 리터럴 정의과 `as const` 키워드를 사용하여 정의한다.
- 상수 이름은 `SCREAMING_SNAKE_CASE`를 사용한다.
- 전역 상수의 위치는 문맥과 연광성에 맞는 파일에 위치시킨다.
    - 일반적으로 `/src/modules/<domain>/const.ts`에 위치시킨다.


10. 그외는 다음 규칙을 따른다.

- `namespace` 사용을 자제한다.

> namespace를 규칙없이 사용한다면, 모듈 파일의 가독성과 프로젝트의 구조성을 훼손할 수 있다고 판단하여 이러한 선택을 하였다.

- `prettier`와 `eslint`를 따른다.

### HTTP API Convention

1. 의미를 바로 알아볼 수 있도록 작성하고, 소문자를 사용한다. 
- ❌ GET /users/writing ❌ GET /users/Post-Comments ⭕ GET /users/post-comments
- URI가 길어지는 경우 언더바(_) 대신 하이픈(-)을 사용한다. 
- ❌ GET /users/profile_image ⭕ GET /users/profile-image

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

- ❌ GET /users/show/1 ⭕ GET /users/1
- 파일 확장자는 포함시키지 않는다.
- ❌ GET /users/photo.jpg ⭕ GET /users/photo 
- (이때, payload의 포맷은 headers에 accept를 사용한다.)
- URI에 작성되는 영어는 단수형으로 작성한다.
- ❌ GET /product ⭕ GET /products
- (이때, 반환되는 리소스가 복수 또는 단수인지는 확인해야한다.)

- 리소스의 상태 변경이 필요한 경우, 동사를 사용할 수 있다.
```http
POST /auth/login # Post 요청으로 로그인 처리

POST /auth/logout # Post 요청으로 로그아웃 처리
```

4. URI 사이에 연관 관계가 있는 경우 /리소스/고유ID/관계 있는 리소스 순으로 작성한다.
- ❌ GET /users/profile/{user_id} ⭕ GET /users/{user_id}/profile

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
- ❌ GET /users/ ⭕ GET /users
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

### Commit convention
- [Front commit conventions](https://github.com/SeongTeam/ggrim_front?tab=readme-ov-file#commit-convention)



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
    - [aws-cli 인증](https://docs.aws.amazon.com/ko_kr/cli/latest/userguide/cli-authentication-short-term.html)
- aws sso 활용

    - 다음 명령어를 입력하여 sso 진행
    - [aws cli sso 설정](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-sso.html)
```bash
aws configure sso --use-device-code
```



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

## BoilerPlate Code

- [awesome-nestjs](https://awesome-nestjs.com/resources/boilerplate.html)에서 다양한 보일러플레이트 참조 가능  