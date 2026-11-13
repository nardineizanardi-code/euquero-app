/**
 * ════════════════════════════════════════════════════════════════════════
 * A BUSCA CONVERSACIONAL DA HOME (Fase 1 — Tarefa 1.3)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Este módulo é o MOTOR da busca da Home. Ele é TEXTUAL: não há IA,
 * não há embedding, não há chamada de rede. Ele só faz duas coisas:
 *
 *   1. LÊ A FRASE — a pessoa escreve "Escavadeira 20 toneladas" e o
 *      motor entende que isso é uma escavadeira com 20 toneladas, e
 *      não uma busca literal pela frase inteira.
 *
 *   2. ESCOLHE O ALCANCE — a busca do comprador começa na região
 *      dele. Se a região não tem anúncio suficiente, ela abre para
 *      os estados vizinhos e, por último, para o Brasil todo.
 *
 * O porquê de tudo estar em funções puras: a Home precisa do mesmo
 * comportamento na tela e no teste. Se a regra morar no componente,
 * o teste só consegue conferir que a linha existe.
 */

import { calculateDistanceKm } from '../utils/geoDistance.ts';
import { isItemInCategory } from '../data/categories.ts';
import type { ListingItem } from '../types/index.ts';

/**
 * O anúncio, do ponto de vista da busca.
 *
 * É estrutural de propósito: o mesmo código serve para o anúncio do
 * banco, para o da listagem local e para o dublê do teste.
 */
export interface AnuncioBuscavel {
  id?: string;
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  locationCity?: string | null;
  locationState?: string | null;
  subcategoryType?: string | null;
  description?: string | null;
  category?: string | null;
  intent?: string | null;
  /** `active` | `in_negotiation` | `matched` | `closed` */
  status?: string | null;
  /** Anúncio pausado pelo dono. */
  isPaused?: boolean | null;
}

/* ════════════════════════════════════════════════════════════════════
   0. O QUE REALMENTE APARECE NA VITRINE
   ════════════════════════════════════════════════════════════════════ */

/**
 * O anúncio ainda está no jogo?
 *
 * A regra é a do próprio app (`utils/matchingEngine.ts`): o que está
 * ENCERRADO (`closed`) ou PAUSADO não aparece. `in_negotiation` e
 * `matched` continuam aparecendo — é o EloMatch funcionando, e um
 * anúncio que já teve proposta é justamente o que a pessoa quer ver.
 *
 * Anúncio sem status gravado vale: o campo é obrigatório no tipo, mas
 * listagem antiga pode não ter. Esconder por falta de informação seria
 * pior do que mostrar um anúncio velho.
 */
export const estaAtivo = (anuncio: AnuncioBuscavel): boolean => {
  if (anuncio.isPaused === true) return false;
  const status = (anuncio.status || '').trim().toLowerCase();
  if (!status) return true;
  return status !== 'closed';
};

/** Os filtros que a VITRINE aplica antes do alcance regional. */
export interface FiltroDaVitrine {
  /** A categoria em vigor. `null` ou `'all'` = todas. */
  categoria?: string | null;
  /** A intenção em vigor. `'all'` = todas (o padrão da tela). */
  intencao?: 'all' | 'buy' | 'sell';
}

/**
 * Os anúncios que realmente aparecem na vitrine.
 *
 * É a MESMA regra, aplicada em um lugar só, para a contagem da escada
 * regional e para o filtro da tela nunca discordarem entre si:
 *
 *   - o anúncio está ATIVO (não encerrado, não pausado);
 *   - o anúncio é da INTENÇÃO em vigor ("À Venda" = `sell`,
 *     "Compradores" = `buy`, "Todos" = as duas);
 *   - o anúncio é da CATEGORIA em vigor.
 */
export const anunciosDaVitrine = <T extends AnuncioBuscavel>(
  anuncios: T[],
  filtro: FiltroDaVitrine = {}
): T[] => {
  const intencao = filtro.intencao ?? 'all';
  const categoria = filtro.categoria ?? 'all';

  return anuncios.filter((anuncio) => {
    if (!estaAtivo(anuncio)) return false;
    if (intencao !== 'all' && anuncio.intent !== intencao) return false;
    if (categoria && categoria !== 'all' && !isItemInCategory(anuncio as unknown as ListingItem, categoria)) {
      return false;
    }
    return true;
  });
};

/* ════════════════════════════════════════════════════════════════════
   1. A FRASE
   ════════════════════════════════════════════════════════════════════ */

/**
 * Normaliza um texto para comparação: sem acento, em minúsculo.
 *
 * O termo e o anúncio passam pelo MESMO normalizador. Sem isso,
 * "caminhao" (o que a pessoa digita) nunca encontraria "caminhão" (o
 * que está gravado).
 */
