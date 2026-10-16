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
