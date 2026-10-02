import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, Phone, MessageSquare, MapPin, Calendar, Clock, 
  ShieldCheck, Share2, Heart, Sparkles, CheckCircle, ArrowRight,
  Crown, Video, ExternalLink, Compass, CheckCircle2, Copy,
  ChevronLeft, ChevronRight, Smartphone, AlertCircle, Camera, RefreshCw,
  Edit, Trash2, PauseCircle, PlayCircle
} from 'lucide-react';
import { ListingItem } from '../types';
import { ProductGallery } from './ProductGallery';
import { MachineVideoPlayer } from './MachineVideoPlayer';
import { generateDisplayProductLink, getShareableProductUrl, mascararTelefone } from '../utils/productLinks';
import { formatVendendoEm } from '../utils/geoDistance';
import { updateProductMetaTags } from '../utils/openGraphMeta';
import { isProductOwner } from '../utils/ownerAuth';

export interface ProductDetailProps {
  item: ListingItem;
  onClose?: () => void;
  onOpenChat?: (item: ListingItem) => void;
  isVideoUnlocked?: boolean;
  onUnlockVideo?: (item: ListingItem) => void;
  onEdit?: (item: ListingItem) => void;
  onDelete?: (item: ListingItem) => void;
  onTogglePause?: (item: ListingItem) => void;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  item,
  onClose,
  onOpenChat,
  isVideoUnlocked = false,
  onUnlockVideo,
  onEdit,
  onDelete,
  onTogglePause,
}) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isItemPaused, setIsItemPaused] = useState(!!item.isPaused);

  const isOwner = useMemo(() => isProductOwner(item), [item]);

  // Garante as 4 fotos oficiais da Escavadeira CAT 320D se nenhuma foto for encontrada
  const defaultMachineryPhotos = useMemo(() => [
    '/cat_320d_excavator.jpg',
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80'
  ], []);

  // Busca fotos do produto (product.images ou product.fotos)
  const productPhotos = useMemo(() => {
    const raw = item.images && item.images.length > 0 
      ? item.images 
      : (item as any).fotos && (item as any).fotos.length > 0
      ? (item as any).fotos
      : defaultMachineryPhotos;

    if (raw.length < 3) {
      const merged = [...raw];
      for (const p of defaultMachineryPhotos) {
        if (!merged.includes(p) && merged.length < 4) {
          merged.push(p);
        }
      }
      return merged;
    }
    return raw;
  }, [item, defaultMachineryPhotos]);

  useEffect(() => {
    updateProductMetaTags(item);
  }, [item]);

  const isBuyer = item.intent === 'buy';
  const displayProductLink = generateDisplayProductLink(item);
  const shareableProductUrl = getShareableProductUrl(item);
  const sellerName = item.userName || 'Nardinei Zanardi';

  const handleCopyProductLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableProductUrl);
      setCopyFeedback('Link oficial copiado!');
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch (e) {
      setCopyFeedback(shareableProductUrl);
      setTimeout(() => setCopyFeedback(''), 4000);
    }
  };

  const handleShareWhatsApp = () => {
    const shareText = `Veja fotos reais e preço de ${item.title} no EuQuero: ${shareableProductUrl}`;
    const zapUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(zapUrl, '_blank');
  };

  const handleShareFacebook = () => {
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableProductUrl)}`;
    window.open(fbUrl, '_blank', 'width=600,height=400');
  };

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col">
      {/* Toast Feedback */}
      {copyFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[80] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
            isBuyer ? 'bg-emerald-600 text-white' : 'bg-[#FF6B00] text-white'
          }`}>
            {isBuyer ? 'Demanda de Compra' : 'Anúncio de Venda'}
          </span>
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">
            Fotos 100% Públicas (Sem Login)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyProductLink}
            title="Copiar link do produto"
            className="w-9 h-9 rounded-full bg-white text-slate-700 hover:text-orange-600 flex items-center justify-center border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsFavorite(!isFavorite)}
            className="w-9 h-9 rounded-full bg-white text-slate-700 flex items-center justify-center border border-slate-200 shadow-xs cursor-pointer active:scale-95 transition-all"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-900 text-white hover:bg-black flex items-center justify-center shadow-xs cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Tem certeza?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Essa ação não pode ser desfeita. O anúncio será excluído permanentemente da plataforma.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  onDelete?.(item);
                  if (onClose) onClose();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Sim, Excluir Anúncio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BODY COM SCROLL COMPLETO */}
      <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[85vh]">
        
        {/* BARRA AMARELA: VOCÊ É O DONO DESTE ANÚNCIO (PROMPT 2) */}
        {isOwner && (
          <div className="bg-amber-100 border-2 border-amber-300 text-amber-950 p-3 sm:p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm">
              <span className="text-base">👑</span>
              <span>Você é o dono deste anúncio</span>
              {isItemPaused && (
                <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-200 px-2 py-0.5 rounded-full border border-amber-400">
                  Pausado
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {/* [Editar] */}
              <button
                type="button"
                onClick={() => onEdit ? onEdit(item) : window.location.assign(`/editar-anuncio?id=${item.id}`)}
                className="px-3 py-1.5 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-xs flex items-center gap-1 shadow-xs cursor-pointer transition-transform active:scale-95"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Editar</span>
              </button>

              {/* [Pausar] */}
              <button
                type="button"
                onClick={() => {
                  const nextPaused = !isItemPaused;
                  setIsItemPaused(nextPaused);
                  onTogglePause?.({ ...item, isPaused: nextPaused });
                  setCopyFeedback(nextPaused ? 'Anúncio pausado' : 'Anúncio reativado');
                  setTimeout(() => setCopyFeedback(''), 2500);
                }}
                className="px-3 py-1.5 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>{isItemPaused ? 'Reativar' : 'Pausar'}</span>
              </button>

              {/* [Excluir] */}
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-2.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-xs transition-transform active:scale-95"
                title="Excluir este anúncio"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        )}

        {/* 1. GALERIA DE FOTOS OBRIGATÓRIA NO TOPO (RENDERIZADA ANTES DO PREÇO) */}
        {/* INDEPENDENTE DE TER VÍDEO OU NÃO: FOTOS GRÁTIS APARECEM SEMPRE */}
        <section aria-label="Galeria de Fotos da Máquina">
          <ProductGallery
            images={productPhotos}
            title={item.title}
            category={item.category}
            locationCity={item.locationCity}
            locationState={item.locationState}
          />
        </section>

        {/* 2. PREÇO À VISTA E TÍTULO (LOGO APÓS A GALERIA) */}
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-400 block tracking-wider">
                {isBuyer ? 'Orçamento Previsto' : 'Preço à Vista'}
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono tabular-nums tracking-tight">
                R$ {item.price.toLocaleString('pt-BR')}
              </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {item.priceNegotiable && (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                  Aceita Proposta
                </span>
              )}
              <span className="px-3 py-1 bg-blue-600 text-white text-xs font-black rounded-full flex items-center gap-1 shadow-2xs">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>VENDEDOR VERIFICADO</span>
              </span>
            </div>
          </div>

          <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
            {item.title}
          </h1>

          <div className="flex items-center gap-2 mt-2 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-orange-500" />
              {item.locationCity}, {item.locationState}
            </span>
            {item.year && <span>• Ano {item.year}</span>}
            {item.hoursUsed && <span>• {item.hoursUsed.toLocaleString('pt-BR')} Horas</span>}
          </div>
        </div>

        {/* 3. BOTÕES DE COMPARTILHAMENTO (WHATSAPP COM PREVIEW DA MÁQUINA) */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Compartilhar anúncio com o cliente:</span>
            <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-black">
              Link Anti-Bloqueio
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#1ebd5a] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Mandar no Zap</span>
            </button>

            <button
              type="button"
              onClick={handleShareFacebook}
              className="py-2.5 px-3 rounded-xl bg-[#1877F2] hover:bg-[#166fe5] active:scale-95 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Facebook</span>
            </button>
          </div>

          <div className="pt-1 flex items-center justify-between text-[11px] text-slate-500 font-mono truncate">
            <span className="truncate">{shareableProductUrl}</span>
            <button
              type="button"
              onClick={handleCopyProductLink}
              className="text-orange-600 font-bold hover:underline shrink-0 ml-2"
            >
              Copiar
            </button>
          </div>
        </div>

        {/* 4. PLAYER DE VÍDEO (SE HOUVER) */}
        {item.videoUrl && (
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-slate-500 tracking-wider block">
              Vídeo Verificado da Máquina
            </span>
            <MachineVideoPlayer
              itemId={item.id}
              itemTitle={item.title}
              isUnlocked={true}
              thumbnailUrl={productPhotos[0]}
              compact={false}
              videoUrl={item.videoUrl}
            />
          </div>
        )}

        {/* 5. ESPECIFICAÇÕES DA MÁQUINA */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
            Ficha Técnica & Detalhes
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Categoria</span>
              <span className="font-bold text-slate-800">{item.subcategoryType || item.category}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Marca / Fabricante</span>
              <span className="font-bold text-slate-800">{item.brand || 'Caterpillar (CAT)'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Modelo</span>
              <span className="font-bold text-slate-800">{item.model || '320D / 320 GC'}</span>
            </div>
            {item.year && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Ano de Fabricação</span>
                <span className="font-bold text-slate-800">{item.year}</span>
              </div>
            )}
            {item.hoursUsed && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-400 block text-[10px] font-bold uppercase">Horímetro</span>
                <span className="font-bold text-slate-800">{item.hoursUsed.toLocaleString('pt-BR')} horas</span>
              </div>
            )}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Localização</span>
              <span className="font-bold text-slate-800">{item.locationCity}/{item.locationState}</span>
            </div>
          </div>
        </div>

        {/* 6. DESCRIÇÃO */}
        {item.description && (
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-black uppercase text-slate-500 tracking-wider">
              Descrição do Vendedor
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50 p-4 rounded-2xl border border-slate-100">
              {item.description}
            </p>
          </div>
        )}

        {/* 7. BOTÃO FAZER PROPOSTA / INICIAR NEGOCIAÇÃO */}
        <div className="pt-3">
          <button
            type="button"
            onClick={() => onOpenChat?.(item)}
            className="w-full py-4 px-6 rounded-2xl bg-[#FF6B00] hover:bg-orange-600 active:scale-98 text-white font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Fazer Proposta / Conectar com Vendedor</span>
          </button>
        </div>

      </div>
    </div>
  );
};
