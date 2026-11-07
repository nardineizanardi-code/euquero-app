/**
 * mini-1.2d — os filtros corretos na busca do comprador.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O QUE A REVISÃO DO DIFF 1.2c ACHOU
 *
 * O 1.2c aplicava os filtros, mas cinco deles estavam com a regra
 * errada. Este arquivo concentra a correção — e a concentração é o
 * ponto: cada regra tem UM lugar, e os testes batem contra esse
 * lugar, não contra uma cópia.
 *
 *  1. HORAS — o 1.2c nem tinha. O campo `hoursUsed` existe no tipo,
 *     no schema (`hours_used`) e no mapeamento do backend, então dá
 *     para filtrar de verdade: "até X" é `<=`.
 *
 *  2. ANO — o 1.2c filtrava por ANO EXATO (`year === pedido`). O
 *     pedido é "a partir de": ano do anúncio `>=` ano pedido.
 *
 *  3. ORÇAMENTO — o 1.2c mandava `price: 0` quando a pessoa não
 *     preencheu o orçamento, e `price` é `not null default 0` no
 *     banco. Zero não é "não informado", é "não informado" virando
 *     um número falso que barra a busca e aparece como "R$ 0,00".
 *
 *  4. UF — "só do meu estado" sem UF válida precisa BLOQUEAR, não
 *     cair para "Brasil todo" nem passar sem restrição.
 *
 *  5. CONDIÇÃO — o 1.2c fixava `condition: 'usado'` na procura. Isso
 *     é uma escolha automática: a ficha só filtra condição quando a
 *     pessoa clicar em "Novo" ou "Usado".
 *
 *  6. ANO E HORAS SÃO OPCIONAIS — vazio, null e NaN normalizam para
 *     ausente e não restringem nada.
 *
 *  7. STATUS E INTENÇÃO — só `status === 'active'` E `intent ===
 *     'sell'` passa. Sem status, inativo, buy ou intent ausente são
 *     excluídos. Não se assume 'sell' quando falta.
 */

/** As 27 UFs brasileiras, para validar o que a pessoa escolheu. */
export const UFS_BRASIL = [
  'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS',
  'MT', 'PA', 'PB', 'PE', 'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC',
  'SE', 'SP', 'TO',
] as const;

/** Uma UF é válida? 'BR' NÃO é uma UF — é o código de "Brasil todo". */
export const ufValida = (v: unknown): string | null => {
  const s = typeof v === 'string' ? v.trim().toUpperCase() : '';
  return UFS_BRASIL.includes(s as (typeof UFS_BRASIL)[number]) ? s : null;
};

/**
 * Normaliza um número que veio de um campo de texto.
 *
 * Aceita "4.200", "4.200h", "4200 horas", "R$ 1.500,50". Devolve null
 * quando não há número nenhum — null significa "não informado", e
 * nunca zero.
 */
export const numeroOuNulo = (v: unknown): number | null => {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? v : null;
  }
  if (typeof v !== 'string') return null;
  const limpo = v.trim();
  if (!limpo) return null;
  // "4.200" é quatro mil e duzentos; "1.500,50" é mil quinhentos e
  // cinquenta. A vírgula é o decimal e o ponto é o separador de milhar
  // — então, com vírgula, o ponto sai. SEM vírgula, o ponto É o
  // separador de milhar e também sai.
  //
  // O detalhe que importa: "4.200h" NÃO pode virar 4.2. O padrão
  // regex abaixo exige que, havendo ponto, venham 3 dígitos depois
  // dele — senão é decimal de verdade (ex.: "4.5").
  const temVirgula = limpo.includes(',');
  // Com vírgula: o ponto é milhar e sai, a vírgula vira ponto decimal.
  // Sem vírgula: o ponto é milhar (e sai) — "4.200h" são 4.200 horas.
  const semSeparador = temVirgula
    ? limpo.replace(/\./g, '').replace(',', '.')
    : limpo.replace(/\.(?=\d{3}(?!\d))/g, '');
  // Números com separador de milhar não podem ter ponto sobrando.
  const extraido = semSeparador.match(/-?\d+(?:\.\d+)?/);
  if (!extraido) return null;
  const n = Number(extraido[0]);
  return Number.isFinite(n) ? n : null;
};

