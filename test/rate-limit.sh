#!/bin/bash

URL="http://localhost:3000/test-rate-limit/limited"  # 요청할 URL을 여기에 입력하세요
MY_IP=$(hostname -I | awk '{print $1}')  # 현재 호스트의 IP 주소 가져오기

for i in {1..10}
do
  echo "Request #$i to $URL with X-Forwarded-For: $MY_IP"
  curl -s -o /dev/null -w "Status: %{http_code}\n" \
    -H "X-Forwarded-For: $MY_IP" \
    "$URL"
  sleep 0.1
done

echo "sleep 5 second"
sleep 5

for i in {1..10}
do
  echo "Request #$i to $URL with X-Forwarded-For: $MY_IP"
  curl -s -o /dev/null -w "Status: %{http_code}\n" \
    -H "X-Forwarded-For: $MY_IP" \
    "$URL"
  sleep 1
done