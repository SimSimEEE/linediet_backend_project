/**
 * `commons.ts`
 * - Common utility functions
 *
 * @author      Sim Ugeun
 * @date        2025-01-22
 *
 */

/**
 * Type converter utilities
 */
export const $T = {
    /**
     * Convert to string with default value
     */
    S: (val: any, def: string = ''): string => {
        if (val === null || val === undefined) return def;
        return String(val);
    },

    /**
     * Convert to number with default value
     */
    N: (val: any, def: number = 0): number => {
        if (val === null || val === undefined) return def;
        const num = Number(val);
        return isNaN(num) ? def : num;
    },

    /**
     * Convert to boolean
     */
    B: (val: any): boolean => {
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val.toLowerCase() === 'true' || val === '1';
        return !!val;
    },

    /**
     * Convert to string safely (null-safe)
     */
    S2: (val: any): string => {
        return val === null || val === undefined || val === '' ? '' : String(val);
    },
};

/**
 * Utility functions
 */
export const $U = {
    /**
     * Get environment variable
     */
    env: (key: string, def: string = ''): string => {
        return process.env[key] || def;
    },

    /**
     * Create namespace logger
     */
    NS: (name: string, color?: string) => {
        return (msg: string, ...args: any[]) => {
            const prefix = color ? `\x1b[32m[${name}]\x1b[0m` : `[${name}]`;
            console.log(prefix, msg, ...args);
        };
    },

    /**
     * Wait for milliseconds
     */
    wait: (ms: number): Promise<void> => {
        return new Promise((resolve) => setTimeout(resolve, ms));
    },
};

/**
 * Logger utilities
 */
export const _log = (...args: any[]) => console.log(...args);
export const _inf = (...args: any[]) => console.info(...args);
export const _err = (...args: any[]) => console.error(...args);

/**
 * Remove undefined/null values from object
 */
export const onlyDefined = <T extends object>(obj: T): Partial<T> => {
    const result: any = {};
    Object.keys(obj).forEach((key) => {
        const value = (obj as any)[key];
        if (value !== undefined && value !== null) {
            result[key] = value;
        }
    });
    return result;
};

/**
 * Deep clone object
 */
export const deepClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
};

/**
 * Check if value is empty
 */
export const isEmpty = (val: any): boolean => {
    if (val === null || val === undefined) return true;
    if (typeof val === 'string') return val.trim() === '';
    if (Array.isArray(val)) return val.length === 0;
    if (typeof val === 'object') return Object.keys(val).length === 0;
    return false;
};

/**
 * Generate random ID
 */
export const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Format date to ISO string in Korea timezone
 */
export const formatDateKST = (date: Date = new Date()): string => {
    const offset = 9 * 60; // KST is UTC+9
    const kstDate = new Date(date.getTime() + offset * 60 * 1000);
    return kstDate.toISOString();
};

/**
 * Get current timestamp in KST
 */
export const nowKST = (): string => {
    return formatDateKST();
};
