/**
 * Testes da sessão.
 *
 * ESTES TESTES NÃO PROVAM QUE A AUTENTICAÇÃO FUNCIONA.
 *
 * O `supabase-js` aqui é um dublê. Os testes provam duas coisas, e só
 * duas:
 *   1. O caminho de código do app está certo (o que é enviado, o que
 *      é aceito, o que é mostrado).
 *   2. As regras que a tela impõe — senha mínima, e-mail válido,
 *      confirmação de e-mail ligada — não afrouxam por acidente.
 *
 * O que só se prova contra o banco de verdade, e ainda não foi provado:
 *   - Se a confirmação de e-mail está realmente LIGADA no euquero-teste.
 *   - Se o RLS barra um uid de outra pessoa.
 *   - Se o cascade de `auth.users` para `profiles` funciona.
 *
 * Esse é o passo 4 da entrega, e ele é leitura de banco, não teste
 * unitário. Aqui não dá para provar.
 */

import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

/* ─────────────────── dublê do cliente ───────────────────

   O `supabase-js` real faz rede, e módulo ESM é somente-leitura: não dá
   para trocar `createClient` por monkey-patch. Por isso o serviço aceita
   o cliente injetado (mesmo padrão do `listingRepository`), e o dublê
   abaixo tem a MESMA superfície dos métodos usados.

   Se o app parar de chamar o servidor do jeito certo, os testes quebram
   aqui — que é exatamente para onde eles devem quebrar.
*/

const chamadas = {
  signUp: [] as any[],
  signIn: [] as any[],
  reset: [] as any[],
  getUser: [] as any[],
  signOut: 0,
};

const respostas = {
  signUp: { data: { session: null }, error: null } as any,
  signIn: { error: null } as any,
  reset: { error: null } as any,
  getUser: { data: { user: null }, error: null } as any,
  signOut: undefined as any,
};

/**
 * O callback registrado pelo `aoMudarSessao`.
 *
 * Guardado para que o teste possa dispará-lo como o cliente real faria.
 * Sem isto, o teste só provaria que a função existe — não que ela monta
 * a sessão do jeito certo quando o evento chega.
 */
let callbackAuth: ((evento: string, sessao: unknown) => void) | null = null;

const dispararAuth = (evento: string, sessao: unknown) => {
  if (!callbackAuth) throw new Error('nenhum callback registrado — chame aoMudarSessao antes');
  callbackAuth(evento, sessao);
};

const zerarChamadas = () => {
  chamadas.signUp = []; chamadas.signIn = []; chamadas.reset = [];
  chamadas.getUser = []; chamadas.signOut = 0;
};

const duble = {
  auth: {
    signUp: async (a: any) => { chamadas.signUp.push(a); return respostas.signUp; },
    signInWithPassword: async (a: any) => { chamadas.signIn.push(a); return respostas.signIn; },
    resetPasswordForEmail: async (a: any) => { chamadas.reset.push(a); return respostas.reset; },
    getUser: async () => { chamadas.getUser.push(1); return respostas.getUser; },
    signOut: async () => { chamadas.signOut++; return respostas.signOut; },
    onAuthStateChange: (cb: (evento: string, sessao: unknown) => void) => {
      callbackAuth = cb;
      return { data: { subscription: { unsubscribe: () => { callbackAuth = null; } } } };
    },
  },
};

const carregar = async () => {
  const mod = await import('./sessao.ts');
  mod.__injetarCliente(duble);
  return mod;
};

const eq = (real: unknown, esperado: unknown, msg?: string) =>
  assert.deepStrictEqual(real, esperado, msg);

const contem = (real: string, padrao: RegExp) => assert.match(real, padrao);

/* ─────────────────── senha e e-mail ─────────────────── */

