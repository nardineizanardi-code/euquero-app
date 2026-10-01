import React, { useState, useEffect } from 'react';
import { Truck, Tractor, Building2, Wrench, ShieldAlert } from 'lucide-react';

interface CardImageWithFallbackProps {
  src?: string;
  alt: string;
  category?: string;
  className?: string;
  imageClassName?: string;
  aspectRatioClass?: string;
}

/**
 * Excavator silhouette SVG for heavy machinery fallback
 */
const ExcavatorSilhouette: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg 
    viewBox="0 0 64 64" 
    fill="currentColor" 
    className={className}
    aria-hidden="true"
  >
    {/* Esteiras / Material Rodante */}
    <rect x="8" y="46" width="34" height="10" rx="5" />
    <circle cx="13" cy="51" r="2.5" fill="#F3F4F6" />
    <circle cx="21" cy="51" r="2.5" fill="#F3F4F6" />
    <circle cx="29" cy="51" r="2.5" fill="#F3F4F6" />
    <circle cx="37" cy="51" r="2.5" fill="#F3F4F6" />
    {/* Cabine e Corpo */}
    <path d="M12 46 L12 33 Q12 30 15 30 L28 30 L34 38 L40 38 L40 46 Z" />
    <rect x="15" y="22" width="13" height="9" rx="1.5" />
    {/* Braço Hidráulico e Caçamba */}
    <path d="M35 38 L45 18 Q46 16 48 18 L55 27 L60 38 L54 42 L50 35 L44 24 L37 40 Z" />
    <path d="M54 36 L61 38 L58 44 L52 42 Z" />
  </svg>
);

export const CardImageWithFallback: React.FC<CardImageWithFallbackProps> = ({
  src,
  alt,
  category = 'maquinas',
  className = '',
  imageClassName = '',
  aspectRatioClass = 'aspect-[16/10]'
}) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);

  // Reset state when source URL changes
  useEffect(() => {
    if (!src || src.trim() === '') {
      setHasError(true);
      setIsLoading(false);
    } else {
      setIsLoading(true);
      setHasError(false);
    }
  }, [src]);

  const renderCategoryIcon = () => {
    switch (category) {
      case 'linha_amarela':
      case 'maquinas':
        return <ExcavatorSilhouette className="w-14 h-14 text-[#9CA3AF]" />;
      case 'agricola':
      case 'agro':
        return <Tractor className="w-14 h-14 text-[#9CA3AF]" strokeWidth={1.5} />;
      case 'caminhao':
      case 'caminhoes':
      case 'veiculos':
        return <Truck className="w-14 h-14 text-[#9CA3AF]" strokeWidth={1.5} />;
      case 'implementos':
      case 'implementos_rodoviarios':
        return <Truck className="w-14 h-14 text-[#9CA3AF]" strokeWidth={1.5} />;
      default:
        return <ExcavatorSilhouette className="w-14 h-14 text-[#9CA3AF]" />;
    }
  };

  return (
    <div 
      className={`relative w-full ${aspectRatioClass} overflow-hidden bg-[#F3F4F6] ${className}`}
      style={{ backgroundColor: '#F3F4F6' }}
    >
      {/* 1. SKELETON LOADER ENQUANTO ESTÁ CARREGANDO */}
      {isLoading && !hasError && (
        <div 
          className="absolute inset-0 z-10 animate-pulse bg-gray-200 flex items-center justify-center"
          aria-label="Carregando foto..."
        >
          <div className="w-10 h-10 rounded-full bg-gray-300/80 animate-ping opacity-25" />
        </div>
      )}

      {/* 2. PLACEHOLDER QUANDO HÁ ERRO OU URL AUSENTE */}
      {hasError || !src ? (
        <div 
          className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center select-none"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          {/* Ícone da categoria centralizado em cinza médio #9CA3AF */}
          <div className="flex items-center justify-center text-[#9CA3AF] mb-2 transform transition-transform duration-300 hover:scale-105">
            {renderCategoryIcon()}
          </div>

          {/* Indicador de erro no canto inferior: "Foto não disponível" em fonte pequena e cinza */}
          <div className="absolute bottom-2.5 left-0 right-0 text-center px-2">
            <span 
              className="inline-block text-[11px] font-medium tracking-wide text-[#9CA3AF]"
              style={{ color: '#9CA3AF' }}
            >
              Foto não disponível
            </span>
          </div>
        </div>
      ) : (
        /* 3. IMAGEM PRINCIPAL COM EVENTO ONERROR */
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
          className={`w-full h-full object-cover object-center transition-opacity duration-300 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          } ${imageClassName}`}
        />
      )}
    </div>
  );
};
