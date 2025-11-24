/**
 * Delete all DynamoDB Local tables
 */
const { DynamoDBClient, DeleteTableCommand, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
    region: 'ap-northeast-2',
    endpoint: 'http://localhost:8000',
    credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
    },
});

async function deleteTables() {
    console.log('🗑️  DynamoDB Local 테이블 삭제 시작...\n');

    try {
        const listCommand = new ListTablesCommand({});
        const { TableNames = [] } = await client.send(listCommand);

        if (TableNames.length === 0) {
            console.log('✅ 삭제할 테이블이 없습니다.');
            return;
        }

        console.log(`📋 총 ${TableNames.length}개 테이블 삭제 예정:\n`);
        TableNames.forEach((name) => console.log(`   - ${name}`));
        console.log('');

        for (const tableName of TableNames) {
            try {
                await client.send(new DeleteTableCommand({ TableName: tableName }));
                console.log(`✅ ${tableName} - 삭제 완료`);
            } catch (error) {
                console.error(`❌ ${tableName} - 삭제 실패:`, error.message);
            }
        }

        console.log('\n🎉 모든 테이블 삭제 완료!');
        console.log('\n💡 새로운 테이블과 목업 데이터를 생성하려면:');
        console.log('   npm run setup:db');
    } catch (error) {
        console.error('❌ 오류 발생:', error.message);
        process.exit(1);
    }
}

deleteTables();