describe('validação de senha', () => {
  test('exige 8 caracteres', async () => {
    const { validarSenha } = await carregar();
    contem(validarSenha('abc123') ?? '', /8 caracteres/);
    eq(validarSenha('abcd1234'), null);
  });

  test('exige letra E número', async () => {
    const { validarSenha } = await carregar();
    // Passa no tamanho, falha no formato: é a falha que a tela tem que
    // pegar antes de gastar uma ida ao servidor.
    contem(validarSenha('abcdefgh') ?? '', /letra e um número/);
    contem(validarSenha('12345678') ?? '', /letra e um número/);
  });

  test('aceita 8+ caracteres com letra e número', async () => {
    const { validarSenha } = await carregar();
    eq(validarSenha('trator123'), null);
    eq(validarSenha('Maquina2019'), null);
  });
});

describe('validação de e-mail', () => {
  test('recusa vazio e formato quebrado', async () => {
    const { validarEmail } = await carregar();
    contem(validarEmail('') ?? '', /Escreva seu e-mail/);
    contem(validarEmail('sem-arroba.com') ?? '', /não parece válido/);
    contem(validarEmail('a@b') ?? '', /não parece válido/);
  });

  test('aceita e-mail normal', async () => {
    const { validarEmail } = await carregar();
    eq(validarEmail('joao@empresa.com.br'), null);
  });
});

/* ─────────────── cadastro pede SÓ o mínimo ─────────────── */

describe('cadastro pede apenas e-mail, senha e nome', () => {
  beforeEach(() => {
    zerarChamadas();
    respostas.signUp = { data: { session: null }, error: null };
  });

  test('envia full_name e nada de CPF ou telefone', async () => {
    const { cadastrar } = await carregar();
    await cadastrar('joao@empresa.com.br', 'trator123', 'João da Silva');

    eq(chamadas.signUp.length, 1, 'deveria chamar signUp uma vez');
    const arg = chamadas.signUp[0];
    eq(arg.email, 'joao@empresa.com.br');
    eq(arg.password, 'trator123');
    eq(arg.options.data, { full_name: 'João da Silva' });

    // A garantia é literal: o objeto inteiro é serializado e conferido.
    const serializado = JSON.stringify(arg).toLowerCase();
    assert.ok(!serializado.includes('cpf'), 'cadastro não pode mandar CPF');
    assert.ok(!serializado.includes('cnpj'), 'cadastro não pode mandar CNPJ');
    assert.ok(!serializado.includes('phone'), 'cadastro não pode mandar telefone');
    assert.ok(!serializado.includes('telefone'));
  });

  test('devolve aguardandoConfirmacao quando não há sessão', async () => {
    // Caso NORMAL: conta criada, e-mail enviado, ninguém logado.
    const { cadastrar } = await carregar();
    const r = await cadastrar('joao@empresa.com.br', 'trator123', 'João');
    eq(r.ok, true);
    eq(r.aguardandoConfirmacao, true);
    contem(r.mensagem, /Confira seu e-mail/);
  });

  test('trata e-mail já cadastrado como caso próprio', async () => {
    respostas.signUp = { data: { user: null, session: null }, error: { message: 'User already registered' } };
    const { cadastrar } = await carregar();
    const r = await cadastrar('joao@empresa.com.br', 'trator123', 'João');
    eq(r.ok, false);
    eq(r.erro, 'email-existe');
    contem(r.mensagem, /Faça login/);
  });

  test('recusa senha fraca ANTES de chamar o servidor', async () => {
    const { cadastrar } = await carregar();
    const r = await cadastrar('joao@empresa.com.br', '123', 'João');
    eq(r.ok, false);
    eq(chamadas.signUp.length, 0, 'não deveria ter ido ao servidor');
  });
});

/* ─────────────── login ─────────────── */

