import { themeStore } from '$lib/stores/theme.svelte';

/**
 * Chart color palette for light and dark themes
 * Uses CSS-compatible color values that work with ApexCharts
 */

export const lightChartColors = {
	// Text colors
	labelColor: '#64748b', // slate-500
	valueColor: '#0f172a', // slate-900
	titleColor: '#334155', // slate-700
	dataLabelColor: '#334155', // slate-700

	// Grid and borders
	gridColor: '#e2e8f0', // slate-200
	borderColor: '#e2e8f0',

	// Background
	tooltipBackground: '#ffffff',
	tooltipText: '#0f172a',

	// Chart series colors
	primary: 'hsl(217, 91%, 60%)',
	success: 'hsl(142, 71%, 45%)',
	warning: 'hsl(48, 96%, 53%)',
	danger: 'hsl(0, 84%, 60%)',
	purple: 'hsl(280, 70%, 60%)',
	pink: 'hsl(340, 82%, 52%)',
	cyan: 'hsl(189, 85%, 45%)',
	orange: 'hsl(24, 95%, 53%)'
};

export const darkChartColors = {
	// Text colors
	labelColor: '#94a3b8', // slate-400
	valueColor: '#f1f5f9', // slate-100
	titleColor: '#cbd5e1', // slate-300
	dataLabelColor: '#e2e8f0', // slate-200

	// Grid and borders
	gridColor: '#334155', // slate-700
	borderColor: '#475569', // slate-600

	// Background
	tooltipBackground: '#1e293b', // slate-800
	tooltipText: '#f1f5f9',

	// Chart series colors (brighter for dark mode)
	primary: 'hsl(217, 91%, 65%)',
	success: 'hsl(142, 71%, 55%)',
	warning: 'hsl(48, 96%, 60%)',
	danger: 'hsl(0, 84%, 65%)',
	purple: 'hsl(280, 70%, 70%)',
	pink: 'hsl(340, 82%, 62%)',
	cyan: 'hsl(189, 85%, 55%)',
	orange: 'hsl(24, 95%, 60%)'
};

/**
 * Get the current chart colors based on the active theme
 */
export function getChartColors() {
	return themeStore.resolvedTheme === 'dark' ? darkChartColors : lightChartColors;
}

/**
 * Default series color palette
 */
export function getDefaultSeriesColors() {
	const colors = getChartColors();
	return [colors.primary, colors.success, colors.warning, colors.purple, colors.cyan, colors.pink];
}

/**
 * Get distributed bar chart colors
 */
export function getDistributedColors(count: number) {
	const palette = getDefaultSeriesColors();
	return Array.from({ length: count }, (_, i) => palette[i % palette.length]);
}
