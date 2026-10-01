import { ListingItem, MatchResult } from '../types';
import { generateDisplayProductLink } from './productLinks';

/**
 * SISTEMA ELO - REGRA AUTOMÁTICA EXATA SOLICITADA:
 * Se categoria igual + marca igual ou contém + modelo contém + preço vendedor <= preço comprador + 10% + mesmo estado = MATCH ENCONTRADO
 */
export function checkExactEloMatch(
  buyer: ListingItem,
  seller: ListingItem
): { isMatch: boolean; reasons: string[]; buyerNotification: string; sellerNotification: string } {
  // Can only match buyer with seller
  if (buyer.intent !== 'buy' || seller.intent !== 'sell') {
    return { isMatch: false, reasons: [], buyerNotification: '', sellerNotification: '' };
  }

  const reasons: string[] = [];

  // 1. Categoria igual
  const catMatch = buyer.category === seller.category;
  if (catMatch) {
    reasons.push(`Categoria compatível (${seller.category})`);
  }

  // 2. Marca igual ou contém
  const bBrand = (buyer.brand || '').toLowerCase().trim();
  const sBrand = (seller.brand || '').toLowerCase().trim();
  const brandMatch = !bBrand || !sBrand || bBrand.includes(sBrand) || sBrand.includes(bBrand);
  if (brandMatch) {
    reasons.push(`Marca compatível (${seller.brand || 'Livre'})`);
  }

  // 3. Modelo contém (ou subcategoria contém)
  const bModel = (buyer.model || buyer.subcategoryType || '').toLowerCase().trim();
  const sModel = (seller.model || seller.subcategoryType || seller.title || '').toLowerCase().trim();
  const modelMatch = !bModel || !sModel || sModel.includes(bModel) || bModel.includes(sModel);
  if (modelMatch) {
    reasons.push(`Modelo correspondente (${seller.model || seller.subcategoryType})`);
  }

  // 4. Preço vendedor <= preço comprador + 10%
  const maxPriceAllowed = buyer.price > 0 ? buyer.price * 1.10 : Infinity;
  const priceMatch = seller.price <= maxPriceAllowed;
  if (priceMatch) {
    reasons.push(`Preço de R$ ${seller.price.toLocaleString('pt-BR')} dentro do teto +10%`);
  }

  // 5. Geografia compatível:
  // Se comprador SÓ ESTADO (padrão marcado), só MATCH mesmo estado. Se BRASIL TODO, MATCH qualquer estado.
  const bState = (buyer.locationState || '').trim().toUpperCase();
  const sState = (seller.locationState || '').trim().toUpperCase();
  const buyerWantsOnlyState = buyer.geoPreference === 'so_estado' || !buyer.geoPreference;
  const sellerWantsOnlyState = seller.geoPreference === 'so_estado';

  let stateMatch = true;
  if (buyerWantsOnlyState || sellerWantsOnlyState) {
    stateMatch = !bState || !sState || bState === sState;
    if (stateMatch && sState) {
      reasons.push(`Geografia compatível: mesmo estado (${sState})`);
    }
  } else {
    reasons.push(`Geografia compatível: Brasil todo liberado (${sState || 'BR'})`);
  }

  const isMatch = catMatch && brandMatch && modelMatch && priceMatch && stateMatch;

  // Notificações automáticas oficiais solicitadas:
  const productDisplayLink = generateDisplayProductLink(seller);
  const machineName = seller.title || seller.subcategoryType || 'Máquina';
  const cityName = seller.locationCity || 'sua região';
  const buyerName = buyer.userName || 'Comprador';
  const priceFormatted = seller.price.toLocaleString('pt-BR');

  // Notificar comprador: "🔥 Achamos! [Máquina] em [Cidade]/[Estado] por R$ [Preço] - Ver 4 fotos e vídeo: [link produto]"
  const buyerNotification = `🔥 Achamos! ${machineName} em ${cityName}/${sState || 'SC'} por R$ ${priceFormatted} - Ver 4 fotos e vídeo: ${productDisplayLink}`;

  // Notificar vendedor: "💰 Nardinei, tem comprador para sua [Máquina]! [Nome] de [Cidade] quer - Chamar no chat"
  const sellerNotification = `💰 ${seller.userName || 'Nardinei'}, tem comprador para sua ${machineName}! ${buyerName} de ${buyer.locationCity || cityName} quer - Chamar no chat`;

  return {
    isMatch,
    reasons,
    buyerNotification,
    sellerNotification
  };
}

