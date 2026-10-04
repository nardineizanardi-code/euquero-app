import { ListingItem } from '../types';
import { getBaseSiteUrl } from '../config/site';

export const slugify = (text: string): string => {
  return (text || '')
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
};

/**
 * Gera o link único do produto no padrão solicitado:
 * www.euquero.app.br/produto/[ID]-[nome]-[cidade]
 */
export const generateDisplayProductLink = (item: {
  id: string;
  title: string;
  locationCity?: string;
  locationState?: string;
}): string => {
  const origin = getBaseSiteUrl();
  const machineSlug = slugify(item.title || 'maquina');
  const citySlug = slugify(item.locationCity || 'joinville');
  const stateSlug = slugify(item.locationState || 'sc');
  const cleanId = item.id;
  return `${origin}/produto/${machineSlug}-${citySlug}-${stateSlug}?produto=${encodeURIComponent(item.id)}`;
};

/**
 * Gera o link navegável absoluto dentro do app, compatível tanto em www.euquero.app.br quanto no vercel.app
 */
export const getShareableProductUrl = (item: {
  id: string;
  title: string;
  locationCity?: string;
}): string => {
  const origin = getBaseSiteUrl();
  return `${origin}/?produto=${encodeURIComponent(item.id)}`;
};

/**
 * Gera o link pessoal de convite do vendedor:
 * www.euquero.app.br/convite/[nome-vendedor]
 */
export const generateDisplayInviteLink = (sellerName: string = 'Nardinei Zanardi'): string => {
  const nameSlug = slugify(sellerName);
  return `www.euquero.app.br/convite/${nameSlug}`;
};

/**
 * PROMPT 8: Mascarar telefone para exibição pública segura.
 * Retorna os primeiros 6 dígitos + XXXX.
 * Ex: (47) 99620-5669 vira (47) 9962-XXXX
 * Ex: 47996205669 vira (47) 9962-XXXX
 */
export const mascararTelefone = (telefone?: string): string => {
  if (!telefone) return '(47) 9962-XXXX';
  const digits = telefone.replace(/\D/g, '');
  if (digits.length >= 6) {
    const ddd = digits.slice(0, 2);
    const prefix = digits.slice(2, 6);
    return `(${ddd}) ${prefix}-XXXX`;
  }
  return '(47) 9962-XXXX';
};
export const getShareableInviteUrl = (sellerName: string = 'Nardinei Zanardi'): string => {
  const origin = getBaseSiteUrl();
  return `${origin}/?convite=${encodeURIComponent(slugify(sellerName))}`;
};
