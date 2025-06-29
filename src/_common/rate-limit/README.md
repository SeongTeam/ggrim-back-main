# 테스트 실행 방법 

## 1. 프로젝트 실행 

```bash
npm run start:dev
or
npm run start
```

## 2. 테스트 실행 

```bash
# bash
# Test the limited endpoint multiple times
for i in {1..21}; do
  curl http://localhost:3000/test-rate-limit/limited
  echo ""
done
```

## 3. 결과 확인 
```
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"message":"This is a rate-limited endpoint"}
{"statusCode":500,"message":"Internal server error"}
```

