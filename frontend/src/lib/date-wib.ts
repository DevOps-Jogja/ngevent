import { format, parseISO, isValid } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

/**
 * Parse a date string and return a Date that will display the UTC face value
 * when formatted by date-fns (which uses the browser's local timezone).
 *
 * This counteracts the browser's timezone offset so that the displayed time
 * matches exactly what's stored in the database (UTC face value).
 *
 * Example: DB has 14:00 UTC → JSON "...T14:00:00.000Z" → displays "14:00"
 */
export function parseToWIB(value?: string | null): Date | null {
    if (!value) return null;
    const date = typeof value === 'string' && value.includes('T')
        ? parseISO(value)
        : new Date(value);
    if (!isValid(date)) return null;
    // Shift by the local timezone offset so format() shows the raw UTC value
    return new Date(date.getTime() + date.getTimezoneOffset() * 60000);
}

/**
 * Format a date string to a formatted label.
 * Example output: "28 Feb 2026, 14:00"
 */
export function formatWIBDate(value?: string | null, formatStr = 'dd MMM yyyy, HH:mm'): string {
    const date = parseToWIB(value);
    if (!date) return '-';
    return format(date, formatStr, { locale: localeId });
}

/**
 * Format a date string to time-only.
 * Example output: "14:00"
 */
export function formatWIBTime(value?: string | null): string {
    const date = parseToWIB(value);
    if (!date) return '-';
    return format(date, 'HH:mm', { locale: localeId });
}
