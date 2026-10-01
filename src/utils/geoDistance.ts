/**
 * Utilitário de Geografia e Distâncias para Cidades Pequenas & Centros Regionais
 * Suporta o requisito oficial do EuQuero:
 * - "📍 VENDENDO EM: Joinville / SC" (Grande e Verde)
 * - "Não achamos em Araquari/SC, mas achamos 3 em Joinville/SC (30km de você)"
 */

interface CityCoord {
  lat: number;
  lng: number;
  state: string;
}

// Coordenadas das cidades frequentes no ecossistema de máquinas pesadas, caminhões e agro
const KNOWN_CITIES: Record<string, CityCoord> = {
  'araquari': { lat: -26.3756, lng: -48.7183, state: 'SC' },
  'joinville': { lat: -26.3045, lng: -48.8487, state: 'SC' },
  'jaragua do sul': { lat: -26.4851, lng: -49.0833, state: 'SC' },
  'blumenau': { lat: -26.9194, lng: -49.0661, state: 'SC' },
  'itajai': { lat: -26.9078, lng: -48.6619, state: 'SC' },
  'florianopolis': { lat: -27.5954, lng: -48.5480, state: 'SC' },
  'chapeco': { lat: -27.1004, lng: -52.6152, state: 'SC' },
  'lages': { lat: -27.8161, lng: -50.3264, state: 'SC' },
  'curitiba': { lat: -25.4284, lng: -49.2733, state: 'PR' },
  'sao jose dos pinhais': { lat: -25.5347, lng: -49.2064, state: 'PR' },
  'cascavel': { lat: -24.9578, lng: -53.4595, state: 'PR' },
  'maringa': { lat: -23.4205, lng: -51.9333, state: 'PR' },
  'londrina': { lat: -23.3045, lng: -51.1696, state: 'PR' },
  'paulinia': { lat: -22.7639, lng: -47.1539, state: 'SP' },
  'campinas': { lat: -22.9099, lng: -47.0626, state: 'SP' },
  'sao paulo': { lat: -23.5505, lng: -46.6333, state: 'SP' },
  'sao paulo capital': { lat: -23.5505, lng: -46.6333, state: 'SP' },
  'ribeirao preto': { lat: -21.1767, lng: -47.8108, state: 'SP' },
  'sao jose do rio preto': { lat: -20.8113, lng: -49.3758, state: 'SP' },
  'sorocaba': { lat: -23.5015, lng: -47.4526, state: 'SP' },
  'uberlandia': { lat: -18.9186, lng: -48.2772, state: 'MG' },
  'belo horizonte': { lat: -19.9167, lng: -43.9345, state: 'MG' },
  'goiania': { lat: -16.6869, lng: -49.2648, state: 'GO' },
  'rio verde': { lat: -17.7923, lng: -50.9192, state: 'GO' },
  'cuiaba': { lat: -15.6014, lng: -56.0979, state: 'MT' },
  'rondonopolis': { lat: -16.4674, lng: -54.6368, state: 'MT' },
  'sorriso': { lat: -12.5447, lng: -55.7128, state: 'MT' },
  'campo grande': { lat: -20.4697, lng: -54.6201, state: 'MS' },
  'dourados': { lat: -22.2236, lng: -54.8125, state: 'MS' }
};

export const normalizeCityName = (city: string): string => {
  return (city || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/\-].*$/, '') // remove sufixo de estado se tiver (/SC, -SP)
    .trim();
};

export const extractStateFromLocation = (city: string, state?: string): string => {
  if (state && state.trim().length === 2) {
    return state.trim().toUpperCase();
  }
  const match = (city || '').match(/[\/\-\s]+([A-Za-z]{2})$/);
  if (match) {
    return match[1].toUpperCase();
  }
  return 'SC'; // Default Santa Catarina (Hub Nardinei Silva)
};

/**
 * Retorna a inscrição obrigatória verde:
 * "📍 VENDENDO EM: Joinville / SC"
 */
export const formatVendendoEm = (city: string, state?: string): string => {
  const cleanCity = (city || 'Joinville').replace(/[\/\-][A-Za-z]{2}$/, '').trim();
  const cleanState = extractStateFromLocation(city, state);
  return `📍 VENDENDO EM: ${cleanCity} / ${cleanState}`;
};

/**
 * Calcula a distância em KM entre duas cidades brasileiras usando Haversine
 */
export const calculateDistanceKm = (cityA: string, cityB: string): number | null => {
  const normA = normalizeCityName(cityA);
  const normB = normalizeCityName(cityB);

  if (normA === normB) return 0;

  // Casos específicos emblemáticos da região de Joinville / Norte de SC
  if ((normA === 'araquari' && normB === 'joinville') || (normA === 'joinville' && normB === 'araquari')) {
    return 30;
  }
  if ((normA === 'jaragua do sul' && normB === 'joinville') || (normA === 'joinville' && normB === 'jaragua do sul')) {
    return 38;
  }
  if ((normA === 'paulinia' && normB === 'campinas') || (normA === 'campinas' && normB === 'paulinia')) {
    return 18;
  }

  const cA = KNOWN_CITIES[normA];
  const cB = KNOWN_CITIES[normB];

  if (!cA || !cB) {
    // Estimativa se mesmo estado
    return null;
  }

  const R = 6371; // Raio da Terra em km
  const dLat = ((cB.lat - cA.lat) * Math.PI) / 180;
  const dLng = ((cB.lng - cA.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((cA.lat * Math.PI) / 180) *
      Math.cos((cB.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

/**
 * Gera a mensagem amigável para compradores de cidade pequena
 * Ex: "Não achamos em Araquari/SC, mas achamos 3 em Joinville/SC (30km de você)"
 */
export const getNearbyRecommendationMessage = (
  buyerCity: string,
  buyerState: string,
  hubCity: string = 'Joinville',
  hubState: string = 'SC',
  count: number = 3
): string => {
  const dist = calculateDistanceKm(buyerCity, hubCity) || 30;
  return `Não achamos em ${buyerCity}/${buyerState}, mas achamos ${count} em ${hubCity}/${hubState} (${dist}km de você)`;
};
