import React from 'react';
import { ArrowRight, Sparkles, PlusCircle, Search, Tag } from 'lucide-react';

interface HeroProps {
  onOpenWizard: (intent: 'buy' | 'sell') => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenWizard }) => {
  return (
    <div className="w-full pt-4 pb-2 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* 2 CARDS GRANDES (BORDA 24PX) - FLUXO PRINCIPAL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        
        {/* CARD 1: QUERO COMPRAR (CARD VERDE ESCURO - PROCURA ATIVA - SEM FOTO) */}
        <button
          type="button"
          onClick={() => onOpenWizard('buy')}
          className="group relative p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-[#00875A] to-[#006644] text-white shadow-lg hover:shadow-2xl hover:shadow-emerald-900/30 active:scale-[0.99] transition-all duration-300 text-left overflow-hidden cursor-pointer border border-emerald-400/30 flex flex-col justify-between min-h-[185px] sm:min-h-[210px]"
        >
          {/* Brilho orgânico e silhueta no fundo */}
          <div className="absolute -right-6 -bottom-6 w-48 h-48 rounded-full bg-white/10 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          
          <div className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-white shadow-sm group-hover:scale-110 transition-transform">
            <Search className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-emerald-100 text-xs font-black uppercase tracking-wider mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" /> PROCURA ATIVA · 100% GRÁTIS
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
              QUERO COMPRAR (Grátis)
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/95 mt-1.5 max-w-sm leading-snug font-medium">
              Comprador NÃO paga nada. Diga o que procura e acesse vídeos verificados liberados direto no WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-white pt-4 mt-2 border-t border-emerald-400/40">
            <span>Iniciar Busca Guiada (Grátis)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

        {/* CARD 2: QUERO VENDER (CARD PRETO / LARANJA - ANÚNCIO RÁPIDO - COM FOTO) */}
        <button
          type="button"
          onClick={() => onOpenWizard('sell')}
          className="group relative p-6 sm:p-8 rounded-[24px] bg-gradient-to-br from-[#0F172A] to-[#020617] text-white shadow-lg hover:shadow-2xl hover:shadow-slate-950/40 active:scale-[0.99] transition-all duration-300 text-left overflow-hidden cursor-pointer border border-slate-800 flex flex-col justify-between min-h-[185px] sm:min-h-[210px]"
        >
          {/* Brilho laranja sutil */}
          <div className="absolute -right-6 -bottom-6 w-48 h-48 rounded-full bg-[#FF6B00]/15 blur-2xl group-hover:scale-125 transition-transform duration-500" />
          
          <div className="absolute top-5 right-5 w-12 h-12 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
            <Tag className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-[#FF6B00] border border-orange-500/30 text-xs font-black uppercase tracking-wider mb-2.5">
              <PlusCircle className="w-3.5 h-3.5" /> FREEMIUM · VÍDEO VERIFICADO
            </span>
            <h2 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white leading-tight">
              QUERO VENDER (Taxa R$ 19,90)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-sm leading-snug font-medium">
              1 anúncio grátis (4 fotos) ou taxa única de R$ 19,90 para vídeo verificado, 12 fotos e selo oficial.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#FF6B00] pt-4 mt-2 border-t border-slate-800/80">
            <span>Anunciar Meu Ativo (Taxa R$ 19,90)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </div>
        </button>

      </div>
    </div>
  );
};
