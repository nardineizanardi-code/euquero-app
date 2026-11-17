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