export function calculateMatchScore(
  buyer: ListingItem,
  seller: ListingItem
): { score: number; reasons: string[] } {
  // Can only match buyer with seller
  if (buyer.intent !== 'buy' || seller.intent !== 'sell') {
    return { score: 0, reasons: [] };
  }

  // Must match high level category
  if (buyer.category !== seller.category) {
    return { score: 0, reasons: [] };
  }

  let score = 30; // Base score for same category
  const reasons: string[] = [`Mesma categoria (${buyer.category.toUpperCase()})`];

  // Subcategory type check (e.g. Escavadeira Hidráulica)
  if (
    buyer.subcategoryType.toLowerCase().trim() ===
    seller.subcategoryType.toLowerCase().trim()
  ) {
    score += 30;
    reasons.push(`Mesmo tipo de equipamento: ${seller.subcategoryType}`);
  } else if (
    buyer.subcategoryType.toLowerCase().includes(seller.subcategoryType.toLowerCase()) ||
    seller.subcategoryType.toLowerCase().includes(buyer.subcategoryType.toLowerCase())
  ) {
    score += 15;
    reasons.push(`Tipo compatível: ${seller.subcategoryType}`);
  }

  // Condition check (novo vs usado)
  if (buyer.condition === seller.condition || buyer.condition === 'indiferente') {
    score += 10;
    reasons.push(
      seller.condition === 'usado'
        ? `Condição compatível: Usado (${seller.hoursUsed ? `${seller.hoursUsed}h horímetro` : 'revisado'})`
        : 'Condição compatível: Novo'
    );
  }

  // Brand check
  if (buyer.brand && seller.brand) {
    const bBrand = buyer.brand.toLowerCase();
    const sBrand = seller.brand.toLowerCase();
    if (bBrand.includes(sBrand) || sBrand.includes(bBrand)) {
      score += 15;
      reasons.push(`Mesma marca de preferência: ${seller.brand}`);
    }
  } else if (!buyer.brand) {
    score += 8;
    reasons.push('Comprador flexível quanto à marca');
  }

  // Model check if provided
  if (buyer.model && seller.model) {
    const bModel = buyer.model.toLowerCase();
    const sModel = seller.model.toLowerCase();
    if (bModel.includes(sModel) || sModel.includes(bModel)) {
      score += 10;
      reasons.push(`Modelo exato correspondente: ${seller.model}`);
    }
  }

  // Year check
  if (seller.year) {
    const min = buyer.yearMin ?? 1990;
    const max = buyer.yearMax ?? 2030;
    if (seller.year >= min && seller.year <= max) {
      score += 10;
      reasons.push(`Ano ${seller.year} dentro da faixa solicitada (${min} a ${max})`);
    } else if (Math.abs(seller.year - min) <= 2 || Math.abs(seller.year - max) <= 2) {
      score += 4;
      reasons.push(`Ano ${seller.year} próximo da faixa desejada`);
    }
  }

  // Price compatibility
  if (buyer.price > 0 && seller.price > 0) {
    if (seller.price <= buyer.price) {
      score += 15;
      const diff = buyer.price - seller.price;
      reasons.push(
        diff === 0
          ? `Preço exato no orçamento limite (R$ ${seller.price.toLocaleString('pt-BR')})`
          : `Preço abaixo do orçamento máximo (Economia de R$ ${diff.toLocaleString('pt-BR')})`
      );
    } else if (seller.price <= buyer.price * 1.15) {
      score += 8;
      reasons.push('Preço próximo com margem plausível de negociação');
    }
  }

  // Location affinity
  if (buyer.locationState === seller.locationState) {
    score += 5;
    reasons.push(`Mesmo estado federativo (${seller.locationState}) facilitando vistoria`);
  }

  // Checagem da Regra Oficial do EloMatch (+10% teto, categoria, marca, modelo e mesmo estado)
  const eloCheck = checkExactEloMatch(buyer, seller);
  if (eloCheck.isMatch) {
    score = Math.max(score, 96);
    reasons.unshift('⚡ MATCH OFICIAL ELO: Categoria, marca, modelo, mesmo estado e preço dentro da margem de 10%');
  }

  // Cap at 100
  const finalScore = Math.min(100, score);
  return { score: finalScore, reasons };
}

export function findMatches(
  items: ListingItem[],
  targetItem?: ListingItem
): MatchResult[] {
  const matches: MatchResult[] = [];

  const buyers = items.filter((i) => i.intent === 'buy' && i.status !== 'closed');
  const sellers = items.filter((i) => i.intent === 'sell' && i.status !== 'closed');

  if (targetItem) {
    if (targetItem.intent === 'buy') {
      for (const seller of sellers) {
        const { score, reasons } = calculateMatchScore(targetItem, seller);
        if (score >= 60) {
          matches.push({
            id: `match-${targetItem.id}-${seller.id}`,
            buyerDemand: targetItem,
            sellerListing: seller,
            score,
            reasons,
            createdAt: new Date().toISOString(),
            status: 'new'
          });
        }
      }
    } else {
      for (const buyer of buyers) {
        const { score, reasons } = calculateMatchScore(buyer, targetItem);
        if (score >= 60) {
          matches.push({
            id: `match-${buyer.id}-${targetItem.id}`,
            buyerDemand: buyer,
            sellerListing: targetItem,
            score,
            reasons,
            createdAt: new Date().toISOString(),
            status: 'new'
          });
        }
      }
    }
  } else {
    // Cross match all buyers with all sellers
    for (const buyer of buyers) {
      for (const seller of sellers) {
        const { score, reasons } = calculateMatchScore(buyer, seller);
        if (score >= 60) {
          matches.push({
            id: `match-${buyer.id}-${seller.id}`,
            buyerDemand: buyer,
            sellerListing: seller,
            score,
            reasons,
            createdAt: new Date().toISOString(),
            status: 'new'
          });
        }
      }
    }
  }

  return matches.sort((a, b) => b.score - a.score);
}
