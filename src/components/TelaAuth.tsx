/**
 * Tela de entrar e criar conta.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE ISSO É MAIS QUE UM FORMULÁRIO
 *
 * A tela é a peça que o usuário espera. O que segura o dado é o que tem
 * embaixo dela, e o que está embaixo é o ponto:
 *
 *   - A senha nunca é comparada aqui. O Supabase compara, no servidor.
 *   - O id do usuário NUNCA aparece neste arquivo. Não entra como
 *     campo, não é lido do `localStorage`, não é salvo. A tela só sabe
 *     se deu certo ou não.
 *   - "Esqueci minha senha" responde igual para e-mail que existe e
 *     para e-mail que não existe. Responder diferente transforma o
 *     formulário numa lista de quem tem conta.
 *   - CPF e telefone não aparecem. Sai no passo em que a pessoa vai
 *     publicar um anúncio — dado sensível é pedido de quem precisa dele.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import type { ResultadoCadastro } from '../services/sessao';
import {
  cadastrar,
  entrar,
  recuperarSenha,
  validarEmail,
  validarSenha,
} from '../services/sessao';

type Aba = 'entrar' | 'criar' | 'recuperar';

interface Props {
  aberto: boolean;
  onFechar: () => void;
  /** Chamado quando o login dá certo. Recebe o uid do servidor. */
  onEntrou: (uid: string, nome: string) => void;
  /**
   * TASK 2 (FRICÇÃO ZERO) — por que a tela de login apareceu.
   *
   * A pessoa pode BUSCAR sem conta. O login só é pedido no CONTATO.
   * Sem esta explicação, ela acha que precisa entrar para ver os
   * anúncios — e volta para a Home sem ver nada.
   */
  motivo?: string;
}

const classes = {
  fundo:
    'fixed inset-0 z-[60] flex items-center justify-center p-4 ' +
    'bg-slate-950/70 backdrop-blur-sm overflow-y-auto',
  caixa:
    'relative w-full max-w-md w-full bg-white rounded-2xl shadow-2xl ' +
    'overflow-hidden my-auto',
  campo:
    'w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm ' +
    'text-slate-900 placeholder:text-slate-400 focus:outline-none ' +
    'focus:ring-2 focus:ring-[#FF6B00] focus:border-[#FF6B00] ' +
    'transition-all disabled:bg-slate-50',
  rotulo: 'block text-xs font-bold text-slate-700 mb-1.5',
  primario:
    'w-full rounded-xl bg-[#FF6B00] text-white py-3 text-sm font-black ' +
    'hover:bg-[#E55F00] disabled:bg-slate-300 disabled:cursor-not-allowed ' +
    'transition-colors',
};

const TITULO: Record<Aba, string> = {
  entrar: 'Entrar',
  criar: 'Criar conta',
  recuperar: 'Recuperar senha',
};

const Descricao: Record<Aba, string> = {
  entrar: 'Use o e-mail e a senha da sua conta.',
  criar: 'Só e-mail, senha e nome. O resto você preenche quando anunciar.',
  recuperar: 'Se o e-mail tiver conta, o link de redefinição chega em instantes.',
};

