/**
 * Utilitário de Otimização e Redimensionamento de Imagens para Feed
 * 
 * Suporta:
 * 1. URLs do Unsplash (w, q, auto=format, fit=crop)
 * 2. URLs de CDN/Proxy de Imagens
 * 3. URLs data: ou relativas locais (retorna com segurança)
 * 4. Geração de srcset e sizes para renderização responsiva ultrarrápida
 */

export interface OptimizedImageSource {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/**
 * Redimensiona e otimiza uma URL de imagem para largura e qualidade alvo
 */
export function getOptimizedImageUrl(
  originalUrl?: string,
  width: number = 640,
  quality: number = 80
): string {
  if (!originalUrl || typeof originalUrl !== 'string') return '';

  const trimmed = originalUrl.trim();
  if (!trimmed) return '';

  // Data URLs ou imagens locais estáticas
  if (trimmed.startsWith('data:') || trimmed.startsWith('/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);

    // Otimização inteligente para Unsplash
    if (url.hostname.includes('unsplash.com')) {
      url.searchParams.set('w', width.toString());
      url.searchParams.set('q', quality.toString());
      url.searchParams.set('auto', 'format');
      url.searchParams.set('fit', 'crop');
      return url.toString();
    }

    // Otimização para Cloudinary se presente
    if (url.hostname.includes('cloudinary.com') && url.pathname.includes('/upload/')) {
      const parts = url.pathname.split('/upload/');
      return `${url.origin}${parts[0]}/upload/w_${width},q_${quality},c_limit,f_auto/${parts[1]}`;
    }

    // Otimização para Supabase Storage se presente
    if (url.hostname.includes('supabase.co') && url.pathname.includes('/object/public/')) {
      // Suporte para Supabase image transformation se ativo ou URL padrão
      url.searchParams.set('width', width.toString());
      url.searchParams.set('quality', quality.toString());
      return url.toString();
    }

    return trimmed;
  } catch (e) {
    return trimmed;
  }
}

/**
 * Cria configuração responsiva (src, srcSet e sizes) para tags <img>
 */
export function getResponsiveImageProps(
  originalUrl?: string,
  widths: number[] = [320, 480, 640, 800, 1024],
  defaultWidth: number = 640
): { src: string; srcSet?: string; sizes?: string } {
  if (!originalUrl) {
    return { src: '' };
  }

  const defaultSrc = getOptimizedImageUrl(originalUrl, defaultWidth);

  // Se for data url ou local simples, não cria srcSet pesado desnecessário
  if (originalUrl.startsWith('data:') || originalUrl.startsWith('blob:')) {
    return { src: defaultSrc };
  }

  // Gera srcSet com múltiplas densidades/larguras
  const srcSet = widths
    .map((w) => `${getOptimizedImageUrl(originalUrl, w)} ${w}w`)
    .join(', ');

  const sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 640px';

  return {
    src: defaultSrc,
    srcSet,
    sizes,
  };
}
