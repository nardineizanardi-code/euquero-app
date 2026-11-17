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
 *  - 'whatsapp': abrir o WhatsApp de um número (o banner do
 *                EloMatch, que fala com a plataforma).
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
  | { tipo: 'whatsapp'; telefone: string; texto: string };

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
 * A ação de abrir o WhatsApp de um número.
 *
 * O telefone vem SEM o `55` e sem máscara — quem monta a URL é o
 * chamador. Aqui é só a intenção.
 */
export const pendenciaDeWhatsApp = (
  telefone: string | null | undefined,
  texto: string
): PendenciaDeContato | null => {
  const limpo = (telefone ?? '').replace(/\D/g, '');
  if (!limpo) return null;
  return { tipo: 'whatsapp', telefone: limpo, texto };
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
 *  - a pendência era de chat e a máquina não está mais na lista.
 */
export const retomarPendenciaDeContato = (
  pendencia: PendenciaDeContato | null,
  itens: readonly { id: string }[]
): RetomadaDeContato | null => {
  if (!pendencia) return null;

  if (pendencia.tipo === 'whatsapp') {
    // O número não depende da lista: ele continua válido.
    return pendencia;
  }

  // A máquina precisa EXISTIR agora. Se saiu do feed enquanto a
  // pessoa criava a conta, não há conversa para abrir — e abrir a
  //errada seria pior do que não abrir nenhuma.
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
