/**
 * Setup DynamoDB Local tables
 * Run: ts-node scripts/setup-dynamodb-local.ts
 */
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { CreateTableCommand, ListTablesCommand, DeleteTableCommand } from '@aws-sdk/client-dynamodb';

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
        TableName: 'appointment-appointments-dev',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'doctorId', AttributeType: 'S' },
            { AttributeName: 'appointmentDate', AttributeType: 'S' },
            { AttributeName: 'patientId', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'doctorId-appointmentDate-index',
                KeySchema: [
                    { AttributeName: 'doctorId', KeyType: 'HASH' },
                    { AttributeName: 'appointmentDate', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
            },
            {
                IndexName: 'patientId-appointmentDate-index',
                KeySchema: [
                    { AttributeName: 'patientId', KeyType: 'HASH' },
                    { AttributeName: 'appointmentDate', KeyType: 'RANGE' },
                ],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
            },
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
        TableName: 'appointment-patients-dev',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [
            { AttributeName: 'id', AttributeType: 'S' },
            { AttributeName: 'phoneNumber', AttributeType: 'S' },
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'phoneNumber-index',
                KeySchema: [{ AttributeName: 'phoneNumber', KeyType: 'HASH' }],
                Projection: { ProjectionType: 'ALL' },
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
            },
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
    {
        TableName: 'appointment-doctors-dev',
        KeySchema: [{ AttributeName: 'id', KeyType: 'HASH' }],
        AttributeDefinitions: [{ AttributeName: 'id', AttributeType: 'S' }],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
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
                ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
            },
        ],
        BillingMode: 'PROVISIONED',
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
    },
];

async function setupTables() {
    console.log('🚀 Setting up DynamoDB Local tables...\n');

    try {
        // List existing tables
        const listResult = await client.send(new ListTablesCommand({}));
        console.log('📋 Existing tables:', listResult.TableNames || []);

        // Delete existing tables if they exist
        for (const tableName of listResult.TableNames || []) {
            if (tableName.startsWith('appointment-')) {
                console.log(`🗑️  Deleting existing table: ${tableName}`);
                await client.send(new DeleteTableCommand({ TableName: tableName }));
                // Wait a bit for deletion to complete
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }

        // Create new tables
        for (const table of tables) {
            console.log(`\n✨ Creating table: ${table.TableName}`);
            try {
                await client.send(new CreateTableCommand(table as any));
                console.log(`✅ Table created successfully: ${table.TableName}`);
            } catch (error: any) {
                if (error.name === 'ResourceInUseException') {
                    console.log(`⚠️  Table already exists: ${table.TableName}`);
                } else {
                    throw error;
                }
            }
        }

        console.log('\n🎉 All tables setup completed!');
        console.log('\n📊 Tables created:');
        tables.forEach((t) => console.log(`  - ${t.TableName}`));
    } catch (error) {
        console.error('❌ Error setting up tables:', error);
        throw error;
    }
}

setupTables()
    .then(() => {
        console.log('\n✨ Setup complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Setup failed:', error);
        process.exit(1);
    });