const normalizar = (texto: string | null | undefined): string =>
  (texto ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * O texto do anúncio que a busca enxerga.
 *
 * A descrição entra aqui porque é nela que a pessoa do agro escreve
 * "20 a 22 toneladas" ou "caçamba basculante 14m³" — a mesma
 * informação que a pessoa digita na caixa de busca.
 */
const textoDoAnuncio = (anuncio: AnuncioBuscavel): string =>
  normalizar(
    [
      anuncio.title ?? '',
      anuncio.brand ?? '',
      anuncio.model ?? '',
      anuncio.locationCity ?? '',
      anuncio.subcategoryType ?? '',
      anuncio.description ?? '',
    ].join(' ')
  );

/**
 * O pedaço aparece como palavra inteira?
 *
 * "Escavadeira" NÃO casa com "Retroescavadeira" — senão quem procura
 * uma escavadeira veria as retroescavadeiras junto, e a busca ficaria
 * menos precisa do que era.
 */
const contemPalavra = (texto: string, token: string): boolean => {
  const seguro = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${seguro}\\b`).test(texto);
};

/**
 * Quebra a frase em pedaços comparáveis.
 *
 * "Escavadeira 20 toneladas" → ["escavadeira", "20", "toneladas"]
 *
 * Sem acento, em minúsculo, e só com letra e número: "caminhão" e
 * "caminhao" são o mesmo pedaço.
 */
export const tokenizarTermo = (termo: string): string[] =>
  normalizar(termo)
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 0);

/**
 * Os anúncios que casam com a frase.
 *
 * A leitura é em três tempos, do mais literal ao mais conversacional:
 *
 *   1. A FRASE INTEIRA — o comportamento de sempre: o texto da
 *      pessoa aparece no anúncio. "Retroescavadeira" acha a
 *      retroescavadeira.
 *
 *   2. TODOS OS PEDACOS — a frase é lida como um conjunto: o
 *      anúncio precisa ter "escavadeira" E "20" E "toneladas" (o
 *      "toneladas" pode estar na descrição). É o que faz
 *      "Escavadeira 20 toneladas" achar a escavadeira de 20 t.
 *
 *   3. O CABEÇULO E O QUE EXISTE JUNTO COM ELE — quando nenhum
 *      anúncio tem a frase toda, a busca não devolve nada: ela
 *      segura o "cabeçalho" da frase ("Trator") e só usa os
 *      qualificadores que existem em ALGUM anúncio desse cabeçalho
 *      ("75 cv" não existe no catálogo, então não restringe nada).
 *
 * A ordem importa: cada passo só entra quando o anterior não
 * achou nada, então a busca mais específica sempre ganha.
 */
export const anunciosDoTermo = <T extends AnuncioBuscavel>(
  anuncios: T[],
  termo: string
): T[] => {
  const limpo = (termo ?? '').trim();
  if (!limpo) return anuncios;

  // 1. A frase inteira.
  const frase = normalizar(limpo);
  const porFrase = anuncios.filter((a) => textoDoAnuncio(a).includes(frase));
  if (porFrase.length) return porFrase;

  const tokens = tokenizarTermo(limpo);
  // Uma palavra só não tem "pedaços" — a frase inteira já foi o teste.
  if (tokens.length < 2) return porFrase;

  // 2. Todos os pedaços.
  const porPecas = anuncios.filter((a) => tokens.every((t) => contemPalavra(textoDoAnuncio(a), t)));
  if (porPecas.length) return porPecas;

  // 3. O cabeçalho e os qualificadores que existem junto com ele.
  const [cabecalho, ...qualificadores] = tokens;
  const doCabecalho = anuncios.filter((a) => contemPalavra(textoDoAnuncio(a), cabecalho));
  if (!doCabecalho.length) return [];

  const queExiste = qualificadores.filter((t) =>
    doCabecalho.some((a) => contemPalavra(textoDoAnuncio(a), t))
  );
  if (!queExiste.length) return doCabecalho;

  const afinado = doCabecalho.filter((a) =>
    queExiste.every((t) => contemPalavra(textoDoAnuncio(a), t))
  );
  return afinado.length ? afinado : doCabecalho;
};

/* ════════════════════════════════════════════════════════════════════
   2. O ALCANCE — a região do comprador
   ════════════════════════════════════════════════════════════════════ */

/** Os três degraus do alcance, do mais perto ao mais longe. */
export type NivelAlcance = 'regiao' | 'vizinhos' | 'brasil';

/**
 * Quantos anúncios a região precisa ter para a busca PARAR nela.
 *
 * Com menos de 3 anúncios a pessoa não escolhe: ela desliza. Então a
 * busca abre para os vizinhos.
 */
export const MINIMO_LOCAL = 3;

/**
 * Os estados vizinhos de cada estado.
 *
 * É a vizinhança de verdade (SC tem PR e RS; SP tem PR, MG, MS e RJ;
 * e assim por diante) — o que a pessoa espera quando a busca "sobe"
 * um degrau.
 */
export const VIZINHOS_POR_UF: Record<string, readonly string[]> = {
  AC: ['RO'],
  AL: ['PB', 'PE', 'SE'],
  AP: ['PA'],
  AM: ['PA', 'RO', 'RR'],
  BA: ['ES', 'GO', 'MG', 'PE', 'PI', 'SE', 'TO'],
  CE: ['PE', 'PI'],
  DF: ['GO'],
  ES: ['BA', 'MG', 'RJ'],
  GO: ['BA', 'DF', 'MG', 'MS', 'MT', 'TO'],
  MA: ['PI', 'TO'],
  MG: ['BA', 'ES', 'GO', 'MS', 'MT', 'PR', 'RJ', 'SP'],
  MS: ['GO', 'MG', 'MT', 'PR', 'SP'],
  MT: ['GO', 'MS', 'RO', 'TO'],
  PA: ['AP', 'AM', 'MT', 'RR', 'TO'],
  PB: ['AL', 'CE', 'PE', 'RN'],
  PE: ['AL', 'BA', 'CE', 'PB', 'PI'],
  PI: ['BA', 'CE', 'MA', 'PE', 'TO'],
  PR: ['MS', 'MG', 'RS', 'SC', 'SP'],
  RJ: ['ES', 'MG', 'SP'],
  RN: ['CE', 'PB'],
  RO: ['AC', 'AM', 'MT'],
  RR: ['AM', 'PA'],
  RS: ['PR', 'SC'],
  SC: ['PR', 'RS'],
  SE: ['AL', 'BA'],
  SP: ['MG', 'MS', 'PR', 'RJ'],
  TO: ['BA', 'GO', 'MA', 'PA', 'PI'],
};

/** Os vizinhos de uma UF. Lista vazia para quem não tem (ou é desconhecida). */
export const vizinhosDaUf = (uf: string): string[] =>
  (VIZINHOS_POR_UF[(uf || '').trim().toUpperCase()] ?? []).slice();

/**
 * A UF de um anúncio.
 *
 * Vem do campo `locationState`. Quando o anúncio não tem esse campo,
 * a UF é procurada no nome da cidade ("Paulínia/SP - Joinville/SC").
 */
export const ufDoAnuncio = (anuncio: AnuncioBuscavel): string => {
  const doCampo = (anuncio.locationState || '').trim().toUpperCase();
  if (doCampo.length === 2) return doCampo;

  const daCidade = (anuncio.locationCity || '').toUpperCase().match(/\/([A-Z]{2})(?:\b|$)/);
  return daCidade ? daCidade[1] : '';
};

/**
 * A região do comprador.
 *
 * A ordem de confiança:
 *   1. a UF do perfil (quem está logado);
 *   2. a UF da procura que a pessoa já registrou ("Joinville/SC");
 *   3. o hub do EuQuero (SC) — de onde o app foi feito.
 */
export const resolverUfDoComprador = (opcoes: {
  ufDoPerfil?: string | null;
  cidadeDaProcura?: string | null;
  padrao?: string;
}): string => {
  const doPerfil = (opcoes.ufDoPerfil || '').trim().toUpperCase();
  if (doPerfil.length === 2) return doPerfil;

  const daProcura = (opcoes.cidadeDaProcura || '').trim().toUpperCase();
  const achou = daProcura.match(/\/([A-Z]{2})(?:\b|$)/);
  if (achou) return achou[1];

  return (opcoes.padrao || 'SC').trim().toUpperCase();
};

/** A cidade do comprador, para ordenar por distância. */
export const resolverCidadeDoComprador = (cidadeDaProcura?: string | null): string => {
  const bruta = (cidadeDaProcura || '').trim();
  if (!bruta) return '';
  return bruta.split('/')[0].trim();
};

/**
 * O alcance da busca, depois de olhar o que a frase encontrou.
 *
 * A escada é sempre a mesma:
 *   - a região tem announcement suficiente → fica na região;
 *   - a região + os vizinhos têm → vai para os vizinhos;
 *   - nem assim tem → Brasil todo.
 *
 * O alcance nunca some: no último degrau, "Brasil todo" é o mesmo que
 * "sem filtro de estado".
 */
export interface EscopoRegional {
  /** A UF do comprador. */
  uf: string;
  /** Em que degrau a busca parou. */
  nivel: NivelAlcance;
  /** As UFs que a vitrine aceita neste degrau (vazio = Brasil todo). */
  estados: string[];
  /** A cidade do comprador (para ordenar por distância). */
  cidade: string;
  /** Quantos anúncios a frase achou na região do comprador. */
  naRegiao: number;
  /** Quantos anúncios a frase achou no total. */
  total: number;
}

export const decidirEscopoRegional = (params: {
  uf: string;
  cidade?: string;
  anuncios: AnuncioBuscavel[];
  minimo?: number;
}): EscopoRegional => {
  const minimo = params.minimo ?? MINIMO_LOCAL;
  const uf = (params.uf || '').trim().toUpperCase();
  const vizinhos = vizinhosDaUf(uf);
  const ufs = params.anuncios.map(ufDoAnuncio);

  // Anúncio sem UF não é da região nem dos vizinhos: ele não conta
  // para nenhum dos dois degraus. (Ele só volta a aparecer no degrau
  // "Brasil todo".)
  const naRegiao = ufs.filter((u) => u === uf).length;
  const nosVizinhos = ufs.filter((u) => u !== '' && vizinhos.includes(u)).length;

  const base = {
    uf,
    cidade: params.cidade ?? '',
    naRegiao,
    total: ufs.length,
  };

  if (naRegiao >= minimo) {
    return { ...base, nivel: 'regiao', estados: [uf] };
  }
  if (naRegiao + nosVizinhos >= minimo) {
    return { ...base, nivel: 'vizinhos', estados: [uf, ...vizinhos] };
  }
  return { ...base, nivel: 'brasil', estados: [] };
};

/**
 * O aviso da expansão.
 *
 * Quando a busca ficou na região, não há nada a avisar. Quando ela
 * subiu um degrau, a pessoa é avisada — a vitrine é honesta sobre o
 * que está mostrando e por quê.
 */
export const avisoDoEscopo = (escopo: EscopoRegional | null): string | null => {
  if (!escopo) return null;

  const vizinhos = vizinhosDaUf(escopo.uf);

  if (escopo.nivel === 'vizinhos') {
    const lista = vizinhos.length ? vizinhos.join(', ') : 'os estados vizinhos';
    return `Achamos poucos anúncios em ${escopo.uf}. Ampliamos a busca para ${lista}.`;
  }

  if (escopo.nivel === 'brasil') {
    const lista = vizinhos.length
      ? `${escopo.uf} nem nos estados vizinhos (${vizinhos.join(', ')})`
      : escopo.uf;
    return `Não achamos anúncios suficientes em ${lista}. Mostrando todo o Brasil.`;
  }

  return null;
};

/**
 * O anúncio passa no alcance regional?
 *
 * Aqui mora o furo que a auditoria encontrou, então a regra está
 * escrita uma vez e testada:
 *
 *   - No degrau "Brasil todo" não há filtro de estado: tudo entra.
 *   - Nos degraus "região" e "vizinhos" o anúncio PRECISA ter uma UF
 *     que esteja na lista. Anúncio sem UF identificável NÃO passa: ele
 *     não é da região nem dos vizinhos, então não pode aparecer como
 *     se fosse. Ele só volta a aparecer no degrau "Brasil todo".
 */
export const passaNoEscopoRegional = (
  anuncio: AnuncioBuscavel,
  escopo: EscopoRegional | null
): boolean => {
  if (!escopo) return true;
  if (escopo.nivel === 'brasil') return true;

  const uf = ufDoAnuncio(anuncio);
  // Sem UF não há como dizer de onde o anúncio é. Vazamento fechado.
  if (!uf) return false;

  return escopo.estados.includes(uf);
};

/**
 * A ordem da vitrine: região primeiro, vizinhos depois, o resto por
 * último. Dentro de cada faixa, o mais perto primeiro.
 *
 * A ordem original é preservada quando não dá para dizer o que é
 * mais perto (a ordenação do JavaScript é estável).
 */
export const ordenarPorProximidade = <T extends AnuncioBuscavel>(
  anuncios: T[],
  escopo: EscopoRegional | null
): T[] => {
  if (!escopo) return anuncios;

  const vizinhos = vizinhosDaUf(escopo.uf);

  const faixa = (anuncio: T): number => {
    const uf = ufDoAnuncio(anuncio);
    if (uf === escopo.uf) return 0;
    if (vizinhos.includes(uf)) return 1;
    return 2;
  };

  const distancia = (anuncio: T): number | null => {
    if (!escopo.cidade) return null;
    return calculateDistanceKm(anuncio.locationCity || '', escopo.cidade);
  };

  return [...anuncios].sort((a, b) => {
    const fa = faixa(a);
    const fb = faixa(b);
    if (fa !== fb) return fa - fb;

    const da = distancia(a);
    const db = distancia(b);
    if (da !== null && db !== null) return da - db;
    if (da !== null) return -1;
    if (db !== null) return 1;
    return 0;
  });
};
