/**
 * Sessão real — a primeira vez que o app sabe QUEM é o usuário.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ISSO MUDA, E POR QUE É A ENTREGA MAIS ARRISCADA
 *
 * Antes, `ownerAuth.ts` respondia "quem é o dono" lendo
 * `localStorage['vendedor_dados']`. Isso não é autenticação: qualquer
 * pessoa abre o console e escreve
 * `{ id: 'outro-id', cpf: '...' }` e a tela passa a mostrar "você" como
 * o dono de um anúncio que não é dela.
 *
 * Aqui a identidade vem de `auth.getUser()`. O token está no navegador,
 * mas o que vem assinado é o servidor, e o RLS decide o que essa pessoa
 * pode ler. Se alguém mexer no `localStorage`, não muda nada — porque
 * nada aqui lê o `localStorage`.
 *
 * ─────────────────────────────────────────────────────────────────────
 * DUAS REGRAS QUE NÃO SE DESCULPA
 *
 * 1. CONFIRMAÇÃO DE E-MAIL LIGADA. Um cadastro sem confirmar e-mail é um
 *    cadastro que qualquer um faz com o e-mail de outra pessoa. Isso é
 *    o que segura o cadastro de spam e de conta falsa. Desligar isso
 *    em produção seria trocar a garantia mais importante do cadastro por
 *    conveniência de teste.
 *
 * 2. CPF E TELEFONE NÃO SÃO PEDIDOS AQUI. O cadastro pede só e-mail,
 *    senha e nome. Dado sensível se pede de quem vai publicar anúncio —
 *    o comprador entra sem atrito, e a informação sensível é coletada
 *    só de quem ganha com ela.
 * ─────────────────────────────────────────────────────────────────────
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/* ─────────────────────────── cliente ─────────────────────────── */

/**
 * `import.meta.env` só existe sob o Vite. Nos testes do Node ele é
 * `undefined`, e um acesso direto derrubaria o módulo inteiro na
 * importação. Ler por cima de `??` trata os dois casos: no app, a chave
 * configurada; nos testes, string vazia — que é a mesma coisa que
 * "não configurado", e cai no caminho de erro que já existe.
 */
const ENV = (import.meta as { env?: Record<string, string | undefined> }).env ?? {};

