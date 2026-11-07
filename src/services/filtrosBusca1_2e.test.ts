/**
 * mini-1.2e — testes comportamentais dos quatro pontos corrigidos.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE A REVISÃO DO 1.2d ACHOU
 *
 *  1. PREÇO — cards mostravam "R$ 0,00" para preço 0 ou null.
 *  2. PERSISTÊNCIA — `minYear`/`maxHoursUsed` se perdiam ao gravar:
 *     a ficha mandava, o insert lia `item.year`/`item.hoursUsed`.
 *  3. UF — com UF INVÁLIDA no perfil, o seletor ficava escondido e o
 *     submit ficava bloqueado: a pessoa ficava presa.
 *  4. AFROUXAR — a condição do botão exigia orçamento E outro
 *     filtro, então "só ano" e "só horas" não mostravam o botão.
 *
 * Aqui são testadas as FUNÇÕES REAIS: o mapeamento do backend, a
 * leitura, a formatação do preço, a regra de UF e a limpeza de
 * filtros. Os testes de fonte (filtrosBuscaJsx.test.ts) complementam.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  textoDoPreco,
  precoDoCard,
  ufValida,
  ufDoPerfilValida,
  precisaSelecionarUf,
  ufEfetivaDaBusca,
  checarAlcance,
  MSG_SEM_UF,
  filtrosAfrouxaveisAtivos,
  rotuloAfrouxar,
  afrouxarFiltros,
  calcularAfrouxamento,
  criteriosParaFiltros,
  aplicarFiltro,
  type FiltrosAplicados,
  type FiltrosAfrouxaveis,
} from './filtrosBusca';
import { isItemInCategory } from '../data/categories';
import { termoCasaNoAnuncio } from './fichaBusca';
import type { ListingItem } from '../types';

const deps = {
  casarCategoria: (item: any, categoria: string) =>
    isItemInCategory(item as ListingItem, categoria),
  casarTermo: (termo: string, item: any) => termoCasaNoAnuncio(termo, item),
};

const filtros = (over: any = {}) => criteriosParaFiltros(over);

// ═══════════════════════════════════════════════════════════════════
// ITEM 1 — PREÇO AUSENTE VIRA "A COMBINAR"
// ═══════════════════════════════════════════════════════════════════

test('ITEM 1: price null vira "A combinar"', () => {
  assert.equal(textoDoPreco(null), 'A combinar');
  assert.equal(precoDoCard(null, { sufixo: 'R$ ' }), 'A combinar');
});

test('ITEM 1: price 0 vira "A combinar"', () => {
  // Zero num anúncio de venda é "a combinar" — é um dado, não um erro.
  assert.equal(textoDoPreco(0), 'A combinar');
  assert.equal(precoDoCard(0, { sufixo: 'R$ ' }), 'A combinar');
});

test('ITEM 1: preço positivo continua formatado', () => {
  assert.equal(textoDoPreco(250000, { sufixo: 'R$ ' }), 'R$ 250.000');
  assert.equal(precoDoCard(250000, { sufixo: 'R$ ' }), 'R$ 250.000');
  assert.equal(precoDoCard(250000, { sufixo: 'Até R$ ' }), 'Até R$ 250.000');
});

test('ITEM 1: o sufixo some junto com o preço ausente', () => {
  // "Até R$ A combinar" seria pior que "A combinar".
  assert.equal(precoDoCard(null, { sufixo: 'Até R$ ' }), 'A combinar');
  assert.equal(precoDoCard(0, { sufixo: 'Até R$ ' }), 'A combinar');
});

test('ITEM 1: nenhum card mostra "R$ 0,00" para procura sem orçamento', () => {
  const casos: (number | null | undefined)[] = [null, 0, undefined, NaN];
  for (const preco of casos) {
    const texto = precoDoCard(preco, { sufixo: 'R$ ' });
    assert.equal(/0,00/.test(texto), false, `apareceu zero: ${texto}`);
    assert.equal(texto, 'A combinar');
  }
});

test('ITEM 1: NaN e undefined também são "A combinar"', () => {
  assert.equal(textoDoPreco(NaN), 'A combinar');
  assert.equal(textoDoPreco(undefined), 'A combinar');
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 2 — PERSISTÊNCIA DE minYear E maxHoursUsed
// ═══════════════════════════════════════════════════════════════════

/** Uma linha do banco, no formato que o backend devolve. */
const linhaDoBanco = (over: Record<string, any> = {}) =>
  ({
    id: 'x1',
    intent: 'buy',
    title: 'Procuro Sinomach',
    category: 'maquinas',
    subcategory_type: 'Escavadeira',
    condition: 'indiferente',
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: null,
    year_min: null,
    year_max: null,
    hours_used: null,
    mileage_km: null,
    power_hp: null,
    price: 0,
    price_negotiable: true,
    budget_range: null,
    accepts_trade: false,
    location_state: null,
    location_city: '',
    description: '',
    images: null,
    video_url: null,
    owner_id: 'u1',
    cpf: null,
    user_phone: null,
    pix_key: null,
    tier: null,
    badge: null,
    highlight_days: null,
    has_verified_video: false,
    urgency: 'imediata',
    geo_preference: null,
    status: 'active',
    is_paused: false,
    created_at: '2026-10-18T00:00:00Z',
    ...over,
  }) as any;

