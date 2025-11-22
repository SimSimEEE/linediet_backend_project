/**
 * `encryption.spec.ts`
 * - Encryption utility tests
 */
import { EncryptionService } from './encryption';

describe('EncryptionService', () => {
    describe('encrypt and decrypt', () => {
        it('should encrypt and decrypt correctly', () => {
            const plainText = '01012345678';
            const encrypted = EncryptionService.encrypt(plainText);
            const decrypted = EncryptionService.decrypt(encrypted);

            expect(encrypted).not.toBe(plainText);
            expect(decrypted).toBe(plainText);
        });

        it('should handle empty string', () => {
            const encrypted = EncryptionService.encrypt('');
            expect(encrypted).toBe('');

            const decrypted = EncryptionService.decrypt('');
            expect(decrypted).toBe('');
        });
    });

    describe('mask', () => {
        it('should mask data correctly', () => {
            const masked = EncryptionService.mask('12345678');
            expect(masked).toBe('12****78');
        });

        it('should mask phone number', () => {
            const masked = EncryptionService.maskPhone('01012345678');
            expect(masked).toBe('010-****-5678');
        });

        it('should mask SSN', () => {
            const masked = EncryptionService.maskSSN('1234567890123');
            expect(masked).toBe('123456-*******');
        });
    });

    describe('hash', () => {
        it('should hash data', () => {
            const hash1 = EncryptionService.hash('test');
            const hash2 = EncryptionService.hash('test');
            const hash3 = EncryptionService.hash('different');

            expect(hash1).toBe(hash2);
            expect(hash1).not.toBe(hash3);
        });
    });
});