const URL_SUPABASE = (ENV.VITE_SUPABASE_URL ?? '').toString().trim();
const CHAVE = (ENV.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').toString().trim();

/**
 * A chave que vai no bundle tem que ser a `publishable`.
 *
 * A `service_role` é a chave mestra: ela ignora RLS, e quem a tivesse
 * controlaria o banco inteiro. A `publishable` é pública por desenho —
 * vai no bundle de qualquer site, e a proteção real é o RLS. A checagem
 * abaixo é para pegar o erro de configuração mais caro que existe:
 * alguém colar a mestra no `.env` do front.
 */
const CHAVE_PUBLISHABLE = /^sb_publishable_[A-Za-z0-9_-]+$/;

let cliente: SupabaseClient | null = null;
let clienteTentado = false;

/**
 * injections de teste.
 *
 * Mesma ideia do `listingRepository`: o serviço recebe o cliente em vez
 * de fabricar um dentro. Assim o teste não precisa de rede e não precisa
 * reescrever módulo ESM — que, diferente de CommonJS, é somente-leitura
 * e não aceita monkey-patch.
 *
 * `__injetarCliente(null)` volta ao caminho normal de configuração.
 */
export const __injetarCliente = (c: unknown): void => {
  cliente = (c as SupabaseClient) ?? null;
  clienteTentado = true;
};

/** Reseta o cache para os testes que Dependsem de `import.meta.env`. */
export const __resetarCliente = (): void => {
  cliente = null;
  clienteTentado = false;
};

export const temConfigSessao = (): boolean =>
  Boolean(URL_SUPABASE) && CHAVE_PUBLISHABLE.test(CHAVE);

const obterCliente = (): SupabaseClient | null => {
  if (clienteTentado) return cliente;
  clienteTentado = true;

  if (!URL_SUPABASE) {
    console.warn(
      '[euquero] VITE_SUPABASE_URL ausente. A tela de login vai aparecer, ' +
        'mas nenhum cadastro vai funcionar até isso ser configurado.'
    );
    return null;
  }
  if (!CHAVE_PUBLISHABLE.test(CHAVE)) {
    console.warn(
      '[euquero] VITE_SUPABASE_PUBLISHABLE_KEY com formato inesperado. ' +
        'A chave do front tem que começar com sb_publishable_. ' +
        'Se for service_role, remova do .env IMEDIATAMENTE.'
    );
    return null;
  }

  cliente = createClient(URL_SUPABASE, CHAVE);
  return cliente;
};

/* ─────────────────────────── tipos ─────────────────────────── */

export interface Sessao {
  uid: string;
  email: string;
  nome: string;
}

export type ErroCadastro =
  | 'email-existe'
  | 'senha-curta'
  | 'email-invalido'
  | 'desconhecido';

export interface ResultadoCadastro {
  ok: boolean;
  /** `true` quando o Supabase criou a conta e mandou o e-mail de
   *  confirmação. Nesse caso ainda NÃO existe sessão: o usuário precisa
   *  clicar no link que chegou. */
  aguardandoConfirmacao: boolean;
  erro: ErroCadastro | null;
  mensagem: string;
}

/* ─────────────────────── cadastro e login ─────────────────────── */

/**
 * MINHA SENHA: 8 caracteres, com letra e número.
 *
 * Oito é o piso do Supabase, não um número que achei bonito. A senha
 * curta é o vetor mais comum de conta invadida, e o custo de pedir oito
 * é pequeno comparado ao de recuperar um anúncio.
 */
const MINIMO_SENHA = 8;
const TEM_NUMERO = /\d/;
const TEM_LETRA = /[A-Za-z]/;

export const validarSenha = (senha: string): string | null => {
  if (senha.length < MINIMO_SENHA) return `A senha precisa de pelo menos ${MINIMO_SENHA} caracteres.`;
  if (!TEM_LETRA.test(senha) || !TEM_NUMERO.test(senha)) {
    return 'A senha precisa ter pelo menos uma letra e um número.';
  }
  return null;
};

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validarEmail = (email: string): string | null => {
  if (!email.trim()) return 'Escreva seu e-mail.';
  if (!EMAIL_VALIDO.test(email.trim())) return 'Esse e-mail não parece válido.';
  return null;
};

/**
 * Cadastra. Devolve `aguardandoConfirmacao: true` quando deu certo — e
 * isso é a coisa mais importante desse retorno: a conta existe, mas o
 * usuário ainda NÃO entrou. Sem sessão até clicar no link do e-mail.
 */
export const cadastrar = async (
  email: string,
  senha: string,
  nome: string
): Promise<ResultadoCadastro> => {
  const cli = obterCliente();
  if (!cli) {
    return { ok: false, aguardandoConfirmacao: false, erro: 'desconhecido',
      mensagem: 'O aplicativo ainda não está ligado a um banco de dados.' };
  }

  const erroEmail = validarEmail(email);
  if (erroEmail) return { ok: false, aguardandoConfirmacao: false, erro: 'email-invalido', mensagem: erroEmail };

  const erroSenha = validarSenha(senha);
  if (erroSenha) return { ok: false, aguardandoConfirmacao: false, erro: 'senha-curta', mensagem: erroSenha };

  if (!nome.trim()) {
    return { ok: false, aguardandoConfirmacao: false, erro: 'desconhecido', mensagem: 'Escreva seu nome.' };
  }

  try {
    const { data, error } = await cli.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        // O nome vai para os metadados do usuário, e o trigger do banco
        // copia para `profiles`. É o mesmo caminho que a produção já usa.
        data: { full_name: nome.trim() },
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        return { ok: false, aguardandoConfirmacao: false, erro: 'email-existe',
          mensagem: 'Esse e-mail já tem conta. Faça login.' };
      }
      return { ok: false, aguardandoConfirmacao: false, erro: 'desconhecido', mensagem: error.message };
    }

    // `session === null` é o caso normal quando a confirmação de e-mail
    // está ligada: conta criada, e-mail enviado, ninguém logado ainda.
    const temSessao = Boolean(data.session);
    return {
      ok: true,
      aguardandoConfirmacao: !temSessao,
      erro: null,
      mensagem: temSessao
        ? 'Conta criada. Você já está conectado.'
        : 'Conta criada! Confira seu e-mail e clique no link para confirmar.',
    };
  } catch (erro) {
    return { ok: false, aguardandoConfirmacao: false, erro: 'desconhecido',
      mensagem: erro instanceof Error ? erro.message : 'Falha no cadastro.' };
  }
};

