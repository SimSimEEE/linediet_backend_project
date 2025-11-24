/**
 * DynamoDB Local 목업 데이터 생성 스크립트
 * - 의사 수십 명
 * - 환자 10만 명
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({
    region: 'ap-northeast-2',
    endpoint: 'http://localhost:8000',
    credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
    },
});

const docClient = DynamoDBDocumentClient.from(client);

// AES 암호화 함수 (crypto-js와 동일한 방식)
function encrypt(text) {
    const key = 'your-secret-key-32-chars-long!!'; // 실제로는 환경변수에서 가져와야 함
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(text, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    return encrypted;
}

// SHA-256 해시 함수
function hash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

// 한글 이름 생성
const lastNames = [
    '김',
    '이',
    '박',
    '최',
    '정',
    '강',
    '조',
    '윤',
    '장',
    '임',
    '한',
    '오',
    '서',
    '신',
    '권',
    '황',
    '안',
    '송',
    '류',
    '전',
];
const firstNames = [
    '민준',
    '서연',
    '예준',
    '지우',
    '도윤',
    '서준',
    '시우',
    '지훈',
    '지후',
    '은우',
    '하준',
    '유준',
    '수아',
    '하윤',
    '민서',
    '지아',
    '윤서',
    '채원',
    '지유',
    '수빈',
    '도현',
    '건우',
    '우진',
    '선우',
    '현우',
    '연우',
    '정우',
    '승우',
    '시윤',
    '지환',
    '유나',
    '서윤',
    '다은',
    '채은',
    '예은',
    '소율',
    '지원',
    '수현',
    '예린',
    '소윤',
];

// 진료과목
const specialties = [
    '내과',
    '외과',
    '정형외과',
    '신경외과',
    '소아청소년과',
    '산부인과',
    '안과',
    '이비인후과',
    '피부과',
    '비뇨의학과',
    '정신건강의학과',
    '재활의학과',
    '마취통증의학과',
    '영상의학과',
    '진단검사의학과',
];

// 랜덤 한글 이름 생성
function generateKoreanName() {
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    return lastName + firstName;
}

// 랜덤 전화번호 생성
function generatePhoneNumber() {
    const middle = String(Math.floor(Math.random() * 9000) + 1000);
    const last = String(Math.floor(Math.random() * 9000) + 1000);
    return `010${middle}${last}`;
}

// 랜덤 주민등록번호 생성 (앞 6자리만)
function generateSSNPrefix() {
    const year = String(Math.floor(Math.random() * 30) + 70).padStart(2, '0'); // 70-99
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const gender = Math.random() > 0.5 ? '1' : '2';
    const random = String(Math.floor(Math.random() * 999999)).padStart(6, '0');
    return `${year}${month}${day}-${gender}${random}`;
}

// 배치 쓰기 (DynamoDB는 한 번에 25개씩만 가능)
async function batchWrite(tableName, items) {
    const batches = [];
    for (let i = 0; i < items.length; i += 25) {
        batches.push(items.slice(i, i + 25));
    }

    let totalWritten = 0;
    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const params = {
            RequestItems: {
                [tableName]: batch.map((item) => ({
                    PutRequest: { Item: item },
                })),
            },
        };

        try {
            await docClient.send(new BatchWriteCommand(params));
            totalWritten += batch.length;

            // 진행률 표시
            if ((i + 1) % 100 === 0 || i === batches.length - 1) {
                const progress = ((totalWritten / items.length) * 100).toFixed(1);
                process.stdout.write(
                    `\r   진행률: ${progress}% (${totalWritten.toLocaleString()}/${items.length.toLocaleString()})`,
                );
            }
        } catch (error) {
            console.error(`\n❌ 배치 쓰기 실패 (배치 ${i + 1}/${batches.length}):`, error.message);
        }
    }
    console.log(''); // 새 줄
    return totalWritten;
}

// 의사 목업 데이터 생성
async function createMockDoctors() {
    console.log('👨‍⚕️ 의사 목업 데이터 생성 중...');

    const doctorCount = 50; // 50명의 의사
    const doctors = [];
    const now = new Date().toISOString();

    for (let i = 0; i < doctorCount; i++) {
        const name = generateKoreanName();
        const specialty = specialties[Math.floor(Math.random() * specialties.length)];
        const isActive = Math.random() > 0.1; // 90% 활성

        doctors.push({
            id: `doctor-${Date.now()}-${i}`,
            name,
            specialty,
            isActive,
            createdAt: now,
            updatedAt: now,
        });
    }

    const written = await batchWrite('appointment-doctors-dev', doctors);
    console.log(`✅ 의사 ${written}명 생성 완료\n`);
    return doctors;
}

// 환자 목업 데이터 생성
async function createMockPatients() {
    console.log('👥 환자 목업 데이터 생성 중...');

    const patientCount = 100000; // 10만 명의 환자
    const batchSize = 1000; // 1000명씩 생성
    const now = new Date().toISOString();

    let totalWritten = 0;

    for (let batch = 0; batch < Math.ceil(patientCount / batchSize); batch++) {
        const patients = [];
        const currentBatchSize = Math.min(batchSize, patientCount - batch * batchSize);

        for (let i = 0; i < currentBatchSize; i++) {
            const name = generateKoreanName();
            const phoneNumber = generatePhoneNumber();
            const ssn = generateSSNPrefix();

            // 전화번호와 SSN 암호화
            const encryptedPhone = encrypt(phoneNumber);
            const phoneHash = hash(phoneNumber);
            const encryptedSSN = encrypt(ssn);

            patients.push({
                id: `patient-${Date.now()}-${batch}-${i}`,
                name,
                phoneNumber: encryptedPhone,
                phoneNumberHash: phoneHash,
                ssn: encryptedSSN,
                createdAt: now,
                updatedAt: now,
            });
        }

        const written = await batchWrite('appointment-patients-dev', patients);
        totalWritten += written;

        console.log(
            `   배치 ${batch + 1}/${Math.ceil(patientCount / batchSize)} 완료 (총 ${totalWritten.toLocaleString()}명)`,
        );
    }

    console.log(`✅ 환자 ${totalWritten.toLocaleString()}명 생성 완료\n`);
}

// 메인 함수
async function seedMockData() {
    console.log('🌱 목업 데이터 생성 시작...\n');

    const startTime = Date.now();

    try {
        // 의사 데이터 생성
        await createMockDoctors();

        // 환자 데이터 생성
        await createMockPatients();

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n🎉 목업 데이터 생성 완료! (소요 시간: ${elapsed}초)`);
        console.log('\n📊 생성된 데이터:');
        console.log('   - 의사: 50명');
        console.log('   - 환자: 100,000명');
        console.log('\n✨ Swagger UI에서 테스트할 수 있습니다:');
        console.log('   http://localhost:8809/api-docs');
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// 실행
if (require.main === module) {
    seedMockData();
}

module.exports = { seedMockData };
