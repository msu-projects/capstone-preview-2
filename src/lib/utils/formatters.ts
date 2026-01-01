/**
 * Centralized formatting utilities
 * This module consolidates all formatting functions to avoid code duplication.
 */

/**
 * Formats a number as Philippine Peso currency
 * @param amount - The amount to format
 * @param minimumFractionDigits - Minimum decimal places (default: 0)
 */
export function formatCurrency(amount: number, minimumFractionDigits: number = 0): string {
	return new Intl.NumberFormat('en-PH', {
		style: 'currency',
		currency: 'PHP',
		minimumFractionDigits
	}).format(amount);
}

/**
 * Formats a number with locale-specific separators
 * @param num - The number to format
 * @param fallback - Fallback string when num is undefined/null (default: '-')
 */
export function formatNumber(num: number | undefined | null, fallback: string = '-'): string {
	if (num === undefined || num === null) return fallback;
	return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Formats a date string in a readable format
 * @param dateString - ISO date string or Date-parseable string
 * @param options - Intl.DateTimeFormat options (default: short date format)
 */
export function formatDate(
	dateString: string | Date,
	options: Intl.DateTimeFormatOptions = {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	}
): string {
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
	return new Intl.DateTimeFormat('en-PH', options).format(date);
}

/**
 * Formats a percentage value
 * @param value - The percentage value (e.g., 45.5 for 45.5%)
 * @param decimals - Number of decimal places (default: 2)
 */
export function formatPercentage(value: number, decimals: number = 2): string {
	return `${value.toFixed(decimals)}%`;
}

/**
 * Formats a date as relative time (e.g., "2 days ago")
 * @param dateString - ISO date string or Date-parseable string
 */
export function formatRelativeTime(dateString: string | Date): string {
	const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
	const now = new Date();
	const diffInMs = now.getTime() - date.getTime();
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	if (diffInDays === 0) return 'Today';
	if (diffInDays === 1) return 'Yesterday';
	if (diffInDays < 7) return `${diffInDays} days ago`;
	if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
	if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
	return `${Math.floor(diffInDays / 365)} years ago`;
}

/**
 * Truncates text to a maximum length with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 */
export function truncateText(text: string, maxLength: number): string {
	return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

/**
 * Formats a number as compact Philippine Peso currency (e.g., ₱14.5M, ₱2.3K)
 * @param amount - The amount to format
 */
export function formatCurrencyCompact(amount: number): string {
	const absAmount = Math.abs(amount);
	const sign = amount < 0 ? '-' : '';

	if (absAmount >= 1_000_000_000) {
		return `${sign}₱${(absAmount / 1_000_000_000).toFixed(1)}B`;
	}
	if (absAmount >= 1_000_000) {
		return `${sign}₱${(absAmount / 1_000_000).toFixed(1)}M`;
	}
	if (absAmount >= 1_000) {
		return `${sign}₱${(absAmount / 1_000).toFixed(1)}K`;
	}
	return `${sign}₱${absAmount.toFixed(0)}`;
}