/**
 * O que a pessoa escolheu ou preencheu na ficha.
 *
 * Todos os campos são opcionais: "não preenchido" é uma resposta
 * válida e significa "não filtre por isso".
 */
export interface CriteriosDaBusca {
  /** Categoria: linha_amarela | agricola | caminhao | implementos. */
  categoria?: string | null;
  /** Marca/modelo digitados. Vira o termo de busca textual. */
  termo?: string | null;
  /** 'so_estado' | 'brasil_todo' | null (não escolhido). */
  alcance?: 'so_estado' | 'brasil_todo' | null;
  /** UF escolhida no dropdown ou vinda do perfil. */
  uf?: string | null;
  /** Ano mínimo pedido. Ausente = não filtrar por ano. */
  anoMin?: number | null;
  /** Horas MÁXIMAS pedidas. Ausente = não filtrar por horas. */
  horasMax?: number | null;
  /** Condição escolhida explicitamente ('novo' | 'usado'). Null = as duas. */
  condicao?: string | null;
  /** Orçamento máximo preenchido. Ausente = não filtrar por preço. */
  orcamentoMax?: number | null;
}

/**
 * Os filtros que a Home entende.
 *
 * `escopoGeo` e `ufAlvo` são null quando a ficha não mexe no
 * geográfico — "não escolhido" não pode virar "Brasil todo".
 */
export interface FiltrosAplicados {
  categoria: string;
  termo: string;
  escopoGeo: 'so_sc' | 'brasil_todo' | null;
  ufAlvo: string | null;
  /** Ano mínimo (>=). null = não filtra. */
  anoMin: number | null;
  /** Horas máximas (<=). null = não filtra. */
  horasMax: number | null;
  /** Condição exigida. null = aceita novas e usadas. */
  condicao: string | null;
  orcamentoMax: number | null;
}

/**
 * Traduz a procura da ficha nos filtros da Home.
 *
 * Regras:
 *  - a categoria da ficha SEMPRE prevalece sobre o que estava na Home;
 *  - "Brasil todo" → escopoGeo 'brasil_todo';
 *  - "Só do meu estado" → escopoGeo 'so_sc' + ufAlvo (a UF real,
 *    validada contra as 27; 'BR' não é uma UF);
 *  - sem escolha → escopoGeo null (a Home continua como estava);
 *  - ano/horas/condição/orçamento só filtram quando preenchidos.
 */
export const criteriosParaFiltros = (
  c: CriteriosDaBusca
): FiltrosAplicados => {
  const categoria = (c.categoria ?? '').trim() || 'linha_amarela';
  const termo = (c.termo ?? '').trim();

  let escopoGeo: 'so_sc' | 'brasil_todo' | null = null;
  let ufAlvo: string | null = null;

  if (c.alcance === 'brasil_todo') {
    escopoGeo = 'brasil_todo';
  } else if (c.alcance === 'so_estado') {
    escopoGeo = 'so_sc';
    // A UF tem que ser REAL. 'BR' é o código de "Brasil todo" e não
    // é uma UF — fingir SC aqui mostraria anúncios de Santa Catarina
    // para quem pediu o estado dele.
    ufAlvo = ufValida(c.uf);
  }

  const anoMin = numeroOuNulo(c.anoMin);
  const horasMax = numeroOuNulo(c.horasMax);
  const condicaoBruta = (c.condicao ?? '').trim().toLowerCase();
  const condicao = condicaoBruta === 'novo' || condicaoBruta === 'usado'
    ? condicaoBruta
    : null;

  const orcamentoMax = numeroOuNulo(c.orcamentoMax);

  return {
    categoria,
    termo,
    escopoGeo,
    ufAlvo,
    anoMin,
    horasMax,
    condicao,
    orcamentoMax,
  };
};

