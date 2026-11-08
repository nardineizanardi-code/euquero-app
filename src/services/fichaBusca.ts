/**
 * Helpers puros para a ficha de busca do comprador ("Quero Comprar").
 *
 * Ficam num arquivo separado e sem React porque o WizardModal é um
 * componente enorme: a parte que transforma "Cidade/UF" em
 * (locationCity, locationState) tem regra própria e é o que
 * diferencia a busca que já tem cidade da busca nacional.
 *
 * Exportar essas funções permite testá-las sem montar o modal inteiro.
 *
 * ─────────────────────────────────────────────────────────────────────
 * REGRAS QUE NÃO SE DESCULPAM (mini-1.1)
 *
 * 1. Cidade vazia NÃO vira `'BR'`. Vira `locationState: null`. O
 *    alcance (geo_preference) é quem diz se é Brasil todo ou só
 *    do estado. Sem UF explícita e sem "brasil_todo", a busca
 *    simplesmente não filtra por estado.
 *
 * 2. Quando a pessoa digita "Cidade/UF", gravamos o estado da
 *    própria cidade — isso é dela, não do perfil. O `geo_preference`
 *    continua sendo o que a pessoa escolheu.
 *
 * 3. Campo opcional vazio não vira valor fictício. Sem marca/modelo
 *    digitado, o `brand` e `model` ficam ausentes; sem ano, `year`
 *    fica `null`; sem orçamento, não mencionamos "520.000" no texto.
 */

/**
 * As 27 UFs do Brasil, em ordem canônica.
 * Útil para o dropdown quando o perfil não tem UF.
 */
export const UFS_BRASIL: ReadonlyArray<string> = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
];

/**
 * Tipo do alcance geográfico da busca.
 *  - 'so_estado'   → comprador quer restringir ao próprio estado.
 *  - 'brasil_todo' → comprador quer ver o país inteiro.
 */
export type GeoAlcance = 'so_estado' | 'brasil_todo';

/**
 * mini-1.2: a pessoa ainda NÃO escolheu alcance.
 *
 * Não é um "Brasil todo" implícito: é a ausência de escolha. A
 * ficha mostra a pergunta, e sem resposta não se grava estado
 * nenhum — nem 'BR', nem a UF do perfil.
 */
export type GeoAlcanceSemEscolha = GeoAlcance | 'sem_escolha';

/**
 * Quebra o campo livre "Cidade/UF" em cidade e estado.
 *
 * Regras:
 *  - "Araquari/SC"  → { locationCity: "Araquari", locationState: "SC" }
 *  - "Joinville"     → { locationCity: "Joinville", locationState: null }
 *  - "" ou "   "     → { locationCity: "", locationState: null }
 *  - "Blumenau/SC/centro" → usa o PRIMEIRO "/" como separador.
 *
 * Diferente da mini-1: a cidade sozinha NÃO vira `'BR'`. Quem diz
 * se o alcance é nacional é o `geo_preference`, registrado em
 * `ufDeAlcance`. Esta função só lida com o texto livre da cidade.
 */
export const parsearCidadeUf = (
  cidadeBruta: string | null | undefined
): { locationCity: string; locationState: string | null } => {
  const cidade = (cidadeBruta ?? '').trim();
  if (!cidade) {
    return { locationCity: '', locationState: null };
  }
  if (cidade.includes('/')) {
    const [city, state] = cidade.split('/');
    const stateNorm = (state ?? '').trim().toUpperCase();
    return {
      locationCity: (city ?? '').trim(),
      locationState: /^[A-Z]{2}$/.test(stateNorm) ? stateNorm : null,
    };
  }
  return { locationCity: cidade, locationState: null };
};

/**
 * Decide qual `location_state` gravar, a partir do alcance, da UF do
 * perfil, e da UF que a pessoa escolheu no dropdown (quando aplicável).
 *
 * Regras:
 *  - 'brasil_todo'     → `'BR'` (sempre, é o código explícito do
 *                        "Brasil todo" que a Zapia pediu).
 *  - 'so_estado' + UF do perfil → usa a UF do perfil.
 *  - 'so_estado' + UF escolhida no dropdown → usa a UF escolhida.
 *  - 'so_estado' sem UF nenhuma → `null` (NÃO vira 'BR' nem 'SC'.
 *    A busca é honesta: o alcance é "meu estado", mas o estado
 *    concreto não está disponível, então não filtra por estado).
 *
 * A função aceita `ufEscolhida` como string qualquer e filtra:
 * só usa se for uma sigla de 2 letras (do array `UFS_BRASIL`).
 */
