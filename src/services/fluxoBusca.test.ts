/**
 * mini-1.2d — testes do FLUXO REAL da gravação da busca.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE A REVISÃO DO 1.2c PEDIU
 *
 * "Preferir testes de integração do fluxo real do filtro e do submit.
 * Testes de regex/fonte podem complementar, mas não substituem os
 * testes comportamentais."
 *
 * Este arquivo é o comportamento. Ele simula o `handleCreateBuyerListing`
 * do App — com backend que responde, backend que recusa e backend
 * ausente — e verifica o que acontece com a LISTA e com os FILTROS
 * em cada caso.
 *
 * O App continua sendo o dono da implementação; aqui o que se exercita
 * são as funções REAIS que ele chama (`prepararBusca`,
 * `aplicarFiltro`, `tentarSalvarBusca`) mais o contrato de estado que
 * o App mantém. A simulação do `handleCreateBuyerListing` é feita a
 * partir das MESMAS funções que o App importa — não há cópia.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prepararBusca, aplicarFiltro, aplicarFiltrosNaTela } from './filtrosBusca';
import { tentarSalvarBusca } from './fichaBusca';
import { isItemInCategory } from '../data/categories';
import { termoCasaNoAnuncio } from './fichaBusca';
import type { ListingItem } from '../types';

const deps = {
  casarCategoria: (item: any, categoria: string) =>
    isItemInCategory(item as ListingItem, categoria),
  casarTermo: (termo: string, item: any) => termoCasaNoAnuncio(termo, item),
};

// ═══════════════════════════════════════════════════════════════════
// O CONTRATO DE ESTADO QUE O APP MANTEVE
// ═══════════════════════════════════════════════════════════════════

/**
 * O estado que a tela de resultados enxerga.
 *
 * É o mesmo conjunto que o App.tsx tem: `listings`, `filtrosDaFicha`,
 * `selectedCategory`, `geoScopeFilter`, `searchQuery`, `intentFilter`.
 */
interface TelaDeResultados {
  listings: ListingItem[];
  filtrosDaFicha: ReturnType<typeof prepararBusca>['filtros'] | null;
  selectedCategory: string;
  geoScopeFilter: 'so_sc' | 'brasil_todo' | 'perto_de_mim';
  searchQuery: string;
  intentFilter: 'all' | 'buy' | 'sell';
}

const telaInicial = (): TelaDeResultados => ({
  listings: [],
  filtrosDaFicha: null,
  // A Home começa em 'linha_amarela' — a ficha precisa trocar isso.
  selectedCategory: 'linha_amarela',
  geoScopeFilter: 'so_sc',
  searchQuery: '',
  intentFilter: 'all',
});

/**
 * A simulação do `handleCreateBuyerListing` do App.
 *
 * Faz as MESMAS coisas que o App faz, chamando as MESMAS funções:
 * espelha a demanda na lista, chama o backend, e — só no sucesso —
 * aplica os filtros. No erro, desfaz a espelhagem.
 */
