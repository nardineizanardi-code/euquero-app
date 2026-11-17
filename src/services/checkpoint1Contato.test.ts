/**
 * CHECKPOINT 1 — BOTÃO DE CONTATO (WhatsApp).
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE CHECKPOINT CORRIGE
 *
 * "O Card chama o WhatsApp direto ignorando o login."
 *
 * E, junto com isso, o lado chato para a pessoa: quando ela tocava no
 * botão sem estar logada, aparecia a tela de login, ela criava a
 * conta… e nada acontecia. O app voltava para a Home e ela tinha que
 * achar o anúncio de novo e tocar no botão pela segunda vez.
 *
 * A correção: a ação fica REGISTRADA enquanto a pessoa entra. O que
 * fica guardado é o ID da máquina — não a máquina inteira — para que
 * a retomada use o anúncio como ele está agora.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO TESTA
 *
 *  - o COMPORTAMENTO: as funções de pendência e retomada (puras);
 *  - a FIAÇÃO: o App registra, retoma, e o banner não é mais um link
 *    que escapa do login.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  pendenciaDeChat,
  pendenciaDeWhatsApp,
  retomarPendenciaDeContato,
  urlDoWhatsApp,
} from './pendenciaContato';

const raiz = join(import.meta.dirname, '..', '..');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');

// ═══════════════════════════════════════════════════════════════════
// A PENDÊNCIA
// ═══════════════════════════════════════════════════════════════════

test('PENDÊNCIA: o chat guarda o ID da máquina', () => {
  const p = pendenciaDeChat('sell-42');
  assert.ok(p);
  assert.equal(p.tipo, 'chat');
  assert.equal(p.id, 'sell-42');
});

test('PENDÊNCIA: o ID em branco NÃO vira pendência', () => {
  // Uma ação sem ID não é retomável. Pendurar uma ação impossível
  // seria pior do que não pedir login.
  assert.equal(pendenciaDeChat(''), null);
  assert.equal(pendenciaDeChat('   '), null);
  assert.equal(pendenciaDeChat(null), null);
  assert.equal(pendenciaDeChat(undefined), null);
});

test('PENDÊNCIA: o WhatsApp guarda o telefone só com dígitos', () => {
  const p = pendenciaDeWhatsApp('(47) 99620-5669', 'Olá!');
  assert.ok(p);
  assert.equal(p.tipo, 'whatsapp');
  assert.equal(p.telefone, '47996205669');
  assert.equal(p.texto, 'Olá!');
});

test('PENDÊNCIA: WhatsApp sem telefone NÃO vira pendência', () => {
  assert.equal(pendenciaDeWhatsApp('', 'Olá'), null);
  assert.equal(pendenciaDeWhatsApp(null, 'Olá'), null);
});

// ═══════════════════════════════════════════════════════════════════
// A RETOMADA
// ═══════════════════════════════════════════════════════════════════

const feed = [{ id: 'sell-1' }, { id: 'sell-2' }];

test('RETOMADA: a máquina que existe no feed é retomada', () => {
  const r = retomarPendenciaDeContato({ tipo: 'chat', id: 'sell-2' }, feed);
  assert.ok(r);
  assert.equal(r.tipo, 'chat');
  assert.equal(r.id, 'sell-2');
});

test('RETOMADA: a máquina que SAIU do feed NÃO é retomada', () => {
  // O caso que evita a conversa errada: a pessoa ficou criando a
  // conta, o feed recarregou, a máquina não está mais no resultado.
  // Abrir a conversa de outra máquina seria pior do que não abrir.
  const r = retomarPendenciaDeContato({ tipo: 'chat', id: 'sell-99' }, feed);
  assert.equal(r, null);
});

test('RETOMADA: sem pendência, não há o que retomar', () => {
  assert.equal(retomarPendenciaDeContato(null, feed), null);
});

test('RETOMADA: o WhatsApp é retomado mesmo sem a lista', () => {
  // O número não depende do feed: ele continua válido.
  const r = retomarPendenciaDeContato(
    { tipo: 'whatsapp', telefone: '47996205669', texto: 'Olá!' },
    []
  );
  assert.ok(r);
  assert.equal(r.tipo, 'whatsapp');
});

test('URL: o WhatsApp sai com o 55 e o texto codificado', () => {
  const url = urlDoWhatsApp('47996205669', 'Olá, tudo bem?');
  assert.ok(url.startsWith('https://wa.me/5547996205669?text='));
  assert.ok(url.includes(encodeURIComponent('Olá, tudo bem?')));
});

// ═══════════════════════════════════════════════════════════════════
// A FIAÇÃO NO APP
// ═══════════════════════════════════════════════════════════════════

test('APP: sem sessão, o contato REGISTRA o ID da máquina', () => {
  const bloco = trecho(app, 'const handleStartChatForItem', 'const abrirChatCom');
  assert.match(
    bloco,
    /pendenciaDeChat\(item\.id\)/,
    'o ID da máquina não é registrado na pendência'
  );
  assert.match(
    bloco,
    /pendenciaDeContatoRef\.current = pendencia/,
    'a pendência não é guardada'
  );
  // E o login é pedido ANTES de qualquer efeito.
  const iGuarda = bloco.indexOf('if (!sessao) {');
  const iAbre = bloco.indexOf('abrirChatCom(item);');
  assert.ok(iGuarda > -1, 'não achei a guarda de sessão');
  assert.ok(iAbre > iGuarda, 'o chat abre antes da guarda de sessão');
});

test('APP: o banner do EloMatch NÃO é mais um link que escapa do login', () => {
  // Era um <a href="https://wa.me/...">: abria o WhatsApp direto,
  // sem olhar se a pessoa estava logada.
  const bloco = trecho(app, '{compradorSalvo && (', 'FEED VERTICAL ESTILO PERFIL');
  assert.doesNotMatch(
    bloco,
    /href="https:\/\/wa\.me/,
    'o banner ainda escapa do login por um link direto'
  );
  assert.match(
    bloco,
    /onClick={handleWhatsAppDoBanner}/,
    'o banner não passa pela trava'
  );
});

test('APP: o handler do banner também exige login', () => {
  const bloco = trecho(app, 'const handleWhatsAppDoBanner', 'const abrirChatCom');
  assert.match(bloco, /if \(!sessao\) \{/);
  assert.match(bloco, /pendenciaDeWhatsApp\(/);
  assert.match(bloco, /setAuthAberto\(true\)/);
});

test('APP: depois do login, a ação é retomada sozinha', () => {
  const bloco = trecho(
    app,
    'CHECKPOINT 1 + 4 — A RETOMADA depois do login.',
    '}, [sessao]);'
  );
  assert.match(
    bloco,
    /retomarPendenciaDeContato\(pendencia, listingsCombinados\)/,
    'a retomada não usa a função do serviço'
  );
  assert.match(bloco, /abrirChatCom\(item\)/, 'a conversa não abre sozinha');
  assert.match(
    bloco,
    /pendenciaDeContatoRef\.current = null/,
    'a pendência não é limpa depois de retomada'
  );
});

test('APP: a retomada NÃO passa pela trava de novo (não há laço)', () => {
  // Se a retomada chamasse `handleStartChatForItem`, o estado da
  // sessão ainda seria o velho (o `setSessao` não é síncrono) e a
  // tela de login abriria de novo — num laço.
  const bloco = trecho(
    app,
    'CHECKPOINT 1 + 4 — A RETOMADA depois do login.',
    '}, [sessao]);'
  );
  assert.doesNotMatch(
    bloco,
    /handleStartChatForItem\(/,
    'a retomada passa pela trava — a tela de login pode abrir em laço'
  );
});

test('APP: a retomada roda DEPOIS que a sessão mudou (sessão nova)', () => {
  // Este é o ponto do defeito que a Tarefa 4 expôs.
  //
  // No `onEntrou`, o `setSessao` ainda não tinha re-renderizado a
  // tela. As funções chamadas ali enxergavam a sessão ANTIGA — nula.
  // A conversa abria, mas a mensagem não ia para o banco, porque
  // `abrirChatCom` só envia quando há sessão.
  //
  // A retomada agora mora num effect que depende de `sessao`: ele
  // roda depois da re-renderização, com a sessão nova.
  const bloco = trecho(
    app,
    'CHECKPOINT 1 + 4 — A RETOMADA depois do login.',
    'const handleSendMessage'
  );
  assert.match(bloco, /useEffect\(\(\) => \{/, 'a retomada não é um effect');
  assert.match(bloco, /if \(!sessao\) return;/, 'a retomada roda sem sessão');
  assert.match(bloco, /\}, \[sessao\]\);/, 'a retomada não depende da sessão');

  // E o `onEntrou` NÃO retoma mais nada — ele só troca a sessão.
  const onEntrou = trecho(app, 'onEntrou={async () => {', 'const destino = destinoAposEntrar');
  assert.doesNotMatch(
    onEntrou,
    /retomarPendenciaDeContato\(/,
    'o onEntrou ainda retoma com a sessão velha'
  );
  assert.doesNotMatch(
    onEntrou,
    /abrirChatCom\(/,
    'o onEntrou ainda abre a conversa com a sessão velha'
  );
});

test('APP: o contato do card continua passando pela trava', () => {
  // O botão "Falar com Vendedor" do card chama `handleStartChatForItem`,
  // que é a trava. O outro (`abrirChatCom`) é o que a trava chama
  // DEPOIS da checagem.
  const bloco = trecho(app, '<AdCard', '/>');
  assert.match(
    bloco,
    /onConnectChat=\{\(it\) => handleStartChatForItem\(it\)\}/,
    'o card não passa pela trava de login'
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
