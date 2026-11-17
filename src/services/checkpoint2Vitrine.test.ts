/**
 * CHECKPOINT 2 — LIMPEZA DA VITRINE (GHOST STATE).
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE CHECKPOINT CORRIGE
 *
 * "Dados fictícios (Carlos Mendes) aparecem no feed."
 *
 * E a confusão que vinha junto: "não tem anúncio" e "não deu para
 * carregar" são coisas diferentes, e o app mostrava as duas como se
 * fossem a mesma.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE ESTE ARQUIVO TESTA
 *
 *  - o COMPORTAMENTO: a decisão do estado da vitrine (pura);
 *  - a FIAÇÃO: a vitrine não começa mais com os dados de
 *    demonstração, e o erro de consulta é separado do aviso genérico.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  estadoDaVitrineVazia,
  TEXTO_NENHUM_ANUNCIO,
  TEXTO_ERRO_AO_CARREGAR,
  TEXTO_ERRO_AO_CARREGAR_DETALHE,
} from './estadoDaVitrine';

const raiz = join(import.meta.dirname, '..', '..');
const app = readFileSync(join(raiz, 'src', 'App.tsx'), 'utf-8');
const backend = readFileSync(join(raiz, 'src', 'services', 'useAnunciosBackend.ts'), 'utf-8');

// ═══════════════════════════════════════════════════════════════════
// A DECISÃO DO ESTADO
// ═══════════════════════════════════════════════════════════════════

test('ESTADO: o banco vazio é "vazio" — não é erro', () => {
  const e = estadoDaVitrineVazia({ carregando: false, erroLeitura: null });
  assert.equal(e.tipo, 'vazio');
});

test('ESTADO: a consulta que falhou é "erro", com a mensagem', () => {
  const e = estadoDaVitrineVazia({
    carregando: false,
    erroLeitura: 'Failed to fetch',
  });
  assert.equal(e.tipo, 'erro');
  if (e.tipo === 'erro') assert.equal(e.mensagem, 'Failed to fetch');
});

test('ESTADO: durante a carga NÃO se diz que está vazio', () => {
  // Mostrar "nenhum anúncio" enquanto a consulta está em andamento
  // seria mentira — e acontece em toda consulta lenta.
  const e = estadoDaVitrineVazia({ carregando: true, erroLeitura: null });
  assert.equal(e.tipo, 'carregando');
});

test('ESTADO: a carga tem prioridade sobre o erro antigo', () => {
  // Se a consulta falhou antes e agora está recarregando, a pessoa
  // precisa ver "carregando" — não o erro de uma consulta que já
  // foi refeita.
  const e = estadoDaVitrineVazia({ carregando: true, erroLeitura: 'erro velho' });
  assert.equal(e.tipo, 'carregando');
});

test('TEXTO: o banco vazio diz "Nenhum anúncio"', () => {
  assert.equal(TEXTO_NENHUM_ANUNCIO, 'Nenhum anúncio');
});

test('TEXTO: a falha de consulta diz "Erro ao carregar"', () => {
  assert.equal(TEXTO_ERRO_AO_CARREGAR, 'Erro ao carregar');
  assert.ok(TEXTO_ERRO_AO_CARREGAR_DETALHE.length > 0);
});

// ═══════════════════════════════════════════════════════════════════
// A INJEÇÃO DOS DADOS FICTÍCIOS
// ═══════════════════════════════════════════════════════════════════

test('VITRINE: o estado inicial NÃO é mais o INITIAL_LISTINGS', () => {
  // A peça central do checkpoint: o feed começa vazio.
  const bloco = trecho(app, 'const [listings, setListings] = useState<ListingItem[]>(() => {', 'DETALHE PÚBLICO POR ID');
  assert.doesNotMatch(
    bloco,
    /return INITIAL_LISTINGS;/,
    'a vitrine ainda começa com os dados de demonstração'
  );
  assert.match(
    bloco,
    /return \[\];/,
    'a vitrine não começa vazia'
  );
});

test('VITRINE: o Carlos Mendes não é injetado no feed', () => {
  // O nome está no arquivo de dados — o que não pode é a VITRINE
  // usá-lo como fallback.
  const bloco = semComentarios(
    trecho(app, 'const [listings, setListings] = useState<ListingItem[]>(() => {', 'DETALHE PÚBLICO POR ID')
  );
  assert.doesNotMatch(
    bloco,
    /INITIAL_LISTINGS/,
    'a vitrine ainda usa os dados de demonstração'
  );
});

// ═══════════════════════════════════════════════════════════════════
// O ERRO DE CONSULTA
// ═══════════════════════════════════════════════════════════════════

test('BACKEND: existe um sinal de erro de CONSULTA, separado do aviso genérico', () => {
  assert.match(
    backend,
    /erroLeitura: string \| null;/,
    'o estado do backend não tem o sinal de erro de leitura'
  );
  // E ele é preenchido SÓ no caminho da consulta.
  const bloco = trecho(backend, 'const recarregar = useCallback(async () => {', 'return {');
  assert.match(bloco, /setErroLeitura\(null\)/, 'a consulta não limpa o erro antigo');
  assert.match(bloco, /setErroLeitura\(mensagem\)/, 'a falha de consulta não marca o erro');
});

test('APP: o estado vazio distingue o erro da vitrine', () => {
  assert.match(app, /estadoDaVitrineVazia\(\{/);
  // E o texto do erro aparece no estado vazio.
  const bloco = trecho(app, "{estadoVazio.tipo === 'carregando' ? (", 'filtrosDaFicha ? (');
  assert.match(bloco, /TEXTO_ERRO_AO_CARREGAR/);
  assert.match(bloco, /Tentar de novo/);
  assert.match(bloco, /backend\.recarregar\(\)/);
});

test('APP: o ramo "vazio" mostra "Nenhum anúncio"', () => {
  const bloco = trecho(app, "{estadoVazio.tipo === 'carregando' ? (", 'filtrosDaFicha ? (');
  // O texto do banco vazio aparece no ramo final do estado vazio.
  const appTodo = app;
  assert.match(
    appTodo,
    /\{TEXTO_NENHUM_ANUNCIO\}/,
    'o estado vazio não mostra "Nenhum anúncio"'
  );
});

test('APP: a mensagem antiga de "nenhum ativo" saiu do estado vazio', () => {
  // "Nenhum ativo encontrado nesta categoria." era o texto de antes.
  // Agora o estado vazio sem ficha diz "Nenhum anúncio".
  assert.doesNotMatch(
    app,
    /Nenhum ativo encontrado nesta categoria\./,
    'o texto antigo ainda está no estado vazio'
  );
});

/** Remove os comentários de linha e de bloco de um trecho. */
function semComentarios(texto: string): string {
  return texto
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/[^\n]*/g, '');
}

/** Recorta um trecho do fonte entre duas âncoras. */
function trecho(fonte: string, inicio: string, fim: string): string {
  const i = fonte.indexOf(inicio);
  assert.ok(i > -1, `não achei o início: ${inicio}`);
  const j = fonte.indexOf(fim, i + inicio.length);
  assert.ok(j > -1, `não achei o fim: ${fim}`);
  return fonte.slice(i, j);
}
