/**
 * CHECKPOINT 4 — O BOTÃO "AVISE-ME".
 *
 * ─────────────────────────────────────────────────────────────────────
 * O PROBLEMA
 *
 * O botão "Avise-me" do estado vazio não persistia a busca. A pessoa
 * fazia a busca, não achava nada, tocava em "Avise-me" — e a procura
 * não ficava registrada em lugar nenhum.
 *
 * ─────────────────────────────────────────────────────────────────────
 * DUAS COISAS DIFÍCEIS
 *
 * 1. O RLS. Gravar uma demanda no banco é escrever na tabela
 *    `listings`, e a política só deixa o dono escrever a linha dele.
 *    Sem sessão, a gravação é impossível — e o app não pode fingir
 *    que gravou. Por isso a gravação passa por
 *    `handleCreateBuyerListing`, que já sabe disso: sem sessão, a
 *    BUSCA acontece (a pessoa vê os anúncios) e a DEMANDA não é
 *    gravada.
 *
 * 2. A duplicata. Se a pessoa toca duas vezes, o banco não pode
 *    ficar com duas linhas iguais. A proteção tem duas camadas:
 *
 *    - o ref de "gravação em curso", que barra o segundo toque
 *      enquanto o primeiro está no ar;
 *    - a comparação com as demandas que JÁ existem, que barra o
 *      toque seguinte (quando o primeiro já terminou).
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE UMA FUNÇÃO PURA
 *
 * Porque a montagem da demanda e a comparação são regra de negócio,
 * e regra de negócio se testa sem DOM.
 */

import type { ConditionType } from '../types';
import type { FiltrosAplicados } from './filtrosBusca';
import { dividirMarcaModelo, tituloDaBusca } from './fichaBusca';

/** A demanda que o "Avise-me" grava. */
export interface DemandaDeAviso {
  intent: 'buy';
  title: string;
  category: string;
  subcategoryType: string;
  condition: ConditionType;
  brand: string;
  model: string;
  year?: number;
  minYear: number | null;
  maxHoursUsed: number | null;
  price: number | null;
  priceNegotiable: boolean;
  orcamentoMax: number | null;
  locationState: string;
  locationCity: string;
  description: string;
  userName: string;
  userPhone: string;
  urgency: 'imediata';
  geoPreference?: 'so_estado' | 'brasil_todo';
  acceptsTrade: boolean;
  images: string[];
}

/**
 * Monta a demanda a partir dos filtros que a ficha deixou.
 *
 * A marca e o modelo saem do termo — é o mesmo caminho que a ficha
 * usa (`dividirMarcaModelo`), para que a demanda gravada case com
 * a busca que a pessoa fez.
 */
export const demandaDoAviso = (filtros: FiltrosAplicados): DemandaDeAviso => {
  const termo = (filtros.termo ?? '').trim();
  const { brand, model } = dividirMarcaModelo(termo);

  // A etiqueta da máquina: o que a pessoa escreveu. Sem termo, a
  // categoria é a etiqueta.
  const etiqueta = termo || filtros.categoria;
  const subcategoryType = etiqueta.split(' ')[0]?.trim() ?? '';

  // O alcance: "só do meu estado" → a UF alvo; "Brasil todo" → sem
  // UF. Sem escolha → o app continua como está.
  const geoPreference =
    filtros.escopoGeo === 'brasil_todo'
      ? ('brasil_todo' as const)
      : filtros.escopoGeo === 'so_sc'
        ? ('so_estado' as const)
        : undefined;

  const locationState = filtros.escopoGeo === 'so_sc' ? (filtros.ufAlvo ?? '') : '';

  return {
    intent: 'buy',
    title: tituloDaBusca(etiqueta, ''),
    category: filtros.categoria,
    subcategoryType,
    // Sem escolha explícita, a procura é de "qualquer condição" — e
    // a vitrine mostra novas E usadas. É a mesma regra da ficha.
    condition: (filtros.condicao as ConditionType | null) ?? 'indiferente',
    brand,
    model,
    minYear: filtros.anoMin,
    maxHoursUsed: filtros.horasMax,
    // Preço ausente é NULL, nunca 0. Zero é um número falso: barra a
    // busca e aparece como "R$ 0,00".
    price: filtros.orcamentoMax,
    priceNegotiable: true,
    orcamentoMax: filtros.orcamentoMax,
    locationState,
    locationCity: '',
    description: `Procura: ${etiqueta}.`,
    userName: '',
    userPhone: '',
    urgency: 'imediata',
    geoPreference,
    acceptsTrade: false,
    images: [],
  };
};

/**
 * O que uma busca precisa ter para ser a MESMA busca.
 *
 * É a chave de idempotência: dois pedidos com a mesma chave são o
 * mesmo pedido, e o segundo não vira uma linha nova.
 */
export interface BuscaComparavel {
  intent?: string;
  category?: string;
  brand?: string | null;
  model?: string | null;
  locationState?: string | null;
  minYear?: number | null;
  maxHoursUsed?: number | null;
  condition?: string | null;
  orcamentoMax?: number | null;
  price?: number | null;
}

const norm = (v: string | null | undefined): string =>
  (v ?? '').trim().replace(/\s+/g, ' ').toLowerCase();

const num = (v: number | null | undefined): string =>
  typeof v === 'number' && Number.isFinite(v) ? String(v) : '';

/**
 * A chave de uma busca.
 *
 * Só o que faz a busca ser a mesma: categoria, máquina, onde, ano,
 * horas, condição e orçamento. O título e a descrição NÃO entram —
 * eles são texto de exibição, e incluí-los faria dois pedidos
 * iguais parecerem diferentes.
 */
export const chaveDaBusca = (b: BuscaComparavel): string =>
  [
    norm(b.intent),
    norm(b.category),
    norm(b.brand),
    norm(b.model),
    norm(b.locationState),
    num(b.minYear),
    num(b.maxHoursUsed),
    norm(b.condition),
    num(b.orcamentoMax ?? b.price),
  ].join('|');

/**
 * Esta busca já está registrada?
 *
 * @param nova        a busca que a pessoa está tentando salvar
 * @param existentes  as demandas que já existem (locais + do banco)
 */
export const buscaJaRegistrada = (
  nova: BuscaComparavel,
  existentes: readonly BuscaComparavel[]
): boolean => {
  const chave = chaveDaBusca(nova);
  return existentes.some((e) => {
    // Só a procura interessa: um anúncio à venda com a mesma
    // categoria não é a mesma busca.
    if (norm(e.intent) !== 'buy') return false;
    return chaveDaBusca(e) === chave;
  });
};
