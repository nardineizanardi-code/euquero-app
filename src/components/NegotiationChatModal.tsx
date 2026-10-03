import React, { useState } from 'react';
import { 
  X, Send, Sparkles, Phone, ExternalLink, Check, Clock, 
  DollarSign, ShieldCheck, CheckCircle2, ShieldAlert, Lock, AlertTriangle
} from 'lucide-react';
import { MatchResult, ChatMessage } from '../types';
import { mascararTelefone } from '../utils/productLinks';

interface NegotiationChatModalProps {
  match: MatchResult | null;
  onClose: () => void;
  messages: ChatMessage[];
  onSendMessage: (matchId: string, text: string, proposalPrice?: number) => void;
  onAcceptProposal: (messageId: string) => void;
}

/**
 * Regex para detectar tentativas de compartilhamento de contato externo:
 * - Telefones com DDD (ex: (19) 99844-3210, 19 998443210, 1998443210, 99844-3210)
 * - Sequências numéricas longas (8+ dígitos)
 * - E-mails (usuario@provedor.com)
 * - Menções a whats/zap com números
 */
const CONTACT_BYPASS_REGEX = /(?:\(?\b\d{2}\)?\s*9?\s*\d{4}[-.\s]?\d{4}\b)|(?:\b\d{8,12}\b)|(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})|(?:\b(?:whats|zap|contato|me\s*chama|telefone|fone|celular|insta|arroba)\b.*?\d{3,})/i;

