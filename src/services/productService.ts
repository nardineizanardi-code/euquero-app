// `src/types` exporta só tipos e interfaces — não tem nenhum valor em runtime.
// Por isso o `import type`: é o que o isolatedModules do Vite exige, e é o que
// permite rodar este arquivo fora do bundler (nos testes).
import type {
  ListingItem,
  ProcuraPublica,
  IntentType,
  ConditionType,
  GeoPreferenceType,
  BudgetRangeType,
} from '../types';

export type { ProcuraPublica };

/**
 * Calcula a quantidade REAL de compradores interessados para uma procura/máquina.
 * Nunca é um número fixo estático: analisa os pedidos reais e pretendentes compatíveis.
 */
export const calculateCompradoresInteressados = (
  item: { subcategoryType?: string; category?: string; locationState?: string; brand?: string; model?: string },
  allListings: ListingItem[] = []
): number => {
  const itemCategory = (item.category || '').toLowerCase();
  const itemSub = (item.subcategoryType || '').toLowerCase();

  // Compradores reais no feed/estado
  const realBuyers = allListings.filter((l) => {
    if (l.intent !== 'buy') return false;
    const lCategory = (l.category || '').toLowerCase();
    const lSub = (l.subcategoryType || '').toLowerCase();

    const matchesSub = itemSub && lSub && (itemSub.includes(lSub) || lSub.includes(itemSub));
    const matchesCat = itemCategory && lCategory && itemCategory === lCategory;

    return matchesSub || matchesCat;
  });

  // Compradores cadastrados salvos no localStorage (pedidos_compra_reais)
  let pedidosStorageCount = 0;
  try {
    const pedidosStr = localStorage.getItem('pedidos_compra_reais');
    if (pedidosStr) {
      const pedidos = JSON.parse(pedidosStr);
      if (Array.isArray(pedidos)) {
        pedidosStorageCount = pedidos.filter((p: any) => {
          const pMaq = (p.maquina || '').toLowerCase();
          return itemSub && pMaq.includes(itemSub);
        }).length;
      }
    }
  } catch (e) {}

  // A contagem é sempre REAL com base nos compradores cadastrados
  return realBuyers.length + pedidosStorageCount;
};

/**
 * Converte um ListingItem de compra em ProcuraPublica formatada (com orçamento em centavos e compradores reais)
 */
export const toProcuraPublica = (
  item: ListingItem,
  allListings: ListingItem[] = []
): ProcuraPublica => {
  const brandModel = `${item.brand || ''} ${item.model || ''}`.trim() || item.title;

  return {
    id: item.id,
    titulo: item.title,
    subcategoria: item.subcategoryType || item.category,
    marcaModelo: brandModel,
    anoMin: item.yearMin || item.year || 2018,
    anoMax: item.yearMax || item.year || 2024,
    orcamentoMax: Math.round((item.price || 0) * 100), // Em centavos
    cidade: item.locationCity,
    estado: item.locationState,
    estadoAlcance: item.geoPreference === 'so_estado' ? 'so_estado' : 'brasil',
    criadaEm: item.createdAt || new Date().toISOString(),
    expiracao: item.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    compradoresInteressados: calculateCompradoresInteressados(item, allListings)
  };
};

/* ═══════════════════════════════════════════════════════════════════════
   CAMADA DE MAPEAMENTO BANCO <-> APP

   O Postgres devolve snake_case; o app trabalha em camelCase. Aqui ficam
   os tipos da linha crua, a lista explícita de colunas públicas e as
   conversões.

   REGRA QUE VALE PARA TUDO AQUI:
   O que é público é montado CAMPO A CAMPO, sem `...row` e sem `...item`.
   Se amanhã alguém colocar uma coluna sensível nova no banco, ela não
   aparece na vitrine só porque apareceu no objeto.

   Nada neste arquivo importa @supabase/supabase-js: o cliente entra por
   injeção, então tudo aqui é testável com um dublê. (Ainda não instalamos
   o pacote — ver README deste arquivo.)
   ═══════════════════════════════════════════════════════════════════════ */

