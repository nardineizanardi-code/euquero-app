import React, { useState, useEffect } from 'react';
import { 
  Sparkles, ExternalLink, ShieldCheck, ChevronRight, X, 
  Info, TrendingUp, DollarSign, MousePointerClick, Eye, Award
} from 'lucide-react';

export interface AdMobBannerData {
  id: string;
  tag: string;
  category: 'motorola' | 'caterpillar' | 'pneus' | 'financiamento' | 'randon';
  sponsor: string;
  headline: string;
  subtitle: string;
  ctaText: string;
  badge: string;
  bgGradient: string;
  accentColor: string;
  imageUrl?: string;
  adUrl: string;
  cpcValue: number; // Valor gerado por clique em R$ (ex: R$ 0,45 - R$ 1,20)
}

// Banners oficiais solicitados na regra (Motorola edge 70 fusion, Peças Caterpillar, Pneus Pesados, Financiamento Frotas, Implementos Randon)
export const ADMOB_BANNERS_LIST: AdMobBannerData[] = [
  {
    id: 'admob-motorola-edge70',
    tag: 'ANÚNCIO · GOOGLE ADMOB',
    category: 'motorola',
    sponsor: 'Motorola Brasil',
    headline: 'SINTA A EMOÇÃO: SUA VISÃO EM ALTO NÍVEL',
    subtitle: 'Novo motorola edge 70 fusion com câmera Sony LYTIA, bateria para obra e resistência IP68 militar.',
    ctaText: 'Saiba mais',
    badge: 'Oferta Especial',
    bgGradient: 'from-slate-950 via-slate-900 to-indigo-950',
    accentColor: '#38BDF8',
    imageUrl: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop&q=80',
    adUrl: 'https://www.motorola.com.br/edge',
    cpcValue: 0.85
  },
  {
    id: 'admob-cat-parts',
    tag: 'ANÚNCIO · GOOGLE ADMOB',
    category: 'caterpillar',
    sponsor: 'Peças & Filtros Caterpillar Original',
    headline: 'PEÇAS ORIGINAIS CAT COM ATÉ 35% OFF',
    subtitle: 'Filtros, esteiras, pinos, buchas e dentes para CAT 320D e Linha Amarela com entrega em 24h em SC e SP.',
    ctaText: 'Cotar Peças',
    badge: 'Frete Grátis SC/PR/SP',
    bgGradient: 'from-slate-950 via-zinc-900 to-amber-950',
    accentColor: '#FFB800',
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    adUrl: 'https://parts.cat.com',
    cpcValue: 1.15
  },
  {
    id: 'admob-pneus-carga',
    tag: 'ANÚNCIO · GOOGLE ADMOB',
    category: 'pneus',
    sponsor: 'Pneus Michelin & Bridgestone Carga',
    headline: 'PNEUS 295/80R22.5 E OTR PARA MÁQUINAS',
    subtitle: 'Direcionais e tração para caminhões Volvo, Scania e pás carregadeiras em até 10x sem juros no CNPJ.',
    ctaText: 'Ver Tabela Direta',
    badge: 'Garantia 5 Anos',
    bgGradient: 'from-slate-950 via-slate-900 to-emerald-950',
    accentColor: '#10B981',
    imageUrl: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80',
    adUrl: 'https://www.michelin.com.br/caminhoes',
    cpcValue: 0.75
  },
  {
    id: 'admob-financiamento-pesados',
    tag: 'ANÚNCIO · GOOGLE ADMOB',
    category: 'financiamento',
    sponsor: 'Crédito Volvo, Scania & Mercedes',
    headline: 'FINANCIAMENTO & REFINANCIAMENTO DE FROTAS',
    subtitle: 'Taxas exclusivas CDC/Finame para Cavalo Mecânico FH 540 e Scania R450 com carência de até 90 dias.',
    ctaText: 'Simular Parcelas',
    badge: 'Aprovação Rápida',
    bgGradient: 'from-slate-950 via-slate-900 to-blue-950',
    accentColor: '#60A5FA',
    imageUrl: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=600&auto=format&fit=crop&q=80',
    adUrl: 'https://www.bancovfs.com.br',
    cpcValue: 1.40
  },
  {
    id: 'admob-implementos-randon',
    tag: 'ANÚNCIO · GOOGLE ADMOB',
    category: 'randon',
    sponsor: 'Implementos Rodoviários Randon & Guerra',
    headline: 'PRANCHAS 3 EIXOS & CARRETAS VANDERLÉIA',
    subtitle: 'Prontas para engatar: pranchas rebaixadas para transporte de máquinas com pescoço removível.',
    ctaText: 'Ver Estoque Disponível',
    badge: 'Faturamento Direto',
    bgGradient: 'from-slate-950 via-zinc-900 to-orange-950',
    accentColor: '#FF6B00',
    imageUrl: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?w=600&auto=format&fit=crop&q=80',
    adUrl: 'https://www.randon.com.br',
    cpcValue: 0.95
  }
];

