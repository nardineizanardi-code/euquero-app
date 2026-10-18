/**
 * Contato entre comprador e vendedor — mensagem de verdade, telefone privado.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O PROBLEMA
 * ═══════════════════════════════════════════════════════════════════════
 * O telefone do vendedor NÃO está na vitrine pública. Não está em
 * `public_listings` — a view expõe 33 colunas e `user_phone` não está
 * entre elas. E não deveria estar: um telefone é dado pessoal, e a
 * vitrine é pública.
 *
 * Mas sem telefone, o contato não acontece: o botão "Falar com
 * Vendedor" abria o chat LOCAL DE DEMONSTRAÇÃO, que só existe no
 * navegador de quem abriu. A mensagem do comprador morria ali.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * A SAÍDA: O CONTATO PASSA PELO BANCO, SEM O TELEFONE
 * ═══════════════════════════════════════════════════════════════════════
 * A mensagem vai para a tabela `messages`, e o vendedor a vê no app.
 * O telefone continua privado dos dois lados: o comprador não vê o do
 * vendedor, e o vendedor não vê o do comprador — o que ele vê é o
 * NOME, que vem de `profiles.full_name`.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O SCHEMA — CONFIRMADO POR SONDAGEM AO VIVO
 * ═══════════════════════════════════════════════════════════════════════
 * `messages` tem EXATAMENTE estas colunas:
 *
 *     id | sender_id | body | created_at | match_id
 *
 * E `matches` tem:
 *
 *     id | listing_id | demand_id | score | status | created_at
 *
 * Confirmei cada coluna por sonda na API REST (401 = existe, 400 = não
 * existe). Não há `listing_id` em `messages`: a mensagem é SEMPRE de um
 * MATCH. E o match liga o anúncio (`listing_id`) a uma demanda
 * (`demand_id`), que também é uma linha de `listings` — a de quem
 * procura, com `intent = 'buy'`.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE NÃO ESTÁ CONFIRMADO — E POR QUE IMPORTA
 * ═══════════════════════════════════════════════════════════════════════
 * AS POLÍTICAS. A tabela `messages` barra o anônimo (401), o que prova
 * que a RLS está ligada — mas NÃO prova que um COMPRADOR autenticado
 * consiga inserir uma mensagem num match do qual participa. Isso só se
 * prova no banco, com uma conta de teste, e não há uma.
 *
 * As políticas que isso exige estão em
 * `supabase/migrations/20261018_contato_mensagens.sql`, PARA REVISÃO.
 * Não foram executadas.
 *
 * Por isso o código aqui NÃO finge: se a política barrar, o erro
 * aparece, e a tela diz que a mensagem NÃO foi enviada. Nada de
 * "mensagem enviada" sobre uma entrega que não aconteceu.
 */

import { PUBLIC_LISTING_COLUMNS, toListingInsert } from './productService.ts';
import type { ListingRow } from './productService.ts';
import type { ListingItem } from '../types/index.ts';
import type { SupabaseLike } from './listingRepository.ts';
import { SupabaseError } from './listingRepository.ts';

/* ═══════════════════════════════════════════════════════════════════════
   MENSAGENS
   ═══════════════════════════════════════════════════════════════════════ */

export interface MensagemRow {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  match_id: string;
}

export interface MensagemContato {
  id: string;
  autorId: string;
  texto: string;
  criadoEm: string;
  matchId: string;
}

const linhaParaMensagem = (row: MensagemRow): MensagemContato => ({
  id: row.id,
  autorId: row.sender_id,
  texto: row.body,
  criadoEm: row.created_at,
  matchId: row.match_id,
});

/**
 * Envia a mensagem do comprador para o vendedor.
 *
 * `senderId` é o uid do TOKEN. Nunca o do `item`, nunca o do
 * localStorage. É o `sender_id` que o banco vai casar com a política.
 */
export const enviarMensagem = async (
  client: SupabaseLike,
  matchId: string,
  senderId: string,
  texto: string
): Promise<MensagemContato> => {
  if (!senderId) {
    throw new Error('enviarMensagem: senderId é obrigatório (vem do token)');
  }
  if (!matchId) {
    throw new Error('enviarMensagem: matchId é obrigatório');
  }
  const corpo = (texto ?? '').toString().trim();
  if (!corpo) {
    throw new Error('enviarMensagem: a mensagem está vazia');
  }

  const { data, error } = await client
    .from('messages')
    .insert({ match_id: matchId, sender_id: senderId, body: corpo })
    .select('id,sender_id,body,created_at,match_id')
    .maybeSingle();

  if (error) {
    throw new SupabaseError('a mensagem não foi enviada', error);
  }
  if (!data) {
    throw new SupabaseError('a mensagem não foi enviada', {
      message: 'o banco não confirmou o envio',
    });
  }

  return linhaParaMensagem(data as MensagemRow);
};

/**
 * As mensagens de um match.
 *
 * A RLS é quem decide quem enxerga o quê. O filtro por `match_id` aqui
 * é o recorte, não a proteção.
 */
