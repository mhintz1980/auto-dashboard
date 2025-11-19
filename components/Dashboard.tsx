import React, { useState, useEffect, useMemo } from 'react';
import { DASHBOARD_DATA } from '../data/mockData';
import CategorySwitcher from './CategorySwitcher';
import SmartChart from './charts/SmartChart';
import { recommendChartType } from '../utils/chartRecommender';
import { analyzeDashboardData, generateStrategicPlan } from '../services/geminiService';
import { MetricMetadata } from '../types';

const FAVORITES_ID = 'favorites';

const Dashboard: React.FC = () => {
  const [activeCategoryId, setActiveCategoryId] = useState(DASHBOARD_DATA[0].id);
  
  // Initialize favorites from localStorage
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dashboard_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [insight, setInsight] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  
  // Persist favorites
  useEffect(() => {
    localStorage.setItem('dashboard_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const isFavoritesView = activeCategoryId === FAVORITES_ID;

  const activeCategory = useMemo(() => 
    DASHBOARD_DATA.find(c => c.id === activeCategoryId) || DASHBOARD_DATA[0], 
    [activeCategoryId]
  );

  // Gather favorite items across all categories
  const favoriteItems = useMemo(() => {
    if (!isFavoritesView) return [];
    const items: { metric: MetricMetadata, data: any[], categoryName: string }[] = [];
    
    DASHBOARD_DATA.forEach(cat => {
      cat.metrics.forEach(metric => {
        if (favorites.includes(metric.id)) {
          items.push({
            metric,
            data: cat.data[metric.id],
            categoryName: cat.name
          });
        }
      });
    });
    return items;
  }, [isFavoritesView, favorites]);

  // Reset insights when category changes
  useEffect(() => {
    setInsight(null);
    setStrategy(null);
  }, [activeCategoryId]);

  const toggleFavorite = (metricId: string) => {
    setFavorites(prev => 
      prev.includes(metricId) ? prev.filter(id => id !== metricId) : [...prev, metricId]
    );
  };

  const handleDrillDown = (metric: MetricMetadata, dataPoint: any) => {
    if (metric.hasHierarchy) {
      alert(`Drilling down into ${metric.name} -> ${dataPoint.name || 'Selection'}. (Feature simulated: Would load sub-data here)`);
    }
  };

  const fetchInsight = async () => {
    if (!process.env.API_KEY) {
      alert("Please provide a Gemini API Key in the environment variables to use AI features.");
      return;
    }
    setIsAnalyzing(true);
    const result = await analyzeDashboardData(activeCategory);
    setInsight(result);
    setIsAnalyzing(false);
  };

  const fetchStrategy = async () => {
    if (!process.env.API_KEY) {
       alert("Please provide a Gemini API Key.");
       return;
    }
    setIsThinking(true);
    const result = await generateStrategicPlan(activeCategory);
    setStrategy(result);
    setIsThinking(false);
  };

  const renderChartCard = (metric: MetricMetadata, data: any[], categoryName?: string) => {
    const chartConfig = recommendChartType(metric);
    const isFavorite = favorites.includes(metric.id);
    const colSpanClass = metric.dataType === 'hero' ? 'md:col-span-2' : '';

    return (
      <div 
        key={metric.id} 
        className={`bg-slate-800 border border-slate-700 rounded-2xl p-5 shadow-xl flex flex-col h-[400px] ${colSpanClass} transition-all hover:border-slate-600`}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              {metric.name}
              {metric.hasHierarchy && (
                 <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">Drill-down</span>
              )}
            </h3>
            <p className="text-sm text-slate-400">
              {categoryName ? `${categoryName} • ` : ''}{metric.description}
            </p>
          </div>
          <button 
            onClick={() => toggleFavorite(metric.id)}
            className={`text-2xl transition-transform hover:scale-110 active:scale-90 ${isFavorite ? 'text-yellow-400' : 'text-slate-600 hover:text-slate-400'}`}
            title="Toggle Favorite"
          >
            {isFavorite ? '★' : '☆'}
          </button>
        </div>
        
        <div className="flex-1 min-h-0 w-full relative">
          <SmartChart 
            config={chartConfig} 
            data={data || []} 
            onDrillDown={(d) => handleDrillDown(metric, d)}
          />
        </div>
        
        <div className="mt-2 flex justify-between text-xs text-slate-500">
           <span>Focus: {metric.preferredFocus}</span>
           <span>Granularity: {metric.granularity}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
              Auto-Recommend Dashboard
            </h1>
            <p className="text-slate-400 mt-1">
              AI-Powered Analytics • {isFavoritesView ? 'My Favorites' : `${activeCategory.name} View`}
            </p>
          </div>
          
          <div className="flex space-x-3">
             <button 
                onClick={fetchInsight}
                disabled={isAnalyzing || isFavoritesView}
                className={`flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isFavoritesView ? "Switch to a specific category for AI insights" : "Get fast insights"}
             >
                {isAnalyzing ? (
                  <span className="animate-pulse">Analyzing...</span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    Fast Insights
                  </>
                )}
             </button>
             <button 
                onClick={fetchStrategy}
                disabled={isThinking || isFavoritesView}
                className={`flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isFavoritesView ? "Switch to a specific category for strategic planning" : "Get deep strategy"}
             >
                {isThinking ? (
                  <span className="animate-pulse">Thinking...</span>
                ) : (
                  <>
                     <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    Deep Dive Strategy
                  </>
                )}
             </button>
          </div>
        </header>

        {/* Category Nav */}
        <CategorySwitcher 
          categories={DASHBOARD_DATA}
          activeId={activeCategoryId}
          onSelect={setActiveCategoryId}
        />

        {/* AI Output Panel */}
        {(insight || strategy) && !isFavoritesView && (
          <div className="mb-8 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 animate-fadeIn">
             {insight && (
               <div className="mb-4">
                 <h3 className="text-emerald-400 font-bold mb-2 flex items-center">
                   <span className="text-xl mr-2">⚡</span> Flash Insights
                 </h3>
                 <div className="prose prose-invert prose-sm max-w-none">
                   <p>{insight}</p>
                 </div>
               </div>
             )}
             {strategy && (
               <div className="pt-4 border-t border-slate-700">
                 <h3 className="text-indigo-400 font-bold mb-2 flex items-center">
                   <span className="text-xl mr-2">🧠</span> Strategic Deep Dive
                 </h3>
                 <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
                   {strategy}
                 </div>
               </div>
             )}
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isFavoritesView ? (
             favoriteItems.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500">
                 <div className="text-6xl mb-4 opacity-50">⭐</div>
                 <p className="text-xl font-medium">No favorites yet</p>
                 <p className="text-sm mt-2 max-w-md text-center">Star your most important charts in other categories to see them all here at a glance.</p>
               </div>
             ) : (
               favoriteItems.map(({ metric, data, categoryName }) => 
                 renderChartCard(metric, data, categoryName)
               )
             )
          ) : (
             activeCategory.metrics.map((metric) => 
               renderChartCard(metric, activeCategory.data[metric.id])
             )
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;