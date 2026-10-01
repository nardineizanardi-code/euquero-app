import { CategorySpec, ListingItem } from '../types';

/**
 * ============================================================================
 * AS 4 CATEGORIAS OFICIAIS DO EU QUERO:
 * ============================================================================
 * 1. [ 🚜 Linha Amarela ] ('linha_amarela' / 'maquinas')
 * 2. [ 🌾 Agrícola ] ('agricola' / 'agro')
 * 3. [ 🚛 Caminhão ] ('caminhao' / 'caminhoes')
 * 4. [ 🚚 Implementos Rodoviários ] ('implementos' / 'implementos_rodoviarios')
 * ============================================================================
 */

export interface CategoryChipConfig {
  id: string;
  name: string;
  emoji: string;
  iconName: string;
  allowedSubtypes: string[];
  aliases: string[];
  vendorPanelTitle: string;
  vendorPanelSub: string;
  vendorLeadsCount: number;
}

export const CATEGORY_CHIPS: CategoryChipConfig[] = [
  {
    id: 'linha_amarela',
    name: 'Linha Amarela',
    emoji: '🚜',
    iconName: 'Wrench',
    allowedSubtypes: [
      'Escavadeira Hidráulica',
      'Escavadeira',
      'Retroescavadeira',
      'Retroescavadeira JCB 3CX',
      'Pá Carregadeira',
      'Trator de Esteira',
      'Motoniveladora',
      'Rolo Compactador',
      'Mini Carregadeira (Bobcat)',
      'Mini Escavadeira'
    ],
    aliases: ['linha_amarela', 'maquinas'],
    vendorPanelTitle: '🔥 4 compradores se encaixam no que você vende',
    vendorPanelSub: 'Procuras ativas compatíveis com filtros de Linha Amarela (produto + valor + região SP/MG).',
    vendorLeadsCount: 4
  },
  {
    id: 'agricola',
    name: 'Agrícola',
    emoji: '🌾',
    iconName: 'Tractor',
    allowedSubtypes: [
      'Trator Agrícola',
      'Trator',
      'Colheitadeira de Grãos',
      'Colheitadeira',
      'Implementos Agrícolas',
      'Pulverizador Autopropelido',
      'Plantadeira / Semeadeira',
      'Grade Aradora'
    ],
    aliases: ['agricola', 'agro'],
    vendorPanelTitle: '🔥 5 compradores se encaixam no que você vende',
    vendorPanelSub: 'Procuras ativas compatíveis com filtros Agrícolas (tratores e colheitadeiras em MT, GO e PR).',
    vendorLeadsCount: 5
  },
  {
    id: 'caminhao',
    name: 'Caminhão',
    emoji: '🚛',
    iconName: 'Truck',
    allowedSubtypes: [
      'Cavalo Mecânico',
      'Caminhão Truck',
      'Truck',
      '6x2',
      '6x4',
      '8x2',
      'Caminhão Toco / Caçamba',
      'Caminhonete 4x4'
    ],
    aliases: ['caminhao', 'caminhoes', 'veiculos'],
    vendorPanelTitle: '🔥 7 compradores se encaixam no que você vende',
    vendorPanelSub: 'Procuras ativas compatíveis com filtros de Caminhões (cavalos mecânicos e trucks em SP, PR e MT).',
    vendorLeadsCount: 7
  },
  {
    id: 'implementos',
    name: 'Implementos Rodoviários',
    emoji: '🚚',
    iconName: 'Container',
    allowedSubtypes: [
      'Basculante',
      'Graneleiro',
      'Prancha',
      'Baú',
      'Tanque',
      'Bitrem',
      'Rodotrem',
      'Carreta Basculante',
      'Carreta Graneleiro',
      'Carreta Prancha',
      'Carreta Baú',
      'Carreta Tanque',
      'Bitrem / Rodotrem'
    ],
    aliases: ['implementos', 'implementos_rodoviarios'],
    vendorPanelTitle: '🔥 4 compradores se encaixam no que você vende',
    vendorPanelSub: 'Procuras ativas compatíveis com filtros de Implementos (carretas basculantes e graneleiras).',
    vendorLeadsCount: 4
  }
];

