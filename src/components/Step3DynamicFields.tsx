import React from 'react';
import { 
  Wrench, Truck, Tractor, Calendar, Gauge, Zap 
} from 'lucide-react';

interface Step3DynamicFieldsProps {
  /** Categoria escolhida no Passo 1: 'maquinas' | 'agro' | 'caminhoes' | 'veiculos' */
  category: string;
  
  // Campos comuns
  brand: string;
  onChangeBrand: (val: string) => void;
  model: string;
  onChangeModel: (val: string) => void;
  yearMin: number;
  onChangeYearMin: (val: number) => void;
  yearMax: number;
  onChangeYearMax: (val: number) => void;
  hoursOrKm: string;
  onChangeHoursOrKm: (val: string) => void;

  // Campos opcionais mantidos para compatibilidade
  propertyType?: string;
  onChangePropertyType?: (val: string) => void;
  areaM2?: string;
  onChangeAreaM2?: (val: string) => void;
  bedrooms?: string;
  onChangeBedrooms?: (val: string) => void;

  // Específico para Agronegócio
  powerHp?: string;
  onChangePowerHp?: (val: string) => void;

  // Sugestões
  popularBrands?: string[];
  popularModels?: string[];
}

/** Opções de faixa de potência CV para Agronegócio */
const POWER_HP_OPTIONS = [
  { id: 'ate_100', label: 'Até 100 CV', desc: 'Tratores leves / Pequenas propriedades' },
  { id: '100_a_180', label: '100 a 180 CV', desc: 'Porte médio / Lavoura geral' },
  { id: '180_a_280', label: '180 a 280 CV', desc: 'Pesado / Plantio direto' },
  { id: 'acima_280', label: 'Acima de 280 CV', desc: 'Alta potência / Articulados' },
];

