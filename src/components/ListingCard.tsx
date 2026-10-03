import React, { useState } from 'react';
import { 
  MapPin, Heart, MessageSquare, ArrowRight, Sparkles, 
  Crown, ShieldCheck 
} from 'lucide-react';
import { ListingItem } from '../types';
import { CardImageWithFallback } from './CardImageWithFallback';
import { BuyerMachineSearchIcon } from './BuyerMachineSearchIcon';
import { getPrimaryProductImage } from '../utils/productImages';

interface ListingCardProps {
  item: ListingItem;
  onMatchAction: (item: ListingItem) => void;
  onQuickWhatsApp?: (item: ListingItem) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({
  item,
  onMatchAction,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const isBuyer = item.intent === 'buy';

  const handleAction = () => {
    onMatchAction(item);
  };

  // Card COMPRO
  if (isBuyer) {
    return (
      <div
        onClick={handleAction}
        className="group bg-white rounded-[24px] border border-slate-200 hover:border-emerald-500 border-l-[6px] border-l-[#00A86B] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
      >
        <div>
          <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-emerald-50 via-teal-50/60 to-slate-100 flex items-center justify-center overflow-hidden border-b border-emerald-100/70">
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#00A86B_1px,transparent_1px)] [background-size:16px_16px]" />

            <div className="relative z-10 py-3 transform group-hover:scale-105 transition-transform duration-300">
              <BuyerMachineSearchIcon category={item.category} />
            </div>

            <div className="absolute top-3.5 left-3.5 z-20">
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-xs bg-[#00A86B] text-white">
                COMPRO
              </span>
            </div>

            <div className="absolute bottom-2.5 left-3.5 right-3.5 z-20 flex items-center justify-between text-xs font-semibold text-slate-700">
              <span className="bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-lg flex items-center gap-1 border border-slate-200/80 shadow-2xs">
                <MapPin className="w-3.5 h-3.5 text-[#00A86B] shrink-0" />
                <span className="truncate">{item.locationCity}, {item.locationState}</span>
              </span>
              <span className="bg-emerald-100 text-emerald-900 border border-emerald-200 px-2 py-0.5 rounded-md text-[10px] uppercase font-black">
                {item.condition === 'usado' ? 'Usado' : 'Novo'}
              </span>
            </div>
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A86B] uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Procura Ativa Verificada</span>
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#00A86B] transition-colors">
              {item.title}
            </h3>

            <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
              "{item.description}"
            </p>

            <div className="mt-3.5 pt-3 border-t border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Orçamento Disponível
              </span>
              <div className="flex items-baseline justify-between mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-[#00A86B] font-mono tabular-nums">
                  Até R$ {item.price.toLocaleString('pt-BR')}
                </span>
                {item.yearMin && item.yearMax && (
                  <span className="text-xs font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md font-mono">
                    Anos: {item.yearMin}–{item.yearMax}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 pt-0">
          <button
            type="button"
            onClick={handleAction}
            className="w-full py-3 px-4 rounded-xl bg-[#00A86B] hover:bg-emerald-600 active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Conectar no Chat</span>
            <ArrowRight className="w-4 h-4 ml-auto" />
          </button>
        </div>
      </div>
    );
  }

  // Card VENDO: Garante que a FOTO 1 que aparece no card é a mesma do og:image
  const realProductImage = getPrimaryProductImage(item);

  return (
    <div
      onClick={handleAction}
      className="group bg-white rounded-[24px] border border-slate-200 hover:border-orange-500 border-l-[6px] border-l-[#FF6B00] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F4F6]">
          <CardImageWithFallback
            src={realProductImage}
            alt={item.title}
            category={item.category}
            aspectRatioClass="aspect-[4/3]"
            imageClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none" />

          <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-1.5 flex-wrap max-w-[85%]">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-xs bg-[#FF6B00] text-white">
              VENDO
            </span>

            {(item.badge === 'premium' || item.tier === 'premium_15' || item.tier === 'premium_25' || item.tier === 'premium_20' || item.tier === 'premium_10') && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-xs bg-amber-400 text-amber-950 flex items-center gap-1 border border-amber-300">
                <Crown className="w-3 h-3 fill-amber-950 text-amber-950" />
                <span>PREMIUM</span>
              </span>
            )}

            {(item.badge === 'verified' || item.tier === 'dealer' || item.tier === 'dealer_10' || item.tier === 'dealer_30') && (
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider uppercase shadow-xs bg-blue-600 text-white flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                <span>VERIFICADO</span>
              </span>
            )}

            {(item.highlightDays && item.highlightDays > 0) || item.tier === 'premium_25' || item.tier === 'premium_20' ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-slate-900/90 text-amber-300 backdrop-blur-xs flex items-center gap-0.5 border border-amber-400/40">
                <Sparkles className="w-2.5 h-2.5 text-amber-400" />
                <span>DESTAQUE</span>
              </span>
            ) : null}
          </div>

          <div className="absolute bottom-2.5 left-3.5 right-3.5 z-20 flex items-center justify-between text-white text-xs drop-shadow-sm">
            <div className="flex items-center gap-1 font-semibold bg-slate-900/70 backdrop-blur-xs px-2.5 py-1 rounded-lg">
              <MapPin className="w-3.5 h-3.5 text-[#FF6B00] shrink-0" />
              <span className="truncate">{item.locationCity}, {item.locationState}</span>
            </div>

            {item.year && (
              <span className="bg-slate-900/75 backdrop-blur-xs px-2 py-0.5 rounded-md text-[11px] font-mono font-bold">
                Ano {item.year}
              </span>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5">
          <div className="flex items-baseline justify-between mb-1.5">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Preço Solicitado
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono tabular-nums tracking-tight">
                R$ {item.price.toLocaleString('pt-BR')}
              </span>
            </div>

            {item.priceNegotiable && (
              <span className="text-[11px] font-bold text-orange-800 bg-orange-100/90 px-2.5 py-0.5 rounded-md border border-orange-200">
                Aceita Proposta
              </span>
            )}
          </div>

          <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-[#FF6B00] transition-colors mt-1">
            {item.title}
          </h3>

          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2.5 font-medium">
            <span className="font-semibold text-slate-700">{item.subcategoryType}</span>
            <span aria-hidden="true">·</span>
            <span>{item.brand || 'Marca Livre'}</span>
            {item.hoursUsed ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-700 font-semibold">{item.hoursUsed.toLocaleString('pt-BR')}h</span>
              </>
            ) : item.mileageKm ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-slate-700 font-semibold">{item.mileageKm.toLocaleString('pt-BR')} km</span>
              </>
            ) : null}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5 pt-0">
        <button
          type="button"
          onClick={handleAction}
          className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-[#FF6B00] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:bg-[#FF6B00]"
        >
          <MessageSquare className="w-4 h-4 text-orange-300 group-hover:text-white transition-colors" />
          <span>Fazer Proposta / Chat</span>
          <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-white transition-colors" />
        </button>
      </div>
    </div>
  );
};
