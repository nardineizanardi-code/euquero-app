/**
 * Repositório de anúncios — a camada que realmente fala com o Supabase.
 *
 * POR QUE NÃO IMPORTAR O SDK AQUI
 * O `@supabase/supabase-js` JÁ ESTÁ INSTALADO (2.117.2, no package.json) —
 * mas este arquivo não o importa de propósito. Ele descreve só a FORMA do
 * cliente de que precisa, numa interface estrutural.
 *
 * Na prática isso é melhor do que importar direto:
 *   - dá para testar tudo com um dublê em memória, sem rede e sem banco;
 *   - o tipo do cliente real não vaza para quem chama esta camada.
 *
 * `compatSdk.test.ts` verifica que o cliente real satisfaz esta interface,
 * de forma explícita e versionada. Na aplicação, é só passar o cliente:
 *
 *   import { createClient } from '@supabase/supabase-js';
 *   const supabase = createClient(url, publishableKey);
 *   const repo = createListingRepository(supabase);
 *
 * E nada mais muda.
 *
 * REGRA QUE ATRAVESSA TUDO AQUI
 * Nenhuma função monta objeto com `...row`. Toda resposta pública passa
 * por `publicRowToItem`, que monta campo a campo. Toda escrita passa por
 * `toListingInsert`, que coloca o dono a partir do token.
 */

// Colunas e funcoes sao valores; os tipos sao `import type` porque nao
// existem em runtime (mesma razao que em productService.ts).
import {
  PUBLIC_LISTING_COLUMNS,
  PRIVATE_LISTING_COLUMNS,
  publicRowToItem,
  privateRowToItem,
  toListingInsert,
  toListingUpdate,
} from './productService.ts';
import type { ListingRow, ListingInsertPayload } from './productService.ts';
import type { StorageLike } from './fotos.ts';
import type { ListingItem } from '../types/index.ts';

/* ───────────────── o cliente mínimo de que precisamos ───────────────── */

/**
 * Só o pedaço do supabase-js que este arquivo usa. Se amanhã faltar um
 * método aqui, o TypeScript avisa — em vez de estourar em produção.
 *
 * `from()` devolve uma cadeia que começa de três jeitos diferentes
 * (select / insert / update). Declarar os três aqui evita a armadilha de
 * escrever `.insert()` e o compilador deixar passar por engano.
 */
export interface SupabaseLike {
  from(table: string): Tabela;
  /**
   * O Storage, quando o cliente tem.
   *
   * É OPCIONAL de propósito: a maior parte do código só lê e escreve
   * tabela, e os dublês de teste não precisam fingir que sabem fazer
   * upload de arquivo. Quem precisa de foto usa `fotos.ts`, que
   * verifica a existência antes de chamar.
   */
  storage?: StorageLike;
}

export interface Tabela {
  select(columns: string, opts?: { count?: 'exact' | 'planned' | 'estimated' }): PostgrestBuilder;
  insert(values: Record<string, unknown>): PostgrestBuilder;
  update(values: Record<string, unknown>): PostgrestBuilder;
  delete(): PostgrestBuilder;
}

export interface PostgrestFilter extends PostgrestBuilder {}

