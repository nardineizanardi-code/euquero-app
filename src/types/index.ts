export type IntentType = 'buy' | 'sell';

export type ConditionType = 'novo' | 'usado' | 'indiferente';

export type GeoPreferenceType = 'so_estado' | 'brasil_todo';

/**
 * Faixas de orçamento realistas e padronizadas para qualificação de compra
 */
export type BudgetRangeType =
  | 'ate_100k'      // "Até R$ 100.000"
  | '100k_a_200k'   // "R$ 100k a R$ 200k"
  | '200k_a_500k'   // "R$ 200k a R$ 500k"
  | 'acima_500k'    // "Acima de R$ 500k"
  | 'a_combinar';   // "A combinar"

/**
 * Objeto de Preferência e Qualificação do Comprador (Quero Comprar)
 */
export interface PreferenciaCompra {
  id?: string;
  category: string;
  subcategoryType: string;
  condition: ConditionType;
  brand?: string;
  model?: string;
  yearMin?: number;
  yearMax?: number;
  /** Campo OBRIGATÓRIO de qualificação do comprador */
  budgetRange: BudgetRangeType;
  /** Teto numérico correspondente para o algoritmo de match e filtros */
  maxBudgetAmount?: number;
  /** Campos Dinâmicos por Categoria */
  propertyType?: string; // Para Imóveis: 'Casa', 'Apartamento', 'Terreno', 'Galpão'
  areaM2?: number; // Para Imóveis: Metragem total m²
  bedrooms?: number; // Para Imóveis: Número de quartos (ou undefined se n/a)
  powerHp?: number; // Para Agronegócio: Potência em CV
  maxHoursUsed?: number; // Para Máquinas: Teto de horímetro desejado
  maxMileageKm?: number; // Para Veículos: Teto de km desejado
  priceNegotiable: boolean;
  locationState: string;
  locationCity: string;
  userName: string;
  userPhone: string;
  urgency?: 'imediata' | '30_dias' | 'pesquisando';
  acceptsTrade?: boolean;
}

export type CategoryStatus = 'active';

export interface CategorySpec {
  id: string;
  name: string;
  description: string;
  iconName: string;
  image?: string;
  types: string[];
  brands: string[];
  popularModels?: Record<string, string[]>;
  status?: CategoryStatus;
}