/** O que um anúncio precisa ter para a vitrine mostrar. */
export type AnuncioParaFiltrar = {
  id?: string | null;
  intent?: string | null;
  status?: string | null;
  category?: string | null;
  title?: string | null;
  brand?: string | null;
  model?: string | null;
  year?: number | null;
  hoursUsed?: number | null;
  condition?: string | null;
  price?: number | null;
  locationState?: string | null;
  locationCity?: string | null;
};

/**
 * Um anúncio passa no filtro da busca?
 *
 * Recebe `casarCategoria` como parâmetro porque o app já tem uma
 * função que entende os apelidos (linha_amarela → maquinas,
 * agricola → agro, caminhao → caminhoes/veiculos). Não duplicamos
 * essa regra aqui: passamos a função.
 */
export const anuncioPassaNoFiltro = (
  anuncio: AnuncioParaFiltrar,
  f: FiltrosAplicados,
  deps: {
    casarCategoria: (item: AnuncioParaFiltrar, categoria: string) => boolean;
    casarTermo: (termo: string, item: AnuncioParaFiltrar) => boolean;
  }
): boolean => {
  // ── 7. STATUS E INTENÇÃO ─────────────────────────────────────────
  // O resultado da busca é o que está À VENDA e ATIVO. Sem status, ou
  // com status diferente de 'active', o anúncio não entra. E intent
  // ausente NÃO é assumido como 'sell' — a pessoa que não declarou
  // não virou vendedor por acidente.
  if (anuncio.status !== 'active') return false;
  if (anuncio.intent !== 'sell') return false;

  // ── CATEGORIA ────────────────────────────────────────────────────
  if (f.categoria && f.categoria !== 'all') {
    if (!deps.casarCategoria(anuncio, f.categoria)) return false;
  }

  // ── UF ───────────────────────────────────────────────────────────
  if (f.ufAlvo) {
    const st = (anuncio.locationState ?? '').trim().toUpperCase();
    if (st !== f.ufAlvo) return false;
  }

  // ── 2. ANO MÍNIMO (>=) ──────────────────────────────────────────
  // "A partir de 2021" aceita 2021, 2022, 2023... e rejeita 2020.
  // Vazio/null/NaN normaliza para null e não restringe nada.
  if (f.anoMin !== null) {
    const ano = numeroOuNulo(anuncio.year);
    // Anúncio sem ano não pode satisfazer "a partir de 2021".
    if (ano === null) return false;
    if (ano < f.anoMin) return false;
  }

  // ── 1. HORAS MÁXIMAS (<=) ────────────────────────────────────────
  // "Até 4.000 horas" aceita 3.000 e 4.000; barra 4.001.
  // O campo estruturado do anúncio é `hoursUsed` (schema: hours_used).
  if (f.horasMax !== null) {
    const horas = numeroOuNulo(anuncio.hoursUsed);
    // Anúncio sem horímetro não pode satisfazer "até X horas".
    if (horas === null) return false;
    if (horas > f.horasMax) return false;
  }

  // ── 5. CONDIÇÃO ──────────────────────────────────────────────────
  // Sem escolha explícita, a busca mostra novas e usadas.
  if (f.condicao) {
    const cond = (anuncio.condition ?? '').trim().toLowerCase();
    if (cond !== f.condicao) return false;
  }

  // ── 3. ORÇAMENTO ─────────────────────────────────────────────────
  // Só barra quando a pessoa informou um teto. Sem teto, não barra —
  // e um anúncio sem preço não é barrado por isso.
  if (f.orcamentoMax !== null) {
    const preco = numeroOuNulo(anuncio.price);
    if (preco === null) return false;
    if (preco > f.orcamentoMax) return false;
  }

  // ── TERMO ────────────────────────────────────────────────────────
  if (f.termo) {
    if (!deps.casarTermo(f.termo, anuncio)) return false;
  }

  return true;
};

