/**
 * Guarda de rotas.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE ISTO EXISTE, SEPARADO DO `App.tsx`
 *
 * A navegação pelo menu já checava a sessão. A entrada direta pela URL
 * não: `currentView` nasce do `pathname`, e `/meus-anuncios` abria o
 * painel de exemplo para qualquer pessoa que digitasse o endereço. O
 * login no menu protegia um caminho só — o deep link passava por baixo.
 *
 * Estas funções são o ponto único de decisão. Se uma rota nova aparecer,
 * ela passa por aqui, e o comportamento de acesso direto, navegação por
 * histórico e logout é o mesmo.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTA GUARDA NÃO É
 *
 * Não é segurança. Ela esconde a tela; não protege o dado. Quem
 *consulta o banco não passa por React — passa pelo RLS, e é lá que a
 * proteção real está. Esta guarda existe para que a interface não
 * minta: é melhor pedir login do que mostrar o painel de outra pessoa.
 * ─────────────────────────────────────────────────────────────────────
 */

/** As rotas que exigem sessão. Tudo fora daqui é público. */
export const ROTAS_PRIVADAS: readonly string[] = [
  '/meus-anuncios',
  '/painel-vendedor',
  '/editar-anuncio',
];

const normalizar = (p: string): string => {
  if (typeof p !== 'string' || p === '') return '/';
  const semQuery = p.split('?')[0].split('#')[0];
  // Barra final: /meus-anuncios/ é a mesma rota que /meus-anuncios
  const limpa = semQuery.replace(/\/+$/, '');
  return limpa === '' ? '/' : limpa;
};

/** A rota pede sessão? */
export const rotaPrivada = (pathname: string): boolean => {
  const p = normalizar(pathname);
  return ROTAS_PRIVADAS.includes(p);
};

/**
 * O que fazer com uma rota, dado o estado da sessão.
 *
 * Três estados, e os três importam:
 *   - `carregando`: ainda não sabemos. Não decide nada — bloqueia.
 *     Decidir aqui seria o bug mais caro possível: a pessoa recarrega a
 *     página logada, a sessão demora um instante a chegar do servidor, e
 *     o app a expulsa antes de ela responder.
 *   - `permitida`: tem sessão, ou a rota é pública.
 *   - `bloqueada`: rota privada sem sessão. Vai para o login.
 */
export type DecisaoRota = 'carregando' | 'permitida' | 'bloqueada';

export const decidirRota = (
  pathname: string,
  sessaoCarregando: boolean,
  temSessao: boolean
): DecisaoRota => {
  if (sessaoCarregando) return 'carregando';
  if (!rotaPrivada(pathname)) return 'permitida';
  return temSessao ? 'permitida' : 'bloqueada';
};

/**
 * Para onde vai quem foi bloqueado.
 *
 * `/` e não `/redefinir-senha`: a pessoa que caiu num link privado sem
 * conta quer entrar, não trocar senha. E a query `?=` preserva o
 * destino, para voltar a ele depois de entrar.
 */
export const destinoDoLogin = (pathname: string, busca = ''): string => {
  const p = normalizar(pathname);
  if (!rotaPrivada(p)) return '/';
  const params = new URLSearchParams(busca);
  params.set('redirect', p);
  return `/?${params.toString()}`;
};

/**
 * Rota de redefinição de senha — pública, e fora do ganho da guarda.
 *
 * A tela precisa carregar sozinha: quem chega pelo e-mail não tem
 * sessão, e o app não pode barrar a única porta de recuperação de
 * senha por causa da própria proteção.
 */
export const EH_ROTA_DE_REDEFINICAO = '/redefinir-senha';

export const ehRotaDeRedefinicao = (pathname: string): boolean =>
  normalizar(pathname) === EH_ROTA_DE_REDEFINICAO;

