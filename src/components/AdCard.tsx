import React, { useState } from 'react';
import { 
  MapPin, Heart, MessageSquare, ArrowRight, Sparkles, 
  Crown, ShieldCheck, Calendar, Clock, Video
} from 'lucide-react';
import { ListingItem } from '../types';
import { CardImageWithFallback } from './CardImageWithFallback';
import { BuyerMachineSearchIcon } from './BuyerMachineSearchIcon';
import { MachineVideoPlayer } from './MachineVideoPlayer';
import { formatVendendoEm } from '../utils/geoDistance';

interface AdCardProps {
  item: ListingItem;
  onClick: (item: ListingItem) => void;
  onConnectChat?: (item: ListingItem) => void;
  onQuickWhatsApp?: (item: ListingItem) => void;
  isVideoUnlocked?: boolean;
  onUnlockVideo?: (item: ListingItem) => void;
  onShareAntiBloqueio?: (item: ListingItem) => void;
}

/**
 * AdCard Component Reformulado
 * 
 * Regra de Ouro:
 * - O WhatsApp coletado NUNCA aparece no card público.
 * - Card COMPRO: Ícone da Máquina + Lupa (sem chave inglesa), Cidade/Região, Usado/Novo, Título, Orçamento, Anos, Botão "Conectar no Chat" (verde).
 * - Card VENDO: Selo laranja VENDO (+ PREMIUM/DESTAQUE), Foto grande, Local, Ano, Horas, Título, Preço, Selo "Aceita Proposta", Botão "Fazer Proposta / Chat" (laranja/preto).
 * - Borda dos cards: 24px (rounded-[24px]).
 */