/**
 * Aplica o filtro a uma lista, mantendo a ordem original.
 */
export const aplicarFiltro = (
  anuncios: AnuncioParaFiltrar[],
  f: FiltrosAplicados,
  deps: {
    casarCategoria: (item: AnuncioParaFiltrar, categoria: string) => boolean;
    casarTermo: (termo: string, item: AnuncioParaFiltrar) => boolean;
  }
): AnuncioParaFiltrar[] => anuncios.filter((a) => anuncioPassaNoFiltro(a, f, deps));

/** O texto do empty state. Fica aqui para ser testado e para não
 * depender de JSX. */
export const TEXTO_SEM_RESULTADO = 'Nenhuma máquina encontrada com esses critérios';

/** A dica do empty state: o que a pessoa pode afrouxar. */
export const dicaDoEmptyState = (f: FiltrosAplicados): string => {
  const dicas: string[] = [];
  if (f.anoMin !== null) {
    dicas.push(`aceitar máquinas a partir de ${f.anoMin}`);
  }
  if (f.horasMax !== null) {
    dicas.push('aceitar máquinas com mais horas de uso');
  }
  if (f.orcamentoMax !== null) {
    dicas.push('aumentar o orçamento');
  }
  if (f.ufAlvo) {
    dicas.push(`buscar em todo o Brasil em vez de só ${f.ufAlvo}`);
  } else if (f.escopoGeo === 'so_sc') {
    dicas.push('buscar em todo o Brasil');
  }
  if (f.condicao) {
    dicas.push('ver também a outra condição');
  }
  if (f.termo) {
    dicas.push('buscar só pela marca, sem o modelo');
  }
  if (dicas.length === 0) {
    return 'Você pode mudar os filtros ou voltar para a vitrine completa.';
  }
  if (dicas.length === 1) {
    return `Você pode ${dicas[0]}.`;
  }
  const ultima = dicas[dicas.length - 1];
  return `Você pode ${dicas.slice(0, -1).join(', ')} ou ${ultima}.`;
};

/**
 * ─────────────────────────────────────────────────────────────────────
 * ITEM 4 — UF OBRIGATÓRIA PARA "SÓ DO MEU ESTADO"
 * ─────────────────────────────────────────────────────────────────────
 *
 * Se a pessoa escolheu "só do meu estado" e não há UF válida (nem no
 * perfil, nem escolhida na ficha), a busca NÃO pode seguir. Nem
 * virando "Brasil todo", nem sem restrição estadual.
 *
 * Esta função é o portão: devolve o erro se faltar a UF, e null
 * quando está tudo certo.
 */
export const MSG_SEM_UF = 'Não encontramos sua UF. Selecione o estado manualmente.';

export type BloqueioAlcance =
  | { ok: true; uf: string | null }
  | { ok: false; mensagem: string };

/**
 * Verifica se a pessoa pode seguir com o alcance escolhido.
 *
 * - 'brasil_todo' → sempre pode (a escolha é explícita).
 * - 'so_estado' → precisa de uma UF válida; senão, bloqueia.
 * - null / sem escolha → pode (não mexe em nada).
 */
export const checarAlcance = (params: {
  alcance?: 'so_estado' | 'brasil_todo' | null;
  ufDoPerfil?: string | null;
  ufEscolhida?: string | null;
}): BloqueioAlcance => {
  if (params.alcance === 'brasil_todo') {
    return { ok: true, uf: null };
  }
  if (params.alcance !== 'so_estado') {
    // Sem escolha explícita, não há restrição a checar.
    return { ok: true, uf: null };
  }
  const doPerfil = ufValida(params.ufDoPerfil);
  if (doPerfil) return { ok: true, uf: doPerfil };
  const escolhida = ufValida(params.ufEscolhida);
  if (escolhida) return { ok: true, uf: escolhida };
  return { ok: false, mensagem: MSG_SEM_UF };
};