export interface ResultadoLogin {
  ok: boolean;
  erro: 'credenciais' | 'email-nao-confirmado' | 'desconhecido' | null;
  mensagem: string;
}

export const entrar = async (email: string, senha: string): Promise<ResultadoLogin> => {
  const cli = obterCliente();
  if (!cli) {
    return { ok: false, erro: 'desconhecido', mensagem: 'O aplicativo ainda não está ligado a um banco de dados.' };
  }

  const erroEmail = validarEmail(email);
  if (erroEmail) return { ok: false, erro: 'credenciais', mensagem: erroEmail };
  if (!senha) return { ok: false, erro: 'credenciais', mensagem: 'Escreva sua senha.' };

  try {
    const { error } = await cli.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (!error) return { ok: true, erro: null, mensagem: 'Você entrou.' };

    const msg = error.message.toLowerCase();
    if (msg.includes('email not confirmed')) {
      return { ok: false, erro: 'email-nao-confirmado',
        mensagem: 'Confira seu e-mail e confirme a conta antes de entrar.' };
    }
    if (msg.includes('invalid login credentials')) {
      return { ok: false, erro: 'credenciais', mensagem: 'E-mail ou senha errados.' };
    }
    return { ok: false, erro: 'desconhecido', mensagem: error.message };
  } catch (erro) {
    return { ok: false, erro: 'desconhecido',
      mensagem: erro instanceof Error ? erro.message : 'Falha no login.' };
  }
};

/**
 * "Esqueci minha senha".
 *
 * O envio é sempre neutro: "se esse e-mail existir, mandamos o link".
 * Dizer "não existe essa conta" transforma o formulário numa lista de
 * e-mails cadastrados, e essa resposta não pode sair daqui.
 */
/**
 * A única resposta que este formulário pode dar.
 *
 * Serve tanto para "e-mail enviado" quanto para "e-mail não existe" e
 * para "deu erro". Quem tentar descobrir quais e-mails têm conta olhando
 * para esta tela não encontra nada — e a diferença de tempo entre os
 * casos também não ajuda, porque as duas saídas são a mesma linha.
 */
const NEUTRO = 'Se esse e-mail tiver conta, o link de redefinição já saiu.';

export const recuperarSenha = async (email: string): Promise<{ ok: boolean; mensagem: string }> => {
  const cli = obterCliente();
  if (!cli) return { ok: false, mensagem: 'O aplicativo ainda não está ligado a um banco de dados.' };

  const erroEmail = validarEmail(email);
  if (erroEmail) return { ok: false, mensagem: erroEmail };

  // `window` não existe fora do browser (nos testes, por exemplo).
  // Sem este guarda, um `ReferenceError` aqui cairia no `catch` e
  // devolveria uma mensagem de erro técnico para o usuário.
  const origem =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : '';

  try {
    const { error } = await cli.auth.resetPasswordForEmail(
      email.trim(),
      origem ? { redirectTo: origem + '/redefinir-senha' } : undefined
    );

    if (error) {
      // O erro do servidor NÃO vai para a tela. "User not found" aqui
      // seria uma resposta perfeita à pergunta que este formulário
      // não deveria responder: quem tem conta.
      //
      // A neutralidade vale inclusive quando a requisição falha: quem
      // está tentando adivinhar e-mails não ganha sinal nenhum.
      return { ok: true, mensagem: NEUTRO };
    }
    return { ok: true, mensagem: NEUTRO };
  } catch {
    return { ok: true, mensagem: NEUTRO };
  }
};

/* ─────────────────────── ler a sessão ─────────────────────── */

/**
 * O mesmo cliente, para telas que precisam de `auth` diretamente.
 *
 * A tela de redefinição precisa de `updateUser`, que não faz parte do
 *Vocabulário de sessão (é troca de credencial, não leitura de estado).
 * Devolver o mesmo cliente garante que a sessão de recuperação vinda
 * do link seja a mesma que o app usou para pedi-lo.
 */
