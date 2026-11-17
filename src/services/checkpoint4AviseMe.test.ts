/**
 * CHECKPOINT 4 — O BOTÃO "AVISE-ME".
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE CHECKPOINT CORRIGE
 *
 * O estado vazio da vitrine tinha um botão "Ver todas as máquinas" e
 * mais nada. A pessoa que não achava o que procurava não tinha como
 * pedir para ser avisada: a busca morria com ela.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO TESTA
 *
 *  - o COMPORTAMENTO: a demanda montada, a chave de idempotência e a
 *    detecção de duplicata (funções puras);
 *  - a FIAÇÃO: o botão existe, chama o caminho certo, respeita o RLS
 *    e não grava duas vezes;
 *  - a VERDADE: o app só diz "avisado" quando gravou.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  demandaDoAviso,
  chaveDaBusca,
  buscaJaRegistrada,
} from './aviseMe';
import type { FiltrosAplicados } from './filtrosBusca';

const raiz = join(import.meta.dirname, '..', '..');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');

const filtros = (over: Partial<FiltrosAplicados> = {}): FiltrosAplicados => ({
  categoria: 'linha_amarela',
  termo: 'Sinomach SYM 855H',
  escopoGeo: 'so_sc',
  ufAlvo: 'SC',
  anoMin: null,
  horasMax: null,
  condicao: null,
  orcamentoMax: null,
  ...over,
});

// ═══════════════════════════════════════════════════════════════════
// A DEMANDA MONTADA
// ═══════════════════════════════════════════════════════════════════

test('DEMANDA: a intenção é COMPRAR (intent: buy)', () => {
  assert.equal(demandaDoAviso(filtros()).intent, 'buy');
});

test('DEMANDA: a marca e o modelo saem do termo que a pessoa escreveu', () => {
  const d = demandaDoAviso(filtros({ termo: 'Sinomach SYM 855H' }));
  assert.equal(d.brand, 'Sinomach');
  assert.equal(d.model, 'SYM 855H');
});

test('DEMANDA: a demanda leva os filtros da ficha', () => {
  const d = demandaDoAviso(
    filtros({ anoMin: 2015, horasMax: 8000, condicao: 'usado', orcamentoMax: 250000 })
  );
  assert.equal(d.minYear, 2015);
  assert.equal(d.maxHoursUsed, 8000);
  assert.equal(d.condition, 'usado');
  assert.equal(d.orcamentoMax, 250000);
});

test('DEMANDA: sem orçamento, o preço é NULL — nunca 0', () => {
  // Zero é um número falso: barra a busca e aparece como "R$ 0,00".
  const d = demandaDoAviso(filtros({ orcamentoMax: null }));
  assert.equal(d.price, null);
  assert.equal(d.orcamentoMax, null);
});

test('DEMANDA: sem escolha de condição, a procura é de QUALQUER condição', () => {
  assert.equal(demandaDoAviso(filtros({ condicao: null })).condition, 'indiferente');
});

test('DEMANDA: "só do meu estado" leva a UF alvo', () => {
  const d = demandaDoAviso(filtros({ escopoGeo: 'so_sc', ufAlvo: 'PR' }));
  assert.equal(d.locationState, 'PR');
  assert.equal(d.geoPreference, 'so_estado');
});

test('DEMANDA: "Brasil todo" NÃO leva UF', () => {
  const d = demandaDoAviso(filtros({ escopoGeo: 'brasil_todo', ufAlvo: 'SC' }));
  assert.equal(d.locationState, '');
  assert.equal(d.geoPreference, 'brasil_todo');
});

test('DEMANDA: sem escolha de alcance, a busca continua como estava', () => {
  const d = demandaDoAviso(filtros({ escopoGeo: null, ufAlto: undefined } as never));
  assert.equal(d.geoPreference, undefined);
});

test('DEMANDA: a demanda não tem foto (o "Avise-me" não é um anúncio)', () => {
  assert.deepEqual(demandaDoAviso(filtros()).images, []);
});

// ═══════════════════════════════════════════════════════════════════
// A PROTEÇÃO CONTRA DUPLICATA
// ═══════════════════════════════════════════════════════════════════

test('DUPLICATA: a mesma busca tem a MESMA chave', () => {
  const a = demandaDoAviso(filtros());
  const b = demandaDoAviso(filtros());
  assert.equal(chaveDaBusca(a), chaveDaBusca(b));
});

test('DUPLICATA: o título e a descrição NÃO entram na chave', () => {
  // Se entrassem, dois pedidos iguais pareceriam diferentes — e a
  // proteção não protegeria.
  const a = demandaDoAviso(filtros());
  const b = { ...demandaDoAviso(filtros()), title: 'Outro texto', description: 'Outro' };
  assert.equal(chaveDaBusca(a), chaveDaBusca(b));
});

test('DUPLICATA: mudou a máquina, mudou a chave', () => {
  assert.notEqual(
    chaveDaBusca(demandaDoAviso(filtros({ termo: 'Sinomach SYM 855H' }))),
    chaveDaBusca(demandaDoAviso(filtros({ termo: 'John Deere 790E' })))
  );
});

test('DUPLICATA: mudou o estado, mudou a chave', () => {
  assert.notEqual(
    chaveDaBusca(demandaDoAviso(filtros({ ufAlvo: 'SC' }))),
    chaveDaBusca(demandaDoAviso(filtros({ ufAlvo: 'PR' })))
  );
});

test('DUPLICATA: mudou o ano, mudou a chave', () => {
  assert.notEqual(
    chaveDaBusca(demandaDoAviso(filtros({ anoMin: 2015 }))),
    chaveDaBusca(demandaDoAviso(filtros({ anoMin: 2020 })))
  );
});

test('DUPLICATA: a busca já registrada é reconhecida', () => {
  const nova = demandaDoAviso(filtros());
  const existentes = [demandaDoAviso(filtros({ termo: 'John Deere 790E' })), nova];
  assert.equal(buscaJaRegistrada(nova, existentes), true);
});

test('DUPLICATA: uma busca diferente NÃO é considerada duplicata', () => {
  const nova = demandaDoAviso(filtros({ termo: 'Sinomach SYM 855H' }));
  const existentes = [demandaDoAviso(filtros({ termo: 'John Deere 790E' }))];
  assert.equal(buscaJaRegistrada(nova, existentes), false);
});

test('DUPLICATA: um anúncio À VENDA não conta como a mesma busca', () => {
  // Mesmo anunciante, mesma máquina, mas o intent é vender. Não é a
  // mesma procura — e não pode ser bloqueada.
  const nova = demandaDoAviso(filtros());
  const aVenda = { ...nova, intent: 'sell' };
  assert.equal(buscaJaRegistrada(nova, [aVenda]), false);
});

test('DUPLICATA: sem nenhuma demanda existente, nada está registrado', () => {
  assert.equal(buscaJaRegistrada(demandaDoAviso(filtros()), []), false);
});

// ═══════════════════════════════════════════════════════════════════
// A FIAÇÃO NA APP
// ═══════════════════════════════════════════════════════════════════

test('APP: o botão "Avise-me" existe no estado vazio', () => {
  assert.match(app, /Avise-me quando chegar/);
});

test('APP: o botão chama o caminho do "Avise-me"', () => {
  const bloco = trecho(app, 'CHECKPOINT 4 — o "Avise-me" do estado vazio.', 'CHECKPOINT 1 — o WhatsApp do banner');
  assert.match(bloco, /const handleAviseMe = async \(\) => \{/);
  // E o botão do estado vazio é o que chama esse caminho.
  const botao = trecho(app, 'CHECKPOINT 4 — o "Avise-me".', 'Ver todas as máquinas');
  assert.match(botao, /onClick=\{handleAviseMe\}/);
});

test('APP: a gravação passa por handleCreateBuyerListing', () => {
  // É o caminho que respeita o RLS. A App não escreve na tabela
  // `listings` por conta própria.
  const bloco = trecho(app, 'CHECKPOINT 4 — o "Avise-me" do estado vazio.', 'CHECKPOINT 1 — o WhatsApp do banner');
  assert.match(bloco, /handleCreateBuyerListing\(demanda\)/);
});

test('APP: sem sessão, o app PEDE LOGIN — não finge que gravou', () => {
  const bloco = trecho(app, 'CHECKPOINT 4 — o "Avise-me" do estado vazio.', 'CHECKPOINT 1 — o WhatsApp do banner');
  assert.match(bloco, /if \(!sessao\) \{/);
  assert.match(bloco, /pendenciaDeAvisoRef\.current = true;/);
  assert.match(bloco, /setAuthAberto\(true\)/);
});

test('APP: depois do login, o aviso é retomado sozinho', () => {
  const bloco = trecho(app, 'CHECKPOINT 4: o "Avise-me"', 'const handleSendMessage');
  assert.match(bloco, /pendenciaDeAvisoRef\.current = false;/);
  assert.match(bloco, /void handleAviseMe\(\);/);
});

test('APP: o toque duplicado é barrado (ref em curso)', () => {
  const bloco = trecho(app, 'CHECKPOINT 4 — o "Avise-me" do estado vazio.', 'CHECKPOINT 1 — o WhatsApp do banner');
  assert.match(bloco, /if \(avisoEmCursoRef\.current\) return;/);
  assert.match(bloco, /avisoEmCursoRef\.current = true;/);
  // E o ref é liberado SEMPRE — senão a segunda tentativa ficaria
  // presa para sempre.
  assert.match(bloco, /finally \{/);
  assert.match(bloco, /avisoEmCursoRef\.current = false;/);
});

test('APP: o botão mostra que está gravando (estado, não só ref)', () => {
  // O ref é a trava de verdade, mas um ref não redesenha a tela.
  // O estado é o que faz o botão aparecer como "Avissando…".
  const bloco = trecho(app, 'CHECKPOINT 4 — o "Avise-me" do estado vazio.', 'CHECKPOINT 1 — o WhatsApp do banner');
  assert.match(bloco, /setAvisoEmCurso\(true\);/);
  assert.match(bloco, /setAvisoEmCurso\(false\);/);
  const botao = trecho(app, 'CHECKPOINT 4 — o "Avise-me".', 'Ver todas as máquinas');
  assert.match(botao, /disabled=\{avisoEmCurso\}/);
  assert.match(botao, /avisoEmCurso \? 'Avissando…'/);
});

test('APP: a duplicata é conferida ANTES de gravar', () => {
  const bloco = trecho(app, 'CHECKPOINT 4 — o "Avise-me" do estado vazio.', 'CHECKPOINT 1 — o WhatsApp do banner');
  assert.match(bloco, /buscaJaRegistrada\(demanda, \[/);
  assert.match(bloco, /Você já está avisado para esta busca\./);
});

test('APP: o app só promete "avisado" depois de gravar', () => {
  const bloco = trecho(app, 'CHECKPOINT 4 — o "Avise-me" do estado vazio.', 'CHECKPOINT 1 — o WhatsApp do banner');
  // A mensagem de sucesso vem DEPOIS do `await` da gravação.
  const i = bloco.indexOf('const resultado = await handleCreateBuyerListing(demanda);');
  const j = bloco.indexOf('Pronto! Te avisamos assim que chegar');
  assert.ok(i > -1, 'a gravação não está no bloco');
  assert.ok(j > i, 'a mensagem de sucesso vem antes da gravação');
});

test('APP: o RLS não é contornado — não há insert direto na App', () => {
  const semComentarios = app
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
  assert.doesNotMatch(
    semComentarios,
    /from\('listings'\)\.insert|\.from\('listings'\)\s*\.insert/,
    'a App insere direto na tabela listings'
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
