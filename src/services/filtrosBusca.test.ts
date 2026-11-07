/**
 * mini-1.2d — testes comportamentais dos filtros da busca do comprador.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ESTE ARQUIVO TESTA FUNÇÃO, NÃO FONTE
 *
 * A revisão do 1.2c pediu "testes de integração do fluxo real do
 * filtro e do submit". Aqui as funções REAIS são importadas do
 * serviço e exercitadas com anúncios reais-shaped. O que se verifica
 * é o comportamento: o que passa, o que é barrado, o que é gravado.
 *
 * O `fichaBuscaJsx.test.ts` (do 1.2c) continua existindo para
 * verificar a FIAÇÃO no JSX. Os dois juntos: comportamento + fiação.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  criteriosParaFiltros,
  aplicarFiltro,
  anuncioPassaNoFiltro,
  dicaDoEmptyState,
  checarAlcance,
  numeroOuNulo,
  ufValida,
  precoDaProcura,
  precoDaBusca,
  anoMinimoDaBusca,
  horasMaximasDaBusca,
  textoDoPreco,
  TEXTO_SEM_RESULTADO,
  MSG_SEM_UF,
  type CriteriosDaBusca,
} from './filtrosBusca';

import { isItemInCategory } from '../data/categories';
import { termoCasaNoAnuncio } from './fichaBusca';
import type { ListingItem } from '../types';

const deps = {
  casarCategoria: (item: any, categoria: string) =>
    isItemInCategory(item as ListingItem, categoria),
  casarTermo: (termo: string, item: any) => termoCasaNoAnuncio(termo, item),
};

/**
 * Um anúncio de venda ATIVO — o caso base de tudo.
 *
 * Todos os campos que os filtros olham estão aqui, com valores
 * plausíveis, para que cada teste mude UM campo só.
 */
const anuncio = (over: Record<string, any> = {}) =>
  ({
    id: 'a1',
    intent: 'sell',
    status: 'active',
    category: 'maquinas',
    title: 'Escavadeira Sinomach SYM 855H',
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: 2021,
    hoursUsed: 3000,
    condition: 'usado',
    price: 280000,
    locationState: 'SP',
    locationCity: 'Campinas',
    ...over,
  }) as any;

const filtros = (over: Partial<CriteriosDaBusca> = {}) =>
  criteriosParaFiltros(over as CriteriosDaBusca);

// ═══════════════════════════════════════════════════════════════════
// ITEM 2 — ANO MÍNIMO (>=)
// ═══════════════════════════════════════════════════════════════════

test('ITEM 2: ano 2021 aceita 2021, 2022 e 2023', () => {
  const f = filtros({ anoMin: 2021 });
  for (const ano of [2021, 2022, 2023]) {
    assert.equal(
      anuncioPassaNoFiltro(anuncio({ year: ano }), f, deps),
      true,
      `ano ${ano} deveria passar`
    );
  }
});

test('ITEM 2: ano 2021 rejeita 2020', () => {
  const f = filtros({ anoMin: 2021 });
  assert.equal(anuncioPassaNoFiltro(anuncio({ year: 2020 }), f, deps), false);
});

test('ITEM 2: o filtro é MÍNIMO, não exato (o 1.2c usava ==)', () => {
  const f = filtros({ anoMin: 2021 });
  // Este é exatamente o teste que distingue >= de ==.
  assert.equal(anuncioPassaNoFiltro(anuncio({ year: 2022 }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ year: 2023 }), f, deps), true);
});

