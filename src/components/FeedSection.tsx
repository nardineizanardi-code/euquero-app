import React, { useState } from 'react';
import { Search, Filter, Plus, ArrowUpDown, Sparkles } from 'lucide-react';
import { ListingItem, IntentType } from '../types';
import { ListingCard } from './ListingCard';
import { CATEGORIES, STATES_BR } from '../data/categories';

interface FeedSectionProps {
  intentFilter: IntentType | 'all';
  setIntentFilter: (intent: IntentType | 'all') => void;
  items: ListingItem[];
  onMatchAction: (item: ListingItem) => void;
  onQuickWhatsApp: (item: ListingItem) => void;
  onOpenWizard: (intent: 'buy' | 'sell') => void;
}

export const FeedSection: React.FC<FeedSectionProps> = ({
  intentFilter,
  setIntentFilter,
  items,
  onMatchAction,
  onQuickWhatsApp,
  onOpenWizard
}) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc'>('recent');

  const filteredItems = items
    .filter((item) => {
      if (intentFilter !== 'all' && item.intent !== intentFilter) return false;
      if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
      if (selectedCondition !== 'all' && item.condition !== selectedCondition) return false;
      if (selectedState !== 'all' && item.locationState !== selectedState) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const str = `${item.title} ${item.subcategoryType} ${item.brand || ''} ${item.model || ''} ${item.locationCity}`.toLowerCase();
        if (!str.includes(q)) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'price_asc') return a.price - b.price;
      if (sortBy === 'price_desc') return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Header of the Feed */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            {intentFilter === 'buy'
              ? 'Vitrine de Demandas: Quem Quer Comprar'
              : intentFilter === 'sell'
              ? 'Vitrine de Ativos: Quem Quer Vender'
              : 'Mercado Integrado: Todas as Demandas & Ofertas'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {intentFilter === 'buy'
              ? 'Veja o que os compradores estão buscando e ofereça sua máquina ou ativo.'
              : 'Equipamentos, veículos e imóveis disponíveis para pronta aquisição e negociação.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenWizard(intentFilter === 'sell' ? 'sell' : 'buy')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-[0.98] ${
              intentFilter === 'buy'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>
              {intentFilter === 'buy' ? 'Cadastrar Minha Procura' : 'Anunciar para Venda'}
            </span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
        {/* Main Intent Filter Segmented Control */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setIntentFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                intentFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todos ({items.length})
            </button>
            <button
              onClick={() => setIntentFilter('buy')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                intentFilter === 'buy'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quero Comprar ({items.filter((i) => i.intent === 'buy').length})
            </button>
            <button
              onClick={() => setIntentFilter('sell')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer whitespace-nowrap ${
                intentFilter === 'sell'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Quero Vender ({items.filter((i) => i.intent === 'sell').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Ordenar:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="recent">Mais recentes</option>
              <option value="price_asc">Menor valor</option>
              <option value="price_desc">Maior valor</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row: Search, Category, Condition, State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar modelo, tipo, marca..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Todas as Categorias</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Condição: Todas</option>
              <option value="usado">Somente Usadas / Seminovas</option>
              <option value="novo">Somente Novas / Zero</option>
            </select>
          </div>

          <div>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700"
            >
              <option value="all">Estado: Brasil Inteiro</option>
              {STATES_BR.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Listing Cards */}
      {filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-800">Nenhum registro encontrado com estes filtros.</p>
          <p className="text-xs text-slate-500 mt-1">Limpe os filtros ou seja o primeiro a cadastrar nesta categoria!</p>
          <button
            onClick={() => onOpenWizard('buy')}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold"
          >
            Cadastrar Intenção de Compra
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <ListingCard
              key={item.id}
              item={item}
              onMatchAction={onMatchAction}
              onQuickWhatsApp={onQuickWhatsApp}
            />
          ))}
        </div>
      )}
    </div>
  );
};
