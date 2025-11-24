const { DynamoDBClient, ListTablesCommand } = require('@aws-sdk/client-dynamodb');

const client = new DynamoDBClient({
    endpoint: 'http://localhost:8000',
    region: 'ap-northeast-2',
    credentials: {
        accessKeyId: 'dummy',
        secretAccessKey: 'dummy',
    },
});

async function listTables() {
    try {
        const command = new ListTablesCommand({});
        const response = await client.send(command);
        console.log('📋 DynamoDB Local 테이블 목록:');
        console.log(response.TableNames);
        console.log(`\n✅ 총 ${response.TableNames.length}개 테이블`);
    } catch (error) {
        console.error('❌ 에러:', error.message);
    }
}

listTables();