/**
 * ─────────────────────────────────────────────────────────────────────
 * ITEM 3 — ORÇAMENTO AUSENTE NÃO É ZERO
 * ─────────────────────────────────────────────────────────────────────
 *
 * O `price` do anúncio tem significado próprio para a venda. Para a
 * PROCURA, quando a pessoa não escreveu um teto, o preço é ausente —
 * nunca 0. "R$ 0,00" na tela mente: diz que o orçamento máximo é
 * zero, e como filtro zeraria a busca.
 *
 * O banco tem `price numeric not null default 0`, então o insert
 * continua indo com 0 por baixo — mas o que a tela e os filtros veem
 * é `null`, e o `orcamentoMax` (que filtra) fica null também.
 */
export const precoDaProcura = (orcamentoDigitado: unknown): number | null => {
  const n = numeroOuNulo(orcamentoDigitado);
  if (n === null) return null;
  // Zero e negativo não são orçamento. "R$ 0" é campo vazio na
  // prática, e um teto negativo barra tudo.
  if (n <= 0) return null;
  return n;
};

/** Como o preço de uma procura aparece na tela. */
export const textoDoPreco = (
  preco: number | null | undefined,
  opcoes: { sufixo?: string; vazio?: string } = {}
): string => {
  // mini-1.2e: preço AUSENTE é null OU zero.
  //
  // Zero num anúncio de venda significa "a combinar" (é um dado real,
  // gravado assim por quem não quis informar o valor). Zero numa
  // PROCURA sem orçamento é o `not null default 0` do banco, que a
  // aplicação vira null na leitura. Nos dois casos, o texto na tela
  // é "A combinar" — nunca "R$ 0,00".
  if (preco === null || preco === undefined || !Number.isFinite(preco) || preco === 0) {
    return opcoes.vazio ?? 'A combinar';
  }
  return `${opcoes.sufixo ?? ''}${preco.toLocaleString('pt-BR')}`;
};

/**
 * mini-1.2e: o preço de um CARD, já no formato que a tela usa.
 *
 * `sufixo` é o que vem antes ("R$ " ou "Até R$ "). O texto de
 * ausência é sempre "A combinar" — e o sufixo some junto, para não
 * sobrar "Até R$ A combinar".
 */
export const precoDoCard = (
  preco: number | null | undefined,
  opcoes: { sufixo?: string; vazio?: string } = {}
): string => {
  const sufixo = opcoes.sufixo ?? '';
  const texto = textoDoPreco(preco, { vazio: opcoes.vazio ?? 'A combinar' });
  if (texto === 'A combinar' || texto === (opcoes.vazio ?? 'A combinar')) {
    return texto;
  }
  return `${sufixo}${texto}`;
};

/**
 * ─────────────────────────────────────────────────────────────────────
 * HELPERS DE LEITURA DA FICHA
 * ─────────────────────────────────────────────────────────────────────
 *
 * A pessoa digita em campo de texto livre: "4.200h", "R$ 1.500,50",
 * "a partir de 2021". Estes helpers transformam isso em número — ou
 * em null, que significa "não informado".
 */

/** O teto de horas que a pessoa escreveu. null = não informou. */
export const horasMaximasDaBusca = (v: unknown): number | null => {
  const n = numeroOuNulo(v);
  if (n === null) return null;
  // Zero e negativo não são limite de horas.
  if (n <= 0) return null;
  return n;
};

/**
 * O ano MÍNIMO que a pessoa escreveu ("a partir de 2021").
 *
 * Aceita "2021", "2021/2022", "a partir de 2021", "2021 ou mais novo".
 * Pega o primeiro ano que encontrar. null = não informou.
 */
