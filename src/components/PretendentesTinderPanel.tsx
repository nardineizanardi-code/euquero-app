import React, { useState } from 'react';
import { 
  Flame, Lock, Unlock, Sparkles, Check, Crown, Zap, 
  MapPin, Clock, MessageSquare, X, QrCode, CreditCard, Copy, CheckCircle2, ShieldCheck,
  Eye, ArrowRight, ShieldAlert, BadgePercent, CheckCheck, Video
} from 'lucide-react';
import { ListingItem } from '../types';

export interface PretendenteLead {
  id: string;
  buyerCity: string;
  buyerState: string;
  buyerBudget: number;
  compatibilityScore: number;
  urgency: string;
  desiredSubtype: string;
  realBuyerName: string;
  realBuyerPhone: string;
  isUnlocked: boolean;
  avatarUrl?: string;
  buyerDemandItem?: ListingItem;
  videoRecordedDate?: string;
  isVideoVerified?: boolean;
  isExampleVideo?: boolean;
}

interface PretendentesTinderPanelProps {
  pretendentes?: PretendenteLead[];
  onUnlockLead: (leadId: string) => void;
  onOpenChatWithBuyer: (buyerItem?: ListingItem) => void;
  isOpenAsModal?: boolean;
  onCloseModal?: () => void;
  customTitle?: string;
}

// Os 4 cards borrados solicitados explicitamente com dados reais e efeito blur forte
const DEFAULT_BLURRED_LEADS: PretendenteLead[] = [
  {
    id: 'lead-blur-1',
    buyerCity: 'Campinas',
    buyerState: 'SP',
    desiredSubtype: 'Quer CAT 320D',
    buyerBudget: 500000,
    compatibilityScore: 95,
    urgency: 'Orçamento compatível · Imediata',
    realBuyerName: 'Eng. Rodrigo Silva (TerraFort Engenharia)',
    realBuyerPhone: '(19) 99844-3210',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    isUnlocked: false,
    videoRecordedDate: '26/09/2026',
    isVideoVerified: true,
    isExampleVideo: false
  },
  {
    id: 'lead-blur-2',
    buyerCity: 'Curitiba',
    buyerState: 'PR',
    desiredSubtype: 'Quer Escavadeira até 2019',
    buyerBudget: 520000,
    compatibilityScore: 88,
    urgency: 'Orçamento Aprovado',
    realBuyerName: 'Carlos Eduardo Gouveia',
    realBuyerPhone: '(41) 98845-6677',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    isUnlocked: false,
    videoRecordedDate: '25/09/2026',
    isVideoVerified: true,
    isExampleVideo: false
  },
  {
    id: 'lead-blur-3',
    buyerCity: 'Belo Horizonte',
    buyerState: 'MG',
    desiredSubtype: 'Quer Retro JCB 3CX',
    buyerBudget: 390000,
    compatibilityScore: 92,
    urgency: 'Procura ativa · Imediata',
    realBuyerName: 'Marcelo Rezende (Rezende Locações)',
    realBuyerPhone: '(31) 98765-3319',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    isUnlocked: false,
    videoRecordedDate: '27/09/2026',
    isVideoVerified: true,
    isExampleVideo: false
  },
  {
    id: 'lead-blur-4',
    buyerCity: 'Londrina',
    buyerState: 'PR',
    desiredSubtype: 'Quer Linha Amarela',
    buyerBudget: 400000,
    compatibilityScore: 85,
    urgency: 'Em até 7 dias',
    realBuyerName: 'Dra. Vanessa Silveira',
    realBuyerPhone: '(43) 99112-8877',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80',
    isUnlocked: false,
    videoRecordedDate: '24/09/2026',
    isVideoVerified: false,
    isExampleVideo: true // Exemplo detectado: demonstra a regra de bloqueio e pedido de regravação
  }
];

type PackageOption = 'single' | 'pack5' | 'days7' | 'premium' | 'highlight';