test('ITEM 2: anúncio sem ano não satisfaz "a partir de X"', () => {
  const f = filtros({ anoMin: 2021 });
  assert.equal(anuncioPassaNoFiltro(anuncio({ year: null }), f, deps), false);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 1 — HORAS MÁXIMAS (<=)
// ═══════════════════════════════════════════════════════════════════

test('ITEM 1: até 4.000 horas aceita 3.000 e 4.000', () => {
  const f = filtros({ horasMax: 4000 });
  assert.equal(anuncioPassaNoFiltro(anuncio({ hoursUsed: 3000 }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ hoursUsed: 4000 }), f, deps), true);
});

test('ITEM 1: até 4.000 horas rejeita 4.001', () => {
  const f = filtros({ horasMax: 4000 });
  assert.equal(anuncioPassaNoFiltro(anuncio({ hoursUsed: 4001 }), f, deps), false);
});

test('ITEM 1: o filtro usa o horímetro ESTRUTURADO do anúncio', () => {
  // O texto do título pode ter horas; o filtro NÃO pode depender
  // disso. Aqui o título diz 9000 mas o campo estruturado diz 3000.
  const f = filtros({ horasMax: 4000 });
  const item = anuncio({ hoursUsed: 3000, title: 'Escavadeira 9000 horas' });
  assert.equal(anuncioPassaNoFiltro(item, f, deps), true);
});

test('ITEM 1: anúncio sem horímetro não satisfaz "até X horas"', () => {
  const f = filtros({ horasMax: 4000 });
  assert.equal(anuncioPassaNoFiltro(anuncio({ hoursUsed: null }), f, deps), false);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 6 — ANO E HORAS SÃO OPCIONAIS
// ═══════════════════════════════════════════════════════════════════

test('ITEM 6: ano vazio não filtra', () => {
  const f = filtros({ anoMin: null });
  assert.equal(f.anoMin, null);
  assert.equal(anuncioPassaNoFiltro(anuncio({ year: 1990 }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ year: 2025 }), f, deps), true);
});

test('ITEM 6: ano undefined é tratado como ausente', () => {
  assert.equal(filtros({ anoMin: undefined }).anoMin, null);
});

test('ITEM 6: ano NaN é tratado como ausente', () => {
  assert.equal(filtros({ anoMin: NaN }).anoMin, null);
});

test('ITEM 6: horas vazias não filtram', () => {
  const f = filtros({ horasMax: null });
  assert.equal(f.horasMax, null);
  assert.equal(anuncioPassaNoFiltro(anuncio({ hoursUsed: 99999 }), f, deps), true);
});

test('ITEM 6: horas undefined e NaN são ausentes', () => {
  assert.equal(filtros({ horasMax: undefined }).horasMax, null);
  assert.equal(filtros({ horasMax: NaN }).horasMax, null);
});

test('ITEM 6: NaN no ANÚNCIO também não quebra o filtro', () => {
  const f = filtros({ anoMin: 2021 });
  // Um ano NaN no anúncio não pode virar "passa" nem estourar.
  assert.equal(anuncioPassaNoFiltro(anuncio({ year: NaN }), f, deps), false);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 3 — ORÇAMENTO AUSENTE NÃO É ZERO
// ═══════════════════════════════════════════════════════════════════

test('ITEM 3: orçamento vazio é null, nunca 0', () => {
  assert.equal(precoDaProcura(''), null);
  assert.equal(precoDaProcura('   '), null);
  assert.equal(precoDaProcura(null), null);
  assert.equal(precoDaProcura(undefined), null);
});

test('ITEM 3: orçamento zero é tratado como ausente', () => {
  // "R$ 0" na prática é campo vazio. Zero como teto barra tudo.
  assert.equal(precoDaProcura('0'), null);
  assert.equal(precoDaProcura('R$ 0,00'), null);
  assert.equal(precoDaProcura(0), null);
});

test('ITEM 3: orçamento negativo é ausente', () => {
  assert.equal(precoDaProcura('-500'), null);
});

test('ITEM 3: orçamento preenchido vira número', () => {
  assert.equal(precoDaProcura('250000'), 250000);
  assert.equal(precoDaProcura('R$ 1.500,50'), 1500.5);
  assert.equal(precoDaProcura('R$ 250.000'), 250000);
});

test('ITEM 3: o texto do preço NUNCA mostra R$ 0,00 para procura sem preço', () => {
  const texto = textoDoPreco(null, { sufixo: 'R$ ' });
  assert.equal(texto, 'A combinar');
  assert.equal(/0,00/.test(texto), false, `apareceu zero: ${texto}`);
});

test('ITEM 3: o texto do preço mostra o valor quando existe', () => {
  assert.equal(textoDoPreco(250000, { sufixo: 'R$ ' }), 'R$ 250.000');
});

test('ITEM 3: orçamento ausente NÃO restringe resultados', () => {
  const f = filtros({ orcamentoMax: null });
  assert.equal(f.orcamentoMax, null);
  // Anúncio caríssimo passa, porque a pessoa não disse teto.
  assert.equal(anuncioPassaNoFiltro(anuncio({ price: 9999999 }), f, deps), true);
});

test('ITEM 3: orçamento preenchido barra anúncio acima do teto', () => {
  const f = filtros({ orcamentoMax: 200000 });
  assert.equal(anuncioPassaNoFiltro(anuncio({ price: 250000 }), f, deps), false);
  assert.equal(anuncioPassaNoFiltro(anuncio({ price: 180000 }), f, deps), true);
});

test('ITEM 3: preço 0 no ANÚNCIO DE VENDA significa "a combinar" e passa', () => {
  // Zero no anúncio de venda é um dado real (preço a combinar), não
  // uma ausência da procura. A regra do item 3 é sobre a PROCURA: 0
  // no ANÚNCIO é "preço a combinar", que é <= qualquer teto.
  const f = filtros({ orcamentoMax: 200000 });
  assert.equal(anuncioPassaNoFiltro(anuncio({ price: 0 }), f, deps), true);
  const semTeto = filtros({});
  assert.equal(anuncioPassaNoFiltro(anuncio({ price: 0 }), semTeto, deps), true);
});

test('ITEM 3: a PROCURA sem orçamento (preco null) não barra ninguém', () => {
  // Este é o outro lado: o teto da procura ausente não restringe.
  const f = filtros({ orcamentoMax: null });
  assert.equal(anuncioPassaNoFiltro(anuncio({ price: 9999999 }), f, deps), true);
  // Anúncio sem preço também passa: sem teto, não há comparação para
  // fazer. A regra do orçamento só existe quando a pessoa informou um.
  assert.equal(anuncioPassaNoFiltro(anuncio({ price: null }), f, deps), true);
});

test('ITEM 3: a distinção "sem orçamento" vs "orçamento zero" sobrevive à ficha', () => {
  // A ficha usa precoDaBusca; ela não pode transformar "vazio" em 0.
  assert.equal(precoDaBusca(''), null);
  assert.equal(precoDaBusca('500000'), 500000);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 4 — UF OBRIGATÓRIA PARA "SÓ DO MEU ESTADO"
// ═══════════════════════════════════════════════════════════════════

test('ITEM 4: "só do meu estado" SEM UF bloqueia', () => {
  const r = checarAlcance({ alcance: 'so_estado', ufDoPerfil: null, ufEscolhida: '' });
  assert.equal(r.ok, false);
  if (!r.ok) assert.equal(r.mensagem, MSG_SEM_UF);
});

test('ITEM 4: a mensagem é a que o Dono pediu', () => {
  assert.equal(MSG_SEM_UF, 'Não encontramos sua UF. Selecione o estado manualmente.');
});

test('ITEM 4: UF inválida bloqueia', () => {
  for (const uf of ['BR', 'XX', 'S', 'SANTACATARINA', 'ZZ']) {
    const r = checarAlcance({ alcance: 'so_estado', ufDoPerfil: uf, ufEscolhida: '' });
    assert.equal(r.ok, false, `UF inválida ${uf} passou`);
  }
});

test('ITEM 4: "BR" NÃO é uma UF', () => {
  assert.equal(ufValida('BR'), null);
  assert.equal(ufValida('SC'), 'SC');
  assert.equal(ufValida('sc'), 'SC');
});

test('ITEM 4: UF válida do PERFIL libera', () => {
  const r = checarAlcance({ alcance: 'so_estado', ufDoPerfil: 'SC', ufEscolhida: '' });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.uf, 'SC');
});

test('ITEM 4: UF válida ESCOLHIDA na ficha libera', () => {
  const r = checarAlcance({ alcance: 'so_estado', ufDoPerfil: null, ufEscolhida: 'PR' });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.uf, 'PR');
});

test('ITEM 4: "Brasil todo" NUNCA é assumido — precisa de escolha explícita', () => {
  const r = checarAlcance({ alcance: 'brasil_todo', ufDoPerfil: null, ufEscolhida: '' });
  assert.equal(r.ok, true);
  if (r.ok) assert.equal(r.uf, null, 'Brasil todo não carrega UF');
});

test('ITEM 4: sem escolha de alcance, não há restrição — e não bloqueia', () => {
  const r = checarAlcance({ alcance: null, ufDoPerfil: null, ufEscolhida: '' });
  assert.equal(r.ok, true);
});

test('ITEM 4: com "só do meu estado" + UF, o filtro restringe à UF escolhida', () => {
  const f = filtros({ alcance: 'so_estado', uf: 'PR' });
  assert.equal(f.escopoGeo, 'so_sc');
  assert.equal(f.ufAlvo, 'PR');
  assert.equal(anuncioPassaNoFiltro(anuncio({ locationState: 'PR' }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ locationState: 'SP' }), f, deps), false);
});

test('ITEM 4: "só do meu estado" SEM UF não vira "Brasil todo" no filtro', () => {
  const f = filtros({ alcance: 'so_estado', uf: null });
  assert.equal(f.escopoGeo, 'so_sc');
  assert.equal(f.ufAlvo, null, 'não pode inventar BR nem cair em brasil_todo');
  // E o aviso para a pessoa existe.
  assert.equal(checarAlcance({ alcance: 'so_estado' }).ok, false);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 5 — CONDIÇÃO EXPLÍCITA
// ═══════════════════════════════════════════════════════════════════

test('ITEM 5: sem escolha de condição, novas E usadas passam', () => {
  const f = filtros({ condicao: null });
  assert.equal(f.condicao, null);
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'novo' }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'usado' }), f, deps), true);
});

