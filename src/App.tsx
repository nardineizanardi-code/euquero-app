import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { CategoryCarousel } from './components/CategoryCarousel';
import { AdCard } from './components/AdCard';
import { ItemDetailModal } from './components/ItemDetailModal';
import { WizardModal } from './components/WizardModal';
import { PushNotificationBanner, PushAlert } from './components/PushNotificationBanner';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NegotiationChatModal } from './components/NegotiationChatModal';
import { ConversationsView } from './components/ConversationsView';
import { Footer } from './components/Footer';
import { PretendentesTinderPanel, PretendenteLead } from './components/PretendentesTinderPanel';
import { VideoUnlockModal } from './components/VideoUnlockModal';
import { AntiBloqueioWhatsAppModal } from './components/AntiBloqueioWhatsAppModal';
import { MeusAnunciosView } from './components/MeusAnunciosView';
import { ActiveBuyersStats, calculateTotalShownBuyers } from './components/ActiveBuyersBanner';
import { 
  FeedAdMobBanner, 
  FixedFooterAdMob, 
  AdMobAdminBadge, 
  AdMobMetricsModal, 
  checkIsUserAdFree, 
  registerAdMobClick 
} from './components/GoogleAdMobBanner';
import { generateDisplayProductLink } from './utils/productLinks';
import { sanitizePublicProduct } from './services/productService';
import { updateProductMetaTags } from './utils/openGraphMeta';
import { 
  Flame, ChevronDown, ChevronUp, Sparkles, MessageSquare, 
  Heart, ArrowRight, Eye, RefreshCw, Layers 
} from 'lucide-react';

import { ListingItem, MatchResult, ChatMessage, IntentType } from './types';
import { INITIAL_LISTINGS, INITIAL_CHATS } from './data/initialData';
import { CATEGORIES, CATEGORY_CHIPS, isItemInCategory } from './data/categories';
import { findMatches } from './utils/matchingEngine';

// Base de pretendentes qualificados por categoria (Estilo Tinder / App de Encontro)
const ALL_PRETENDENTES_DATA: PretendenteLead[] = [
  // Linha Amarela (4 pretendentes)
  {
    id: 'lead-la-1',
    buyerCity: 'Campinas',
    buyerState: 'SP',
    buyerBudget: 500000,
    compatibilityScore: 95,
    urgency: 'imediata',
    desiredSubtype: 'Quer CAT 320D (Escavadeira)',
    realBuyerName: 'Eng. Rodrigo Silva',
    realBuyerPhone: '(19) 99844-3210',
    isUnlocked: false,
    videoRecordedDate: '26/09/2026',
    isVideoVerified: true,
    isExampleVideo: false
  },
  {
    id: 'lead-la-2',
    buyerCity: 'Belo Horizonte',
    buyerState: 'MG',
    buyerBudget: 390000,
    compatibilityScore: 88,
    urgency: 'imediata',
    desiredSubtype: 'Quer Retro JCB 3CX',
    realBuyerName: 'Carlos Mendes',
    realBuyerPhone: '(31) 98765-3319',
    isUnlocked: false,
    videoRecordedDate: '25/09/2026',
    isVideoVerified: true,
    isExampleVideo: false
  },
  {
    id: 'lead-la-3',
    buyerCity: 'Ribeirão Preto',
    buyerState: 'SP',
    buyerBudget: 500000,
    compatibilityScore: 93,
    urgency: '30_dias',
    desiredSubtype: 'Pá Carregadeira 2.0m³',
    realBuyerName: 'Gustavo Paiva',
    realBuyerPhone: '(16) 99188-3400',
    isUnlocked: false,
    videoRecordedDate: '27/09/2026',
    isVideoVerified: true,
    isExampleVideo: false
  },
  {
    id: 'lead-la-4',
    buyerCity: 'Sorocaba',
    buyerState: 'SP',
    buyerBudget: 620000,
    compatibilityScore: 91,
    urgency: 'imediata',
    desiredSubtype: 'Trator de Esteira D6N',
    realBuyerName: 'Marcos Silveira',
    realBuyerPhone: '(15) 99788-1020',
    isUnlocked: false,
    videoRecordedDate: '24/09/2026',
    isVideoVerified: false,
    isExampleVideo: true // Exemplo detectado para demonstrar o bloqueio e pedido de regravação
  },
  // Agrícola (5 pretendentes)
  {
    id: 'lead-ag-1',
    buyerCity: 'Sorriso',
    buyerState: 'MT',
    buyerBudget: 480000,
    compatibilityScore: 97,
    urgency: 'imediata',
    desiredSubtype: 'Trator Agrícola John Deere 7200J',
    realBuyerName: 'Marcos Vinicius Prado',
    realBuyerPhone: '(66) 98455-9011',
    isUnlocked: false
  },
  {
    id: 'lead-ag-2',
    buyerCity: 'Rio Verde',
    buyerState: 'GO',
    buyerBudget: 1850000,
    compatibilityScore: 95,
    urgency: '30_dias',
    desiredSubtype: 'Colheitadeira de Grãos S680',
    realBuyerName: 'Renato Siqueira',
    realBuyerPhone: '(64) 99233-1100',
    isUnlocked: false
  },
  {
    id: 'lead-ag-3',
    buyerCity: 'Cascavel',
    buyerState: 'PR',
    buyerBudget: 900000,
    compatibilityScore: 94,
    urgency: 'imediata',
    desiredSubtype: 'Pulverizador Autopropelido 32m',
    realBuyerName: 'Rodrigo Zancanaro',
    realBuyerPhone: '(45) 99811-2099',
    isUnlocked: false
  },
  {
    id: 'lead-ag-4',
    buyerCity: 'Rondonópolis',
    buyerState: 'MT',
    buyerBudget: 510000,
    compatibilityScore: 92,
    urgency: '30_dias',
    desiredSubtype: 'Plantadeira 18 Linhas',
    realBuyerName: 'Luciana Fontes',
    realBuyerPhone: '(66) 99778-5522',
    isUnlocked: false
  },
  {
    id: 'lead-ag-5',
    buyerCity: 'Dourados',
    buyerState: 'MS',
    buyerBudget: 450000,
    compatibilityScore: 90,
    urgency: 'pesquisando',
    desiredSubtype: 'Grade Aradora Pesada',
    realBuyerName: 'Eduardo Gouveia',
    realBuyerPhone: '(67) 99650-1122',
    isUnlocked: false
  },
  // Caminhão (7 pretendentes)
  {
    id: 'lead-cam-1',
    buyerCity: 'Rondonópolis',
    buyerState: 'MT',
    buyerBudget: 680000,
    compatibilityScore: 99,
    urgency: 'imediata',
    desiredSubtype: 'Cavalo Mecânico Volvo FH 540 6x4',
    realBuyerName: 'Leandro Vasconcelos',
    realBuyerPhone: '(65) 99650-8822',
    isUnlocked: false
  },
  {
    id: 'lead-cam-2',
    buyerCity: 'Campinas',
    buyerState: 'SP',
    buyerBudget: 620000,
    compatibilityScore: 96,
    urgency: 'imediata',
    desiredSubtype: 'Cavalo Mecânico Scania R450 6x2',
    realBuyerName: 'Wagner Silvano',
    realBuyerPhone: '(19) 98450-3321',
    isUnlocked: false
  },
  {
    id: 'lead-cam-3',
    buyerCity: 'Curitiba',
    buyerState: 'PR',
    buyerBudget: 420000,
    compatibilityScore: 95,
    urgency: 'imediata',
    desiredSubtype: 'Caminhão Truck 6x2 Caçamba',
    realBuyerName: 'Eduardo Gouveia',
    realBuyerPhone: '(41) 98845-6677',
    isUnlocked: false
  },
  {
    id: 'lead-cam-4',
    buyerCity: 'Belo Horizonte',
    buyerState: 'MG',
    buyerBudget: 710000,
    compatibilityScore: 94,
    urgency: '30_dias',
    desiredSubtype: 'Cavalo Mecânico 6x4 Traçado',
    realBuyerName: 'Carlos Rezende',
    realBuyerPhone: '(31) 99344-1234',
    isUnlocked: false
  },
  {
    id: 'lead-cam-5',
    buyerCity: 'São Paulo',
    buyerState: 'SP',
    buyerBudget: 450000,
    compatibilityScore: 93,
    urgency: 'imediata',
    desiredSubtype: 'Truck 8x2 Caçamba ou Baú',
    realBuyerName: 'Antônio Ferreira',
    realBuyerPhone: '(11) 99120-7788',
    isUnlocked: false
  },
  {
    id: 'lead-cam-6',
    buyerCity: 'Maringá',
    buyerState: 'PR',
    buyerBudget: 590000,
    compatibilityScore: 92,
    urgency: '30_dias',
    desiredSubtype: 'Cavalo Scania Highline 6x2',
    realBuyerName: 'Roberto Albuquerque',
    realBuyerPhone: '(44) 99821-4402',
    isUnlocked: false
  },
  {
    id: 'lead-cam-7',
    buyerCity: 'Goiânia',
    buyerState: 'GO',
    buyerBudget: 650000,
    compatibilityScore: 91,
    urgency: 'imediata',
    desiredSubtype: 'Volvo FH 460 / 540',
    realBuyerName: 'Renato Siqueira',
    realBuyerPhone: '(62) 99233-1100',
    isUnlocked: false
  },
  // Implementos Rodoviários (4 pretendentes)
  {
    id: 'lead-imp-1',
    buyerCity: 'Cascavel',
    buyerState: 'PR',
    buyerBudget: 240000,
    compatibilityScore: 97,
    urgency: 'imediata',
    desiredSubtype: 'Carreta Graneleiro 3 Eixos',
    realBuyerName: 'Dra. Vanessa Silveira',
    realBuyerPhone: '(41) 99112-8877',
    isUnlocked: false
  },
  {
    id: 'lead-imp-2',
    buyerCity: 'Sorocaba',
    buyerState: 'SP',
    buyerBudget: 220000,
    compatibilityScore: 96,
    urgency: 'imediata',
    desiredSubtype: 'Carreta Basculante 40m³ Pastre',
    realBuyerName: 'Marcos Silveira',
    realBuyerPhone: '(15) 99788-1020',
    isUnlocked: false
  },
  {
    id: 'lead-imp-3',
    buyerCity: 'Rondonópolis',
    buyerState: 'MT',
    buyerBudget: 280000,
    compatibilityScore: 94,
    urgency: '30_dias',
    desiredSubtype: 'Bitrem Graneleiro 9 Eixos',
    realBuyerName: 'Leandro Vasconcelos',
    realBuyerPhone: '(65) 99650-8822',
    isUnlocked: false
  },
  {
    id: 'lead-imp-4',
    buyerCity: 'Paulínia',
    buyerState: 'SP',
    buyerBudget: 260000,
    compatibilityScore: 92,
    urgency: 'pesquisando',
    desiredSubtype: 'Carreta Prancha 3 Eixos Rebaixada',
    realBuyerName: 'Wagner Silvano',
    realBuyerPhone: '(19) 98450-3321',
    isUnlocked: false
  }
];