export interface ListingItem {
  id: string;
  intent: IntentType; // 'buy' = Quero Comprar, 'sell' = Quero Vender
  /**
   * DE ONDE VEM ESTE ANÚNCIO.
   *
   * O app tem duas origens de announcements e elas não podem se
   * misturar sem aviso: a de DEMONSTRAÇÃO (o `INITIAL_LISTINGS`, que
   * vem no bundle) e a REAL (veio do banco, ou foi criado pela
   * pessoa). Sem esta marca, o feed mostra peça de vitrine do mesmo
   * jeito que mostra anúncio de gente, e o contador não distingue
   * "12 anúncios" de "12 anúncios, 10 de mentira".
   *
   * `undefined` é tratado como 'real' — um item que não foi marcado
   * veio do caminho normal, que é o do usuário.
   */
  origem?: 'demonstracao' | 'real';
  title: string;
  category: string; // 'maquinas', 'veiculos', 'imoveis', 'agro', 'equipamentos'
  subcategoryType: string; // Ex: 'Escavadeira Hidráulica', 'Retroescavadeira', 'Caminhonete'
  condition: ConditionType; // 'novo' | 'usado'
  brand?: string; // Ex: 'Caterpillar', 'JCB', 'Toyota'
  model?: string; // Ex: '320D', '3CX', 'Hilux'
  yearMin?: number;
  yearMax?: number;
  year?: number; // Exact year for sellers
  hoursUsed?: number; // Para máquinas usadas (horímetro)
  mileageKm?: number; // Para veículos usados
  propertyType?: string; // Para Imóveis: 'Casa', 'Apartamento', 'Terreno', 'Galpão'
  areaM2?: number; // Metragem total m²
  bedrooms?: number; // Número de quartos
  powerHp?: number; // Potência em CV para Agronegócio
    /**
     * Preço ofertado (venda) ou orçamento máximo (procura).
     *
     * mini-1.2d: pode ser null. Para a PROCURA, null significa "a
     * pessoa não informou orçamento" — e null é diferente de 0:
     * 0 é um número falso que barra a busca e aparece como "R$ 0,00".
     * A coluna no banco é `not null default 0`, então o insert da
     * procura segue mandando 0 por baixo; o que a tela e os filtros
     * veem é null. Para a VENDA, o preço é obrigatório e sempre vem
     * preenchido.
     */
    price: number | null;
  budgetRange?: BudgetRangeType; // Faixa de orçamento qualificada
  /**
   * mini-1.2c: teto que a pessoa escreveu no campo "Orçamento até".
   * É o que filtra a tela de resultados — diferente de `price`, que é
   * o valor da própria demanda. Ausente = a pessoa não preencheu, e
   * então o orçamento NÃO filtra.
   */
  orcamentoMax?: number | null;
  /**
   * mini-1.2d: horas MÁXIMAS que a pessoa pediu ("até X horas").
   * É o filtro de horímetro da tela de resultados. Ausente = a
   * pessoa não pediu limite de horas, e então não filtra.
   *
   * `hoursUsed` é o horímetro do ANÚNCIO à venda — o valor que o
   * filtro compara. Este aqui é o limite pedido na procura.
   */
  maxHoursUsed?: number | null;
  /**
   * mini-1.2d: ano MÍNIMO que a pessoa pediu ("a partir de X").
   * Ausente = não filtra por ano.
   */
  minYear?: number | null;
  priceNegotiable: boolean;
  locationState: string; // Ex: 'SP', 'MG', 'PR'
  locationCity: string;
  description: string;
  userName: string;
  userPhone: string;
  userRole?: string; // 'Construtora', 'Produtor Rural', 'Autônomo', 'Investidor'
  userAvatar?: string;
  createdAt: string;
  status: 'active' | 'in_negotiation' | 'matched' | 'closed';
  images?: string[];
  urgency?: 'imediata' | '30_dias' | 'pesquisando';
  acceptsTrade?: boolean; // Aceita permuta/troca
  tier?: 'free' | 'premium_15' | 'premium_25' | 'dealer_10' | 'dealer_30' | 'premium_10' | 'premium_20' | 'dealer';
  highlightDays?: number;
  badge?: 'none' | 'premium' | 'verified';
  videoUrl?: string;
  tour360Url?: string;
  cpf?: string;
  expiresAt?: string;
  hasVerifiedVideo?: boolean;
  geoPreference?: GeoPreferenceType;
  ownerId?: string;
  isPaused?: boolean;
}

export type PhotoPlanTier = 
  | 'free' 
  | 'premium_15' 
  | 'premium_25' 
  | 'dealer_10' 
  | 'dealer_30' 
  | 'premium_10' 
  | 'premium_20' 
  | 'dealer';

export interface PhotoPlanConfig {
  id: PhotoPlanTier;
  title: string;
  priceLabel: string;
  priceValue: number;
  periodLabel: string;
  maxPhotos: number;
  highlightDays: number;
  badge?: 'none' | 'premium' | 'verified';
  hasVideo: boolean;
  benefits: string[];
  popular?: boolean;
}

export interface MatchResult {
  id: string;
  buyerDemand: ListingItem;
  sellerListing: ListingItem;
  score: number; // 0 - 100%
  reasons: string[];
  gaps?: string[];
  createdAt: string;
  status: 'new' | 'contacted' | 'negotiating' | 'completed' | 'dismissed';
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderName: string;
  senderIntent: IntentType;
  text: string;
  timestamp: string;
  proposalPrice?: number;
  proposalStatus?: 'pending' | 'accepted' | 'declined';
}

export interface ProcuraPublica {
  id: string;
  titulo: string;            // "Escavadeira CAT 320D"
  subcategoria: string;
  marcaModelo: string;
  anoMin: number;
  anoMax: number;
  orcamentoMax: number;      // em centavos
  cidade: string;
  estado: string;
  estadoAlcance: 'so_estado' | 'brasil';
  criadaEm: string;          // ISO
  expiracao: string;         // ISO
  compradoresInteressados: number; // precisa ser REAL, nunca fixo
}