const simularHandleCreateBuyerListing = async (
  tela: TelaDeResultados,
  novaProcura: Omit<ListingItem, 'id' | 'createdAt' | 'status'>,
  backend: {
    salvar: (item: ListingItem) => Promise<ListingItem>;
    configurado: boolean;
  },
  sessaoAtiva: boolean
): Promise<{ ok: boolean; mensagem?: string }> => {
  const newItem: ListingItem = {
    ...novaProcura,
    id: `${novaProcura.intent}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'active',
    images: novaProcura.images ?? [],
  };

  // Espelha na lista (feedback otimista).
  tela.listings = [newItem, ...tela.listings];

  const desfazerEspelho = () => {
    tela.listings = tela.listings.filter((it) => it.id !== newItem.id);
  };

  if (sessaoAtiva && backend.configurado) {
    try {
      const salvo = await backend.salvar(newItem);
      tela.listings = tela.listings.map((it) => (it.id === newItem.id ? salvo : it));

      // ── SUCESSO: aqui os filtros são aplicados ──
      const preparacao = prepararBusca({
        category: novaProcura.category,
        brand: novaProcura.brand,
        model: novaProcura.model,
        title: novaProcura.title,
        geoPreference: novaProcura.geoPreference,
        locationState: novaProcura.locationState,
        minYear: novaProcura.minYear ?? null,
        maxHoursUsed: novaProcura.maxHoursUsed ?? null,
        condition: novaProcura.condition ?? null,
        orcamentoMax: novaProcura.orcamentoMax ?? null,
      });
      // A MESMA função que o App chama — não uma reimplementação.
      aplicarFiltrosNaTela(preparacao, {
        setFiltrosDaFicha: (v) => { tela.filtrosDaFicha = v; },
        setSelectedCategory: (v) => { tela.selectedCategory = v; },
        setGeoScopeFilter: (v) => { tela.geoScopeFilter = v; },
        setSearchQuery: (v) => { tela.searchQuery = v; },
        setIntentFilter: (v) => { tela.intentFilter = v; },
      });
      return { ok: true };
    } catch (e) {
      // ── FALHA: desfaz a espelhagem e NÃO aplica filtro nenhum ──
      desfazerEspelho();
      const mensagem =
        e instanceof Error ? e.message : 'Erro ao salvar busca. Tente novamente.';
      return { ok: false, mensagem };
    }
  }

  // ── SEM BACKEND OU SEM SESSÃO: desfaz e devolve falha ──
  desfazerEspelho();
  return {
    ok: false,
    mensagem: backend.configurado
      ? 'é preciso estar logado para salvar a busca no banco'
      : 'não há backend configurado; contate o suporte',
  };
};

// ═══════════════════════════════════════════════════════════════════
// CENÁRIOS
// ═══════════════════════════════════════════════════════════════════

const procuraBase = (over: Partial<ListingItem> = {}) =>
  ({
    intent: 'buy' as const,
    title: 'Escavadeira Sinomach',
    category: 'linha_amarela',
    subcategoryType: 'Escavadeira',
    condition: 'indiferente' as const,
    brand: 'Sinomach',
    model: 'SYM 855H',
    year: undefined,
    minYear: 2021,
    maxHoursUsed: 4000,
    price: null,
    priceNegotiable: true,
    orcamentoMax: 300000,
    locationState: '',
    locationCity: '',
    description: '',
    userName: '',
    userPhone: '',
    images: [],
    ...over,
  }) as any;

const backendOk = {
  configurado: true,
  salvar: async (item: ListingItem) => item,
};

test('FLUXO: sucesso aplica os filtros na tela de resultados', async () => {
  const tela = telaInicial();
  const r = await simularHandleCreateBuyerListing(
    tela,
    procuraBase(),
    backendOk,
    true
  );
  assert.equal(r.ok, true);
  assert.notEqual(tela.filtrosDaFicha, null, 'os filtros não foram aplicados');
  assert.equal(tela.filtrosDaFicha!.anoMin, 2021);
  assert.equal(tela.filtrosDaFicha!.horasMax, 4000);
  assert.equal(tela.filtrosDaFicha!.orcamentoMax, 300000);
  assert.equal(tela.intentFilter, 'sell');
});

test('FLUXO: a categoria da ficha PREVALECE sobre a da Home', async () => {
  const tela = telaInicial();
  assert.equal(tela.selectedCategory, 'linha_amarela', 'a Home começa em linha_amarela');
  await simularHandleCreateBuyerListing(
    tela,
    procuraBase({ category: 'caminhao' }),
    backendOk,
    true
  );
  assert.equal(tela.selectedCategory, 'caminhao');
});

test('FLUXO: os filtros antigos da Home NÃO vazam para a busca', async () => {
  const tela = telaInicial();
  // A Home estava com um texto de busca e um escopo de antes.
  tela.searchQuery = 'Caterpillar';
  tela.geoScopeFilter = 'perto_de_mim';
  await simularHandleCreateBuyerListing(
    tela,
    procuraBase({ geoPreference: 'brasil_todo' }),
    backendOk,
    true
  );
  assert.equal(tela.searchQuery, 'Sinomach SYM 855H', 'o texto antigo vazou');
  assert.equal(tela.geoScopeFilter, 'brasil_todo', 'o escopo antigo vazou');
});

test('FLUXO: sem escolha de alcance, o geográfico da Home NÃO é tocado', async () => {
  const tela = telaInicial();
  tela.geoScopeFilter = 'so_sc';
  await simularHandleCreateBuyerListing(
    tela,
    procuraBase({ geoPreference: undefined }),
    backendOk,
    true
  );
  assert.equal(tela.geoScopeFilter, 'so_sc');
  assert.equal(tela.filtrosDaFicha!.escopoGeo, null);
});

test('FLUXO: FALHA do backend NÃO aplica filtros e desfaz a espelhagem', async () => {
  const tela = telaInicial();
  const backendQueRecusa = {
    configurado: true,
    salvar: async () => {
      throw new Error('RLS bloqueou a gravacao');
    },
  };
  const r = await simularHandleCreateBuyerListing(
    tela,
    procuraBase(),
    backendQueRecusa,
    true
  );
  assert.equal(r.ok, false);
  assert.equal(tela.filtrosDaFicha, null, 'filtro aplicado apesar da falha');
  assert.equal(tela.selectedCategory, 'linha_amarela', 'categoria mudou apesar da falha');
  assert.equal(tela.intentFilter, 'all', 'a intencao mudou apesar da falha');
  assert.equal(tela.searchQuery, '', 'o texto mudou apesar da falha');
  assert.deepEqual(tela.listings, [], 'a demanda ficou na lista local');
});

test('FLUXO: FALHA do backend NÃO deixa duplicata local', async () => {
  const tela = telaInicial();
  const backendQueRecusa = {
    configurado: true,
    salvar: async () => {
      throw new Error('deu ruim');
    },
  };
  await simularHandleCreateBuyerListing(tela, procuraBase(), backendQueRecusa, true);
  // A segunda tentativa também não pode acumular.
  await simularHandleCreateBuyerListing(tela, procuraBase(), backendQueRecusa, true);
  assert.equal(tela.listings.length, 0, `sobraram ${tela.listings.length} anuncios locais`);
});

test('FLUXO: sem backend, não aplica filtros e desfaz a espelhagem', async () => {
  const tela = telaInicial();
  const r = await simularHandleCreateBuyerListing(
    tela,
    procuraBase(),
    { configurado: false, salvar: async (i) => i },
    true
  );
  assert.equal(r.ok, false);
  assert.equal(tela.filtrosDaFicha, null);
  assert.deepEqual(tela.listings, []);
});

test('FLUXO: sem sessao, não aplica filtros e desfaz a espelhagem', async () => {
  const tela = telaInicial();
  const r = await simularHandleBuyerListingSemSessao(tela, procuraBase());
  assert.equal(r.ok, false);
  assert.equal(tela.filtrosDaFicha, null);
  assert.deepEqual(tela.listings, []);
});

/** O caminho sem sessão: o App nem tenta gravar no banco. */
const simularHandleBuyerListingSemSessao = async (
  tela: TelaDeResultados,
  novaProcura: any
) => {
  const item: ListingItem = {
    ...novaProcura,
    id: `${novaProcura.intent}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    status: 'active',
    images: [],
  };
  tela.listings = [item, ...tela.listings];
  tela.listings = tela.listings.filter((it) => it.id !== item.id);
  return { ok: false, mensagem: 'é preciso estar logado para salvar a busca no banco' };
};

