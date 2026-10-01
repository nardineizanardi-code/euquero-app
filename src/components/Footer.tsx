import React from 'react';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { InstallAppButton } from './InstallAppButton';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-10 pb-28 sm:pb-24 border-t border-slate-800 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Seção de Instalação do App PWA no Rodapé */}
        <div className="mb-8 p-4 sm:p-5 rounded-3xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-10 h-10 rounded-full bg-[#0F172A] border-2 border-[#FF6B00] flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md">
              <span className="text-white">E</span>
              <span className="text-[#FF6B00]">Q</span>
            </div>
            <div>
              <h4 className="text-sm font-black text-white">Aplicativo Oficial EuQuero</h4>
              <p className="text-[11px] text-slate-400">Instale na sua tela inicial para navegar rápido e receber alertas de match</p>
            </div>
          </div>

          <InstallAppButton variant="footer" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <span className="text-lg font-bold tracking-tight text-white font-display">
              Eu <span className="text-emerald-500">Quero</span>
            </span>
            <p className="text-slate-400 max-w-sm leading-relaxed text-xs">
              A plataforma inteligente que une diretamente quem quer comprar e quem quer vender máquinas de construção, veículos comerciais, utilitários pesados e imóveis.
            </p>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Categorias Atendidas</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Máquinas de Construção & Pesadas</li>
              <li>Caminhões & Frotas Comerciais</li>
              <li>Galpões & Imóveis Corporativos</li>
              <li>Tratores Agrícolas & Implementos</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3">Segurança & Match</h4>
            <ul className="space-y-2 text-slate-400">
              <li>Algoritmo de Compatibilidade Técnica</li>
              <li>Negociação Direta sem Intermediários</li>
              <li>Canal de WhatsApp Seguro</li>
              <li>Validação de Horímetro e Laudo</li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-slate-500">
            © {new Date().getFullYear()} Eu Quero. Todos os direitos reservados. Conectando quem quer comprar e quem quer vender.
          </p>
          <div className="flex items-center gap-4 text-slate-500">
            <span>Privacidade</span>
            <span>·</span>
            <span>Termos de Uso</span>
            <span>·</span>
            <span>Suporte</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
