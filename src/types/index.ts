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
  price: number; // Preço ofertado ou orçamento máximo do comprador
  budgetRange?: BudgetRangeType; // Faixa de orçamento qualificada
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
