import { ListingItem } from '../types';

/**
 * Configuração de URLs e Ambiente:
 * Garante compatibilidade tanto no domínio principal https://www.euquero.app.br
 * quanto no domínio de preview da Vercel (vercel.app) ou desenvolvimento local.
 * 
 * Regra: Nenhuma URL hardcoded para instâncias temporárias da Vercel.
 * Prioriza window.location.origin em runtime e fallback para o domínio principal oficial.
 */

// Domínio principal de produção configurado na Vercel (Primary Domain)
export const SITE_URL = 'https://www.euquero.app.br';
export const DEFAULT_SITE_URL = SITE_URL;

/**
 * Obtém a URL base atual da aplicação de maneira segura (runtime browser ou SSR)
 */
export const getBaseSiteUrl = (): string => {
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin;
  }
  
  // Suporte a variáveis de ambiente padrão do Vite ou Next.js
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    const viteSiteUrl = import.meta.env.VITE_SITE_URL;
    if (viteSiteUrl) return viteSiteUrl;
  }

  return DEFAULT_SITE_URL;
};

/**
 * Retorna o domínio canônico principal
 */
export const PRIMARY_DOMAIN = 'www.euquero.app.br';