test('ITEM 5: escolher "Novo" restringe a novos', () => {
  const f = filtros({ condicao: 'novo' });
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'novo' }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'usado' }), f, deps), false);
});

test('ITEM 5: escolher "Usado" restringe a usados', () => {
  const f = filtros({ condicao: 'usado' });
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'usado' }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'novo' }), f, deps), false);
});

test('ITEM 5: "indiferente" (a escolha da ficha sem preferência) não restringe', () => {
  // A ficha manda 'indiferente' quando a pessoa não escolheu nada.
  const f = filtros({ condicao: 'indiferente' });
  assert.equal(f.condicao, null);
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'novo' }), f, deps), true);
  assert.equal(anuncioPassaNoFiltro(anuncio({ condition: 'usado' }), f, deps), true);
});

test('ITEM 5: condição em CAIXA ALTA é normalizada', () => {
  assert.equal(filtros({ condicao: 'NOVO' }).condicao, 'novo');
  assert.equal(filtros({ condicao: ' Usado ' }).condicao, 'usado');
});

test('ITEM 5: condição inventada não vira filtro', () => {
  assert.equal(filtros({ condicao: 'semi-novo' }).condicao, null);
});

// ═══════════════════════════════════════════════════════════════════
// ITEM 7 — STATUS E INTENÇÃO
// ═══════════════════════════════════════════════════════════════════