export const ufDeAlcance = (params: {
  alcance: GeoAlcanceSemEscolha;
  ufDoPerfil?: string | null;
  ufEscolhida?: string | null;
}): string | null => {
  if (params.alcance === 'brasil_todo') {
    return 'BR';
  }
  // mini-1.2: sem escolha explícita, não se grava estado. Nem BR,
  // nem a UF do perfil — a pessoa não pediu nenhum dos dois.
  if (params.alcance === 'sem_escolha') {
    return null;
  }
  // alcance === 'so_estado'
  const doPerfil = (params.ufDoPerfil ?? '').trim().toUpperCase();
  if (UFS_BRASIL.includes(doPerfil)) return doPerfil;
  const escolhida = (params.ufEscolhida ?? '').trim().toUpperCase();
  if (UFS_BRASIL.includes(escolhida)) return escolhida;
  return null;
};

/**
 * Monta o título da busca.
 *
 * "Busca Escavadeira Sinomach" quando não há cidade.
 * "Busca Escavadeira Sinomach em Araquari/SC" quando há cidade.
 */
export const tituloDaBusca = (
  maquinaLabel: string,
  cidadeBruta: string | null | undefined
): string => {
  const cidade = (cidadeBruta ?? '').trim();
  return cidade
    ? `Busca ${maquinaLabel} em ${cidade}`
    : `Busca ${maquinaLabel}`;
};

/**
 * Monta a descrição da demanda do comprador para gravar no banco.
 *
 * Texto construído a partir dos campos opcionais: se a pessoa
 * não preencheu ano, especificação, orçamento ou forma de
 * pagamento, esses trechos somem. A descrição NUNCA menciona
 * contato direto nem WhatsApp — isso é uma etapa à parte.
 *
 * Orçamento: `null` ou `undefined` (ou NaN) → sem menção a valor.
 * Isso evita o problema antigo que fixava R$ 520.000 quando o
 * comprador não preenchia nada.
 */
export const descricaoDaBusca = (params: {
  maquinaLabel: string;
  ano: string;
  detalhe: string;
  orcamento: number | null | undefined;
  formaPagamento: string;
}): string => {
  const fmt = (n: number) => n.toLocaleString('pt-BR');
  const orcamento = typeof params.orcamento === 'number' && Number.isFinite(params.orcamento)
    ? `Orçamento até R$ ${fmt(params.orcamento)}.`
    : '';
  return [
    `Busca: ${params.maquinaLabel}.`,
    params.ano ? `Ano desejado: ${params.ano}.` : '',
    params.detalhe ? `Especificação: ${params.detalhe}.` : '',
    orcamento,
    params.formaPagamento ? `Pagamento: ${params.formaPagamento}.` : '',
  ]
    .filter(Boolean)
    .join(' ');
};

/**
 * Detecta se a busca, no payload final, ficou sem cidade.
 * Usado pelos testes: o requisito afirma que "Cidade" não pode
 * ser obrigatória.
 */
export const buscaSemCidade = (
  cidadeBruta: string | null | undefined
): boolean => (cidadeBruta ?? '').trim().length === 0;

/**
 * Faz o match parcial (case-insensitive) do termo de busca contra
 * um anúncio. O termo é comparado contra marca, modelo, título e
 * cidade. Retorna `true` se o termo está contido em qualquer um
 * desses campos (em minúsculas).
 *
 * Esta é a função que a vitrine usa — independente de como o
 * comprador digitou (com espaço, acento, etc), o match é tolerante.
 */
export const termoCasaNoAnuncio = (
  termo: string,
  anuncio: { title?: string | null; brand?: string | null; model?: string | null; locationCity?: string | null }
): boolean => {
  const q = (termo ?? '').trim().toLowerCase();
  if (!q) return true; // termo vazio casa com tudo
  const str = [
    anuncio.title ?? '',
    anuncio.brand ?? '',
    anuncio.model ?? '',
    anuncio.locationCity ?? '',
  ].join(' ').toLowerCase();
  return str.includes(q);
};

