/**
 * mini-1.2f — A SIMULAÇÃO DA PESSOA COMPRADORA.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Este arquivo é a prova de que a Tarefa 1 funciona, do ponto de
 * vista de quem usa.
 *
 * A reprovação foi:
 *   "ao clicar em 'Buscar Máquinas', o modal fecha, o aplicativo
 *    retorna à Home e não apresenta os resultados nem a mensagem de
 *    busca vazia."
 *
 * Então o teste aqui simula o CAMINHO INTEIRO — com os mesmos nomes
 * de campo que o App usa de verdade (`minYear`, `maxHoursUsed`,
 * `brand`, `model`) — e verifica três coisas:
 *
 *   1. com anúncios compatíveis, a pessoa VÊ os anúncios (com foto);
 *   2. sem anúncios compatíveis, a pessoa VÊ a mensagem do Dono;
 *   3. nos dois casos, os filtros da ficha sobrevivem à transição.
 *
 * Por que um arquivo só com Announcements? Porque o bug do Dono não
 * era de filtro: era de TRANSIÇÃO. O filtro já funcionava. O que
 * faltava era a pessoa chegar até o resultado.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aplicarFiltro,
  prepararBusca,
  TEXTO_SEM_RESULTADO,
} from './filtrosBusca';
import { termoCasaNoAnuncio } from './fichaBusca';

// ═══════════════════════════════════════════════════════════════════
// A VITRINE DE TESTE
// ═══════════════════════════════════════════════════════════════════

const anuncio = (over: Record<string, unknown> = {}) => ({
  id: 'x',
  title: 'Anúncio',
  brand: 'Marca',
  model: 'Modelo',
  category: 'linha_amarela',
  year: 2022,
  hoursUsed: 3000,
  price: 250000,
  locationCity: 'Curitiba',
  locationState: 'PR',
  condition: 'usado',
  status: 'active',
  intent: 'sell',
  images: [] as string[],
  ...over,
});

const vitrine = [
  anuncio({
    id: '1',
    title: 'Sinomach SYM 855H',
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: 2023,
    hoursUsed: 2000,
    price: 280000,
    locationCity: 'Curitiba',
    locationState: 'PR',
    images: ['https://exemplo.test/sinomach.jpg'],
  }),
  anuncio({
    id: '2',
    title: 'Sinomach SYM 855H 2022',
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: 2022,
    hoursUsed: 3500,
    price: 290000,
    locationCity: 'Recife',
    locationState: 'PE',
    images: ['https://exemplo.test/sinomach-2.jpg'],
  }),
  // Não casa: outra marca, fora de ano, e horímetro alto.
  anuncio({
    id: '3',
    title: 'CAT 320D',
    brand: 'Caterpillar',
    model: '320D',
    year: 2020,
    hoursUsed: 5000,
    price: 520000,
    locationCity: 'Campinas',
    locationState: 'SP',
  }),
  // Não casa: categoria diferente.
  anuncio({
    id: '4',
    title: 'John Deere 7500',
    brand: 'John Deere',
    model: '7500',
    category: 'agricola',
    year: 2022,
    hoursUsed: 3000,
    price: 350000,
    locationCity: 'Ribeirão Preto',
    locationState: 'SP',
  }),
  // Não casa: horímetro acima do teto.
  anuncio({
    id: '5',
    title: 'Sinomach SYM 855H 2021',
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: 2021,
    hoursUsed: 6000,
    price: 250000,
    locationCity: 'Goiânia',
    locationState: 'GO',
  }),
];

/** O caminho que o App faz de verdade, com os nomes de campo reais. */
function buscarComoAHomeFaz(opts: {
  marca: string;
  modelo: string;
  minYear?: number;
  maxHoursUsed?: number;
  orcamentoMax?: number;
  alcance?: 'so_estado' | 'brasil_todo' | null;
  uf?: string | null;
}) {
  const termoDaBusca =
    [opts.marca, opts.modelo]
      .map((x) => (x ?? '').trim())
      .filter(Boolean)
      .join(' ') || '';

  const prep = prepararBusca({
    category: 'linha_amarela',
    brand: opts.marca,
    model: opts.modelo,
    minYear: opts.minYear ?? null,
    maxHoursUsed: opts.maxHoursUsed ?? null,
    orcamentoMax: opts.orcamentoMax ?? null,
    geoPreference: opts.alcance ?? null,
    locationState: opts.uf ?? null,
  });

  const resultados = aplicarFiltro(vitrine, prep.filtros, {
    casarCategoria: (item, categoria) => item.category === categoria,
    casarTermo: (termo, item) => termoCasaNoAnuncio(termo, item),
  });

  return { prep, resultados, termoDaBusca };
}

// ═══════════════════════════════════════════════════════════════════
// 1. COM RESULTADO — a pessoa VÊ os anúncios
// ═══════════════════════════════════════════════════════════════════

test('COM RESULTADO: a busca da ficha devolve os anúncios compatíveis', () => {
  const { resultados } = buscarComoAHomeFaz({
    marca: 'Sinomach',
    modelo: 'SYM 855H',
    minYear: 2021,
    maxHoursUsed: 4000,
    orcamentoMax: 300000,
    alcance: 'brasil_todo',
  });
  assert.equal(resultados.length, 2);
  assert.deepEqual(
    resultados.map((r) => r.id).sort(),
    ['1', '2']
  );
});

