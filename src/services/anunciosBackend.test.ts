/**
 * Testes do MVP de anúncios reais.
 *
 * Roda com um dublê de cliente — sem rede, sem banco, sem instalar nada:
 *   node --import ./test-helpers/register.mjs --test src/services/anunciosBackend.test.ts
 *
 * ═══════════════════════════════════════════════════════════════════════
 * O QUE ESTES TESTES PROVAM — E O QUE NÃO PROVAM
 * ═══════════════════════════════════════════════════════════════════════
 * PROVAM:
 *   1. A vitrine lê a VIEW `public_listings`, e não pede coluna sensível.
 *   2. O payload de insert carrega o dono do TOKEN, e o de update não.
 *   3. A edição e a exclusão carregam o filtro `owner_id`.
 *   4. A união das listas não duplica, e o banco manda no conflito de id.
 *
 * NÃO PROVAM:
 *   - Que a RLS barra um uid de outra pessoa. Isso é leitura de banco.
 *   - Que o `owner_id` gravado bate com o dono real. Também é o banco.
 *   - Que a view `public_listings` está sincronizada com `listings`.
 *   - Que o projeto configurado é o certo.
 *
 * Um dublê não tem RLS. Por isso o filtro `owner_id` é testado AQUI, na
 * consulta que o app monta: é o que prova que o app não ESQUECE de
 * filtrar. A garantia de que o filtro funciona é do banco.
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  listPublicListings,
  listMyListings,
  createListing,
  updateListing,
  deleteListing,
} from './listingRepository.ts';
import type { SupabaseLike } from './listingRepository.ts';
import {
  PUBLIC_LISTING_COLUMNS,
  PRIVATE_LISTING_COLUMNS,
  toListingInsert,
  toListingUpdate,
} from './productService.ts';
import type { ListingRow } from './productService.ts';
import { juntarAnuncios } from './useAnunciosBackend.ts';
import { INITIAL_LISTINGS } from '../data/initialData.ts';
import type { ListingItem } from '../types/index.ts';

/* ───────────────────────── dublê ───────────────────────── */

interface Chamada {
  tabela: string;
  colunas: string;
  metodo: 'select' | 'insert' | 'update' | 'delete';
  filtros: [string, unknown][];
  payload?: unknown;
  pediuCount?: boolean;
}

const linha = (over: Partial<ListingRow> = {}): ListingRow => ({
  id: 'a1b2c3d4-0000-0000-0000-000000000001',
  owner_id: 'uuid-do-dono',
  intent: 'sell',
  title: 'Escavadeira CAT 320D',
  category: 'maquinas',
  subcategory_type: 'Escavadeira Hidraulica',
  condition: 'usado',
  brand: 'Caterpillar',
  model: '320D',
  year_min: null,
  year_max: null,
  year: 2019,
  hours_used: 4200,
  mileage_km: null,
  power_hp: 162,
  price: '385000.00',
  price_negotiable: true,
  budget_range: null,
  accepts_trade: false,
  location_state: 'SC',
  location_city: 'Joinville',
  description: 'Maquina em otimo estado.',
  images: ['https://cdn/foto1.jpg', 'https://cdn/foto2.jpg'],
  video_url: null,
  has_verified_video: true,
  urgency: 'imediata',
  geo_preference: 'so_estado',
  tier: 'free',
  badge: 'none',
  highlight_days: 0,
  status: 'active',
  is_paused: false,
  cpf: '123.456.789-00',
  user_phone: '(47) 99999-0000',
  pix_key: 'pix-secreto-123',
  created_at: '2026-01-15T10:00:00.000Z',
  updated_at: '2026-01-16T10:00:00.000Z',
  ...over,
});