describe('login', () => {
  beforeEach(() => {
    zerarChamadas();
    respostas.signIn = { error: null };
  });

  test('trata e-mail não confirmado com mensagem própria', async () => {
    // Dizer "senha errada" para quem não confirmou manda a pessoa
    // ficar tentando de novo sem nunca entender o que houve.
    respostas.signIn = { error: { message: 'Email not confirmed' } };
    const { entrar } = await carregar();
    const r = await entrar('joao@empresa.com.br', 'trator123');
    eq(r.ok, false);
    eq(r.erro, 'email-nao-confirmado');
    contem(r.mensagem, /confirme a conta/);
  });

  test('traduz credencial inválida', async () => {
    respostas.signIn = { error: { message: 'Invalid login credentials' } };
    const { entrar } = await carregar();
    const r = await entrar('joao@empresa.com.br', 'errada123');
    eq(r.erro, 'credenciais');
    eq(r.mensagem, 'E-mail ou senha errados.');
  });
});

/* ─────────────── recuperação de senha ─────────────── */

describe('recuperar senha', () => {
  beforeEach(() => {
    zerarChamadas();
    respostas.reset = { error: null };
  });

  test('responde igual quando a conta existe e quando não existe', async () => {
    // A resposta tem que ser idêntica nos dois casos. Se differisse, o
    // formulário virava um oráculo de quais e-mails têm conta.
    respostas.reset = { error: null };
    const { recuperarSenha } = await carregar();
    const ok = await recuperarSenha('joao@empresa.com.br');

    respostas.reset = { error: { message: 'User not found' } };
    const falha = await recuperarSenha('ninguem@empresa.com.br');

    eq(ok.ok, true);
    eq(falha.mensagem, ok.mensagem);
    assert.ok(!/not found/i.test(falha.mensagem), 'não pode vazar erro do servidor');
  });
});

/* ─────────────── ler sessão: o ponto crítico ─────────────── */

describe('lerSessaoAtual', () => {
  beforeEach(() => {
    zerarChamadas();
    respostas.getUser = { data: { user: null }, error: null };
  });

  test('NÃO lê identidade do localStorage', async () => {
    // Este é o teste que trava a regressão mais importante da entrega.
    // Se alguém voltar a montar a sessão a partir do armazenamento
    // local, este teste cai.
    const { lerSessaoAtual } = await carregar();

    // Um localStorage armando com o id de outra pessoa. Tudo que o
    // navegador deixaria editar à mão está aqui, com valores plausíveis.
    const armadilha = new Map<string, string>([
      ['vendedor_dados', JSON.stringify({ id: 'uuid-de-outra-pessoa', cpf: '00000000000' })],
      ['user', JSON.stringify({ id: 'uuid-de-outra-pessoa', email: 'vitima@exemplo.com' })],
      ['session', JSON.stringify({ user: { id: 'uuid-de-outra-pessoa' } })],
      ['supabase.auth.token', 'token-falso-que-alguem-colou'],
    ]);
    Object.defineProperty(globalThis, 'localStorage', {
      value: {
        getItem: (k: string) => armadilha.get(k) ?? null,
        setItem: (k: string, v: string) => void armadilha.set(k, v),
        removeItem: (k: string) => void armadilha.delete(k),
        clear: () => armadilha.clear(),
      },
      configurable: true,
    });

    try {
      const s = await lerSessaoAtual();
      // O servidor respondeu "sem sessão". O localStorage cheio de id de
      // outra pessoa não muda a resposta — e é exatamente esse o teste.
      eq(s, null, 'localStorage não pode virar identidade');
      eq(chamadas.getUser.length, 1, 'a identidade tem que vir do servidor');
    } finally {
      Reflect.deleteProperty(globalThis as object, 'localStorage');
    }
  });

  test('devolve null quando não há sessão, nunca um id de mentira', async () => {
    const { lerSessaoAtual } = await carregar();
    eq(await lerSessaoAtual(), null);
  });

  test('lê nome dos metadados do usuário', async () => {
    respostas.getUser = {
      data: { user: { id: 'uid-real', email: 'joao@empresa.com.br', user_metadata: { full_name: 'João da Silva' } } },
      error: null,
    };
    const { lerSessaoAtual } = await carregar();
    eq(await lerSessaoAtual(), { uid: 'uid-real', email: 'joao@empresa.com.br', nome: 'João da Silva' });
  });

  test('usa "Cliente" quando não há nome, em vez de undefined', async () => {
    // A tela mostra o nome. Um undefined aqui viraria espaço em branco
    // no menu.
    respostas.getUser = { data: { user: { id: 'u1', email: 'a@b.com', user_metadata: {} } }, error: null };
    const { lerSessaoAtual } = await carregar();
    eq((await lerSessaoAtual())?.nome, 'Cliente');
  });
});

