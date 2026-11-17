/**
 * CHECKPOINT 3 — O AVISO REGIONAL DINÂMICO.
 *
 * ─────────────────────────────────────────────────────────────────────
 * O PROBLEMA
 *
 * O texto "Não achamos em Araquari/SC, mas achamos 3 em Joinville/SC
 * (30km de você)" estava CHUMBADO na App. Três coisas erradas num
 * texto só:
 *
 *   - o número 3 era fixo — a busca podia achar 1 ou 47;
 *   - a cidade era fixa — a pessoa pode estar em qualquer lugar;
 *   - a distância (30km) era fixa — e não é a distância de ninguém em
 *     geral.
 *
 * ─────────────────────────────────────────────────────────────────────
 * A REGRA DA ESTER
 *
 * "Use exclusivamente as variáveis de estado que já existem no motor.
 *  Não crie novas fontes de dados."
 *
 * Então este arquivo NÃO decide nada e NÃO pergunta nada ao banco.
 * Ele só PEGA o que o motor já decidiu (`EscopoRegional`) e escreve
 * em português. O motor continua sendo o motor: ele é intocado.
 *
 * ─────────────────────────────────────────────────────────────────────
 * POR QUE UM ARQUIVO SEPARADO
 *
 * Porque o motor (`buscaConversacional.ts`) é área protegida. A
 * formatação do texto mora aqui, ao lado, sem mexer nele.
 */

import type { EscopoRegional } from './buscaConversacional';

/**
 * O aviso só faz sentido quando a busca FICOU na região da pessoa.
 *
 * Quando a busca subiu para os vizinhos ou para o Brasil todo, quem
 * avisa é o `avisoDoEscopo` do motor — e ele já diz o que aconteceu.
 * Aqui, o aviso é o outro lado: "achamos perto de você".
 */
export const avisoRegionalMostra = (escopo: EscopoRegional | null): boolean =>
  !!escopo && escopo.nivel === 'regiao' && escopo.naRegiao > 0;

/** O título do aviso. */
export const tituloDoAvisoRegional = (escopo: EscopoRegional | null): string | null => {
  if (!avisoRegionalMostra(escopo) || !escopo) return null;
  const n = escopo.naRegiao;
  const palavra = n === 1 ? 'anúncio' : 'anúncios';
  return `Achamos ${n} ${palavra} na região de ${escopo.uf}`;
};

/** A linha de detalhe. */
export const detalheDoAvisoRegional = (escopo: EscopoRegional | null): string | null => {
  if (!avisoRegionalMostra(escopo) || !escopo) return null;
  const base = 'Máquinas e equipamentos pesados verificados para vistoria presencial rápida.';
  if (!escopo.cidade) return base;
  return `Perto de ${escopo.cidade}. ${base}`;
};

/**
 * O rótulo do botão.
 *
 * Sem cidade, o botão fala da REGIÃO — não de uma cidade inventada.
 */
export const rotuloDoBotaoRegional = (escopo: EscopoRegional | null): string | null => {
  if (!avisoRegionalMostra(escopo) || !escopo) return null;
  if (escopo.cidade) return `Ver em ${escopo.cidade} ➔`;
  return `Ver na região de ${escopo.uf} ➔`;
};

/**
 * O termo que o botão escreve na busca.
 *
 * Devolve string vazia quando não há cidade: aí o botão só restringe
 * a geografia, sem trocar o que a pessoa perguntou. Escrever a UF
 * como termo ("SC") transformaria o filtro de estado em busca
 * textual — e a pessoa perderia o que digitou.
 */
export const termoDoBotaoRegional = (escopo: EscopoRegional | null): string => {
  if (!escopo) return '';
  return escopo.cidade.trim();
};