test('ITEM 2: a PROCURA grava minYear na coluna year', async () => {
  const { itemToPublicRow } = await import('./productService');
  const row = itemToPublicRow({
    intent: 'buy',
    title: 'Procuro',
    category: 'maquinas',
    subcategoryType: 'Escavadeira',
    condition: 'indiferente',
    brand: 'Sinomach',
    model: 'SYM 855H',
    minYear: 2021,
    maxHoursUsed: 4000,
    price: null,
    priceNegotiable: true,
    locationState: 'SC',
    locationCity: '',
    description: '',
    images: [],
    userName: '',
    userPhone: '',
  } as any);
  assert.equal(row.year, 2021, 'minYear não foi gravado em year');
  assert.equal(row.hours_used, 4000, 'maxHoursUsed não foi gravado em hours_used');
});

test('ITEM 2: a PROCURA volta com minYear e maxHoursUsed', async () => {
  const { publicRowToItem } = await import('./productService');
  const item = publicRowToItem(linhaDoBanco({ year: 2021, hours_used: 4000 })) as any;
  assert.equal(item.minYear, 2021, 'a procura não recuperou o ano mínimo');
  assert.equal(item.maxHoursUsed, 4000, 'a procura não recuperou o teto de horas');
  // E o `year`/`hoursUsed` de VENDA não devem vir preenchidos numa
  // procura — senão a ficha e o filtro leriam o limite como se fosse
  // a especificação da máquina.
  assert.equal(item.year, undefined);
  assert.equal(item.hoursUsed, undefined);
});

test('ITEM 2: o ANÚNCIO DE VENDA mantém year e hours_used como dados reais', async () => {
  const { publicRowToItem, itemToPublicRow } = await import('./productService');
  const item = publicRowToItem(
    linhaDoBanco({ intent: 'sell', year: 2019, hours_used: 4200 })
  ) as any;
  assert.equal(item.year, 2019, 'o ano da máquina foi perdido');
  assert.equal(item.hoursUsed, 4200, 'as horas reais foram perdidas');
  assert.equal(item.minYear, undefined);
  assert.equal(item.maxHoursUsed, undefined);

  const row = itemToPublicRow({
    intent: 'sell',
    title: 'Vendo',
    category: 'maquinas',
    subcategoryType: 'Escavadeira',
    condition: 'usado',
    brand: 'CAT',
    model: '320D',
    year: 2019,
    hoursUsed: 4200,
    price: 500000,
    priceNegotiable: true,
    locationState: 'SP',
    locationCity: 'Paulínia',
    description: '',
    images: [],
    userName: '',
    userPhone: '',
  } as any);
  assert.equal(row.year, 2019);
  assert.equal(row.hours_used, 4200);
});

test('ITEM 2: a leitura PRIVADA (RLS) tem a mesma semântica', async () => {
  const { privateRowToItem } = await import('./productService');
  const compra = privateRowToItem(linhaDoBanco({ year: 2021, hours_used: 4000 })) as any;
  assert.equal(compra.minYear, 2021);
  assert.equal(compra.maxHoursUsed, 4000);
  assert.equal(compra.year, undefined);

  const venda = privateRowToItem(
    linhaDoBanco({ intent: 'sell', year: 2019, hours_used: 4200 })
  ) as any;
  assert.equal(venda.year, 2019);
  assert.equal(venda.hoursUsed, 4200);
});

