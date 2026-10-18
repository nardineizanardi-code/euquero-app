/**
 * Testes do contato e das fotos — os dois bloqueios da revisão.
 *
 * Roda com dublês — sem rede, sem banco:
 *   node --import ./test-helpers/register.mjs --test src/services/contatoEFotos.test.ts
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE ESTES TESTES PROVAM
 * ═══════════════════════════════════════════════════════════════════════
 * 1. FOTO: Base64 NUNCA vira coluna. O que sobe vira URL; o que não
 *    sobe é descartado, não rebaixado a Base64.
 * 2. CONTATO: a mensagem vai para `messages` com o autor do TOKEN, e
 *    o telefone não aparece em lugar nenhum da conversa.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE NÃO PROVAM
 * ═══════════════════════════════════════════════════════════════════════
 * Que a RLS permite o comprador inserir a mensagem. Um dublê não tem
 * RLS. O schema foi conferido por sondagem ao vivo; as POLÍTICAS não
 * foram, e a migração que as garante está para revisão.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  enviarFotos,
  ehDataUrl,
  temBase64,
  dataUrlParaBinario,
  BUCKET_ANUNCIOS,
} from './fotos.ts';
import type { StorageLike } from './fotos.ts';

import {
  enviarMensagem,
  acharMatch,
  criarMatch,
  contatarVendedor,
  listarMensagens,
  listarMensagensDoDono,
} from './contato.ts';
import type { SupabaseLike } from './listingRepository.ts';
import { SupabaseError } from './listingRepository.ts';

/* ═══════════════════════════════════════════════════════════════════════
   DUBLÊS
   ═══════════════════════════════════════════════════════════════════════ */

interface Chamada {
  tabela: string;
  colunas: string;
  metodo: 'select' | 'insert' | 'update' | 'delete';
  filtros: [string, unknown][];
  payload?: unknown;
}

/**
 * Dublê do cliente.
 *
 * `respostasPorTabela` decide o que cada tabela devolve — é o que
 * permite simular "o match já existe" e "a demanda ainda não existe".
 *
 * O valor de cada tabela pode ser um objeto SOLTO (a mesma resposta
 * para select e insert) ou um par `{ select, insert }` — porque a
 * MESMA tabela aparece nas duas operações, e a resposta é diferente:
 * a busca não acha a demanda, e a gravação cria.
 */
type Resposta =
  | unknown
  | { select?: unknown; insert?: unknown; update?: unknown; delete?: unknown };

function duble(
  respostasPorTabela: Record<string, Resposta>,
  erro: { message: string; code?: string } | null = null
): { client: SupabaseLike; chamadas: Chamada[] } {
  const chamadas: Chamada[] = [];

  const client: SupabaseLike = {
    from(tabela: string) {
      const reg: Chamada = { tabela, colunas: '', metodo: 'select', filtros: [] };
      const bruto = respostasPorTabela[tabela] ?? null;
      const porMetodo =
        bruto && typeof bruto === 'object' && !Array.isArray(bruto)
          ? (bruto as Record<string, unknown>)
          : null;

      const resposta = (): unknown => {
        if (!porMetodo) return bruto;
        const especifico = porMetodo[reg.metodo];
        return especifico === undefined ? bruto : especifico;
      };

      const api: any = {
        select(colunas: string) {
          reg.colunas = colunas;
          return api;
        },
        insert(payload: unknown) {
          reg.metodo = 'insert';
          reg.payload = payload;
          return api;
        },
        update(payload: unknown) {
          reg.metodo = 'update';
          reg.payload = payload;
          return api;
        },
        delete() {
          reg.metodo = 'delete';
          return api;
        },
        eq(coluna: string, valor: unknown) {
          reg.filtros.push([coluna, valor]);
          return api;
        },
        order() {
          return api;
        },
        limit() {
          return api;
        },
        range() {
          return api;
        },
        maybeSingle() {
          chamadas.push(reg);
          return Promise.resolve({ data: resposta(), error: erro });
        },
        then(a?: any, b?: any) {
          chamadas.push(reg);
          return Promise.resolve({ data: resposta(), error: erro }).then(a, b);
        },
      };
      return api;
    },
  };

  return { client, chamadas };
}

/** Dublê do Storage, que registra o que subiu. */
function dubleStorage(
  falhar: boolean = false
): { storage: StorageLike; subidas: { caminho: string; tamanho: number }[] } {
  const subidas: { caminho: string; tamanho: number }[] = [];

  const storage: StorageLike = {
    from(bucket: string) {
      return {
        async upload(caminho: string, body: unknown) {
          if (falhar) {
            return {
              data: null,
              error: { message: 'bucket nao encontrado' },
            };
          }
          const tamanho =
            body instanceof Uint8Array ? body.length : Number(body) || 0;
          subidas.push({ caminho, tamanho });
          return { data: { path: caminho }, error: null };
        },
        getPublicUrl(caminho: string) {
          return {
            data: {
              publicUrl: `https://cdn.exemplo/${bucket}/${caminho}`,
            },
          };
        },
      };
    },
  };

  return { storage, subidas };
}

