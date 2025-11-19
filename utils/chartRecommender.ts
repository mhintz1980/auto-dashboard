
import { MetricMetadata, MetricType, ChartFocus, ChartConfig } from '../types';

export const recommendChartType = (metric: MetricMetadata): ChartConfig => {
  // 0. Structure Focus -> Treemap
  if (metric.preferredFocus === ChartFocus.Structure) {
    return { type: 'treemap' };
  }

  // 1. Hero / 3D Visualizations
  if (metric.dataType === MetricType.Hero) {
    return { type: '3d-bar' };
  }

  // 2. Composition (Parts of a Whole)
  if (metric.dataType === MetricType.Composition || metric.preferredFocus === ChartFocus.Distribution) {
    return { type: 'donut' };
  }

  // 3. Time Series (Trends over time)
  if (metric.dataType === MetricType.TimeSeries) {
    if (metric.preferredFocus === ChartFocus.Comparison) {
      return { type: 'area' }; // Area charts are good for comparing volume over time
    }
    return { type: 'line' }; // Default for time series
  }

  // 4. Categorical Comparisons
  if (metric.dataType === MetricType.Categorical) {
    return { type: 'bar' };
  }

  // Default fallback
  return { type: 'bar' };
};

export const getGradientColor = (index: number): string => {
  const colors = [
    '#3b82f6', // blue-500
    '#8b5cf6', // violet-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#f59e0b', // amber-500
    '#ef4444', // red-500
    '#06b6d4', // cyan-500
    '#f97316', // orange-500
  ];
  return colors[index % colors.length];
};
