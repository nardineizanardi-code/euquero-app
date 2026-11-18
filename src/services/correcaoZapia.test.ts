/**
 * AS DUAS CORREÇÕES DO ZAPIA.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CORREÇÃO 1 — O WHATSAPP VAI PARA O VENDEDOR DAQUELE ANÚNCIO
 *
 * O WhatsApp do banner abria um número FIXO (5547996205669): o mesmo
 * para todo mundo, para todo anúncio, e não o do vendedor que a pessoa
 * estava procurando. E a abertura era um `window.open` dentro de um
 * `useEffect` — que o navegador bloqueia, porque um effect não é um
 * gesto do usuário.
 *
 * A correção: a pendência carrega o ANÚNCIO, o telefone é lido do
 * banco depois do login, e a navegação é na mesma aba.
 *
 * ─────────────────────────────────────────────────────────────────────
 * CORREÇÃO 2 — O CACHE ANTIGO DO LOCALSTORAGE
 *
 * Tirar a injeção do `INITIAL_LISTINGS` não bastou: o `localStorage`
 * guardava a vitrine inteira, e as peças de demonstração já estavam
 * salvas ali dentro. Quem abria o app num navegador que já tinha usado
 * o app antes via um feed com anúncios que não existiam.
 *
 * A correção: uma limpeza forçada no carregamento da Home.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO TESTA
 *
 *  - o COMPORTAMENTO: o matcher de pedido, a leitura do telefone no
 *    banco e a limpeza do cache (funções puras e dublês);
 *  - a FIAÇÃO: a App usa o telefone do banco, navega na mesma aba, e
 *    não tem telefone fixo nem `window.open` no effect.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  pendenciaDeWhatsApp,
  retomarPendenciaDeContato,
  urlDoWhatsApp,
  anuncioDoPedidoDoComprador,
} from './pendenciaContato';
import { telefoneDoVendedor } from './contato';
import { limparCacheAntigoDaVitrine, CHAVE_CACHE_VITRINE } from './estadoDaVitrine';
import type { ListingItem } from '../types';

const raiz = join(import.meta.dirname, '..', '..');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');
const contato = readFileSync(join(raiz, 'src', 'services', 'contato.ts'), 'utf-8');

const anuncio = (over: Partial<ListingItem> = {}): ListingItem =>
  ({
    id: 'sell-1',
    intent: 'sell',
    // CP1.1: o comparador do banner só aceita ANÚNCIO DE VENDEDOR
    // ATIVO. O `status` faz parte da regra.
    status: 'active',
    title: 'Escavadeira CAT 320D 2019',
    category: 'linha_amarela',
    condition: 'usado',
    price: 520000,
    brand: 'CAT',
    model: '320D',
    subcategoryType: 'Escavadeira',
    locationState: 'SC',
    locationCity: 'Joinville',
    ...over,
  }) as ListingItem;

// ═══════════════════════════════════════════════════════════════════
// CORREÇÃO 1 — A PENDÊNCIA CARREGA O ANÚNCIO
// ═══════════════════════════════════════════════════════════════════

test('CP1: a pendência do WhatsApp guarda o ID do ANÚNCIO', () => {
  const p = pendenciaDeWhatsApp('sell-7', 'Olá!');
  assert.ok(p);
  assert.equal(p.tipo, 'whatsapp');
  assert.equal((p as { id: string }).id, 'sell-7');
});

test('CP1: a pendência do WhatsApp NÃO carrega telefone nenhum', () => {
  // Se a pendência carregasse o número, o número viria do clique —
  // e do clique ele era uma constante.
  const p = pendenciaDeWhatsApp('sell-7', 'Olá!');
  assert.equal('telefone' in (p as object), false);
});

test('CP1: a retomada do WhatsApp exige que o anúncio ainda exista', () => {
  const feed = [{ id: 'sell-1' }];
  assert.ok(retomarPendenciaDeContato({ tipo: 'whatsapp', id: 'sell-1', texto: 'x' }, feed));
  assert.equal(
    retomarPendenciaDeContato({ tipo: 'whatsapp', id: 'sell-9', texto: 'x' }, feed),
    null
  );
});

// ═══════════════════════════════════════════════════════════════════
// CORREÇÃO 1 — O ANÚNCIO DO PEDIDO
// ═══════════════════════════════════════════════════════════════════

test('CP1: o anúncio que serve o pedido é encontrado', () => {
  const achado = anuncioDoPedidoDoComprador(
    [anuncio({ id: 'a' }), anuncio({ id: 'b', title: 'Caminhão Volvo FH 540' })],
    'Escavadeira CAT 320D'
  );
  assert.ok(achado);
  assert.equal(achado.id, 'a');
});

test('CP1: a comparação ignora acento e caixa', () => {
  const achado = anuncioDoPedidoDoComprador(
    [anuncio({ id: 'a', title: 'ESCAVADEIRA CAT 320D', brand: 'CAT', model: '320D' })],
    'Escavadeira Cat 320D'
  );
  assert.ok(achado);
  assert.equal(achado.id, 'a');
});

test('CP1: um anúncio de outra máquina NÃO serve o pedido', () => {
  const achado = anuncioDoPedidoDoComprador(
    [anuncio({ id: 'a', title: 'Caminhão Volvo FH 540', brand: 'Volvo', model: 'FH 540' })],
    'Escavadeira CAT 320D'
  );
  assert.equal(achado, null);
});

test('CP1: TODAS as palavras do pedido precisam estar no anúncio', () => {
  // Uma palavra só seria "qualquer anúncio com CAT".
  const achado = anuncioDoPedidoDoComprador(
    [anuncio({ id: 'a', title: 'Escavadeira CASE 320D', brand: 'CASE', model: '320D' })],
    'Escavadeira CAT 320D'
  );
  assert.equal(achado, null);
});

test('CP1: sem pedido, não há anúncio', () => {
  assert.equal(anuncioDoPedidoDoComprador([anuncio()], ''), null);
  assert.equal(anuncioDoPedidoDoComprador([anuncio()], null), null);
});

// ═══════════════════════════════════════════════════════════════════
// CORREÇÃO 1 — O TELEFONE VEM DO BANCO
// ═══════════════════════════════════════════════════════════════════

/** Um cliente de Supabase que responde o que o teste mandar. */
const cliente = (
  respostas: Record<string, { data?: unknown; error?: unknown }>
): {
  from(table: string): Record<string, (...args: unknown[]) => unknown>;
} => {
  const consultas: string[] = [];
  const tabelas: string[] = [];

  const api = {
    select(columns: string) {
      consultas.push(columns);
      return api;
    },
    eq() {
      return api;
    },
    maybeSingle() {
      const tabela = tabelas[tabelas.length - 1];
      const r = respostas[tabela] ?? {};
      return Promise.resolve({ data: r.data ?? null, error: r.error ?? null });
    },
    then(resolve: (v: unknown) => unknown) {
      const tabela = tabelas[tabelas.length - 1];
      const r = respostas[tabela] ?? {};
      return Promise.resolve({ data: r.data ?? null, error: r.error ?? null }).then(resolve);
    },
  };

  return {
    from(table: string) {
      tabelas.push(table);
      return api as unknown as Record<string, (...args: unknown[]) => unknown>;
    },
  };
};

