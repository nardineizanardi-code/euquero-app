import React from 'react';
import { ShoppingBag, Tag, Cpu, MessageSquare, ArrowRight } from 'lucide-react';

interface HowItWorksProps {
  onOpenWizard: (intent: 'buy' | 'sell') => void;
}

export const HowItWorks: React.FC<HowItWorksProps> = ({ onOpenWizard }) => {
  return (
    <section className="py-12 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block mb-1">
            Como Funciona o Eu Quero
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-slate-900 tracking-tight">
            Conectamos quem quer comprar direto com quem quer vender
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            Eliminamos os anúncios perdidos. Nosso assistente interativo colhe os detalhes técnicos e chama ambas as pontas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs relative">
            <span className="text-xs font-bold text-slate-400 block mb-2 font-mono">
              01. ESCOLHA SEU OBJETIVO
            </span>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold">
                Quero Comprar
              </span>
              <span className="text-slate-400 text-xs">ou</span>
              <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 text-xs font-bold">
                Quero Vender
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Clique no botão do seu objetivo. Você terá um espaço dedicado tanto para declarar o que busca quanto para anunciar o que possui.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs relative">
            <span className="text-xs font-bold text-slate-400 block mb-2 font-mono">
              02. O ASSISTENTE PERGUNTA TUDO
            </span>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              Nova ou Usada? Tipo, Marca, Modelo & Ano
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              O aplicativo conduz com perguntas claras: se for máquina de construção, pergunta se é escavadeira ou retro, marca CAT ou Volvo, modelo, horímetro e faixa de ano aceita.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs relative">
            <span className="text-xs font-bold text-emerald-700 block mb-2 font-mono">
              03. MATCH & NEGOCIAÇÃO DIRETA
            </span>
            <h3 className="text-sm font-bold text-slate-900 mb-2">
              O App Chama as Pessoas Juntas
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              O sistema calcula o cruzamento em tempo real (categoria, modelo, orçamento) e abre o canal de chat e WhatsApp direto entre comprador e vendedor.
            </p>
          </div>
        </div>

        {/* Action strip */}
        <div className="mt-8 p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-700">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Mais de <strong>200+ especificações técnicas</strong> cadastradas prontas para cruzar.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenWizard('buy')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition-colors shadow-xs"
            >
              Testar Quero Comprar
            </button>
            <button
              onClick={() => onOpenWizard('sell')}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white cursor-pointer transition-colors shadow-xs"
            >
              Testar Quero Vender
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
