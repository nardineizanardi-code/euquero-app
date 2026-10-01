import React from 'react';
import { Search, Tractor, Truck, Container } from 'lucide-react';

interface BuyerMachineSearchIconProps {
  category?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Silhueta vetorial de Escavadeira / Máquina Pesada
 */
const ExcavatorGraphic: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg 
    viewBox="0 0 64 64" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    {/* Esteiras / Material Rodante */}
    <rect x="8" y="46" width="34" height="10" rx="5" />
    <circle cx="13" cy="51" r="2.5" fill="#FFFFFF" />
    <circle cx="21" cy="51" r="2.5" fill="#FFFFFF" />
    <circle cx="29" cy="51" r="2.5" fill="#FFFFFF" />
    <circle cx="37" cy="51" r="2.5" fill="#FFFFFF" />
    {/* Cabine e Corpo */}
    <path d="M12 46 L12 33 Q12 30 15 30 L28 30 L34 38 L40 38 L40 46 Z" />
    <rect x="15" y="22" width="13" height="9" rx="1.5" />
    {/* Braço Hidráulico e Caçamba */}
    <path d="M35 38 L45 18 Q46 16 48 18 L55 27 L60 38 L54 42 L50 35 L44 24 L37 40 Z" />
    <path d="M54 36 L61 38 L58 44 L52 42 Z" />
  </svg>
);

/**
 * Ícone Oficial do Card COMPRO:
 * Ícone da Máquina / Veículo / Implemento + Lupa em destaque (NUNCA chave inglesa)
 */
export const BuyerMachineSearchIcon: React.FC<BuyerMachineSearchIconProps> = ({
  category = 'linha_amarela',
  className = ''
}) => {
  const isAgro = category === 'agro' || category === 'agricola';
  const isTruck = category === 'caminhoes' || category === 'caminhao' || category === 'veiculos';
  const isImplementos = category === 'implementos' || category === 'implementos_rodoviarios';

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Máquina / Veículo Silhueta */}
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-700 flex items-center justify-center shadow-xs">
        {isAgro ? (
          <Tractor className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700" strokeWidth={1.75} />
        ) : isTruck ? (
          <Truck className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700" strokeWidth={1.75} />
        ) : isImplementos ? (
          <Container className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700" strokeWidth={1.75} />
        ) : (
          <ExcavatorGraphic className="w-10 h-10 sm:w-12 sm:h-12 text-emerald-700" />
        )}
      </div>

      {/* Lupa de Procura Ativa sobreposta no canto */}
      <div className="absolute -bottom-1 -right-1 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border-2 border-white ring-1 ring-emerald-500/30">
        <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.75]" />
      </div>
    </div>
  );
};