test('ITEM 2: a procura relida ainda filtra por ano mínimo e horas máximas', async () => {
  // O teste que fecha o ciclo: gravar -> reler -> filtrar.
  const { publicRowToItem } = await import('./productService');
  const relida = publicRowToItem(
    linhaDoBanco({ year: 2021, hours_used: 4000 })
  ) as any;

  const f = criteriosParaFiltros({
    categoria: 'linha_amarela',
    anoMin: relida.minYear,
    horasMax: relida.maxHoursUsed,
  });
  assert.equal(f.anoMin, 2021);
  assert.equal(f.horasMax, 4000);

  const vitrine = [
    { id: 'ok', intent: 'sell', status: 'active', category: 'maquinas', title: 'X', year: 2021, hoursUsed: 4000 },
    { id: 'antigo', intent: 'sell', status: 'active', category: 'maquinas', title: 'X', year: 2020, hoursUsed: 3000 },
    { id: 'cansado', intent: 'sell', status: 'active', category: 'maquinas', title: 'X', year: 2022, hoursUsed: 4001 },
  ];
  const out = aplicarFiltro(vitrine, f, deps) as any[];
  assert.deepEqual(out.map((x) => x.id), ['ok']);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 3 — UF INVÁLIDA NO PERFIL
// ═══════════════════════════════════════════════════════════════════

test('ITEM 3: perfil SEM UF + "só do meu estado" mostra o seletor', () => {
  assert.equal(
    precisaSelecionarUf({ alcance: 'so_estado', ufDoPerfil: null }),
    true
  );
  assert.equal(
    precisaSelecionarUf({ alcance: 'so_estado', ufDoPerfil: '' }),
    true
  );
});

test('ITEM 3: perfil com UF INVÁLIDA também mostra o seletor', () => {
  // Era este o bug: `!ufPadrao` só pegava o vazio. Com "XX", o
  // seletor ficava escondido e o submit bloqueado.
  for (const uf of ['XX', 'BR', 'S', 'Santa Catarina', 'ZZ']) {
    assert.equal(
      precisaSelecinarUfSeguro(uf),
      true,
      `UF inválida ${uf} escondeu o seletor`
    );
  }
});

/** Wrapper para deixar a intenção explícita no teste. */
const precisaSelecinarUfSeguro = (uf: string | null | undefined): boolean =>
  precisaSelecionarUf({ alcance: 'so_estado', ufDoPerfil: uf });

test('ITEM 3: perfil com UF VÁLIDA esconde o seletor', () => {
  for (const uf of ['SC', 'sc', 'PR', 'SP']) {
    assert.equal(
      precisaSelecinarUfSeguro(uf),
      false,
      `UF válida ${uf} mostrou o seletor à toa`
    );
  }
});

test('ITEM 3: "Brasil todo" nunca mostra o seletor de UF', () => {
  assert.equal(
    precisaSelecionarUf({ alcance: 'brasil_todo', ufDoPerfil: null }),
    false
  );
});

test('ITEM 3: sem escolha de alcance, o seletor não aparece', () => {
  assert.equal(
    precisaSelecionarUf({ alcance: null, ufDoPerfil: null }),
    false
  );
});

test('ITEM 3: o submit é BLOQUEADO sem UF válida', () => {
  const r = checarAlcance({ alcance: 'so_estado', ufDoPerfil: 'XX', ufEscolhida: '' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.mensagem, MSG_SEM_UF);
});

test('ITEM 3: depois de escolher uma UF válida, o submit é permitido', () => {
  const r = checarAlcance({ alcance: 'so_estado', ufDoPerfil: 'XX', ufEscolhida: 'PR' });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.uf, 'PR');
});

test('ITEM 3: a UF escolhida é a que vale quando a do perfil é inválida', () => {
  assert.equal(ufEfetivaDaBusca({ ufDoPerfil: 'XX', ufEscolhida: 'PR' }), 'PR');
  assert.equal(ufEfetivaDaBusca({ ufDoPerfil: 'SC', ufEscolhida: 'PR' }), 'SC');
  assert.equal(ufEfetivaDaBusca({ ufDoPerfil: 'XX', ufEscolhida: '' }), null);
});

test('ITEM 3: "Brasil todo" só por escolha explícita', () => {
  const r = checarAlcance({ alcance: 'brasil_todo', ufDoPerfil: 'XX', ufEscolhida: '' });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.uf, null, 'Brasil todo não pode carregar UF');
});

test('ITEM 3: depois de escolher a UF, os resultados ficam restritos a ela', () => {
  const f = filtros({ alcance: 'so_estado', uf: 'PR' });
  assert.equal(f.ufAlvo, 'PR');
  const anuncio = (uf: string) =>
    ({ intent: 'sell', status: 'active', category: 'maquinas', title: 'X', locationState: uf });
  assert.equal(aplicarFiltro([anuncio('PR')], f, deps).length, 1);
  assert.equal(aplicarFiltro([anuncio('SP')], f, deps).length, 0);
});

test('ITEM 3: ufValida rejeita as 27+1 inválidas', () => {
  assert.equal(ufValida('BR'), null);
  assert.equal(ufValida('XX'), null);
  assert.equal(ufValida('SC'), 'SC');
  assert.equal(ufDoPerfilValida('sc'), 'SC');
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 4 — AFROUXAR FILTROS
// ═══════════════════════════════════════════════════════════════════

test('ITEM 4: só ano ativo → o botão aparece e limpa o ano', () => {
  const f = filtros({ anoMin: 2021 });
  const r = calcularAfrouxamento(f);
  assert.ok(r, 'o botão não apareceu com só ano ativo');
  assert.equal(r!.rotulo, 'Afrouxar ano');
  assert.deepEqual(r!.removidos, ['ano']);
  assert.equal(r!.filtros.anoMin, null);
});

test('ITEM 4: só horas ativa → o botão aparece e limpa as horas', () => {
  const f = filtros({ horasMax: 4000 });
  const r = calcularAfrouxamento(f);
  assert.ok(r, 'o botão não apareceu com só horas ativa');
  assert.equal(r!.rotulo, 'Afrouxar horas');
  assert.deepEqual(r!.removidos, ['horas']);
  assert.equal(r!.filtros.horasMax, null);
});

test('ITEM 4: só orçamento ativo → o botão aparece e limpa o orçamento', () => {
  const f = filtros({ orcamentoMax: 300000 });
  const r = calcularAfrouxamento(f);
  assert.ok(r, 'o botão não apareceu com só orçamento ativo');
  assert.equal(r!.rotulo, 'Afrouxar orçamento');
  assert.deepEqual(r!.removidos, ['orcamento']);
  assert.equal(r!.filtros.orcamentoMax, null);
});

test('ITEM 4: ano + horas → rótulo com "e"', () => {
  const r = calcularAfrouxamento(filtros({ anoMin: 2021, horasMax: 4000 }))!;
  assert.equal(r.rotulo, 'Afrouxar ano e horas');
  assert.deepEqual(r.removidos, ['ano', 'horas']);
});

test('ITEM 4: ano + horas + orçamento → rótulo com as três', () => {
  const r = calcularAfrouxamento(
    filtros({ anoMin: 2021, horasMax: 4000, orcamentoMax: 300000 })
  )!;
  assert.equal(r.rotulo, 'Afrouxar ano, horas e orçamento');
  assert.deepEqual(r.removidos, ['ano', 'horas', 'orcamento']);
});

test('ITEM 4: cada combinação de dois — e só o que o rótulo diz sai', () => {
  const combos: [any[], FiltrosAfrouxaveis[]][] = [
    [[{ anoMin: 2021 }, { horasMax: 4000 }], ['ano', 'horas']],
    [[{ anoMin: 2021 }, { orcamentoMax: 100 }], ['ano', 'orcamento']],
    [[{ horasMax: 4000 }, { orcamentoMax: 100 }], ['horas', 'orcamento']],
  ];
  for (const [partes, esperado] of combos) {
    const f = filtros(Object.assign({}, ...partes));
    const r = calcularAfrouxamento(f)!;
    assert.deepEqual(r.removidos, esperado);
    // O rótulo vai para a tela: "orçamento" com acento.
    const nomes: Record<string, string> = {
      ano: 'ano',
      horas: 'horas',
      orcamento: 'orçamento',
    };
    assert.equal(
      r.rotulo,
      `Afrouxar ${nomes[esperado[0]]} e ${nomes[esperado[1]]}`
    );
    // O que NÃO está no rótulo continua como estava. Só olhamos as
    // chaves que ESTAVAM ativas — as outras já eram null.
    const chaves: [keyof FiltrosAplicados, 'ano' | 'horas' | 'orcamento'][] = [
      ['anoMin', 'ano'],
      ['horasMax', 'horas'],
      ['orcamentoMax', 'orcamento'],
    ];
    for (const [chave, nome] of chaves) {
      const estavaAtivo = (f as any)[chave] !== null;
      if (estavaAtivo && !esperado.includes(nome)) {
        assert.notEqual(
          r.filtros[chave],
          null,
          `${chave} foi limpo sem estar no rótulo`
        );
      }
    }
  }
});

test('ITEM 4: nenhum dos três ativo → o botão NÃO aparece', () => {
  assert.equal(calcularAfrouxamento(filtros({})), null);
  assert.equal(calcularAfrouxamento(filtros({ termo: 'Sinomach' })), null);
  assert.equal(calcularAfrouxamento(filtros({ alcance: 'brasil_todo' })), null);
});

test('ITEM 4: afrouxar NÃO limpa categoria, marca/modelo, alcance ou condição', () => {
  const f = filtros({
    categoria: 'caminhao',
    termo: 'Scania',
    alcance: 'so_estado',
    uf: 'PR',
    condicao: 'novo',
    anoMin: 2021,
    horasMax: 4000,
    orcamentoMax: 300000,
  });
  const r = calcularAfrouxamento(f)!;
  assert.equal(r.filtros.categoria, 'caminhao');
  assert.equal(r.filtros.termo, 'Scania');
  assert.equal(r.filtros.escopoGeo, 'so_sc');
  assert.equal(r.filtros.ufAlvo, 'PR');
  assert.equal(r.filtros.condicao, 'novo');
});

test('ITEM 4: afrouxarFiltros remove só o que foi pedido', () => {
  const f = filtros({ anoMin: 2021, horasMax: 4000 });
  const r = afrouxarFiltros(f, ['ano']);
  assert.equal(r.anoMin, null);
  assert.equal(r.horasMax, 4000, 'as horas foram limpas sem estar no rótulo');
});

test('ITEM 4: o rótulo tem acentuação correta', () => {
  const r = calcularAfrouxamento(filtros({ orcamentoMax: 100 }))!;
  assert.equal(r.rotulo, 'Afrouxar orçamento');
  assert.equal(/orcamento(?![\u00e0-\u00ff])/.test(r.rotulo), false, 'faltou o acento');
});

test('ITEM 4: os filtros ativos são detectados corretamente', () => {
  assert.deepEqual(filtrosAfrouxaveisAtivos(filtros({})), []);
  assert.deepEqual(filtrosAfrouxaveisAtivos(filtros({ anoMin: 2021 })), ['ano']);
  assert.deepEqual(
    filtrosAfrouxaveisAtivos(filtros({ anoMin: 2021, horasMax: 4000 })),
    ['ano', 'horas']
  );
});

test('ITEM 4: o rótulo de cada combinação é o esperado', () => {
  assert.equal(rotuloAfrouxar(filtros({ anoMin: 1 })), 'Afrouxar ano');
  assert.equal(rotuloAfrouxar(filtros({ horasMax: 1 })), 'Afrouxar horas');
  assert.equal(rotuloAfrouxar(filtros({ orcamentoMax: 1 })), 'Afrouxar orçamento');
  assert.equal(
    rotuloAfrouxar(filtros({ anoMin: 1, horasMax: 1 })),
    'Afrouxar ano e horas'
  );
  assert.equal(
    rotuloAfrouxar(filtros({ anoMin: 1, orcamentoMax: 1 })),
    'Afrouxar ano e orçamento'
  );
  assert.equal(
    rotuloAfrouxar(filtros({ horasMax: 1, orcamentoMax: 1 })),
    'Afrouxar horas e orçamento'
  );
  assert.equal(
    rotuloAfrouxar(filtros({ anoMin: 1, horasMax: 1, orcamentoMax: 1 })),
    'Afrouxar ano, horas e orçamento'
  );
  assert.equal(rotuloAfrouxar(filtros({})), '');
});

// ═══════════════════════════════════════════════════════════════════
// REGRESSÃO — O QUE NÃO PODE QUEBRAR
// ═══════════════════════════════════════════════════════════════════

test('REGRESSÃO: a procura sem orçamento volta do banco como null', async () => {
  const { publicRowToItem } = await import('./productService');
  const item = publicRowToItem(linhaDoBanco({ price: 0 })) as any;
  assert.equal(item.price, null, 'a procura voltou com preço 0');
});

test('REGRESSÃO: o anúncio de venda com preço 0 continua 0', async () => {
  const { publicRowToItem } = await import('./productService');
  const item = publicRowToItem(linhaDoBanco({ intent: 'sell', price: 0 })) as any;
  assert.equal(item.price, 0, 'o "a combinar" do vendedor virou null');
});

test('REGRESSÃO: o insert mantém 0 quando o preço da procura é null', async () => {
  // A coluna é `not null default 0` — o insert não pode mandar null.
  const { itemToPublicRow } = await import('./productService');
  const row = itemToPublicRow({
    intent: 'buy',
    title: 'Procuro',
    category: 'maquinas',
    subcategoryType: 'Escavadeira',
    condition: 'indiferente',
    brand: 'Sinomach',
    model: '',
    minYear: 2021,
    maxHoursUsed: 4000,
    price: null,
    priceNegotiable: true,
    locationState: 'SC',
    locationCity: '',
    description: '',
    images: [],
    userName: '',
    userPhone: '',
  } as any);
  assert.equal(row.price, 0);
  assert.equal(row.year, 2021);
  assert.equal(row.hours_used, 4000);
});
