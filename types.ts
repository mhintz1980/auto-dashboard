
export enum MetricType {
  TimeSeries = 'timeSeries',
  Categorical = 'categorical',
  Composition = 'composition',
  Hero = 'hero',
  Hierarchical = 'hierarchical', // New type for Treemaps
}

export enum Granularity {
  Daily = 'daily',
  Monthly = 'monthly',
  PerUnit = 'perUnit',
  Global = 'global',
}

export enum ChartFocus {
  Trend = 'trend',
  Comparison = 'comparison',
  Distribution = 'distribution',
  Metric = 'metric',
  Structure = 'structure', // New focus
}

export interface MetricMetadata {
  id: string;
  name: string;
  description: string;
  dataType: MetricType;
  granularity: Granularity;
  preferredFocus: ChartFocus;
  hasHierarchy: boolean; 
  unit?: string;
}

export interface DataPoint {
  name: string;
  value: number;
  children?: DataPoint[]; // Supports nested drill-down data
  [key: string]: any;
}

export interface ChartConfig {
  type: 'line' | 'bar' | 'area' | 'donut' | '3d-bar' | 'kpi' | 'treemap';
  options?: any;
}

export interface CategoryData {
  id: string;
  name: string;
  icon: string;
  metrics: MetricMetadata[];
  data: Record<string, DataPoint[]>;
}

export interface DashboardState {
  activeCategory: string;
  favorites: string[];
  drillDownPath: { metricId: string; level: string } | null;
}