export const NegotiationChatModal: React.FC<NegotiationChatModalProps> = ({
  match,
  onClose,
  messages,
  onSendMessage,
  onAcceptProposal
}) => {
  const [inputText, setInputText] = useState('');
  const [showProposalInput, setShowProposalInput] = useState(false);
  const [customPrice, setCustomPrice] = useState('');
  const [securityBlockWarning, setSecurityBlockWarning] = useState<string | null>(null);
  const [isContactRevealed, setIsContactRevealed] = useState(false);

  if (!match) return null;

  const buyer = match.buyerDemand;
  const seller = match.sellerListing;
  const matchMessages = messages.filter((m) => m.matchId === match.id);

  // Verifica se há alguma proposta formal aceita neste chat
  const hasAcceptedProposal = matchMessages.some((m) => m.proposalStatus === 'accepted');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityBlockWarning(null);

    if (!inputText.trim() && !customPrice) return;

    // BLOQUEIO ANTI-BURLE OBRIGATÓRIO SE AINDA NÃO HOUVE PROPOSTA ACEITA
    if (!hasAcceptedProposal && CONTACT_BYPASS_REGEX.test(inputText)) {
      setSecurityBlockWarning('Por segurança, compartilhamento de contato só após proposta aceita.');
      return;
    }

    const propPrice = customPrice ? parseFloat(customPrice.replace(/\D/g, '')) : undefined;
    onSendMessage(match.id, inputText, propPrice);

    setInputText('');
    setCustomPrice('');
    setShowProposalInput(false);
  };

  const handleWhatsApp = () => {
    // REGRA PROMPT 1:
    // "Telefone só pode aparecer quando usuário logado clica em 'Falar com Vendedor no App' dentro do chat interno."
    setIsContactRevealed(true);
    const cleanPhone = (seller.userPhone || '47996205669').replace(/\D/g, '');
    const msg = encodeURIComponent(
      `Olá ${seller.userName}! Sou usuário do app Eu Quero e estou negociando sobre "${seller.title}".`
    );
    window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-[24px] shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh] max-h-[750px]">
        
        {/* Chat Header com Indicador de Segurança Anti-Fraude */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {seller.userName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  {seller.userName} & {buyer.userName}
                </h3>
                <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                  {match.score}% Match
                </span>
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">
                Ativo: <strong>{seller.title}</strong> · R$ {seller.price.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* O Telefone e WhatsApp só podem aparecer quando o usuário logado clica em 'Falar com Vendedor no App' dentro do chat interno */}
            <button
              type="button"
              onClick={handleWhatsApp}
              className={`px-3 py-1.5 text-xs font-black text-white rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 ${
                hasAcceptedProposal || isContactRevealed
                  ? 'bg-[#00A86B] hover:bg-emerald-600 shadow-emerald-600/20'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
              title="Falar com Vendedor no App"
            >
              <Phone className="w-3.5 h-3.5" />
              <span>{hasAcceptedProposal || isContactRevealed ? 'Telefone Liberado' : 'Falar com Vendedor no App'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Resumo do Ativo / Contexto Rápido */}
        <div className="p-3 bg-slate-100/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">Equipamento:</span>
            <span>{seller.subcategoryType} ({seller.brand} {seller.model || ''})</span>
            <span className="text-slate-300">·</span>
            <span>Ano {seller.year || seller.condition}</span>
            {seller.hoursUsed && (
              <>
                <span className="text-slate-300">·</span>
                <span>{seller.hoursUsed.toLocaleString('pt-BR')}h de uso</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Valor Anunciado:</span>
            <span className="font-bold text-slate-900 font-mono tabular-nums">
              R$ {seller.price.toLocaleString('pt-BR')}
            </span>
          </div>
        </div>

        {/* LEMBRETE DE ASSUNTO ANTERIOR (PONTO 4 DO PROMPT) */}
        <div className="px-4 py-2.5 bg-orange-50 border-b border-orange-200 text-xs text-orange-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-base">💬</span>
            <span className="font-medium">
              <strong>Histórico salvo:</strong> Você conversou sobre <strong>{seller.title}</strong> de <strong>{seller.locationCity}/{seller.locationState}</strong> ontem — Continuar negociando?
            </span>
          </div>
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0 border border-emerald-300">
            🛡️ 100% No App (Sem Risco WhatsApp)
          </span>
        </div>

        {/* Stream de Mensagens */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#F8F9FA]">
          {matchMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              <Sparkles className="w-8 h-8 text-[#00A86B] mx-auto mb-2" />
              <p className="font-bold text-slate-800">Canal direto de negociação ativo!</p>
              <p className="mt-1">Tire dúvidas técnicas, pergunte sobre manutenções ou envie uma proposta formal de preço.</p>
            </div>
          ) : (
            matchMessages.map((msg) => {
              const isAssistant = msg.senderName.includes('Assistente') || msg.senderName.includes('Eu Quero') || msg.senderName.includes('Notificações');
              const isBuyerMsg = msg.senderIntent === 'buy';

              if (isAssistant) {
                return (
                  <div key={msg.id} className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed max-w-xl mx-auto shadow-2xs">
                    <p>{msg.text}</p>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isBuyerMsg ? 'items-start' : 'items-end'}`}
                >
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mb-1 px-1">
                    <span className="font-bold text-slate-700">{msg.senderName}</span>
                    <span>·</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                      isBuyerMsg
                        ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-xs'
                        : 'bg-slate-900 text-white rounded-tr-sm shadow-xs'
                    }`}
                  >
                    <p>{msg.text}</p>

                    {/* Proposta Formal de Preço Registrada */}
                    {msg.proposalPrice && (
                      <div className={`mt-3 p-3 rounded-xl border text-xs ${
                        isBuyerMsg
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-slate-800 border-slate-700 text-emerald-300'
                      }`}>
                        <div className="flex items-center justify-between font-bold mb-1.5">
                          <span>Proposta Formal de Preço:</span>
                          <span className="font-mono text-sm font-black">
                            R$ {msg.proposalPrice.toLocaleString('pt-BR')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] opacity-80">
                            Status: {msg.proposalStatus === 'accepted' ? 'Aceita!' : 'Aguardando aceite'}
                          </span>
                          
                          {/* Botão de Aceitar Proposta para quem recebe */}
                          {msg.proposalStatus !== 'accepted' && (
                            <button
                              type="button"
                              onClick={() => onAcceptProposal(msg.id)}
                              className="px-3 py-1.5 text-xs font-black bg-[#00A86B] hover:bg-emerald-600 text-white rounded-lg cursor-pointer transition-all shadow-xs"
                            >
                              Aceitar Proposta
                            </button>
                          )}

                          {msg.proposalStatus === 'accepted' && (
                            <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-black">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Proposta Aceita
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {/* BANNER DE CONTATO DO VENDEDOR QUANDO O USUÁRIO CLICA EM 'FALAR COM VENDEDOR NO APP' OU PROPOSTA É ACEITA */}
          {(hasAcceptedProposal || isContactRevealed) && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border-2 border-[#00A86B] text-emerald-950 text-center space-y-2 shadow-md max-w-xl mx-auto my-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-center gap-2 font-black text-sm text-[#00A86B]">
                <CheckCircle2 className="w-5 h-5" />
                <span>🎉 Contato Oficial do Vendedor Liberado no App!</span>
              </div>
              <p className="text-xs text-slate-700">
                Você solicitou o contato direto do vendedor dentro do app seguro:
              </p>
              <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                <span className="px-3 py-1.5 bg-white border border-emerald-300 rounded-lg font-mono font-bold text-xs text-slate-900 shadow-xs">
                  {seller.userName}: {seller.userPhone || mascararTelefone('(47) 99620-5669')}
                </span>
                <button
                  type="button"
                  onClick={handleWhatsApp}
                  className="px-3.5 py-1.5 rounded-lg bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Abrir Conversa WhatsApp</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ALERTA DE BLOQUEIO DE CONTATO ANTI-BURLE */}
        {securityBlockWarning && (
          <div className="px-4 py-2.5 bg-rose-50 border-t border-rose-200 text-rose-800 text-xs font-bold flex items-center justify-between gap-2 animate-shake">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{securityBlockWarning}</span>
            </div>
            <button
              type="button"
              onClick={() => setSecurityBlockWarning(null)}
              className="text-rose-500 hover:text-rose-700 text-xs"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Sugestões Rápidas de Mensagens */}
        <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-slate-400 text-[11px] whitespace-nowrap">Sugestões:</span>
          <button
            type="button"
            onClick={() => setInputText('Olá! O equipamento possui laudo técnico e nota fiscal disponível para vistoria?')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Pedir laudo & NF
          </button>
          <button
            type="button"
            onClick={() => setInputText('Consigo agendar uma visita com meu mecânico nesta semana para inspecionar?')}
            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            Agendar visita técnica
          </button>
          <button
            type="button"
            onClick={() => {
              setShowProposalInput(true);
              setInputText('Gostaria de formalizar uma proposta com pagamento à vista conforme valor indicado:');
            }}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold rounded-md transition-colors whitespace-nowrap cursor-pointer"
          >
            + Fazer Proposta de Preço
          </button>
        </div>

        {/* Drawer de Proposta de Preço */}
        {showProposalInput && (
          <div className="px-4 py-2.5 bg-emerald-50/90 border-t border-emerald-200 flex items-center gap-3">
            <span className="text-xs font-bold text-emerald-900 whitespace-nowrap">
              Valor da proposta formal (R$):
            </span>
            <input
              type="number"
              step="5000"
              placeholder="Ex: 500000"
              value={customPrice}
              onChange={(e) => setCustomPrice(e.target.value)}
              className="w-40 px-3 py-1.5 text-xs bg-white border border-emerald-300 rounded-lg font-mono tabular-nums font-bold focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
            />
            <button
              type="button"
              onClick={() => setShowProposalInput(false)}
              className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Cancelar
            </button>
          </div>
        )}

        {/* Input de Mensagem */}
        <form onSubmit={handleSend} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            placeholder="Digite sua mensagem para o comprador / vendedor..."
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              if (securityBlockWarning) setSecurityBlockWarning(null);
            }}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A86B]"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-[#FF6B00] active:scale-[0.98] text-white font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Enviar</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>
    </div>
  );
};
