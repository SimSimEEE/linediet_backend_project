/**
 * DynamoDB Local 테이블 생성 스크립트
 * 로컬 개발 환경을 위한 테이블 초기화
 */
const { DynamoDBClient, CreateTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
    region: 'ap-northeast-2',
    endpoint: 'http://localhost:8000',
    credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
    },
});

const tables = [
    {
        TableName: 'appointment-doctors-dev',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: 'appointment-patients-dev',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: 'appointment-appointments-dev',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'appointmentDate', AttributeType: 'S' },
            { AttributeName: 'doctorId', AttributeType: 'S' },
            { AttributeName: 'patientId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'appointmentDate-index',
                KeySchema: [{ AttributeName: 'appointmentDate', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
            },
            {
                IndexName: 'doctorId-appointmentDate-index',
                KeySchema: [
                    { AttributeName: 'doctorId', KeyType: 'HASH' },
                    { AttributeName: 'appointmentDate', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
            },
            {
                IndexName: 'patientId-appointmentDate-index',
                KeySchema: [
                    { AttributeName: 'patientId', KeyType: 'HASH' },
                    { AttributeName: 'appointmentDate', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
            },
        ],
        BillingMode: 'PAY_PER_REQUEST',
    },
    {
        TableName: 'appointment-visits-dev',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'patientId', AttributeType: 'S' },
            { AttributeName: 'checkInTime', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'patientId-checkInTime-index',
                KeySchema: [
                    { AttributeName: 'patientId', KeyType: 'HASH' },
                    { AttributeName: 'checkInTime', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
            },
        ],
        BillingMode: 'PAY_PER_REQUEST',
    },
];

async function createTables() {
    console.log('🚀 DynamoDB Local 테이블 생성 시작...\n');

    try {
        // 기존 테이블 목록 확인
        const listCommand = new ListTablesCommand({});
        const { TableNames = [] } = await client.send(listCommand);
        console.log('📋 기존 테이블:', TableNames.length > 0 ? TableNames.join(', ') : '없음');
        console.log('');

        // 각 테이블 생성
        for (const tableConfig of tables) {
            const tableName = tableConfig.TableName;

            if (TableNames.includes(tableName)) {
                console.log(`⏭️  ${tableName} - 이미 존재함`);
                continue;
            }

            try {
                const command = new CreateTableCommand(tableConfig);
                await client.send(command);
                console.log(`✅ ${tableName} - 생성 완료`);
            } catch (error) {
                console.error(`❌ ${tableName} - 생성 실패:`, error.message);
            }
        }

        console.log('\n🎉 테이블 생성 완료!');
        console.log('\n📝 생성된 테이블:');
        const finalList = await client.send(new ListTablesCommand({}));
        finalList.TableNames.forEach((name) => console.log(`   - ${name}`));

        console.log('\n✨ 이제 서버를 재시작하면 Swagger에서 API를 테스트할 수 있습니다!');
        console.log('   npm run dev');

        return TableNames.length === 0; // 새로 생성된 테이블이 있으면 true
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        process.exit(1);
    }
}

// 메인 실행
async function main() {
    const isNewSetup = await createTables();

    // 테이블이 새로 생성된 경우에만 목업 데이터 생성
    if (isNewSetup) {
        console.log('\n🌱 목업 데이터를 생성하시겠습니까? (10만명 환자 + 50명 의사)');
        console.log('   (Y/n): ');

        // 자동으로 Y 선택 (스크립트 실행 시)
        const shouldSeed = process.env.AUTO_SEED !== 'false';

        if (shouldSeed) {
            console.log('\n');
            const { seedMockData } = require('./seed-mock-data.js');
            await seedMockData();
        }
    }
}

if (require.main === module) {
    main();
}