/* ══════════════════════════════════════════════════════════════════
   A TELHA E A URL PODEM DIZER COISAS DIFERENTES
   ══════════════════════════════════════════════════════════════════
   Uma tela privada é escolhida por `currentView`, e a URL só é
   atualizada depois, por um efeito. Entre o `setCurrentView` e a
   atualização do caminho, a guarda olha a URL antiga e a tela já é a
   nova.

   Se a guarda decidisse só pela URL, `decidirRota('/')` devolveria
   "permitida" — porque a raiz é pública — e a tela de edição
   renderizaria sem sessão. Foi assim que o acesso por digitação de
   `/meus-anuncios` passou: a proteção estava no lugar, olhando o
   lugar errado.

   Por isso a tela privada é verificada pelo VISUALIZADO, e não pela
   URL. A URL continua decidindo para onde a pessoa é levada; a tela,
   para o que ela enxerga.
   ══════════════════════════════════════════════════════════════════ */

/** Quais telas são privadas, e a rota que cada uma corresponde. */
export const VIEW_PRIVADA: Readonly<Record<string, string>> = {
  meus_anuncios: '/meus-anuncios',
  editar_anuncio: '/editar-anuncio',
};

/** A tela é privada? */
export const viewPrivada = (view: string): boolean =>
  Object.prototype.hasOwnProperty.call(VIEW_PRIVADA, view);

/**
 * A sessão já foi verificada E é válida?
 *
 * `carregando` conta como não-verificada. Sem isso, a pessoa recarrega
 * a página logada, a sessão demora um instante a vir do servidor, e o
 * app mostra o painel antes de saber se ela existe.
 */
export const sessaoConfirmada = (carregando: boolean, temSessao: boolean): boolean =>
  !carregando && temSessao;

/**
 * Esta tela pode ser renderizada agora?
 *
 * A única condição: tela privada exige sessão confirmada. Rota pública
 * renderiza sempre.
 */
export const podeRenderizar = (
  view: string,
  carregando: boolean,
  temSessao: boolean
): boolean => !viewPrivada(view) || sessaoConfirmada(carregando, temSessao);

/**
 * Para onde voltar depois de entrar.
 *
 * Aceita **somente** rotas de `ROTAS_PRIVADAS`. Um `redirect` vem da
 * URL, e URL é entrada de usuário: `?redirect=https://outro-site`
 * precisa ser recusado, não seguido.
 *
 * A query original é preservada, porque `/editar-anuncio?id=…` sem o id
 * abre um formulário em branco — a pessoa entraria e perderia o
 * anúncio que ia editar.
 */
export const destinoAposEntrar = (
  busca: string
): { rota: string; busca: string } | null => {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(busca ?? '');
  } catch {
    return null;
  }
  const bruto = params.get('redirect');
  if (!bruto) return null;

  const p = normalizar(bruto);
  // Comparação exata contra a lista. `redirect=/meus-anuncios.evil.com`
  // ou uma URL absoluta caem fora daqui.
  if (!ROTAS_PRIVADAS.includes(p)) return null;

  params.delete('redirect');
  const restante = params.toString();
  return { rota: p, busca: restante ? `?${restante}` : '' };
};

/* ══════════════════════════════════════════════════════════════════
   PEDIR LOGIN NÃO É A MESMA COISA QUE AINDA NÃO SABER
   ══════════════════════════════════════════════════════════════════
   `sessao` começa em `null` em dois momentos que não se confundem:

     • a verificação ainda está em andamento;
     • a verificação terminou e não havia sessão.

   Tratar os dois com `!sessaoOk` abre o modal de login no primeiro
   caso. O efeito é pior do que parece: quem está logado dá F5, clica
   no próprio anúncio antes de o servidor responder, e o modal abre
   por cima do feed. A pessoa conclui que foi desconectada.

   A diferença importa também para a URL. Enquanto a verificação está
   em curso não há nada a decidir, e a resposta chega em instantes:
   empurrar a pessoa para o login agora é cedo demais.

   ══════════════════════════════════════════════════════════════════ */

export type DecisaoNavegar = 'aguardar' | 'permitir' | 'pedir-login';

/**
 * O que fazer ao pedir navegação para uma rota privada.
 *
 * `aguardar` — não faz nada: nem modal, nem URL, nem troca de tela.
 */
export const decidirNavegarPrivado = (
  sessaoCarregando: boolean,
  temSessao: boolean
): DecisaoNavegar => {
  if (sessaoCarregando) return 'aguardar';
  return temSessao ? 'permitir' : 'pedir-login';
};

