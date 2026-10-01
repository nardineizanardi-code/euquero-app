import React, { useState } from 'react';
import { 
  X, Phone, MessageSquare, MapPin, Calendar, Clock, 
  ShieldCheck, Share2, Heart, Sparkles, CheckCircle, ArrowRight,
  Crown, Video, ExternalLink, Compass, CheckCircle2, Copy,
  ChevronLeft, ChevronRight, Smartphone
} from 'lucide-react';
import { ListingItem } from '../types';
import { CardImageWithFallback } from './CardImageWithFallback';
import { MachineVideoPlayer } from './MachineVideoPlayer';
import { generateDisplayProductLink, getShareableProductUrl, mascararTelefone } from '../utils/productLinks';
import { formatVendendoEm } from '../utils/geoDistance';

interface ItemDetailModalProps {
  item: ListingItem | null;
  onClose: () => void;
  onOpenChat: (item: ListingItem) => void;
  isVideoUnlocked?: boolean;
  onUnlockVideo?: (item: ListingItem) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  onOpenChat,
  isVideoUnlocked = false,
  onUnlockVideo,
}) => {
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  if (!item) return null;

  const isBuyer = item.intent === 'buy';
  const photos = item.images && item.images.length > 0
    ? item.images
    : ['/cat_320d_excavator.jpg'];

  const displayProductLink = generateDisplayProductLink(item);
  const shareableProductUrl = getShareableProductUrl(item);
  const sellerName = item.userName || 'Nardinei Zanardi';

  // Mensagem oficial anti-bloqueio: "Veja minha [Máquina] com 4 fotos e vídeo no EuQuero: [link produto] - Nardinei Silva"
  const antiBloqueioMsg = `Veja minha ${item.title} com 4 fotos e vídeo no EuQuero: ${shareableProductUrl} - ${sellerName}`;

  // PROMPT 3: Compartilhar para outras plataformas OLX e Mercado Livre
  // Usar apenas URL relativa window.location.href para pegar URL atual
  const getCurrentUrl = () => {
    return typeof window !== 'undefined' ? window.location.href : shareableProductUrl;
  };

  const handleShareWhatsApp = async () => {
    const currentUrl = getCurrentUrl();
    const shareText = `Veja ${item.title} no EuQuero: ${currentUrl}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: shareText,
          url: currentUrl,
        });
        return;
      } catch (err) {
        // Fallback para wa.me se usuário cancelar ou navegador não suportar
      }
    }
    const encoded = encodeURIComponent(shareText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleShareFacebook = () => {
    const currentUrl = getCurrentUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, '_blank');
  };

  const handleCopyForOLX = async () => {
    const currentUrl = getCurrentUrl();
    const photosText = photos && photos.length > 0 ? photos.join(' | ') : currentUrl;
    const formattedPrice = `R$ ${item.price.toLocaleString('pt-BR')}`;
    const cityState = `${item.locationCity || 'Brasil'}/${item.locationState || 'BR'}`;
    const olxText = `${item.title} - ${formattedPrice} - ${cityState} - ${item.description} - Fotos: ${photosText} - Anúncio original: ${currentUrl} - Visto em www.euquero.app.br`;

    try {
      await navigator.clipboard.writeText(olxText);
      setCopyFeedback('Texto copiado! Cole na OLX');
      setTimeout(() => setCopyFeedback(''), 3500);
    } catch (e) {
      setCopyFeedback('Texto copiado! Cole na OLX');
      setTimeout(() => setCopyFeedback(''), 3500);
    }

    // Botão 3 ao copiar, abrir em nova aba: window.open('https://www.olx.com.br/brasil', '_blank')
    window.open('https://www.olx.com.br/brasil', '_blank');
  };

  const handleCopyForMercadoLivre = async () => {
    const currentUrl = getCurrentUrl();
    const photosText = photos && photos.length > 0 ? photos.join(' | ') : currentUrl;
    const formattedPrice = `R$ ${item.price.toLocaleString('pt-BR')}`;
    const cityState = `${item.locationCity || 'Brasil'}/${item.locationState || 'BR'}`;
    const mlText = `${item.title} - ${formattedPrice} - ${cityState} - ${item.description} - Fotos: ${photosText} - Anúncio original: ${currentUrl} - Visto em www.euquero.app.br`;

    try {
      await navigator.clipboard.writeText(mlText);
      setCopyFeedback('Texto copiado! Cole no Mercado Livre');
      setTimeout(() => setCopyFeedback(''), 3500);
    } catch (e) {
      setCopyFeedback('Texto copiado! Cole no Mercado Livre');
      setTimeout(() => setCopyFeedback(''), 3500);
    }

    // Botão 4 ao copiar, abrir em nova aba: window.open('https://www.mercadolivre.com.br/', '_blank')
    window.open('https://www.mercadolivre.com.br/', '_blank');
  };

  const handleShareWhatsAppLink = () => {
    const encoded = encodeURIComponent(antiBloqueioMsg);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyProductLink = () => {
    try {
      navigator.clipboard.writeText(antiBloqueioMsg);
      setCopyFeedback('Link da máquina copiado!');
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch (e) {
      setCopyFeedback('Texto pronto para envio.');
    }
  };

  const handlePrevPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = () => {
    setSelectedPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      
      {/* Toast flutuante de cópia */}
      {copyFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-400 font-bold text-xs sm:text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-white sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col min-h-screen sm:min-h-0 sm:max-h-[92vh]">
        
        {/* Floating Top Actions Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
          <span
            className={`pointer-events-auto px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-md backdrop-blur-md ${
              isBuyer
                ? 'bg-emerald-600/90 text-white'
                : 'bg-orange-500/90 text-white'
            }`}
          >
            {isBuyer ? 'Demanda de Compra' : 'Anúncio de Venda'}
          </span>

          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={handleCopyProductLink}
              title="Copiar link único do produto"
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-md text-slate-700 hover:bg-white flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-900/80 backdrop-blur-md text-white hover:bg-slate-900 flex items-center justify-center shadow-md transition-all active:scale-90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Big Hero Image com Fallback e Controles do Carrossel */}
        <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-[#F3F4F6] overflow-hidden group">
          <CardImageWithFallback
            src={photos[selectedPhotoIndex] || photos[0]}
            alt={item.title}
            category={item.category}
            aspectRatioClass="aspect-[16/10] sm:aspect-[16/9]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

          {/* Setas de Navegação do Carrossel de 4 fotos */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer opacity-90 hover:scale-105 active:scale-90"
                title="Foto anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer opacity-90 hover:scale-105 active:scale-90"
                title="Próxima foto"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Location on photo */}
          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white text-xs drop-shadow-md z-20">
            <div className="flex items-center gap-1.5 font-medium bg-slate-900/60 backdrop-blur-xs px-2.5 py-1 rounded-lg">
              <MapPin className="w-4 h-4 text-orange-400" />
              <span>{item.locationCity}, {item.locationState}</span>
            </div>
            {photos.length > 1 && (
              <span className="bg-black/70 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold">
                Foto {selectedPhotoIndex + 1} de {photos.length}
              </span>
            )}
          </div>
        </div>

        {/* Miniaturas do carrossel */}
        {photos.length > 1 && (
          <div className="flex items-center gap-2 p-3 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar">
            {photos.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedPhotoIndex(idx)}
                className={`relative w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  selectedPhotoIndex === idx ? 'border-orange-500 scale-105 shadow-sm' : 'border-transparent opacity-70 hover:opacity-100'
                }`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Banner do Link Único Oficial do Produto */}
        <div className="px-5 sm:px-6 pt-3 pb-0">
          <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-black uppercase text-slate-500 shrink-0">Link Único:</span>
              <code className="text-[11px] font-mono font-bold text-orange-700 truncate">{displayProductLink}</code>
            </div>
            <button
              type="button"
              onClick={handleCopyProductLink}
              className="text-[11px] font-bold text-slate-700 hover:text-orange-600 shrink-0 flex items-center gap-1 cursor-pointer bg-white px-2 py-0.5 rounded border border-slate-200"
            >
              <Copy className="w-3 h-3" />
              <span>Copiar</span>
            </button>
          </div>
        </div>

        {/* FICHA VENDE: PLAYER DE VÍDEO VERIFICADO OU BANNER DE ADICIONAR VÍDEO VERIFICADO */}
        {!isBuyer && (item.videoUrl || item.id === 'sell-1' || isVideoUnlocked) && (
          <div className="px-5 sm:px-6 pt-3 pb-1">
            <MachineVideoPlayer
              itemId={item.id}
              itemTitle={item.title}
              isUnlocked={true}
              onUnlockRequest={() => onUnlockVideo?.(item)}
              thumbnailUrl={photos[0]}
              compact={false}
              videoUrl={item.videoUrl}
            />
          </div>
        )}

        {!isBuyer && !(item.videoUrl || item.id === 'sell-1' || isVideoUnlocked) && (
          <div className="mx-5 sm:mx-6 mt-3 p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 text-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2.5 py-0.5 rounded-full">
                  Plano Grátis (30 Dias)
                </span>
                <span className="text-xs font-bold text-slate-700 font-mono">
                  Expira em 30 dias - 26/10/2026
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
                Anúncio com fotos reais (800px WebP) sem vídeo verificado. Adicione vídeo gravado para comprovar o funcionamento.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onUnlockVideo?.(item)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-orange-600 text-white font-black text-xs shadow-md shrink-0 cursor-pointer flex items-center justify-center gap-1.5 transition-transform active:scale-95"
            >
              <Video className="w-4 h-4" />
              <span>Adicionar Vídeo Verificado (R$ 19,90)</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Price & Title */}
          <div>
            <div className="flex items-baseline justify-between mb-2">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                  {isBuyer ? 'Orçamento Previsto' : 'Preço à Vista'}
                </span>
                <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums tracking-tight">
                  R$ {item.price.toLocaleString('pt-BR')}
                </span>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                {item.priceNegotiable && (
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    Aceita Proposta
                  </span>
                )}
                {(item.badge === 'verified' || item.tier === 'dealer' || item.tier === 'dealer_10' || item.tier === 'dealer_30') && (
                  <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>REVENDEDOR VERIFICADO</span>
                  </span>
                )}
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
              {item.title}
            </h2>

            {/* SEÇÃO COMPARTILHAR ESTE ANÚNCIO (PROMPT 3) */}
            <div className="mt-3.5 p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-600 block">
                Compartilhar este anúncio:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {/* Botão 1: WhatsApp */}
                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="py-2 px-2.5 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer truncate"
                  title="Compartilhar no WhatsApp"
                >
                  <Share2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">WhatsApp</span>
                </button>

                {/* Botão 2: Facebook */}
                <button
                  type="button"
                  onClick={handleShareFacebook}
                  className="py-2 px-2.5 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer truncate"
                  title="Compartilhar no Facebook"
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Facebook</span>
                </button>

                {/* Botão 3: Copiar para OLX */}
                <button
                  type="button"
                  onClick={handleCopyForOLX}
                  className="py-2 px-2.5 rounded-xl bg-[#6E0AD6] hover:bg-[#5b08b3] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer truncate"
                  title="Copiar texto formatado e abrir a OLX"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Copiar para OLX</span>
                </button>

                {/* Botão 4: Copiar para Mercado Livre */}
                <button
                  type="button"
                  onClick={handleCopyForMercadoLivre}
                  className="py-2 px-2.5 rounded-xl bg-[#FFE600] hover:bg-[#ebd300] active:scale-95 text-[#2D3277] font-black text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer border border-amber-300 truncate"
                  title="Copiar texto formatado e abrir o Mercado Livre"
                >
                  <Copy className="w-3.5 h-3.5 shrink-0 text-[#2D3277]" />
                  <span className="truncate">Copiar para ML</span>
                </button>
              </div>
            </div>

            {/* INSCRIÇÃO OBRIGATÓRIA GRANDE E VERDE (PONTO 5) */}
            <div className="mt-3 py-2 px-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-500 flex items-center justify-between shadow-xs">
              <span className="text-sm sm:text-base font-black text-[#00875A] uppercase tracking-wide flex items-center gap-1.5">
                <span>{formatVendendoEm(item.locationCity, item.locationState)}</span>
              </span>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full font-mono">
                Localização Confirmada
              </span>
            </div>
          </div>

          {/* Quick Specs Grid Completa por Categoria */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Categoria</span>
              <span className="font-bold text-slate-800 capitalize">{item.category.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Marca / Fabricante</span>
              <span className="font-bold text-slate-800">{item.brand || 'Não especificada'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Ano</span>
              <span className="font-bold text-slate-800 font-mono">
                {isBuyer ? `${item.yearMin ?? 2015} a ${item.yearMax ?? 2024}` : item.year ?? 'Seminovo'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5 font-medium">Uso / Horímetro</span>
              <span className="font-bold text-slate-800 font-mono">
                {item.hoursUsed ? `${item.hoursUsed}h de uso` : item.mileageKm ? `${item.mileageKm} km` : 'Não informado'}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Descrição Detalhada
            </h4>
            <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {item.description}
            </p>
          </div>

          {/* Advertiser Profile Card - PROMPT 8: Esconder dados pessoais e mostrar telefone mascarado */}
          <div className="p-4 bg-slate-100/90 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
                EQ
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900">Vendedor Verificado</h4>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </div>
                <p className="text-xs text-slate-500">📍 {item.locationCity}, {item.locationState} · Contato seguro via EuQuero</p>
                {/* PROMPT 8: Texto WhatsApp: (47) 9962-XXXX */}
                <p className="text-xs font-semibold text-slate-700 mt-1 font-mono flex items-center gap-1.5">
                  <span className="text-emerald-700 font-bold">WhatsApp:</span> {mascararTelefone(item.userPhone || '47996205669')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                ● Online
              </span>
            </div>
          </div>

          {/* PROMPT 8: Botão Laranja "Clique para falar com vendedor (Chat Seguro EuQuero)" */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenChat(item);
              }}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-[#FF6B00] to-orange-500 hover:from-orange-600 hover:to-orange-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-amber-400/40 text-center"
            >
              <MessageSquare className="w-5 h-5 fill-white text-white shrink-0" />
              <span>Clique para falar com vendedor (Chat Seguro EuQuero)</span>
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-1.5">
              🛡️ Negociação protegida pelo chat interno. O número completo permanece salvo no banco e não é exposto ao público.
            </p>
          </div>

          {/* Card Anti-Bloqueio WhatsApp Informativo */}
          <div className="p-3 bg-amber-500/10 border border-amber-400/40 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong>Solução Anti-Bloqueio WhatsApp:</strong> Compartilhe este link no WhatsApp com seu cliente. Ele verá 4 fotos e o vídeo no navegador sem você precisar mandar 100 fotos pesadas.
            </div>
          </div>
        </div>

        {/* Fixed Bottom Action Buttons Solicitados */}
        <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row items-center gap-3">
          
          {/* BOTÃO 1: Falar com Vendedor - PROMPT 8 */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenChat(item);
            }}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span>Falar com Vendedor (Chat Seguro)</span>
          </button>

          {/* BOTÃO 2: Compartilhar no WhatsApp com Link (Anti-Bloqueio, não fotos) */}
          <button
            type="button"
            onClick={handleShareWhatsAppLink}
            className="w-full sm:flex-1 py-3.5 px-4 rounded-xl bg-[#00875A] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>Compartilhar no WhatsApp</span>
          </button>
        </div>

      </div>
    </div>
  );
};

