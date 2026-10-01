import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, Plus, Trash2, Video, Crown, Star, CheckCircle2, 
  X, Play, Sparkles, Image as ImageIcon, QrCode, CreditCard, 
  ShieldCheck, Zap, ArrowRight, Check, HelpCircle, Building, 
  TrendingUp, Award, Copy, Flame, BellRing, Eye, Compass, Unlock
} from 'lucide-react';
import { PhotoPlanTier } from '../types';
import { VideoUnlockModal } from './VideoUnlockModal';

export interface PhotoUploadProps {
  photos: string[];
  onChangePhotos: (photos: string[]) => void;
  tier?: PhotoPlanTier;
  onChangeTier?: (tier: PhotoPlanTier) => void;
  videoUrl?: string;
  onChangeVideoUrl?: (url: string) => void;
  tour360Url?: string;
  onChangeTour360Url?: (url: string) => void;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  photos,
  onChangePhotos,
  tier: externalTier,
  onChangeTier,
  videoUrl: externalVideoUrl = '',
  onChangeVideoUrl,
  tour360Url: externalTour360Url = '',
  onChangeTour360Url,
}) => {
  // Estado do plano ativo
  const [internalTier, setInternalTier] = useState<PhotoPlanTier>('free');
  const activeTier = externalTier || internalTier;

  // Bônus de vídeo e desbloqueio de vídeo de 30s
  const [hasWatchedBonusAd, setHasWatchedBonusAd] = useState<boolean>(false);
  const [isPlayingBonusVideo, setIsPlayingBonusVideo] = useState<boolean>(false);
  const [bonusSecondsLeft, setBonusSecondsLeft] = useState<number>(3);
  const [isAnnounceVideoUnlocked, setIsAnnounceVideoUnlocked] = useState<boolean>(false);
  const [isVideoUnlockModalOpen, setIsVideoUnlockModalOpen] = useState<boolean>(false);

  // Vídeo e Tour 360
  const [internalVideoUrl, setInternalVideoUrl] = useState<string>('');
  const currentVideoUrl = externalVideoUrl || internalVideoUrl;
  const [internalTour360Url, setInternalTour360Url] = useState<string>('');
  const currentTour360Url = externalTour360Url || internalTour360Url;

  // Modais de Upgrade & Revendedor
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState<boolean>(false);
  const [targetUpgradeTier, setTargetUpgradeTier] = useState<
    'premium_15' | 'premium_25' | 'dealer_10' | 'dealer_30'
  >('premium_15');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isSimulatingPayment, setIsSimulatingPayment] = useState<boolean>(false);
  const [pixCopied, setPixCopied] = useState<boolean>(false);

  // Modal / Aba de Revendedor
  const [isDealerModalOpen, setIsDealerModalOpen] = useState<boolean>(false);

  // Toast de notificação
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Amostras para teste rápido com URLs válidas
  const samplePhotos = [
    '/cat_320d_excavator.jpg',
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80',
  ];

  // Cálculo da capacidade máxima de fotos
  const getMaxPhotos = (): number => {
    switch (activeTier) {
      case 'premium_15':
      case 'premium_10': // fallback
        return 15;
      case 'premium_25':
      case 'premium_20': // fallback
        return 25;
      case 'dealer_10':
      case 'dealer_30':
      case 'dealer': // fallback
        return 30; // Fotos ilimitadas
      case 'free':
      default:
        // "Adicionar até 3 fotos (grátis)"
        return 3;
    }
  };

  const maxPhotos = getMaxPhotos();

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 4500);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const setTier = (newTier: PhotoPlanTier) => {
    setInternalTier(newTier);
    if (onChangeTier) onChangeTier(newTier);
  };

  const handleVideoUrlChange = (url: string) => {
    setInternalVideoUrl(url);
    if (onChangeVideoUrl) onChangeVideoUrl(url);
  };

  const handleTour360UrlChange = (url: string) => {
    setInternalTour360Url(url);
    if (onChangeTour360Url) onChangeTour360Url(url);
  };

  // =========================================================================
  // 2. BÔNUS VÍDEO (Apenas um "gostinho", máximo 3 fotos no plano grátis)
  // =========================================================================
  const handleWatchBonusAd = () => {
    if (hasWatchedBonusAd) {
      setToastMessage('Você já utilizou o bônus de +1 foto grátis. Para mais fotos, faça upgrade para o Premium!');
      return;
    }

    setIsPlayingBonusVideo(true);
    setBonusSecondsLeft(3);

    const interval = setInterval(() => {
      setBonusSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsPlayingBonusVideo(false);
      setHasWatchedBonusAd(true);
      setToastMessage('🎉 +1 foto extra liberada! Limite gratuito agora é de 3 fotos.');
    }, 3000);
  };

  // =========================================================================
  // 3. UPGRADE & CHECKOUT PREMIUM (R$ 29,90 ou R$ 59,90)
  // =========================================================================
  const openUpgradeModal = (tier: 'premium_15' | 'premium_25' | 'dealer_10' | 'dealer_30') => {
    setTargetUpgradeTier(tier);
    setIsUpgradeModalOpen(true);
    setPixCopied(false);
  };

  const handleConfirmPaymentSimulation = () => {
    setIsSimulatingPayment(true);
    setTimeout(() => {
      setIsSimulatingPayment(false);
      setTier(targetUpgradeTier);
      setIsUpgradeModalOpen(false);

      if (targetUpgradeTier === 'premium_15') {
        setToastMessage('⭐ Plano Premium Ativado! Até 15 fotos + Vídeo + 7 dias de destaque + Selo Premium.');
      } else if (targetUpgradeTier === 'premium_25') {
        setToastMessage('👑 Plano Premium Pro Ativado! Até 25 fotos + Vídeo + Tour 360° + 14 dias de destaque + Push de compradores.');
      } else if (targetUpgradeTier === 'dealer_10') {
        setToastMessage('🛡️ Plano Revendedor Básico Ativado! 10 anúncios + fotos ilimitadas + Selo Revenda Verificada.');
      } else if (targetUpgradeTier === 'dealer_30') {
        setToastMessage('🚀 Plano Revendedor Pro Ativado! 30 anúncios + fotos ilimitadas + destaque auto + Gerente de conta.');
      }
    }, 1200);
  };

  const handleCopyPix = () => {
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  // Manipulação de Upload
  const handleAttemptAdd = () => {
    if (photos.length >= maxPhotos) {
      if (activeTier === 'free') {
        openUpgradeModal('premium_15');
        return;
      } else if (activeTier === 'premium_15' || activeTier === 'premium_10') {
        openUpgradeModal('premium_25');
        return;
      } else {
        setToastMessage(`Limite de ${maxPhotos} fotos atingido para este plano.`);
        return;
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAddSamplePhoto = () => {
    if (photos.length >= maxPhotos) {
      if (activeTier === 'free') {
        openUpgradeModal('premium_15');
        return;
      }
      setToastMessage(`Limite de ${maxPhotos} fotos atingido!`);
      return;
    }

    const nextSample = samplePhotos[photos.length % samplePhotos.length];
    onChangePhotos([...photos, nextSample]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = maxPhotos - photos.length;
    if (files.length > availableSlots && activeTier === 'free') {
      openUpgradeModal('premium_15');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const filesToLoad = Array.from(files).slice(0, Math.max(availableSlots, 0));
    const newPhotosList: string[] = [];

    let loadedCount = 0;
    filesToLoad.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          newPhotosList.push(event.target.result as string);
        }
        loadedCount++;
        if (loadedCount === filesToLoad.length) {
          onChangePhotos([...photos, ...newPhotosList]);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (indexToRemove: number) => {
    onChangePhotos(photos.filter((_, idx) => idx !== indexToRemove));
  };

  // Status visual
  const isPremium15 = activeTier === 'premium_15' || activeTier === 'premium_10';
  const isPremium25 = activeTier === 'premium_25' || activeTier === 'premium_20';
  const isDealer10 = activeTier === 'dealer_10' || activeTier === 'dealer';
  const isDealer30 = activeTier === 'dealer_30';
  const isDealer = isDealer10 || isDealer30;
  const isAnyPremium = isPremium15 || isPremium25 || isDealer;

  const getTierPriceLabel = (tier: string) => {
    switch (tier) {
      case 'premium_15': return 'R$ 29,90';
      case 'premium_25': return 'R$ 59,90';
      case 'dealer_10': return 'R$ 199/mês';
      case 'dealer_30': return 'R$ 399/mês';
      default: return 'R$ 29,90';
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />

      {/* TOAST DE FEEDBACK */}
      {toastMessage && (
        <div className="p-3 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-lg flex items-center justify-between gap-2 animate-in slide-in-from-top duration-200 border border-slate-700">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="p-1 hover:bg-slate-800 rounded-md transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* CABEÇALHO DO UPLOAD: STATUS & PLANO ATUAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Fotos do Equipamento
            </label>
            {isDealer && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                <span>Revenda Verificada ({isDealer30 ? '30 Anúncios' : '10 Anúncios'})</span>
              </span>
            )}
            {isPremium25 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Crown className="w-3 h-3 text-amber-600 fill-amber-500" />
                <span>Premium Pro (25 Fotos + Push)</span>
              </span>
            )}
            {isPremium15 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-orange-100 text-orange-900 border border-orange-200 flex items-center gap-1">
                <Star className="w-3 h-3 text-orange-600 fill-orange-500" />
                <span>Premium (15 Fotos + Destaque 7d)</span>
              </span>
            )}
            {activeTier === 'free' && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
                Adicionar até 3 fotos (grátis)
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Adicione imagens claras de cabine, horímetro, motor, esteiras ou pneus
          </p>
        </div>

        {/* CONTADOR DE FOTOS & LINK SOU REVENDA */}
        <div className="flex items-center gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
            isAnyPremium 
              ? 'bg-amber-50 text-amber-900 border border-amber-300' 
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}>
            <Camera className="w-3.5 h-3.5 text-slate-600" />
            <span>
              {photos.length} de {isDealer ? 'Ilimitadas' : `${maxPhotos} fotos`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsDealerModalOpen(true)}
            className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
          >
            Sou Revendedor
          </button>
        </div>
      </div>

      {/* GRID DE MINIATURAS DAS FOTOS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
        {photos.map((url, idx) => (
          <div
            key={idx}
            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-2xs hover:shadow-xs transition-all"
          >
            <img
              src={url}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />

            {/* Selo Capa */}
            {idx === 0 && (
              <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider">
                Foto Principal
              </span>
            )}

            {/* Excluir foto */}
            <button
              type="button"
              onClick={() => handleRemovePhoto(idx)}
              className="absolute top-1.5 right-1.5 p-1 rounded-lg bg-slate-900/70 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
              title="Remover foto"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/60 text-white">
              #{idx + 1}
            </span>
          </div>
        ))}

        {/* BOTÃO ADICIONAR FOTO */}
        {photos.length < maxPhotos && (
          <button
            type="button"
            onClick={handleAttemptAdd}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-orange-500 hover:bg-orange-50/20 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group"
          >
            <div className="p-2 rounded-full bg-slate-100 text-slate-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors mb-1.5">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-[11px] font-bold text-slate-700 group-hover:text-orange-700">
              Adicionar Foto
            </span>
            <span className="text-[9px] text-slate-400 mt-0.5">
              JPG, PNG ou WebP
            </span>
          </button>
        )}

        {/* CARD INLINE CONVIDANDO AO UPGRADE SE ESTIVER NO LIMITE */}
        {!isAnyPremium && photos.length >= maxPhotos && (
          <button
            type="button"
            onClick={() => openUpgradeModal('premium_15')}
            className="aspect-square rounded-xl border-2 border-dashed border-orange-400 bg-gradient-to-br from-orange-50/90 to-amber-50/90 hover:bg-orange-100/70 flex flex-col items-center justify-center p-3 text-center transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="p-2 rounded-full bg-orange-500 text-white group-hover:scale-110 transition-transform mb-1 shadow-xs">
              <Crown className="w-4 h-4 fill-white" />
            </div>
            <span className="text-[11px] font-black text-orange-950 leading-tight">
              Liberar 15 Fotos
            </span>
            <span className="text-[9px] text-orange-700 font-bold mt-1">
              R$ 29,90 único
            </span>
          </button>
        )}
      </div>

      {/* AÇÕES SECUNDÁRIAS: FOTO DE EXEMPLO + BOTÃO PEQUENO DE BÔNUS VÍDEO */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
        <button
          type="button"
          onClick={handleAddSamplePhoto}
          className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium hover:underline cursor-pointer text-[11px]"
        >
          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>Inserir foto de exemplo (teste rápido)</span>
        </button>

        {/* 2. BÔNUS VÍDEO (APENAS UM GOSTINHO - PEQUENO E DISCRETO) */}
        {!isAnyPremium && !hasWatchedBonusAd && (
          <button
            type="button"
            onClick={handleWatchBonusAd}
            disabled={isPlayingBonusVideo}
            className="text-[11px] text-slate-500 hover:text-slate-800 underline decoration-slate-300 hover:decoration-slate-700 cursor-pointer transition-colors inline-flex items-center gap-1"
          >
            <Play className="w-2.5 h-2.5 fill-current" />
            <span>
              {isPlayingBonusVideo 
                ? `Exibindo vídeo curto (${bonusSecondsLeft}s)...` 
                : 'Assistir vídeo e ganhar +1 foto'}
            </span>
          </button>
        )}

        {hasWatchedBonusAd && !isAnyPremium && (
          <span className="text-[10px] font-medium text-slate-500">
            ✓ Bônus ativo: 3 fotos grátis (limite máximo do modo teste)
          </span>
        )}
      </div>

      {/* 2. BOTÃO LARANJA SOLICITADO: "➕ Adicionar vídeo de até 30s da máquina funcionando - Desbloqueia com R$ 19,90 - Vídeos vendem 5x mais rápido" */}
      <div className="pt-2">
        {!isAnnounceVideoUnlocked && !isAnyPremium ? (
          <button
            type="button"
            onClick={() => setIsVideoUnlockModalOpen(true)}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#FF6B00] via-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.99] text-white font-black text-xs sm:text-sm shadow-md shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer transition-all border border-orange-400/40 text-center"
          >
            <span>➕ Adicionar vídeo de até 30s da máquina funcionando - Desbloqueia com R$ 19,90 - Vídeos vendem 5x mais rápido</span>
          </button>
        ) : (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-400/80 space-y-3 shadow-xs">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-black text-emerald-950">
                  Vídeo da Máquina Desbloqueado com Sucesso! (R$ 19,90)
                </span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 border border-emerald-300">
                Vídeos vendem 5x mais rápido
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
              <div className="w-full sm:w-44 aspect-video rounded-xl bg-slate-950 relative overflow-hidden flex items-center justify-center border border-slate-700 shrink-0 shadow-md">
                <img
                  src="/cat_320d_excavator.jpg"
                  alt="Prévia do vídeo"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-2 text-center bg-black/40">
                  <Play className="w-6 h-6 fill-white text-white mb-0.5" />
                  <span className="text-[10px] font-mono font-bold text-amber-300">
                    ▶️ Vídeo: 0:28
                  </span>
                </div>
              </div>

              <div className="flex-1 w-full space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800 block">
                    Vídeo (opcional) - Grátis: 4 fotos | Com vídeo verificado: até 12 fotos + selo por R$ 19,90 (taxa única)
                  </label>
                  <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Vídeo Verificado Opcional
                  </span>
                </div>
                <input
                  type="url"
                  required={false}
                  value={currentVideoUrl}
                  onChange={(e) => handleVideoUrlChange(e.target.value)}
                  placeholder="https://youtu.be/... (opcional - deixe em branco para publicar grátis)"
                  className="w-full px-3 py-2 text-xs bg-white border border-emerald-300 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500 shadow-2xs font-mono"
                />
                <span className="text-[11px] text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                  <span>✅ Vídeo verificado da própria máquina - gravado em Paulínia/SP (26/09/2026)</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CAMPOS EXTRAS QUANDO PREMIUM OU REVENDA ESTÁ ATIVO */}
      {(isPremium15 || isPremium25 || isDealer) && (
        <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-amber-700" />
              <label className="text-xs font-bold text-amber-900">
                Vídeo do Produto em Funcionamento (Incluso no seu Plano)
              </label>
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
              Alta Conversão
            </span>
          </div>
          <input
            type="url"
            value={currentVideoUrl}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="Link do vídeo (YouTube, Google Drive ou WhatsApp) ex: https://youtu.be/..."
            className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
          />

          {/* TOUR 360° PARA PLANO R$ 59,90 OU REVENDEDOR */}
          {(isPremium25 || isDealer30) && (
            <div className="pt-2 border-t border-amber-200/70">
              <div className="flex items-center gap-2 mb-1">
                <Compass className="w-4 h-4 text-amber-800" />
                <label className="text-xs font-bold text-amber-900">
                  Tour Virtual 360° da Cabine ou Máquina (Exclusivo Pro)
                </label>
              </div>
              <input
                type="url"
                value={currentTour360Url}
                onChange={(e) => handleTour360UrlChange(e.target.value)}
                placeholder="Link do tour 360° ou fotos panorâmicas (Matterport, Kuula ou Drive)"
                className="w-full px-3 py-2 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SEÇÃO DE CONVERSÃO: GATILHO MENTAL & COMPARAÇÃO VISUAL LADO A LADO       */}
      {/* ========================================================================= */}
      <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
        
        {/* BANNER COM GATILHO MENTAL FORTE */}
        <div className="p-3.5 bg-gradient-to-r from-orange-600 via-amber-600 to-slate-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                Gatilho de Conversão Rápida
              </span>
            </div>
            <h4 className="text-sm sm:text-base font-black font-display leading-tight">
              🔥 92% dos anúncios Premium vendem em até 14 dias
            </h4>
            <p className="text-[11px] text-amber-100 max-w-xl">
              Em máquinas e caminhões de R$ 100k a R$ 5M, 2 fotos não transmitem segurança para o comprador viajar ou transferir sinal. O Premium é o investimento que fecha a venda.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openUpgradeModal('premium_15')}
            className="px-4 py-2 rounded-xl bg-white text-orange-950 font-black text-xs hover:bg-orange-50 active:scale-95 transition-all shadow-md shrink-0 cursor-pointer"
          >
            Venda até 5x mais rápido com o Premium
          </button>
        </div>

        {/* COMPARAÇÃO VISUAL LADO A LADO: GRÁTIS VS PREMIUM */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
          
          {/* 1. PLANO GRATUITO (APENAS PARA EXPERIMENTAR) */}
          <div className={`p-4 rounded-2xl border flex flex-col justify-between transition-all ${
            activeTier === 'free'
              ? 'border-slate-300 bg-slate-50/80 ring-1 ring-slate-300'
              : 'border-slate-200 bg-white opacity-80'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Grátis (Experimentar)
                </span>
                {activeTier === 'free' && (
                  <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                    Plano Atual
                  </span>
                )}
              </div>

              <div className="mb-3">
                <div className="text-2xl font-black text-slate-900 font-display">
                  R$ 0
                </div>
                <div className="text-[11px] text-slate-400">
                  Apenas 2 fotos grátis
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-600 mb-4">
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span><strong>Apenas 2 fotos</strong> (máx. 3 com vídeo)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span>Anúncio no feed normal</span>
                </li>
                <li className="flex items-center gap-2 text-rose-500 font-medium">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Sem destaque nas buscas</span>
                </li>
                <li className="flex items-center gap-2 text-rose-500 font-medium">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Sem vídeo do produto</span>
                </li>
                <li className="flex items-center gap-2 text-rose-500 font-medium">
                  <X className="w-3.5 h-3.5 shrink-0" />
                  <span>Sem selo de verificação</span>
                </li>
              </ul>
            </div>

            <div className="text-[11px] text-slate-500 italic p-2 bg-slate-100 rounded-lg text-center">
              Insuficiente para vender ativos de alto valor com rapidez
            </div>
          </div>

          {/* 2. PLANO PREMIUM R$ 29,90 (O QUE GERA RECEITA & RESULTADO) */}
          <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all relative ${
            isPremium15
              ? 'border-orange-500 bg-orange-50/50 ring-2 ring-orange-500 shadow-md'
              : 'border-orange-500 bg-white hover:bg-orange-50/30 shadow-xs'
          }`}>
            <div className="absolute top-0 right-0 bg-orange-500 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
              Mais Vendido
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Star className="w-4 h-4 text-orange-600 fill-orange-500" />
                <span className="text-xs font-black uppercase tracking-wider text-orange-700">
                  Premium 15 Fotos
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 font-display">
                    R$ 29,90
                  </span>
                  <span className="text-[11px] text-slate-500">
                    pagamento único
                  </span>
                </div>
                <div className="text-[11px] text-orange-800 font-semibold">
                  Retorno comprovado para vender mais rápido
                </div>
              </div>

              <ul className="space-y-2 text-xs text-slate-800 mb-4">
                <li className="flex items-center gap-2 font-black text-slate-900">
                  <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>Até 15 fotos completas em HD</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-700">
                  <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>1 Vídeo do produto em funcionamento</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-orange-800">
                  <Check className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                  <span>Destaque por 7 dias no feed e busca</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-amber-700">
                  <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Selo oficial "Premium"</span>
                </li>
              </ul>
            </div>

            {/* BOTÃO DESTACADO SOLICITADO */}
            <button
              type="button"
              onClick={() => openUpgradeModal('premium_15')}
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-black text-xs transition-all shadow-md shadow-orange-500/25 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 fill-white" />
              <span>{isPremium15 ? 'Plano Ativo (Gerenciar)' : 'Venda até 5x mais rápido com o Premium'}</span>
            </button>
          </div>

          {/* 3. PLANO PREMIUM R$ 59,90 (MÁXIMA EXPOSIÇÃO + PUSH) */}
          <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between transition-all relative ${
            isPremium25
              ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500 shadow-md'
              : 'border-slate-800 bg-slate-900 text-white shadow-sm'
          }`}>
            <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-orange-500 text-slate-950 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
              Super Destaque
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Crown className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className={`text-xs font-black uppercase tracking-wider ${isPremium25 ? 'text-amber-800' : 'text-amber-400'}`}>
                  Premium Pro 25 Fotos
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-baseline gap-1">
                  <span className={`text-2xl font-black font-display ${isPremium25 ? 'text-slate-900' : 'text-white'}`}>
                    R$ 59,90
                  </span>
                  <span className={`text-[11px] ${isPremium25 ? 'text-slate-500' : 'text-slate-400'}`}>
                    pagamento único
                  </span>
                </div>
                <div className={`text-[11px] font-semibold ${isPremium25 ? 'text-amber-800' : 'text-amber-300'}`}>
                  Para quem precisa vender com máxima urgência
                </div>
              </div>

              <ul className={`space-y-2 text-xs mb-4 ${isPremium25 ? 'text-slate-800' : 'text-slate-200'}`}>
                <li className="flex items-center gap-2 font-bold">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Até 25 fotos completas de todos os ângulos</span>
                </li>
                <li className="flex items-center gap-2 font-bold">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Vídeo demonstrativo + Tour 360°</span>
                </li>
                <li className="flex items-center gap-2 font-bold">
                  <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Destaque por 14 dias no topo</span>
                </li>
                <li className="flex items-center gap-2 font-bold text-amber-300">
                  <BellRing className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Notificação push direta para compradores</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => openUpgradeModal('premium_25')}
              className={`w-full py-2.5 rounded-xl font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                isPremium25
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-600'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{isPremium25 ? 'Plano Ativo (Gerenciar)' : 'Upgrade Premium Pro (R$ 59,90)'}</span>
            </button>
          </div>
        </div>

        {/* 4. PLANO REVENDEDOR MENSAL (PARA LOJAS & CONCESSIONÁRIAS) */}
        <div className="p-4 bg-gradient-to-r from-blue-900 to-slate-900 text-white rounded-2xl border border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-left">
            <div className="p-2.5 rounded-xl bg-blue-600/30 text-blue-300 border border-blue-500/30 shrink-0">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-blue-300">
                  Planos Mensais para Revendas & Concessionárias
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  A partir de R$ 199/mês
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                10 ou 30 anúncios simultâneos + fotos ilimitadas + selo "Revenda Verificada" + painel de métricas.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsDealerModalOpen(true)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-md"
          >
            Ver Planos Revendedor (R$ 199 e R$ 399)
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL DE CHECKOUT / PAGAMENTO VIA PIX E CARTÃO                            */}
      {/* ========================================================================= */}
      {isUpgradeModalOpen && (
        <div 
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsUpgradeModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fechar */}
            <button
              type="button"
              onClick={() => setIsUpgradeModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Cabeçalho */}
            <div className="p-6 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-5 h-5 fill-white text-white" />
                <span className="text-xs font-black uppercase tracking-wider text-orange-100">
                  Upgrade de Alta Conversão
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-display leading-tight">
                {targetUpgradeTier === 'premium_25'
                  ? 'Plano Premium Pro (25 Fotos + Push + Tour 360°)'
                  : targetUpgradeTier === 'dealer_10'
                  ? 'Plano Revenda Básico (10 Anúncios)'
                  : targetUpgradeTier === 'dealer_30'
                  ? 'Plano Revenda Pro (30 Anúncios)'
                  : 'Plano Premium (15 Fotos + Destaque 7 Dias)'}
              </h3>
              <p className="text-xs text-orange-100 mt-1">
                Investimento de{' '}
                <strong className="text-white text-base">
                  {getTierPriceLabel(targetUpgradeTier)}
                </strong>{' '}
                para fechar a venda do seu ativo.
              </p>
            </div>

            {/* Gatilho mental & Resumo */}
            <div className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 font-medium flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                <span>
                  <strong>Garantia de Performance:</strong> 92% dos anúncios com pacote Premium fecham negócio em até 14 dias.
                </span>
              </div>

              {/* Seletor de Método de Pagamento: PIX vs CARTÃO */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Forma de Pagamento
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('pix')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'pix'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900 shadow-xs ring-1 ring-emerald-600'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-4 h-4 text-emerald-600" />
                    <span>Pix Instantâneo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      paymentMethod === 'card'
                        ? 'border-orange-500 bg-orange-50 text-orange-900 shadow-xs ring-1 ring-orange-500'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-orange-600" />
                    <span>Cartão de Crédito</span>
                  </button>
                </div>
              </div>

              {/* TELA DO PIX */}
              {paymentMethod === 'pix' ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                  <div className="w-32 h-32 mx-auto bg-white p-2 rounded-xl border border-slate-300 shadow-xs flex items-center justify-center">
                    <div className="w-full h-full bg-slate-900 rounded-lg p-2 flex flex-col justify-between items-center text-white">
                      <QrCode className="w-16 h-16 text-white my-auto" />
                      <span className="text-[8px] font-mono tracking-tighter">PIX EU QUERO PAY</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Escaneie o QR Code ou copie a chave Pix:
                    </span>
                    <div className="mt-1 flex items-center gap-2 max-w-sm mx-auto">
                      <input
                        type="text"
                        readOnly
                        value="00020126580014BR.GOV.BCB.PIX0136euqueropay-premium-conversion-fast"
                        className="w-full px-2.5 py-1 text-[10px] font-mono bg-white border border-slate-300 rounded-lg text-slate-600 truncate"
                      />
                      <button
                        type="button"
                        onClick={handleCopyPix}
                        className="px-3 py-1 rounded-lg bg-slate-900 text-white text-xs font-bold shrink-0 hover:bg-slate-800 cursor-pointer flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* TELA DO CARTÃO DE CRÉDITO */
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-left">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-600">Número do Cartão:</label>
                    <input
                      type="text"
                      placeholder="4532 •••• •••• 8821"
                      defaultValue="4532 8910 2341 8821"
                      className="w-full mt-0.5 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">Validade:</label>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        defaultValue="08/29"
                        className="w-full mt-0.5 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-600">CVV:</label>
                      <input
                        type="text"
                        placeholder="123"
                        defaultValue="789"
                        className="w-full mt-0.5 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* BOTÃO DE CONFIRMAÇÃO DO PAGAMENTO */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isSimulatingPayment}
                  onClick={handleConfirmPaymentSimulation}
                  className="w-full py-3.5 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-[0.99] text-white font-black text-sm transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isSimulatingPayment ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processando confirmação bancária...</span>
                    </div>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>
                        Confirmar Pagamento de {getTierPriceLabel(targetUpgradeTier)}
                      </span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-slate-400 text-center mt-2">
                  Ambiente seguro · Liberação imediata de fotos, vídeo e destaques
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL PLANOS REVENDEDOR (R$ 199/MÊS E R$ 399/MÊS)                         */}
      {/* ========================================================================= */}
      {isDealerModalOpen && (
        <div 
          className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsDealerModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div 
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsDealerModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 bg-slate-900 text-white">
              <div className="flex items-center gap-2 mb-1 text-blue-400">
                <Building className="w-5 h-5" />
                <span className="text-xs font-black uppercase tracking-wider">
                  Concessionárias, Frotas & Lojas
                </span>
              </div>
              <h3 className="text-2xl font-black font-display">
                Planos para Revendedores Especializados
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                Cadastre todo seu estoque de máquinas pesadas, implementos e caminhões sem limites de fotos por anúncio.
              </p>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. REVENDA BÁSICO (R$ 199/MÊS) */}
                <div className="p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white flex flex-col justify-between transition-all">
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-700 block mb-1">
                      Revenda Básico
                    </span>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-black text-slate-900 font-display">
                        R$ 199
                      </span>
                      <span className="text-xs text-slate-500">/mês</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-700 mb-4">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>10 anúncios ativos</strong> simultâneos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>Fotos ilimitadas</strong> em todos os anúncios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Selo oficial <strong>"Revenda Verificada"</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Painel com estatísticas de visualizações e cliques</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTier('dealer_10');
                      setIsDealerModalOpen(false);
                      setToastMessage('🛡️ Plano Revenda Básico (R$ 199/mês) ativado!');
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-xs"
                  >
                    Ativar Revenda Básico (R$ 199/mês)
                  </button>
                </div>

                {/* 2. REVENDA PRO (R$ 399/MÊS) */}
                <div className="p-4 rounded-2xl border-2 border-blue-600 bg-blue-50/40 flex flex-col justify-between transition-all relative">
                  <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-bl-xl shadow-xs">
                    Melhor Custo-Benefício
                  </div>

                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-blue-900 block mb-1">
                      Revenda Pro
                    </span>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-black text-slate-900 font-display">
                        R$ 399
                      </span>
                      <span className="text-xs text-slate-500">/mês</span>
                    </div>

                    <ul className="space-y-2 text-xs text-slate-800 mb-4">
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>30 anúncios ativos</strong> simultâneos</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>Fotos ilimitadas + Vídeos + Tour 360°</strong></span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>Destaque automático</strong> em todos os anúncios</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span>Selo <strong>"Revenda Verificada"</strong> de destaque</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <span><strong>Gerente de conta dedicado</strong> via WhatsApp</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTier('dealer_30');
                      setIsDealerModalOpen(false);
                      setToastMessage('🚀 Plano Revenda Pro (R$ 399/mês) ativado!');
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs transition-colors cursor-pointer shadow-md"
                  >
                    Ativar Revenda Pro (R$ 399/mês)
                  </button>
                </div>

              </div>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsDealerModalOpen(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  Continuar com anúncio individual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE DESBLOQUEIO DO VÍDEO NO ANÚNCIO (R$ 19,90) */}
      <VideoUnlockModal
        isOpen={isVideoUnlockModalOpen}
        onClose={() => setIsVideoUnlockModalOpen(false)}
        onUnlockSuccess={() => {
          setIsAnnounceVideoUnlocked(true);
          if (!currentVideoUrl) {
            handleVideoUrlChange('https://youtu.be/Jmsm2SCzn1o');
          }
          setToastMessage('🎉 Vídeo de até 30s desbloqueado! Vídeos vendem até 5x mais rápido.');
        }}
        itemTitle="Vídeo de até 30s da Máquina Funcionando"
        itemCity="Alta Conversão · Vende 5x mais rápido"
      />
    </div>
  );
};