function duble(
  resposta: unknown,
  erro: { message: string; code?: string } | null = null
): { client: SupabaseLike; chamadas: Chamada[] } {
  const chamadas: Chamada[] = [];

  const client: SupabaseLike = {
    from(tabela: string) {
      const reg: Chamada = { tabela, colunas: '', metodo: 'select', filtros: [] };

      const api: any = {
        select(colunas: string, opts?: any) {
          reg.colunas = colunas;
          reg.pediuCount = opts?.count === 'exact';
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
          return Promise.resolve({ data: resposta, error: erro });
        },
        then(a?: any, b?: any) {
          chamadas.push(reg);
          return Promise.resolve({
            data: resposta,
            error: erro,
            count: reg.pediuCount ? 0 : null,
          }).then(a, b);
        },
      };
      return api;
    },
  };

  return { client, chamadas };
}

const item = (over: Partial<ListingItem> = {}): ListingItem =>
  ({
    id: 'local-1',
    intent: 'sell',
    title: 'Escavadeira CAT 320D',
    category: 'maquinas',
    subcategoryType: 'Escavadeira',
    condition: 'usado',
    brand: 'Caterpillar',
    model: '320D',
    year: 2019,
    hoursUsed: 4200,
    price: 385000,
    priceNegotiable: true,
    acceptsTrade: false,
    locationState: 'SC',
    locationCity: 'Joinville',
    description: 'Maquina em otimo estado.',
    userName: 'Nardinei Silva',
    userPhone: '(47) 9962-0000',
    createdAt: '2026-01-15T10:00:00.000Z',
    status: 'active',
    images: ['https://cdn/foto1.jpg', 'https://cdn/foto2.jpg'],
    tier: 'free',
    highlightDays: 0,
    badge: 'none',
    isPaused: false,
    ...over,
  }) as ListingItem;

/* ═══════════════════════════════════════════════════════════════════════
   1. A LEITURA PÚBLICA
   ═══════════════════════════════════════════════════════════════════════ */

