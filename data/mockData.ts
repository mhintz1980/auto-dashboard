
import { CategoryData, MetricType, Granularity, ChartFocus } from '../types';

const generateTimeSeries = (points: number, base: number, variance: number) => {
  return Array.from({ length: points }, (_, i) => ({
    name: `Day ${i + 1}`,
    value: Math.max(0, Math.floor(base + Math.random() * variance - variance / 2)),
    prevValue: Math.max(0, Math.floor(base + Math.random() * variance - variance / 2)),
  }));
};

// Helper to generate children for drill-down
const generateChildren = (parentName: string, count: number, max: number): any[] => {
  return Array.from({ length: count }, (_, i) => ({
    name: `${parentName}-${i + 1}`,
    value: Math.floor(Math.random() * max) + 10,
  }));
};

const generateCategorical = (names: string[], max: number) => {
  return names.map(name => ({
    name,
    value: Math.floor(Math.random() * max) + 10,
  }));
};

export const DASHBOARD_DATA: CategoryData[] = [
  {
    id: 'sales',
    name: 'Sales',
    icon: '💰',
    metrics: [
      {
        id: 'revenue_trend',
        name: 'Revenue Trend',
        description: 'Daily revenue over the last 30 days',
        dataType: MetricType.TimeSeries,
        granularity: Granularity.Daily,
        preferredFocus: ChartFocus.Trend,
        hasHierarchy: false,
        unit: '$'
      },
      {
        id: 'top_regions',
        name: 'Regional Performance',
        description: 'Sales breakdown by region (3D View)',
        dataType: MetricType.Hero,
        granularity: Granularity.Global,
        preferredFocus: ChartFocus.Comparison,
        hasHierarchy: true,
        unit: 'k'
      },
      {
        id: 'product_mix',
        name: 'Product Mix',
        description: 'Click slice to drill down (Donut -> Bar)',
        dataType: MetricType.Composition,
        granularity: Granularity.PerUnit,
        preferredFocus: ChartFocus.Distribution,
        hasHierarchy: true,
        unit: '%'
      }
    ],
    data: {
      revenue_trend: generateTimeSeries(30, 5000, 2000),
      top_regions: [
        { name: 'North', value: 85 },
        { name: 'South', value: 45 },
        { name: 'East', value: 65 },
        { name: 'West', value: 95 },
      ],
      product_mix: [
        { name: 'Electronics', value: 40, children: generateChildren('Elec', 5, 20) },
        { name: 'Clothing', value: 30, children: generateChildren('Cloth', 4, 15) },
        { name: 'Home', value: 20, children: generateChildren('Home', 3, 10) },
        { name: 'Other', value: 10, children: generateChildren('Misc', 2, 5) },
      ]
    }
  },
  {
    id: 'production',
    name: 'Production',
    icon: '🏭',
    metrics: [
      {
        id: 'daily_output',
        name: 'Daily Output',
        description: 'Units produced per day vs Target',
        dataType: MetricType.TimeSeries,
        granularity: Granularity.Daily,
        preferredFocus: ChartFocus.Comparison,
        hasHierarchy: false,
        unit: 'units'
      },
      {
        id: 'resource_map',
        name: 'Factory Resource Map',
        description: 'Space utilization (Treemap)',
        dataType: MetricType.Categorical, // Will recommend Treemap via overridden rule or explicit update
        granularity: Granularity.Global,
        preferredFocus: ChartFocus.Structure,
        hasHierarchy: true,
        unit: 'sqft'
      },
      {
        id: 'efficiency_kpi',
        name: 'Line Efficiency',
        description: 'Overall Equipment Effectiveness (OEE)',
        dataType: MetricType.Hero,
        granularity: Granularity.Global,
        preferredFocus: ChartFocus.Metric,
        hasHierarchy: false,
        unit: '%'
      }
    ],
    data: {
      daily_output: generateTimeSeries(14, 1200, 300),
      resource_map: [
        { 
          name: 'Assembly', 
          value: 400, 
          children: [
             { name: 'Zone A', value: 150 },
             { name: 'Zone B', value: 120 },
             { name: 'Zone C', value: 130 }
          ] 
        },
        { 
          name: 'Packaging', 
          value: 300,
          children: [
             { name: 'Box', value: 200 },
             { name: 'Label', value: 100 }
          ]
        },
        { 
          name: 'Storage', 
          value: 300,
          children: [
             { name: 'Cold', value: 100 },
             { name: 'Dry', value: 200 }
          ]
        },
        { name: 'Office', value: 100, children: [{name: 'HR', value: 50}, {name: 'Eng', value: 50}] },
      ],
      efficiency_kpi: [{ name: 'Line 1', value: 88 }, { name: 'Line 2', value: 72 }, { name: 'Line 3', value: 94 }]
    }
  },
  {
    id: 'inventory',
    name: 'Inventory',
    icon: '📦',
    metrics: [
      {
        id: 'stock_levels',
        name: 'Stock Levels',
        description: 'Current stock count by warehouse',
        dataType: MetricType.Hero,
        granularity: Granularity.Global,
        preferredFocus: ChartFocus.Comparison,
        hasHierarchy: true,
        unit: 'k'
      },
      {
        id: 'turnover_rate',
        name: 'Turnover Rate',
        description: 'Inventory turnover ratio over time',
        dataType: MetricType.TimeSeries,
        granularity: Granularity.Monthly,
        preferredFocus: ChartFocus.Trend,
        hasHierarchy: false,
        unit: 'x'
      },
      {
        id: 'category_split',
        name: 'Stock Value Split',
        description: 'Value distribution across categories',
        dataType: MetricType.Composition,
        granularity: Granularity.PerUnit,
        preferredFocus: ChartFocus.Distribution,
        hasHierarchy: false,
        unit: '$'
      }
    ],
    data: {
      stock_levels: [
        { name: 'WH-Alpha', value: 120 },
        { name: 'WH-Beta', value: 80 },
        { name: 'WH-Gamma', value: 150 },
      ],
      turnover_rate: generateTimeSeries(12, 4, 2),
      category_split: generateCategorical(['Raw Mat', 'WIP', 'Finished', 'Spare Parts'], 100)
    }
  },
  {
    id: 'pump_tracker',
    name: 'PumpTracker Ops',
    icon: '⛽',
    metrics: [
      {
        id: 'flow_rate',
        name: 'Avg Flow Rate',
        description: 'Real-time pump flow rates',
        dataType: MetricType.TimeSeries,
        granularity: Granularity.Daily,
        preferredFocus: ChartFocus.Trend,
        hasHierarchy: false,
        unit: 'L/min'
      },
      {
        id: 'pressure_distribution',
        name: 'Pressure Zones',
        description: 'Pressure readings distribution',
        dataType: MetricType.Composition,
        granularity: Granularity.Global,
        preferredFocus: ChartFocus.Distribution,
        hasHierarchy: false,
        unit: 'psi'
      },
      {
        id: 'active_pumps',
        name: 'Active Pumps',
        description: 'Currently active vs idle pumps',
        dataType: MetricType.Hero,
        granularity: Granularity.Global,
        preferredFocus: ChartFocus.Comparison,
        hasHierarchy: true,
        unit: '#'
      }
    ],
    data: {
      flow_rate: generateTimeSeries(24, 450, 50),
      pressure_distribution: [
        { name: 'Low (<30)', value: 15 },
        { name: 'Optimal (30-50)', value: 60 },
        { name: 'High (>50)', value: 25 },
      ],
      active_pumps: [
        { name: 'Active', value: 42 },
        { name: 'Idle', value: 12 },
        { name: 'Maintenance', value: 4 },
      ]
    }
  }
];
