/**
 * CHECKPOINT 1 — A AÇÃO DE CONTATO QUE FICA PENDENTE.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O PROBLEMA
 *
 * "O Card chama o WhatsApp direto ignorando o login."
 *
 * E o complemento, que é o mais chato para a pessoa: quando ela
 * tocava no botão sem estar logada, aparecia a tela de login, ela
 * criava a conta… e NADA acontecia. O app voltava para a Home e a
 * pessoa tinha que procurar o anúncio de novo e tocar no botão pela
 * segunda vez.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A IDEIA
 *
 * A ação que a pessoa pediu fica REGISTRADA enquanto ela entra. O
 * registro é o ID da máquina — não a máquina inteira — para que a
 * retomada use o anúncio como ele está agora, e não uma cópia
 * velha.
 *
 * São dois tipos de ação:
 *
 *  - 'chat':     abrir a conversa com o vendedor da máquina X.
 *  - 'whatsapp': abrir o WhatsApp do vendedor do anúncio X.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ⚠ CORREÇÃO DO ZAPIA — O TELEFONE NÃO VIAJA NA PENDÊNCIA
 *
 * A pendência do WhatsApp carregava o NÚMERO, tirado no momento do
 * clique. No banner do EloMatch esse número era FIXO — o mesmo para
 * todo mundo, para todo anúncio, e não era o do vendedor daquele
 * anúncio.
 *
 * Agora a pendência carrega o **ID do anúncio**, e o telefone é lido
 * do BANCO depois do login — o número real daquele vendedor. Se o
 * telefone não vier, o app diz que não veio. Ele não inventa um.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE UMA FUNÇÃO PURA
 *
 * Porque a retomada tem uma condição que é fácil de errar: o ID
 * pendente pode não existir mais na lista. A pessoa ficou criando a
 * conta, o feed recarregou, a máquina saiu do resultado. Se o app
 * tentar abrir o chat de uma máquina que não existe mais, ele abre
 * uma conversa com o anúncio errado — ou quebra.
 *
 * A regra mora aqui, e o teste cobre.
 */

/** O que a pessoa pediu, enquanto cria a conta. */
export type PendenciaDeContato =
  | { tipo: 'chat'; id: string }
  | { tipo: 'whatsapp'; id: string; texto: string };

/**
 * A ação de abrir a conversa com o vendedor da máquina `id`.
 *
 * Devolve `null` quando não há id: uma ação sem ID não é retomável,
 * e pendurar uma ação impossível seria pior do que não pedir login.
 */
export const pendenciaDeChat = (id: string | null | undefined): PendenciaDeContato | null => {
  const limpo = (id ?? '').trim();
  if (!limpo) return null;
  return { tipo: 'chat', id: limpo };
};

/**
 * A ação de abrir o WhatsApp do VENDEDOR do anúncio `id`.
 *
 * O ID é o do ANÚNCIO — não o do telefone. O número é lido do banco
 * depois do login, e é o real daquele vendedor.
 *
 * Devolve `null` quando não há id: sem anúncio não há vendedor, e
 * pendurar uma ação impossível seria pior do que não pedir login.
 */
export const pendenciaDeWhatsApp = (
  id: string | null | undefined,
  texto: string
): PendenciaDeContato | null => {
  const limpo = (id ?? '').trim();
  if (!limpo) return null;
  return { tipo: 'whatsapp', id: limpo, texto };
};

/** A ação retomada — a mesma forma da pendência. */
export type RetomadaDeContato = PendenciaDeContato;

/**
 * O que fazer quando a pessoa terminou de entrar.
 *
 * @param pendencia o que ela pediu antes de entrar
 * @param itens     os anúncios que existem AGORA (o feed atual)
 *
 * Devolve `null` quando não há o que retomar:
 *  - não havia pendência;
 *  - o anúncio não está mais na lista.
 *
 * A pendência do WhatsApp também exige que o anúncio exista: o
 * telefone vem do anúncio, e um anúncio que saiu do resultado não é
 * mais um vendedor para quem falar.
 */
export const retomarPendenciaDeContato = (
  pendencia: PendenciaDeContato | null,
  itens: readonly { id: string }[]
): RetomadaDeContato | null => {
  if (!pendencia) return null;

  // O anúncio precisa EXISTIR agora. Se saiu do feed enquanto a
  // pessoa criava a conta, não há conversa para abrir — e abrir a
  // errada seria pior do que não abrir nenhuma.
  const existe = itens.some((it) => it.id === pendencia.id);
  if (!existe) return null;

  return pendencia;
};

/**
 * A URL do WhatsApp.
 *
 * O número já vem só com dígitos. O `55` é o prefixo do Brasil, e
 * o texto é codificado para a URL.
 */
export const urlDoWhatsApp = (telefone: string, texto: string): string =>
  `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`;

