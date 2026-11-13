import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

/**
 * ════════════════════════════════════════════════════════════════════════
 * A HOME COMO ENTRADA DE BUSCA (Fase 1 — Busca Conversacional)
 * ════════════════════════════════════════════════════════════════════════
 *
 * O que mudou nesta tela:
 *
 *   ANTES  → dois cartões gigantes no centro: "Quero Comprar" e
 *            "Quero Vender". A pessoa tinha que escolher um CAMINHO
 *            antes de saber o que queria.
 *   AGORA  → uma pergunta ("O que você está procurando hoje?"), uma
 *            caixa de texto grande e os 4 segmentos logo abaixo.
 *
 * O que NÃO mudou (e não pode mudar nesta fase):
 *
 *   - A busca continua sendo a de sempre: `termoCasaNoAnuncio`, a mesma
 *     função pura que a ficha do comprador usa. Nenhuma IA, nenhum
 *     endpoint novo, nenhuma mudança no banco.
 *   - Os dois fluxos que existiam continuam existindo. O "Quero Vender"
 *     (e o "Quero Comprar") saíram do CENTRO da tela e foram para o
 *     menu do topo — agora são o que sempre foram: ações secundárias.
 *   - Os 4 botões de segmento aplicam exatamente o mesmo filtro que o
 *     carrossel de chips aplicava (`setSelectedCategory`).
 */

/** Um segmento que a pessoa pode escolher em vez de digitar. */
export interface CategoriaDaBusca {
  /** O id do chip — o mesmo que o `selectedCategory` da vitrine usa. */
  id: string;
  /** O nome que a pessoa lê. */
  rotulo: string;
  emoji: string;
}

/**
 * Os 4 segmentos do Eu Quero, com o nome que o Dono usa.
 *
 * Os ids NÃO são inventados: são os ids canônicos dos chips
 * (`src/data/categories.ts`). "Tratores" aponta para `agricola` — que é
 * onde o app guarda tratores e colheitadeiras — e "Máquinas" aponta para
 * `linha_amarela` (escavadeiras, pás carregadeiras, tratores de esteira).
 */
export const CATEGORIAS_DA_BUSCA: CategoriaDaBusca[] = [
  { id: 'linha_amarela', rotulo: 'Máquinas', emoji: '🚜' },
  { id: 'caminhao', rotulo: 'Caminhões', emoji: '🚛' },
  { id: 'agricola', rotulo: 'Tratores', emoji: '🌾' },
  { id: 'implementos', rotulo: 'Implementos', emoji: '🚚' },
];

interface HeroProps {
  /** O termo que está valendo AGORA na vitrine. */
  searchQuery: string;
  /** Confirma a busca: grava o termo e leva a pessoa até o feed. */
  onSearch: (termo: string) => void;
  /** A categoria que está selecionada na vitrine. */
  selectedCategory: string;
  /** Aplica o filtro de categoria e leva a pessoa até o feed. */
  onSelectCategory: (categoryId: string) => void;
  /** Quantos anúncios existem em cada categoria (opcional). */
  categoryCounts?: Record<string, number>;
}

export const Hero: React.FC<HeroProps> = ({
  searchQuery,
  onSearch,
  selectedCategory,
  onSelectCategory,
  categoryCounts = {},
}) => {
  // A caixa tem um texto PRÓPRIO enquanto a pessoa digita: a busca só é
  // confirmada no Enter ou na lupa. Assim a vitrine não fica filtrando
  // por um termo pela metade.
  const [termo, setTermo] = useState(searchQuery);

  // Mas a caixa é o espelho do termo que vale: quando a ficha do
  // comprador aplica uma busca, ou quando a pessoa busca na barra do
  // topo, aqui aparece o mesmo texto.
  useEffect(() => {
    setTermo(searchQuery);
  }, [searchQuery]);

  const enviar = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(termo);
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-7 sm:pt-10 pb-3">
      {/* A PERGUNTA */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-black font-display text-[#0F172A] tracking-tight leading-[1.1]">
          O que você está <span className="text-[#FF6B00]">procurando</span> hoje?
        </h1>
        <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-500 font-medium max-w-xl mx-auto">
          Digite a marca, o modelo ou o tipo de máquina. O anúncio real aparece na hora.
        </p>
      </div>

      {/* A CAIXA DE BUSCA */}
      <form onSubmit={enviar} className="mt-5 sm:mt-7" role="search" aria-label="Buscar máquinas">
        <div className="relative">
          <Search
            className="absolute left-4 sm:left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"
            aria-hidden="true"
          />
          <input
            type="search"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Ex.: escavadeira Sinomach, caminhão Scania, retroescavadeira 3CX…"
            aria-label="O que você está procurando hoje?"
            autoComplete="off"
            className="w-full pl-12 sm:pl-14 pr-14 sm:pr-16 py-4 sm:py-5 text-base sm:text-lg rounded-2xl bg-white border-2 border-slate-200 shadow-lg shadow-slate-200/60 text-slate-900 placeholder:text-slate-400 font-medium outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/15"
          />
          {/* A LUPA: confirma a busca. */}
          <button
            type="submit"
            aria-label="Buscar"
            title="Buscar"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
          >
            <Search className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>
      </form>

      {/* OS 4 SEGMENTOS: o mesmo filtro do carrossel de chips, ao alcance
          da mão logo abaixo da caixa. */}
      <div className="mt-5 sm:mt-6 flex flex-col items-center gap-2.5 sm:gap-3">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Ou procure por segmento
        </span>
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {CATEGORIAS_DA_BUSCA.map((categoria) => {
            const ativo = selectedCategory === categoria.id;
            const total = categoryCounts[categoria.id];

            return (
              <button
                key={categoria.id}
                type="button"
                onClick={() => onSelectCategory(categoria.id)}
                aria-pressed={ativo}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border-2 select-none shadow-xs active:scale-95 ${
                  ativo
                    ? 'bg-[#0F172A] text-white border-[#FF6B00] shadow-md ring-4 ring-orange-500/20 scale-[1.03]'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 hover:text-slate-900'
                }`}
              >
                <span className="text-base sm:text-lg" role="img" aria-label={categoria.rotulo}>
                  {categoria.emoji}
                </span>
                <span className="font-display tracking-tight">{categoria.rotulo}</span>
                {typeof total === 'number' && (
                  <span
                    className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                      ativo ? 'bg-[#FF6B00] text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
