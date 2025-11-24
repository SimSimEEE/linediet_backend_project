#!/bin/bash

# DynamoDB Local 자동 설정 스크립트
# 이 스크립트는 DynamoDB Local 컨테이너를 시작하고 필요한 테이블을 생성합니다.

set -e

echo "🚀 DynamoDB Local 설정 시작..."

# 컨테이너 이름
CONTAINER_NAME="dynamodb-local"
PORT=8000

# 1. 실행 중인 컨테이너 확인
if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "✅ DynamoDB Local이 이미 실행 중입니다 (포트 ${PORT})"
    
    # 테이블 존재 여부만 확인하고 없으면 생성
    echo "📋 테이블 확인 및 생성 중..."
    node scripts/setup-dynamodb-local.js
    
    echo ""
    echo "🎉 DynamoDB Local 준비 완료!"
    exit 0
fi

# 2. 중지된 컨테이너가 있으면 제거
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "📦 중지된 컨테이너 제거 중..."
    docker rm $CONTAINER_NAME 2>/dev/null || true
fi

# 3. DynamoDB Local 컨테이너 시작
# 3. DynamoDB Local 컨테이너 시작
echo "🐳 DynamoDB Local 컨테이너 시작 중..."
docker run -d \
    -p ${PORT}:8000 \
    --name ${CONTAINER_NAME} \
    amazon/dynamodb-local \
    -jar DynamoDBLocal.jar \
    -sharedDb \
    -inMemory

# 4. 컨테이너가 준비될 때까지 대기
# 4. 컨테이너가 준비될 때까지 대기
echo "⏳ DynamoDB Local 준비 중..."
sleep 3

# 5. 컨테이너 상태 확인
# 5. 컨테이너 상태 확인
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
    echo "❌ DynamoDB Local 시작 실패"
    exit 1
fi

echo "✅ DynamoDB Local이 포트 ${PORT}에서 실행 중입니다"

# 6. 테이블 생성
echo "📋 DynamoDB 테이블 생성 중..."
node scripts/setup-dynamodb-local.js

echo ""
echo "🎉 DynamoDB Local 설정 완료!"
echo "📝 컨테이너: ${CONTAINER_NAME}"
echo "🔗 엔드포인트: http://localhost:${PORT}"
echo ""
echo "💡 사용 가능한 명령어:"
echo "   - 테이블 목록 확인: node scripts/list-tables.js"
echo "   - 데이터 초기화: docker restart ${CONTAINER_NAME} && npm run setup:db"
echo "   - 컨테이너 중지: docker stop ${CONTAINER_NAME}"
echo ""