export const listarMensagens = async (
  client: SupabaseLike,
  matchId: string
): Promise<MensagemContato[]> => {
  if (!matchId) return [];

  const { data, error } = await client
    .from('messages')
    .select('id,sender_id,body,created_at,match_id')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true });

  if (error) throw new SupabaseError('falha ao ler as mensagens', error);

  return ((data ?? []) as MensagemRow[]).map(linhaParaMensagem);
};

/* ═══════════════════════════════════════════════════════════════════════
   MATCHES
   ═══════════════════════════════════════════════════════════════════════ */

export interface MatchRow {
  id: string;
  listing_id: string;
  demand_id: string;
  score: number;
  status: string;
  created_at: string;
}

export interface MatchContato {
  id: string;
  listingId: string;
  demandId: string;
  score: number;
  status: string;
  criadoEm: string;
}

const linhaParaMatch = (row: MatchRow): MatchContato => ({
  id: row.id,
  listingId: row.listing_id,
  demandId: row.demand_id,
  score: Number(row.score ?? 0),
  status: row.status,
  criadoEm: row.created_at,
});

/**
 * Os matches em que a pessoa é o DONO do anúncio.
 *
 * `matches` tem DUAS chaves estrangeiras para `listings`:
 * `matches_listing_id_fkey` (o anúncio) e `matches_demand_id_fkey` (a
 * demanda). Deixar o embed sem nome é ambíguo — o PostgREST recusa com
 * PGRST201 —, então o nome da FK vai explícito.
 *
 * A RLS é o filtro real. O `.eq` abaixo é a intenção declarada, e a
 * consulta aninhada é o que o RLS enxerga: `listings.owner_id`.
 */
