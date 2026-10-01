import React, { useState } from 'react';
import { 
  Sparkles, CheckCircle2, Phone, MessageSquare, ArrowRight, 
  MapPin, ShieldCheck, UserCheck, Clock, Share2 
} from 'lucide-react';
import { MatchResult, ListingItem } from '../types';

interface QualifiedLeadCardProps {
  /** Dados completos do match cruzado nos bastidores */
  match?: MatchResult;
  /** Nome ou empresa do comprador */
  buyerName?: string;
  /** Resumo textual da busca: ex "Retroescavadeira JCB Usada" */
  buyerSearchSummary?: string;
  /** Orçamento máximo que o comprador informou no Passo 4 */
  buyerMaxBudget: number;
  /** Preço anunciado pelo vendedor */
  sellerPrice: number;
  /** Porcentagem calculada pelo algoritmo de match: ex 95 */
  compatibilityScore?: number;
  /** Localização do comprador */
  buyerLocation?: string;
  /** Callback para liberar WhatsApp diretamente */
  onReleaseWhatsApp?: () => void;
  /** Callback para abrir a sala de negociação interna no App */
  onStartInAppChat?: () => void;
}

/**
 * QualifiedLeadCard
 * 
 * Componente de Notificação / Lead Qualificado entregue ao Vendedor
 * quando o algoritmo de backend detecta compatibilidade entre o anúncio
 * de venda e a demanda de um comprador.
 */
export const QualifiedLeadCard: React.FC<QualifiedLeadCardProps> = ({
  match,
  buyerName = 'Carlos Mendes',
  buyerSearchSummary = 'Retroescavadeira JCB Usada',
  buyerMaxBudget = 200000,
  sellerPrice = 190000,
  compatibilityScore = 95,
  buyerLocation = 'Paulínia, SP',
  onReleaseWhatsApp,
  onStartInAppChat,
}) => {
  const [isWhatsAppReleased, setIsWhatsAppReleased] = useState(false);

  // Calcula a folga financeira positiva (preço do vendedor dentro do orçamento)
  const budgetMargin = buyerMaxBudget - sellerPrice;
  const isBudgetAdequate = budgetMargin >= 0;

  const handleWhatsAppClick = () => {
    setIsWhatsAppReleased(true);
    if (onReleaseWhatsApp) {
      onReleaseWhatsApp();
    }
  };

  return (
    <div className="relative bg-white rounded-3xl border border-orange-200/90 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
      
      {/* Barra superior de destaque com gradiente de alta energia */}
      <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500" />

      <div className="p-5 sm:p-6 space-y-4">
        
        {/* Cabeçalho do Card com Título e Selo de Compatibilidade */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 block">
                Match em Segundo Plano
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-display leading-tight">
                Novo interessado compatível!
              </h3>
            </div>
          </div>

          {/* Selo Visual: "Compatibilidade: 95%" */}
          <div className="self-start sm:self-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300/80 shadow-2xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
              <span>Compatibilidade: {compatibilityScore}%</span>
            </span>
          </div>
        </div>

        {/* Resumo da Busca do Comprador */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Demanda Qualificada
          </span>
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm sm:text-base font-extrabold text-slate-900">
              Busca: <span className="text-slate-800">{buyerSearchSummary}</span>
            </p>
            <span className="text-xs text-slate-500 font-medium flex items-center gap-1 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{buyerLocation}</span>
            </span>
          </div>
          <span className="text-xs text-slate-500 block">
            Comprador: <strong>{buyerName}</strong> · Intenção de compra imediata
          </span>
        </div>

        {/* Cruzamento Financeiro: Orçamento do Comprador vs Seu Preço */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100">
          {/* Orçamento Comprador */}
          <div className="border-r border-orange-200/60 pr-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
              Orçamento do Comprador
            </span>
            <span className="text-base sm:text-xl font-black text-emerald-700 font-mono tabular-nums">
              Até R$ {buyerMaxBudget.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
              {isBudgetAdequate ? '✓ Cobre o seu valor pedido' : 'Proposta próxima'}
            </span>
          </div>

          {/* Seu Preço */}
          <div className="pl-2">
            <span className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
              Seu Preço Anunciado
            </span>
            <span className="text-base sm:text-xl font-black text-slate-900 font-mono tabular-nums">
              R$ {sellerPrice.toLocaleString('pt-BR')}
            </span>
            <span className="text-[10px] text-slate-500 block mt-0.5">
              Margem: +R$ {budgetMargin.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* Ações no Card */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
          {/* Botão Principal (Laranja): "Liberar meu WhatsApp" */}
          <button
            type="button"
            onClick={handleWhatsAppClick}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer ${
              isWhatsAppReleased
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
            }`}
          >
            <Phone className="w-4 h-4" />
            <span>{isWhatsAppReleased ? 'WhatsApp Liberado ✓' : 'Liberar meu WhatsApp'}</span>
          </button>

          {/* Botão Secundário (Outline): "Iniciar Chat no App" */}
          <button
            type="button"
            onClick={onStartInAppChat}
            className="flex-1 py-3 px-4 rounded-xl border-2 border-slate-300 hover:border-slate-800 hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer bg-white"
          >
            <MessageSquare className="w-4 h-4 text-slate-600" />
            <span>Iniciar Chat no App</span>
          </button>
        </div>

        {/* Rodapé Seguro */}
        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
          <span className="flex items-center gap-1 text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Contato protegido pela plataforma
          </span>
          <span className="font-mono">Notificado agora</span>
        </div>

      </div>
    </div>
  );
};
