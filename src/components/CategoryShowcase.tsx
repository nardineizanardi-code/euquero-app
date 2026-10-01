import React from 'react';
import { Wrench, Truck, Building2, Tractor, Cpu, ArrowRight, Plus } from 'lucide-react';
import { CATEGORIES } from '../data/categories';

interface CategoryShowcaseProps {
  onSelectCategoryWizard: (categoryId: string, intent: 'buy' | 'sell') => void;
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({
  onSelectCategoryWizard
}) => {
  return (
    <section className="py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
              Setores Atendidos
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
              Categorias em Destaque no Eu Quero
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mt-2 md:mt-0">
            Seja uma escavadeira usada, um caminhão para transportes ou um galpão logístico, o fluxo inteligente guia sua escolha passo a passo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {CATEGORIES.slice(0, 3).map((cat) => (
            <div
              key={cat.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
            >
              {/* Category Image */}
              <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                {cat.image ? (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <Wrench className="w-12 h-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-lg font-bold font-display text-white drop-shadow-sm">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-200 line-clamp-1 drop-shadow-sm">
                    {cat.description}
                  </p>
                </div>
              </div>

              {/* Subcategories list */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                <div className="flex flex-wrap gap-1.5">
                  {cat.types.slice(0, 5).map((type) => (
                    <span
                      key={type}
                      className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {/* Quick Dual Actions */}
                <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onSelectCategoryWizard(cat.id, 'buy')}
                    className="py-2 px-2.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Quero Comprar</span>
                  </button>

                  <button
                    onClick={() => onSelectCategoryWizard(cat.id, 'sell')}
                    className="py-2 px-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <span>Quero Vender</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