/** Linha crua de `listings` / `public_listings`, como o PostgREST devolve. */
export interface ListingRow {
  id: string;
  /** Só existe na tabela `listings` (RLS).
   *
   *  A view `public_listings` NÃO tem mais esta coluna: ela foi recriada sem
   *  `owner_id`, e a auditoria confirmou (perguntando a coluna e recebendo
   *  HTTP 400) que o PostgREST não a expõe mais por ali.
   *
   *  Mesmo assim, `PUBLIC_LISTING_COLUMNS` continua sem pedir `owner_id`, e
   *  nenhum mapper o copia. Duas defesas independentes: a segunda protege se
   *  alguém um dia reintroduzir a coluna na view. */
  owner_id?: string | null;

  intent: string;
  title: string;
  category: string;
  subcategory_type: string | null;
  condition: string | null;

  brand: string | null;
  model: string | null;
  year_min: number | null;
  year_max: number | null;
  year: number | null;
  hours_used: number | null;
  mileage_km: number | null;
  power_hp: number | null;

  price: number | string;
  price_negotiable: boolean | null;
  budget_range: string | null;
  accepts_trade: boolean | null;

  location_state: string | null;
  location_city: string | null;
  description: string | null;

  images: string[] | null;
  video_url: string | null;
  has_verified_video: boolean | null;

  urgency: string | null;
  geo_preference: string | null;

  /** Liberados por gatilho/pagamento no banco. Chegam na leitura, nunca no
   *  INSERT. Opcionais porque nem toda `select` os pede — a pública não pede. */
  tier?: string | null;
  badge?: string | null;
  highlight_days?: number | null;

  status: string | null;
  is_paused: boolean | null;

  cpf: string | null;
  user_phone: string | null;
  pix_key: string | null;

  created_at: string | null;
  updated_at: string | null;
}

/**
 * ColunasPedidas numa leitura PÚBLICA.
 *
 * Nomes reais da view `public_listings` (ver banco/02-view-public_listings.sql).
 * A lista é explícita de propósito: `select=*` traria `owner_id` junto.
 *
 * NÃO entram aqui, em nenhuma hipótese: owner_id, cpf, user_phone, pix_key.
 */
export const PUBLIC_LISTING_COLUMNS =
  'id,intent,title,category,subcategory_type,condition,' +
  'brand,model,year_min,year_max,year,hours_used,mileage_km,power_hp,' +
  'price,price_negotiable,budget_range,accepts_trade,' +
  'location_state,location_city,description,' +
  'images,video_url,has_verified_video,' +
  'urgency,geo_preference,status,is_paused,created_at,updated_at';

/**
 * Colunas pedidas numa leitura PRIVADA (dono logado, sob RLS).
 *
 * Além das públicas, entram:
 *   - `cpf` e `user_phone`: o dono precisa ver o próprio contato.
 *   - `tier`, `badge`, `highlight_days`: o DONO precisa ver o PRÓPRIO plano.
 *     Sem estas três, `privateRowToItem` cairia no padrão (free / none / 0) e
 *     o vendedor veria o premium que acabou de pagar como se não existisse.
 *     Isto é leitura do próprio usuário, coberta pelo RLS — não é vazamento.
 *
 * `pix_key` NÃO é pedido: nenhuma tela precisa dele, e quanto menos dado
 * circula, melhor.
 */
export const PRIVATE_LISTING_COLUMNS =
  PUBLIC_LISTING_COLUMNS + ',cpf,user_phone,tier,badge,highlight_days';

/* ─────────────────────────── normalização ─────────────────────────── */

const INTENTS = ['buy', 'sell'] as const;
const CONDITIONS = ['novo', 'usado', 'indiferente'] as const;
const APP_STATUSES = ['active', 'in_negotiation', 'matched', 'closed'] as const;
type Urgency = NonNullable<ListingItem['urgency']>;
const URGENCIES: ReadonlyArray<Urgency> = ['imediata', '30_dias', 'pesquisando'];
const BUDGET_RANGES: ReadonlyArray<BudgetRangeType> = [
  'ate_100k',
  '100k_a_200k',
  '200k_a_500k',
  'acima_500k',
  'a_combinar',
];

/**
 * `oneOf` centraliza a checagem de enum em runtime: só devolve o valor se for
 * string E estiver na lista. Qualquer outra coisa (null, número, lixo) dá
 * undefined, e quem chama decide o fallback.
 */
const oneOf = <T extends string>(raw: unknown, allowed: readonly T[]): T | undefined =>
  typeof raw === 'string' && (allowed as readonly string[]).includes(raw)
    ? (raw as T)
    : undefined;

/**
 * `geo_preference` é `text` livre no SQL, sem check nenhum. Então aqui a gente
 * limpa antes de comparar: sem caixa e sem espaço sobrando.
 *
 * Valor fora da lista vira `undefined` — nunca "Brasil". Errar para o padrão
 * faria o app anunciar a máquina para o país inteiro quando o vendedor só
 * queria o próprio estado.
 */
export const normalizeGeoPreference = (raw: unknown): GeoPreferenceType | undefined =>
  oneOf<GeoPreferenceType>(
    typeof raw === 'string' ? raw.trim().toLowerCase() : raw,
    ['so_estado', 'brasil_todo']
  );

/** `true` só com string que não seja vazia. */
const asText = (v: unknown): string => (typeof v === 'string' ? v : '');

const asNum = (v: unknown): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};

const asBool = (v: unknown): boolean | undefined =>
  v === null || v === undefined ? undefined : Boolean(v);

/** `numeric` volta do PostgREST como string; o app quer number. */
const asPrice = (v: unknown): number => asNum(v) ?? 0;

const asImages = (v: unknown): string[] | undefined => {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === 'string');
  if (typeof v === 'string' && v.trim()) {
    // Postgres às vezes devolve array como literal: {a,b}
    const t = v.trim().replace(/^\{|\}$/g, '');
    return t ? t.split(',').map((s) => s.trim()).filter(Boolean) : [];
  }
  return undefined;
};

/** Retorna `null` quando o intent é inválido — quem chama decide o que fazer. */
export const normalizeIntent = (raw: unknown): IntentType | null =>
  oneOf<IntentType>(raw, INTENTS) ?? null;

/**
 * Pausa: o SQL tem `is_paused` E `'paused'` dentro do check de `status`,
 * mas o ListingItem só conhece `isPaused` e 4 status. A regra aqui:
 *
 *  - `is_paused = true` OU `status = 'paused'`  ->  `isPaused: true`
 *  - `status = 'paused'` não existe no app: vira `'closed'` (o mais
 *    restritivo que o app consegue representar — some do feed ativo).
 *    O UUID não mente, mas o app precisa de um valor que ele saiba ler.
 *  - status ausente/null -> `'active'`
 *  - status fora da lista -> `'closed'` (falha fechada: na dúvida, some)
 */
export const normalizeStatus = (
  raw: unknown,
  isPausedCol: unknown
): { status: ListingItem['status']; isPaused: boolean } => {
  const pausado = isPausedCol === true || raw === 'paused';
  if (raw === null || raw === undefined) {
    return { status: 'active', isPaused: pausado };
  }
  if (APP_STATUSES.includes(raw as ListingItem['status'])) {
    return { status: raw as ListingItem['status'], isPaused: pausado };
  }
  // 'paused' e qualquer valor corrompido caem aqui.
  return { status: 'closed', isPaused: pausado };
};

const normalizeCondition = (raw: unknown): ConditionType =>
  oneOf<ConditionType>(raw, CONDITIONS) ?? 'usado';

const normalizeUrgency = (raw: unknown): ListingItem['urgency'] =>
  oneOf<Urgency>(raw, URGENCIES);

const normalizeBudget = (raw: unknown): BudgetRangeType | undefined =>
  oneOf<BudgetRangeType>(raw, BUDGET_RANGES);

const normalizeBadge = (raw: unknown): ListingItem['badge'] =>
  oneOf<'premium' | 'verified'>(raw, ['premium', 'verified']) ?? 'none';

/** `tier` é `text` no SQL, sem check. Só o app sabe o que é válido. */
const TIERS = [
  'free', 'premium_10', 'premium_15', 'premium_20', 'premium_25',
  'dealer', 'dealer_10', 'dealer_30',
] as const;

type Tier = NonNullable<ListingItem['tier']>;
const normalizeTier = (raw: unknown): ListingItem['tier'] =>
  oneOf<Tier>(raw, TIERS) ?? 'free';

/* ─────────────────────────── conversões ─────────────────────────── */

/**
 * LINHA PÚBLICA -> ListingItem.
 *
 * Montado campo a campo. Sem spread: qualquer coluna nova que o banco
 * traga fica de fora por construção, não por esquecimento.
 *
 * Devolve `null` quando o `intent` é inválido — linha corrompida não entra
 * na vitrine.
 *
 * Não existe `ownerId` no ListingItem público: quem navega não precisa saber
 * de quem é o anúncio.
 */
export const publicRowToItem = (row: ListingRow): ListingItem | null => {
  const intent = normalizeIntent(row.intent);
  if (!intent) return null;

  const { status, isPaused } = normalizeStatus(row.status, row.is_paused);

  return {
    id: asText(row.id),
    intent,
    title: asText(row.title),
    category: asText(row.category),
    subcategoryType: asText(row.subcategory_type) || asText(row.category),
    condition: normalizeCondition(row.condition),
    brand: asText(row.brand) || undefined,
    model: asText(row.model) || undefined,
    yearMin: asNum(row.year_min),
    yearMax: asNum(row.year_max),
    year: asNum(row.year),
    hoursUsed: asNum(row.hours_used),
    mileageKm: asNum(row.mileage_km),
    powerHp: asNum(row.power_hp),
    price: asPrice(row.price),
    budgetRange: normalizeBudget(row.budget_range),
    priceNegotiable: asBool(row.price_negotiable) ?? false,
    acceptsTrade: asBool(row.accepts_trade) ?? false,
    locationState: asText(row.location_state),
    locationCity: asText(row.location_city),
    description: asText(row.description),
    userName: asText((row as { user_name?: unknown }).user_name) || 'Vendedor Verificado',
    userPhone: '',
    createdAt: asText(row.created_at) || new Date(0).toISOString(),
    status,
    images: asImages(row.images),
    urgency: normalizeUrgency(row.urgency),
    // A vitrine ZERA o plano de propósito: selo e destaque são decisão de
    // apresentação do feed, e a coluna nem entra na seleção pública.
    tier: 'free',
    highlightDays: 0,
    badge: 'none',
    videoUrl: asText(row.video_url) || undefined,
    hasVerifiedVideo: asBool(row.has_verified_video) ?? false,
    geoPreference: normalizeGeoPreference(row.geo_preference),
    isPaused,
  };
};

/**
 * LINHA PRIVADA -> ListingItem (dono logado, leitura sob RLS).
 *
 * Traz `cpf` e `user_phone` porque o dono precisa ver o próprio contato.
 * `pix_key` NÃO é copiado — não existe no ListingItem, e o pedido de coluna
 * acima também não o traz.
 *
 * Quando `user_name` vier junto (join futuro com `profiles`), respeita;
 * senão cai no rótulo genérico, como antes.
 */
export const privateRowToItem = (row: ListingRow): ListingItem => {
  const intent = normalizeIntent(row.intent) ?? 'sell';
  const { status, isPaused } = normalizeStatus(row.status, row.is_paused);

  return {
    id: asText(row.id),
    intent,
    title: asText(row.title),
    category: asText(row.category),
    subcategoryType: asText(row.subcategory_type) || asText(row.category),
    condition: normalizeCondition(row.condition),
    brand: asText(row.brand) || undefined,
    model: asText(row.model) || undefined,
    yearMin: asNum(row.year_min),
    yearMax: asNum(row.year_max),
    year: asNum(row.year),
    hoursUsed: asNum(row.hours_used),
    mileageKm: asNum(row.mileage_km),
    powerHp: asNum(row.power_hp),
    price: asPrice(row.price),
    budgetRange: normalizeBudget(row.budget_range),
    priceNegotiable: asBool(row.price_negotiable) ?? false,
    acceptsTrade: asBool(row.accepts_trade) ?? false,
    locationState: asText(row.location_state),
    locationCity: asText(row.location_city),
    description: asText(row.description),
    userName: asText((row as { user_name?: unknown }).user_name) || 'Vendedor Verificado',
    userPhone: asText(row.user_phone),
    cpf: asText(row.cpf) || undefined,
    createdAt: asText(row.created_at) || new Date(0).toISOString(),
    status,
    images: asImages(row.images),
    urgency: normalizeUrgency(row.urgency),
    // O plano vem do gatilho/pagamento no banco. Na leitura PRIVADA o dono
    // precisa ver o próprio — é o que o separa de quem não pagou nada.
    tier: normalizeTier(row.tier),
    highlightDays: asNum(row.highlight_days) ?? 0,
    badge: normalizeBadge(row.badge),
    videoUrl: asText(row.video_url) || undefined,
    hasVerifiedVideo: asBool(row.has_verified_video) ?? false,
    geoPreference: normalizeGeoPreference(row.geo_preference),
    isPaused,
  };
};

/* ─────────────────────────── escrita ─────────────────────────── */

/** O que o app pode gravar. `owner_id` não está aqui — vem do token. */
export interface ListingInsertPayload {
  owner_id: string;
  intent: string;
  title: string;
  category: string;
  subcategory_type: string | null;
  condition: string | null;
  brand: string | null;
  model: string | null;
  year_min: number | null;
  year_max: number | null;
  year: number | null;
  hours_used: number | null;
  mileage_km: number | null;
  power_hp: number | null;
  price: number;
  price_negotiable: boolean;
  budget_range: string | null;
  accepts_trade: boolean;
  location_state: string | null;
  location_city: string | null;
  description: string | null;
  images: string[];
  video_url: string | null;
  urgency: string | null;
  geo_preference: string | null;
  status: string;
  is_paused: boolean;
  cpf: string | null;
  user_phone: string | null;
}

/**
 * ListingItem -> payload de INSERT.
 *
 * `authenticatedUserId` é obrigatório e vem do token (auth.uid()). O
 * `item.ownerId` é IGNORADO de propósito: se o app mandasse o id, qualquer
 * página could escrever anúncio no nome de outra pessoa. Quem decide o dono
 * é o servidor, não o cliente.
 *
 * Também saem do payload, sem exceção: tier, badge, highlight_days e
 * has_verified_video. São liberados por gatilho/pagamento no banco; se
 * viessem do cliente, qualquer um se auto-marcaria como verificado.
 */
export const toListingInsert = (
  item: ListingItem,
  authenticatedUserId: string
): ListingInsertPayload => {
  if (!authenticatedUserId) {
    throw new Error('toListingInsert: authenticatedUserId é obrigatório');
  }
  if (!item || typeof item !== 'object') {
    throw new Error('toListingInsert: item é obrigatório');
  }

  return {
    owner_id: authenticatedUserId,
    ...payloadDoAnuncio(item),
  };
};

/**
 * O payload de um anúncio, SEM o dono.
 *
 * Insert e update usam o MESMO construtor, de propósito. Se os dois tivessem
 * listas próprias, um campo novo poderia entrar num e não no outro — e o
 * anúncio apareceria no painel do dono com a edição de yesterday, ou pior:
 * a edição apagaria um campo que o insert gravava.
 *
 * `owner_id` fica de fora porque o dono de um anúncio não muda: ele é quem
 * o criou, e isso é decided no servidor, pela RLS. Deixar o cliente
 * reescrever `owner_id` seria dar a ele a chave da fechadura.
 */
export const payloadDoAnuncio = (
  item: ListingItem
): Omit<ListingInsertPayload, 'owner_id'> => {
  if (!item || typeof item !== 'object') {
    throw new Error('payloadDoAnuncio: item é obrigatório');
  }

  return {
    intent: normalizeIntent(item.intent) ?? 'sell',
    title: asText(item.title),
    category: asText(item.category),
    subcategory_type: asText(item.subcategoryType) || null,
    condition: item.condition ?? null,
    brand: asText(item.brand) || null,
    model: asText(item.model) || null,
    year_min: asNum(item.yearMin) ?? null,
    year_max: asNum(item.yearMax) ?? null,
    year: asNum(item.year) ?? null,
    hours_used: asNum(item.hoursUsed) ?? null,
    mileage_km: asNum(item.mileageKm) ?? null,
    power_hp: asNum(item.powerHp) ?? null,
    price: asPrice(item.price),
    price_negotiable: Boolean(item.priceNegotiable),
    budget_range: item.budgetRange ?? null,
    accepts_trade: Boolean(item.acceptsTrade),
    location_state: asText(item.locationState) || null,
    location_city: asText(item.locationCity) || null,
    description: asText(item.description) || null,
    images: Array.isArray(item.images) ? item.images.filter((x) => typeof x === 'string') : [],
    video_url: asText(item.videoUrl) || null,
    urgency: item.urgency ?? null,
    geo_preference: item.geoPreference ?? null,
    status: item.status === 'closed' ? 'closed' : 'active',
    is_paused: Boolean(item.isPaused),
    cpf: asText(item.cpf) || null,
    user_phone: asText(item.userPhone) || null,
  };
};

/**
 * O payload de uma EDIÇÃO.
 *
 * É o payload do anúncio sem o dono. Três coisas ficam de fora de propósito:
 *
 *   - `owner_id`: o dono de um anúncio não muda. Quem edita é o dono, e isso
 *     é o servidor que decide (RLS). Se o cliente pudesse reescrever
 *     `owner_id`, bastaria um `owner_id` no corpo da requisição para
 *    ublishing o anúncio de outra pessoa.
 *   - `tier`, `badge`, `highlight_days`, `has_verified_video`: são liberados
 *     por gatilho e por pagamento, no banco. Um cliente que os escrevesse
 *     estaria se auto-marcando como verificado.
 *   - `created_at`: quando o anúncio nasceu. Editar não muda o nascimento.
 */
export const toListingUpdate = (
  item: ListingItem
): Omit<ListingInsertPayload, 'owner_id'> => payloadDoAnuncio(item);

/* ═══════════════════════════════════════════════════════════════════════
   FIM DA CAMADA DE MAPEAMENTO

   Abaixo fica o código antigo, que continua em uso pelas telas.
   ═══════════════════════════════════════════════════════════════════════ */

/**
 * Interface do Produto Público retornado pelas queries do Supabase/API.
 *
 * ATENÇÃO — esta interface está em português e NÃO bate com a view
 * `public_listings`, que é em inglês (title, category, price...). Está
 * mantida só para não quebrar as telas que consomem. O caminho novo é
 * `publicRowToItem` + `PUBLIC_LISTING_COLUMNS`.
 */
export interface PublicProductData {
  id: string;
  titulo: string;
  categoria: string;
  marca?: string;
  modelo?: string;
  preco: number;
  cidade: string;
  estado: string;
  fotos?: string[];
  video_url?: string;
  vendedor_nome: string;
  descricao?: string;
  ano?: number;
  horas_uso?: number;
  quilometragem?: number;
}

/** Colunas em português, mantidas por compatibilidade. Ver PUBLIC_LISTING_COLUMNS. */
export const SUPABASE_PUBLIC_PRODUCT_COLUMNS =
  'id, titulo, categoria, marca, modelo, preco, cidade, estado, fotos, video_url, vendedor_nome' as const;

/**
 * Sanitizador de item público — para objeto que JÁ ESTÁ no navegador.
 *
 * ┌─ DIFERENÇA IMPORTANTE ─────────────────────────────────────────────┐
 * │ Este NÃO é o DTO público do Supabase.                              │
 * │ O DTO é `publicRowToItem()`, e ele NUNCA carrega `owner_id` —       │
 * │ a vitrine pública não precisa saber de quem é o anúncio.          │
 * │                                                                   │
 * │ Aqui a entrada é um ListingItem que já estava no localStorage      │
 * │ ou no state do React. O `ownerId` que existe nele já estava no    │
 * │ dispositivo de quem está olhando — remover não evita nada, só      │
 * │ quebraria o botão de editar.                                      │
 * │                                                                   │
 * │ Verificação de que não vaza:                                      │
 * │  - nenhum componente .tsx lê `ownerId` (só utils/ownerAuth.ts);   │
 * │  - updateProductMetaTags() monta cada meta com UM campo, nunca    │
 * │    serializa o objeto inteiro.                                     │
 * │                                                                   │
 * │ Autorização real é RLS no Supabase. Isto aqui é só interface.      │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * Montado campo a campo: `pixKey` e qualquer propriedade inesperada
 * somem, em vez de virem junto num `...item`.
 *
 * Mantém a assinatura `(ListingItem) => ListingItem` porque há 6 chamadas
 * em App.tsx que passam o resultado para `setSelectedItemForDetail`.
 */
export const sanitizePublicProduct = (item: ListingItem): ListingItem => {
  const base = publicRowToItem(itemToPublicRow(item));
  const seguro: ListingItem = base
    ? base
    : {
        id: asText(item?.id),
        intent: 'sell',
        title: asText(item?.title),
        category: asText(item?.category),
        subcategoryType: asText(item?.subcategoryType) || asText(item?.category),
        condition: 'usado',
        price: 0,
        priceNegotiable: false,
        locationState: '',
        locationCity: '',
        description: '',
        userName: 'Vendedor Verificado',
        userPhone: '',
        createdAt: asText(item?.createdAt) || new Date(0).toISOString(),
        status: 'closed',
        highlightDays: 0,
        badge: 'none',
        hasVerifiedVideo: false,
      };

  // Dono do anúncio, para o botão de editar. Só o item local tem isso — e é
  // o mesmo id que já estava no dispositivo. NÃO usar isso como autorização:
  // quem manda é o RLS do Supabase (ver README).
  // Só entra se for string de verdade: id vazio ou só com espaço é lixo e
  // não vira campo — senão o objeto carregaria um `ownerId` que não compara
  // com nada.
  const ownerId = typeof item?.ownerId === 'string' ? item.ownerId.trim() : '';
  if (!ownerId) return seguro;

  // Sem spread de propósito. `seguro` acabou de nascer aqui — é um objeto
  // novo, montado campo a campo — então atribuir direto não copia nada alheio.
  // Se amanhã alguém mudar a construção de `seguro`, a garantia continua
  // valendo por construção, e não por estar copiando uma lista de campos.
  seguro.ownerId = ownerId;
  return seguro;
};

/**
 * ListingItem -> ListingRow, para reaproveitar os mappers acima num objeto
 * que já está em memória (localStorage, state do React).
 * Só o que a vitrine pública pode ter: sem cpf, sem userPhone, sem ownerId.
 */
const itemToPublicRow = (item: ListingItem): ListingRow => ({
  id: item.id,
  intent: item.intent,
  title: item.title,
  category: item.category,
  subcategory_type: item.subcategoryType ?? null,
  condition: item.condition ?? null,
  brand: item.brand ?? null,
  model: item.model ?? null,
  year_min: item.yearMin ?? null,
  year_max: item.yearMax ?? null,
  year: item.year ?? null,
  hours_used: item.hoursUsed ?? null,
  mileage_km: item.mileageKm ?? null,
  power_hp: item.powerHp ?? null,
  price: item.price,
  price_negotiable: item.priceNegotiable ?? null,
  budget_range: item.budgetRange ?? null,
  accepts_trade: item.acceptsTrade ?? null,
  location_state: item.locationState ?? null,
  location_city: item.locationCity ?? null,
  description: item.description ?? null,
  images: item.images ?? null,
  video_url: item.videoUrl ?? null,
  has_verified_video: item.hasVerifiedVideo ?? null,
  urgency: item.urgency ?? null,
  geo_preference: item.geoPreference ?? null,
  status: item.status ?? null,
  is_paused: item.isPaused ?? null,
  cpf: null,
  user_phone: null,
  pix_key: null,
  created_at: item.createdAt ?? null,
  updated_at: null,
});

/**
 * Busca o produto público.
 *
 * Hoje ainda lê de `fallbackListings` (localStorage) — o cliente Supabase
 * entra por injeção, então este arquivo não depende do pacote:
 *
 *   supabase.from('public_listings').select(PUBLIC_LISTING_COLUMNS).eq('id', id)
 */
export const fetchPublicProductFromSupabase = async (
  productId: string,
  fallbackListings: ListingItem[]
): Promise<PublicProductData | null> => {
  const found = fallbackListings.find((it) => it.id === productId || it.id.includes(productId));
  if (!found) return null;

  return {
    id: found.id,
    titulo: found.title,
    categoria: found.category,
    marca: found.brand,
    modelo: found.model,
    preco: found.price,
    cidade: found.locationCity,
    estado: found.locationState,
    fotos: found.images,
    video_url: found.videoUrl,
    vendedor_nome: found.userName || 'Vendedor Verificado',
    descricao: found.description,
    ano: found.year,
    horas_uso: found.hoursUsed,
    quilometragem: found.mileageKm,
  };
};