export const CATEGORIES: CategorySpec[] = [
  {
    id: 'linha_amarela',
    name: 'Linha Amarela',
    description: 'Escavadeiras, retroescavadeiras, pás carregadeiras e tratores de esteira',
    iconName: 'Wrench',
    status: 'active',
    image: '/cat_320d_excavator.jpg',
    types: [
      'Escavadeira Hidráulica',
      'Retroescavadeira JCB 3CX',
      'Pá Carregadeira',
      'Trator de Esteira',
      'Motoniveladora',
      'Rolo Compactador',
      'Mini Carregadeira (Bobcat)',
      'Mini Escavadeira'
    ],
    brands: [
      'Caterpillar (CAT)',
      'Komatsu',
      'Volvo Construction',
      'JCB',
      'Case CE',
      'New Holland',
      'Hyundai Heavy',
      'Sany',
      'John Deere',
      'XCMG',
      'Liugong',
      'Bobcat'
    ],
    popularModels: {
      'Caterpillar (CAT)': ['320D / 320 GC', '336D', '416F2 / 416E', '924K', '938K', 'D6N / D6T', '120K'],
      'Komatsu': ['PC200-8', 'PC210-10', 'WA320-6', 'D61EX', 'GD555'],
      'Volvo Construction': ['EC210D / EC210B', 'EC220D', 'L60F / L90F', 'L110F', 'G930'],
      'JCB': ['3CX', 'JS220', '426ZX', '1CX', '535-125'],
      'Case CE': ['580N', '580M', 'CX220C', '821E', '1150L'],
      'New Holland': ['B95B', 'E215C', 'W130B', 'RG170B'],
      'Hyundai Heavy': ['R220LC-9', 'R210LC-7', 'HL740-9'],
      'Sany': ['SY215C', 'SY135C', 'SMG200C', 'SW956K'],
      'John Deere': ['310L', '210G', '624K', '670G', '750J']
    }
  },
  {
    id: 'agricola',
    name: 'Agrícola',
    description: 'Tratores agrícolas, colheitadeiras de grãos e implementos agrícolas',
    iconName: 'Tractor',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?w=800&auto=format&fit=crop&q=80',
    types: [
      'Trator Agrícola',
      'Colheitadeira de Grãos',
      'Implementos Agrícolas',
      'Pulverizador Autopropelido',
      'Plantadeira / Semeadeira',
      'Grade Aradora'
    ],
    brands: [
      'John Deere',
      'Massey Ferguson',
      'Case IH',
      'New Holland Agriculture',
      'Valtra',
      'Jacto',
      'Stara',
      'Kuhn'
    ],
    popularModels: {
      'John Deere': ['6115J', '7200J', 'S680 Colheitadeira', 'M4030 Pulverizador', '8R 370'],
      'Massey Ferguson': ['MF 7719', 'MF 6713', 'MF 9895 Trident', 'MF 4707'],
      'Case IH': ['Magnum 340', 'Puma 200', 'Axial-Flow 7250', 'Patriot 350', 'Farmall 100'],
      'New Holland Agriculture': ['T7.240', 'T6.130', 'CR 7.90', 'Defensor 3500'],
      'Valtra': ['A94', 'BH 180', 'T250 CVT', 'S394']
    }
  },
  {
    id: 'caminhao',
    name: 'Caminhão',
    description: 'Cavalos mecânicos, caminhões truck 6x2, 6x4, 8x2 e utilitários pesados',
    iconName: 'Truck',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?w=800&auto=format&fit=crop&q=80',
    types: [
      'Cavalo Mecânico',
      'Caminhão Truck',
      'Caminhão 6x2',
      'Caminhão 6x4',
      'Caminhão 8x2',
      'Caminhão Toco / Caçamba',
      'Caminhonete 4x4'
    ],
    brands: [
      'Scania',
      'Volvo Caminhões',
      'Mercedes-Benz',
      'Volkswagen Caminhões',
      'Toyota',
      'Ford',
      'Iveco',
      'DAF'
    ],
    popularModels: {
      'Scania': ['R450 6x2', 'R500 6x4', 'R540 6x4', 'G420', 'P310'],
      'Volvo Caminhões': ['FH 540 6x4', 'FH 460', 'VM 270', 'VM 330', 'FMX 500'],
      'Mercedes-Benz': ['Actros 2651', 'Axor 2544', 'Atego 2426', 'Atego 1719'],
      'Volkswagen Caminhões': ['Constellation 24.280', 'Meteor 28.460', 'Delivery 11.180', 'Constellation 19.360'],
      'Toyota': ['Hilux SRX 4x4', 'Hilux SRV'],
      'DAF': ['XF 530', 'XF 480', 'CF 310']
    }
  },
  {
    id: 'implementos',
    name: 'Implementos Rodoviários',
    description: 'Carretas basculantes, graneleiras, pranchas, baús, tanques e bitrens',
    iconName: 'Container',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    types: [
      'Carreta Basculante',
      'Carreta Graneleiro',
      'Carreta Prancha',
      'Carreta Baú',
      'Carreta Tanque',
      'Bitrem / Rodotrem'
    ],
    brands: [
      'Randon',
      'Guerra',
      'Noma',
      'Facchini',
      'Pastre',
      'Librelato',
      'Rodofort'
    ],
    popularModels: {
      'Randon': ['Basculante 40m³', 'Graneleiro 3 Eixos', 'Bitrem 9 Eixos', 'Prancha 3 Eixos'],
      'Guerra': ['Graneleiro Granalha', 'Basculante Meia Cana', 'Baú Alumínio'],
      'Facchini': ['Basculante Caçamba', 'Graneleira 12.50m', 'Sider']
    }
  }
];

export const STATES_BR = [
  'SP', 'MG', 'PR', 'SC', 'RS', 'RJ', 'GO', 'MT', 'MS', 'BA', 
  'ES', 'PE', 'CE', 'PA', 'MA', 'TO', 'RO', 'PI', 'AM', 'RN', 
  'PB', 'AL', 'SE', 'AC', 'AP', 'RR', 'DF'
];

/**
 * Função utilitária rigorosa para verificar se um item pertence à categoria do chip
 */
export function isItemInCategory(item: ListingItem, categoryId: string): boolean {
  if (!categoryId || categoryId === 'all') return true;

  const chip = CATEGORY_CHIPS.find((c) => c.id === categoryId);
  if (!chip) {
    return (
      item.category === categoryId ||
      (categoryId === 'linha_amarela' && item.category === 'maquinas') ||
      (categoryId === 'agricola' && item.category === 'agro') ||
      (categoryId === 'caminhao' && (item.category === 'caminhoes' || item.category === 'veiculos')) ||
      (categoryId === 'implementos' && item.category === 'implementos_rodoviarios')
    );
  }

  // 1. Verificar categoria direta ou alias
  const directMatch = chip.aliases.includes(item.category?.toLowerCase());
  if (directMatch) return true;

  // 2. Verificar correspondência por subcategoria ou título
  const subtype = (item.subcategoryType || '').toLowerCase();
  const title = (item.title || '').toLowerCase();

  return chip.allowedSubtypes.some(
    (t) => subtype.includes(t.toLowerCase()) || title.includes(t.toLowerCase())
  );
}
