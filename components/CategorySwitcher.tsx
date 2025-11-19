import React from 'react';
import { CategoryData } from '../types';

interface Props {
  categories: CategoryData[];
  activeId: string;
  onSelect: (id: string) => void;
}

const CategorySwitcher: React.FC<Props> = ({ categories, activeId, onSelect }) => {
  return (
    <div className="flex space-x-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
      {/* Favorites Button */}
      <button
        onClick={() => onSelect('favorites')}
        className={`
          flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 border
          whitespace-nowrap
          ${activeId === 'favorites'
            ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-200 shadow-lg shadow-yellow-900/20 scale-105'
            : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
          }
        `}
      >
        <span className="mr-2 text-lg">⭐</span>
        Favorites
      </button>

      {categories.map((cat) => {
        const isActive = cat.id === activeId;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`
              flex items-center px-4 py-3 rounded-xl font-medium transition-all duration-300 border
              whitespace-nowrap
              ${isActive 
                ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-900/50 scale-105' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750 hover:text-slate-200'
              }
            `}
          >
            <span className="mr-2 text-lg">{cat.icon}</span>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategorySwitcher;