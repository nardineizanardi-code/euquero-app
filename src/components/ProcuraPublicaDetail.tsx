import React, { useMemo } from 'react';
import { 
  Bell, MapPin, CheckCircle2, ArrowRight, ShieldCheck, 
  Sparkles, X, ChevronRight, Share2, Layers, AlertCircle
} from 'lucide-react';
import { ListingItem, ProcuraPublica } from '../types';
import { calculateCompradoresInteressados, toProcuraPublica } from '../services/productService';
import { getShareableProductUrl } from '../utils/productLinks';

interface ProcuraPublicaDetailProps {
  item: ListingItem;
  allListings: ListingItem[];
  onClose?: () => void;
  onTenhoEssaMaquina?: (item: ListingItem) => void;
  onOpenSimilarProcura?: (item: ListingItem) => void;
}

export const ProcuraPublicaDetail: React.FC<ProcuraPublicaDetailProps> = ({
  item,
  allListings,
  onClose,
  onTenhoEssaMaquina,
  onOpenSimilarProcura
}) => {
  // Converte para ProcuraPublica com compradores reais
  const procura: ProcuraPublica = useMemo(() => {
    return toProcuraPublica(item, allListings);
  }, [item, allListings]);

  // Formata preço em Reais
  const formattedBudget = useMemo(() => {
    const val = item.price || (procura.orcamentoMax / 100);
    return val > 0 ? `R$ ${val.toLocaleString('pt-BR')}` : 'A combinar';
  }, [item.price, procura.orcamentoMax]);

  // Formata o ano mínimo ou intervalo
  const formattedYear = useMemo(() => {
    if (item.yearMin && item.yearMax && item.yearMin !== item.yearMax) {
      return `${item.yearMin} a ${item.yearMax}`;
    }
    if (item.yearMin) {
      return `${item.yearMin} ou mais`;
    }
    if (item.year) {
      return `${item.year} ou mais`;
    }
    return '2018 ou mais';
  }, [item.yearMin, item.yearMax, item.year]);

  // Formata alcance geográfico
  const formattedAlcance = useMemo(() => {
    if (procura.estadoAlcance === 'brasil' || item.geoPreference === 'brasil_todo') {
      return 'Brasil todo';
    }
    const stateMap: Record<string, string> = {
      SC: 'Santa Catarina e região',
      SP: 'São Paulo e região',
      PR: 'Paraná e região',
      MG: 'Minas Gerais e região',
      RS: 'Rio Grande do Sul e região',
      GO: 'Goiás e região',
      MT: 'Mato Grosso e região',
      MS: 'Mato Grosso do Sul e região',
      BA: 'Bahia e região',
      RJ: 'Rio de Janeiro e região'
    };
    return stateMap[item.locationState?.toUpperCase()] || `${item.locationState || 'Estado'} e região`;
  }, [procura.estadoAlcance, item.geoPreference, item.locationState]);

  // Busca até 4 anúncios de buscas similares na mesma categoria
  const similarProcuras = useMemo(() => {
    return allListings
      .filter((l) => l.intent === 'buy' && l.id !== item.id)
      .slice(0, 4);
  }, [allListings, item.id]);

  const handleShare = () => {
    const url = getShareableProductUrl(item);
    if (navigator.share) {
      navigator.share({
        title: `Procura-se: ${procura.titulo}`,
        text: `Comprador em ${item.locationCity}/${item.locationState} procura ${procura.titulo} (orçamento até ${formattedBudget})`,
        url
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(url);
      alert('Link da procura copiado para a área de transferência!');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
      
      {/* 1. FAIXA NO TOPO: 🔔 X pessoas também procuram isso agora */}
      <div className="bg-amber-400 text-amber-950 px-4 sm:px-6 py-3.5 flex items-center justify-between border-b border-amber-500/30">
        <div className="flex items-center gap-2.5 font-bold text-xs sm:text-sm">
          <span className="text-base sm:text-lg animate-bounce">🔔</span>
          <span>
            <strong className="font-black">{procura.compradoresInteressados} pessoas</strong> também procuram isso agora
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleShare}
            className="w-8 h-8 rounded-full bg-amber-500/30 hover:bg-amber-500/50 text-amber-950 flex items-center justify-center transition-colors cursor-pointer"
            title="Compartilhar procura"
          >
            <Share2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-amber-500/30 hover:bg-amber-500/50 text-amber-950 flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* CORPO PRINCIPAL COM SCROLL */}
      <div className="p-5 sm:p-8 space-y-6 overflow-y-auto max-h-[85vh]">

        {/* 2. CABEÇALHO DA PROCURA */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full w-fit border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Procura ativa · {item.locationCity}/{item.locationState}</span>
          </div>

          <div>
            <span className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-slate-400 block mb-1">
              Procura-se
            </span>
            <h1 className="text-[32px] sm:text-[40px] font-[800] text-slate-900 leading-[1.15] tracking-tight">
              {procura.titulo}
            </h1>
          </div>

          {/* 2018 ou mais · até R$ 520.000 (18px, cinza) */}
          <div className="text-[18px] text-slate-500 font-medium">
            {formattedYear} · <span className="text-slate-900 font-bold font-mono">até {formattedBudget}</span>
          </div>

          {/* 📍 Alcance: Santa Catarina e região (ou "Brasil todo") */}
          <div className="flex items-center gap-2 text-sm sm:text-base font-semibold text-slate-700 pt-1">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Alcance: <strong className="text-slate-900">{formattedAlcance}</strong></span>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* 3. O QUE ESTA PROCURA DESCONTA / CONSIDERA */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
            O QUE ESTA PROCURA DESCONTA
          </h2>

          <ul className="space-y-2.5 text-xs sm:text-sm text-slate-700 font-medium">
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-black text-base leading-none">●</span>
              <span>
                {item.hoursUsed 
                  ? `Máquina com ${item.hoursUsed.toLocaleString('pt-BR')}h vai ter que ser negociada`
                  : 'Máquinas com horímetro elevado ou pequenas pendências terão valor negociado'}
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-emerald-600 font-black text-base leading-none">●</span>
              <span>
                A pessoa quer fechar rápido {item.urgency === 'imediata' ? '(urgência imediata)' : ''}
              </span>
            </li>
            {item.description && (
              <li className="flex items-start gap-2.5">
                <span className="text-emerald-600 font-black text-base leading-none">●</span>
                <span className="italic text-slate-600">
                  "{item.description}"
                </span>
              </li>
            )}
          </ul>
        </div>

        {/* 4. BOTÃO VERDE LARGURA TODA, 64px [ TENHO ESSA MÁQUINA ] */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => onTenhoEssaMaquina ? onTenhoEssaMaquina(item) : null}
            className="w-full h-16 bg-[#00A86B] hover:bg-emerald-600 active:scale-[0.98] text-white font-[900] text-lg sm:text-xl rounded-2xl shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-3 transition-all cursor-pointer uppercase tracking-wider"
          >
            <span>TENHO ESSA MÁQUINA</span>
            <ArrowRight className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* 5. COMO FUNCIONA EM 3 PASSOS */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Como funciona em 3 passos
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <span className="text-xs font-bold text-slate-700">
                Você anuncia com fotos
              </span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <span className="text-xs font-bold text-slate-700">
                A pessoa recebe seu contato
              </span>
            </div>

            <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <span className="text-xs font-bold text-slate-700">
                Vocês negociam direto
              </span>
            </div>
          </div>
        </div>

        {/* 6. VEJO SÓ 4 ANÚNCIOS DE BUSCA SIMILAR */}
        {similarProcuras.length > 0 && (
          <div className="pt-2 space-y-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Vejo só {similarProcuras.length} anúncios de busca similar
              </h3>
              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Compradores Ativos
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {similarProcuras.map((sim) => (
                <div
                  key={sim.id}
                  onClick={() => onOpenSimilarProcura ? onOpenSimilarProcura(sim) : null}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 block truncate group-hover:text-emerald-700">
                      {sim.title}
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      {sim.locationCity}/{sim.locationState} · <strong className="text-emerald-700 font-mono">até R$ {sim.price.toLocaleString('pt-BR')}</strong>
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