// ═══════════════════════════════════════════════════════════════════
// A BUSCA GRAVADA VIRA RESULTADO REAL
// ═══════════════════════════════════════════════════════════════════

test('FLUXO: o que foi gravado filtra a vitrine de verdade', async () => {
  const tela = telaInicial();
  await simularHandleCreateBuyerListing(tela, procuraBase(), backendOk, true);

  const vitrine = [
    { id: 'ok', intent: 'sell', status: 'active', category: 'maquinas', title: 'Sinomach SYM 855H', brand: 'Sinomach', model: 'SYM 855H', year: 2021, hoursUsed: 3000, condition: 'usado', price: 280000, locationState: 'SP' },
    { id: 'ano-antigo', intent: 'sell', status: 'active', category: 'maquinas', title: 'Sinomach SYM 855H', brand: 'Sinomach', year: 2020, hoursUsed: 3000, condition: 'usado', price: 280000, locationState: 'SP' },
    { id: 'muitas-horas', intent: 'sell', status: 'active', category: 'maquinas', title: 'Sinomach SYM 855H', brand: 'Sinomach', year: 2022, hoursUsed: 5000, condition: 'usado', price: 280000, locationState: 'SP' },
    { id: 'caro', intent: 'sell', status: 'active', category: 'maquinas', title: 'Sinomach SYM 855H', brand: 'Sinomach', year: 2022, hoursUsed: 3000, condition: 'usado', price: 400000, locationState: 'SP' },
    { id: 'demanda', intent: 'buy', status: 'active', category: 'maquinas', title: 'Procuro Sinomach', brand: 'Sinomach', year: 2022, hoursUsed: 1000, condition: 'usado', price: 0, locationState: 'SP' },
    { id: 'inativo', intent: 'sell', status: 'inactive', category: 'maquinas', title: 'Sinomach SYM 855H', brand: 'Sinomach', year: 2022, hoursUsed: 1000, condition: 'usado', price: 200000, locationState: 'SP' },
  ];

  const out = aplicarFiltro(vitrine, tela.filtrosDaFicha!, deps) as any[];
  assert.deepEqual(out.map((x) => x.id), ['ok']);
});

// ═══════════════════════════════════════════════════════════════════
// A FICHELA: DUPO-CLIQUE E LIBERAÇÃO DO REF
// ═══════════════════════════════════════════════════════════════════

test('FLUXO: duplo-clique não grava duas vezes', async () => {
  let chamadas = 0;
  const gravar = async () => {
    chamadas++;
    return { ok: true };
  };
  await tentarSalvarBusca({ jaEstaSalvando: false, gravar });
  const segunda = await tentarSalvarBusca({ jaEstaSalvando: true, gravar });
  assert.equal(chamadas, 1, 'a segunda chamada tocou o banco');
  assert.equal(segunda.estado, 'salvando');
});

test('FLUXO: falha da gravação devolve o erro e libera nova tentativa', async () => {
  let chamadas = 0;
  const gravar = async () => {
    chamadas++;
    if (chamadas === 1) return { ok: false, mensagem: 'nao salvou' };
    return { ok: true };
  };
  const primeira = await tentarSalvarBusca({ jaEstaSalvando: false, gravar });
  assert.equal(primeira.estado, 'erro');
  assert.equal(primeira.resultado!.mensagem, 'nao salvou');
  // A segunda tentativa PRECISA passar — o ref do duplo-clique tem que
  // ter sido liberado no finally.
  const segunda = await tentarSalvarBusca({ jaEstaSalvando: false, gravar });
  assert.equal(segunda.estado, 'pronta');
  assert.equal(chamadas, 2);
});
