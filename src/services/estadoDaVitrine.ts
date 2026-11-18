/**
 * CHECKPOINT 2 — O ESTADO DA VITRINE.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O PROBLEMA
 *
 * "Dados fictícios (Carlos Mendes) aparecem no feed."
 *
 * E, junto com isso, uma confusão que ninguém tinha separado:
 *
 *   "não tem anúncio"  ≠  "não deu para carregar"
 *
 * A vitrine devolvia os dados de demonstração (`INITIAL_LISTINGS`)
 * quando não tinha nada no banco. Tirou a injeção, ficou um buraco:
 * o app passou a mostrar a mesma coisa para o banco vazio e para o
 * Supabase caído. A pessoa abria o app, via "nenhum anúncio" e
 * concluía que o app estava vazio — quando, na verdade, a consulta
 * tinha falhado.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A REGRA
 *
 * Três estados, e só três:
 *
 *  - 'carregando': a consulta está em andamento. Nenhum dos dois
 *    textos aparece ainda — "nenhum anúncio" seria mentira.
 *  - 'erro':       a consulta falhou. A pessoa precisa saber que
 *    deu errado, para tentar de novo.
 *  - 'vazio':      a consulta deu certo e não achou nada.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE UMA FUNÇÃO PURA
 *
 * Porque é uma decisão de tela, e tela não se testa sem DOM. A
 * função devolve o estado; o App desenha. O teste cobre a decisão,
 * e um teste de fiação cobre o desenho.
 */

/** O que a vitrine está mostrando. */
export type EstadoDaVitrine =
  | { tipo: 'carregando' }
  | { tipo: 'erro'; mensagem: string }
  | { tipo: 'vazio' };

/** O texto do banco vazio. */
export const TEXTO_NENHUM_ANUNCIO = 'Nenhum anúncio';

/** O texto da consulta que falhou. */
export const TEXTO_ERRO_AO_CARREGAR = 'Erro ao carregar';

/** A explicação que vem logo abaixo do erro. */
export const TEXTO_ERRO_AO_CARREGAR_DETALHE =
  'Não deu para consultar o banco agora. Tente de novo em instantes.';

/* ═══════════════════════════════════════════════════════════════════
   O CACHE ANTIGO DA VITRINE

   ⚠ CORREÇÃO DO ZAPIA — O LOCALSTORAGE ANTIGO AINDA ALIMENTAVA O FEED

   Tirar a injeção do `INITIAL_LISTINGS` não bastou. O `localStorage`
   guardava a vitrine INTEIRA, com a chave `euquero_listings_v8` — e
   as peças de demonstração já tinham ficado salvas ali dentro, com o
   "Carlos Mendes" e companhia.

   Resultado: quem abria o app num navegador que já tinha usado o app
   antes via um feed com anúncios que não existiam no banco. O cache
   antigo sobrevivia à correção, e a vitrine mentia de novo.

   A CORREÇÃO

   Uma limpeza FORÇADA no carregamento da Home: o cache é apagado e a
   vitrine recomeça vazia, com o que o banco trouxer. Não é "filtrar
   o que parece real" — é não deixar o cache velho mandar na vitrine.

   O que o app ainda grava ali é o espelho local do próprio dono (a
   demanda que ele acabou de criar, por exemplo). Isso é reescrito a
   cada mudança e não tem nada a ver com o cache antigo.
   ═══════════════════════════════════════════════════════════════════ */

/** A chave do cache local da vitrine. */
export const CHAVE_CACHE_VITRINE = 'euquero_listings_v8';

/** O armazenamento que a limpeza usa. */
export interface ArmazenamentoLocal {
  removeItem(chave: string): void;
}

/**
 * Apaga o cache antigo da vitrine.
 *
 * @param armazenamento onde apagar (o `localStorage` do navegador, por
 *                       padrão). É parâmetro para o teste não
 *                       precisar de DOM.
 * @returns `true` quando o cache foi apagado.
 */
export const limparCacheAntigoDaVitrine = (
  armazenamento?: ArmazenamentoLocal | null
): boolean => {
  try {
    const alvo =
      armazenamento ??
      (globalThis as { localStorage?: ArmazenamentoLocal | null }).localStorage ??
      null;
    if (!alvo) return false;
    alvo.removeItem(CHAVE_CACHE_VITRINE);
    return true;
  } catch (e) {
    // Sem localStorage (modo privado, ou navegador que não deixa),
    // não há cache para apagar — e o app segue com o banco.
    return false;
  }
};

/**
 * Decide o estado da vitrine vazia.
 *
 * @param carregando  a consulta está em andamento?
 * @param erroLeitura a consulta falhou? (a mensagem do erro)
 */
export const estadoDaVitrineVazia = (params: {
  carregando: boolean;
  erroLeitura: string | null;
}): EstadoDaVitrine => {
  // A ordem importa: enquanto carrega, a pessoa ainda NÃO sabe que
  // está vazio. Mostrar "nenhum anúncio" durante a carga seria
  // mentir — e happens em toda consulta lenta.
  if (params.carregando) return { tipo: 'carregando' };
  if (params.erroLeitura) {
    return { tipo: 'erro', mensagem: params.erroLeitura };
  }
  return { tipo: 'vazio' };
};
