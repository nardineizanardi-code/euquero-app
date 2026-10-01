import React from 'react';
import { CATEGORY_CHIPS } from '../data/categories';

interface CategoryChipsProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  categoryCounts?: Record<string, number>;
}

export const CategoryCarousel: React.FC<CategoryChipsProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts = {}
}) => {
  return (
    <div className="w-full py-2">
      <div className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar py-1 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto scroll-smooth">
        {/* As 4 Categorias Oficiais em Chips Grandes com Ícones */}
        {CATEGORY_CHIPS.map((chip) => {
          const isSelected = selectedCategory === chip.id;
          const count = categoryCounts[chip.id];

          return (
            <button
              key={chip.id}
              type="button"
              onClick={() => onSelectCategory(chip.id)}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border-2 select-none shadow-xs active:scale-95 ${
                isSelected
                  ? 'bg-[#0F172A] text-white border-[#FF6B00] shadow-md ring-4 ring-orange-500/20 scale-[1.03]'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 hover:text-slate-900'
              }`}
            >
              <span className="text-base sm:text-lg" role="img" aria-label={chip.name}>
                {chip.emoji}
              </span>
              <span className="font-display tracking-tight">{chip.name}</span>
              {typeof count === 'number' && (
                <span
                  className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                    isSelected
                      ? 'bg-[#FF6B00] text-white'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
