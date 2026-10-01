import React, { useState } from 'react';
import { 
  X, ShieldCheck, Share2, Copy, CheckCircle2, MessageSquare, 
  ExternalLink, Sparkles, Smartphone, Users, AlertTriangle, ArrowRight, Video
} from 'lucide-react';
import { ListingItem } from '../types';
import { 
  generateDisplayProductLink, 
  getShareableProductUrl, 
  generateDisplayInviteLink, 
  getShareableInviteUrl 
} from '../utils/productLinks';

interface AntiBloqueioWhatsAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerItems: ListingItem[];
  selectedItem?: ListingItem | null;
  onSimulateInviteBuyer?: (buyerName?: string) => void;
}

export const AntiBloqueioWhatsAppModal: React.FC<AntiBloqueioWhatsAppModalProps> = ({
  isOpen,
  onClose,
  sellerItems,
  selectedItem: initialSelectedItem,
  onSimulateInviteBuyer
}) => {
  const [activeTab, setActiveTab] = useState<'machine_link' | 'invite_link'>('machine_link');
  const [selectedItem, setSelectedItem] = useState<ListingItem | null>(() => {
    return initialSelectedItem || sellerItems[0] || null;
  });
  const [copyFeedback, setCopyFeedback] = useState<string>('');
  const [invitedSuccessNotice, setInvitedSuccessNotice] = useState<string>('');

  if (!isOpen) return null;

  const currentMachine = selectedItem || sellerItems[0] || {
    id: 'sell-1',
    title: 'Escavadeira CAT 320D 2019',
    locationCity: 'Paulínia/SP',
    userName: 'Nardinei Silva'
  };

  const sellerName = currentMachine.userName || 'Nardinei Silva';
  const displayMachineLink = generateDisplayProductLink(currentMachine);
  const shareableMachineUrl = getShareableProductUrl(currentMachine);

  // Mensagem solicitada para Botão 1:
  // "Veja minha [Máquina] com 4 fotos e vídeo no EuQuero: [link produto] - VENDENDO EM: [Cidade]/[Estado] - Nardinei Silva"
  const machineCityState = currentMachine.locationState 
    ? `${currentMachine.locationCity}/${currentMachine.locationState}`
    : currentMachine.locationCity || 'Joinville/SC';
  const machineShareMessage = `Veja minha ${currentMachine.title} com 4 fotos e vídeo no EuQuero: ${displayMachineLink} - VENDENDO EM: ${machineCityState} - ${sellerName}`;

  // Link e Mensagem solicitada para Botão 2:
  // "Entra no EuQuero, app de máquinas pesadas: [link convite] - Tem minha máquina e mais 500 máquinas! HOJE: 501 COMPRADORES ATIVOS"
  const displayInviteLink = generateDisplayInviteLink(sellerName);
  const shareableInviteUrl = getShareableInviteUrl(sellerName);
  const inviteShareMessage = `Entra no EuQuero, app de máquinas pesadas: ${displayInviteLink} - Tem minha máquina e mais 500 máquinas! HOJE: 501 COMPRADORES ATIVOS`;

  const handleCopyText = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopyFeedback(`${label} copiado com sucesso!`);
      setTimeout(() => setCopyFeedback(''), 3000);
    } catch (e) {
      setCopyFeedback('Texto pronto para envio.');
    }
  };

  const handleOpenWhatsApp = (text: string) => {
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleTriggerSimulateInvite = () => {
    onSimulateInviteBuyer?.();
    setInvitedSuccessNotice('🎉 Novo comprador ativo cadastrado via seu link de convite! O contador subiu +1!');
    setTimeout(() => setInvitedSuccessNotice(''), 4500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Toast flutuante de cópia */}
      {copyFeedback && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[70] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 border border-emerald-400 font-bold text-xs sm:text-sm animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{copyFeedback}</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header do Modal Anti-Bloqueio */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Solução Oficial Anti-Bloqueio WhatsApp</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white leading-tight">
            Envie 1 Link Só — Sem Mandar 100 Fotos no WhatsApp
          </h3>

          <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
            Mandar muitas fotos e vídeos pesados no WhatsApp derruba o número do vendedor. No EuQuero você envia 1 link rápido: o cliente abre no navegador, vê as 4 fotos em alta definição e o vídeo funcionando.
          </p>

          {/* Abas dos 2 Botões Oficiais */}
          <div className="flex gap-2 pt-4 border-t border-slate-700/60 mt-4">
            <button
              type="button"
              onClick={() => setActiveTab('machine_link')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'machine_link'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>1. Link da Máquina com Fotos</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invite_link')}
              className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'invite_link'
                  ? 'bg-[#FF6B00] text-white shadow-md'
                  : 'bg-white/10 text-slate-300 hover:bg-white/15'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>2. Meu Link de Convite</span>
            </button>
          </div>
        </div>

        {/* Corpo do Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* ========================================================================= */}
          {/* ABA 1: LINK DA MINHA MÁQUINA COM FOTOS                                    */}
          {/* ========================================================================= */}
          {activeTab === 'machine_link' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Seletor de Máquina caso tenha mais de 1 */}
              {sellerItems.length > 1 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Selecione qual máquina você deseja compartilhar:
                  </label>
                  <select
                    value={selectedItem?.id || ''}
                    onChange={(e) => {
                      const found = sellerItems.find((it) => it.id === e.target.value);
                      if (found) setSelectedItem(found);
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:border-orange-500 outline-none"
                  >
                    {sellerItems.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title} ({item.locationCity}) - R$ {item.price.toLocaleString('pt-BR')}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Card de Demonstração da Mensagem Pronta */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border-2 border-amber-300/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Share2 className="w-3.5 h-3.5 text-orange-600" />
                    <span>Mensagem Pronta para o Cliente:</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full font-mono">
                    Zero fotos no WhatsApp
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed shadow-2xs select-all">
                  "{machineShareMessage}"
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>• <strong>Link único gerado:</strong> <code className="text-orange-700 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-orange-200">{displayMachineLink}</code></p>
                  <p>• O cliente clica no link e visualiza o carrossel com as 4 fotos, vídeo verificado da máquina e ficha técnica completa no navegador.</p>
                </div>
              </div>

              {/* Botões de Ação para Enviar ou Copiar */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(machineShareMessage, 'Texto com link da máquina')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-300 active:scale-95"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copiar Mensagem</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(machineShareMessage)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#00875A] hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Mandar no WhatsApp</span>
                </button>
              </div>

              {/* Card de Alerta Anti-Bloqueio */}
              <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-white text-xs space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Benefício: Proteja seu número do WhatsApp</span>
                </div>
                <p className="text-slate-300 text-[11px] leading-relaxed">
                  Enviar dezenas de fotos para contatos pode acionar os filtros anti-spam do WhatsApp e causar bloqueio de conta. Com o link do EuQuero, você compartilha tudo com 1 toque com segurança total.
                </p>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: MEU LINK DE CONVITE DO EUQUERO                                     */}
          {/* ========================================================================= */}
          {activeTab === 'invite_link' && (
            <div className="space-y-4 animate-in fade-in">
              
              {/* Notificação de sucesso da simulação */}
              {invitedSuccessNotice && (
                <div className="p-3.5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-emerald-950 font-bold text-xs sm:text-sm flex items-center gap-2.5 animate-in slide-in-from-top-2">
                  <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{invitedSuccessNotice}</span>
                </div>
              )}

              <div className="p-4 rounded-2xl bg-orange-50/70 border-2 border-orange-300/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-orange-600" />
                    <span>Link Pessoal do Vendedor:</span>
                  </span>
                  <span className="text-[10px] font-bold text-orange-900 bg-orange-200/90 px-2 py-0.5 rounded-full font-mono">
                    {displayInviteLink}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-orange-200 text-xs sm:text-sm text-slate-800 font-medium leading-relaxed shadow-2xs select-all">
                  "{inviteShareMessage}"
                </div>

                <div className="text-[11px] text-slate-600 space-y-1">
                  <p>• <strong>Estratégia das Caixas 101-110:</strong> Quem entra por esse link vira <strong>COMPRADOR ATIVO</strong> e sobe o contador da plataforma (501, 502, 503... crescendo!).</p>
                  <p>• O comprador vê sua máquina logo no topo do feed com prioridade no EloMatch.</p>
                </div>
              </div>

              {/* Botões de Ação para Enviar ou Copiar Convite */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleCopyText(inviteShareMessage, 'Link de convite')}
                  className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer border border-slate-300 active:scale-95"
                >
                  <Copy className="w-4 h-4 text-slate-600" />
                  <span>Copiar Convite</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenWhatsApp(inviteShareMessage)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#00875A] hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>Convidar no WhatsApp</span>
                </button>
              </div>

              {/* Simulador Interativo: Subir o Contador */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">
                    Testar Entrada de Comprador via Convite:
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Simula um cliente clicando no seu convite e virando Comprador Ativo.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleTriggerSimulateInvite}
                  className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-black shrink-0 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Simular +1 no Contador</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">
            Vendedor Oficial: <strong>{sellerName}</strong>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
