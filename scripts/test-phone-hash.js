/**
 * Test phone number hash generation
 */

const CryptoJS = require('crypto-js');

function hash(data) {
    if (!data) return '';
    return CryptoJS.SHA256(data).toString();
}

// Test phone numbers
const phones = ['01012345678', '010-1234-5678', '01098765432', '010-9876-5432'];

console.log('📱 Phone Number Hash Test:\n');

phones.forEach((phone) => {
    const cleanPhone = phone.replace(/-/g, '');
    const phoneHash = hash(cleanPhone);
    console.log(`Phone: ${phone}`);
    console.log(`Clean: ${cleanPhone}`);
    console.log(`Hash:  ${phoneHash}`);
    console.log('');
});

console.log('\n🔍 Expected hashes from DB:');
console.log('김철수/홍길동: e60124f2fe2045215abda1ae912aa80bb66dab5fc231a758387682c9c0e70c01');
console.log('김영희:         e42cc5618f17206e389dca0b3b89187e110577b4190f8148bd83641f85a159a6');