/** Um PNG 1x1 em Base64 — o menor data URL possível. */
const DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

/* ═══════════════════════════════════════════════════════════════════════
   1. AS FOTOS
   ═══════════════════════════════════════════════════════════════════════ */

describe('1. foto: Base64 nao vira coluna', () => {
  test('reconhece data URL', () => {
    assert.equal(ehDataUrl(DATA_URL), true);
    assert.equal(ehDataUrl('https://cdn.exemplo/foto.webp'), false);
    assert.equal(temBase64([DATA_URL]), true);
    assert.equal(temBase64(['https://cdn.exemplo/foto.webp']), false);
  });

  test('o data URL vira binario de verdade', () => {
    const binario = dataUrlParaBinario(DATA_URL);

    assert.ok(binario, 'tem que converter');
    assert.equal(binario.mime, 'image/png');
    assert.ok(binario.bytes.length > 0);
  });

  test('foto que ja e URL passa direto, sem subir', async () => {
    const { storage, subidas } = dubleStorage();
    const resultado = await enviarFotos(
      { storage },
      ['https://cdn.exemplo/ja-existe.webp'],
      'uid/123'
    );

    assert.deepEqual(resultado.urls, ['https://cdn.exemplo/ja-existe.webp']);
    assert.equal(subidas.length, 0, 'nao sobe de novo o que ja e URL');
  });

  test('data URL sobe e VOLTA COMO URL', async () => {
    const { storage, subidas } = dubleStorage();
    const resultado = await enviarFotos({ storage }, [DATA_URL], 'uid/123');

    assert.equal(resultado.urls.length, 1);
    assert.equal(
      resultado.urls[0].startsWith('https://'),
      true,
      'o que vai para o anuncio tem de ser URL'
    );
    assert.equal(
      resultado.urls[0].includes('base64'),
      false,
      'Base64 jamais pode aparecer na URL'
    );
    assert.equal(resultado.perdidas, 0);
    assert.equal(subidas.length, 1, 'a foto subiu');
    assert.ok(subidas[0].caminho.startsWith('uid/123/'), 'a pasta é da pessoa');
  });

  test('o bucket é o esperado', async () => {
    const { storage, subidas } = dubleStorage();
    await enviarFotos({ storage }, [DATA_URL], 'uid/123');

    assert.ok(
      subidas[0].caminho.startsWith(BUCKET_ANUNCIOS + '/') === false,
      'o caminho é relativo ao bucket'
    );
  });

  test('foto que NAO sobe e DESCARTADA — nunca vira Base64 na coluna', async () => {
    // O bucket ainda não existe (a migração está para revisão). O
    // anúncio é salvo SEM a foto. A foto não volta como Base64.
    const { storage } = dubleStorage(true);
    const resultado = await enviarFotos({ storage }, [DATA_URL], 'uid/123');

    assert.equal(resultado.urls.length, 0, 'nenhuma URL de Base64');
    assert.equal(resultado.perdidas, 1, 'a foto foi perdida');
    assert.ok(resultado.motivo, 'e o motivo existe, para a tela avisar');
    assert.equal(
      JSON.stringify(resultado.urls).includes('base64'),
      false,
      'Base64 jamais sai daqui'
    );
  });

  test('sem Storage configurado, o Base64 e descartado', async () => {
    const resultado = await enviarFotos(null, [DATA_URL], 'uid/123');

    assert.equal(resultado.urls.length, 0);
    assert.equal(resultado.perdidas, 1);
    assert.ok(resultado.motivo);
  });

  test('a foto que sobe e a que nao sobe convivem: a que sobe vira URL', async () => {
    const { storage } = dubleStorage();
    const resultado = await enviarFotos(
      { storage },
      [DATA_URL, 'https://cdn.exemplo/direto.webp'],
      'uid/123'
    );

    assert.equal(resultado.urls.length, 2);
    assert.equal(resultado.perdidas, 0);
    assert.equal(
      resultado.urls[0].includes('base64'),
      false,
      'a que subiu virou URL'
    );
    assert.equal(resultado.urls[1], 'https://cdn.exemplo/direto.webp');
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   2. O CONTATO
   ═══════════════════════════════════════════════════════════════════════ */

describe('2. contato: a mensagem chega no banco, o telefone nao', () => {
  test('a mensagem vai para messages, com o autor do TOKEN', async () => {
    const { client, chamadas } = duble({
      messages: {
        id: 'msg-1',
        sender_id: 'uid-do-comprador',
        body: 'Tenho interesse',
        created_at: '2026-10-18T10:00:00.000Z',
        match_id: 'match-1',
      },
    });

    await enviarMensagem(client, 'match-1', 'uid-do-comprador', 'Tenho interesse');

    assert.equal(chamadas[0].tabela, 'messages');
    assert.equal(chamadas[0].metodo, 'insert');
    const payload = chamadas[0].payload as Record<string, unknown>;
    assert.equal(payload.sender_id, 'uid-do-comprador');
    assert.equal(payload.match_id, 'match-1');
    assert.equal(payload.body, 'Tenho interesse');
  });

  test('a mensagem NAO leva telefone, cpf nem pix', async () => {
    const { client, chamadas } = duble({
      messages: {
        id: 'msg-1',
        sender_id: 'uid',
        body: 'oi',
        created_at: '2026-10-18T10:00:00.000Z',
        match_id: 'match-1',
      },
    });

    await enviarMensagem(client, 'match-1', 'uid', 'oi');

    const payload = chamadas[0].payload as Record<string, unknown>;
    for (const proibido of ['user_phone', 'phone', 'cpf', 'pix_key', 'telefone']) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(payload, proibido),
        false,
        `a mensagem nao pode carregar "${proibido}"`
      );
    }
  });

  test('sem uid do token, a mensagem nem sai', async () => {
    const { client, chamadas } = duble({ messages: null });

    await assert.rejects(
      () => enviarMensagem(client, 'match-1', '', 'oi'),
      /senderId/
    );
    assert.equal(chamadas.length, 0, 'nao pode haver consulta sem autor');
  });

  test('a mensagem vazia e recusada', async () => {
    const { client, chamadas } = duble({ messages: null });

    await assert.rejects(() => enviarMensagem(client, 'match-1', 'uid', '   '));
    assert.equal(chamadas.length, 0);
  });

  test('quando o banco barra, e erro — nao "mensagem enviada"', async () => {
    const { client } = duble(
      { messages: null },
      { message: 'new row violates row-level security policy', code: '42501' }
    );

    await assert.rejects(
      () => enviarMensagem(client, 'match-1', 'uid', 'oi'),
      (e: any) =>
        e instanceof SupabaseError && /row-level security/.test(e.message)
    );
  });

  test('a conversa se lê pela tabela messages, filtrada pelo match', async () => {
    const { client, chamadas } = duble({
      messages: [
        {
          id: 'msg-1',
          sender_id: 'uid',
          body: 'oi',
          created_at: '2026-10-18T10:00:00.000Z',
          match_id: 'match-1',
        },
      ],
    });

    const lista = await listarMensagens(client, 'match-1');

    assert.equal(lista.length, 1);
    assert.equal(lista[0].texto, 'oi');
    assert.deepEqual(
      chamadas[0].filtros.find((f) => f[0] === 'match_id'),
      ['match_id', 'match-1']
    );
  });

  test('o vendedor le as mensagens pelo match do anuncio DELE', async () => {
    const { client, chamadas } = duble({
      messages: [
        {
          id: 'msg-1',
          sender_id: 'uid-do-comprador',
          body: 'tenho interesse',
          created_at: '2026-10-18T10:00:00.000Z',
          match_id: 'match-1',
          matches: [{ id: 'match-1', listing_id: 'listing-9' }],
        },
      ],
    });

    const lista = await listarMensagensDoDono(client, 'uid-do-vendedor');

    assert.equal(lista.length, 1);
    assert.equal(lista[0].listingId, 'listing-9');
    const colunas = chamadas[0].colunas;
    assert.ok(
      colunas.includes('matches_listing_id_fkey'),
      'o embed precisa ser pelo lado do ANUNCIO, nomeado'
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   3. A CADEIA DO CONTATO
   ═══════════════════════════════════════════════════════════════════════ */

describe('3. a cadeia: demanda -> match -> mensagem', () => {
  test('com demanda e match prontos, so a mensagem e enviada', async () => {
    const { client, chamadas } = duble({
      listings: {
        id: 'demanda-1',
        title: 'Procuro CAT 320D',
      },
      matches: {
        id: 'match-1',
        listing_id: 'listing-9',
        demand_id: 'demanda-1',
        score: 0,
        status: 'novo',
        created_at: '2026-10-18T10:00:00.000Z',
      },
      messages: {
        id: 'msg-1',
        sender_id: 'uid-do-comprador',
        body: 'tenho interesse',
        created_at: '2026-10-18T10:00:00.000Z',
        match_id: 'match-1',
      },
    });

    const resultado = await contatarVendedor(client, {
      listingId: 'listing-9',
      buyerId: 'uid-do-comprador',
      texto: 'tenho interesse',
      tituloAnuncio: 'Escavadeira CAT 320D',
    });

    assert.equal(resultado.matchId, 'match-1');
    const mensagens = chamadas.filter((c) => c.tabela === 'messages');
    assert.equal(mensagens.length, 1, 'uma mensagem');
    assert.equal(
      chamadas.filter((c) => c.metodo === 'insert' && c.tabela === 'matches').length,
      0,
      'o match ja existia — nao cria outro'
    );
  });

  test('sem demanda, ela e criada antes do match', async () => {
    const { client, chamadas } = duble({
      listings: {
        select: null,
        insert: { id: 'demanda-nova', title: 'Procuro CAT 320D' },
      },
      matches: {
        id: 'match-1',
        listing_id: 'listing-9',
        demand_id: 'demanda-nova',
        score: 0,
        status: 'novo',
        created_at: '2026-10-18T10:00:00.000Z',
      },
      messages: {
        id: 'msg-1',
        sender_id: 'uid-do-comprador',
        body: 'oi',
        created_at: '2026-10-18T10:00:00.000Z',
        match_id: 'match-1',
      },
    });

    await contatarVendedor(client, {
      listingId: 'listing-9',
      buyerId: 'uid-do-comprador',
      texto: 'oi',
      tituloAnuncio: 'Escavadeira CAT 320D',
    });

    const insereListing = chamadas.find(
      (c) => c.tabela === 'listings' && c.metodo === 'insert'
    );
    assert.ok(insereListing, 'a demanda foi criada');
    const payload = insereListing?.payload as Record<string, unknown>;
    assert.equal(payload.owner_id, 'uid-do-comprador', 'a demanda e da pessoa');
    assert.equal(payload.intent, 'buy', 'e uma demanda, nao um anuncio de venda');
  });

  test('sem match, ele e criado antes da mensagem', async () => {
    const { client, chamadas } = duble({
      listings: { id: 'demanda-1', title: 'Procuro CAT 320D' },
      matches: {
        select: null,
        insert: {
          id: 'match-novo',
          listing_id: 'listing-9',
          demand_id: 'demanda-1',
          score: 0,
          status: 'novo',
          created_at: '2026-10-18T10:00:00.000Z',
        },
      },
      messages: {
        id: 'msg-1',
        sender_id: 'uid-do-comprador',
        body: 'oi',
        created_at: '2026-10-18T10:00:00.000Z',
        match_id: 'match-novo',
      },
    });

    await contatarVendedor(client, {
      listingId: 'listing-9',
      buyerId: 'uid-do-comprador',
      texto: 'oi',
      tituloAnuncio: 'Escavadeira CAT 320D',
    });

    const insereMatch = chamadas.find(
      (c) => c.tabela === 'matches' && c.metodo === 'insert'
    );
    assert.ok(insereMatch, 'o match foi criado');
    const payload = insereMatch?.payload as Record<string, unknown>;
    assert.equal(payload.listing_id, 'listing-9');
    assert.equal(payload.demand_id, 'demanda-1');
  });

  test('sem sessao, o contato nem sai', async () => {
    const { client, chamadas } = duble({ messages: null });

    await assert.rejects(
      () =>
        contatarVendedor(client, {
          listingId: 'listing-9',
          buyerId: '',
          texto: 'oi',
          tituloAnuncio: 'Escavadeira',
        }),
      /logado|buyerId/
    );
    assert.equal(chamadas.length, 0, 'nenhuma consulta sem dono');
  });

  test('acharMatch procura os DOIS lados, e nao acha match de outra dupla', async () => {
    const { client, chamadas } = duble({ matches: null });

    const achado = await acharMatch(client, 'listing-9', 'demanda-1');

    assert.equal(achado, null);
    assert.deepEqual(chamadas[0].filtros, [
      ['listing_id', 'listing-9'],
      ['demand_id', 'demanda-1'],
    ]);
  });

  test('criarMatch liga o anuncio a demanda', async () => {
    const { client, chamadas } = duble({
      matches: {
        id: 'match-1',
        listing_id: 'listing-9',
        demand_id: 'demanda-1',
        score: 0,
        status: 'novo',
        created_at: '2026-10-18T10:00:00.000Z',
      },
    });

    const match = await criarMatch(client, 'listing-9', 'demanda-1', 0);

    assert.equal(match.id, 'match-1');
    const payload = chamadas[0].payload as Record<string, unknown>;
    assert.equal(payload.listing_id, 'listing-9');
    assert.equal(payload.demand_id, 'demanda-1');
  });
});
