/**
 * `encryption.ts`
 * - Encryption/Decryption utilities for personal information
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 * Copyright (C) 2025 LineDiet - All Rights Reserved.
 */
import * as CryptoJS from 'crypto-js';
import { $U } from '../cores/commons';

/**
 * Encryption key (should be stored in environment variable)
 */
const ENCRYPTION_KEY = $U.env('ENCRYPTION_KEY', 'default-encryption-key-change-in-production');

/**
 * Encryption Service
 */
export class EncryptionService {
    /**
     * Encrypt string data
     */
    public static encrypt(plainText: string): string {
        if (!plainText) return '';
        return CryptoJS.AES.encrypt(plainText, ENCRYPTION_KEY).toString();
    }

    /**
     * Decrypt encrypted data
     */
    public static decrypt(encrypted: string): string {
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
     * Mask personal information for logging
     * - Shows first 2 and last 2 characters only
     */
    public static mask(data: string, maskChar: string = '*'): string {
        if (!data || data.length <= 4) return maskChar.repeat(data?.length || 4);
        const firstTwo = data.substring(0, 2);
        const lastTwo = data.substring(data.length - 2);
        const middleLength = data.length - 4;
        return `${firstTwo}${maskChar.repeat(middleLength)}${lastTwo}`;
    }

    /**
     * Mask phone number (010-****-1234)
     */
    public static maskPhone(phone: string): string {
        if (!phone) return '***-****-****';
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return `${cleaned.substring(0, 3)}-****-${cleaned.substring(7, 11)}`;
        }
        return this.mask(phone);
    }

    /**
     * Mask SSN (주민등록번호: 123456-*******)
     */
    public static maskSSN(ssn: string): string {
        if (!ssn) return '******-*******';
        const cleaned = ssn.replace(/\D/g, '');
        if (cleaned.length === 13) {
            return `${cleaned.substring(0, 6)}-*******`;
        }
        return this.mask(ssn);
    }

    /**
     * Hash data (one-way, for comparison)
     */
    public static hash(data: string): string {
        if (!data) return '';
        return CryptoJS.SHA256(data).toString();
    }
}

/**
 * Convenience functions
 */
export const encrypt = EncryptionService.encrypt;
export const decrypt = EncryptionService.decrypt;
export const mask = EncryptionService.mask;
export const maskPhone = EncryptionService.maskPhone;
export const maskSSN = EncryptionService.maskSSN;
export const hash = EncryptionService.hash;
