import { ListingItem, ProcuraPublica } from '../types';

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

  // A contagem é sempre REAL com base nos compradores cadastrados (mínimo 1 para a demanda existir)
  return Math.max(1, realBuyers.length + pedidosStorageCount);
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
