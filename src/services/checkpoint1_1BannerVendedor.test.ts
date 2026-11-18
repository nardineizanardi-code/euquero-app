/**
 * CP1.1 — O BANNER SÓ FALA COM VENDEDOR.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O BUG
 *
 * O botão de match do banner comparava apenas TEXTO — título, marca,
 * modelo. E o texto de uma PROCURA de comprador é o mesmo texto do
 * pedido: o anúncio "Busca Sinomach SYM 855H" casa com o pedido
 * "Sinomach SYM 855H".
 *
 * Resultado: o banner apontava para a própria procura de quem
 * comprou. O WhatsApp ia para o errado, e o contato não existia.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A CORREÇÃO
 *
 * O comparador do banner só aceita anúncio de VENDEDOR:
 *
 *    intent === 'sell'  E  status === 'active'
 *
 * Fora disso, o anúncio não é candidato — nem se o texto casar.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO TESTA
 *
 * A regra, com o caso que a Zapia reprovou: um anúncio com
 * `intent: 'buy'` NUNCA é selecionado.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { anuncioDoPedidoDoComprador } from './pendenciaContato';
import type { ListingItem } from '../types';

const raiz = join(import.meta.dirname, '..', '..');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');

const anuncio = (over: Partial<ListingItem> = {}): ListingItem =>
  ({
    id: 'sell-1',
    intent: 'sell',
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

/** A procura do comprador: mesmo texto, intent errado. */
const procura = (over: Partial<ListingItem> = {}): ListingItem =>
  anuncio({
    id: 'buy-1',
    intent: 'buy',
    title: 'Busca Sinomach SYM 855H',
    brand: 'Sinomach',
    model: 'SYM 855H',
    subcategoryType: 'Escavadeira',
    ...over,
  });

// ═══════════════════════════════════════════════════════════════════
// O CASO QUE A ZAPIA REPROVOU
// ═══════════════════════════════════════════════════════════════════

test('CP1.1: uma PROCURA (intent buy) NUNCA é selecionada', () => {
  // O texto casa perfectly. O intent não. O banner não pode escolher
  // a procura.
  const achado = anuncioDoPedidoDoComprador(
    [procura()],
    'Sinomach SYM 855H'
  );
  assert.equal(achado, null, 'o banner escolheu uma PROCURA de comprador');
});

test('CP1.1: a procura não é escolhida NEM se vier antes do vendedor', () => {
  // A ordem do feed não pode decidir. A procura vem primeiro, e mesmo
  // assim o vendedor é o escolhido.
  const achado = anuncioDoPedidoDoComprador(
    [procura(), anuncio({ id: 'sell-9', title: 'Sinomach SYM 855H', brand: 'Sinomach', model: 'SYM 855H' })],
    'Sinomach SYM 855H'
  );
  assert.ok(achado);
  assert.equal(achado.id, 'sell-9');
  assert.equal(achado.intent, 'sell');
});

test('CP1.1: uma procura com o MESMO id de um vendedor não passa', () => {
  // Fail closed: sem `intent`/`status` válidos, não é candidato.
  const achado = anuncioDoPedidoDoComprador(
    [{ ...anuncio(), intent: 'buy' }],
    'Escavadeira CAT 320D'
  );
  assert.equal(achado, null);
});

// ═══════════════════════════════════════════════════════════════════
// O STATUS TAMBÉM CONTA
// ═══════════════════════════════════════════════════════════════════

test('CP1.1: um anúncio que NÃO está ativo não é selecionado', () => {
  const achado = anuncioDoPedidoDoComprador(
    [anuncio({ status: 'in_negotiation' })],
    'Escavadeira CAT 320D'
  );
  assert.equal(achado, null);
});

test('CP1.1: um anúncio pausado (closed) não é selecionado', () => {
  const achado = anuncioDoPedidoDoComprador(
    [anuncio({ status: 'closed', isPaused: true })],
    'Escavadeira CAT 320D'
  );
  assert.equal(achado, null);
});

// ═══════════════════════════════════════════════════════════════════
// O VENDEDOR CONTINUA SENDO ESCOLHIDO
// ═══════════════════════════════════════════════════════════════════

test('CP1.1: o vendedor ativo que serve o pedido é escolhido', () => {
  const achado = anuncioDoPedidoDoComprador(
    [anuncio()],
    'Escavadeira CAT 320D'
  );
  assert.ok(achado);
  assert.equal(achado.id, 'sell-1');
  assert.equal(achado.intent, 'sell');
  assert.equal(achado.status, 'active');
});

test('CP1.1: só o vendedor ATIVE serve — o in_negotiation não', () => {
  const achado = anuncioDoPedidoDoComprador(
    [anuncio({ status: 'in_negotiation' }), anuncio({ id: 'sell-2', status: 'active' })],
    'Escavadeira CAT 320D'
  );
  assert.ok(achado);
  assert.equal(achado.id, 'sell-2');
});

// ═══════════════════════════════════════════════════════════════════
// A MENSAGEM
// ═══════════════════════════════════════════════════════════════════

test('CP1.1: sem vendedor, o app diz a frase pedida', () => {
  const bloco = trecho(
    app,
    'const handleWhatsAppDoBanner = () => {',
    'const abrirChatCom = (item: ListingItem) => {'
  );
  assert.match(bloco, /if \(!anuncio\) \{/);
  assert.match(
    bloco,
    /Ainda não há um vendedor para essa máquina/,
    'a mensagem pedida não está no app'
  );
});

/** Recorta um trecho do fonte entre duas âncoras. */
function trecho(fonte: string, inicio: string, fim: string): string {
  const i = fonte.indexOf(inicio);
  assert.ok(i > -1, `não achei o início: ${inicio}`);
  const j = fonte.indexOf(fim, i + inicio.length);
  assert.ok(j > -1, `não achei o fim: ${fim}`);
  return fonte.slice(i, j);
}