export const listarMatchesDoDono = async (
  client: SupabaseLike,
  ownerId: string
): Promise<MatchContato[]> => {
  if (!ownerId) return [];

  const { data, error } = await client
    .from('matches')
    .select(
      'id,listing_id,demand_id,score,status,created_at,' +
        'listings!matches_listing_id_fkey(owner_id)'
    )
    .eq('listings.owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new SupabaseError('falha ao ler os matches', error);

  return ((data ?? []) as MatchRow[]).map(linhaParaMatch);
};

/**
 * As mensagens que chegaram para os anúncios do dono.
 *
 * É a espelha de `enviarMensagem`: o comprador escreve, o dono lê. E é
 * aqui que o telefone do comprador CONTINUA PRIVADO — o que chega ao
 * vendedor é o nome (de `profiles`) e a mensagem, não o telefone.
 */
export const listarMensagensDoDono = async (
  client: SupabaseLike,
  ownerId: string
): Promise<(MensagemContato & { listingId: string })[]> => {
  if (!ownerId) return [];

  const { data, error } = await client
    .from('messages')
    .select(
      'id,sender_id,body,created_at,match_id,' +
        'matches!inner(id,listing_id,listings!matches_listing_id_fkey(owner_id))'
    )
    .eq('matches.listings.owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new SupabaseError('falha ao ler as mensagens', error);

  const linhas = (data ?? []) as Array<
    MensagemRow & { matches?: { listing_id?: string } | { listing_id?: string }[] }
  >;

  return linhas.map((linha) => {
    const vinculo = Array.isArray(linha.matches) ? linha.matches[0] : linha.matches;
    return {
      ...linhaParaMensagem(linha),
      listingId: String(vinculo?.listing_id ?? ''),
    };
  });
};

/**
 * Cria o match que liga a demanda do comprador ao anúncio do vendedor.
 *
 * É o elo que permite a mensagem: `messages.match_id` aponta para cá.
 */
export const criarMatch = async (
  client: SupabaseLike,
  listingId: string,
  demandId: string,
  score = 0
): Promise<MatchContato> => {
  if (!listingId) throw new Error('criarMatch: listingId é obrigatório');
  if (!demandId) throw new Error('criarMatch: demandId é obrigatório');

  const { data, error } = await client
    .from('matches')
    .insert({
      listing_id: listingId,
      demand_id: demandId,
      score,
      status: 'novo',
    })
    .select('id,listing_id,demand_id,score,status,created_at')
    .maybeSingle();

  if (error) throw new SupabaseError('não foi possível abrir a conversa', error);
  if (!data) {
    throw new SupabaseError('não foi possível abrir a conversa', {
      message: 'o banco não confirmou o match',
    });
  }

  return linhaParaMatch(data as MatchRow);
};

/**
 * O match que já existe entre esta demanda e este anúncio.
 *
 * Serve para não criar dois matches para a mesma dupla — e o segundo
 * match faria a conversa se bifurcar.
 */
export const acharMatch = async (
  client: SupabaseLike,
  listingId: string,
  demandId: string
): Promise<MatchContato | null> => {
  if (!listingId || !demandId) return null;

  const { data, error } = await client
    .from('matches')
    .select('id,listing_id,demand_id,score,status,created_at')
    .eq('listing_id', listingId)
    .eq('demand_id', demandId)
    .maybeSingle();

  if (error) throw new SupabaseError('falha ao procurar a conversa', error);
  if (!data) return null;

  return linhaParaMatch(data as MatchRow);
};

/* ═══════════════════════════════════════════════════════════════════════
   A DEMANDA DO COMPRADOR
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * A demanda do comprador: a linha de `listings` com `intent = 'buy'`.
 *
 * É a mesma tabela dos anúncios — o que muda é a intenção. Uma demanda
 * é o "quero comprar" da pessoa, e é ela que o `matches.demand_id`
 * aponta.
 */
export const acharDemandaDoComprador = async (
  client: SupabaseLike,
  buyerId: string
): Promise<{ id: string; title: string } | null> => {
  if (!buyerId) return null;

  const { data, error } = await client
    .from('listings')
    .select(PUBLIC_LISTING_COLUMNS)
    .eq('intent', 'buy')
    .eq('owner_id', buyerId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new SupabaseError('falha ao procurar sua demanda', error);
  if (!data) return null;

  const linha = data as ListingRow;
  return { id: String(linha.id ?? ''), title: String(linha.title ?? '') };
};

/**
 * Cria a demanda do comprador, se ele ainda não tiver uma.
 *
 * Sem demanda, não há `demand_id`, e sem `demand_id` não há match, e
 * sem match não há mensagem. A demanda é a peça que amarra a conversa.
 *
 * A demanda criada aqui é MÍNIMA: só o suficiente para existir. Ela
 * não é a procura detalhada do wizard — é o registro de que a pessoa
 * está procurando algo, para que o vendedor veja o interesse.
 */
export const criarDemandaDoComprador = async (
  client: SupabaseLike,
  buyerId: string,
  sobre: { titulo: string; price?: number; cidade?: string; estado?: string }
): Promise<{ id: string; title: string }> => {
  if (!buyerId) {
    throw new Error('criarDemandaDoComprador: buyerId é obrigatório');
  }

  const payload = toListingInsert(
    {
      id: '',
      intent: 'buy',
      title: sobre.titulo,
      category: 'maquinas',
      subcategoryType: '',
      condition: 'usado',
      price: sobre.price ?? 0,
      priceNegotiable: true,
      acceptsTrade: false,
      locationState: sobre.estado ?? '',
      locationCity: sobre.cidade ?? '',
      description: 'Interesse em contato sobre anúncio do EuQuero.',
      userName: '',
      userPhone: '',
      createdAt: new Date().toISOString(),
      status: 'active',
      images: [],
      isPaused: false,
    } as ListingItem,
    buyerId
  );

  const { data, error } = await client
    .from('listings')
    .insert(payload as unknown as Record<string, unknown>)
    .select('id,title')
    .maybeSingle();

  if (error) throw new SupabaseError('não foi possível registrar seu interesse', error);
  if (!data) {
    throw new SupabaseError('não foi possível registrar seu interesse', {
      message: 'o banco não confirmou',
    });
  }

  const linha = data as { id?: unknown; title?: unknown };
  return { id: String(linha.id ?? ''), title: String(linha.title ?? '') };
};

/* ═══════════════════════════════════════════════════════════════════════
   O CONTATO, DE PONTO A PONTO
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * O comprador escreve para o vendedor.
 *
 * A cadeia é: demanda → match → mensagem. Cada elo depende do anterior,
 * e o primeiro elo pode não existir ainda (é criado).
 *
 * O TELEFONE NÃO ENTRA EM NENHUM LUGAR DESTE CÓDIGO. O que o vendedor
 * vai ler é a mensagem e o nome do comprador — nunca o telefone.
 */
export const contatarVendedor = async (
  client: SupabaseLike,
  opts: {
    listingId: string;
    buyerId: string;
    texto: string;
    tituloAnuncio: string;
    cidade?: string;
    estado?: string;
  }
): Promise<{ matchId: string; mensagem: MensagemContato }> => {
  const { listingId, buyerId, texto, tituloAnuncio, cidade, estado } = opts;

  if (!listingId) throw new Error('contatarVendedor: falta o anúncio');
  if (!buyerId) {
    throw new Error('contatarVendedor: é preciso estar logado para contatar');
  }

  // 1. A demanda do comprador.
  let demanda = await acharDemandaDoComprador(client, buyerId);
  if (!demanda) {
    demanda = await criarDemandaDoComprador(client, buyerId, {
      titulo: `Procuro ${tituloAnuncio}`,
      cidade,
      estado,
    });
  }

  // 2. O match entre a demanda e o anúncio.
  let match = await acharMatch(client, listingId, demanda.id);
  if (!match) {
    match = await criarMatch(client, listingId, demanda.id, 0);
  }

  // 3. A mensagem.
  const mensagem = await enviarMensagem(client, match.id, buyerId, texto);

  return { matchId: match.id, mensagem };
};