export const Step3DynamicFields: React.FC<Step3DynamicFieldsProps> = ({
  category,
  brand,
  onChangeBrand,
  model,
  onChangeModel,
  yearMin,
  onChangeYearMin,
  yearMax,
  onChangeYearMax,
  hoursOrKm,
  onChangeHoursOrKm,
  powerHp = '',
  onChangePowerHp,
  popularBrands = [],
  popularModels = [],
}) => {
  // =========================================================================
  // CATEGORIA 2: AGRONEGÓCIO & IMPLEMENTOS (Marca, Modelo, Ano e Potência CV)
  // =========================================================================
  if (category === 'agro') {
    const agroBrandsDefault = ['John Deere', 'Massey Ferguson', 'New Holland', 'Case IH', 'Valtra', 'Jacto', 'Stara', 'Kuhn'];
    const activeAgroBrands = popularBrands.length > 0 ? popularBrands : agroBrandsDefault;

    return (
      <div className="space-y-4">
        {/* Banner do Contexto Dinâmico */}
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-800">
          <Tractor className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Configurando especificações de <strong>Agronegócio & Implementos</strong></span>
        </div>

        {/* 1. Marca */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            1. Marca de Preferência
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {activeAgroBrands.slice(0, 8).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onChangeBrand(b)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  brand === b
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Ou digite outra marca agro (ex: Baldan, Jan, Kuhn)..."
            value={brand}
            onChange={(e) => onChangeBrand(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
          />
        </div>

        {/* 2. Modelo */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            2. Modelo Desejado (Opcional)
          </label>
          {popularModels.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {popularModels.slice(0, 6).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onChangeModel(m)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer ${
                    model === m
                      ? 'bg-slate-800 text-white border-slate-800 font-bold'
                      : 'bg-white text-slate-600 border-slate-200'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          <input
            type="text"
            placeholder="Ex: 6115J, 7200J, MF 7719, Magnum 340, T7.240..."
            value={model}
            onChange={(e) => onChangeModel(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
          />
        </div>

        {/* 3. Faixa de Ano */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-600" />
              <span>3. Faixa de Ano Aceita</span>
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-slate-500">Ano Mínimo:</span>
              <input
                type="number"
                min="1990"
                max="2027"
                value={yearMin}
                onChange={(e) => onChangeYearMin(parseInt(e.target.value) || 2015)}
                className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
            <div>
              <span className="text-xs text-slate-500">Ano Máximo:</span>
              <input
                type="number"
                min="1990"
                max="2027"
                value={yearMax}
                onChange={(e) => onChangeYearMax(parseInt(e.target.value) || 2024)}
                className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* 4. Potência do Motor (CV) */}
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>4. Potência Recomendada do Motor (CV)</span>
            </span>
          </label>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {POWER_HP_OPTIONS.map((opt) => {
              const isSelected = powerHp.toLowerCase().includes(opt.id.replace('_', ' '));
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangePowerHp && onChangePowerHp(opt.label)}
                  className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                    {opt.desc}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="relative">
            <input
              type="number"
              min="40"
              step="5"
              value={powerHp.replace(/\D/g, '')}
              onChange={(e) => onChangePowerHp && onChangePowerHp(e.target.value ? `${e.target.value} CV` : '')}
              placeholder="Ou digite a potência exata em CV (ex: 180)..."
              className="w-full pl-3 pr-12 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 font-mono font-bold"
            />
            <span className="absolute right-3 top-2 text-[11px] font-bold text-slate-400">
              CV
            </span>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // CATEGORIAS 1 & 3: MÁQUINAS OU CAMINHÕES & UTILITÁRIOS
  // =========================================================================
  const isMachinery = category === 'maquinas';
  const labelHoursOrKm = isMachinery ? 'Horas de Uso Máximas (Horímetro)' : 'Quilometragem Máxima (KM)';
  const placeholderHoursOrKm = isMachinery ? 'Ex: 5000 horas' : 'Ex: 80000 km';

  return (
    <div className="space-y-4">
      {/* Banner do Contexto Dinâmico */}
      <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-700">
        {isMachinery ? (
          <Wrench className="w-4 h-4 text-orange-600 shrink-0" />
        ) : (
          <Truck className="w-4 h-4 text-blue-600 shrink-0" />
        )}
        <span>
          Configurando especificações de <strong>{isMachinery ? 'Máquinas de Construção & Pesadas' : 'Caminhões & Utilitários'}</strong>
        </span>
      </div>

      {/* 1. Marca */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          1. Qual a marca de preferência?
        </label>
        {popularBrands.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {popularBrands.slice(0, 8).map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => onChangeBrand(b)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                  brand === b
                    ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                {b}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder="Ou digite outra marca..."
          value={brand}
          onChange={(e) => onChangeBrand(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
        />
      </div>

      {/* 2. Modelo */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
          2. Qual o modelo desejado (opcional)?
        </label>
        {popularModels.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {popularModels.slice(0, 6).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChangeModel(m)}
                className={`px-2.5 py-1 text-xs rounded-md border transition-all cursor-pointer whitespace-nowrap ${
                  model === m
                    ? 'bg-slate-800 text-white border-slate-800 font-bold'
                    : 'bg-white text-slate-600 border-slate-200'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          placeholder={isMachinery ? 'Ex: 320D, 3CX, EC210, PC200, 580N...' : 'Ex: Scania R450, FH 540, Hilux SRX, Constellation 24.280...'}
          value={model}
          onChange={(e) => onChangeModel(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
        />
      </div>

      {/* 3. Faixa de Ano de Fabricação */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-600" />
            <span>3. Faixa de Ano de Fabricação Aceita</span>
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-xs text-slate-500">Ano Mínimo:</span>
            <input
              type="number"
              min="1995"
              max="2027"
              value={yearMin}
              onChange={(e) => onChangeYearMin(parseInt(e.target.value) || 2018)}
              className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>
          <div>
            <span className="text-xs text-slate-500">Ano Máximo:</span>
            <input
              type="number"
              min="1995"
              max="2027"
              value={yearMax}
              onChange={(e) => onChangeYearMax(parseInt(e.target.value) || 2024)}
              className="w-full mt-1 px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-mono font-bold"
            />
          </div>
        </div>
      </div>

      {/* 4. Quilometragem ou Horímetro */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
          <span className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-slate-600" />
            <span>4. {labelHoursOrKm} (Opcional)</span>
          </span>
        </label>
        <div className="relative mt-1">
          <input
            type="number"
            min="0"
            step="500"
            value={hoursOrKm}
            onChange={(e) => onChangeHoursOrKm(e.target.value)}
            placeholder={placeholderHoursOrKm}
            className="w-full pl-3 pr-14 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold text-slate-900"
          />
          <span className="absolute right-3 top-2.5 text-xs font-bold text-slate-400">
            {isMachinery ? 'horas' : 'km'}
          </span>
        </div>
      </div>
    </div>
  );
};