export const AdCard: React.FC<AdCardProps> = ({
  item,
  onClick,
  onConnectChat,
  isVideoUnlocked = false,
  onUnlockVideo,
  onShareAntiBloqueio,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const isBuyer = item.intent === 'buy';

  const handleActionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onConnectChat) {
      onConnectChat(item);
    } else {
      onClick(item);
    }
  };

  // =========================================================================
  // CARD "QUERO COMPRAR" (PROCURA ATIVA - CARD VERDE - SEM FOTO FALSA)
  // =========================================================================
  if (isBuyer) {
    return (
      <div
        onClick={() => onClick(item)}
        className="group bg-white rounded-[24px] border border-slate-200 hover:border-emerald-500 border-l-[6px] border-l-[#00A86B] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
      >
        <div>
          {/* Topo: ÍCONE DA MÁQUINA + LUPA (NUNCA chave inglesa) */}
          <div className="relative aspect-[16/10] w-full bg-gradient-to-br from-emerald-50 via-teal-50/60 to-slate-100 flex items-center justify-center overflow-hidden border-b border-emerald-100/70">
            {/* Padrão de fundo suave */}
            <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#00A86B_1px,transparent_1px)] [background-size:16px_16px]" />

            {/* Ícone da Máquina + Lupa */}
            <div className="relative z-10 py-3 transform group-hover:scale-105 transition-transform duration-300">
              <BuyerMachineSearchIcon category={item.category} />
            </div>

            {/* Selo COMPRO no topo esquerdo */}
            <div className="absolute top-3.5 left-3.5 z-20">
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase shadow-xs bg-[#00A86B] text-white flex items-center gap-1">
                <span>COMPRO</span>
              </span>
            </div>

            {/* Botão de Favoritar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsFavorite(!isFavorite);
              }}
              className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md hover:bg-white flex items-center justify-center text-slate-600 transition-all shadow-xs active:scale-90"
              title="Salvar nos favoritos"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-600'
                }`}
              />
            </button>

            {/* Cidade / Região e Condição */}
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

          {/* Conteúdo do Card Comprador */}
          <div className="p-4 sm:p-5">
            {/* Tag informativa + Selo "📹 Este comprador aceita receber vídeos" */}
            <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#00A86B] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Procura Ativa Verificada</span>
              </div>

              {/* SELO SOLICITADO: "📹 Aceita receber vídeos do YouTube das máquinas" */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-950 border border-emerald-300 text-[11px] font-black shadow-2xs">
                <span>📹 Aceita receber vídeos do YouTube das máquinas</span>
              </span>
            </div>

            {/* Título: ex: "Eng. busca Escavadeira Hidráulica Caterpillar 20-22t" */}
            <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-[#00A86B] transition-colors">
              {item.title}
            </h3>

            {/* Inscrição Verde da Cidade do Comprador */}
            <div className="mt-2 py-1 px-2.5 rounded-lg bg-emerald-50 border border-emerald-300 inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
              <span>📍 PROCURANDO EM: {item.locationCity} / {item.locationState}</span>
            </div>

            {/* Descrição resumida da necessidade */}
            <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">
              "{item.description}"
            </p>

            {/* Bloco de Orçamento & Anos Aceitos */}
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

        {/* Rodapé: Botão Verde "Conectar no Chat" (REGRA DE OURO: Sem telefone no card!) */}
        <div className="p-4 sm:p-5 pt-0">
          <button
            type="button"
            onClick={handleActionClick}
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

  // =========================================================================
  // CARD "QUERO VENDER" (ANÚNCIO RÁPIDO - FOTO REAL + PREÇO + FAZER PROPOSTA)
  // =========================================================================
  const realProductImage = item.images && item.images.length > 0
    ? item.images[0]
    : undefined;

  return (
    <div
      onClick={() => onClick(item)}
      className="group bg-white rounded-[24px] border border-slate-200 hover:border-orange-500 border-l-[6px] border-l-[#FF6B00] overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Topo com Foto Grande da Máquina + Fallback */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#F3F4F6]">
          <CardImageWithFallback
            src={realProductImage}
            alt={item.title}
            category={item.category}
            aspectRatioClass="aspect-[4/3]"
            imageClassName="group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          {/* Gradiente escuro para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/25 pointer-events-none" />

          {/* Selos: VENDO (laranja) + PREMIUM + DESTAQUE */}
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

          {/* Botão de Favoritar */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsFavorite(!isFavorite);
            }}
            className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md hover:bg-white flex items-center justify-center text-slate-700 transition-all shadow-xs active:scale-90"
            title="Salvar nos favoritos"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${
                isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-700'
              }`}
            />
          </button>

          {/* Localização e Ano sobre a foto */}
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

        {/* PLAYER DE VÍDEO VERIFICADO OU BANNER DE ADICIONAR VÍDEO VERIFICADO R$ 19,90 */}
        {(item.videoUrl || item.id === 'sell-1' || isVideoUnlocked) ? (
          <div className="p-3 sm:p-4 pb-0 bg-slate-50 border-b border-slate-100">
            <MachineVideoPlayer
              itemId={item.id}
              itemTitle={item.title}
              isUnlocked={true}
              onUnlockRequest={() => onUnlockVideo?.(item)}
              thumbnailUrl={realProductImage}
              compact={true}
              videoUrl={item.videoUrl}
            />
          </div>
        ) : (
          <div className="p-3.5 sm:p-4 bg-amber-50/80 border-b border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full">
                  Plano Grátis (30 Dias)
                </span>
                <span className="text-[11px] font-bold text-slate-700 font-mono">
                  Expira em 30 dias - 26/10/2026
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Até 4 fotos leves (800px WebP) · Sem vídeo verificado ativo.
              </p>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUnlockVideo?.(item);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-orange-600 text-white font-black text-xs shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <Video className="w-3.5 h-3.5" />
              <span>Adicionar Vídeo Verificado (R$ 19,90)</span>
            </button>
          </div>
        )}

        {/* Informações Comerciais do Vendedor */}
        <div className="p-4 sm:p-5">
          {/* Preço de Venda + Selo Aceita Proposta */}
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

          {/* INSCRIÇÃO OBRIGATÓRIA GRANDE E VERDE (PONTO 5): 📍 VENDENDO EM */}
          <div className="my-2 py-1.5 px-3 rounded-xl bg-emerald-50 border-2 border-emerald-400 flex items-center justify-between shadow-2xs">
            <span className="text-xs sm:text-sm font-black text-[#00875A] uppercase tracking-tight flex items-center gap-1">
              {formatVendendoEm(item.locationCity, item.locationState)}
            </span>
            {item.locationCity.toLowerCase().includes('araquari') && (
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                Vizinho Joinville (30km)
              </span>
            )}
          </div>

          {/* Título: ex: "Vendo Retroescavadeira JCB 3CX 4x4 Ano 2021" */}
          <h3 className="text-sm sm:text-base font-black text-slate-900 line-clamp-2 leading-snug group-hover:text-[#FF6B00] transition-colors mt-1">
            {item.title}
          </h3>

          {/* Especificações Rápidas: Subcategoria, Horas / Km */}
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

      {/* Rodapé: Botões de Ação - BUG 3: Botão de contato "Falar com Vendedor" sem mostrar número */}
      <div className="p-4 sm:p-5 pt-0 flex items-center gap-2">
        <button
          type="button"
          onClick={handleActionClick}
          className="flex-1 py-3 px-4 rounded-xl bg-slate-900 hover:bg-[#FF6B00] active:scale-[0.98] text-white text-xs sm:text-sm font-bold shadow-md shadow-slate-900/10 hover:shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer group-hover:bg-[#FF6B00]"
        >
          <MessageSquare className="w-4 h-4 text-orange-300 group-hover:text-white transition-colors" />
          <span>Falar com Vendedor</span>
          <ArrowRight className="w-4 h-4 ml-auto text-slate-400 group-hover:text-white transition-colors" />
        </button>

        {onShareAntiBloqueio && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShareAntiBloqueio(item);
            }}
            title="Mandar link da máquina com 4 fotos e vídeo (Anti-Bloqueio)"
            className="px-3.5 py-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition-all cursor-pointer flex items-center justify-center text-xs font-bold shrink-0 active:scale-95"
          >
            <span>📲 Link</span>
          </button>
        )}
      </div>
    </div>
  );
};