// Helper para gerenciar estatísticas de cliques e monetização no localStorage
export interface AdMobMetrics {
  clicksToday: number;
  revenueToday: number;
  impressionsToday: number;
  lastResetDate: string;
}

export const getAdMobMetrics = (): AdMobMetrics => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10);
    const saved = localStorage.getItem('euquero_admob_metrics');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.lastResetDate === todayStr) {
        return parsed;
      }
    }
    // Valor inicial padrão para a demonstração da regra: 120 cliques
    const initial: AdMobMetrics = {
      clicksToday: 120,
      revenueToday: 114.80, // 120 cliques x média R$ 0,95
      impressionsToday: 1840,
      lastResetDate: todayStr
    };
    localStorage.setItem('euquero_admob_metrics', JSON.stringify(initial));
    return initial;
  } catch (e) {
    return {
      clicksToday: 120,
      revenueToday: 114.80,
      impressionsToday: 1840,
      lastResetDate: new Date().toISOString().slice(0, 10)
    };
  }
};

export const registerAdMobClick = (cpcValue: number): AdMobMetrics => {
  const current = getAdMobMetrics();
  const updated: AdMobMetrics = {
    ...current,
    clicksToday: current.clicksToday + 1,
    revenueToday: Number((current.revenueToday + cpcValue).toFixed(2)),
    impressionsToday: current.impressionsToday + 1
  };
  try {
    localStorage.setItem('euquero_admob_metrics', JSON.stringify(updated));
  } catch (e) {}
  return updated;
};

// Checa se o usuário atual é Premium ou comprou vídeo (R$ 19,90)
export const checkIsUserAdFree = (): boolean => {
  try {
    const isVideoUnlockedCat = localStorage.getItem('video_pago_cat320d') === 'true';
    const isPremiumUser = localStorage.getItem('euquero_user_premium') === 'true';
    const unlockedVideos = localStorage.getItem('euquero_unlocked_videos');
    const hasAnyUnlocked = unlockedVideos ? Object.keys(JSON.parse(unlockedVideos)).length > 0 : false;
    return isVideoUnlockedCat || isPremiumUser || hasAnyUnlocked;
  } catch (e) {
    return false;
  }
};

/**
 * 1. BANNER ADMOB ENTRE CARDS DO FEED (A CADA 4 MÁQUINAS)
 */
interface FeedAdMobBannerProps {
  bannerIndex?: number;
  onAdClick?: (banner: AdMobBannerData) => void;
}

