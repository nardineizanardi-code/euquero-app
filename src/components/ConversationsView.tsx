import React, { useState } from 'react';
import { MessageSquare, Sparkles, Phone, ArrowRight, CheckCircle2, Clock, Zap, Layers } from 'lucide-react';
import { MatchResult, ChatMessage, ListingItem } from '../types';
import { MatchCard } from './MatchCard';

interface ConversationsViewProps {
  matches: MatchResult[];
  messages: ChatMessage[];
  onOpenChat: (match: MatchResult) => void;
  onOpenWizard: (intent: 'buy' | 'sell') => void;
  onViewProduct?: (item: ListingItem) => void;
}

export const ConversationsView: React.FC<ConversationsViewProps> = ({
  matches,
  messages,
  onOpenChat,
  onOpenWizard,
  onViewProduct,
}) => {
  const [activeTab, setActiveTab] = useState<'matches' | 'conversas'>('matches');

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-display text-slate-900 tracking-tight">
            Central de Matches & Negociações
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Cruzamento automático de compatibilidade entre quem quer comprar e quem quer vender.
          </p>
        </div>

        {/* Abas de Navegação */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'matches'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            <span>Cards de Match ({matches.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('conversas')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'conversas'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
            <span>Conversas Ativas</span>
          </button>
        </div>
      </div>

      {/* ABA 1: CARDS DE MATCH (EXATO WIREFRAME ASCII) */}
      {activeTab === 'matches' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Classificação automática por afinidade técnica e financeira</span>
            <span>{matches.length} oportunidades encontradas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchCard
                key={match.id}
                match={match}
                onViewPhotosAndVideo={(item) => {
                  if (onViewProduct) {
                    onViewProduct(item);
                  } else {
                    onOpenChat(match);
                  }
                }}
                onOpenChat={onOpenChat}
              />
            ))}
          </div>
        </div>
      )}

      {/* ABA 2: CONVERSAS EM ANDAMENTO */}
      {activeTab === 'conversas' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => {
            const buyer = match.buyerDemand;
            const seller = match.sellerListing;
            const matchMsgs = messages.filter((m) => m.matchId === match.id);
            const lastMsg = matchMsgs[matchMsgs.length - 1];

            return (
              <div
                key={match.id}
                className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {match.score}% Compatibilidade
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lastMsg ? lastMsg.timestamp : 'Nova conexão'}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1 mb-1">
                    {seller.subcategoryType} ({seller.brand})
                  </h3>

                  <p className="text-xs text-slate-500 mb-3 line-clamp-2">
                    <span className="font-semibold text-slate-700">Comprador:</span> {buyer.userName} ({buyer.locationCity})<br/>
                    <span className="font-semibold text-slate-700">Vendedor:</span> {seller.userName} ({seller.locationCity})
                  </p>

                  {lastMsg ? (
                    <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs text-slate-600 line-clamp-2 italic mb-3">
                      "{lastMsg.text}"
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-800 mb-3">
                      Pronto para negociação direta.
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs font-mono font-bold text-slate-900 tabular-nums">
                    R$ {seller.price.toLocaleString('pt-BR')}
                  </div>
                  <button
                    onClick={() => onOpenChat(match)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Abrir Chat</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