export default function App() {
  // Navigation: 'home' (Feed principal), 'chat' (Negociações diretas) ou 'meus_anuncios' (/meus-anuncios)
  const [currentView, setCurrentView] = useState<'home' | 'chat' | 'meus_anuncios'>(() => {
    if (typeof window !== 'undefined' && window.location) {
      if (window.location.pathname === '/meus-anuncios' || window.location.search.includes('meus-anuncios')) {
        return 'meus_anuncios';
      }
    }
    return 'home';
  });

  // Search & Category Filters - Default para 'linha_amarela' conforme especificação
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('linha_amarela');
  const [intentFilter, setIntentFilter] = useState<'all' | 'buy' | 'sell'>('all');

  // Favorite items tracking
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

  // Listings state with LocalStorage e versionamento limpo
  const [listings, setListings] = useState<ListingItem[]>(() => {
    try {
      const savedV8 = localStorage.getItem('euquero_listings_v8');
      if (savedV8) {
        const parsed: ListingItem[] = JSON.parse(savedV8);
        if (parsed.length > 0) {
          // Sanitize any lingering fechadura lock image to the yellow Caterpillar 320D 2019 excavator
          return parsed.map((item) => ({
            ...item,
            images: (item.images || []).map((img) =>
              img.includes('photo-1578328819058-b69f3a3b0f6b') ? '/cat_320d_excavator.jpg' : img
            )
          }));
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LISTINGS;
  });

  // Chat Messages state
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('euquero_messages_v7');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_CHATS;
  });

  // Modals & Drawers
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardIntent, setWizardIntent] = useState<IntentType>('buy');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<ListingItem | null>(null);
  const [activeChatMatch, setActiveChatMatch] = useState<MatchResult | null>(null);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);
  const [isPretendentesOpen, setIsPretendentesOpen] = useState(false);

  // Pretendentes Leads
  const [pretendentes, setPretendentes] = useState<PretendenteLead[]>(ALL_PRETENDENTES_DATA);

  const handleUnlockLead = (leadId: string) => {
    setPretendentes((prev) =>
      prev.map((lead) => (lead.id === leadId ? { ...lead, isUnlocked: true } : lead))
    );
  };

  // Estado de vídeos desbloqueados por R$ 19,90 (CAT 320D Paulínia etc)
  const [unlockedVideos, setUnlockedVideos] = useState<Record<string, boolean>>(() => {
    try {
      const isCatPaid = localStorage.getItem('video_pago_cat320d') === 'true';
      const saved = localStorage.getItem('euquero_unlocked_videos_v1');
      const initial = saved ? JSON.parse(saved) : {};
      if (isCatPaid) {
        initial['item-1'] = true;
      }
      return initial;
    } catch (e) {
      return {};
    }
  });
  const [videoToUnlockModal, setVideoToUnlockModal] = useState<ListingItem | null>(null);

  const handleUnlockVideo = (itemId: string) => {
    setUnlockedVideos((prev) => {
      const updated = { ...prev, [itemId]: true };
      try {
        localStorage.setItem('euquero_unlocked_videos_v1', JSON.stringify(updated));
        if (itemId === 'item-1') {
          localStorage.setItem('video_pago_cat320d', 'true');
        }
      } catch (e) {}
      return updated;
    });
  };

  // Filtro de Geografia do Topo (Ponto 5 do Prompt): [ 📍 Só SC | 🇧🇷 Brasil todo | 📍 Perto de mim ]
  const [geoScopeFilter, setGeoScopeFilter] = useState<'so_sc' | 'brasil_todo' | 'perto_de_mim'>('so_sc');

  // Comprador salvo para EloMatch direto (Carlos Mendes por padrão)
  const [compradorSalvo, setCompradorSalvo] = useState<{
    nome: string;
    whatsapp: string;
    cidade: string;
    maquina: string;
    valor: number | string;
    formaPagamento?: string;
  } | null>(() => {
    try {
      const data = localStorage.getItem('comprador_dados');
      if (data) return JSON.parse(data);
      return {
        nome: 'Carlos Mendes',
        whatsapp: '(47) 99620-5669',
        cidade: 'Joinville/SC',
        maquina: 'Escavadeira CAT 320D',
        valor: 520000,
        formaPagamento: 'À vista'
      };
    } catch (e) {
      return null;
    }
  });

  // =========================================================================
  // CONTADOR DE COMPRADORES ATIVOS - ESTRATÉGIA DAS CAIXAS 101-110:
  // - base = 500 (fixo, escondido)
  // - real = contar pedidos reais cadastrados no QUERO COMPRAR (Grátis) do EloMatch
  // - totalMostrado = base + real
  // Exemplo:
  //   real = 1 (você: Carlos Mendes) -> mostrar 501
  //   real = 2 -> mostrar 502
  //   real = 3 -> mostrar 503
  // - No código: let totalMostrado = 500 + pedidosReais.length
  // - Quando pedidosReais chegar em 500 (total 1000), remover base e mostrar só real: "HOJE: 500 COMPRADORES ATIVOS" reais.
  // =========================================================================
  const [pedidosReais, setPedidosReais] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('euquero_pedidos_reais_comprador');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {}
    // real = 1 (você: Carlos Mendes cadastrado no EloMatch) -> totalMostrado = 501
    return [
      {
        id: 'pedido-real-1',
        nome: 'Carlos Mendes',
        whatsapp: '(47) 99620-5669',
        cidade: 'Joinville/SC',
        maquina: 'Escavadeira CAT 320D',
        orcamento: 520000,
        formaPagamento: 'À vista',
        createdAt: '2026-09-26T10:00:00Z'
      }
    ];
  });

  // Banco Vendedores cadastrados via QUERO VENDER
  const [vendedoresCadastrados, setVendedoresCadastrados] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('euquero_banco_vendedores');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Convidados que entraram via Link de Convite do Vendedor (viram compradores ativos)
  const [convidadosCadastrados, setConvidadosCadastrados] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('euquero_convidados_ativos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });

  // Estado do Modal Anti-Bloqueio WhatsApp
  const [isAntiBloqueioOpen, setIsAntiBloqueioOpen] = useState<boolean>(false);
  const [antiBloqueioItem, setAntiBloqueioItem] = useState<ListingItem | null>(null);

  // Estado do Painel de Monetização AdMob e checagem de usuário sem anúncios (isAdFree)
  const [isAdMobMetricsOpen, setIsAdMobMetricsOpen] = useState<boolean>(false);
  const [isUserAdFreeState, setIsUserAdFreeState] = useState<boolean>(() => checkIsUserAdFree());

  // Atualiza status de anúncios se o usuário desbloquear vídeo ou assinar
  useEffect(() => {
    setIsUserAdFreeState(checkIsUserAdFree());
  }, [unlockedVideos]);

  // Salva pedidosReais no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('euquero_pedidos_reais_comprador', JSON.stringify(pedidosReais));
    } catch (e) {}
  }, [pedidosReais]);

  useEffect(() => {
    try {
      localStorage.setItem('euquero_banco_vendedores', JSON.stringify(vendedoresCadastrados));
    } catch (e) {}
  }, [vendedoresCadastrados]);

  useEffect(() => {
    try {
      localStorage.setItem('euquero_convidados_ativos', JSON.stringify(convidadosCadastrados));
    } catch (e) {}
  }, [convidadosCadastrados]);

  // CÁLCULO INTELIGENTE - ESTRATÉGIA CAIXAS 101-110:
  // Base fixa escondida = 500
  // Real = número de cadastros em QUERO COMPRAR (Grátis) + QUERO VENDER + CONVITES
  // Total mostrado = 500 + real (quando real >= 500, remover base e mostrar só real)
  const totalCompradoresMostrado = useMemo(() => {
    const realTotal = Math.max(1, pedidosReais.length + vendedoresCadastrados.length + convidadosCadastrados.length);
    return calculateTotalShownBuyers(realTotal);
  }, [pedidosReais.length, vendedoresCadastrados.length, convidadosCadastrados.length]);

  // Estado de banner de compradores ativos
  const activeBuyersStats: ActiveBuyersStats = useMemo(() => ({
    totalBuyers: totalCompradoresMostrado,
    linhaAmarela: 5,
    agricola: 4,
    youtubeVideos: 312,
  }), [totalCompradoresMostrado]);

  // Background Push Notifications State
  const [activePushAlert, setActivePushAlert] = useState<PushAlert | null>(null);
  const [alertsHistory, setAlertsHistory] = useState<PushAlert[]>([
    {
      id: 'alert-initial-1',
      title: 'Encontramos a Escavadeira que você procura!',
      body: 'Caterpillar 320D 2019 com 4.200h por R$ 510.000 em Paulínia/SP.',
      targetItem: INITIAL_LISTINGS[0],
      timestamp: 'Há 10 min'
    },
    {
      id: 'alert-initial-2',
      title: 'Comprador interessado no seu Caminhão!',
      body: 'Transportadora busca Volvo FH 540 com urgência. Ver proposta.',
      targetItem: INITIAL_LISTINGS[4],
      timestamp: 'Há 1 hora'
    }
  ]);

  // Persist to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('euquero_listings_v8', JSON.stringify(listings));
    } catch (e) {
      console.error(e);
    }
  }, [listings]);

  useEffect(() => {
    try {
      localStorage.setItem('euquero_messages_v7', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
  }, [messages]);

  // Deep linking para ?produto=ID, ?convite=NOME e /meus-anuncios
  useEffect(() => {
    try {
      if (window.location.pathname === '/meus-anuncios') {
        setCurrentView('meus_anuncios');
      }

      const handlePopState = () => {
        if (window.location.pathname === '/meus-anuncios') {
          setCurrentView('meus_anuncios');
        } else {
          setCurrentView('home');
        }
      };
      window.addEventListener('popstate', handlePopState);

      const urlParams = new URLSearchParams(window.location.search);
      let prodParam = urlParams.get('produto');
      if (!prodParam && window.location.pathname.startsWith('/produto/')) {
        prodParam = window.location.pathname.replace('/produto/', '').split('/')[0];
      }

      if (prodParam) {
        // 1. Busca em listings
        let found = listings.find((it) => 
          it.id === prodParam || 
          it.id.includes(prodParam) || 
          prodParam.includes(it.id) ||
          (it.id.replace(/\D/g, '') && prodParam.endsWith(it.id.replace(/\D/g, '')))
        );

        // 2. Se não encontrou, busca no banco de vendedores salvo (Supabase / Local)
        if (!found) {
          try {
            const bancoStr = localStorage.getItem('euquero_banco_vendedores');
            if (bancoStr) {
              const list = JSON.parse(bancoStr);
              const foundV = list.find((v: any) => 
                v.id === prodParam || 
                prodParam.includes(v.id) || 
                v.id.includes(prodParam)
              );
              if (foundV) {
                found = {
                  id: foundV.id || prodParam,
                  intent: 'sell',
                  title: `Vendo ${foundV.maquina || 'Escavadeira Hidráulica CAT 320D'} (${foundV.cidade || 'Paulínia/SP'})`,
                  category: foundV.categoriaId || 'linha_amarela',
                  subcategoryType: (foundV.maquina || 'Escavadeira').split(' ')[0],
                  condition: 'usado',
                  brand: 'Caterpillar (CAT)',
                  model: '320D / 320 GC',
                  year: parseInt(foundV.ano) || 2019,
                  price: foundV.valor || 520000,
                  priceNegotiable: true,
                  locationState: foundV.cidade?.includes('/') ? foundV.cidade.split('/')[1] : 'SP',
                  locationCity: foundV.cidade?.includes('/') ? foundV.cidade.split('/')[0] : 'Paulínia',
                  description: `Disponível para venda: ${foundV.maquina || 'Escavadeira CAT 320D'}, ano ${foundV.ano || '2019'}. Revisões em dia. Fotos reais liberadas para compradores.`,
                  userName: foundV.nome || 'Nardinei Zanardi',
                  userPhone: foundV.whatsapp || '(47) 99620-5669',
                  urgency: 'imediata',
                  createdAt: new Date().toISOString(),
                  status: 'active',
                  badge: foundV.pago ? 'premium' : undefined,
                  videoUrl: foundV.videoUrl,
                  hasVerifiedVideo: foundV.pago,
                  images: (foundV.images && foundV.images.length > 0)
                    ? foundV.images
                    : (foundV.fotos && foundV.fotos.length > 0)
                    ? foundV.fotos
                    : [
                        '/cat_320d_excavator.jpg',
                        'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
                        'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80'
                      ]
                };
              }
            }
          } catch (e) {}
        }

        // 3. Fallback garantido para anúncio de escavadeira se o link for sell-*
        if (!found && (prodParam.startsWith('sell-') || prodParam.includes('escavadeira') || prodParam.includes('cat'))) {
          found = listings.find((l) => l.id === 'sell-1') || listings[0];
        }

        if (found) {
          // Garante que o produto sempre tenha o array com as 4 fotos para o carrossel
          if (!found.images || found.images.length === 0) {
            found.images = [
              '/cat_320d_excavator.jpg',
              'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
              'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80'
            ];
          }

          // PROMPT 1: Produto público SEM telefone
          const sanitized = sanitizePublicProduct(found);
          setSelectedItemForDetail(sanitized);
          updateProductMetaTags(sanitized);
        }
      }

      const conviteParam = urlParams.get('convite');
      if (conviteParam) {
        setConvidadosCadastrados((prev) => {
          if (!prev.includes(conviteParam)) {
            return [conviteParam, ...prev];
          }
          return prev;
        });

        setActivePushAlert({
          id: `alert-convite-${Date.now()}`,
          title: '🎉 Bem-vindo via Convite Oficial!',
          body: 'Você entrou pelo convite de Nardinei Zanardi e já é um COMPRADOR ATIVO. O contador subiu!',
          targetItem: listings[0],
          timestamp: 'Agora'
        });
      }

      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
    } catch (e) {}
  }, []);

  const navigateToMeusAnuncios = () => {
    try {
      window.history.pushState({}, '', '/meus-anuncios');
    } catch (e) {}
    setCurrentView('meus_anuncios');
  };

  const navigateToHome = () => {
    try {
      window.history.pushState({}, '', '/');
    } catch (e) {}
    setCurrentView('home');
  };

  const handleSimulateInviteBuyer = () => {
    const newGuestId = `convidado-${Date.now()}`;
    setConvidadosCadastrados((prev) => [newGuestId, ...prev]);
  };

  // Background match calculation
  const backgroundMatches = useMemo(() => {
    return findMatches(listings);
  }, [listings]);

  // Open Wizard
  const handleOpenWizard = (intent: 'buy' | 'sell') => {
    setWizardIntent(intent);
    setIsWizardOpen(true);
  };

  // Create Listing
  const handleCreateListing = (newListingData: Omit<ListingItem, 'id' | 'createdAt' | 'status'>) => {
    const rawId = (newListingData as any).id;
    const finalPhotos = (newListingData.images && newListingData.images.length > 0)
      ? newListingData.images
      : [
          '/cat_320d_excavator.jpg',
          'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80'
        ];

    const newItem: ListingItem = {
      ...newListingData,
      id: rawId || `${newListingData.intent}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'active',
      images: finalPhotos
    };

    const newMatches = findMatches([...listings, newItem], newItem);
    setListings((prev) => {
      const updated = [newItem, ...prev];
      try {
        localStorage.setItem('euquero_listings_v8', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });

    // Se for novo pedido de compra no QUERO COMPRAR (Grátis), atualiza pedidosReais para o contador 501+
    if (newListingData.intent === 'buy') {
      const novoPedidoReal = {
        id: `pedido-${Date.now()}`,
        nome: newListingData.userName,
        whatsapp: newListingData.userPhone,
        cidade: `${newListingData.locationCity}/${newListingData.locationState}`,
        maquina: newListingData.title,
        orcamento: newListingData.price,
        createdAt: new Date().toISOString()
      };
      setPedidosReais((prev) => [novoPedidoReal, ...prev]);
    }

    // Se for novo anúncio de vendedor em QUERO VENDER, atualiza vendedoresCadastrados (+1 no contador)
    if (newListingData.intent === 'sell') {
      const novoVendedor = {
        id: newItem.id,
        nome: newListingData.userName,
        cidade: `${newListingData.locationCity}/${newListingData.locationState}`,
        maquina: newListingData.title,
        preco: newListingData.price,
        createdAt: new Date().toISOString()
      };
      setVendedoresCadastrados((prev) => [novoVendedor, ...prev]);
    }

    // Atualiza estado reativo do comprador para exibir o EloMatch
    try {
      const data = localStorage.getItem('comprador_dados');
      if (data) {
        setCompradorSalvo(JSON.parse(data));
      }
    } catch (e) {}

    // SISTEMA ELO - NOTIFICAÇÕES OFICIAIS AUTOMÁTICAS:
    if (newMatches.length > 0) {
      const topMatch = newMatches[0];
      const isBuyerCreating = newItem.intent === 'buy';
      const sellerItem = isBuyerCreating ? topMatch.sellerListing : newItem;
      const buyerItem = isBuyerCreating ? newItem : topMatch.buyerDemand;
      const targetCounterpart = isBuyerCreating ? topMatch.sellerListing : topMatch.buyerDemand;

      const productLink = generateDisplayProductLink(sellerItem);
      
      const newAlert: PushAlert = {
        id: `alert-${Date.now()}`,
        title: isBuyerCreating ? '🔥 Achamos!' : '💰 Tem Comprador!',
        body: isBuyerCreating
          ? `${sellerItem.title} em ${sellerItem.locationCity} por R$ ${sellerItem.price.toLocaleString('pt-BR')} - Ver 4 fotos e vídeo: ${productLink}`
          : `Nardinei, tem comprador para sua ${sellerItem.title}! ${buyerItem.userName} quer em ${buyerItem.locationCity} - Chamar no chat`,
        targetItem: targetCounterpart,
        timestamp: 'Agora'
      };

      setTimeout(() => {
        setActivePushAlert(newAlert);
        setAlertsHistory((prev) => [newAlert, ...prev]);
      }, 1000);
    }

    return newMatches;
  };

  // Open in-app chat for item
  const handleStartChatForItem = (item: ListingItem) => {
    const existing = backgroundMatches.find(
      (m) => m.sellerListing.id === item.id || m.buyerDemand.id === item.id
    );

    const matchToOpen: MatchResult = existing || {
      id: `match-direct-${item.id}`,
      buyerDemand: item.intent === 'buy' ? item : listings[0],
      sellerListing: item.intent === 'sell' ? item : listings[1],
      score: 95,
      reasons: ['Negociação direta iniciada pelo anúncio'],
      createdAt: new Date().toISOString(),
      status: 'negotiating'
    };

    const chatMsg = messages.find((m) => m.matchId === matchToOpen.id);
    if (!chatMsg) {
      const initialGreeting: ChatMessage = {
        id: `msg-${Date.now()}`,
        matchId: matchToOpen.id,
        senderName: 'Eu Quero Notificações',
        senderIntent: 'buy',
        text: `🤝 Canal direto aberto para negociação de "${item.title}". Propostas e conversas são protegidas em tempo real.`,
        timestamp: 'Agora'
      };
      setMessages((prev) => [...prev, initialGreeting]);
    }

    setActiveChatMatch(matchToOpen);
  };

  const handleSendMessage = (matchId: string, text: string, proposalPrice?: number) => {
    const currentMatch = backgroundMatches.find((m) => m.id === matchId) || activeChatMatch;
    if (!currentMatch) return;

    const newMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      matchId,
      senderName: 'Você',
      senderIntent: 'buy',
      text: text || `Proposta formal de R$ ${proposalPrice?.toLocaleString('pt-BR')}`,
      timestamp: 'Agora',
      proposalPrice,
      proposalStatus: proposalPrice ? 'pending' : undefined
    };

    setMessages((prev) => [...prev, newMessage]);
  };

  const handleAcceptProposal = (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, proposalStatus: 'accepted' } : m))
    );
  };

  // Contagem por categoria nos chips
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const chip of CATEGORY_CHIPS) {
      counts[chip.id] = listings.filter((item) => isItemInCategory(item, chip.id)).length;
    }
    return counts;
  }, [listings]);

  // Itens filtrados pela categoria selecionada (Isolamento total por categoria)
  const categoryListings = useMemo(() => {
    if (!selectedCategory || selectedCategory === 'all') {
      return listings;
    }
    return listings.filter((item) => isItemInCategory(item, selectedCategory));
  }, [listings, selectedCategory]);

  // Itens finais para exibição (Categoria + Intenção + Busca + Geografia [📍 Só SC | 🇧🇷 Brasil todo | 📍 Perto de mim])
  const filteredListings = useMemo(() => {
    return categoryListings
      .filter((item) => {
        if (intentFilter !== 'all' && item.intent !== intentFilter) return false;

        // FILTRO DE GEOGRAFIA DO TOPO (PONTO 5):
        if (geoScopeFilter === 'so_sc') {
          const st = (item.locationState || '').trim().toUpperCase();
          if (st !== 'SC' && !item.locationCity.toUpperCase().includes('/SC')) {
            return false;
          }
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const str = `${item.title} ${item.subcategoryType} ${item.brand || ''} ${item.locationCity}`.toLowerCase();
          if (!str.includes(q)) return false;
        }
        return true;
      })
      .map((item) => {
        const cityNorm = item.locationCity.toLowerCase();
        let distanceKm: number | undefined = undefined;
        if (cityNorm.includes('joinville')) {
          distanceKm = 30; // 30km de Araquari/SC
        } else if (cityNorm.includes('jaragua')) {
          distanceKm = 38;
        } else if (cityNorm.includes('blumenau')) {
          distanceKm = 95;
        } else if (cityNorm.includes('paulinia')) {
          distanceKm = 18;
        }
        return {
          ...item,
          distanceKm
        };
      });
  }, [categoryListings, intentFilter, searchQuery, geoScopeFilter]);

  // Informações do Card Preto "Painel do Vendedor" dinâmicas por categoria
  const activeChipConfig = CATEGORY_CHIPS.find((c) => c.id === selectedCategory) || CATEGORY_CHIPS[0];

  const sellerPanelInfo = useMemo(() => {
    switch (selectedCategory) {
      case 'caminhao':
      case 'caminhoes':
        return {
          title: '🔥 7 compradores se encaixam no que você vende',
          subtitle: 'Compatibilidade de filtro ativo (produto + faixa de valor + região SP/PR/MT). Não é garantia de venda: são procuras cadastradas com critérios compatíveis.',
          count: 7,
          leads: pretendentes.filter((p) => p.id.startsWith('lead-cam'))
        };
      case 'agricola':
      case 'agro':
        return {
          title: '🔥 5 compradores se encaixam no que você vende',
          subtitle: 'Compatibilidade de filtro ativo (produto + faixa de valor + região MT/GO/PR). Não é garantia de venda: são procuras cadastradas com critérios compatíveis.',
          count: 5,
          leads: pretendentes.filter((p) => p.id.startsWith('lead-ag'))
        };
      case 'implementos':
      case 'implementos_rodoviarios':
        return {
          title: '🔥 4 compradores se encaixam no que você vende',
          subtitle: 'Compatibilidade de filtro ativo (tipo de carreta + faixa de valor + região). Não é garantia de venda: são procuras cadastradas com critérios compatíveis.',
          count: 4,
          leads: pretendentes.filter((p) => p.id.startsWith('lead-imp'))
        };
      case 'linha_amarela':
      case 'maquinas':
      default:
        return {
          title: '🔥 4 compradores se encaixam no que você vende',
          subtitle: 'Compatibilidade de filtro ativo (modelo + faixa de valor + região SP/MG). Não é garantia de venda: são procuras cadastradas com critérios compatíveis.',
          count: 4,
          leads: pretendentes.filter((p) => p.id.startsWith('lead-la'))
        };
    }
  }, [selectedCategory, pretendentes]);

  // Função para gerar o label exato estilo Tinder: "1 de X - TRATOR...", "1 de X - SCANIA...", etc.
  const getTinderCardLabel = (item: ListingItem, index: number, total: number) => {
    const title = (item.title || '').toUpperCase();
    const sub = (item.subcategoryType || '').toUpperCase();
    const brand = (item.brand || '').toUpperCase();

    let tag = 'MÁQUINA';
    if (sub.includes('ESCAVADEIRA') || title.includes('ESCAVADEIRA')) {
      tag = 'ESCAVADEIRA';
    } else if (sub.includes('RETROESCAVADEIRA') || title.includes('RETROESCAVADEIRA') || title.includes('3CX')) {
      tag = 'RETROESCAVADEIRA JCB 3CX';
    } else if (sub.includes('PÁ CARREGADEIRA') || sub.includes('PA CARREGADEIRA') || title.includes('CARREGADEIRA')) {
      tag = 'PÁ CARREGADEIRA';
    } else if (sub.includes('TRATOR DE ESTEIRA') || title.includes('TRATOR DE ESTEIRA')) {
      tag = 'TRATOR DE ESTEIRA';
    } else if (sub.includes('TRATOR') || title.includes('TRATOR')) {
      tag = 'TRATOR';
    } else if (sub.includes('COLHEITADEIRA') || title.includes('COLHEITADEIRA')) {
      tag = 'COLHEITADEIRA';
    } else if (sub.includes('PULVERIZADOR') || title.includes('PULVERIZADOR') || sub.includes('IMPLEMENTO')) {
      tag = 'IMPLEMENTOS AGRÍCOLAS';
    } else if (title.includes('SCANIA') || brand.includes('SCANIA')) {
      tag = 'SCANIA';
    } else if (title.includes('VOLVO') || brand.includes('VOLVO')) {
      tag = 'VOLVO FH 540';
    } else if (sub.includes('TRUCK') || title.includes('TRUCK')) {
      tag = 'TRUCK 6X2';
    } else if (sub.includes('CAVALO') || title.includes('CAVALO')) {
      tag = 'CAVALO MECÂNICO';
    } else if (sub.includes('BASCULANTE') || title.includes('BASCULANTE')) {
      tag = 'BASCULANTE';
    } else if (sub.includes('GRANELEIRO') || title.includes('GRANELEIRO')) {
      tag = 'GRANELEIRO';
    } else if (sub.includes('BITREM') || title.includes('BITREM')) {
      tag = 'BITREM';
    } else {
      tag = sub || item.category.toUpperCase();
    }

    return `${index + 1} de ${total} - ${tag}`;
  };

  // Função para navegar até o próximo card estilo Tinder vertical
  const handleScrollToNextCard = (index: number) => {
    const nextIndex = index + 1;
    if (nextIndex < filteredListings.length) {
      const targetElement = document.getElementById(`card-slot-${nextIndex}`);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Alternar favorito
  const toggleFavorite = (itemId: string) => {
    setFavorites((prev) => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-slate-900 selection:bg-orange-100 selection:text-orange-950 font-sans">
      
      {/* NATIVE PUSH NOTIFICATION SIMULATOR (TOP OF THE PHONE) */}
      <PushNotificationBanner
        alert={activePushAlert}
        onDismiss={() => setActivePushAlert(null)}
        onOpenItem={(item) => setSelectedItemForDetail(item)}
      />

      {/* TOP HEADER: Logo "Eu Quero", Search, Bell & Chat + Banner com Contador de Compradores Ativos */}
      <Header
        onOpenNotifications={() => setIsNotificationDrawerOpen(true)}
        unreadAlertsCount={alertsHistory.length}
        onOpenConversations={() => setCurrentView(currentView === 'home' ? 'chat' : 'home')}
        unreadMessagesCount={messages.length}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenPretendentes={() => setIsPretendentesOpen(true)}
        onOpenMeusAnuncios={navigateToMeusAnuncios}
        pretendentesCount={sellerPanelInfo.count}
        activeBuyersStats={activeBuyersStats}
        onSelectBuyersTicker={() => {
          setIntentFilter('buy');
          document.getElementById('feed-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onSelectYoutubeTicker={() => {
          setSelectedCategory('linha_amarela');
          document.getElementById('feed-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {/* NOTIFICATION DRAWER */}
      <NotificationDrawer
        isOpen={isNotificationDrawerOpen}
        onClose={() => setIsNotificationDrawerOpen(false)}
        alerts={alertsHistory}
        onSelectItem={(item) => setSelectedItemForDetail(sanitizePublicProduct(item))}
        onClearAlerts={() => setAlertsHistory([])}
        onStartChat={(item) => handleStartChatForItem(item)}
      />

      {/* MAIN VIEW CONTENT */}
      {currentView === 'home' ? (
        <main className="flex-1 pb-20">
          {/* 1. OS DOIS BOTÕES GIGANTES: QUERO COMPRAR & QUERO VENDER */}
          <Hero onOpenWizard={handleOpenWizard} />

          {/* 2. OS 4 CHIPS DE FILTRO NO TOPO DA LISTA (SEMPRE VISÍVEIS NO TOPO AO ROLAR) */}
          <section className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-y border-slate-200 shadow-xs py-2 sm:py-2.5">
            <div className="max-w-7xl mx-auto px-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-orange-500" />
                  <span>Escolha o Segmento (Feed Tinder Isolado):</span>
                </span>
                
                {/* Opção para alternar / ver todos */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategory(selectedCategory === 'all' ? 'linha_amarela' : 'all');
                    document.getElementById('feed-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`text-[11px] font-bold px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {selectedCategory === 'all' ? '✓ Vendo Todas as Categorias' : 'Ver Todos (14)'}
                </button>
              </div>

              {/* Componente dos 4 Chips */}
              <CategoryCarousel
                selectedCategory={selectedCategory}
                onSelectCategory={(catId) => {
                  setSelectedCategory(catId);
                  const feedElem = document.getElementById('feed-container');
                  if (feedElem) {
                    feedElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                categoryCounts={categoryCounts}
              />
            </div>
          </section>

          {/* Âncora de rolagem para o início do feed */}
          <div id="feed-container" className="h-2" />

          {/* 3. FEED DE ANÚNCIOS ESTILO TINDER VERTICAL */}
          <section className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 pb-12">
            {/* Header com Contadores: Todos (14) / À Venda (8) / Compradores (6) */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl sm:text-2xl" role="img" aria-label="ícone da categoria">
                    {selectedCategory === 'all' ? '🌐' : activeChipConfig.emoji}
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black font-display text-slate-900 tracking-tight">
                    {selectedCategory === 'all'
                      ? 'Todas as Categorias Integradas'
                      : `${activeChipConfig.name}`}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {filteredListings.length > 0
                    ? `Mostrando: 1 de ${filteredListings.length} - ${getTinderCardLabel(filteredListings[0], 0, filteredListings.length).split(' - ')[1] || activeChipConfig.name}`
                    : 'Nenhum ativo nesta categoria.'}
                </p>
              </div>

              {/* Segmented control: Todos / À Venda / Compradores */}
              <div className="flex items-center gap-1 p-1 bg-slate-200/80 rounded-xl w-fit shrink-0">
                <button
                  type="button"
                  onClick={() => setIntentFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    intentFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({categoryListings.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIntentFilter('sell')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    intentFilter === 'sell'
                      ? 'bg-[#FF6B00] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  À Venda ({categoryListings.filter((i) => i.intent === 'sell').length})
                </button>
                <button
                  type="button"
                  onClick={() => setIntentFilter('buy')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    intentFilter === 'buy'
                      ? 'bg-[#00A86B] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Compradores ({categoryListings.filter((i) => i.intent === 'buy').length})
                </button>
              </div>
            </div>

            {/* FILTROS GEOGRÁFICOS DO TOPO (PONTO 5 DO PROMPT): [ 📍 Só SC | 🇧🇷 Brasil todo | 📍 Perto de mim ] */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                  Alcance Geográfico:
                </span>
                <button
                  type="button"
                  onClick={() => setGeoScopeFilter('so_sc')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                    geoScopeFilter === 'so_sc'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>📍 Só SC</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGeoScopeFilter('brasil_todo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                    geoScopeFilter === 'brasil_todo'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>🇧🇷 Brasil todo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setGeoScopeFilter('perto_de_mim')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                    geoScopeFilter === 'perto_de_mim'
                      ? 'bg-[#FF6B00] text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <span>📍 Perto de mim (SC 30km)</span>
                </button>
              </div>

              {/* Botões: Admin AdMob + Oficial Anti-Bloqueio WhatsApp */}
              <div className="flex items-center gap-2 flex-wrap">
                <AdMobAdminBadge 
                  activeBuyersCount={totalCompradoresMostrado}
                  onOpenDetails={() => setIsAdMobMetricsOpen(true)}
                />

                <button
                  type="button"
                  onClick={() => {
                    setAntiBloqueioItem(listings.find((it) => it.intent === 'sell') || null);
                    setIsAntiBloqueioOpen(true);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-[#FF6B00] text-white text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <span>🛡️ Anti-Bloqueio WhatsApp</span>
                </button>
              </div>
            </div>

            {/* AVISO INTELIGENTE PARA CIDADE PEQUENA (PONTO 5): ARAQUARI -> JOINVILLE (30KM) */}
            <div className="mb-5 p-3.5 bg-emerald-50 border-2 border-emerald-400 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-950 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#00875A] text-white flex items-center justify-center font-bold text-sm shrink-0">
                  📍
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-black text-emerald-950">
                    Não achamos em Araquari/SC, mas achamos 3 em Joinville/SC (30km de você)
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Máquinas e equipamentos pesados verificados na região norte de Santa Catarina para vistoria presencial rápida.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setGeoScopeFilter('so_sc');
                  setSearchQuery('Joinville');
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shrink-0 cursor-pointer transition-all active:scale-95"
              >
                Ver em Joinville (30km) ➔
              </button>
            </div>

            {/* CARD PRETO: PAINEL DO VENDEDOR (APARECE FIXO APENAS NA ABA "À VENDA / VENDER", NUNCA NO FEED TINDER GERAL) */}
            {intentFilter === 'sell' && (
              <div 
                onClick={() => setIsPretendentesOpen(true)}
                className="cursor-pointer mb-8 p-5 sm:p-6 rounded-[24px] bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white border-2 border-orange-500/40 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all hover:border-orange-500 hover:shadow-orange-500/20 active:scale-[0.99]"
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-[#FF6B00]/20 flex items-center justify-center shrink-0 border border-orange-500/40 shadow-inner">
                    <Flame className="w-7 h-7 text-[#FF6B00] fill-[#FF6B00] animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                        Compatibilidade de Filtro
                      </span>
                      <span className="text-xs text-orange-400 font-bold">
                        {sellerPanelInfo.count} Procuras Ativas Compatíveis
                      </span>
                    </div>
                    {/* TÍTULO DINÂMICO HONESTO: Ex: "7 compradores se encaixam no que você vende" */}
                    <h4 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      {sellerPanelInfo.title}
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-md">
                      {sellerPanelInfo.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleOpenWizard('sell')}
                    className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer active:scale-95"
                  >
                    Anunciar Meu Ativo
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsPretendentesOpen(true)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-500/25 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-transform active:scale-95"
                  >
                    <Flame className="w-4 h-4 fill-white" />
                    <span>Ver Procuras Compatíveis</span>
                  </button>
                </div>
              </div>
            )}

            {/* BANNER ELOMATCH ATIVO (QUANDO O COMPRADOR ESTÁ CADASTRADO) */}
            {compradorSalvo && (
              <div className="mb-6 p-4 sm:p-5 rounded-[22px] bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 text-slate-900 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in fade-in duration-300">
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#00875A] text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Sparkles className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-200 px-2 py-0.5 rounded-full">
                        Seu Pedido de Compra Registrado (100% Grátis)
                      </span>
                      <span className="text-xs font-bold text-emerald-800">
                        ● EloMatch Ativo
                      </span>
                    </div>
                    <h4 className="text-sm sm:text-base font-black text-emerald-950">
                      Olá, {compradorSalvo.nome}! Encontramos máquinas compatíveis com seu pedido de {compradorSalvo.maquina}.
                    </h4>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Orçamento: <strong>R$ {typeof compradorSalvo.valor === 'number' ? compradorSalvo.valor.toLocaleString('pt-BR') : compradorSalvo.valor}</strong> · Cidade: {compradorSalvo.cidade} · O vídeo da máquina abaixo está liberado direto para você!
                    </p>
                  </div>
                </div>

                <a
                  href="https://wa.me/5547996205669?text=Ol%C3%A1!%20Vi%20a%20m%C3%A1quina%20no%20EuQuero"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 rounded-xl bg-[#10B981] hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 shrink-0 transition-transform active:scale-95 cursor-pointer text-center"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Falar com Vendedor</span>
                </a>
              </div>
            )}

            {/* FEED VERTICAL ESTILO PERFIL DE NAMORO (TINDER) - UM EM CIMA DO OUTRO DA MESMA CATEGORIA */}
            {filteredListings.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-[24px] border border-slate-200 shadow-xs max-w-xl mx-auto">
                <p className="font-bold text-slate-800 text-base">Nenhum ativo encontrado nesta categoria.</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Seja o primeiro a publicar sua procura ou colocar seu ativo para vender!
                </p>
                <div className="mt-4 flex justify-center gap-2">
                  <button
                    onClick={() => handleOpenWizard('buy')}
                    className="px-4 py-2.5 rounded-xl bg-[#00A86B] text-white font-bold text-xs cursor-pointer shadow-sm hover:bg-emerald-600"
                  >
                    Quero Comprar
                  </button>
                  <button
                    onClick={() => handleOpenWizard('sell')}
                    className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white font-bold text-xs cursor-pointer shadow-sm hover:bg-slate-800"
                  >
                    Quero Vender
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-w-xl mx-auto space-y-10">
                {filteredListings.map((item, index) => {
                  const isFavorited = !!favorites[item.id];
                  const hasNext = index + 1 < filteredListings.length;

                  return (
                    <article
                      key={item.id}
                      id={`card-slot-${index}`}
                      className="relative scroll-mt-36 transition-all"
                    >
                      {/* BARRA SUPERIOR ESTILO STORY / PERFIL DE NAMORO (TINDER) */}
                      <div className="bg-slate-900 text-white px-4 py-3 rounded-t-[24px] flex items-center justify-between border-b border-slate-800">
                        {/* Barras de progresso estilo Tinder / Stories */}
                        <div className="flex items-center gap-1.5 flex-1 max-w-[120px] sm:max-w-[180px]">
                          {filteredListings.slice(0, 10).map((_, barIdx) => (
                            <div
                              key={barIdx}
                              className={`h-1.5 rounded-full flex-1 transition-all ${
                                barIdx === index
                                  ? item.intent === 'buy'
                                    ? 'bg-[#00A86B]'
                                    : 'bg-[#FF6B00]'
                                  : barIdx < index
                                  ? 'bg-slate-500'
                                  : 'bg-slate-800'
                              }`}
                            />
                          ))}
                        </div>

                        {/* Indicador Numérico Exato: "1 de X - TRATOR...", "1 de X - SCANIA...", etc. */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-black tracking-wide text-amber-400 font-mono bg-amber-400/10 px-2.5 py-1 rounded-lg border border-amber-400/25 shadow-xs">
                            {getTinderCardLabel(item, index, filteredListings.length)}
                          </span>
                        </div>
                      </div>

                      {/* CARD OFICIAL DO ATIVO (COM BORDA 24PX, SEM FOTO FALSA NO COMPRO, COM FOTO REAL NO VENDO) */}
                      <div className="shadow-lg rounded-b-[24px] overflow-hidden">
                        <AdCard
                          item={item}
                          onClick={(it) => setSelectedItemForDetail(sanitizePublicProduct(it))}
                          onConnectChat={(it) => handleStartChatForItem(it)}
                          isVideoUnlocked={!!unlockedVideos[item.id]}
                          onUnlockVideo={(it) => setVideoToUnlockModal(it)}
                          onShareAntiBloqueio={(it) => {
                            setAntiBloqueioItem(it);
                            setIsAntiBloqueioOpen(true);
                          }}
                        />
                      </div>

                      {/* BARRA DE AÇÃO ESTILO TINDER (PULAR, PROPOSTA, FAVORITAR) */}
                      <div className="mt-3 flex items-center justify-between gap-3 px-2">
                        <button
                          type="button"
                          onClick={() => toggleFavorite(item.id)}
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isFavorited
                              ? 'bg-rose-50 border-rose-300 text-rose-600'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''}`} />
                          <span>{isFavorited ? 'Salvo' : 'Salvar'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedItemForDetail(sanitizePublicProduct(item))}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-slate-500" />
                          <span>Ver Ficha Técnica</span>
                        </button>

                        {hasNext && (
                          <button
                            type="button"
                            onClick={() => handleScrollToNextCard(index)}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer shadow-xs transition-transform active:scale-95"
                          >
                            <span>Próximo Ativo</span>
                            <ChevronDown className="w-4 h-4 text-orange-400" />
                          </button>
                        )}
                      </div>

                      {/* GUIA VISUAL DE ROLAGEM VERTICAL INFINITA */}
                      {hasNext ? (
                        <div className="py-6 flex flex-col items-center justify-center text-slate-400 select-none">
                          <div className="w-px h-6 bg-gradient-to-b from-slate-300 to-transparent" />
                          <div className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-400 mt-2 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                            <ChevronDown className="w-3.5 h-3.5 text-orange-500 animate-bounce" />
                            <span>Arraste para cima para ver o próximo da mesma categoria</span>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-slate-400 text-xs font-semibold">
                          <span>✨ Você viu todos os {filteredListings.length} ativos desta categoria.</span>
                        </div>
                      )}

                      {/* BANNER DE PROPAGANDA GOOGLE ADMOB ENTRE OS CARDS (A CADA 4 MÁQUINAS) - APENAS USUÁRIO GRÁTIS */}
                      {!isUserAdFreeState && (index + 1) % 4 === 0 && (
                        <FeedAdMobBanner 
                          bannerIndex={Math.floor(index / 4)}
                          onAdClick={() => {
                            // Registra métricas e atualiza estado
                          }}
                        />
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </main>
      ) : currentView === 'meus_anuncios' ? (
        /* TELA /meus-anuncios (PROMPT 5) */
        <main className="flex-1 w-full pb-16">
          <MeusAnunciosView
            onBack={navigateToHome}
            onOpenWizard={handleOpenWizard}
            onViewProductDetail={(item) => setSelectedItemForDetail(sanitizePublicProduct(item))}
            allListings={listings}
          />
        </main>
      ) : (
        /* TELA DE MENSAGENS E NEGOCIAÇÕES */
        <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full">
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={navigateToHome}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer transition-all"
            >
              ← Voltar para o Feed Principal
            </button>
          </div>
          <ConversationsView
            matches={backgroundMatches}
            messages={messages}
            onOpenChat={(match) => setActiveChatMatch(match)}
            onOpenWizard={handleOpenWizard}
          />
        </main>
      )}

      {/* MODAL DETALHE DO ANÚNCIO */}
      <ItemDetailModal
        item={selectedItemForDetail}
        onClose={() => {
          setSelectedItemForDetail(null);
          updateProductMetaTags();
        }}
        onOpenChat={(it) => handleStartChatForItem(it)}
        isVideoUnlocked={selectedItemForDetail ? !!unlockedVideos[selectedItemForDetail.id] : false}
        onUnlockVideo={(it) => setVideoToUnlockModal(it)}
      />

      {/* MODAL DE DESBLOQUEIO DE VÍDEO (R$ 19,90) */}
      <VideoUnlockModal
        isOpen={!!videoToUnlockModal}
        onClose={() => setVideoToUnlockModal(null)}
        onUnlockSuccess={() => {
          if (videoToUnlockModal) {
            handleUnlockVideo(videoToUnlockModal.id);
          }
        }}
        itemTitle={videoToUnlockModal?.title}
        itemCity={`${videoToUnlockModal?.locationCity}, ${videoToUnlockModal?.locationState}`}
        videoUrl={videoToUnlockModal?.videoUrl || 'https://youtu.be/Jmsm2SCzn1o'}
        sellerPhone={videoToUnlockModal?.userPhone || '(47) 99620-5669'}
      />

      {/* WIZARD GUIADO PARA QUERO COMPRAR / QUERO VENDER */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialIntent={wizardIntent}
        onSubmitListing={handleCreateListing}
        onViewMatches={() => {}}
      />

      {/* CHAT DIRETO DE NEGOCIAÇÃO */}
      <NegotiationChatModal
        match={activeChatMatch}
        onClose={() => setActiveChatMatch(null)}
        messages={messages}
        onSendMessage={handleSendMessage}
        onAcceptProposal={handleAcceptProposal}
      />

      {/* PAINEL DE PRETENDENTES ESTILO TINDER */}
      <PretendentesTinderPanel
        isOpenAsModal={isPretendentesOpen}
        onCloseModal={() => setIsPretendentesOpen(false)}
        customTitle={`${sellerPanelInfo.count} compradores se encaixam no que você vende`}
        pretendentes={sellerPanelInfo.leads}
        onUnlockLead={handleUnlockLead}
        onOpenChatWithBuyer={(buyerItem) => {
          setIsPretendentesOpen(false);
          if (buyerItem) {
            handleStartChatForItem(buyerItem);
          }
        }}
      />

      {/* MODAL OFICIAL ANTI-BLOQUEIO WHATSAPP (SOLUÇÃO DEFINITIVA) */}
      <AntiBloqueioWhatsAppModal
        isOpen={isAntiBloqueioOpen}
        onClose={() => setIsAntiBloqueioOpen(false)}
        sellerItems={listings.filter((it) => it.intent === 'sell')}
        selectedItem={antiBloqueioItem}
        onSimulateInviteBuyer={handleSimulateInviteBuyer}
      />

      {/* MODAL DO PAINEL DO ADMIN MONETIZAÇÃO ADMOB */}
      <AdMobMetricsModal
        isOpen={isAdMobMetricsOpen}
        onClose={() => setIsAdMobMetricsOpen(false)}
        activeBuyersCount={totalCompradoresMostrado}
      />

      {/* BANNER FIXO RODAPÉ ESTILO APP DE MÚSICA - APENAS USUÁRIO GRÁTIS */}
      {!isUserAdFreeState && (
        <FixedFooterAdMob
          onUpgradePremium={() => {
            handleOpenWizard('sell');
          }}
        />
      )}

      {/* RODAPÉ */}
      <Footer />

    </div>
  );
}
