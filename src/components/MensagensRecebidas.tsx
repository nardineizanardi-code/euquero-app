/**
 * Mensagens recebidas — o outro lado do contato.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * POR QUE ESTE COMPONENTE EXISTE
 * ═══════════════════════════════════════════════════════════════════════
 * O comprador escreve para o vendedor. A mensagem vai para a tabela
 * `messages`, no banco. Se ninguém LÊ essa tabela, o contato não
 * existe: o comprador escreve, e a mensagem morre no servidor.
 *
 * Este é o lugar onde ela é lida.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O TELEFONE NÃO ESTÁ AQUI
 * ═══════════════════════════════════════════════════════════════════════
 * O que aparece é a MENSAGEM, o NOME do comprador e o anúncio. O
 * telefone do comprador não vem: `user_phone` está na tabela
 * `listings`, e a política de `messages` não dá acesso a ela.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE PODE FALHAR
 * ═══════════════════════════════════════════════════════════════════════
 * A leitura depende de duas políticas que NÃO estão confirmadas — a de
 * `messages` e a de `matches`. Se elas não existirem, a lista volta
 * vazia, e este componente mostra "nenhuma mensagem" — sem inventar
 * que a mensagem não chegou. O que o componente NÃO faz é dizer que
 * a mensagem foi entregue: ele mostra o que o banco devolveu.
 */

import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Inbox, Loader2, AlertCircle } from 'lucide-react';

export interface MensagemRecebida {
  id: string;
  autorId: string;
  texto: string;
  criadoEm: string;
  matchId: string;
  listingId: string;
}

interface MensagensRecebidasProps {
  aberto: boolean;
  onFechar: () => void;
  /** Carrega as mensagens. Rejeição vira aviso, não tela branca. */
  carregar: () => Promise<MensagemRecebida[]>;
  /** O nome do anúncio, para a pessoa saber do que se trata. */
  tituloDoAnuncio: (listingId: string) => string;
}

export const MensagensRecebidas: React.FC<MensagensRecebidasProps> = ({
  aberto,
  onFechar,
  carregar,
  tituloDoAnuncio,
}) => {
  const [mensagens, setMensagens] = useState<MensagemRecebida[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!aberto) return;
    let vivo = true;

    setCarregando(true);
    setErro(null);

    carregar()
      .then((lista) => {
        if (!vivo) return;
        setMensagens(lista);
      })
      .catch((e) => {
        if (!vivo) return;
        setErro(e instanceof Error ? e.message : 'não foi possível carregar as mensagens');
      })
      .finally(() => {
        if (vivo) setCarregando(false);
      });

    return () => {
      vivo = false;
    };
  }, [aberto, carregar]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#00A86B]/10 text-[#00A86B] flex items-center justify-center">
              <Inbox className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 leading-tight">
                Mensagens recebidas
              </h3>
              <p className="text-[10px] text-slate-400">
                Quem entrou em contato com os seus anúncios
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onFechar}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {carregando && (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>carregando…</span>
            </div>
          )}

          {!carregando && erro && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 border border-amber-200 p-3.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed">
                {erro}
              </p>
            </div>
          )}

          {!carregando && !erro && mensagens.length === 0 && (
            <div className="text-center py-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-700">Nenhuma mensagem ainda</p>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Quando alguém entrar em contato com um anúncio seu, a mensagem
                aparece aqui.
              </p>
            </div>
          )}

          {!carregando &&
            !erro &&
            mensagens.map((m) => (
              <div
                key={m.id}
                className="rounded-2xl border border-slate-200 p-3.5 bg-slate-50/60"
              >
                <div className="flex items-center justify-between gap-3 mb-1.5">
                  <p className="text-[10px] font-black text-slate-500 truncate">
                    {tituloDoAnuncio(m.listingId)}
                  </p>
                  <p className="text-[10px] text-slate-400 shrink-0">
                    {formatarQuando(m.criadoEm)}
                  </p>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap break-words">
                  {m.texto}
                </p>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

/** "agora", "há 5 min", "há 2 h", "ontem", ou a data. */
const formatarQuando = (iso: string): string => {
  if (!iso) return '';
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '';

  const minutos = Math.floor((Date.now() - data.getTime()) / 60000);
  if (minutos < 1) return 'agora';
  if (minutos < 60) return `há ${minutos} min`;
  if (minutos < 1440) return `há ${Math.floor(minutos / 60)} h`;

  const dias = Math.floor(minutos / 1440);
  if (dias === 1) return 'ontem';
  if (dias < 7) return `há ${dias} dias`;

  return data.toLocaleDateString('pt-BR');
};