/**
 * Monta o payload que o `handleSubmitBuyer` envia para a gravação.
 *
 * Esta é a função PURA que reproduz o que o WizardModal faz:
 * combina os campos digitados com o `alcance` e a UF do perfil
 * para decidir o `locationState` final. Existe para teste —
 * é como o `handleCreateBuyerListing` recebe o objeto do
 * WizardModal, e queremos garantir que o payload resultante
 * respeita as regras da mini-1.1 sem ter que montar o modal.
 */
export const montarPayloadDaBusca = (params: {
  intent: 'buy' | 'sell';
  details: {
    machineLabel: string;
    brand: string;
    model: string;
    anoStr: string;
    detalheStr: string;
  };
  buyerCity: string;
  alcance: GeoAlcanceSemEscolha;
  ufDoPerfil?: string | null;
  ufEscolhida?: string | null;
  buyerBudget: string;
  buyerPaymentMethod: string;
}): {
  intent: 'buy' | 'sell';
  title: string;
  locationCity: string;
  locationState: string;
  geoPreference: GeoAlcance | undefined;
  description: string;
  price: number | null;
  brand: string | null;
  model: string | null;
  year: number | null;
  subcategoryType: string;
} => {
  const { details, buyerCity, alcance, ufDoPerfil, ufEscolhida,
          buyerBudget, buyerPaymentMethod, intent } = params;
  const { locationCity, locationState: cityState } = parsearCidadeUf(buyerCity);
  const alcanceState = ufDeAlcance({
    alcance, ufDoPerfil, ufEscolhida,
  });
  const locationState = cityState ?? alcanceState ?? '';

  const parsedValor = parseFloat(buyerBudget.replace(/[^0-9]/g, ''));

  return {
    intent,
    title: tituloDaBusca(details.machineLabel, buyerCity),
    locationCity,
    locationState,
    // 'sem_escolha' não vira geoPreference: sem escolha explícita,
    // não gravamos preferência geográfica nenhuma.
    geoPreference: alcance === 'sem_escolha' ? undefined : alcance,
    description: descricaoDaBusca({
      maquinaLabel: details.machineLabel,
      ano: details.anoStr,
      detalhe: details.detalheStr,
      orcamento: Number.isFinite(parsedValor) ? parsedValor : null,
      formaPagamento: buyerPaymentMethod,
    }),
    price: Number.isFinite(parsedValor) ? parsedValor : null,
    brand: (details.brand ?? '').trim() || null,
    model: (details.model ?? '').trim() || null,
    year: details.anoStr ? parseInt(details.anoStr, 10) : null,
    subcategoryType: ((details.machineLabel.split(' ')[0] ?? '').trim()) || '',
  };
};

/**
 * Junta pedaços de rótulo, ignorando os vazios.
 *
 * É o que impede o `machineLabel` de virar "undefined Sinomach"
 * quando a pessoa não escolheu o subtipo.
 */
export const juntar = (partes: Array<string | null | undefined>): string =>
  partes
    .map((x) => (x ?? '').trim())
    .filter(Boolean)
    .join(' ');

/**
 * Divide "Marca Modelo" em (marca, modelo) SEM inventar nenhum dos dois.
 *
 *   "Sinomach ZE360E" → { brand: "Sinomach", model: "ZE360E" }
 *   "Sinomach"        → { brand: "Sinomach", model: "" }
 *   ""                → { brand: "",        model: "" }
 *
 * mini-1.2: a versão antiga devolvia "320D" quando não havia
 * modelo. Isso gravava um modelo que a pessoa não pediu e fazia
 * a busca casar com anúncios de outra máquina.
 */
export const dividirMarcaModelo = (
  bruto: string | null | undefined
): { brand: string; model: string } => {
  const limpo = (bruto ?? '').trim().replace(/\s+/g, ' ');
  if (!limpo) return { brand: '', model: '' };
  const partes = limpo.split(' ');
  return { brand: partes[0] ?? '', model: partes.slice(1).join(' ') };
};

/** Atalho: só a marca de "Marca Modelo". */
export const marcaDe = (bruto: string | null | undefined): string =>
  dividirMarcaModelo(bruto).brand;

/** Atalho: só o modelo de "Marca Modelo". */
export const modeloDe = (bruto: string | null | undefined): string =>
  dividirMarcaModelo(bruto).model;

/* ═══════════════════════════════════════════════════════════════════
   A MÁQUINA DE ESTADOS DO BOTÃO "BUSCAR MÁQUINAS"
   ═══════════════════════════════════════════════════════════════════ */