test('ITEM 7: só active + sell passa', () => {
  const f = filtros({});
  assert.equal(anuncioPassaNoFiltro(anuncio({ status: 'active', intent: 'sell' }), f, deps), true);
});

test('ITEM 7: inactive é rejeitado', () => {
  const f = filtros({});
  for (const status of ['inactive', 'closed', 'matched', 'in_negotiation']) {
    assert.equal(
      anuncioPassaNoFiltro(anuncio({ status }), f, deps),
      false,
      `status ${status} passou`
    );
  }
});

test('ITEM 7: status AUSENTE é rejeitado', () => {
  const f = filtros({});
  assert.equal(anuncioPassaNoFiltro(anuncio({ status: undefined }), f, deps), false);
  assert.equal(anuncioPassaNoFiltro(anuncio({ status: null }), f, deps), false);
});

test('ITEM 7: buy é rejeitado', () => {
  const f = filtros({});
  assert.equal(anuncioPassaNoFiltro(anuncio({ intent: 'buy' }), f, deps), false);
});

test('ITEM 7: intent AUSENTE NÃO é assumido como sell', () => {
  const f = filtros({});
  assert.equal(anuncioPassaNoFiltro(anuncio({ intent: undefined }), f, deps), false);
  assert.equal(anuncioPassaNoFiltro(anuncio({ intent: null }), f, deps), false);
});