export const anoMinimoDaBusca = (v: unknown): number | null => {
  if (typeof v === 'number') {
    return Number.isFinite(v) ? Math.trunc(v) : null;
  }
  if (typeof v !== 'string') return null;
  // Primeiro número de 4 dígitos entre 1900 e 2100.
  const candidatos = v.match(/\b(19|20|21)\d{2}\b/g);
  if (!candidatos || candidatos.length === 0) return null;
  const n = Number(candidatos[0]);
  return Number.isFinite(n) ? n : null;
};

/** O teto de orçamento que a pessoa escreveu. null = não informou. */
export const precoDaBusca = (v: unknown): number | null => precoDaProcura(v);

/**
 * ─────────────────────────────────────────────────────────────────────
 * PREPARO DOS FILTROS A PARTIR DA PROCURA GRAVADA
 * ─────────────────────────────────────────────────────────────────────
 *
 * O App precisa de duas coisas quando a gravação dá certo:
 *  1. os FILTROS (que vão para a vitrine);
 *  2. as DECISÕES de UI (categoria da ficha, alcance do topo).
 *
 * As duas saem dos mesmos dados, então ficam juntas aqui — e assim o
 * teste do fluxo real não precisa montar React para verificar que a
 * categoria da ficha prevalece sobre a da Home.
 */
export interface PreparacaoDaBusca {
  filtros: FiltrosAplicados;
  /** A categoria que a vitrine vai usar. */
  categoria: string;
  /** O alcance do controle do topo. null = não mexer. */
  escopoGeo: 'so_sc' | 'brasil_todo' | null;
  /** O termo textual que vai para a caixa de busca. */
  termo: string;
  /** A intenção que a vitrine vai usar. */
  intent: 'sell';
}

/**
 * O que a pessoa digitou como marca/modelo, normalizado.
 * Sem modelo inventado: o que ela escreveu, e só.
 */
export const termoDaBusca = (item: {
  brand?: string | null;
  model?: string | null;
  title?: string | null;
}): string =>
  [item.brand, item.model]
    .map((x) => (x ?? '').trim())
    .filter(Boolean)
    .join(' ') ||
  (item.title ?? '').trim();

/**
 * Prepara os filtros a partir da procura que foi gravada.
 *
 * Regras que aqui ficam garantidas:
 *  - a CATEGORIA da ficha prevalece (nunca a da Home);
 *  - o ALCANCE só mexe no controle do topo quando a pessoa escolheu;
 *  - a INTENÇÃO da vitrine é 'sell' — a pessoa está vendo o que há à
 *    venda, e não as procuras de outros compradores.
 */
export const prepararBusca = (procura: {
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  title?: string | null;
  geoPreference?: string | null;
  locationState?: string | null;
  minYear?: number | null;
  maxHoursUsed?: number | null;
  condition?: string | null;
  orcamentoMax?: number | null;
}): PreparacaoDaBusca => {
  const termo = termoDaBusca(procura);
  const filtros = criteriosParaFiltros({
    categoria: procura.category,
    termo,
    alcance: (procura.geoPreference ?? null) as 'so_estado' | 'brasil_todo' | null,
    uf: procura.locationState,
    anoMin: procura.minYear ?? null,
    horasMax: procura.maxHoursUsed ?? null,
    condicao: procura.condition ?? null,
    orcamentoMax: procura.orcamentoMax ?? null,
  });
  return {
    filtros,
    categoria: filtros.categoria,
    escopoGeo: filtros.escopoGeo,
    termo,
    intent: 'sell',
  };
};

/**
 * ─────────────────────────────────────────────────────────────────────
 * APLICAR OS FILTROS NA TELA
 * ─────────────────────────────────────────────────────────────────────
 *
 * O App tem sete `setState` para aplicar o resultado da busca. Se cada
 * um deles stays dentro do componente, o teste do fluxo não consegue
 * verificar o comportamento — só o regex do fonte, que não pega
 * ordem errada.
 *
 * Aqui a aplicação vira uma função que recebe os setters. O App
 * chama; o teste chama. É a MESMA função, então o teste verifica o
 * comportamento de verdade.
 */