export const TelaAuth: React.FC<Props> = ({ aberto, onFechar, onEntrou, motivo }) => {
  const [aba, setAba] = useState<Aba>('entrar');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  // TASK 2: o WhatsApp do comprador. Vai nos metadados do usuário.
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [verSenha, setVerSenha] = useState(false);

  // Trocar de aba limpa a mensagem. Senão o "conta criada, confira o
  // e-mail" continua na tela quando a pessoa vai para o login.
  useEffect(() => {
    setErro(null);
    setAviso(null);
  }, [aba]);

  // Esc fecha, mas não enquanto está no meio de uma requisição: sair da
  // tela no meio de um cadastro deixa a pessoa sem saber se deu certo.
  useEffect(() => {
    if (!aberto) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !ocupado) onFechar();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [aberto, ocupado, onFechar]);

  if (!aberto) return null;

  const trocarAba = (nova: Aba) => {
    setAba(nova);
    setSenha('');
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ocupado) return;

    setErro(null);
    setAviso(null);

    if (aba === 'recuperar') {
      const problema = validarEmail(email);
      if (problema) { setErro(problema); return; }
      setOcupado(true);
      const r = await recuperarSenha(email);
      setOcupado(false);
      if (r.ok) setAviso(r.mensagem);
      else setErro(r.mensagem);
      return;
    }

    if (aba === 'criar') {
      const problemaSenha = validarSenha(senha);
      if (problemaSenha) { setErro(problemaSenha); return; }
      if (!nome.trim()) { setErro('Escreva seu nome.'); return; }
    }

    setOcupado(true);
    // A union é desfeita aqui: cada ramo só acessa os campos que tem.
    const criando = aba === 'criar';
    const r = criando
      ? await cadastrar(email, senha, nome, telefone)
      : await entrar(email, senha);
    setOcupado(false);

    if (criando) {
      const rc = r as ResultadoCadastro;
      if (rc.ok) {
        if (rc.aguardandoConfirmacao) {
          setAviso(rc.mensagem);
          // Não joga para a aba de login: a pessoa ainda não tem conta
          // utilizável, e ver "e-mail ou senha errados" seria mentira.
        } else {
          // Sem confirmação exigida, o Supabase já devolveu sessão.
          onEntrou('', '');
        }
      } else {
        setErro(rc.mensagem);
      }
      return;
    }

    if (r.ok) {
      // O login deu certo; a sessão real é lida pelo App.
      onEntrou('', '');
    } else {
      setErro(r.mensagem);
    }
  };

  const podeEnviar = !ocupado && email.trim() !== '' && (aba === 'recuperar' || senha !== '');

  return (
    <div className={classes.fundo} onMouseDown={(e) => {
      if (e.target === e.currentTarget && !ocupado) onFechar();
    }}>
      <div className={classes.caixa} role="dialog" aria-modal="true" aria-label={TITULO[aba]}>
        <div className="flex items-center justify-between px-6 pt-6 pb-2">
          <div>
            <h2 className="text-xl font-black text-slate-900">{TITULO[aba]}</h2>
            <p className="text-xs text-slate-500 mt-1">{Descricao[aba]}</p>
            {/*
              TASK 2: o aviso do motivo. A pessoa já viu os anúncios —
              ela só precisa se identificar para falar com o vendedor.
            */}
            {motivo && (
              <p className="mt-2 text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                {motivo}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onFechar}
            disabled={ocupado}
            aria-label="Fechar"
            className="w-9 h-9 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700
                       disabled:opacity-40 transition-colors"
          >
            <span className="text-lg leading-none">×</span>
          </button>
        </div>

        <form onSubmit={enviar} className="px-6 pb-6 pt-4 space-y-4" noValidate>
          {aba === 'criar' && (
            <div>
              <label className={classes.rotulo} htmlFor="auth-nome">Nome</label>
              <input
                id="auth-nome"
                className={classes.campo}
                type="text"
                autoComplete="name"
                placeholder="Como quer ser chamado"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={ocupado}
                maxLength={80}
              />
            </div>
          )}

          {/*
            TASK 2 (FRICÇÃO ZERO) — o WhatsApp do comprador.

            Aparece SÓ no cadastro. É o contato que pede a
            identificação: quando a pessoa entra para falar com o
            vendedor, ela diz quem é e como o vendedor a encontra.

            Vai para `user_metadata.phone`, e o trigger do banco copia
            para `profiles.phone`. Nenhum SQL novo.

            Opcional de propósito: quem já tem conta não digita de
            novo, e a busca não exige nada disso.
          */}
          {aba === 'criar' && (
            <div>
              <label className={classes.rotulo} htmlFor="auth-telefone">
                WhatsApp{' '}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                id="auth-telefone"
                className={classes.campo}
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="(11) 90000-0000"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                disabled={ocupado}
                maxLength={20}
              />
            </div>
          )}

          <div>
            <label className={classes.rotulo} htmlFor="auth-email">E-mail</label>
            <input
              id="auth-email"
              className={classes.campo}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={ocupado}
              required
            />
          </div>

          {aba !== 'recuperar' && (
            <div>
              <label className={classes.rotulo} htmlFor="auth-senha">Senha</label>
              <div className="relative">
                <input
                  id="auth-senha"
                  className={`${classes.campo} pr-12`}
                  type={verSenha ? 'text' : 'password'}
                  autoComplete={aba === 'criar' ? 'new-password' : 'current-password'}
                  placeholder={aba === 'criar' ? 'Mínimo 8, com letra e número' : 'Sua senha'}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  disabled={ocupado}
                  required
                />
                <button
                  type="button"
                  onClick={() => setVerSenha((v) => !v)}
                  disabled={ocupado}
                  aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold
                             text-slate-400 hover:text-slate-700 px-2 py-1
                             disabled:opacity-40 transition-colors"
                >
                  {verSenha ? 'OCULTAR' : 'VER'}
                </button>
              </div>
            </div>
          )}

          {erro && (
            <div role="alert"
                 className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3
                            text-xs font-bold text-rose-700">
              {erro}
            </div>
          )}
          {aviso && (
            <div role="status"
                 className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3
                            text-xs font-bold text-emerald-700">
              {aviso}
            </div>
          )}

          <button type="submit" className={classes.primario} disabled={!podeEnviar}>
            {ocupado
              ? 'Aguarde…'
              : aba === 'entrar' ? 'ENTRAR'
              : aba === 'criar' ? 'CRIAR CONTA'
              : 'MANDAR LINK'}
          </button>

          <div className="flex items-center justify-between pt-1 text-xs">
            {aba === 'entrar' ? (
              <>
                <button type="button" onClick={() => trocarAba('criar')}
                        className="font-bold text-[#FF6B00] hover:underline">
                  Criar conta
                </button>
                <button type="button" onClick={() => trocarAba('recuperar')}
                        className="text-slate-500 hover:text-slate-800 hover:underline">
                  Esqueci minha senha
                </button>
              </>
            ) : (
              <button type="button" onClick={() => trocarAba('entrar')}
                      className="font-bold text-slate-600 hover:underline">
                ← Voltar para entrar
              </button>
            )}
          </div>
        </form>

        <div className="px-6 pb-5 pt-1">
          <p className="text-[11px] leading-relaxed text-slate-400 border-t border-slate-100 pt-4">
            Ao criar conta você concorda em usar o Eu Quero para negociar
            máquinas. CPF e telefone são pedidos só na hora de publicar um
            anúncio.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelaAuth;