test('CP1: o telefone é lido do anúncio no banco', async () => {
  const cli = cliente({ listings: { data: { id: 'sell-1', user_phone: '(47) 99620-5669' } } });
  const telefone = await telefoneDoVendedor(
    cli as never,
    'sell-1'
  );
  assert.equal(telefone, '47996205669');
});

test('CP1: sem id, não há telefone', async () => {
  const cli = cliente({});
  assert.equal(await telefoneDoVendedor(cli as never, ''), null);
});

test('CP1: anúncio sem telefone devolve null (não inventa número)', async () => {
  const cli = cliente({ listings: { data: { id: 'sell-1', user_phone: null } } });
  assert.equal(await telefoneDoVendedor(cli as never, 'sell-1'), null);
});

test('CP1: quando o banco barra, o telefone é null — e não um erro fatal', async () => {
  const cli = cliente({
    listings: { error: { message: 'permission denied' } },
    matches: { error: { message: 'permission denied' } },
  });
  assert.equal(await telefoneDoVendedor(cli as never, 'sell-1'), null);
});

test('CP1: o telefone também é lido pelo caminho do match', async () => {
  // O caminho 2 existe porque a RLS de `listings` pode barrar a
  // leitura direta do anúncio de outro dono. O mesmo dado, visto por
  // outra porta.
  const cli = cliente({
    listings: { error: { message: 'permission denied' } },
    matches: {
      data: [
        { id: 'm-1', listing_id: 'sell-1', listings: { user_phone: '47996205669' } },
      ],
    },
  });
  assert.equal(await telefoneDoVendedor(cli as never, 'sell-1'), '47996205669');
});