/* ══════════════════════════════════════════════════════════════════
   NAVEGAÇÃO PENDENTE — O CLIQUE QUE CHEGOU CEDO DEMAIS
   ══════════════════════════════════════════════════════════════════
   Decidir "aguardar" resolve metade do problema. A outra metade é o
   que acontece com o clique que foi descartado: sem nada, a pessoa
   clica no anúncio logo após o F5, nada acontece, e ela clica de
   novo sem saber por quê.

   Guardar a intenção e retomá-la quando o servidor responde é o
  fechamento. A regra que importa: a intenção é consumida UMA vez.
   Se ela sobreviver depois de executada, um re-render ou uma troca
   de sessão dispararia a mesma navegação outra vez — a pessoa iria
   para o painel sem ter clicado em nada.

   Estas funções são puras de propósito. A execução mora no
   componente; a decisão, aqui. É o que permite testar "cliquei durante
   o carregamento e a sessão chegou" sem navegador.
   ══════════════════════════════════════════════════════════════════ */

/** O que a pessoa pediu. Distingue os dois destinos privados. */
export type IntencaoNavegar =
  | { readonly tipo: 'meus-anuncios' }
  | { readonly tipo: 'editar-anuncio'; readonly id: string };

/** A rota que a intenção corresponde. */
export const rotaDaIntencao = (i: IntencaoNavegar): string =>
  i.tipo === 'editar-anuncio' ? '/editar-anuncio' : '/meus-anuncios';

/**
 * A query que a intenção carrega.
 *
 * O id do anúncio não é detalhe: `/editar-anuncio` sem ele abre um
 * formulário em branco, e a pessoa entra na edição e não reconhece
 * qual anúncio está vendo.
 */
export const buscaDaIntencao = (i: IntencaoNavegar): string => {
  if (i.tipo === 'editar-anuncio' && i.id) {
    return `?id=${encodeURIComponent(i.id)}`;
  }
  return '';
};

export const destinoDaIntencao = (i: IntencaoNavegar): string =>
  rotaDaIntencao(i) + buscaDaIntencao(i);

/** O que fazer com um pedido que acabou de chegar. */
export type AcaoNavegar =
  /** Nada agora: sessão em verificação. A intenção fica guardada. */
  | { readonly tipo: 'guardar'; readonly intencao: IntencaoNavegar }
  /** Executar já. */
  | { readonly tipo: 'executar'; readonly intencao: IntencaoNavegar }
  /** Abrir o login, guardando o destino para continuar depois. */
  | { readonly tipo: 'abrir-login'; readonly intencao: IntencaoNavegar };

/** O que o pedido vira, dada a situação da sessão. */
export const aoPedirNavegar = (
  intencao: IntencaoNavegar,
  sessaoCarregando: boolean,
  temSessao: boolean
): AcaoNavegar => {
  const decisao = decidirNavegarPrivado(sessaoCarregando, temSessao);
  if (decisao === 'aguardar') return { tipo: 'guardar', intencao };
  if (decisao === 'permitir') return { tipo: 'executar', intencao };
  return { tipo: 'abrir-login', intencao };
};

/** O que fazer com uma intenção que ficou guardada. */
export type ResolucaoPendente =
  /** Ainda não deu: a verificação continua. A intenção permanece. */
  | { readonly tipo: 'aguardar' }
  /** Executar e descartar. */
  | { readonly tipo: 'executar'; readonly intencao: IntencaoNavegar }
  /** Login, e o destino fica na URL para a volta. */
  | { readonly tipo: 'abrir-login'; readonly intencao: IntencaoNavegar };

/**
 * Resolve a intenção guardada assim que a verificação termina.
 *
 * `intencao === null` significa "não há nada pendente" — e devolve
 * `aguardar`, para o efeito sair sem tocar em nada. É esse o caminho
 * que garante execução única: depois de consumir, a intenção vira
 * `null`, e a próxima verificação não tem o que executar.
 */
export const resolverPendente = (
  intencao: IntencaoNavegar | null,
  sessaoCarregando: boolean,
  temSessao: boolean
): ResolucaoPendente => {
  if (intencao === null) return { tipo: 'aguardar' };
  if (sessaoCarregando) return { tipo: 'aguardar' };
  return temSessao
    ? { tipo: 'executar', intencao }
    : { tipo: 'abrir-login', intencao };
};