export const obterClienteParaTela = (): SupabaseClient | null => obterCliente();

/**
 * Monta a `Sessao` a partir de um usuário do Supabase.
 *
 * Extraído porque os dois caminhos — o callback e a leitura inicial —
 * precisam devolver exatamente a mesma coisa. Divergir entre os dois
 * significaria que o menu mostra um nome no primeiro carregamento e
 * outro depois do login, sem que ninguém perceba por quê.
 */
export const sessaoDoUsuario = (u: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
} | null | undefined): Sessao | null => {
  if (!u) return null;
  return {
    uid: u.id,
    email: u.email ?? '',
    nome: (u.user_metadata?.full_name as string | undefined)?.trim() || 'Cliente',
  };
};

/**
 * Lê a sessão atual, chamando o SERVIDOR.
 *
 * `getSession()` sozinho não serve: ele lê o token do armazenamento
 * local e decodifica, sem perguntar a ninguém se ainda vale. Quem
 * responde se a sessão existe de verdade é `getUser()`, que vai no
 * servidor com o token.
 *
 * O que NÃO acontece aqui: ler id de `localStorage`, aceitar id como
 * argumento, ou devolver um id "para não quebrar a tela" quando a
 * consulta falha. Falha devolve `null`, e quem chama trata.
 */
export const lerSessaoAtual = async (): Promise<Sessao | null> => {
  const cli = obterCliente();
  if (!cli) return null;

  try {
    const { data, error } = await cli.auth.getUser();
    if (error || !data.user) return null;

    return sessaoDoUsuario(data.user);
  } catch {
    return null;
  }
};

/** Sai. Invalida o refresh token no servidor, não só o local. */
export const sair = async (): Promise<void> => {
  const cli = obterCliente();
  if (!cli) return;
  try {
    await cli.auth.signOut();
  } catch {
    // Falha ao sair não pode deixar ninguém preso na tela. O listener
    // de sessão abaixo limpa o estado de qualquer forma.
  }
};

/**
 * Acompanha login, logout e renovação de token.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE NÃO CHAMA `getUser()` AQUI DENTRO
 *
 * O callback do `onAuthStateChange` roda DURANTE o processamento da
 * mudança de autenticação, e o cliente serializa esses eventos: um
 * `await` para outra chamada do Supabase dentro do callback pode ficar
 * esperando um cadeado que o próprio callback segura. O sintoma é um
 * app que trava no spinner depois do login, e um `getSession()` que
 * nunca resolve mais até a aba recarregar. Isso é o bug relatado em
 * supabase/auth-js#762.
 *
 * A solução é não precisar da chamada: o próprio callback JÁ ENTREGA a
 * sessão, no segundo argumento. Montar a `Sessao` a partir dela é
 * trabalho síncrono, sem `await` e sem risco de deadlock.
 *
 * O nome vem de `user_metadata`, que é o que o cadastro gravou. A
 * identidade (`uid`) vem do servidor, do mesmo jeito de antes — o que
 * muda é apenas que não há mais uma ida ao servidor dentro do
 * callback.
 *
 * Sobre o que o `getUser()` garante: ele valida o token no servidor. O
 * token do callback acabou de ser emitido ou validado pela própria
 * biblioteca, e é ele que autoriza as consultas. A validação mais
 * forte continua acontecendo no `lerSessaoAtual()`, que é chamado ao
 * abrir o app e antes de qualquer operação privilegiada.
 * ─────────────────────────────────────────────────────────────────────
 */
export const aoMudarSessao = (cb: (s: Sessao | null) => void): (() => void) => {
  const cli = obterCliente();
  if (!cli) return () => {};

  const { data } = cli.auth.onAuthStateChange((_evento, sessaoAtual) => {
    // síncrono, sem await, sem chamada ao Supabase
    if (!sessaoAtual?.user) {
      cb(null);
      return;
    }
    const u = sessaoAtual.user;
    cb({
      uid: u.id,
      email: u.email ?? '',
      nome: (u.user_metadata?.full_name as string | undefined)?.trim() || 'Cliente',
    });
  });

  return () => data.subscription.unsubscribe();
};
