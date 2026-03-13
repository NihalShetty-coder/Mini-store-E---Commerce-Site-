import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Safely convert a Firestore timestamp, Date, string, or number to a Date object.
 * Returns `null` if the value cannot be converted.
 */
export function toSafeDate(
    value: unknown
): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? null : d;
    }
    // Firestore Timestamp (has toDate method)
    if (typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    // Firestore Timestamp serialized as { seconds, nanoseconds }
    if (typeof value === 'object' && 'seconds' in value) {
        return new Date((value as { seconds: number }).seconds * 1000);
    }
    return null;
}

/**
 * Format a Firestore timestamp/Date/string to a locale date string.
 * Returns the fallback string if conversion fails.
 */
export function formatDate(value: unknown, fallback = 'Recent'): string {
    const d = toSafeDate(value);
    return d ? d.toLocaleDateString() : fallback;
}

/**
 * Format a Firestore timestamp/Date/string to a locale date+time string.
 * Returns the fallback string if conversion fails.
 */
export function formatDateTime(value: unknown, fallback = 'Recent'): string {
    const d = toSafeDate(value);
    return d ? d.toLocaleString() : fallback;
}