export type Setter<T> = (valor: T) => void;

export interface TelaDaBusca {
  setFiltrosDaFicha: Setter<FiltrosAplicados | null>;
  setSelectedCategory: Setter<string>;
  setGeoScopeFilter: Setter<'so_sc' | 'brasil_todo' | 'perto_de_mim'>;
  setSearchQuery: Setter<string>;
  setIntentFilter: Setter<'all' | 'buy' | 'sell'>;
}

/**
 * Aplica o resultado da busca na tela.
 *
 * Regras garantidas aqui (e portanto testáveis):
 *  - a categoria da ficha PREVALECE sobre a que estava na Home;
 *  - o alcance só mexe no controle do topo quando a pessoa escolheu;
 *  - a vitrine mostra o que está À VENDA (intent 'sell');
 *  - o texto é o que a pessoa digitou como marca/modelo.
 */
export const aplicarFiltrosNaTela = (
  preparacao: PreparacaoDaBusca,
  tela: TelaDaBusca
): void => {
  tela.setFiltrosDaFicha(preparacao.filtros);
  // A categoria da ficha prevalece sobre a que estava na Home.
  tela.setSelectedCategory(preparacao.categoria);
  // 'so_sc' é o rótulo do controle do topo, mas ele significa "a UF da
  // pessoa", não "Santa Catarina". O filtro de verdade fica em
  // filtrosDaFicha.ufAlvo; aqui só alinhamos o controle para não
  // prometer "Só SC" a quem é de outro estado.
  if (preparacao.escopoGeo === 'brasil_todo') {
    tela.setGeoScopeFilter('brasil_todo');
  } else if (preparacao.escopoGeo === 'so_sc') {
    tela.setGeoScopeFilter('so_sc');
  }
  // Sem escolha de alcance, o geográfico da Home não é tocado.
  tela.setSearchQuery(preparacao.termo);
  tela.setIntentFilter(preparacao.intent);
};

/**
 * ─────────────────────────────────────────────────────────────────────
 * mini-1.2e — A UF DO PERFIL
 * ─────────────────────────────────────────────────────────────────────
 *
 * A UF do perfil vem de `user_metadata.state`, que é texto livre: pode
 * estar vazio, pode ser "SC", e pode ser "XX" ou "Santa Catarina".
 *
 * O bug que o 1.2e corrigiu: o seletor manual de UF só aparecia
 * quando `ufPadrao` era VAZIO (`!ufPadrao`). Com uma sigla INVÁLIDA
 * ("XX"), o seletor ficava escondido — e o `checarAlcance` bloqueava
 * o submit sem dar como escolher. A pessoa ficava presa.
 *
 * A regra agora é: o seletor aparece sempre que não há uma UF VÁLIDA
 * do perfil.
 */

/** A UF do perfil serve para 'so_estado'? Só se for uma das 27. */
export const ufDoPerfilValida = (uf: unknown): string | null => ufValida(uf);

/**
 * O seletor manual de UF deve aparecer?
 *
 * Sim quando o alcance é 'so_estado' e o perfil NÃO tem uma UF válida.
 */
export const precisaSelecionarUf = (params: {
  alcance?: 'so_estado' | 'brasil_todo' | null;
  ufDoPerfil?: string | null;
}): boolean => {
  if (params.alcance !== 'so_estado') return false;
  return ufDoPerfilValida(params.ufDoPerfil) === null;
};

/**
 * A UF que o filtro vai usar: a do perfil se for válida, senão a que
 * a pessoa escolheu na ficha. Null = ainda falta escolher.
 */
export const ufEfetivaDaBusca = (params: {
  ufDoPerfil?: string | null;
  ufEscolhida?: string | null;
}): string | null =>
  ufDoPerfilValida(params.ufDoPerfil) ?? ufValida(params.ufEscolhida);

