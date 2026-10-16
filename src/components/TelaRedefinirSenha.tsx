/**
 * Tela de redefinição de senha — a página `/redefinir-senha`.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE ELA EXISTE
 *
 * "Esqueci minha senha" manda um link. Se o link cai numa página que não
 * existe, a pessoa recebe o e-mail, clica, dá erro 404, e conclui que a
 * conta foi invadida. A tela de recuperação é metade do trabalho de
 * segurança de senha — sem ela, o botão de recuperação é pior que não
 * ter botão, porque promete uma saída que não existe.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTA TELA NÃO FAZ
 *
 * - Não aceita token pela URL como se fosse senha.
 * - Não valida a senha no navegador: valida o formato, e quem compara
 *   é o servidor.
 * - Não guarda nada em `localStorage`.
 * - Não decide sozinha que o link é válido: quem sabe é o Supabase, e
 *   um link inválido devolve erro de sessão, não um campo em branco.
 * ─────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import {
  obterClienteParaTela,
  sessaoDoUsuario,
  validarSenha,
  type Sessao,
} from '../services/sessao';

type Estado =
  | 'verificando'   // ainda não sabemos se o link vale
  | 'pronto'        // link válido, pode trocar a senha
  | 'invalido'      // link expirado, já usado ou adulterado
  | 'trocando'      // enviando a nova senha
  | 'concluido';    // senha trocada

const caixote = 'w-full max-w-md mx-auto my-auto';

export const TelaRedefinirSenha: React.FC = () => {
  const [estado, setEstado] = useState<Estado>('verificando');
  const [erro, setErro] = useState<string | null>(null);
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [ver, setVer] = useState(false);
  const [sessao, setSessao] = useState<Sessao | null>(null);

  /**
   * O link traz a sessão de recuperação na URL. O `detectSessionInUrl`
   * do cliente a processa e a guarda — mas o processamento é assíncrono,
   * e é por isso que existe o estado `verificando`: sem ele, a tela
   * piscaria "link inválido" antes de o cliente ter chance de lê-lo.
   *
   * `SIGNED_IN` com sessão de recuperação também pode disparar
   * `SIGNED_OUT` logo em seguida, quando a biblioteca consome o token.
   * Por isso a checagem espera um instante em vez de decidir no
   * primeiro evento.
   */
  useEffect(() => {
    const cli = obterClienteParaTela();
    if (!cli) {
      setEstado('invalido');
      setErro('O aplicativo não está ligado a um banco de dados.');
      return;
    }

    let vivo = true;
    let tentativas = 0;

    const checar = async () => {
      tentativas += 1;
      try {
        const { data, error } = await cli.auth.getSession();
        if (!vivo) return;

        if (error) {
          // Token recusado pelo servidor: link expirado, já usado ou
          // adulterado. Os três casos são a mesma coisa para quem está
          // na tela — não dá para distinguir, e não se deve tentar.
          setEstado('invalido');
          return;
        }

        const s = sessaoDoUsuario(data.session?.user);
        if (s) {
          setSessao(s);
          setEstado('pronto');
          return;
        }

        // Nenhuma sessão. Se ainda der tempo, tenta de novo: o cliente
        // pode estar processando o fragmento da URL.
        if (tentativas < 6) setTimeout(checar, 150);
        else setEstado('invalido');
      } catch {
        if (vivo) setEstado('invalido');
      }
    };

    void checar();
    return () => { vivo = false; };
  }, []);

  const trocar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (estado !== 'pronto') return;

    setErro(null);

    const problema = validarSenha(senha);
    if (problema) { setErro(problema); return; }

    if (senha !== confirmacao) {
      setErro('As duas senhas não são iguais.');
      return;
    }

    const cli = obterClienteParaTela();
    if (!cli) { setErro('O aplicativo não está ligado a um banco de dados.'); return; }

    setEstado('trocando');
    try {
      // A sessão de recuperação já está autenticada. `updateUser` troca
      // a senha no servidor e encerra a sessão de recuperação: o link
      // não pode ser reusado, mesmo que a pessoa abra a URL de novo.
      const { error } = await cli.auth.updateUser({ password: senha });

      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('new password should be different')) {
          setEstado('pronto');
          setErro('A nova senha precisa ser diferente da antiga.');
          return;
        }
        if (msg.includes('token') || msg.includes('session')) {
          setEstado('invalido');
          setErro('Este link expirou. Pede um novo em "Esqueci minha senha".');
          return;
        }
        setEstado('pronto');
        setErro(msg);
        return;
      }

      // Sai da sessão de recuperação. Sem isso, a pessoa fica
      // "logada" com um token que não pode mais ser usado para nada.
      await cli.auth.signOut();
      setSenha('');
      setConfirmacao('');
      setEstado('concluido');
    } catch (erroCapturado) {
      setEstado('pronto');
      setErro(erroCapturado instanceof Error ? erroCapturado.message : 'Falha ao trocar a senha.');
    }
  };

  /* ─────────────────── carregando ─────────────────── */
  if (estado === 'verificando') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className={caixote}>
          <p className="text-center text-sm text-slate-500">Conferindo o link…</p>
        </div>
      </div>
    );
  }

  /* ─────────────────── link inválido ─────────────────── */
  if (estado === 'invalido') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className={caixote}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 text-center">
            <h1 className="text-xl font-black text-slate-900 mb-3">Link inválido ou expirado</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              {erro ??
                'Este link de redefinição não vale mais. Ele expira em pouco tempo e só pode ser usado uma vez.'}
            </p>
            <a
              href="/"
              className="inline-block w-full rounded-xl bg-[#FF6B00] text-white py-3
                         text-sm font-black hover:bg-[#E55F00] transition-colors"
            >
              VOLTAR PARA O APP
            </a>
            <p className="text-xs text-slate-400 mt-4">
              Para pedir um novo, volte ao app e use “Esqueci minha senha”.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── concluído ─────────────────── */
  if (estado === 'concluido') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className={caixote}>
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-200 p-8 text-center">
            <h1 className="text-xl font-black text-slate-900 mb-3">Senha trocada</h1>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Agora é só entrar com a senha nova. Este link não funciona
              de novo — ele é de uso único.
            </p>
            <a
              href="/"
              className="inline-block w-full rounded-xl bg-[#FF6B00] text-white py-3
                         text-sm font-black hover:bg-[#E55F00] transition-colors"
            >
              IR PARA O LOGIN
            </a>
            {sessao && (
              <p className="text-xs text-slate-400 mt-4">
                Conta: {sessao.email}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─────────────────── troca ─────────────────── */
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className={caixote}>
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-8">
          <h1 className="text-xl font-black text-slate-900 mb-1">Nova senha</h1>
          <p className="text-xs text-slate-500 mb-6">
            Escolha uma senha que você não use em outro lugar.
          </p>

          {sessao && (
            <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2 mb-4">
              Conta: <strong className="text-slate-700">{sessao.email}</strong>
            </p>
          )}

          <form onSubmit={trocar} className="space-y-4" noValidate>
            <div>
              <label htmlFor="rs-senha"
                     className="block text-xs font-bold text-slate-700 mb-1.5">
                Senha nova
              </label>
              <input
                id="rs-senha"
                type={ver ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-[#FF6B00]
                           focus:border-[#FF6B00] transition-all"
                placeholder="Mínimo 8, com letra e número"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                disabled={estado === 'trocando'}
                required
              />
            </div>

            <div>
              <label htmlFor="rs-conf"
                     className="block text-xs font-bold text-slate-700 mb-1.5">
                Repetir a senha
              </label>
              <input
                id="rs-conf"
                type={ver ? 'text' : 'password'}
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3
                           text-sm text-slate-900 placeholder:text-slate-400
                           focus:outline-none focus:ring-2 focus:ring-[#FF6B00]
                           focus:border-[#FF6B00] transition-all"
                placeholder="De novo, a mesma"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                disabled={estado === 'trocando'}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={ver}
                onChange={(e) => setVer(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300"
              />
              Mostrar a senha enquanto digito
            </label>

            {erro && (
              <div role="alert"
                   className="rounded-xl bg-rose-50 border border-rose-200 px-4 py-3
                              text-xs font-bold text-rose-700">
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={estado === 'trocando' || senha === '' || confirmacao === ''}
              className="w-full rounded-xl bg-[#FF6B00] text-white py-3 text-sm font-black
                         hover:bg-[#E55F00] disabled:bg-slate-300 disabled:cursor-not-allowed
                         transition-colors"
            >
              {estado === 'trocando' ? 'Trocando…' : 'SALVAR NOVA SENHA'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TelaRedefinirSenha;