test('ITEM 7: uma demanda de comprador NUNCA aparece como resultado', () => {
  const f = filtros({});
  const demanda = anuncio({ intent: 'buy', status: 'active', title: 'Procuro Sinomach' });
  const out = aplicarFiltro([demanda], f, deps);
  assert.deepEqual(out, []);
});

// ═══════════════════════════════════════════════════════════════════
// REGRESSÕES — CATEGORIA DA FICHA E FILTROS ANTIGOS
// ═══════════════════════════════════════════════════════════════════

test('REGRESSÃO: a categoria da ficha prevalencece sobre a da Home', () => {
  const f = filtros({ categoria: 'caminhao' });
  assert.equal(f.categoria, 'caminhao');
  assert.equal(
    anuncioPassaNoFiltro(anuncio({ category: 'caminhoes', title: 'Scania 450' }), f, deps),
    true
  );
  assert.equal(
    anuncioPassaNoFiltro(anuncio({ category: 'agro', title: 'Trator John Deere' }), f, deps),
    false
  );
});

test('REGRESSÃO: a categoria vem SEMPRE da ficha, nunca vazia', () => {
  assert.equal(filtros({ categoria: '' }).categoria, 'linha_amarela');
  assert.equal(filtros({ categoria: null }).categoria, 'linha_amarela');
});

test('REGRESSÃO: o termo por modelo acha (o bug do 1.1)', () => {
  const f = filtros({ termo: 'Sinomach' });
  assert.equal(
    anuncioPassaNoFiltro(
      anuncio({ brand: 'Sinomach', model: 'SYM 855H', title: 'Sinomach SYM 855H' }),
      f,
      deps
    ),
    true
  );
  assert.equal(
    anuncioPassaNoFiltro(anuncio({ brand: 'Volvo', model: 'EC220', title: 'Volvo EC220' }), f, deps),
    false
  );
});

// ═══════════════════════════════════════════════════════════════════
// CENÁRIO COMPLETO
// ═══════════════════════════════════════════════════════════════════

test('CENÁRIO: Sinomach, Brasil todo, a partir de 2021, até 4.000h, até R$300k', () => {
  const f = filtros({
    categoria: 'linha_amarela',
    termo: 'Sinomach',
    alcance: 'brasil_todo',
    anoMin: 2021,
    horasMax: 4000,
    orcamentoMax: 300000,
    condicao: null,
  });
  const vitrine = [
    anuncio({ id: 'ok', brand: 'Sinomach', title: 'Sinomach 855H', year: 2021, hoursUsed: 3000, price: 280000, locationState: 'SP' }),
    anuncio({ id: 'ano-antigo', brand: 'Sinomach', title: 'Sinomach 855H', year: 2020, hoursUsed: 3000, price: 280000 }),
    anuncio({ id: 'muitas-horas', brand: 'Sinomach', title: 'Sinomach 855H', year: 2022, hoursUsed: 5000, price: 280000 }),
    anuncio({ id: 'caro', brand: 'Sinomach', title: 'Sinomach 855H', year: 2022, hoursUsed: 3000, price: 400000 }),
    anuncio({ id: 'nova', brand: 'Sinomach', title: 'Sinomach 855H', year: 2022, hoursUsed: 3000, price: 280000, condition: 'novo' }),
    anuncio({ id: 'demanda', brand: 'Sinomach', title: 'Sinomach 855H', intent: 'buy', year: 2022, hoursUsed: 3000, price: 280000 }),
    anuncio({ id: 'inativo', brand: 'Sinomach', title: 'Sinomach 855H', status: 'inactive', year: 2022, hoursUsed: 3000, price: 280000 }),
  ];
  const out = aplicarFiltro(vitrine, f, deps) as any[];
  assert.deepEqual(out.map((x) => x.id), ['ok', 'nova']);
});

