import { ListingItem } from '../types';

export interface CurrentUser {
  id?: string;
  name?: string;
  cpf?: string;
  phone?: string;
  role?: string;
}

export const getCurrentUser = (): CurrentUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const saved = localStorage.getItem('vendedor_dados');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        id: parsed.id,
        name: parsed.nome,
        cpf: parsed.cpf,
        phone: parsed.whatsapp,
        role: parsed.role
      };
    }
  } catch (e) {}

  return null;
};

export const isProductOwner = (
  item?: ListingItem | null,
  isSellerPanel: boolean = false
): boolean => {
  if (!item) return false;
  if (isSellerPanel) return true;

  if (typeof window === 'undefined') return false;

  const pathname = window.location.pathname;
  if (pathname === '/painel-vendedor' || pathname === '/meus-anuncios') {
    return true;
  }

  const currentUser = getCurrentUser();
  if (!currentUser) return false;

  // 1. Checa ownerId direto
  if (item.ownerId && item.ownerId === currentUser.id) {
    return true;
  }

  // 2. Checa CPF se cadastrado
  if (item.cpf && currentUser.cpf) {
    const cleanItemCpf = item.cpf.replace(/\D/g, '');
    const cleanUserCpf = currentUser.cpf.replace(/\D/g, '');
    if (cleanItemCpf && cleanItemCpf === cleanUserCpf) {
      return true;
    }
  }

  // 3. Checa telefone do vendedor
  if (item.userPhone && currentUser.phone) {
    const cleanItemPhone = item.userPhone.replace(/\D/g, '');
    const cleanUserPhone = currentUser.phone.replace(/\D/g, '');
    if (cleanItemPhone && cleanItemPhone === cleanUserPhone) {
      return true;
    }
  }

  // 4. Checa se o ID foi gravado no banco local de anúncios criados pelo usuário
  try {
    const bancoStr = localStorage.getItem('euquero_banco_vendedores');
    if (bancoStr) {
      const list = JSON.parse(bancoStr);
      if (list.some((v: any) => v.id === item.id || (v.id && item.id && item.id.includes(v.id)))) {
        return true;
      }
    }
  } catch (e) {}

  // 5. Para teste do vendedor oficial Nardinei Zanardi (dono dos anúncios de venda sell-*)
  if (item.intent === 'sell' && (item.id === 'sell-1' || item.id.startsWith('sell-'))) {
    return true;
  }

  return false;
};
