/**
 * Chart Export Utilities
 * Provides functionality to export ApexCharts as base64 images for PDF embedding
 */

import ApexCharts from 'apexcharts';

/**
 * Export a chart as a base64 PNG image using the chart's ID
 * @param chartId - The unique ID assigned to the chart in its options
 * @param scale - Image scale factor (default: 2 for better quality)
 * @returns Promise resolving to base64 image data URL
 */
export async function exportChartAsImage(chartId: string, scale: number = 2): Promise<string> {
	try {
		const result = await ApexCharts.exec(chartId, 'dataURI', { scale });
		if (result && result.imgURI) {
			return result.imgURI;
		}
		throw new Error(`Failed to export chart: ${chartId}`);
	} catch (error) {
		console.error(`Error exporting chart ${chartId}:`, error);
		throw error;
	}
}

/**
 * Export multiple charts as base64 images
 * @param chartIds - Array of chart IDs to export
 * @param scale - Image scale factor (default: 2)
 * @returns Promise resolving to map of chartId -> base64 image
 */
export async function exportMultipleCharts(
	chartIds: string[],
	scale: number = 2
): Promise<Map<string, string>> {
	const results = new Map<string, string>();

	for (const chartId of chartIds) {
		try {
			const imageData = await exportChartAsImage(chartId, scale);
			results.set(chartId, imageData);
		} catch {
			console.warn(`Skipping chart ${chartId} due to export error`);
		}
	}

	return results;
}

/**
 * Generate a unique chart ID for report charts
 * @param prefix - Prefix for the chart ID
 * @returns Unique chart ID string
 */
export function generateReportChartId(prefix: string): string {
	return `report-chart-${prefix}-${Date.now()}`;
}

/**
 * Chart configuration for report generation
 * These are minimal chart configs for rendering in hidden containers
 */
export interface ReportChartConfig {
	id: string;
	type: 'bar' | 'donut' | 'line' | 'radar';
	title: string;
	series: ApexAxisChartSeries | ApexNonAxisChartSeries;
	labels?: string[];
	categories?: string[];
	colors?: string[];
	horizontal?: boolean;
	stacked?: boolean;
}

/**
 * Create ApexCharts options for report chart rendering
 * Uses minimal styling optimized for PDF export
 */
export function createReportChartOptions(config: ReportChartConfig): ApexCharts.ApexOptions {
	const baseOptions: ApexCharts.ApexOptions = {
		chart: {
			id: config.id,
			type: config.type,
			height: 300,
			width: 500,
			background: '#ffffff',
			animations: {
				enabled: false
			},
			toolbar: {
				show: false
			}
		},
		title: {
			text: config.title,
			style: {
				fontSize: '14px',
				fontWeight: 'bold',
				color: '#1E293B'
			}
		},
		colors: config.colors || [
			'#3B82F6',
			'#10B981',
			'#F59E0B',
			'#EF4444',
			'#8B5CF6',
			'#EC4899',
			'#06B6D4',
			'#84CC16'
		],
		legend: {
			position: 'bottom',
			fontSize: '11px'
		},
		dataLabels: {
			enabled: true,
			style: {
				fontSize: '10px'
			}
		}
	};

	// Type-specific options
	if (config.type === 'bar') {
		return {
			...baseOptions,
			series: config.series as ApexAxisChartSeries,
			plotOptions: {
				bar: {
					horizontal: config.horizontal || false,
					columnWidth: '60%',
					dataLabels: {
						position: 'top'
					}
				}
			},
			xaxis: {
				categories: config.categories || [],
				labels: {
					style: {
						fontSize: '10px'
					}
				}
			},
			yaxis: {
				labels: {
					style: {
						fontSize: '10px'
					}
				}
			}
		};
	}

	if (config.type === 'donut') {
		return {
			...baseOptions,
			series: config.series as ApexNonAxisChartSeries,
			labels: config.labels || [],
			plotOptions: {
				pie: {
					donut: {
						size: '65%',
						labels: {
							show: true,
							total: {
								show: true,
								label: 'Total',
								fontSize: '12px'
							}
						}
					}
				}
			}
		};
	}

	if (config.type === 'line') {
		return {
			...baseOptions,
			series: config.series as ApexAxisChartSeries,
			stroke: {
				curve: 'smooth',
				width: 2
			},
			markers: {
				size: 4
			},
			xaxis: {
				categories: config.categories || [],
				labels: {
					style: {
						fontSize: '10px'
					}
				}
			},
			yaxis: {
				labels: {
					style: {
						fontSize: '10px'
					}
				}
			}
		};
	}

	if (config.type === 'radar') {
		return {
			...baseOptions,
			series: config.series as ApexAxisChartSeries,
			xaxis: {
				categories: config.categories || []
			},
			plotOptions: {
				radar: {
					size: 120,
					polygons: {
						strokeColors: '#e8e8e8'
					}
				}
			}
		};
	}

	return baseOptions;
}

/**
 * Render a chart in a hidden container and export as image
 * This creates a temporary DOM element, renders the chart, exports, and cleans up
 */
export async function renderAndExportChart(config: ReportChartConfig): Promise<string> {
	// Create hidden container
	const container = document.createElement('div');
	container.id = `chart-export-container-${config.id}`;
	container.style.position = 'absolute';
	container.style.left = '-9999px';
	container.style.top = '-9999px';
	container.style.width = '500px';
	container.style.height = '300px';
	document.body.appendChild(container);

	try {
		// Create and render chart
		const options = createReportChartOptions(config);
		const chart = new ApexCharts(container, options);
		await chart.render();

		// Wait for chart to fully render
		await new Promise((resolve) => setTimeout(resolve, 500));

		// Export as image
		const imageData = await exportChartAsImage(config.id);

		// Cleanup
		chart.destroy();
		document.body.removeChild(container);

		return imageData;
	} catch (error) {
		// Cleanup on error
		if (document.body.contains(container)) {
			document.body.removeChild(container);
		}
		throw error;
	}
}
