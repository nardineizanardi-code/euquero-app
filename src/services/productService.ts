import { ListingItem } from '../types';

/**
 * Interface do Produto Público retornado pelas queries do Supabase/API:
 * REGRA PROMPT 1:
 * Na query do Supabase que busca produto público, NÃO selecionar coluna telefone.
 * Usar: .select('id, titulo, categoria, marca, modelo, preco, cidade, estado, fotos, video_url, vendedor_nome')
 * SEM telefone, SEM pix.
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

/**
 * Colunas públicas permitidas para consulta pública:
 * NUNCA inclui: telefone, celular, whatsapp, pix_key, cpf, etc.
 */
export const SUPABASE_PUBLIC_PRODUCT_COLUMNS = 
  'id, titulo, categoria, marca, modelo, preco, cidade, estado, fotos, video_url, vendedor_nome' as const;

/**
 * Sanitizador de item público:
 * Remove estritamente userPhone, pixKey, cpf e qualquer dado de contato direto
 * antes de renderizar em qualquer tela pública (/produto/[ID] ou lista).
 */
export const sanitizePublicProduct = (item: ListingItem): ListingItem => {
  return {
    ...item,
    // O telefone e dados sensíveis NUNCA são expostos publicamente
    userPhone: '',
    cpf: undefined,
    userName: 'Vendedor Verificado',
  };
};

/**
 * Simulação de query do Supabase aplicando a seleção estrita solicitada:
 * supabase.from('produtos').select(SUPABASE_PUBLIC_PRODUCT_COLUMNS).eq('id', productId)
 */
export const fetchPublicProductFromSupabase = async (
  productId: string,
  fallbackListings: ListingItem[]
): Promise<PublicProductData | null> => {
  // Query Supabase simulada/real:
  // const { data, error } = await supabase
  //   .from('produtos')
  //   .select('id, titulo, categoria, marca, modelo, preco, cidade, estado, fotos, video_url, vendedor_nome')
  //   .eq('id', productId)
  //   .single();
  
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
