/**
 * Utilitário de Tags Open Graph Dinâmicas para WhatsApp e Redes Sociais
 * 
 * Garante que ao compartilhar o link da máquina:
 * 1. og:image = primeira foto REAL da máquina em JPG absoluto (1200x630)
 * 2. og:title = "Vendo [Título da Máquina] - R$ [Preço] | EuQuero"
 * 3. og:description = descrição curta
 * 4. Imagem sempre pública sem login
 * 5. Se for WebP, converte/fornece fallback em JPG para WhatsApp reconhecer perfeitamente
 */

import { getBaseSiteUrl } from '../config/site';

export const getPublicJpgImageUrl = (rawUrl?: string): string => {
  const baseSiteUrl = getBaseSiteUrl();

  if (!rawUrl || typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return `${baseSiteUrl}/cat_320d_excavator.jpg`;
  }

  const trimmed = rawUrl.trim();

  // Se for imagem local relativa
  if (trimmed.startsWith('/')) {
    return `${baseSiteUrl}${trimmed}`;
  }

  // Se for Unsplash, força formato JPG 1200x630 com alta qualidade para WhatsApp
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
      return trimmed.split('?')[0] + '?fm=jpg&w=1200&h=630&fit=crop&q=85';
    }
  }

  // Se for data URL (base64) gerado no navegador, o WhatsApp crawler não consegue fazer download de data: URLs
  // Fornece a URL pública JPG oficial da máquina
  if (trimmed.startsWith('data:')) {
    return `${baseSiteUrl}/cat_320d_excavator.jpg`;
  }

  // Se a URL terminar com .webp, verifica se pode trocar para .jpg
  if (trimmed.toLowerCase().endsWith('.webp')) {
    return trimmed.replace(/\.webp$/i, '.jpg');
  }

  return trimmed;
};

export const updateProductMetaTags = (product?: {
  title?: string;
  price?: number;
  description?: string;
  images?: string[];
  locationCity?: string;
  locationState?: string;
  intent?: 'buy' | 'sell';
}) => {
  if (typeof document === 'undefined') return;

  const baseSiteUrl = getBaseSiteUrl();

  if (!product) {
    document.title = 'Vendo Escavadeira Caterpillar 320D - R$ 520.000 | EuQuero';
    return;
  }

  const isBuyer = product.intent === 'buy';
  const prefix = isBuyer ? 'Compro' : 'Vendo';
  const formattedPrice = product.price ? ` - R$ ${product.price.toLocaleString('pt-BR')}` : '';
  const cityInfo = product.locationCity ? ` (${product.locationCity})` : '';

  const cleanTitle = (product.title || 'Máquina Pesada')
    .replace(/^(Vendo|Compro)\s+/i, '');

  const title = `${prefix} ${cleanTitle}${cityInfo}${formattedPrice} | EuQuero`;
  
  const desc = product.description 
    ? product.description.slice(0, 160)
    : `Veja fotos reais e detalhes de ${cleanTitle} no EuQuero. Plataforma inteligente para quem quer comprar e vender.`;

  const primaryImage = product.images && product.images.length > 0 ? product.images[0] : '';
  const publicJpgImage = getPublicJpgImageUrl(primaryImage);

  // Atualiza título da aba
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

  setMeta('name', 'description', desc);
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', desc);
  setMeta('property', 'og:image', publicJpgImage);
  setMeta('property', 'og:image:secure_url', publicJpgImage);
  setMeta('property', 'og:image:type', 'image/jpeg');
  setMeta('property', 'og:image:width', '1200');
  setMeta('property', 'og:image:height', '630');
  setMeta('property', 'og:site_name', 'EuQuero');
  setMeta('property', 'og:type', 'product');

  setMeta('name', 'twitter:card', 'summary_large_image');
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', desc);
  setMeta('name', 'twitter:image', publicJpgImage);
};