// ═══════════════════════════════════════════════════════════════════
// CORREÇÃO 1 — A FIAÇÃO NA APP
// ═══════════════════════════════════════════════════════════════════

test('CP1: a App não tem MAIS telefone fixo nenhum', () => {
  const semComentarios = app
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(
    semComentarios,
    /5547996205669/,
    'o telefone fixo continua no código da App'
  );
});

test('CP1: o WhatsApp navega na MESMA ABA (window.location.href)', () => {
  const bloco = trecho(
    app,
    'const abrirWhatsAppDoAnuncio = async (anuncio: ListingItem, texto: string) => {',
    'const handleWhatsAppDoBanner = () => {'
  );
  assert.match(bloco, /window\.location\.href = urlDoWhatsApp\(/);
  assert.doesNotMatch(bloco, /window\.open\(/, 'o WhatsApp ainda abre aba nova');
});

test('CP1: o effect da retomada NÃO usa window.open', () => {
  // Era exatamente aqui que o bloqueador de pop-up morava.
  const bloco = trecho(app, 'if (!sessao) return;', 'const handleSendMessage');
  assert.match(bloco, /retomarPendenciaDeContato\(/);
  assert.doesNotMatch(bloco, /window\.open\(/, 'a retomada ainda abre aba nova');
});

test('CP1: a retomada resolve o telefone no BANCO e navega', () => {
  const bloco = trecho(app, 'if (!sessao) return;', 'const handleSendMessage');
  assert.match(bloco, /abrirWhatsAppDoAnuncio\(item, retomada\.texto\)/);
});

test('CP1: a pendência do WhatsApp é criada com o ID do anúncio', () => {
  const bloco = trecho(
    app,
    'const handleWhatsAppDoBanner = () => {',
    'const abrirChatCom = (item: ListingItem) => {'
  );
  assert.match(bloco, /pendenciaDeWhatsApp\(anuncio\.id, texto\)/);
});

test('CP1: o banner acha o anúncio do pedido do comprador', () => {
  const bloco = trecho(
    app,
    'const handleWhatsAppDoBanner = () => {',
    'const abrirChatCom = (item: ListingItem) => {'
  );
  assert.match(bloco, /anuncioDoPedidoDoComprador\(listingsCombinados, maquina\)/);
  assert.match(bloco, /compradorSalvo\?\.maquina/);
});

test('CP1: sem vendedor para o pedido, o app AVISA (não abre nada)', () => {
  const bloco = trecho(
    app,
    'const handleWhatsAppDoBanner = () => {',
    'const abrirChatCom = (item: ListingItem) => {'
  );
  assert.match(bloco, /if \(!anuncio\) \{/);
  assert.match(bloco, /Ainda não há um vendedor para essa máquina/);
});

test('CP1: a leitura do telefone usa o banco, não o array do app', () => {
  // O telefone vem do hook do backend — que consulta o Supabase.
  assert.match(app, /backend\.telefoneDoVendedor\(anuncio\.id\)/);
});

test('CP1: o comprador falando com o VENDEDOR vai para o WhatsApp', () => {
  const bloco = trecho(
    app,
    'const handleStartChatForItem = (item: ListingItem) => {',
    'const textoDoContato = (item: ListingItem): string =>'
  );
  // O anúncio à venda: quem toca é o comprador, e ele quer o
  // WhatsApp daquele vendedor.
  assert.match(bloco, /item\.intent === 'sell'/);
  assert.match(bloco, /pendenciaDeWhatsApp\(item\.id, textoDoContato\(item\)\)/);
  assert.match(bloco, /abrirWhatsAppDoAnuncio\(item, textoDoContato\(item\)\)/);
});

test('CP1: o VENDEDOR falando com o COMPRADOR continua no chat', () => {
  const bloco = trecho(
    app,
    'const handleStartChatForItem = (item: ListingItem) => {',
    'const textoDoContato = (item: ListingItem): string =>'
  );
  // O telefone do comprador é PRIVADO: as notificações e os
  // pretendentes não podem virar uma ida ao WhatsApp.
  assert.match(bloco, /pendenciaDeChat\(item\.id\)/);
  assert.match(bloco, /abrirChatCom\(item\);/);
});

test('CP1: a mensagem no banco vai ANTES da navegação', () => {
  // A navegação cancelaria o envio em voo. Por isso o envio é
  // esperado.
  const bloco = trecho(
    app,
    'const abrirWhatsAppDoAnuncio = async (anuncio: ListingItem, texto: string) => {',
    'const handleWhatsAppDoBanner = () => {'
  );
  const i = bloco.indexOf('await backend.contatar(anuncio, texto);');
  const j = bloco.indexOf('window.location.href = urlDoWhatsApp(telefone, texto);');
  assert.ok(i > -1, 'a mensagem no banco não é enviada');
  assert.ok(j > i, 'a navegação acontece antes da mensagem no banco');
});

test('CP1: sem telefone no banco, a reserva é o chat do app', () => {
  const bloco = trecho(
    app,
    'const abrirWhatsAppDoAnuncio = async (anuncio: ListingItem, texto: string) => {',
    'const handleWhatsAppDoBanner = () => {'
  );
  assert.match(bloco, /if \(!telefone\) \{/);
  assert.match(bloco, /abrirChatCom\(anuncio\);/);
  assert.match(bloco, /não deixou telefone no anúncio/);
});

test('CP1: a URL do WhatsApp continua com o 55 e o texto codificado', () => {
  const url = urlDoWhatsApp('47996205669', 'Olá!');
  assert.ok(url.startsWith('https://wa.me/5547996205669?text='));
  assert.ok(url.includes(encodeURIComponent('Olá!')));
});

test('CP1: o serviço de contato não inventa telefone', () => {
  const semComentarios = contato
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(
    semComentarios,
    /47996205669|5547996205669/,
    'o serviço de contato tem telefone fixo'
  );
});

// ═══════════════════════════════════════════════════════════════════
// CORREÇÃO 2 — O CACHE ANTIGO
// ═══════════════════════════════════════════════════════════════════

test('CP2: a limpeza apaga o cache da vitrine', () => {
  const removidas: string[] = [];
  const ok = limparCacheAntigoDaVitrine({
    removeItem: (chave) => {
      removidas.push(chave);
    },
  });
  assert.equal(ok, true);
  assert.deepEqual(removidas, ['euquero_listings_v8']);
  assert.equal(CHAVE_CACHE_VITRINE, 'euquero_listings_v8');
});

test('CP2: sem armazenamento, não há erro — a limpeza só não acontece', () => {
  assert.equal(limparCacheAntigoDaVitrine(null), false);
});

test('CP2: um armazenamento que falha não derruba o app', () => {
  const ok = limparCacheAntigoDaVitrine({
    removeItem: () => {
      throw new Error('sem permissão');
    },
  });
  assert.equal(ok, false);
});

test('CP2: a App limpa o cache no CARREGAMENTO da Home', () => {
  const bloco = trecho(
    app,
    "const [listings, setListings] = useState<ListingItem[]>(() => {",
    'const [compradorSalvo'
  );
  assert.match(bloco, /limparCacheAntigoDaVitrine\(\)/);
});

test('CP2: a vitrine NÃO lê mais o cache antigo', () => {
  const bloco = trecho(
    app,
    "const [listings, setListings] = useState<ListingItem[]>(() => {",
    'const [compradorSalvo'
  );
  assert.doesNotMatch(
    bloco,
    /localStorage\.getItem\('euquero_listings_v8'\)/,
    'a vitrine ainda lê o cache antigo'
  );
});

test('CP2: a vitrine começa vazia', () => {
  const bloco = trecho(
    app,
    "const [listings, setListings] = useState<ListingItem[]>(() => {",
    'const [compradorSalvo'
  );
  assert.match(bloco, /return \[\];/);
});

/** Tira os comentários — eles citam o código antigo. */
function limparComentarios(texto: string): string {
  return texto.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}

/** Recorta um trecho do fonte entre duas âncoras. */
function trecho(fonte: string, inicio: string, fim: string): string {
  const i = fonte.indexOf(inicio);
  assert.ok(i > -1, `não achei o início: ${inicio}`);
  const j = fonte.indexOf(fim, i + inicio.length);
  assert.ok(j > -1, `não achei o fim: ${fim}`);
  return fonte.slice(i, j);
}
