import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, AlertCircle, Camera, RefreshCw, ImageOff } from 'lucide-react';
import { CardImageWithFallback } from './CardImageWithFallback';

interface ProductGalleryProps {
  images?: string[];
  title?: string;
  category?: string;
  locationCity?: string;
  locationState?: string;
}

export const ProductGallery: React.FC<ProductGalleryProps> = ({
  images,
  title = 'Máquina Pesada',
  category = 'linha_amarela',
  locationCity,
  locationState,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [brokenPhotos, setBrokenPhotos] = useState<Record<number, boolean>>({});
  const [customPhotos, setCustomPhotos] = useState<string[] | null>(null);

  // Amostras padrão de alta qualidade se nenhuma for enviada
  const defaultExcavatorPhotos = [
    '/cat_320d_excavator.jpg',
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80'
  ];

  const activePhotos = customPhotos || (images && images.length > 0 ? images : defaultExcavatorPhotos);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : activePhotos.length - 1));
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIndex((prev) => (prev < activePhotos.length - 1 ? prev + 1 : 0));
  };

  const handlePhotoError = (idx: number) => {
    setBrokenPhotos((prev) => ({ ...prev, [idx]: true }));
  };

  const handleRestorePhoto = (idx: number) => {
    const fallback = defaultExcavatorPhotos[idx % defaultExcavatorPhotos.length];
    setCustomPhotos((prev) => {
      const list = [...(prev || activePhotos)];
      list[idx] = fallback;
      return list;
    });
    setBrokenPhotos((prev) => ({ ...prev, [idx]: false }));
  };

  // Se não houver fotos mesmo após verificação
  if (!activePhotos || activePhotos.length === 0) {
    return (
      <div className="w-full aspect-[16/9] bg-slate-100 rounded-2xl border border-slate-200 flex flex-col items-center justify-center p-6 text-slate-400">
        <ImageOff className="w-12 h-12 mb-2 stroke-1" />
        <span className="text-sm font-bold text-slate-500">Sem fotos cadastradas</span>
      </div>
    );
  }

  const currentImage = activePhotos[selectedIndex] || activePhotos[0];
  const isCurrentBroken = !!brokenPhotos[selectedIndex];

  return (
    <div className="w-full space-y-2.5">
      {/* 1. FOTO PRINCIPAL GRANDE (800px / Aspect 16:9) */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-[#F3F4F6] rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
        
        {/* Imagem com suporte a fallbacks e lazy load */}
        <CardImageWithFallback
          src={currentImage}
          alt={`${title} - Foto ${selectedIndex + 1}`}
          category={category}
          width={800}
          aspectRatioClass="aspect-[16/10] sm:aspect-[16/9]"
          onError={() => handlePhotoError(selectedIndex)}
        />

        {/* Gradiente escuro para contraste dos textos */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

        {/* Selo Galeria Oficial Pública */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-md border border-white/20 shadow-md">
            Foto {selectedIndex + 1} de {activePhotos.length}
          </span>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
            Fotos Públicas
          </span>
        </div>

        {/* Overlay se a foto der erro 404 / broken */}
        {isCurrentBroken && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-slate-950/90 text-white text-center">
            <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
            <h5 className="text-sm font-black text-white">Foto {selectedIndex + 1} com erro no link original</h5>
            <p className="text-xs text-slate-400 mt-1 mb-3 max-w-xs">
              O link desta foto não pôde ser carregado no navegador.
            </p>
            <button
              type="button"
              onClick={() => handleRestorePhoto(selectedIndex)}
              className="px-4 py-2 rounded-xl bg-[#FF6B00] hover:bg-orange-600 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-transform active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Foto com erro - clique para trocar</span>
            </button>
          </div>
        )}

        {/* Setas para navegar */}
        {activePhotos.length > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer opacity-90 hover:scale-105 active:scale-90 z-20"
              title="Foto anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer opacity-90 hover:scale-105 active:scale-90 z-20"
              title="Próxima foto"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}

        {/* Localização na foto */}
        {locationCity && (
          <div className="absolute bottom-3 left-3 z-20 text-white text-xs font-bold bg-slate-900/70 backdrop-blur-xs px-2.5 py-1 rounded-lg">
            📍 {locationCity}{locationState ? `, ${locationState}` : ''}
          </div>
        )}
      </div>

      {/* 2. MINIATURAS CLICÁVEIS EMBAIXO */}
      {activePhotos.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {activePhotos.map((p, idx) => {
            const isBroken = !!brokenPhotos[idx];
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setSelectedIndex(idx)}
                className={`relative w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                  selectedIndex === idx 
                    ? 'border-[#FF6B00] scale-105 shadow-md ring-2 ring-orange-500/20' 
                    : 'border-slate-200 opacity-70 hover:opacity-100'
                } ${isBroken ? 'border-amber-500' : ''}`}
              >
                <img
                  src={p}
                  alt={`Miniatura ${idx + 1}`}
                  loading="lazy"
                  decoding="async"
                  onError={() => handlePhotoError(idx)}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 right-1 px-1 rounded text-[9px] font-mono font-bold bg-black/70 text-white">
                  #{idx + 1}
                </span>
                {isBroken && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center text-[10px] text-amber-300 font-bold">
                    ⚠️ Erro
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