// ═══════════════════════════════════════════════════════════════════
// HELPERS DE LEITURA DA FICHA
// ═══════════════════════════════════════════════════════════════════

test('HELPER: numeroOuNulo entende "4.200h" e "R$ 1.500,50"', () => {
  assert.equal(numeroOuNulo('4.200h'), 4200);
  assert.equal(numeroOuNulo('4200 horas'), 4200);
  assert.equal(numeroOuNulo('R$ 1.500,50'), 1500.5);
  assert.equal(numeroOuNulo(''), null);
  assert.equal(numeroOuNulo('abc'), null);
  assert.equal(numeroOuNulo(NaN), null);
});

test('HELPER: anoMinimoDaBusca pega o primeiro ano', () => {
  assert.equal(anoMinimoDaBusca('2021'), 2021);
  assert.equal(anoMinimoDaBusca('a partir de 2021'), 2021);
  assert.equal(anoMinimoDaBusca('2021/2022'), 2021);
  assert.equal(anoMinimoDaBusca(''), null);
  assert.equal(anoMinimoDaBusca('sem data'), null);
});

test('HELPER: horasMaximasDaBusca normaliza e trata zero como ausente', () => {
  assert.equal(horasMaximasDaBusca('4.200h'), 4200);
  assert.equal(horasMaximasDaBusca('4000'), 4000);
  assert.equal(horasMaximasDaBusca(''), null);
  assert.equal(horasMaximasDaBusca('0'), null);
});

test('HELPER: a dica do empty state cita as barreiras novas', () => {
  const d = dicaDoEmptyState(filtros({ anoMin: 2021, horasMax: 4000 }));
  assert.match(d, /a partir de 2021/);
  assert.match(d, /mais horas/);
});

test('EMPTY STATE: o texto é o que o Dono pediu', () => {
  assert.equal(TEXTO_SEM_RESULTADO, 'Nenhuma máquina encontrada com esses critérios');
});

// ═══════════════════════════════════════════════════════════════════
// A LEITURA DO BANCO — a procura sem orçamento NÃO volta como 0
// ═══════════════════════════════════════════════════════════════════

test('BANCO: a procura sem orçamento volta como null, não 0', async () => {
  // A coluna `price` é `not null default 0`, então a procura sem
  // orçamento é gravada como 0. Se o read devolvesse 0, a tela voltaria
  // a mostrar "R$ 0,00" — exatamente o que o item 3 elimina.
  const { publicRowToItem } = await import('./productService');
  const linha = {
    id: 'p1',
    intent: 'buy',
    title: 'Procuro Sinomach',
    category: 'maquinas',
    subcategory_type: 'Escavadeira',
    condition: 'indiferente',
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: null,
    year_min: 2021,
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
  };
  const item = publicRowToItem(linha as any) as any;
  assert.equal(item.price, null, 'a procura sem orçamento voltou com preço 0');
});

test('BANCO: o anúncio de VENDA com preço 0 continua 0 (a combinar)', async () => {
  // Zero no anúncio de venda é um dado real, não uma ausência.
  const { publicRowToItem } = await import('./productService');
  const base = {
    id: 'v1',
    intent: 'sell',
    title: 'Vendo',
    category: 'maquinas',
    subcategory_type: 'Escavadeira',
    condition: 'usado',
    brand: null,
    model: null,
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
  };
  const item = publicRowToItem(base as any) as any;
  assert.equal(item.price, 0);
});
