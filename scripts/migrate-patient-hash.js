/**
 * Migrate existing patients to add phoneNumberHash field
 *
 * This script:
 * 1. Scans all existing patients
 * 2. Decrypts phone numbers
 * 3. Generates hash for each phone number
 * 4. Updates patient records with phoneNumberHash
 */

const AWS = require('aws-sdk');
const CryptoJS = require('crypto-js');

// Configure DynamoDB Local
const dynamodb = new AWS.DynamoDB.DocumentClient({
    region: 'local',
    endpoint: 'http://localhost:8000',
    accessKeyId: 'fakeAccessKeyId',
    secretAccessKey: 'fakeSecretAccessKey',
});

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default-encryption-key-change-in-production';
const TABLE_NAME = 'appointment-patients-dev';

/**
 * Decrypt encrypted data
 */
function decrypt(encrypted) {
    if (!encrypted) return '';
    try {
        const bytes = CryptoJS.AES.decrypt(encrypted, ENCRYPTION_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
        console.error('Decryption failed:', error);
        return '';
    }
}

/**
 * Hash data
 */
function hash(data) {
    if (!data) return '';
    return CryptoJS.SHA256(data).toString();
}

/**
 * Scan all patients
 */
async function scanAllPatients() {
    let items = [];
    let lastEvaluatedKey = null;

    do {
        const params = {
            TableName: TABLE_NAME,
            ExclusiveStartKey: lastEvaluatedKey,
        };

        const result = await dynamodb.scan(params).promise();
        items = items.concat(result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
    } while (lastEvaluatedKey);

    return items;
}

/**
 * Update patient with phoneNumberHash
 */
async function updatePatientHash(patient) {
    try {
        // Skip if already has hash
        if (patient.phoneNumberHash) {
            console.log(`⏭️  Patient ${patient.id} already has phoneNumberHash, skipping`);
            return { success: true, skipped: true };
        }

        // Decrypt phone number
        const decryptedPhone = decrypt(patient.phoneNumber);
        if (!decryptedPhone) {
            console.error(`❌ Failed to decrypt phone for patient ${patient.id}`);
            return { success: false, error: 'Decryption failed' };
        }

        // Clean phone number (remove hyphens)
        const cleanPhone = decryptedPhone.replace(/-/g, '');

        // Generate hash
        const phoneHash = hash(cleanPhone);

        // Update patient
        const params = {
            TableName: TABLE_NAME,
            Key: {
                id: patient.id,
            },
            UpdateExpression: 'SET phoneNumberHash = :phoneHash, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':phoneHash': phoneHash,
                ':updatedAt': new Date().toISOString(),
            },
            ReturnValues: 'ALL_NEW',
        };

        await dynamodb.update(params).promise();
        console.log(`✅ Updated patient ${patient.id} (${patient.name})`);
        return { success: true, skipped: false };
    } catch (error) {
        console.error(`❌ Error updating patient ${patient.id}:`, error);
        return { success: false, error: error.message };
    }
}

/**
 * Main migration function
 */
async function migrate() {
    console.log('🚀 Starting patient phoneNumberHash migration...\n');

    try {
        // Scan all patients
        console.log('📊 Scanning all patients...');
        const patients = await scanAllPatients();
        console.log(`Found ${patients.length} patients\n`);

        if (patients.length === 0) {
            console.log('✅ No patients to migrate');
            return;
        }

        // Update each patient
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (const patient of patients) {
            const result = await updatePatientHash(patient);
            if (result.success) {
                if (result.skipped) {
                    skipCount++;
                } else {
                    successCount++;
                }
            } else {
                errorCount++;
            }
        }

        // Summary
        console.log('\n' + '='.repeat(50));
        console.log('📈 Migration Summary:');
        console.log(`   Total: ${patients.length}`);
        console.log(`   ✅ Updated: ${successCount}`);
        console.log(`   ⏭️  Skipped: ${skipCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('='.repeat(50));

        if (errorCount === 0) {
            console.log('\n🎉 Migration completed successfully!');
        } else {
            console.log('\n⚠️  Migration completed with some errors');
        }
    } catch (error) {
        console.error('\n❌ Migration failed:', error);
        process.exit(1);
    }
}

// Run migration
migrate();
