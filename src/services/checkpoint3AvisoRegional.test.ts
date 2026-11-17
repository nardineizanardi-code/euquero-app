/**
 * CHECKPOINT 3 — AVISO REGIONAL DINÂMICO.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE CHECKPOINT CORRIGE
 *
 * O texto "Não achamos em Araquari/SC, mas achamos 3 em Joinville/SC
 * (30km de você)" estava chumbado na App. O número, a cidade e a
 * distância eram fixos — e a pessoa via um aviso sobre uma região que
 * não era a dela.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO TESTA
 *
 *  - o COMPORTAMENTO: a formatação do texto a partir do escopo que o
 *    motor já decidiu;
 *  - a FIAÇÃO: a App usa o texto dinâmico, e o texto chumbado sumiu;
 *  - a GUARDA: o motor regional e o Hero não foram tocados, e o
 *    formatador não virou uma nova fonte de dados.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  avisoRegionalMostra,
  tituloDoAvisoRegional,
  detalheDoAvisoRegional,
  rotuloDoBotaoRegional,
  termoDoBotaoRegional,
} from './avisoRegional';
import type { EscopoRegional } from './buscaConversacional';

const raiz = join(import.meta.dirname, '..', '..');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');
const aviso = readFileSync(join(raiz, 'src', 'services', 'avisoRegional.ts'), 'utf-8');
const motor = readFileSync(join(raiz, 'src', 'services', 'buscaConversacional.ts'), 'utf-8');
const hero = readFileSync(join(raiz, 'src', 'components', 'Hero.tsx'), 'utf-8');

const escopo = (over: Partial<EscopoRegional> = {}): EscopoRegional => ({
  uf: 'SC',
  nivel: 'regiao',
  estados: ['SC'],
  cidade: 'Joinville',
  naRegiao: 3,
  total: 3,
  ...over,
});

// ═══════════════════════════════════════════════════════════════════
// O AVISO APARECE
// ═══════════════════════════════════════════════════════════════════

test('AVISO: aparece quando a busca ficou na REGIÃO da pessoa', () => {
  assert.equal(avisoRegionalMostra(escopo()), true);
});

test('AVISO: NÃO aparece quando a busca subiu para os vizinhos', () => {
  // Quem avisa nesse caso é o `avisoDoEscopo` do motor.
  assert.equal(avisoRegionalMostra(escopo({ nivel: 'vizinhos' })), false);
});

test('AVISO: NÃO aparece quando a busca foi para o Brasil todo', () => {
  assert.equal(avisoRegionalMostra(escopo({ nivel: 'brasil' })), false);
});

test('AVISO: NÃO aparece sem escopo (nenhuma busca feita)', () => {
  assert.equal(avisoRegionalMostra(null), false);
});

test('AVISO: NÃO aparece com zero anúncios na região', () => {
  assert.equal(avisoRegionalMostra(escopo({ naRegiao: 0 })), false);
});

// ═══════════════════════════════════════════════════════════════════
// O TEXTO É DINÂMICO
// ═══════════════════════════════════════════════════════════════════

test('TEXTO: o título usa o número REAL que a busca achou', () => {
  assert.equal(
    tituloDoAvisoRegional(escopo({ naRegiao: 7, uf: 'PR' })),
    'Achamos 7 anúncios na região de PR'
  );
  // O 3 chumbado não volta.
  assert.notEqual(
    tituloDoAvisoRegional(escopo({ naRegiao: 7 })),
    tituloDoAvisoRegional(escopo({ naRegiao: 3 }))
  );
});

test('TEXTO: um anúncio só fala no singular', () => {
  assert.equal(
    tituloDoAvisoRegional(escopo({ naRegiao: 1 })),
    'Achamos 1 anúncio na região de SC'
  );
});

test('TEXTO: o detalhe cita a cidade da pessoa', () => {
  const d = detalheDoAvisoRegional(escopo({ cidade: 'Araquari' }));
  assert.ok(d);
  assert.ok(d.includes('Araquari'), 'o detalhe não cita a cidade da pessoa');
});

test('TEXTO: sem cidade, o detalhe NÃO inventa uma', () => {
  const d = detalheDoAvisoRegional(escopo({ cidade: '' }));
  assert.ok(d);
  assert.doesNotMatch(
    d,
    /Joinville|Araquari|Blumenau/,
    'o detalhe inventou uma cidade que a pessoa não tem'
  );
});

test('BOTÃO: o rótulo usa a cidade da pessoa', () => {
  assert.equal(
    rotuloDoBotaoRegional(escopo({ cidade: 'Araquari' })),
    'Ver em Araquari ➔'
  );
});

test('BOTÃO: sem cidade, o rótulo fala da REGIÃO (não de uma cidade)', () => {
  assert.equal(
    rotuloDoBotaoRegional(escopo({ cidade: '' })),
    'Ver na região de SC ➔'
  );
});

test('BOTÃO: sem cidade, o termo fica VAZIO (a UF não vira busca textual)', () => {
  // Escrever "SC" como termo transformaria o filtro de estado em
  // busca textual — e a pessoa perderia o que digitou.
  assert.equal(termoDoBotaoRegional(escopo({ cidade: '' })), '');
  assert.equal(termoDoBotaoRegional(escopo({ cidade: 'Araquari' })), 'Araquari');
});

test('TEXTO: sem escopo, nada é escrito', () => {
  assert.equal(tituloDoAvisoRegional(null), null);
  assert.equal(detalheDoAvisoRegional(null), null);
  assert.equal(rotuloDoBotaoRegional(null), null);
  assert.equal(termoDoBotaoRegional(null), '');
});

// ═══════════════════════════════════════════════════════════════════
// A FIAÇÃO NA APP
// ═══════════════════════════════════════════════════════════════════

test('APP: o texto chumbado da região sumiu', () => {
  const semComentarios = app
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(
    semComentarios,
    /Araquari\/SC, mas achamos 3 em Joinville\/SC/,
    'o aviso regional chumbado ainda está na App'
  );
  assert.doesNotMatch(
    semComentarios,
    /Ver em Joinville \(30km\)/,
    'o botão chumbado ainda está na App'
  );
});

test('APP: o aviso usa as funções dinâmicas', () => {
  const bloco = trecho(app, 'CHECKPOINT 3 — o aviso regional é DINÂMICO', 'CARD PRETO: PAINEL DO VENDEDOR');
  assert.match(bloco, /avisoRegionalMostra\(escopoRegional\)/);
  assert.match(bloco, /tituloDoAvisoRegional\(escopoRegional\)/);
  assert.match(bloco, /detalheDoAvisoRegional\(escopoRegional\)/);
  assert.match(bloco, /rotuloDoBotaoRegional\(escopoRegional\)/);
  assert.match(bloco, /termoDoBotaoRegional\(escopoRegional\)/);
});

test('APP: o aviso só aparece quando EXISTE escopo regional', () => {
  const bloco = trecho(app, 'CHECKPOINT 3 — o aviso regional é DINÂMICO', 'CARD PRETO: PAINEL DO VENDEDOR');
  assert.match(
    bloco,
    /\{avisoRegionalMostra\(escopoRegional\) && \(/,
    'o aviso aparece sem escopo regional'
  );
});

// ═══════════════════════════════════════════════════════════════════
// AS ÁREAS PROTEGIDAS
// ═══════════════════════════════════════════════════════════════════

test('GUARDA: o formatador NÃO é uma nova fonte de dados', () => {
  // Ele só formata o que o motor já decidiu. Não consulta o banco,
  // não lê o localStorage, não pede nada a ninguém.
  const semComentarios = aviso
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(semComentarios, /fetch\(/, 'o formatador consulta a rede');
  assert.doesNotMatch(semComentarios, /supabase/i, 'o formatador fala com o Supabase');
  assert.doesNotMatch(semComentarios, /localStorage/, 'o formatador lê o localStorage');
  assert.doesNotMatch(semComentarios, /listPublicListings|listMyListings/, 'o formatador lista anúncios');
});

test('GUARDA: o formatador usa o TIPO do motor, e não uma cópia', () => {
  assert.match(
    aviso,
    /import type \{ EscopoRegional \} from '\.\/buscaConversacional';/,
    'o formatador não usa o tipo do motor'
  );
});

test('GUARDA: o motor regional tem a regra da escada, intacta', () => {
  // O motor não foi tocado: a escada região → vizinhos → Brasil e o
  // aviso do motor continuam como estavam.
  assert.match(motor, /export const decidirEscopoRegional/);
  assert.match(motor, /export const avisoDoEscopo/);
  assert.match(motor, /if \(naRegiao >= minimo\)/);
  assert.match(motor, /if \(naRegiao \+ nosVizinhos >= minimo\)/);
});

test('GUARDA: a Home conversacional (Hero) não foi tocada', () => {
  // O Hero é área protegida: ele tem a fachada da busca. Este
  // checkpoint é do aviso, que fica DEPOIS da Home.
  assert.ok(hero.length > 0);
  assert.match(hero, /export const Hero/);
});

/** Recorta um trecho do fonte entre duas âncoras. */
function trecho(fonte: string, inicio: string, fim: string): string {
  const i = fonte.indexOf(inicio);
  assert.ok(i > -1, `não achei o início: ${inicio}`);
  const j = fonte.indexOf(fim, i + inicio.length);
  assert.ok(j > -1, `não achei o fim: ${fim}`);
  return fonte.slice(i, j);
}
