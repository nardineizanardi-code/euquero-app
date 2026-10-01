import React from 'react';
import { DollarSign, ShieldAlert, Sparkles, Check, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import { BudgetRangeType, PreferenciaCompra } from '../types';

export const BUDGET_OPTIONS: {
  id: BudgetRangeType;
  label: string;
  sublabel: string;
  defaultCeiling: number;
}[] = [
  {
    id: 'ate_100k',
    label: 'Até R$ 100.000',
    sublabel: 'Entrada / Equipamentos leves',
    defaultCeiling: 100000,
  },
  {
    id: '100k_a_200k',
    label: 'R$ 100k a R$ 200k',
    sublabel: 'Seminovos / Porte médio',
    defaultCeiling: 200000,
  },
  {
    id: '200k_a_500k',
    label: 'R$ 200k a R$ 500k',
    sublabel: 'Pesados / Linha amarela / Frotas',
    defaultCeiling: 500000,
  },
  {
    id: 'acima_500k',
    label: 'Acima de R$ 500k',
    sublabel: 'Maquinário pesado / Grandes ativos',
    defaultCeiling: 850000,
  },
  {
    id: 'a_combinar',
    label: 'A combinar',
    sublabel: 'Negociação aberta de acordo com o ativo',
    defaultCeiling: 0,
  },
];

interface Step4BuyingBudgetProps {
  preference: Partial<PreferenciaCompra>;
  selectedRange: BudgetRangeType | null;
  onSelectRange: (range: BudgetRangeType, ceilingPrice: number) => void;
  customPrice: string;
  onChangeCustomPrice: (val: string) => void;
  isError: boolean;
}

/**
 * Passo 4: Qualificação OBRIGATÓRIA de Orçamento Máximo do Comprador
 * Salva no estado PreferenciaCompra
 */
export const Step4BuyingBudget: React.FC<Step4BuyingBudgetProps> = ({
  preference,
  selectedRange,
  onSelectRange,
  customPrice,
  onChangeCustomPrice,
  isError,
}) => {
  return (
    <div className="space-y-4">
      {/* Cabeçalho da Qualificação */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-700 mb-0.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Filtro de Qualificação do Comprador</span>
          </div>
          <h4 className="text-sm sm:text-base font-bold text-slate-900">
            Qual é o seu Orçamento Máximo? <span className="text-rose-500 font-bold">*</span>
          </h4>
          <p className="text-xs text-slate-500 mt-0.5 leading-snug">
            Esta informação é essencial para nosso algoritmo filtrar apenas vendedores com ativos no seu poder de compra.
          </p>
        </div>

        <span className="shrink-0 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border border-emerald-200">
          Obrigatório
        </span>
      </div>

      {/* Grid de Seleção de Faixas de Orçamento */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {BUDGET_OPTIONS.map((opt) => {
          const isSelected = selectedRange === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelectRange(opt.id, opt.defaultCeiling)}
              className={`p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer flex items-center justify-between group ${
                isSelected
                  ? 'bg-emerald-50/90 border-emerald-600 ring-2 ring-emerald-600/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-600 text-white'
                      : 'border-slate-300 bg-white group-hover:border-slate-400'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>

                <div>
                  <span className={`text-xs sm:text-sm font-bold block ${
                    isSelected ? 'text-emerald-950' : 'text-slate-800'
                  }`}>
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-slate-500 block leading-tight">
                    {opt.sublabel}
                  </span>
                </div>
              </div>

              {isSelected && (
                <span className="text-xs font-bold text-emerald-600">
                  Selecionado
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Alerta de campo obrigatório */}
      {isError && !selectedRange && (
        <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 font-semibold animate-shake">
          <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
          <span>Por favor, selecione uma faixa de orçamento para continuar.</span>
        </div>
      )}

      {/* Ajuste fino opcional de teto exato (se não for "A Combinar") */}
      {selectedRange && selectedRange !== 'a_combinar' && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
              Deseja informar o teto numérico exato? (Opcional)
            </label>
            <span className="text-[10px] text-slate-400">Preenchimento rápido</span>
          </div>

          <div className="relative">
            <span className="absolute left-3 top-2 text-slate-400 font-semibold text-sm">
              R$
            </span>
            <input
              type="number"
              min="1000"
              step="5000"
              value={customPrice}
              onChange={(e) => onChangeCustomPrice(e.target.value)}
              placeholder="Ex: 380000"
              className="w-full pl-10 pr-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tabular-nums font-bold text-slate-900"
            />
          </div>
        </div>
      )}
    </div>
  );
};
