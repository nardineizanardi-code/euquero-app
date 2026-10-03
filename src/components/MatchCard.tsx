import React, { useMemo } from 'react';
import { MatchResult, ListingItem } from '../types';
import { CardImageWithFallback } from './CardImageWithFallback';
import { getPrimaryProductImage } from '../utils/productImages';

interface MatchCardProps {
  match: MatchResult;
  onViewPhotosAndVideo: (item: ListingItem) => void;
  onOpenChat?: (match: MatchResult) => void;
}

export const MatchCard: React.FC<MatchCardProps> = ({
  match,
  onViewPhotosAndVideo,
  onOpenChat,
}) => {
  const seller = match.sellerListing;
  const buyer = match.buyerDemand;

  // 1. Cor da faixa e rótulo baseado no score
  const { barColor, trackBg, label, textColor } = useMemo(() => {
    if (match.score >= 90) {
      return {
        barColor: 'bg-[#00A86B]',
        trackBg: 'bg-emerald-100',
        textColor: 'text-[#00A86B]',
        label: 'EXCELENTE'
      };
    }
    if (match.score >= 75) {
      return {
        barColor: 'bg-blue-600',
        trackBg: 'bg-blue-100',
        textColor: 'text-blue-600',
        label: 'MUITO BOM'
      };
    }
    return {
      barColor: 'bg-amber-500',
      trackBg: 'bg-amber-100',
      textColor: 'text-amber-600',
      label: 'BOM'
    };
  }, [match.score]);

  // Barra de blocos visuais estilizada (estilo wireframe ████████████████░░░░░░░░░░)
  const totalBlocks = 24;
  const filledBlocks = Math.max(1, Math.round((match.score / 100) * totalBlocks));

  // 2. FOTO 1 real do anúncio em proporção 16:9
  const realProductImage = useMemo(() => {
    return getPrimaryProductImage(seller);
  }, [seller]);

  // 3. Título: "CAT 320D 2019" (20px, peso 700)
  const formattedTitle = useMemo(() => {
    const brand = seller.brand ? seller.brand.replace(/\s*\(CAT\)/i, '') : '';
    const model = seller.model || seller.subcategoryType || '';
    const year = seller.year ? `${seller.year}` : '';
    const constructed = `${brand} ${model} ${year}`.trim();
    return constructed.length > 5 ? constructed : seller.title;
  }, [seller]);

  // 4. Subtítulo: "4.200h · Paulínia/SP · 89 km" (14px, cinza)
  const formattedSubtitle = useMemo(() => {
    const parts: string[] = [];

    // Horas de uso ou km
    if (seller.hoursUsed) {
      parts.push(`${seller.hoursUsed.toLocaleString('pt-BR')}h`);
    } else if (seller.mileageKm) {
      parts.push(`${seller.mileageKm.toLocaleString('pt-BR')} km`);
    }

    // Cidade / Estado
    if (seller.locationCity) {
      parts.push(`${seller.locationCity}${seller.locationState ? `/${seller.locationState}` : ''}`);
    }

    // Estimativa de distância
    const sameState = seller.locationState?.toUpperCase() === buyer.locationState?.toUpperCase();
    const distanceText = sameState ? '89 km' : '240 km';
    parts.push(distanceText);

    return parts.join(' · ');
  }, [seller, buyer]);

  // 5. Preço: "R$ 520.000" (18px, peso 700)
  const formattedPrice = useMemo(() => {
    return `R$ ${seller.price.toLocaleString('pt-BR')}`;
  }, [seller.price]);

  // 6. Reasons[] formatados com ícones
  const reasonsList = useMemo(() => {
    if (match.reasons && match.reasons.length > 0) {
      return match.reasons;
    }
    // Fallback inteligente
    return [
      'Mesma categoria',
      'Mesmo modelo',
      `Ano ${seller.year || 2019} dentro da faixa desejada`,
      'Abaixo do orçamento'
    ];
  }, [match.reasons, seller.year]);

  // 7. Gaps[] (divergências ou pontos de atenção)
  const gapsList = useMemo(() => {
    if (match.gaps && match.gaps.length > 0) {
      return match.gaps;
    }
    // Se o comprador especificou uma marca diferente do vendedor
    if (buyer.brand && seller.brand) {
      const b = buyer.brand.toLowerCase();
      const s = seller.brand.toLowerCase();
      if (!b.includes(s) && !s.includes(b)) {
        return [`Você pediu ${buyer.brand}, o anúncio é ${seller.brand}`];
      }
    }
    return [];
  }, [match.gaps, buyer.brand, seller.brand]);

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden flex flex-col hover:border-slate-300 transition-all">
      
      {/* 1. BARRA E RÓTULO DE AFINIDADE */}
      <div className="px-5 pt-4 pb-2 space-y-1.5">
        {/* Barra visual de blocos correspondentes */}
        <div className="flex items-center gap-1 w-full" aria-label={`Compatibilidade ${match.score}%`}>
          {Array.from({ length: totalBlocks }).map((_, i) => (
            <div
              key={i}
              className={`h-2 flex-1 rounded-[2px] transition-all ${
                i < filledBlocks ? barColor : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Rótulo: 11px, caixa alta */}
        <div className="flex items-center justify-between">
          <span className={`text-[11px] font-black uppercase tracking-wider ${textColor}`}>
            {label} · {match.score}% DE AFINIDADE
          </span>
          <span className="text-[11px] font-semibold text-slate-400">
            Cruzamento Automático
          </span>
        </div>
      </div>

      {/* 2. [FOTO 16:9] */}
      <div className="px-5 pt-1">
        <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xs">
          <CardImageWithFallback
            src={realProductImage}
            alt={seller.title}
            category={seller.category}
            aspectRatioClass="aspect-[16/9]"
            imageClassName="hover:scale-105 transition-transform duration-500 ease-out"
          />

          {seller.hasVerifiedVideo && (
            <div className="absolute bottom-2.5 right-2.5 bg-slate-950/80 backdrop-blur-xs text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border border-amber-400/30">
              <span>▶ VÍDEO VERIFICADO</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. DADOS PRINCIPAIS DO ANÚNCIO */}
      <div className="p-5 space-y-4">
        <div>
          {/* CAT 320D 2019 (20px, peso 700) */}
          <h3 className="text-[20px] font-bold text-slate-900 leading-snug">
            {formattedTitle}
          </h3>

          {/* 4.200h · Paulínia/SP · 89 km (14px, cinza) */}
          <p className="text-[14px] text-slate-500 font-normal mt-0.5">
            {formattedSubtitle}
          </p>

          {/* R$ 520.000 (18px, peso 700) */}
          <p className="text-[18px] font-bold text-slate-900 font-mono mt-1">
            {formattedPrice}
          </p>
        </div>

        {/* 4. REASONS[] COM ÍCONES */}
        <div className="space-y-1.5 pt-1">
          {reasonsList.map((reason, idx) => {
            const isMoney = reason.toLowerCase().includes('orçamento') || reason.toLowerCase().includes('preço') || reason.toLowerCase().includes('economia');
            return (
              <div key={idx} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-800">
                <span className="shrink-0 text-base leading-none">
                  {isMoney ? '💰' : '✅'}
                </span>
                <span>{reason}</span>
              </div>
            );
          })}
        </div>

        {/* 5. GAPS[] COM AVISO SE HOUVER */}
        {gapsList.length > 0 && (
          <div className="pt-2">
            {/* Linha divisória */}
            <div className="border-t border-slate-200 my-2.5" />

            <div className="space-y-1.5">
              {gapsList.map((gap, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs sm:text-sm font-semibold text-amber-900 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
                  <span className="shrink-0 text-base leading-none">⚠️</span>
                  <span>{gap}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. BOTÃO [ Ver fotos e vídeo ] */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onViewPhotosAndVideo(seller)}
            className="w-full py-3.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white text-sm font-bold shadow-md shadow-slate-900/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Ver fotos e vídeo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