/* ═══════════════════════════════════════════════════════════════════
   QUAL ANÚNCIO É O "VENDEDOR" DE QUEM TOCOU NO BANNER

   O banner do EloMatch é o do COMPRADOR: ele diz "encontramos
   máquinas compatíveis com o seu pedido de X". O botão "Falar com
   Vendedor" dele precisa apontar para o anúncio que atende aquele
   pedido — senão ele fala com alguém que não é o vendedor da máquina
   que a pessoa procura.

   A regra aqui é de texto: o pedido ("Escavadeira CAT 320D") precisa
   caber dentro do anúncio (título, marca, modelo, tipo). Todas as
   palavras importantes do pedido têm de estar no anúncio.

   Devolve `null` quando nenhum anúncio atende — e aí o app diz
   "ainda não há vendedor para essa máquina", em vez de abrir o
   WhatsApp de alguém que não tem nada a ver com o pedido.
   ═══════════════════════════════════════════════════════════════════ */

/** O mínimo que um anúncio precisa ter para ser comparado. */
export interface AnuncioComparavel {
  id: string;
  /**
   * O dono do anúncio: 'sell' é venda, 'buy' é procura.
   *
   * ⚠ OBRIGATÓRIO. O banner do comprador fala com o VENDEDOR — e
   * uma procura de comprador ('buy') não é vendedor nenhum. Sem este
   * campo, o comparador não pode escolher: ele falha fechado.
   */
  intent: string;
  /**
   * O estado do anúncio. Só o 'active' é o vendedor que a pessoa
   * pode falar.
   *
   * ⚠ OBRIGATÓRIO, pelo mesmo motivo do `intent`.
   */
  status: string;
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  subcategoryType?: string | null;
}

/** Palavras que não distinguem uma máquina de outra. */
const PALAVRAS_VAZIAS = new Set([
  'de',
  'da',
  'do',
  'das',
  'dos',
  'para',
  'com',
  'uma',
  'um',
  'e',
  'a',
  'o',
  'em',
  'no',
  'na',
  'por',
]);

/** Texto sem acento, sem caixa e sem pontuação sobrando. */
const normalizar = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/** As palavras que identificam a máquina no pedido. */
const palavrasDaMaquina = (maquina: string): string[] =>
  normalizar(maquina)
    .split(' ')
    .filter((p) => p.length >= 2 && !PALAVRAS_VAZIAS.has(p));

/** O texto do anúncio onde a máquina é procurada. */
const textoDoAnuncio = (anuncio: AnuncioComparavel): string =>
  normalizar(
    [anuncio.title, anuncio.brand, anuncio.model, anuncio.subcategoryType]
      .filter(Boolean)
      .join(' ')
  );

/**
 * O anúncio que atende ao pedido do comprador.
 *
 * @param anuncios os anúncios do feed (na ordem em que aparecem)
 * @param maquina  o que a pessoa pediu ("Escavadeira CAT 320D")
 */
export const anuncioDoPedidoDoComprador = <T extends AnuncioComparavel>(
  anuncios: readonly T[],
  maquina: string | null | undefined
): T | null => {
  const palavras = palavrasDaMaquina(maquina ?? '');
  if (!palavras.length) return null;

  for (const anuncio of anuncios) {
    if (!anuncio?.id) continue;

    // ─────────────────────────────────────────────────────────────────
    // ⚠ SÓ O VENDEDOR. NUNCA UMA PROCURA.
    //
    // O banner é do COMPRADOR: "encontramos máquinas compatíveis com
    // o seu pedido". O que ele precisa é do ANÚNCIO DE VENDA — o
    // vendedor que pode receber a mensagem.
    //
    // Antes, o comparador olhava só o texto (título, marca, modelo).
    // E o texto de uma PROCURA é o mesmo texto do pedido: "Busca
    // Sinomach SYM 855H" casa com o pedido "Sinomach SYM 855H". O
    // banner acabava apontando para a própria procura de quem
    // comprou — o WhatsApp ia para o errado, e o contato não existia.
    //
    // A regra agora é dura: `intent === 'sell'` e `status === 'active'`.
    // Fora disso, o anúncio não é candidato — nem se o texto casar
    // perfectly.
    // ─────────────────────────────────────────────────────────────────
    if (anuncio.intent !== 'sell') continue;
    if (anuncio.status !== 'active') continue;

    const texto = textoDoAnuncio(anuncio);
    if (!texto) continue;
    const doAnuncio = new Set(texto.split(' '));
    // TODAS as palavras importantes do pedido precisam estar no
    // anúncio. Uma sóbatida seria "qualquer anúncio com CAT".
    if (palavras.every((p) => doAnuncio.has(p))) return anuncio;
  }

  return null;
};