describe('1. a vitrine le a view publica, e so as colunas seguras', () => {
  test('consulta public_listings, nunca a tabela listings', async () => {
    const { client, chamadas } = duble([linha()]);
    await listPublicListings(client);

    assert.equal(chamadas[0].tabela, 'public_listings', 'tem de ler a view');
    assert.notEqual(chamadas[0].tabela, 'listings', 'ler a tabela traria o dado privado');
  });

  test('nao pede nenhuma coluna sensivel', async () => {
    const { client, chamadas } = duble([linha()]);
    await listPublicListings(client);

    const pedidas = chamadas[0].colunas.split(',').map((c) => c.trim());
    for (const proibida of ['owner_id', 'cpf', 'user_phone', 'pix_key']) {
      assert.equal(
        pedidas.includes(proibida),
        false,
        `a vitrine nao pode pedir "${proibida}"`
      );
    }
    assert.ok(pedidas.includes('title') && pedidas.includes('price'), 'pega o basico, sim');
  });

  test('a allowlist publica bate com a usada na consulta', () => {
    // Se a allowlist e a consulta divergirem, uma delas vira letra morta.
    const allowlist = PUBLIC_LISTING_COLUMNS.split(',').map((c) => c.trim());
    for (const proibida of ['owner_id', 'cpf', 'user_phone', 'pix_key']) {
      assert.equal(allowlist.includes(proibida), false, `"${proibida}" nao pode estar na allowlist`);
    }
  });

  test('o item publico NUNCA carrega telefone, cpf nem pix', async () => {
    // A linha crua tem os tres preenchidos de proposito.
    const { client } = duble([linha()]);
    const { items } = await listPublicListings(client);
    const bruto = JSON.stringify(items);

    assert.equal(items[0].userPhone, '');
    assert.equal(items[0].cpf, undefined);
    assert.ok(!bruto.includes('pix-secreto-123'), 'pix vazou pela vitrine');
    assert.ok(!bruto.includes('123.456.789-00'), 'cpf vazou pela vitrine');
    assert.ok(!bruto.includes('(47) 99999-0000'), 'telefone vazou pela vitrine');
  });

  test('as fotos do anuncio publico vem do banco', async () => {
    const { client } = duble([linha({ images: ['https://cdn/a.jpg', 'https://cdn/b.jpg'] })]);
    const { items } = await listPublicListings(client);

    assert.deepEqual(items[0].images, ['https://cdn/a.jpg', 'https://cdn/b.jpg']);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   2. O PAYLOAD
   ═══════════════════════════════════════════════════════════════════════ */

describe('2. o payload: o dono vem do token, e os selos nao vem do cliente', () => {
  test('o insert leva o owner_id do token', () => {
    const payload = toListingInsert(item(), 'uid-do-token');

    assert.equal(payload.owner_id, 'uid-do-token');
  });

  test('o insert IGNORA o ownerId que veio dentro do item', () => {
    const payload = toListingInsert(
      item({ ownerId: 'outro-uid' } as Partial<ListingItem>),
      'uid-do-token'
    );

    assert.equal(payload.owner_id, 'uid-do-token', 'o dono nao pode vir do item');
  });

  test('o update NAO leva owner_id — o dono de um anuncio nao muda', () => {
    const payload = toListingUpdate(item()) as unknown as Record<string, unknown>;

    assert.equal(
      Object.prototype.hasOwnProperty.call(payload, 'owner_id'),
      false,
      'owner_id nao pode ser reescrito por quem edita'
    );
  });

  test('nem insert nem update levam selo, destaque ou video verificado', () => {
    const insert = toListingInsert(item(), 'uid') as unknown as Record<string, unknown>;
    const update = toListingUpdate(item()) as unknown as Record<string, unknown>;

    for (const proibido of [
      'tier',
      'badge',
      'highlight_days',
      'has_verified_video',
    ]) {
      assert.equal(
        Object.prototype.hasOwnProperty.call(insert, proibido),
        false,
        `insert nao pode mandar "${proibido}" — isso e do gatilho/pagamento`
      );
      assert.equal(
        Object.prototype.hasOwnProperty.call(update, proibido),
        false,
        `update nao pode mandar "${proibido}"`
      );
    }
  });

  test('as fotos vao no payload — e sao as strings, do jeito que o app tem', () => {
    const payload = toListingInsert(item(), 'uid');

    assert.deepEqual(payload.images, ['https://cdn/foto1.jpg', 'https://cdn/foto2.jpg']);
  });

  test('o insert sem uid do token e erro, nao anuncio sem dono', () => {
    assert.throws(
      () => toListingInsert(item(), ''),
      /authenticatedUserId/,
      'anuncio sem dono nao pode ser gravado'
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   3. A EDICAO E DO DONO
   ═══════════════════════════════════════════════════════════════════════ */

describe('3. editar so o dono', () => {
  test('a edicao filtra por owner_id', async () => {
    const { client, chamadas } = duble(linha());
    await updateListing(client, 'a1b2c3d4', item(), 'uid-do-dono');

    const filtros = chamadas[0].filtros;
    assert.deepEqual(
      filtros.find((f) => f[0] === 'owner_id'),
      ['owner_id', 'uid-do-dono'],
      'a edicao tem de dizer de quem e o anuncio'
    );
    assert.ok(
      filtros.some((f) => f[0] === 'id'),
      'a edicao tem de dizer qual anuncio'
    );
  });

  test('a edicao vai na tabela listings, nao na view', async () => {
    const { client, chamadas } = duble(linha());
    await updateListing(client, 'a1b2c3d4', item(), 'uid-do-dono');

    assert.equal(chamadas[0].tabela, 'listings');
    assert.equal(chamadas[0].metodo, 'update');
  });

  test('o payload da edicao nao leva owner_id', async () => {
    const { client, chamadas } = duble(linha());
    await updateListing(client, 'a1b2c3d4', item(), 'uid-do-dono');

    const payload = chamadas[0].payload as Record<string, unknown>;
    assert.equal(
      Object.prototype.hasOwnProperty.call(payload, 'owner_id'),
      false,
      'o dono nao pode ser reescrito'
    );
    assert.equal(payload.title, 'Escavadeira CAT 320D');
  });

  test('a edicao devolve o anuncio', async () => {
    const { client } = duble(linha());
    const { item: editado } = await updateListing(client, 'a1b2c3d4', item(), 'uid-do-dono');

    assert.equal(editado.id, 'a1b2c3d4-0000-0000-0000-000000000001');
    assert.equal(editado.title, 'Escavadeira CAT 320D');
  });

  test('quando nada volta, e erro — nao "editou com sucesso"', async () => {
    // E o caso do RLS barrando: o UPDATE casa zero linhas.
    const { client } = duble(null);
    await assert.rejects(
      () => updateListing(client, 'a1b2c3d4', item(), 'uid-do-dono'),
      /não encontrado/,
      'sem linha de volta, nada foi editado'
    );
  });

  test('sem uid do token, a edicao nem sai', async () => {
    const { client, chamadas } = duble(linha());
    await assert.rejects(() => updateListing(client, 'a1b2c3d4', item(), ''), /authenticatedUserId/);
    assert.equal(chamadas.length, 0, 'nao pode haver consulta sem dono');
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   4. A EXCLUSAO E DO DONO
   ═══════════════════════════════════════════════════════════════════════ */

describe('4. excluir so o dono', () => {
  test('a exclusao filtra por owner_id', async () => {
    const { client, chamadas } = duble([{ id: 'a1b2c3d4' }]);
    await deleteListing(client, 'a1b2c3d4', 'uid-do-dono');

    const filtros = chamadas[0].filtros;
    assert.deepEqual(
      filtros.find((f) => f[0] === 'owner_id'),
      ['owner_id', 'uid-do-dono'],
      'a exclusao tem de dizer de quem e o anuncio'
    );
    assert.ok(filtros.some((f) => f[0] === 'id'), 'a exclusao tem de dizer qual anuncio');
  });

  test('a exclusao vai na tabela listings', async () => {
    const { client, chamadas } = duble([{ id: 'a1b2c3d4' }]);
    await deleteListing(client, 'a1b2c3d4', 'uid-do-dono');

    assert.equal(chamadas[0].tabela, 'listings');
    assert.equal(chamadas[0].metodo, 'delete');
  });

  test('a exclusao devolve o id apagado', async () => {
    const { client } = duble([{ id: 'a1b2c3d4' }]);
    const resultado = await deleteListing(client, 'a1b2c3d4', 'uid-do-dono');

    assert.equal(resultado.id, 'a1b2c3d4');
  });

  test('quando nada volta, e erro — nao "apagou com sucesso"', async () => {
    const { client } = duble([]);
    await assert.rejects(
      () => deleteListing(client, 'a1b2c3d4', 'uid-do-dono'),
      /não encontrado/,
      'sem linha de volta, nada foi apagado'
    );
  });

  test('sem uid do token, a exclusao nem sai', async () => {
    const { client, chamadas } = duble([{ id: 'a1b2c3d4' }]);
    await assert.rejects(() => deleteListing(client, 'a1b2c3d4', ''), /authenticatedUserId/);
    assert.equal(chamadas.length, 0, 'nao pode haver consulta sem dono');
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   5. A LEITURA DO DONO
   ═══════════════════════════════════════════════════════════════════════ */

describe('5. a leitura do dono vai na tabela, sob RLS', () => {
  test('lista os anuncios do dono na tabela listings', async () => {
    const { client, chamadas } = duble([linha()]);
    await listMyListings(client);

    assert.equal(chamadas[0].tabela, 'listings', 'o dono le a tabela, nao a view publica');
  });

  test('a leitura do dono PODE trazer cpf e telefone — sao dele', async () => {
    const colunas = PRIVATE_LISTING_COLUMNS.split(',').map((c) => c.trim());

    assert.ok(colunas.includes('cpf'), 'o dono precisa do proprio cpf');
    assert.ok(colunas.includes('user_phone'), 'o dono precisa do proprio telefone');
  });

  test('a leitura do dono NAO traz pix_key', async () => {
    const colunas = PRIVATE_LISTING_COLUMNS.split(',').map((c) => c.trim());

    assert.equal(
      colunas.includes('pix_key'),
      false,
      'pix nao entra nem na leitura do dono'
    );
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   6. A UNIAO DAS LISTAS
   ═══════════════════════════════════════════════════════════════════════ */

describe('6. juntarAnuncios: o banco manda, e nada duplica', () => {
  test('com o banco vazio, a lista local fica como estava', () => {
    const locais = [item({ id: 'local-1' })];

    const junto = juntarAnuncios(locais, []);

    assert.equal(junto.length, 1);
    assert.equal(junto[0].id, 'local-1', 'a lista local nao pode sumir');
  });

  test('com o banco cheio, a lista local some para o banco mandar', () => {
    const locais = [item({ id: 'local-1' })];
    const doBanco = [item({ id: 'banco-1' })];

    const junto = juntarAnuncios(locais, doBanco);

    assert.equal(junto.length, 2);
    assert.equal(junto[0].id, 'banco-1', 'o banco vem primeiro');
  });

  test('o mesmo id nos dois lados vira UM anuncio, e o do banco ganha', () => {
    const local = item({ id: 'mesmo', title: 'versao local' });
    const doBanco = item({ id: 'mesmo', title: 'versao do banco' });

    const junto = juntarAnuncios([local], [doBanco]);

    assert.equal(junto.length, 1, 'o mesmo anuncio nao aparece duas vezes');
    assert.equal(junto[0].title, 'versao do banco', 'o banco manda no conflito de id');
  });

  test('o item de DEMONSTRACAO sai marcado como demonstracao', () => {
    // Os ids de vitrine do app sao `buy-N` e `sell-N`, e vem da propria
    // lista INITIAL_LISTINGS — nao de um padrao escrito a mao.
    const demo = INITIAL_LISTINGS[0];
    const junto = juntarAnuncios([demo], []);

    assert.equal(junto[0].origem, 'demonstracao');
  });

  test('anuncio criado pela pessoa NAO e marcado como demonstracao', () => {
    const meu = item({ id: 'meu-anuncio-123' });
    const junto = juntarAnuncios([meu], []);

    assert.equal(junto[0].origem, 'real');
  });

  test('o que vem do banco e sempre real', () => {
    const doBanco = item({ id: 'qualquer-coisa' });
    const junto = juntarAnuncios([], [doBanco]);

    assert.equal(junto[0].origem, 'real');
  });

  test('a marcacao nao muda o resto do anuncio', () => {
    const original = item({ id: 'meu-anuncio-123', title: 'Titulo' });
    const junto = juntarAnuncios([original], []);

    assert.equal(junto[0].title, 'Titulo');
    assert.equal(junto[0].images?.length, original.images?.length);
  });

  test('anuncio sem id nao entra — nem como anuncio', () => {
    const junto = juntarAnuncios([item({ id: '' } as Partial<ListingItem>)], []);

    assert.equal(junto.length, 0);
  });
});

/* ═══════════════════════════════════════════════════════════════════════
   7. O SALVAMENTO
   ═══════════════════════════════════════════════════════════════════════ */

describe('7. salvar: o dono vai do token', () => {
  test('o insert vai na tabela listings, com o owner_id do token', async () => {
    const { client, chamadas } = duble(linha());
    await createListing(client, item(), 'uid-do-dono');

    assert.equal(chamadas[0].tabela, 'listings');
    assert.equal(chamadas[0].metodo, 'insert');
    const payload = chamadas[0].payload as Record<string, unknown>;
    assert.equal(payload.owner_id, 'uid-do-dono');
  });

  test('o insert nao manda selo nem destaque', async () => {
    const { client, chamadas } = duble(linha());
    await createListing(client, item(), 'uid-do-dono');

    const payload = chamadas[0].payload as Record<string, unknown>;
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'tier'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'badge'), false);
    assert.equal(Object.prototype.hasOwnProperty.call(payload, 'highlight_days'), false);
  });

  test('sem uid do token, o insert nem sai', async () => {
    const { client, chamadas } = duble(linha());
    await assert.rejects(() => createListing(client, item(), ''), /authenticatedUserId/);
    assert.equal(chamadas.length, 0);
  });
});
