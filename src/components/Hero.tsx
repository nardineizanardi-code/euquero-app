import React, { useEffect, useState } from 'react';
import { Send, ShieldCheck } from 'lucide-react';

/**
 * ════════════════════════════════════════════════════════════════════════
 * A HOME COMO ENTRADA DE BUSCA (Fase 1 — Tarefa 1.3)
 * ════════════════════════════════════════════════════════════════════════
 *
 * Esta é a FACHADA da conversa. O motor da busca mora em
 * `src/services/buscaConversacional.ts`; aqui só mora a conversa:
 *
 *   - a pergunta que abre a tela;
 *   - a caixa de texto, com o botão de ENVIAR (não de lupa: aqui a
 *     pessoa conversa, ela não está procurando num índice);
 *   - as sugestões, que preenchem a caixa e mandam a busca;
 *   - os 4 segmentos, que aplicam o filtro de categoria;
 *   - o selo de segurança, que diz que a busca é sem cadastro.
 *
 * O que NÃO muda aqui: a identidade laranja (#FF6B00) e preta
 * (#0F172A) do EuQuero, o fundo claro e a lista de anúncios. Nenhum
 * card é tocado por esta tela.
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

/**
 * As sugestões de conversa.
 *
 * São frases que a pessoa do agro realmente digita: máquina +
 * especificação. Clicar nelas preenche a caixa e manda a busca.
 */
export const SUGESTOES_DE_BUSCA: string[] = [
  'Escavadeira 20 toneladas',
  'Trator 75 cv',
  'Caminhão basculante',
  'Retroescavadeira',
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
  // confirmada no Enter ou no botão de enviar. Assim a vitrine não fica
  // filtrando por um termo pela metade.
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

  // Uma sugestão é uma frase pronta: ela preenche a caixa e manda a
  // busca, como se a pessoa tivesse escrito.
  const usarSugestao = (sugestao: string) => {
    setTermo(sugestao);
    onSearch(sugestao);
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto pt-7 sm:pt-9 pb-3">
      {/* A PERGUNTA */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-4xl lg:text-[2.75rem] font-black font-display text-[#0F172A] tracking-tight leading-[1.1]">
          Olá! O que você está <span className="text-[#FF6B00]">procurando</span>?
        </h1>
        <p className="mt-2 sm:mt-3 text-xs sm:text-base text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Converse comigo normalmente. Conte qual máquina ou equipamento você precisa.
        </p>
      </div>

      {/* A CAIXA DE CONVERSA */}
      <form onSubmit={enviar} className="mt-5 sm:mt-7" role="search" aria-label="Buscar máquinas">
        <div className="relative">
          <input
            type="text"
            value={termo}
            onChange={(e) => setTermo(e.target.value)}
            placeholder="Ex.: escavadeira 20 toneladas, caminhão basculante, trator 75 cv…"
            aria-label="O que você está procurando hoje?"
            autoComplete="off"
            className="w-full pl-4 sm:pl-5 pr-14 sm:pr-16 py-4 sm:py-5 text-base sm:text-lg rounded-2xl bg-white border-2 border-slate-200 shadow-lg shadow-slate-200/60 text-slate-900 placeholder:text-slate-400 font-medium outline-none transition focus:border-[#FF6B00] focus:ring-4 focus:ring-[#FF6B00]/15"
          />
          {/* O BOTÃO DE ENVIAR: aqui a pessoa conversa, não navega. */}
          <button
            type="submit"
            aria-label="Enviar busca"
            title="Buscar"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shadow-lg shadow-orange-500/30 hover:bg-orange-600 active:scale-95 transition-all cursor-pointer"
          >
            <Send className="w-5 h-5 stroke-[2.5]" aria-hidden="true" />
          </button>
        </div>
      </form>

      {/* AS SUGESTÕES: frases prontas que a pessoa pode mandar. */}
      <div className="mt-4 sm:mt-5 flex flex-col items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Ou comece por uma sugestão
        </span>
        <div className="w-full flex flex-wrap items-center justify-center gap-2">
          {SUGESTOES_DE_BUSCA.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() => usarSugestao(sugestao)}
              className="px-3.5 py-2 rounded-full bg-white border border-slate-200 text-xs sm:text-sm font-bold text-slate-600 hover:border-[#FF6B00] hover:text-[#FF6B00] hover:bg-orange-50/60 transition-all cursor-pointer active:scale-95 shadow-xs"
            >
              {sugestao}
            </button>
          ))}
        </div>
      </div>

      {/* OS 4 SEGMENTOS: o mesmo filtro do carrossel de chips. */}
      <div className="mt-4 sm:mt-5 flex flex-col items-center gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
          Ou procure por segmento
        </span>
        <div className="w-full flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
          {CATEGORIAS_DA_BUSCA.map((categoria) => {
            const ativo = selectedCategory === categoria.id;
            const total = categoryCounts[categoria.id];

            return (
              <button
                key={categoria.id}
                type="button"
                onClick={() => onSelectCategory(categoria.id)}
                aria-pressed={ativo}
                className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full text-xs sm:text-sm font-black whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 border-2 select-none shadow-xs active:scale-95 ${
                  ativo
                    ? 'bg-[#0F172A] text-white border-[#FF6B00] shadow-md ring-4 ring-orange-500/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-orange-300 hover:bg-orange-50/40 hover:text-slate-900'
                }`}
              >
                <span className="text-sm sm:text-base" role="img" aria-label={categoria.rotulo}>
                  {categoria.emoji}
                </span>
                <span className="font-display tracking-tight">{categoria.rotulo}</span>
                {typeof total === 'number' && (
                  <span
                    className={`text-[11px] font-black px-1.5 py-0.5 rounded-full ${
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

      {/* O SELO DE SEGURANÇA: a pessoa pesquisa sem cadastro. */}
      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 text-center">
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
        <p className="text-[11px] sm:text-xs font-bold text-slate-500 leading-relaxed max-w-md">
          Pesquise sem cadastro. Você só informa seus dados quando decidir falar com o vendedor.
        </p>
      </div>
    </section>
  );
};
