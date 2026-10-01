import React, { useState } from 'react';
import { 
  Sparkles, MessageSquare, ArrowRight, ExternalLink, CheckCircle, 
  MapPin, Clock, Calendar, Check, Zap, Filter, Search 
} from 'lucide-react';
import { MatchResult, ListingItem } from '../types';

interface MatchRadarProps {
  matches: MatchResult[];
  onStartChat: (match: MatchResult) => void;
  onOpenWizard: (intent: 'buy' | 'sell') => void;
}

export const MatchRadar: React.FC<MatchRadarProps> = ({
  matches,
  onStartChat,
  onOpenWizard
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minScore, setMinScore] = useState<number>(60);

  const filteredMatches = matches.filter((m) => {
    if (selectedCategory !== 'all' && m.buyerDemand.category !== selectedCategory) {
      return false;
    }
    if (m.score < minScore) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const combined = `${m.buyerDemand.title} ${m.sellerListing.title} ${m.buyerDemand.subcategoryType} ${m.sellerListing.brand} ${m.buyerDemand.locationCity} ${m.sellerListing.locationCity}`.toLowerCase();
      if (!combined.includes(q)) return false;
    }
    return true;
  });

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (score >= 75) return 'text-blue-700 bg-blue-50 border-blue-200';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const handleWhatsAppContact = (match: MatchResult) => {
    const buyer = match.buyerDemand;
    const seller = match.sellerListing;
    const msg = encodeURIComponent(
      `Olá ${seller.userName}! Encontrei seu anúncio no Eu Quero: "${seller.title}" pelo valor de R$ ${seller.price.toLocaleString('pt-BR')}. Nosso perfil tem interesse e foi classificado com ${match.score}% de compatibilidade! Gostaria de mais detalhes sobre o equipamento.`
    );
    const cleanPhone = seller.userPhone.replace(/\D/g, '');
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Top Banner / Explanation */}
      <div className="p-6 rounded-2xl bg-slate-900 text-white border border-slate-800 shadow-sm relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-2">
            <Sparkles className="w-4 h-4" />
            <span>Sistema Inteligente de Cruzamento Automático</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white mb-2">
            Radar de Matches: Quem Quer Comprar & Quem Quer Vender
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed mb-4">
            Aqui o aplicativo chama automaticamente as duas pontas. Cruzamos especificações de marca, modelo, ano, horímetro e preço limite para viabilizar negócios diretos.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onOpenWizard('buy')}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              + Publicar Nova Demanda de Compra
            </button>
            <button
              onClick={() => onOpenWizard('sell')}
              className="px-4 py-2 rounded-lg bg-white hover:bg-slate-100 text-slate-900 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              + Publicar Novo Anúncio de Venda
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por máquina, marca ou cidade..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-900"
          />
        </div>

        {/* Categories segmented buttons */}
        <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todas as Categorias
          </button>
          <button
            onClick={() => setSelectedCategory('maquinas')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'maquinas'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Máquinas Pesadas
          </button>
          <button
            onClick={() => setSelectedCategory('veiculos')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'veiculos'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Veículos & Frotas
          </button>
          <button
            onClick={() => setSelectedCategory('imoveis')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedCategory === 'imoveis'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Imóveis Comerciais
          </button>
        </div>

        {/* Score filter */}
        <div className="flex items-center gap-2 text-xs text-slate-600 whitespace-nowrap">
          <span>Afinidade:</span>
          <select
            value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
          >
            <option value={60}>60%+ (Aceitável)</option>
            <option value={80}>80%+ (Alta Afinidade)</option>
            <option value={90}>90%+ (Match Quase Perfeito)</option>
          </select>
        </div>
      </div>

      {/* Matches List */}
      {filteredMatches.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Sparkles className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">Nenhum match com os filtros selecionados</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tente diminuir a nota de afinidade ou cadastre uma nova intenção de compra ou venda para gerar conexões instantâneas.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Mostrando {filteredMatches.length} cruzamentos entre compradores e vendedores</span>
            <span>Atualizado em tempo real</span>
          </div>

          {filteredMatches.map((match) => {
            const buyer = match.buyerDemand;
            const seller = match.sellerListing;
            const scoreClass = getScoreColor(match.score);

            return (
              <div
                key={match.id}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden hover:border-slate-300 transition-all"
              >
                {/* Match Header Bar */}
                <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border tabular-nums ${scoreClass}`}>
                      {match.score}% DE AFINIDADE
                    </span>
                    <span className="text-xs text-slate-600 font-medium">
                      Cruzamento perfeito de Demanda & Oferta
                    </span>
                  </div>

                  {/* Actions for this match */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleWhatsAppContact(match)}
                      className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>WhatsApp Direto</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onStartChat(match)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Conectar no Chat</span>
                    </button>
                  </div>
                </div>

                {/* Match Comparison Side-by-Side: Buyer vs Seller */}
                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                  
                  {/* Left Column: QUEM QUER COMPRAR */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                        Quem Quer Comprar (Demanda Ativa)
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2">
                        {buyer.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{buyer.userName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{buyer.userRole || 'Comprador Qualificado'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{buyer.locationCity}/{buyer.locationState}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-emerald-50/40 border border-emerald-100 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Equipamento/Ativo:</span>
                        <span className="font-semibold text-slate-900">{buyer.subcategoryType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Condição desejada:</span>
                        <span className="font-semibold text-slate-900 capitalize">
                          {buyer.condition} {buyer.yearMin ? `(${buyer.yearMin} a ${buyer.yearMax})` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Orçamento Limite:</span>
                        <span className="font-bold text-emerald-800 font-mono tabular-nums">
                          Até R$ {buyer.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{buyer.description}"
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-slate-200 -translate-x-1/2" />

                  {/* Right Column: QUEM QUER VENDER */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-900"></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                        Quem Quer Vender (Oferta Cadastrada)
                      </span>
                    </div>

                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-2">
                        {seller.title}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{seller.userName}</span>
                        <span aria-hidden="true">·</span>
                        <span>{seller.userRole || 'Proprietário'}</span>
                        <span aria-hidden="true">·</span>
                        <span>{seller.locationCity}/{seller.locationState}</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Equipamento/Ativo:</span>
                        <span className="font-semibold text-slate-900">{seller.subcategoryType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Ano / Horímetro:</span>
                        <span className="font-semibold text-slate-900 font-mono tabular-nums">
                          Ano {seller.year || 'Seminovo'} {seller.hoursUsed ? `· ${seller.hoursUsed}h` : ''}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Preço Pedido:</span>
                        <span className="font-bold text-slate-900 font-mono tabular-nums">
                          R$ {seller.price.toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      "{seller.description}"
                    </p>
                  </div>
                </div>

                {/* Reasons pill-free list with typographic bullet points */}
                <div className="px-5 py-3 bg-slate-50/50 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                  <span className="font-semibold text-slate-800">Critérios compatíveis:</span>
                  {match.reasons.map((r, i) => (
                    <span key={i} className="flex items-center gap-1.5 text-slate-600">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{r}</span>
                      {i < match.reasons.length - 1 && <span className="text-slate-300 ml-1">·</span>}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
