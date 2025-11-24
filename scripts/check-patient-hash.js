/**
 * Check if patients have phoneNumberHash field
 */

const AWS = require('aws-sdk');

// Configure DynamoDB Local
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'local',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
});

const TABLE_NAME = 'appointment-patients-dev';

async function checkPatients() {
    console.log('🔍 Checking patient phoneNumberHash fields...\n');

    try {
        const result = await dynamodb
            .scan({
                TableName: TABLE_NAME,
            })
            .promise();

        console.log(`Found ${result.Items.length} patients:\n`);

        result.Items.forEach((patient, index) => {
            console.log(`${index + 1}. ${patient.name} (${patient.id})`);
            console.log(`   phoneNumber: ${patient.phoneNumber}`);
            console.log(`   phoneNumberHash: ${patient.phoneNumberHash || '❌ MISSING'}`);
            console.log('');
        });
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

checkPatients();