export const FeedAdMobBanner: React.FC<FeedAdMobBannerProps> = ({
  bannerIndex = 0,
  onAdClick
}) => {
  const banner = ADMOB_BANNERS_LIST[bannerIndex % ADMOB_BANNERS_LIST.length];
  const [clicked, setClicked] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    registerAdMobClick(banner.cpcValue);
    setClicked(true);
    if (onAdClick) onAdClick(banner);
    setTimeout(() => {
      window.open(banner.adUrl, '_blank', 'noopener,noreferrer');
      setClicked(false);
    }, 250);
  };

  return (
    <div className="relative my-8 rounded-[24px] overflow-hidden border-2 border-slate-700/60 shadow-xl group transition-all duration-300 hover:border-slate-500 bg-slate-900">
      {/* Background estilizado com gradiente */}
      <div className={`p-5 sm:p-6 bg-gradient-to-br ${banner.bgGradient} text-white relative overflow-hidden`}>
        {/* Glow de fundo */}
        <div 
          className="absolute -right-16 -top-16 w-60 h-60 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: banner.accentColor }}
        />

        {/* Topo do Banner: Tag AdMob + Patrocinador + Ícone info */}
        <div className="relative z-10 flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-black/40 border border-white/20 text-slate-300 font-mono flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              {banner.tag}
            </span>
            <span className="text-xs font-semibold text-slate-300">
              {banner.sponsor}
            </span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/10 text-white/90 border border-white/15">
            {banner.badge}
          </span>
        </div>

        {/* Conteúdo Central */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="sm:col-span-2 space-y-2">
            <h3 
              className="text-base sm:text-lg font-black tracking-tight leading-snug uppercase"
              style={{ color: banner.accentColor }}
            >
              {banner.headline}
            </h3>
            <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed">
              {banner.subtitle}
            </p>
          </div>

          {/* Imagem do produto patrocinado */}
          {banner.imageUrl && (
            <div className="hidden sm:block relative rounded-xl overflow-hidden border border-white/20 shadow-md h-28 bg-black/50">
              <img 
                src={banner.imageUrl} 
                alt={banner.sponsor}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </div>
          )}
        </div>

        {/* Rodapé do Banner: Botão Saiba mais e link externo */}
        <div className="relative z-10 mt-4 pt-3 border-t border-white/15 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Anunciante verificado Google Partner</span>
          </div>

          <button
            type="button"
            onClick={handleClick}
            className={`px-4 py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
              clicked 
                ? 'bg-emerald-500 text-white scale-95' 
                : 'bg-white hover:bg-slate-100 text-slate-950'
            }`}
          >
            <span>{banner.ctaText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 2. BANNER FIXO RODAPÉ ESTILO APP DE MÚSICA
 * "SINTA A EMOÇÃO SUA VISÃO EM ALTO NÍVEL - Saiba mais"
 * Rotação inteligente entre Motorola edge 70 fusion, Peças Caterpillar, Pneus, Financiamento e Implementos
 */
interface FixedFooterAdMobProps {
  onAdClick?: (banner: AdMobBannerData) => void;
  onUpgradePremium?: () => void;
}

export const FixedFooterAdMob: React.FC<FixedFooterAdMobProps> = ({
  onAdClick,
  onUpgradePremium
}) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);
  const [clicked, setClicked] = useState(false);

  // Alterna o anúncio a cada 10 segundos igual app de música
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIdx((prev) => (prev + 1) % ADMOB_BANNERS_LIST.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  if (isDismissed) return null;

  const banner = ADMOB_BANNERS_LIST[currentIdx];

  const handleCta = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    registerAdMobClick(banner.cpcValue);
    setClicked(true);
    if (onAdClick) onAdClick(banner);
    setTimeout(() => {
      window.open(banner.adUrl, '_blank', 'noopener,noreferrer');
      setClicked(false);
    }, 250);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t-2 border-amber-500/40 text-white shadow-[0_-8px_30px_rgba(0,0,0,0.5)] transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        
        {/* Esquerda: Identificador de Anúncio e Imagem Mini */}
        <div className="flex items-center gap-3 min-w-0">
          {banner.imageUrl && (
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg overflow-hidden border border-white/20 shrink-0 hidden xs:block bg-black">
              <img 
                src={banner.imageUrl} 
                alt={banner.sponsor}
                className="w-full h-full object-cover" 
              />
            </div>
          )}

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 tracking-wider font-mono">
                AdMob
              </span>
              <span className="text-[11px] font-bold text-slate-300 truncate hidden sm:inline">
                {banner.sponsor}
              </span>
            </div>

            {/* Texto solicitado igual o print da Motorola */}
            <p className="text-xs sm:text-sm font-black text-white truncate tracking-tight mt-0.5">
              <span style={{ color: banner.accentColor }} className="mr-1.5">
                {banner.headline.split(':')[0]}:
              </span>
              <span>{banner.headline.split(':')[1] || banner.headline}</span>
            </p>
          </div>
        </div>

        {/* Direita: Botão Saiba Mais + Botão Fechar / Tirar Anúncios */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCta}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
              clicked 
                ? 'bg-emerald-500 text-white scale-95' 
                : 'bg-white hover:bg-slate-100 text-slate-950'
            }`}
          >
            <span>{banner.ctaText}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          {/* Remover anúncios (Upgrade Premium / R$ 19,90) */}
          <button
            type="button"
            onClick={onUpgradePremium}
            className="hidden md:inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition-colors cursor-pointer border border-slate-700"
            title="Tirar anúncios com plano Premium ou Vídeo R$ 19,90"
          >
            <Award className="w-3 h-3 text-amber-400" />
            <span>Sem Anúncios</span>
          </button>

          {/* Fechar temporário */}
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};

/**
 * 3. PAINEL DO ADMIN COM MÉTRICAS DE MONETIZAÇÃO ADMOB
 * "Hoje: 501 compradores ativos, 120 cliques banner, R$ 114,80"
 */
interface AdMobAdminBadgeProps {
  activeBuyersCount: number;
  onOpenDetails?: () => void;
}

export const AdMobAdminBadge: React.FC<AdMobAdminBadgeProps> = ({
  activeBuyersCount,
  onOpenDetails
}) => {
  const [metrics, setMetrics] = useState<AdMobMetrics>(getAdMobMetrics());

  useEffect(() => {
    const handleStorage = () => {
      setMetrics(getAdMobMetrics());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return (
    <div 
      onClick={onOpenDetails}
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 text-white border border-slate-700 hover:border-amber-400/60 shadow-xs cursor-pointer text-xs font-medium transition-all group"
      title="Relatório de Monetização Google AdMob"
    >
      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="font-bold text-amber-400 font-mono">Google AdMob:</span>
      <span className="text-slate-300">
        Hoje: <strong className="text-white">{activeBuyersCount}</strong> compradores ativos,{' '}
        <strong className="text-[#38BDF8]">{metrics.clicksToday} cliques</strong> banner,{' '}
        <strong className="text-emerald-400 font-mono">R$ {metrics.revenueToday.toFixed(2).replace('.', ',')}</strong>
      </span>
      <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
    </div>
  );
};

/**
 * 4. MODAL DETALHADO DO PAINEL DO ADMIN MONETIZAÇÃO
 */
interface AdMobMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeBuyersCount: number;
}

export const AdMobMetricsModal: React.FC<AdMobMetricsModalProps> = ({
  isOpen,
  onClose,
  activeBuyersCount
}) => {
  const [metrics, setMetrics] = useState<AdMobMetrics>(getAdMobMetrics());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="bg-slate-900 border-2 border-slate-700 text-white rounded-[24px] max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">
              Painel de Monetização Google AdMob
            </h3>
            <p className="text-xs text-slate-400">
              Receita em tempo real com anúncios entre cards e banner rodapé
            </p>
          </div>
        </div>

        {/* Quadro Resumo Solicitado */}
        <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 mb-5">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
            Status Oficial do Dia
          </div>
          <div className="text-sm sm:text-base font-bold text-white bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            Hoje: <span className="text-orange-400 font-black">{activeBuyersCount} compradores ativos</span>,{' '}
            <span className="text-sky-400 font-black">{metrics.clicksToday} cliques banner</span>,{' '}
            <span className="text-emerald-400 font-black font-mono">R$ {metrics.revenueToday.toFixed(2).replace('.', ',')}</span>
          </div>
        </div>

        {/* Estatísticas Detalhadas */}
        <div className="grid grid-cols-2 gap-3 mb-5 text-xs">
          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <Eye className="w-3.5 h-3.5 text-slate-400" />
              <span>Impressões Hoje</span>
            </div>
            <span className="text-lg font-black font-mono text-white">
              {metrics.impressionsToday.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <MousePointerClick className="w-3.5 h-3.5 text-sky-400" />
              <span>CTR Médio</span>
            </div>
            <span className="text-lg font-black font-mono text-sky-400">
              {((metrics.clicksToday / Math.max(metrics.impressionsToday, 1)) * 100).toFixed(1)}%
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>CPC Médio</span>
            </div>
            <span className="text-lg font-black font-mono text-emerald-400">
              R$ {(metrics.revenueToday / Math.max(metrics.clicksToday, 1)).toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="text-slate-400 flex items-center gap-1 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Isenção Premium</span>
            </div>
            <span className="text-xs font-bold text-amber-300">
              Vídeo R$19,90 = Sem Ad
            </span>
          </div>
        </div>

        {/* Regra de Ouro Explicada */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1 mb-5">
          <p className="font-bold flex items-center gap-1.5 text-amber-300">
            <Info className="w-4 h-4 shrink-0" />
            Regra de Exibição Inteligente:
          </p>
          <p className="text-[11px] leading-relaxed text-slate-300">
            • Usuário grátis (30 dias grátis) visualiza anúncios entre as máquinas e no rodapé.<br />
            • Usuário que pagou taxa de R$ 19,90 (vídeo verificado) ou plano premium NÃO vê propagandas.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-900 font-black text-xs rounded-xl transition-all cursor-pointer"
        >
          Fechar Painel
        </button>
      </div>
    </div>
  );
};