/* ─────────────── sair ─────────────── */

describe('sair', () => {
  test('chama signOut do servidor, não só limpa o local', async () => {
    zerarChamadas();
    const { sair } = await carregar();
    await sair();
    eq(chamadas.signOut, 1);
  });
});

/* ──────────── o callback não pode chamar o Supabase ──────────── */

describe('aoMudarSessao', () => {
  test('monta a sessão pelo argumento do callback, sem ir ao servidor', async () => {
    // Ponto 4. O callback roda enquanto a biblioteca processa a mudança
    // de autenticação, e um `await` de outra chamada do Supabase ali
    // dentro pode deadlockar o cliente (supabase/auth-js#762). Este
    // teste emite um evento de verdade e conta: com o evento, o número
    // de chamadas a `getUser` tem que continuar em ZERO.
    zerarChamadas();
    const { aoMudarSessao } = await carregar();

    let recebido: unknown = 'nunca chamado';
    const parar = aoMudarSessao((s) => { recebido = s; });

    // o dublê guarda o callback para que o teste possa dispará-lo
    eq(typeof parar, 'function', 'deve devolver a função de cancelar');
    dispararAuth('SIGNED_IN', {
      user: { id: 'uid-real', email: 'joao@empresa.com.br', user_metadata: { full_name: 'João' } },
    });

    eq(recebido, { uid: 'uid-real', email: 'joao@empresa.com.br', nome: 'João' });
    eq(
      chamadas.getUser.length,
      0,
      'getUser NÃO pode ser chamado dentro do callback — é o deadlock do auth-js#762',
    );

    parar();
  });

  test('sessão ausente no callback vira null, não um objeto pela metade', async () => {
    zerarChamadas();
    const { aoMudarSessao } = await carregar();
    let recebido: unknown = 'não chamado';
    const parar = aoMudarSessao((s) => { recebido = s; });

    dispararAuth('SIGNED_OUT', null);

    eq(recebido, null);
    eq(chamadas.getUser.length, 0);
    parar();
  });

  test('montar o listener não bate no servidor', async () => {
    zerarChamadas();
    const { aoMudarSessao } = await carregar();
    const parar = aoMudarSessao(() => {});
    eq(chamadas.getUser.length, 0, 'só assinar não pode custar uma ida ao servidor');
    parar();
  });
});

/* ──────────── a tela de redefinição existe de verdade ──────────── */

describe('sessaoDoUsuario', () => {
  test('aceita null e devolve null', async () => {
    const { sessaoDoUsuario } = await carregar();
    eq(sessaoDoUsuario(null), null);
    eq(sessaoDoUsuario(undefined), null);
  });

  test('a mesma montagem nos dois caminhos', async () => {
    // Se o callback e a leitura inicial montassem a sessão de jeitos
    // diferentes, o menu mostraria um nome no primeiro carregamento e
    // outro depois do login, sem que ninguém percebesse por quê.
    const { sessaoDoUsuario } = await carregar();
    const u = { id: 'u1', email: 'a@b.com', user_metadata: { full_name: '  João  ' } };
    eq(sessaoDoUsuario(u), { uid: 'u1', email: 'a@b.com', nome: 'João' });
  });
});
