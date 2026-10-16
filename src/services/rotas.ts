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
