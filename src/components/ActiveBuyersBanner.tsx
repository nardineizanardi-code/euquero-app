import React, { useState, useEffect } from 'react';
import { Play } from 'lucide-react';

export interface ActiveBuyersStats {
  totalBuyers: number;
  linhaAmarela: number;
  agricola: number;
  youtubeVideos: number;
}

// ESTRATÉGIA DAS CAIXAS 101-110:
// base = 500 (fixo, escondido)
// real = contar pedidos reais cadastrados no QUERO COMPRAR (Grátis) do EloMatch
// totalMostrado = base + real
// Quando pedidosReais chegar em 500 (total 1000), remover base e mostrar só real
export const BASE_COMPRADORES_ESCONDIDO = 500;

export const calculateTotalShownBuyers = (realOrdersCount: number): number => {
  if (realOrdersCount >= 500) {
    return realOrdersCount;
  }
  return BASE_COMPRADORES_ESCONDIDO + realOrdersCount;
};

interface ActiveBuyersBannerProps {
  stats?: ActiveBuyersStats;
  onClickBuyers?: () => void;
  onClickYoutube?: () => void;
}

export const DEFAULT_ACTIVE_BUYERS_STATS: ActiveBuyersStats = {
  totalBuyers: 501, // Começa com 501: base 500 + 1 real (você: Carlos Mendes)
  linhaAmarela: 5,
  agricola: 4,
  youtubeVideos: 312,
};

export const ActiveBuyersBanner: React.FC<ActiveBuyersBannerProps> = ({
  stats = DEFAULT_ACTIVE_BUYERS_STATS,
  onClickBuyers,
  onClickYoutube,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(stats.totalBuyers);
  const [isBumping, setIsBumping] = useState<boolean>(false);

  React.useEffect(() => {
    if (stats.totalBuyers !== displayValue) {
      setIsBumping(true);
      const timer = setTimeout(() => {
        setDisplayValue(stats.totalBuyers);
        setIsBumping(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [stats.totalBuyers, displayValue]);

  const formattedBuyers = (isBumping ? stats.totalBuyers : displayValue).toLocaleString('pt-BR');

  return (
    <aside
      aria-label="Contador de compradores ativos e vídeos"
      className="w-full bg-[#0a0a0a] text-white border-y border-[#FF6B00]/40 shadow-[0_2px_18px_rgba(255,107,0,0.2)] select-none animate-subtle-blink overflow-x-auto scrollbar-none"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5">
        <div className="flex items-center justify-center flex-nowrap sm:flex-wrap gap-x-2 sm:gap-x-3 text-xs sm:text-sm font-semibold tracking-wide whitespace-nowrap min-w-max sm:min-w-0 mx-auto">
          
          {/* 🔥 HOJE: 1.247 COMPRADORES ATIVOS */}
          <button
            type="button"
            onClick={onClickBuyers}
            className="inline-flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer group"
            title="Ver compradores ativos"
          >
            <span className="text-base sm:text-lg animate-pulse" role="img" aria-label="Fogo">
              🔥
            </span>
            <span className="font-black text-[#FF6B00] uppercase tracking-wider text-xs sm:text-sm">
              HOJE:
            </span>
            <span className={`font-black text-[#FF6B00] text-sm sm:text-base font-mono underline decoration-[#FF6B00]/70 underline-offset-2 transition-all duration-300 ${
              isBumping ? 'scale-125 text-emerald-400 bg-orange-950/80 px-1 rounded' : ''
            }`}>
              {formattedBuyers}
            </span>
            <span className="font-black text-white uppercase text-xs sm:text-sm tracking-tight group-hover:text-orange-100">
              COMPRADORES ATIVOS
            </span>
            <span className="relative flex h-2 w-2 ml-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FF6B00]"></span>
            </span>
          </button>

          {/* Separador | */}
          <span className="text-[#FF6B00] font-black select-none opacity-80">|</span>

          {/* Linha Amarela 5 */}
          <div className="inline-flex items-center gap-1">
            <span className="text-white font-bold">Linha Amarela</span>
            <span className="font-black text-[#FF6B00] font-mono text-xs sm:text-sm bg-orange-950/70 border border-[#FF6B00]/40 px-1.5 py-0.5 rounded shadow-xs">
              {stats.linhaAmarela}
            </span>
          </div>

          {/* Separador | */}
          <span className="text-[#FF6B00] font-black select-none opacity-80">|</span>

          {/* Agrícola 4 */}
          <div className="inline-flex items-center gap-1">
            <span className="text-white font-bold">Agrícola</span>
            <span className="font-black text-[#FF6B00] font-mono text-xs sm:text-sm bg-orange-950/70 border border-[#FF6B00]/40 px-1.5 py-0.5 rounded shadow-xs">
              {stats.agricola}
            </span>
          </div>

          {/* Separador | */}
          <span className="text-[#FF6B00] font-black select-none opacity-80">|</span>

          {/* Vídeos no YouTube: 312 */}
          <button
            type="button"
            onClick={onClickYoutube}
            className="inline-flex items-center gap-1.5 hover:opacity-90 transition-all cursor-pointer group"
            title="Ver máquinas com vídeo no YouTube"
          >
            <span className="w-4 h-4 rounded bg-[#FF0000] flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
              <Play className="w-2.5 h-2.5 fill-white text-white translate-x-px" />
            </span>
            <span className="text-white font-bold group-hover:text-orange-100">
              Vídeos no YouTube:
            </span>
            <span className="font-black text-[#FF6B00] font-mono text-xs sm:text-sm bg-orange-950/70 border border-[#FF6B00]/40 px-1.5 py-0.5 rounded shadow-xs">
              {stats.youtubeVideos}
            </span>
          </button>

        </div>
      </div>
    </aside>
  );
};

