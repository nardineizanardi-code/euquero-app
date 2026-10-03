/**
 * Utilitário Unificado de Imagens de Produtos
 * 
 * Garante que:
 * 1. A FOTO 1 real do anúncio é SEMPRE a mesma no Card e no Open Graph (WhatsApp/Facebook)
 * 2. URL absoluta sempre (https://...)
 * 3. Fallbacks inteligentes por tipo de máquina (Motoniveladora, Retroescavadeira, Trator, Caminhão, etc.)
 *    NUNCA assume escavadeira CAT para outras máquinas!
 */

import { getBaseSiteUrl } from '../config/site';

/**
 * Imagens públicas reais e otimizadas em alta definição por tipo de máquina
 */
export const MACHINE_TYPE_FALLBACK_IMAGES: Record<string, string> = {
  motoniveladora: 'https://images.unsplash.com/photo-1579829366248-204fe8413f31?w=1200&h=630&fit=crop&q=85',
  retroescavadeira: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=1200&h=630&fit=crop&q=85',
  trator: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=1200&h=630&fit=crop&q=85',
  agricola: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=1200&h=630&fit=crop&q=85',
  colheitadeira: 'https://images.unsplash.com/photo-1592878904946-b3cd8ae243d0?w=1200&h=630&fit=crop&q=85',
  caminhao: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&h=630&fit=crop&q=85',
  cacamba: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=1200&h=630&fit=crop&q=85',
  rolo: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&h=630&fit=crop&q=85',
  carregadeira: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&h=630&fit=crop&q=85',
  escavadeira: '/cat_320d_excavator.jpg',
  default: 'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1200&h=630&fit=crop&q=85'
};

/**
 * Retorna a FOTO 1 real do anúncio.
 * Se o anúncio tiver fotos cadastradas, a FOTO 1 é SEMPRE a primeira do array (item.images[0]).
 * Se não tiver, busca fallback coerente com o tipo de máquina anunciado.
 */
export const getPrimaryProductImage = (item?: {
  images?: string[];
  fotos?: string[];
  title?: string;
  category?: string;
  subcategoryType?: string;
  brand?: string;
  model?: string;
}): string => {
  if (!item) {
    return MACHINE_TYPE_FALLBACK_IMAGES.escavadeira;
  }

  // 1. Fotos cadastradas no anúncio (FOTO 1 real)
  const candidatePhotos = (item.images && item.images.length > 0)
    ? item.images
    : (item.fotos && item.fotos.length > 0)
    ? item.fotos
    : [];

  if (candidatePhotos.length > 0 && candidatePhotos[0] && typeof candidatePhotos[0] === 'string' && candidatePhotos[0].trim() !== '') {
    return candidatePhotos[0].trim();
  }

  // 2. Análise do texto para fallback coerente por tipo de máquina
  const text = `${item.title || ''} ${item.subcategoryType || ''} ${item.category || ''} ${item.brand || ''} ${item.model || ''}`.toLowerCase();

  if (text.includes('motoniveladora') || text.includes('timbermach') || text.includes('grader') || text.includes('717t')) {
    return MACHINE_TYPE_FALLBACK_IMAGES.motoniveladora;
  }
  if (text.includes('retroescavadeira') || text.includes('3cx') || text.includes('backhoe')) {
    return MACHINE_TYPE_FALLBACK_IMAGES.retroescavadeira;
  }
  if (text.includes('trator') || text.includes('agricola') || text.includes('agro') || text.includes('colheitadeira') || text.includes('plantadeira')) {
    return MACHINE_TYPE_FALLBACK_IMAGES.trator;
  }
  if (text.includes('caminhao') || text.includes('truck') || text.includes('veiculos') || text.includes('cacamba') || text.includes('cavalo')) {
    return MACHINE_TYPE_FALLBACK_IMAGES.caminhao;
  }
  if (text.includes('carregadeira') || text.includes('pá')) {
    return MACHINE_TYPE_FALLBACK_IMAGES.carregadeira;
  }
  if (text.includes('rolo') || text.includes('compactador')) {
    return MACHINE_TYPE_FALLBACK_IMAGES.rolo;
  }
  if (text.includes('escavadeira') || text.includes('cat') || text.includes('320d') || text.includes('320 gc')) {
    return MACHINE_TYPE_FALLBACK_IMAGES.escavadeira;
  }

  return MACHINE_TYPE_FALLBACK_IMAGES.default;
};

/**
 * Converte qualquer URL de imagem em uma URL pública absoluta HTTPS (1200x630 ideal para WhatsApp / Facebook)
 */
export const toAbsoluteHttpsImageUrl = (rawUrl?: string, itemContext?: {
  title?: string;
  category?: string;
  subcategoryType?: string;
}): string => {
  const baseSiteUrl = getBaseSiteUrl();

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    const fallback = getPrimaryProductImage(itemContext);
    return toAbsoluteHttpsImageUrl(fallback);
  }

  const trimmed = rawUrl.trim();

  // Se já for URL absoluta HTTPS
  if (trimmed.startsWith('https://')) {
    if (trimmed.includes('unsplash.com')) {
      try {
        const parsed = new URL(trimmed);
        parsed.searchParams.set('fm', 'jpg');
        parsed.searchParams.set('w', '1200');
        parsed.searchParams.set('h', '630');
        parsed.searchParams.set('fit', 'crop');
        parsed.searchParams.set('q', '85');
        return parsed.toString();
      } catch (e) {
        return trimmed;
      }
    }
    return trimmed;
  }

  // Se for HTTP, converte para HTTPS
  if (trimmed.startsWith('http://')) {
    return trimmed.replace('http://', 'https://');
  }

  // Se for caminho relativo local (ex: /cat_320d_excavator.jpg)
  if (trimmed.startsWith('/')) {
    return `${baseSiteUrl}${trimmed}`;
  }

  // Se for base64 / data: URL criada no upload local:
  // Como WhatsApp / Facebook crawler não conseguem fazer download de data: URLs,
  // fornecemos a imagem de catálogo daquela categoria/máquina em URL absoluta
  if (trimmed.startsWith('data:')) {
    const fallback = getPrimaryProductImage(itemContext);
    if (!fallback.startsWith('data:')) {
      return toAbsoluteHttpsImageUrl(fallback);
    }
    return `${baseSiteUrl}/cat_320d_excavator.jpg`;
  }

  return `${baseSiteUrl}/${trimmed}`;
};