/**
 * ─────────────────────────────────────────────────────────────────────
 * mini-1.2e — AFROUXAR FILTROS NO EMPTY STATE
 * ─────────────────────────────────────────────────────────────────────
 *
 * Quando a busca não acha nada, a pessoa precisa de um caminho para
 * soltar o que está apertando demais. O botão só pode soltar o que
 * o RÓTULO diz que solta — nada de limpar categoria, marca/modelo ou
 * alcance por baixo, que a pessoa não pediu para mudar.
 *
 * A lógica mora aqui (e não no JSX) para poder ser testada: cada
 * combinação de filtros ativos precisa produzir o rótulo certo e
 * remover EXATAMENTE aquilo.
 */

/** Os três filtros que o botão pode soltar. */
export type FiltrosAfrouxaveis = 'ano' | 'horas' | 'orcamento';

export interface ResultadoAfrouxar {
  /** O rótulo do botão. */
  rotulo: string;
  /** Quais filtros serão removidos. */
  removidos: FiltrosAfrouxaveis[];
  /** Os filtros depois da remoção. */
  filtros: FiltrosAplicados;
}

/**
 * Quais dos três filtros estão ativos.
 */
export const filtrosAfrouxaveisAtivos = (
  f: FiltrosAplicados
): FiltrosAfrouxaveis[] => {
  const ativos: FiltrosAfrouxaveis[] = [];
  if (f.anoMin !== null) ativos.push('ano');
  if (f.horasMax !== null) ativos.push('horas');
  if (f.orcamentoMax !== null) ativos.push('orcamento');
  return ativos;
};

/**
 * Monta o rótulo e o resultado de afrouxar.
 *
 * "Afrouxar ano", "Afrouxar horas", "Afrouxar orçamento",
 * "Afrouxar ano e horas", "Afrouxar ano, horas e orçamento".
 */
export const rotuloAfrouxar = (f: FiltrosAplicados): string => {
  const ativos = filtrosAfrouxaveisAtivos(f);
  if (ativos.length === 0) return '';
  // O rótulo vai para a TELA: acentos e hifenização importam.
  // "Afrouxar orcamento" com o c errado parece texto de máquina.
  const nomes: Record<FiltrosAfrouxaveis, string> = {
    ano: 'ano',
    horas: 'horas',
    orcamento: 'orçamento',
  };
  const rotulos = ativos.map((a) => nomes[a]);
  if (rotulos.length === 1) return `Afrouxar ${rotulos[0]}`;
  if (rotulos.length === 2) return `Afrouxar ${rotulos[0]} e ${rotulos[1]}`;
  return `Afrouxar ${rotulos[0]}, ${rotulos[1]} e ${rotulos[2]}`;
};

/**
 * Remove APENAS os filtros indicados, deixando os outros intactos.
 *
 * Categoria, marca/modelo, alcance, UF e condição NÃO são tocados —
 * a pessoa escolheu aquilo, e o botão é sobre afrouxar, não sobre
 * recomeçar.
 */
export const afrouxarFiltros = (
  f: FiltrosAplicados,
  removidos: FiltrosAfrouxaveis[]
): FiltrosAplicados => {
  const ano = removidos.includes('ano') ? null : f.anoMin;
  const horas = removidos.includes('horas') ? null : f.horasMax;
  const orcamento = removidos.includes('orcamento') ? null : f.orcamentoMax;
  return { ...f, anoMin: ano, horasMax: horas, orcamentoMax: orcamento };
};

/**
 * Atalho: o que o botão do empty state faz.
 *
 * Devolve `null` quando não há nada a afrouxar (o botão não aparece).
 */
export const calcularAfrouxamento = (
  f: FiltrosAplicados
): ResultadoAfrouxar | null => {
  const removidos = filtrosAfrouxaveisAtivos(f);
  if (removidos.length === 0) return null;
  return {
    rotulo: rotuloAfrouxar(f),
    removidos,
    filtros: afrouxarFiltros(f, removidos),
  };
};