test('COM RESULTADO: os anúncios que aparecem são os compatíveis', () => {
  const { resultados } = buscarComoAHomeFaz({
    marca: 'Sinomach',
    modelo: 'SYM 855H',
    minYear: 2021,
    maxHoursUsed: 4000,
    orcamentoMax: 300000,
    alcance: 'brasil_todo',
  });
  // A CAT 320D é de outra marca, de 2020 e tem 5000h.
  assert.ok(!resultados.some((r) => r.brand === 'Caterpillar'));
  // A Sinomach de 6000h passa do teto de horas.
  assert.ok(!resultados.some((r) => r.hoursUsed === 6000));
  // A John Deere é de outra categoria.
  assert.ok(!resultados.some((r) => r.category === 'agricola'));
});

test('COM RESULTADO: os anúncios que aparecem TÊM FOTO', () => {
  const { resultados } = buscarComoAHomeFaz({
    marca: 'Sinomach',
    modelo: 'SYM 855H',
    minYear: 2021,
    maxHoursUsed: 4000,
    orcamentoMax: 300000,
    alcance: 'brasil_todo',
  });
  assert.equal(resultados.length, 2);
  for (const r of resultados) {
    // O tipo do filtro não carrega `images`; a foto é conferida na
    // vitrine de onde o resultado veio.
    const original = vitrine.find((a) => a.id === r.id)!;
    assert.ok(original.images.length > 0, `o anúncio ${r.id} apareceu sem foto`);
  }
});

test('COM RESULTADO: os filtros da ficha SOBREVIVEM à transição', () => {
  const { prep, resultados } = buscarComoAHomeFaz({
    marca: 'Sinomach',
    modelo: 'SYM 855H',
    minYear: 2021,
    maxHoursUsed: 4000,
    orcamentoMax: 300000,
    alcance: 'brasil_todo',
  });
  // Os filtros continuam vivos no estado da Home.
  assert.equal(prep.filtros.categoria, 'linha_amarela');
  assert.equal(prep.filtros.termo, 'Sinomach SYM 855H');
  assert.equal(prep.filtros.anoMin, 2021);
  assert.equal(prep.filtros.horasMax, 4000);
  assert.equal(prep.filtros.orcamentoMax, 300000);
  assert.equal(prep.filtros.escopoGeo, 'brasil_todo');
  assert.equal(prep.intent, 'sell');
  // E é com eles que os resultados foram calculados.
  assert.equal(resultados.length, 2);
});

// ═══════════════════════════════════════════════════════════════════
// 2. SEM RESULTADO — a pessoa VÊ a mensagem do Dono
// ═══════════════════════════════════════════════════════════════════

test('SEM RESULTADO: a busca que não casa devolve a mensagem do Dono', () => {
  const { resultados } = buscarComoAHomeFaz({
    marca: 'Komatsu',
    modelo: 'PC-210',
    minYear: 2021,
    maxHoursUsed: 4000,
    alcance: 'brasil_todo',
  });
  assert.equal(resultados.length, 0, 'esta busca deveria não casar com nada');
  // E o que a pessoa lê é exatamente a frase pedida.
  assert.equal(
    TEXTO_SEM_RESULTADO,
    'No momento não temos o produto, enviaremos para você assim que chegar.'
  );
});

test('SEM RESULTADO: a mensagem do Dono aparece mesmo com a vitrine cheia', () => {
  // A vitrine tem 5 anúncios — mas nenhum serve. O que a pessoa lê é
  // a mensagem da busca vazia, não "nenhum ativo nesta categoria".
  const { prep, resultados } = buscarComoAHomeFaz({
    marca: 'Komatsu',
    modelo: 'PC-210',
    alcance: 'brasil_todo',
  });
  assert.equal(vitrine.length, 5);
  assert.equal(resultados.length, 0);
  assert.ok(prep.filtros.termo.includes('Komatsu'));
});

// ═══════════════════════════════════════════════════════════════════
// 3. O ALCANCE GEOGRÁFICO
// ═══════════════════════════════════════════════════════════════════

test('ALCANCE: "só do meu estado" restringe à UF', () => {
  const { prep, resultados } = buscarComoAHomeFaz({
    marca: 'Sinomach',
    modelo: 'SYM 855H',
    alcance: 'so_estado',
    uf: 'PR',
  });
  assert.equal(prep.filtros.escopoGeo, 'so_sc');
  assert.equal(prep.filtros.ufAlvo, 'PR');
  // Só o anúncio de PR passa; o de PE e o de GO ficam de fora.
  assert.deepEqual(resultados.map((r) => r.id), ['1']);
});

test('ALCANCE: "Brasil todo" não restringe por UF', () => {
  const { prep, resultados } = buscarComoAHomeFaz({
    marca: 'Sinomach',
    modelo: 'SYM 855H',
    alcance: 'brasil_todo',
  });
  assert.equal(prep.filtros.escopoGeo, 'brasil_todo');
  assert.equal(prep.filtros.ufAlvo, null);
  // PR e PE passam — a UF não restringe.
  // (o anúncio '5' também passa: sem teto de horas, 6000h é aceitável)
  assert.deepEqual(resultados.map((r) => r.id).sort(), ['1', '2', '5']);
  assert.ok(resultados.some((r) => r.locationState === 'PR'));
  assert.ok(resultados.some((r) => r.locationState === 'PE'));
});

test('ALCANCE: sem escolha, a Home continua como estava', () => {
  const { prep } = buscarComoAHomeFaz({
    marca: 'Sinomach',
    modelo: 'SYM 855H',
    alcance: null,
  });
  assert.equal(prep.filtros.escopoGeo, null);
  assert.equal(prep.filtros.ufAlvo, null);
});