/**
 * O que a ficha do comprador mostra enquanto a gravação acontece.
 *
 * mini-1.2: este é o coração do requisito "a ficha não pode fechar
 * nem avançar antes de a gravação confirmar". Ele é uma função pura
 * de propósito — o componente só aplica o que ela devolve, e o
 * teste exercita o comportamento sem precisar de DOM.
 */
export type EstadoFicha = 'pronta' | 'salvando' | 'erro';

/** O que o formulário deve exibir em cada estado. */
export interface VistaFicha {
  estado: EstadoFicha;
  /** O botão está desabilitado? Só quando está salvando. */
  botaoDesabilitado: boolean;
  /** O que o botão diz. */
  rotuloBotao: string;
  /** Mensagem de erro; vazia quando não há erro. */
  erro: string;
  /** A ficha deve ficar aberta? */
  fichaAberta: boolean;
  /** O que foi digitado permanece disponível para nova tentativa? */
  dadosPreservados: boolean;
};

/**
 * Deriva a vista da ficha a partir do estado.
 *
 * Regras que a Zapia pediu:
 *  - enquanto salva, o botão fica desabilitado (evita duplicidade);
 *  - se falhou, a ficha fica ABERTA, com erro claro, e o que a
 *    pessoa digitado continua lá para ela tentar de novo;
 *  - só o sucesso confirmado fecha a ficha.
 */
export const vistaDaFicha = (
  estado: EstadoFicha,
  mensagemDeErro?: string | null
): VistaFicha => {
  switch (estado) {
    case 'salvando':
      return {
        estado,
        botaoDesabilitado: true,
        rotuloBotao: 'Salvando busca…',
        erro: '',
        fichaAberta: true,
        dadosPreservados: true,
      };
    case 'erro':
      return {
        estado,
        botaoDesabilitado: false,
        rotuloBotao: 'Buscar Máquinas',
        erro: (mensagemDeErro ?? '').trim() || 'Erro ao salvar busca. Tente novamente.',
        fichaAberta: true,
        dadosPreservados: true,
      };
    case 'pronta':
    default:
      return {
        estado: 'pronta',
        botaoDesabilitado: false,
        rotuloBotao: 'Buscar Máquinas',
        erro: '',
        fichaAberta: true,
        dadosPreservados: true,
      };
  }
};

/**
 * mini-1.2f: o resultado da gravação.
 *
 * `quantidade` é quantos anúncios casam com os critérios. Quem
 * calcula é quem tem a lista — o App. Ela viaja junto do `ok` para
 * que a ficha possa dizer a verdade sem depender de um prop que
 * ainda não recalculou.
 */
export interface ResultadoDaGravacao {
  ok: boolean;
  mensagem?: string;
  quantidade?: number;
}

/**
 * Roda a gravação e devolve o estado final da ficha.
 *
 * É o que o `handleSubmitBuyer` chama. A regra do duplo-clique mora
 * aqui: enquanto uma gravação está em curso, uma segunda chamada não
 * chega a tocar o banco — é o que impede a busca duplicada quando a
 * pessoa toca duas vezes (ou quando o Supabase demora).
 */
export const tentarSalvarBusca = async (params: {
  gravar: () => Promise<ResultadoDaGravacao>;
  jaEstaSalvando: boolean;
  aoMudar?: (vista: VistaFicha) => void;
}): Promise<{ estado: EstadoFicha; vista: VistaFicha; resultado: ResultadoDaGravacao | null }> => {
  // Duplo-clique: a segunda chamada sai sem tocar o banco.
  if (params.jaEstaSalvando) {
    return {
      estado: 'salvando',
      vista: vistaDaFicha('salvando'),
      resultado: null,
    };
  }

  params.aoMudar?.(vistaDaFicha('salvando'));
  try {
    const resultado = await params.gravar();
    if (resultado.ok) {
      // Sucesso confirmado: a ficha fecha (o componente faz o
      // onClose). Para a ficha, "aberta" é false.
      const vista = vistaDaFicha('pronta');
      return { estado: 'pronta', vista: { ...vista, fichaAberta: false }, resultado };
    }
    const vista = vistaDaFicha('erro', resultado.mensagem);
    return { estado: 'erro', vista, resultado };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : 'Erro ao salvar busca. Tente novamente.';
    const vista = vistaDaFicha('erro', mensagem);
    return { estado: 'erro', vista, resultado: { ok: false, mensagem } };
  }
};
