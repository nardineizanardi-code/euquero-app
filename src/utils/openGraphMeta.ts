/**
 * Utilitário de Tags Open Graph Dinâmicas para WhatsApp e Facebook
 * 
 * Regras Estritas:
 * 1. og:image = FOTO 1 real do anúncio em URL absoluta (https://...)
 * 2. og:title = título real do anúncio
 * 3. og:description = preço formatado e cidade do anúncio
 * 4. Imagem em proporção adequada (1200x630) para exibição correta no preview
 */

import { getBaseSiteUrl } from '../config/site';
import { getPrimaryProductImage, toAbsoluteHttpsImageUrl } from './productImages';

export interface ProductMetaInput {
  id?: string;
  title?: string;
  price?: number;
  description?: string;
  images?: string[];
  fotos?: string[];
  locationCity?: string;
  locationState?: string;
  intent?: 'buy' | 'sell';
  category?: string;
  subcategoryType?: string;
  brand?: string;
  model?: string;
}

export const getPublicJpgImageUrl = (rawUrl?: string, context?: ProductMetaInput): string => {
  return toAbsoluteHttpsImageUrl(rawUrl, context);
};

export const updateProductMetaTags = (product?: ProductMetaInput) => {
  if (typeof document === 'undefined') return;

  const baseSiteUrl = getBaseSiteUrl();

  if (!product) {
    document.title = 'EuQuero | Compra e Venda de Máquinas e Equipamentos Pesados';
    return;
  }

  const isBuyer = product.intent === 'buy';
  const prefix = isBuyer ? 'Compro' : 'Vendo';

  // 1. TÍTULO REAL DO ANÚNCIO
  const rawTitle = (product.title || 'Máquina Pesada').trim();
  const cleanTitle = rawTitle.replace(/^(Vendo|Compro)\s+/i, '');
  const title = rawTitle.startsWith('Vendo') || rawTitle.startsWith('Compro') 
    ? `${rawTitle} | EuQuero`
    : `${prefix} ${cleanTitle} | EuQuero`;

  // 2. DESCRIÇÃO COM PREÇO E CIDADE
  const formattedPrice = product.price ? `R$ ${product.price.toLocaleString('pt-BR')}` : 'Preço a consultar';
  const cityState = product.locationCity 
    ? `${product.locationCity}${product.locationState ? `, ${product.locationState}` : ''}`
    : 'Brasil';

  const desc = `${formattedPrice} em ${cityState}. ${product.description ? product.description.slice(0, 130) : 'Confira fotos reais e detalhes da máquina no EuQuero.'}`;

  // 3. FOTO 1 REAL DO ANÚNCIO EM URL ABSOLUTA
  const primaryImage = getPrimaryProductImage(product);
  const absoluteImageUrl = toAbsoluteHttpsImageUrl(primaryImage, product);

  // 4. ATUALIZAÇÃO NO DOM (TÍTULO E META TAGS)
  document.title = title;

  const setMeta = (attr: string, value: string, content: string) => {
    let el = document.querySelector(`meta[${attr}="${value}"]`);
    if (!el) {
      el = document.createElement('meta');
      el.setAttribute(attr, value);
      document.head.appendChild(el);
    }
    el.setAttribute('content', content);
  };

  const setLink = (rel: string, href: string) => {
    let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', rel);
      document.head.appendChild(link);
    }
    link.setAttribute('href', href);
  };

  // Open Graph Padrão Facebook / WhatsApp
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:image', absoluteImageUrl);
  setMeta('property', 'og:image:secure_url', absoluteImageUrl);
  setMeta('property', 'og:image:type', absoluteImageUrl.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg');
  setMeta('property', 'og:image:width', '1200');
  setMeta('property', 'og:image:height', '630');
  setMeta('property', 'og:image:alt', product.title || 'Foto da Máquina');
  setMeta('property', 'og:type', 'product');
  setMeta('property', 'og:site_name', 'EuQuero');
  if (product.id) {
    setMeta('property', 'og:url', `${baseSiteUrl}/?produto=${encodeURIComponent(product.id)}`);
  }

  // Meta padrão e itemprop (WhatsApp e Google)
  setMeta('name', 'description', desc);
  setMeta('itemprop', 'image', absoluteImageUrl);
  setLink('image_src', absoluteImageUrl);

  // Twitter Cards
  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', absoluteImageUrl);
};