export const PretendentesTinderPanel: React.FC<PretendentesTinderPanelProps> = ({
  pretendentes,
  onUnlockLead,
  onOpenChatWithBuyer,
  isOpenAsModal = false,
  onCloseModal,
  customTitle
}) => {
  // Estado local para garantir que os 4 cards solicitados pelo usuário estejam sempre presentes
  const [leadsState, setLeadsState] = useState<PretendenteLead[]>(() => {
    return DEFAULT_BLURRED_LEADS;
  });

  const [selectedLeadToUnlock, setSelectedLeadToUnlock] = useState<PretendenteLead | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>('single');
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSuccessModal, setIsSuccessModal] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [reRecordingRequested, setReRecordingRequested] = useState<Record<string, boolean>>({});

  const handleRequestReRecording = (leadId: string) => {
    setReRecordingRequested((prev) => ({ ...prev, [leadId]: true }));
  };

  const packagesInfo: Record<PackageOption, { title: string; price: string; numPrice: number; badge?: string; desc: string }> = {
    single: {
      title: '1 Desbloqueio Avulso',
      price: 'R$ 19,90',
      numPrice: 19.9,
      desc: 'Libere o contato completo e converse diretamente pelo chat'
    },
    pack5: {
      title: 'Pacote 5 Leads',
      price: 'R$ 79,90',
      numPrice: 79.9,
      badge: 'MAIS VENDIDO',
      desc: 'R$ 15,98 por comprador compatível (economia imediata de 20%)'
    },
    days7: {
      title: 'Pacote 7 Dias Ilimitado',
      price: 'R$ 70,00',
      numPrice: 70.0,
      badge: 'MELHOR CUSTO',
      desc: 'Desbloqueie todas as procuras compatíveis que chegarem em 7 dias'
    },
    premium: {
      title: 'Plano PREMIUM',
      price: 'R$ 99,90/mês',
      numPrice: 99.9,
      badge: 'VIP RECOMENDADO',
      desc: 'Selo PREMIUM dourado, sobe no topo do feed e leads ilimitados'
    },
    highlight: {
      title: 'DESTAQUE Supremo',
      price: 'R$ 149,90',
      numPrice: 149.9,
      badge: 'MÁXIMA VISIBILIDADE',
      desc: 'Fixo na 1ª dobra do feed + Notificação Push VIP para compradores'
    }
  };

  const handleStartCheckout = (lead: PretendenteLead, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedLeadToUnlock(lead);
    setSelectedPackage('single');
    setIsSuccessModal(false);
  };

  const handleConfirmPayment = () => {
    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setIsSuccessModal(true);
      if (selectedLeadToUnlock) {
        setLeadsState((prev) =>
          prev.map((l) => (l.id === selectedLeadToUnlock.id ? { ...l, isUnlocked: true } : l))
        );
        try {
          localStorage.setItem('euquero_user_premium', 'true');
          window.dispatchEvent(new Event('storage'));
        } catch (e) {}
        onUnlockLead(selectedLeadToUnlock.id);
      }
    }, 1200);
  };

  const handleCopyPix = () => {
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  };

  const mainTitle = customTitle || "4 compradores se encaixam no que você vende";

  const content = (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. HEADER HONESTO ACIMA DO PRIMEIRO CARD                                  */}
      {/* ========================================================================= */}
      <div className="text-center sm:text-left p-6 sm:p-7 rounded-[24px] bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white border-2 border-orange-500/40 shadow-xl relative overflow-hidden">
        {/* Glow laranja de fundo */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-[#FF6B00]/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            {/* Badge pequeno laranja: PAINEL DO VENDEDOR · PROCURAS ATIVAS COMPATÍVEIS (PRODUTO + VALOR + REGIÃO) */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-[#FF6B00] text-[11px] font-black uppercase tracking-wider mb-2.5">
              <Flame className="w-3.5 h-3.5 fill-[#FF6B00]" />
              <span>PAINEL DO VENDEDOR · PROCURAS ATIVAS COMPATÍVEIS (PRODUTO + VALOR + REGIÃO)</span>
            </div>
            
            {/* Título H2 branco 22px: [4] compradores se encaixam no que você vende */}
            <h2 
              className="font-black font-display tracking-tight text-white leading-tight"
              style={{ fontSize: '22px' }}
            >
              {customTitle || `${leadsState.length || 4} compradores se encaixam no que você vende`}
            </h2>
            
            {/* Subtexto cinza 13px: Compatibilidade baseada em dados reais: modelo, faixa de valor e região. Não prometemos fechamento - conectamos a compradores reais. */}
            <p 
              className="text-slate-300 mt-2 max-w-xl leading-relaxed"
              style={{ fontSize: '13px' }}
            >
              Compatibilidade baseada em dados reais: modelo, faixa de valor e região. Não prometemos fechamento - conectamos a compradores reais.
            </p>
          </div>

          <div className="shrink-0 flex items-center justify-center sm:justify-end">
            <div className="bg-slate-900/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-slate-700/80 text-center shadow-inner">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Desbloqueio Avulso
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                R$ 19,90
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">por contato compatível</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. OS 4 CARDS BORRADOS (EFEITO BLUR FORTE) UM EM CIMA DO OUTRO (TINDER)  */}
      {/* ========================================================================= */}
      <div className="max-w-2xl mx-auto space-y-4">
        {leadsState.map((lead, index) => {
          return (
            <div
              key={lead.id}
              className={`group relative rounded-[24px] p-5 sm:p-6 border-2 transition-all duration-300 overflow-hidden shadow-lg ${
                lead.isUnlocked
                  ? 'bg-white border-[#00A86B] ring-4 ring-emerald-500/10'
                  : 'bg-gradient-to-br from-slate-900 via-[#131d31] to-slate-900 border-slate-800 text-white hover:border-orange-500/50'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                
                {/* Bloco Esquerda: Foto Borrada + Informações do Comprador */}
                <div className="flex items-start sm:items-center gap-4">
                  {/* Foto de Perfil com Efeito Blur Forte */}
                  <div className="relative shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700 shadow-md">
                    {lead.avatarUrl ? (
                      <img
                        src={lead.avatarUrl}
                        alt="Comprador"
                        className={`w-full h-full object-cover transition-all duration-500 ${
                          lead.isUnlocked
                            ? 'filter-none scale-100'
                            : 'filter blur-lg scale-125 select-none pointer-events-none opacity-70'
                        }`}
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700 flex items-center justify-center" />
                    )}

                    {/* Cadeado sobre a foto se estiver borrada */}
                    {!lead.isUnlocked && (
                      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-slate-950/80 border border-amber-400/50 flex items-center justify-center text-amber-400 shadow-md">
                          <Lock className="w-4 h-4 stroke-[2.5]" />
                        </div>
                      </div>
                    )}

                    {lead.isUnlocked && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#00A86B] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Textos solicitados: Local + O que quer + Orçamento + Compatibilidade */}
                  <div className="space-y-1">
                    {/* Topo do Card: Localização e Match */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 text-xs font-black text-[#FF6B00] bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20 font-mono">
                        <Flame className="w-3 h-3 fill-[#FF6B00]" />
                        <span>Compatibilidade: {lead.compatibilityScore}%</span>
                      </span>

                      <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Comprador em {lead.buyerCity}, {lead.buyerState}</span>
                      </span>

                      {/* Selo de Vídeo Verificado / Exemplo */}
                      {lead.isExampleVideo ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/30">
                          <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                          <span>Vídeo Exemplo (Bloqueado)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 stroke-[2.5] shrink-0" />
                          <span>Vídeo Verificado · {lead.videoRecordedDate || '26/09/2026'}</span>
                        </span>
                      )}
                    </div>

                    {/* O que ele quer comprar */}
                    <h3 className={`text-base sm:text-lg font-black leading-snug tracking-tight ${
                      lead.isUnlocked ? 'text-slate-900' : 'text-white'
                    }`}>
                      {lead.desiredSubtype}
                    </h3>

                    {/* FIX LAYOUT: Orçamento em linha única inquebrável (flex nowrap, gap 8px, white-space nowrap) */}
                    <div 
                      className="flex items-center flex-nowrap whitespace-nowrap pt-1"
                      style={{
                        display: 'flex',
                        flexWrap: 'nowrap',
                        gap: '8px',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <span className="text-xs sm:text-sm font-bold text-slate-400 shrink-0 select-none">
                        Orçamento:
                      </span>
                      <span 
                        className="font-bold font-mono text-[16px] sm:text-[18px] text-[#10B981] tabular-nums shrink-0"
                        style={{ color: '#10B981', fontWeight: 700 }}
                      >
                        R$ {lead.buyerBudget.toLocaleString('pt-BR')}
                      </span>
                      {lead.urgency && (
                        <span className="text-[10px] text-amber-400 font-bold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20 shrink-0 hidden xs:inline-block">
                          {lead.urgency}
                        </span>
                      )}
                    </div>

                    {/* Nome do Comprador se Liberado */}
                    {lead.isUnlocked && (
                      <p className="text-xs font-bold text-emerald-700 pt-1">
                        ✓ Contato liberado: <strong>{lead.realBuyerName}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Bloco Direita: Botão de Ação com margin-bottom 24px para não cortar */}
                <div className="shrink-0 pt-2 sm:pt-0">
                  {lead.isUnlocked ? (
                    <button
                      type="button"
                      onClick={() => onOpenChatWithBuyer(lead.buyerDemandItem)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-[#00A86B] hover:bg-emerald-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/20"
                      style={{ marginBottom: '24px' }}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Conversar no Chat</span>
                    </button>
                  ) : lead.isExampleVideo ? (
                    <button
                      type="button"
                      onClick={(e) => handleStartCheckout(lead, e)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-red-600/25 group-hover:scale-[1.02]"
                      style={{ marginBottom: '24px' }}
                      title="Vídeo de exemplo detectado. Bloqueado até regravação."
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Vídeo Exemplo (Bloqueado)</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => handleStartCheckout(lead, e)}
                      className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-orange-600 hover:to-amber-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/25 group-hover:scale-[1.02]"
                      style={{ marginBottom: '24px' }}
                    >
                      <Unlock className="w-4 h-4" />
                      <span>Desbloquear por R$ 19,90</span>
                    </button>
                  )}
                </div>

              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 3. TABELA DE PACOTES DE MONETIZAÇÃO ESTILO APP DE ENCONTRO               */}
      {/* ========================================================================= */}
      <div className="p-5 sm:p-6 rounded-[24px] bg-white border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-black text-slate-900 font-display flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Pacotes Econômicos para Vendedores</span>
            </h4>
            <p className="text-xs text-slate-500">
              Desbloqueie múltiplos leads com até 50% de economia ou assine o plano ilimitado.
            </p>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 w-fit">
            🔒 Compra 100% segura via Pix ou Cartão
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div 
            onClick={() => handleStartCheckout(leadsState[0] || {} as any)}
            className="p-4 rounded-2xl border-2 border-orange-500 bg-orange-50/40 flex flex-col justify-between gap-3 cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
          >
            <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
              Mais Vendido
            </span>
            <div>
              <span className="text-xs font-black text-slate-900">Pacote 5 Leads</span>
              <p className="text-[11px] text-slate-500 mt-0.5">R$ 15,98 por comprador compatível</p>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-orange-200">
              <span className="text-lg font-black text-slate-900 font-mono">R$ 79,90</span>
              <span className="text-xs font-bold text-orange-600">Economia 20%</span>
            </div>
          </div>

          <div 
            onClick={() => handleStartCheckout(leadsState[0] || {} as any)}
            className="p-4 rounded-2xl border-2 border-slate-200 bg-white hover:border-slate-300 flex flex-col justify-between gap-3 cursor-pointer hover:shadow-md transition-all"
          >
            <div>
              <span className="text-xs font-black text-slate-900">7 Dias Ilimitado</span>
              <p className="text-[11px] text-slate-500 mt-0.5">Acesso a todas as procuras compatíveis da semana</p>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-slate-100">
              <span className="text-lg font-black text-slate-900 font-mono">R$ 70,00</span>
              <span className="text-xs font-bold text-slate-500">Sem limite</span>
            </div>
          </div>

          <div 
            onClick={() => handleStartCheckout(leadsState[0] || {} as any)}
            className="p-4 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50/30 flex flex-col justify-between gap-3 cursor-pointer hover:shadow-md transition-all relative overflow-hidden"
          >
            <span className="absolute top-2 right-2 text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full">
              VIP Anual
            </span>
            <div>
              <span className="text-xs font-black text-amber-950 flex items-center gap-1">
                <Crown className="w-3 h-3 fill-amber-600" />
                <span>Plano PREMIUM</span>
              </span>
              <p className="text-[11px] text-amber-800 mt-0.5">Selo dourado no feed + Leads grátis</p>
            </div>
            <div className="flex items-baseline justify-between pt-2 border-t border-amber-200">
              <span className="text-lg font-black text-slate-900 font-mono">R$ 99,90<span className="text-xs font-medium text-slate-500">/mês</span></span>
              <span className="text-xs font-bold text-amber-700">Topo do feed</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL DE CHECKOUT (PIX E CARTÃO)                                       */}
      {/* ========================================================================= */}
      {selectedLeadToUnlock && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150"
          onClick={() => setSelectedLeadToUnlock(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative w-full max-w-xl bg-white rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header do Checkout */}
            <div className="p-6 bg-gradient-to-r from-[#0F172A] via-[#1E293B] to-[#0F172A] text-white relative shrink-0">
              <button
                type="button"
                onClick={() => setSelectedLeadToUnlock(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-1">
                <Flame className="w-5 h-5 text-[#FF6B00] fill-[#FF6B00]" />
                <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                  Desbloqueio de Comprador Compatível
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-display">
                Comprador em {selectedLeadToUnlock.buyerCity}, {selectedLeadToUnlock.buyerState}
              </h3>
              <p className="text-xs text-slate-300 mt-1">
                {selectedLeadToUnlock.desiredSubtype} · Orçamento: <strong>R$ {selectedLeadToUnlock.buyerBudget.toLocaleString('pt-BR')}</strong> · Compatibilidade: <strong>{selectedLeadToUnlock.compatibilityScore}%</strong>
              </p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              
              {/* SUCESSO / DESBLOQUEADO */}
              {isSuccessModal ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#00A86B] flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h4 className="text-xl font-black text-slate-900 font-display">
                    Contato Compatível Desbloqueado com Sucesso!
                  </h4>
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-left max-w-sm mx-auto space-y-1">
                    <p className="text-xs text-slate-500">Nome do Comprador:</p>
                    <p className="text-sm font-black text-slate-900">{selectedLeadToUnlock.realBuyerName}</p>
                    <p className="text-xs text-slate-500 pt-1">Demanda:</p>
                    <p className="text-xs font-bold text-emerald-800">
                      {selectedLeadToUnlock.desiredSubtype} · Orçamento até R$ {selectedLeadToUnlock.buyerBudget.toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedLeadToUnlock(null);
                      setIsSuccessModal(false);
                      onOpenChatWithBuyer(selectedLeadToUnlock.buyerDemandItem);
                    }}
                    className="px-6 py-3 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-black text-sm transition-all shadow-md cursor-pointer"
                  >
                    Abrir Chat com Comprador Agora
                  </button>
                </div>
              ) : selectedLeadToUnlock.isExampleVideo ? (
                /* SE FOR EXEMPLO, BLOQUEAR E PEDIR PARA REGRAVAR */
                <div className="p-5 sm:p-6 rounded-2xl bg-red-50 border-2 border-red-300 space-y-4 shadow-sm text-left">
                  <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-inner">
                      <ShieldAlert className="w-6 h-6 stroke-[2.5]" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-200/80 px-2 py-0.5 rounded-md">
                        Vídeo Bloqueado
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-red-950 mt-1 leading-tight">
                        Exemplo ou Catálogo da Internet Detectado
                      </h4>
                      <p className="text-xs text-red-800 mt-1 leading-relaxed">
                        Identificamos que este pretendente utilizou um link genérico ou vídeo de exemplo institucional. Na nossa plataforma, <strong>não aceitamos link genérico</strong>: o vídeo da própria pessoa é <strong>obrigatório e verificado</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-red-200 text-xs text-slate-700 space-y-1">
                    <span className="font-bold text-red-900 block text-[11px] uppercase tracking-wide">
                      Regra de Segurança EuQuero:
                    </span>
                    <p className="text-[11px] leading-relaxed text-slate-600">
                      O desbloqueio por R$ 19,90 foi bloqueado para este contato até que o anunciante regrave um vídeo real de até 30s mostrando o motor, hidráulica e número de série da máquina.
                    </p>
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => handleRequestReRecording(selectedLeadToUnlock.id)}
                      disabled={!!reRecordingRequested[selectedLeadToUnlock.id]}
                      className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md ${
                        reRecordingRequested[selectedLeadToUnlock.id]
                          ? 'bg-emerald-600 text-white shadow-emerald-600/25'
                          : 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/25 active:scale-[0.98]'
                      }`}
                    >
                      {reRecordingRequested[selectedLeadToUnlock.id] ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                          <span>✓ Notificação Enviada: Regravação Solicitada!</span>
                        </>
                      ) : (
                        <>
                          <Video className="w-4 h-4" />
                          <span>Pedir para Regravar Vídeo da Própria Máquina</span>
                        </>
                      )}
                    </button>
                    {reRecordingRequested[selectedLeadToUnlock.id] && (
                      <p className="text-[11px] text-emerald-800 font-bold text-center mt-2">
                        O usuário recebeu uma notificação prioritária no WhatsApp e no App para gravar o vídeo autêntico.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* TARJA VERDE OBRIGATÓRIA: "✅ Vídeo verificado da própria máquina - gravado em Paulínia/SP" */}
                  <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 shadow-xs flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm font-black text-emerald-900 block leading-tight">
                        ✅ Vídeo verificado da própria máquina - gravado em Paulínia/SP
                      </span>
                      <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                        Filmagem comprovada da própria máquina operando no local em 26/09/2026 (bomba, motor e esteiras autênticos).
                      </span>
                    </div>
                  </div>

                  {/* SELEÇÃO DO PACOTE */}
                  <div>
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-2">
                      Escolha o Pacote de Desbloqueio:
                    </label>
                    <div className="space-y-2">
                      {(Object.keys(packagesInfo) as PackageOption[]).map((pkgKey) => {
                        const pkg = packagesInfo[pkgKey];
                        const isSelected = selectedPackage === pkgKey;

                        return (
                          <div
                            key={pkgKey}
                            onClick={() => setSelectedPackage(pkgKey)}
                            className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'border-[#FF6B00] bg-orange-50/50 shadow-xs ring-2 ring-orange-500/20'
                                : 'border-slate-200 hover:border-slate-300 bg-white'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                  isSelected
                                    ? 'border-[#FF6B00] bg-[#FF6B00]'
                                    : 'border-slate-300'
                                }`}
                              >
                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                              </div>

                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-black text-slate-900">
                                    {pkg.title}
                                  </span>
                                  {pkg.badge && (
                                    <span className="text-[9px] font-black uppercase bg-[#FF6B00] text-white px-2 py-0.5 rounded-full">
                                      {pkg.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">{pkg.desc}</p>
                              </div>
                            </div>

                            <span className="text-sm sm:text-base font-black font-mono text-slate-900 shrink-0">
                              {pkg.price}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* FORMA DE PAGAMENTO */}
                  <div className="pt-2 border-t border-slate-100">
                    <label className="text-xs font-black uppercase text-slate-500 tracking-wider block mb-2">
                      Forma de Pagamento:
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          paymentMethod === 'pix'
                            ? 'border-[#00A86B] bg-emerald-50 text-emerald-950 shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <QrCode className="w-4 h-4 text-[#00A86B]" />
                        <span>Pix (Aprovação Instantânea)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all ${
                          paymentMethod === 'card'
                            ? 'border-[#00A86B] bg-emerald-50 text-emerald-950 shadow-xs'
                            : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-4 h-4 text-[#00A86B]" />
                        <span>Cartão de Crédito</span>
                      </button>
                    </div>

                    {paymentMethod === 'pix' && (
                      <div className="mt-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">Chave Pix Copia e Cola:</span>
                          <button
                            type="button"
                            onClick={handleCopyPix}
                            className="text-xs font-black text-[#00A86B] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>{pixCopied ? 'Código Copiado!' : 'Copiar Chave'}</span>
                          </button>
                        </div>
                        <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-[10px] font-mono text-slate-600 truncate select-all">
                          00020126580014br.gov.bcb.pix0136euquero-leads-{selectedLeadToUnlock.id}-f707bfda
                        </div>
                      </div>
                    )}
                  </div>

                  {/* BOTÃO FINAL DE CONFIRMAÇÃO */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isProcessingPayment}
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#00A86B] to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 cursor-pointer disabled:opacity-75"
                    >
                      {isProcessingPayment ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Processando liberação do pretendente...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-white" />
                          <span>Confirmar Pagamento de {packagesInfo[selectedPackage].price}</span>
                        </>
                      )}
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-2 font-medium">
                      🔒 Pagamento 100% criptografado · Liberação imediata do pretendente
                    </p>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isOpenAsModal) {
    return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200"
        onClick={onCloseModal}
      >
        <div 
          className="relative w-full max-w-4xl bg-[#F8F9FA] rounded-[28px] shadow-2xl p-5 sm:p-7 my-auto max-h-[92vh] overflow-y-auto border border-slate-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-200/80">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-[#FF6B00]">
                <Flame className="w-4 h-4 fill-[#FF6B00]" />
              </div>
              <h3 className="text-lg sm:text-xl font-black font-display text-slate-900 tracking-tight">
                Ver Pretendentes Borrados
              </h3>
            </div>
            
            <button
              type="button"
              onClick={onCloseModal}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              title="Fechar painel"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {content}
        </div>
      </div>
    );
  }

  return content;
};