/** A parte que volta a ser encadeável depois de `.insert()`/`.update()`. */
export interface PostgrestBuilder {
  select(columns: string, opts?: { count?: 'exact' | 'planned' | 'estimated' }): PostgrestBuilder;
  eq(column: string, value: unknown): PostgrestBuilder;
  /** Uma chamada por coluna, na ordem desejada: é assim que o PostgREST
   *  monta o ORDER BY. Duas chamadas = desempate estável. */
  order(column: string, opts?: { ascending?: boolean; nullsFirst?: boolean }): PostgrestBuilder;
  limit(n: number): PostgrestBuilder;
  /**
   * PAGINAÇÃO DE VERDADE. Sem isto, "página 2" volta a devolver os mesmos
   * primeiros registros: `limit` corta o fim, `range` escolhe a fatia.
   * Quem pede `offset` tem de chamar isto.
   */
  range(from: number, to: number): PostgrestBuilder;
  maybeSingle(): PromiseLike<PostgrestResult>;
  then<R1 = PostgrestResult, R2 = never>(
    onfulfilled?: ((v: PostgrestResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((r: any) => R2 | PromiseLike<R2>) | null
  ): PromiseLike<R1 | R2>;
}

export interface PostgrestResult {
  data: unknown;
  error: { message: string; code?: string } | null;
  /** Só vem preenchido se a consulta pediu `select(cols, { count: 'exact' })`. */
  count?: number | null;
}

/* ───────────────── vitrine pública: sem sessão ───────────────── */

export interface ListPublicOptions {
  category?: string;
  state?: string;
  /** Tamanho da página. Teto em 100. */
  limit?: number;
  /** Registro inicial. Precisa de `range` para pular de verdade. */
  offset?: number;
  /** Pula a contagem total quando ela não é necessária (ganho de tempo). */
  semTotal?: boolean;
}

export interface PublicPage {
  items: ListingItem[];
  total: number | null;
}

/**
 * Lista a vitrine pública.
 *
 * Chama a VIEW, não a tabela. A view já é o filtro (só ativo e não pausado),
 * e não traz coluna sensível nenhuma.
 *
 * PAGINAÇÃO: `range(from, to)` — e não `limit`. Aumentar o `limit` só traria
 * mais registros do COMEÇO de novo; a página 2 voltaria igual à página 1.
 *
 * `total`: pede `count: 'exact'` para saber quantos existem no total. Se o
 * servidor não responder a contagem (ou se pedirem `semTotal: true`), volta
 * `null` — que significa "não sei", não "zero".
 */
export const listPublicListings = async (
  client: SupabaseLike,
  opts: ListPublicOptions = {}
): Promise<PublicPage> => {
  const tamanho = Math.min(opts.limit ?? 20, 100);
  const offset = Math.max(opts.offset ?? 0, 0);

  let q = client
    .from('public_listings')
    // `count: 'exact'` pede a contagem total no mesmo round-trip.
    .select(PUBLIC_LISTING_COLUMNS, opts.semTotal ? undefined : { count: 'exact' })
    // ORDENAÇÃO ESTÁVEL: `id` como desempate. Sem isso, dois anúncios com o
    // mesmo created_at podem vir em ordens diferentes entre requisições, e a
    // página 2 repetiria um registro da 1 enquanto outro sumiria.
    .order('created_at', { ascending: false })
    .order('id', { ascending: true });

  if (opts.category) q = q.eq('category', opts.category);
  if (opts.state) q = q.eq('location_state', opts.state);

  // `range` é inclusivo nos dois extremos. offset 0, tamanho 20 -> 0..19.
  q = offset > 0 ? q.range(offset, offset + tamanho - 1) : q.limit(tamanho);

  const { data, error, count } = await q;
  if (error) throw new SupabaseError('falha ao listar a vitrine', error);

  const linhas = (data ?? []) as ListingRow[];
  const items = linhas
    .map(publicRowToItem)
    .filter((i): i is ListingItem => i !== null);

  return { items, total: typeof count === 'number' ? count : null };
};

/** Um anúncio da vitrine. `null` se não existir (404 vira null, não erro). */
export const getPublicListing = async (
  client: SupabaseLike,
  id: string
): Promise<ListingItem | null> => {
  const { data, error } = await client
    .from('public_listings')
    .select(PUBLIC_LISTING_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new SupabaseError('falha ao buscar o anúncio', error);
  if (!data) return null;
  return publicRowToItem(data as ListingRow);
};

/* ────────────── privado: o dono, logado, sob RLS ────────────── */

/**
 * Lista os anúncios do usuário logado.
 *
 * Vai na TABELA, não na view: a view esconde pausado por definition, e o
 * dono precisa ver o próprio rascunho e o próprio pausado.
 *
 * Não recebe id de dono: quem é o dono é o RLS, a partir do token. Se
 * alguém passar um id aqui, o banco recusa — e tudo bem.
 */
export const listMyListings = async (
  client: SupabaseLike,
  opts: { limit?: number; includePaused?: boolean } = {}
): Promise<ListingItem[]> => {
  const limit = Math.min(opts.limit ?? 50, 200);
  let q = client
    .from('listings')
    .select(PRIVATE_LISTING_COLUMNS)
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .limit(limit);

  if (!opts.includePaused) q = q.eq('is_paused', false);

  const { data, error } = await q;
  if (error) throw new SupabaseError('falha ao listar seus anúncios', error);

  return ((data ?? []) as ListingRow[]).map(privateRowToItem);
};

/** Um anúncio próprio. Traz cpf e telefone; nunca traz pix_key. */
export const getMyListing = async (
  client: SupabaseLike,
  id: string
): Promise<ListingItem | null> => {
  const { data, error } = await client
    .from('listings')
    .select(PRIVATE_LISTING_COLUMNS)
    .eq('id', id)
    .maybeSingle();

  if (error) throw new SupabaseError('falha ao buscar seu anúncio', error);
  if (!data) return null;
  return privateRowToItem(data as ListingRow);
};

/* ─────────────────────────── escrita ─────────────────────────── */

export interface CreateResult {
  item: ListingItem;
}

/**
 * Cria um anúncio.
 *
 * `authenticatedUserId` é obrigatório e tem que vir do token (`auth.uid()`),
 * nunca do `localStorage` e nunca de dentro do `item`. A função ignora
 * `item.ownerId` de propósito: se confiasse nele, qualquer página escreveria
 * anúncio no nome de outra pessoa.
 *
 * `tier`, `badge`, `highlight_days` e `has_verified_video` não entram no
 * payload — são liberados por gatilho e por pagamento, no banco.
 */
export const createListing = async (
  client: SupabaseLike,
  item: ListingItem,
  authenticatedUserId: string
): Promise<CreateResult> => {
  if (!authenticatedUserId) {
    throw new Error('createListing: authenticatedUserId é obrigatório (vem do token)');
  }
  const payload: ListingInsertPayload = toListingInsert(item, authenticatedUserId);

  const { data, error } = await client
    .from('listings')
    .insert(payload as unknown as Record<string, unknown>)
    .select(PRIVATE_LISTING_COLUMNS)
    .maybeSingle();

  if (error) throw new SupabaseError('falha ao criar o anúncio', error);
  if (!data) throw new SupabaseError('o anúncio foi criado mas não voltou', { message: 'sem retorno' });

  return { item: privateRowToItem(data as ListingRow) };
};

/**
 * Pausa ou reativa.
 *
 * Vai direto em `is_paused`, e não em `status`: o app tem o conceito de
 * pausa separado, e mexer no `status` brigaria com o RLS e com o filtro da
 * view. A checagem de dono é do RLS, não daqui.
 */
export const setListingPaused = async (
  client: SupabaseLike,
  id: string,
  paused: boolean
): Promise<ListingItem | null> => {
  const { data, error } = await client
    .from('listings')
    .update({ is_paused: paused })
    .eq('id', id)
    .select(PRIVATE_LISTING_COLUMNS)
    .maybeSingle();

  if (error) throw new SupabaseError('falha ao pausar o anúncio', error);
  if (!data) return null;
  return privateRowToItem(data as ListingRow);
};

/* ─────────────────── edição e exclusão: só o dono ─────────────────── */

/**
 * O que a edição devolve.
 */
export interface UpdateResult {
  item: ListingItem;
}

/**
 * Edita um anúncio.
 *
 * QUEM PODE: só o dono. E a restrição aparece em DOIS lugares, de propósito:
 *
 *   1. no filtro `.eq('owner_id', authenticatedUserId)` — o UPDATE só alcança
 *      a linha em que o dono é esse usuário;
 *   2. na RLS do banco, que é a proteção que realmente vale. O filtro é
 *      a intenção declarada; a RLS é a que não se negocia.
 *
 * Se os dois falharem por algum motivo, o pedido não toca em anúncio de
 * outra pessoa: o UPDATE volta sem linha, e a função diz que não encontrou
 * — que é a mesma resposta de "anúncio não existe". A diferença entre "não
 * existe" e "não é seu" não é informada, porque essa diferença é um
 * oráculo de existência.
 *
 * `authenticatedUserId` tem que vir do token (`auth.uid()`), nunca do
 * `localStorage` e nunca de dentro do `item`. A função ignora
 * `item.ownerId` de propósito.
 */
export const updateListing = async (
  client: SupabaseLike,
  id: string,
  item: ListingItem,
  authenticatedUserId: string
): Promise<UpdateResult> => {
  if (!authenticatedUserId) {
    throw new Error('updateListing: authenticatedUserId é obrigatório (vem do token)');
  }
  if (!id) {
    throw new Error('updateListing: id é obrigatório');
  }
  if (!item || typeof item !== 'object') {
    throw new Error('updateListing: item é obrigatório');
  }

  const payload = toListingUpdate(item);

  const { data, error } = await client
    .from('listings')
    .update(payload as unknown as Record<string, unknown>)
    .eq('id', id)
    .eq('owner_id', authenticatedUserId)
    .select(PRIVATE_LISTING_COLUMNS)
    .maybeSingle();

  if (error) throw new SupabaseError('falha ao atualizar o anúncio', error);
  if (!data) {
    throw new SupabaseError('anúncio não encontrado', {
      message: 'não existe ou não é seu',
    });
  }

  return { item: privateRowToItem(data as ListingRow) };
};

/**
 * O que a exclusão devolve.
 */
export interface DeleteResult {
  id: string;
}

/**
 * Exclui um anúncio.
 *
 * Mesmo desenho da edição: o `.eq('owner_id', ...)` declara a intenção, e a
 * RLS garante. Um DELETE que não devolve linha não deletou nada — e o
 * chamador recebe "não encontrado", sem distinguir de "não é seu".
 *
 * A exclusão devolve a linha apagada (`.select('id')`) em vez de contar:
 * sem isso, um DELETE que casou zero linhas é indistinguível de um DELETE
 * que a RLS bloqueou, e o app não saberia se o anúncio sumiu do feed.
 */
export const deleteListing = async (
  client: SupabaseLike,
  id: string,
  authenticatedUserId: string
): Promise<DeleteResult> => {
  if (!authenticatedUserId) {
    throw new Error('deleteListing: authenticatedUserId é obrigatório (vem do token)');
  }
  if (!id) {
    throw new Error('deleteListing: id é obrigatório');
  }

  const { data, error } = await client
    .from('listings')
    .delete()
    .eq('id', id)
    .eq('owner_id', authenticatedUserId)
    .select('id');

  if (error) throw new SupabaseError('falha ao excluir o anúncio', error);

  const linhas = Array.isArray(data) ? (data as Array<{ id?: unknown }>) : [];
  if (linhas.length === 0) {
    throw new SupabaseError('anúncio não encontrado', {
      message: 'não existe ou não é seu',
    });
  }

  return { id };
};

/* ─────────────────────────── utilitários ─────────────────────────── */

/**
 * Erro com o motivo do Supabase dentro, para a tela mostrar algo útil em vez
 * de "deu ruim".
 */
export class SupabaseError extends Error {
  readonly code?: string;
  constructor(mensagem: string, cause: { message: string; code?: string }) {
    super(`${mensagem}: ${cause.message}`);
    this.name = 'SupabaseError';
    this.code = cause.code;
  }
}
