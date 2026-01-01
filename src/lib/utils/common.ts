// src/lib/utils/common.ts
/**
 * Convert a string to Title Case.
 *
 * Rules:
 * - Capitalizes the first letter of most words.
 * - Keeps short "small words" (a, an, the, in, on, etc.) lowercase unless they are the first or last word.
 * - Preserves separators (spaces, hyphens, underscores).
 * - Handles internal apostrophes (e.g. "o'neill" -> "O'Neill").
 */

export type TitleCaseOptions = {
	/**
	 * Additional small words to keep lowercase (in addition to the defaults).
	 */
	smallWords?: string[];
};

const DEFAULT_SMALL_WORDS = [
	'a',
	'an',
	'the',
	'and',
	'but',
	'or',
	'for',
	'nor',
	'on',
	'at',
	'to',
	'from',
	'by',
	'in',
	'of',
	'with',
	'as',
	'per',
	'is',
	'if',
	'then',
	'else',
	'when'
];

function capitalizePart(part: string): string {
	if (!part) return part;
	if (part.length === 1) return part.toUpperCase();
	return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

/**
 * Convert input string to title case.
 *
 * Examples:
 * toTitleCase("the lord of the rings") -> "The Lord of the Rings"
 * toTitleCase("hello_world-test") -> "Hello_World-Test"
 */
export function toTitleCase(input: string, opts?: TitleCaseOptions): string {
	if (!input) return '';

	const smallSet = new Set(
		(opts?.smallWords ?? []).concat(DEFAULT_SMALL_WORDS).map((s) => s.toLowerCase())
	);

	// Keep separators so we can reconstruct the exact spacing/punctuation.
	const tokens = input.trim().split(/(\s+|-|_)/);

	// Count word tokens (non-separators) to know first/last positions.
	const wordIndices = tokens
		.map((t, i) => ({ t, i }))
		.filter(({ t }) => !/^\s+$/.test(t) && t !== '-' && t !== '_')
		.map(({ i }) => i);

	const firstWordIndex = wordIndices[0];
	const lastWordIndex = wordIndices[wordIndices.length - 1];

	return tokens
		.map((token, idx) => {
			// separators: spaces, hyphens, underscores -> return as-is
			if (token === '-') return ' ';
			if (/^\s+$/.test(token) || token === '-' || token === '_') return token;

			const lower = token.toLowerCase();

			// treat small words (unless first or last)
			if (smallSet.has(lower) && idx !== firstWordIndex && idx !== lastWordIndex) {
				return lower;
			}

			// handle internal apostrophes like "o'neill"
			if (token.includes("'")) {
				return token
					.split("'")
					.map((p) => capitalizePart(p))
					.join("'");
			}

			return capitalizePart(token);
		})
		.join('');
}

export default toTitleCase;
