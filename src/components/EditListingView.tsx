import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Save, Trash2, Upload, AlertCircle, CheckCircle2, 
  MapPin, DollarSign, Calendar, Clock, Tag, FileText, Video, Eye,
  PauseCircle, PlayCircle
} from 'lucide-react';
import { ListingItem } from '../types';
import { CardImageWithFallback } from './CardImageWithFallback';

interface EditListingViewProps {
  listingId: string;
  allListings: ListingItem[];
  onSave: (updatedItem: ListingItem) => void;
  onDelete: (itemId: string) => void;
  onBack: () => void;
  onViewProduct: (item: ListingItem) => void;
}

export const EditListingView: React.FC<EditListingViewProps> = ({
  listingId,
  allListings,
  onSave,
  onDelete,
  onBack,
  onViewProduct,
}) => {
  // Procura o item em allListings ou no banco local de vendedores
  const [initialItem, setInitialItem] = useState<ListingItem | null>(null);

  useEffect(() => {
    // 1. Procura em allListings
    let item = allListings.find(
      (l) => l.id === listingId || l.id.includes(listingId) || listingId.includes(l.id) || (l.id.slice(-8) === listingId.slice(-8))
    );

    // 2. Se não achou, procura em euquero_banco_vendedores
    if (!item) {
      try {
        const bancoStr = localStorage.getItem('euquero_banco_vendedores');
        if (bancoStr) {
          const list = JSON.parse(bancoStr);
          const found = list.find(
            (v: any) => v.id === listingId || (v.id && listingId.includes(v.id)) || (v.id && v.id.slice(-8) === listingId.slice(-8))
          );
          if (found) {
            item = {
              id: found.id || listingId,
              intent: 'sell',
              title: `Vendo ${found.maquina || 'Motoniveladora Timbermach 717T'} (${found.cidade || 'Joinville/SC'})`,
              category: found.categoriaId || 'linha_amarela',
              subcategoryType: (found.maquina || 'Motoniveladora').split(' ')[0],
              condition: 'usado',
              brand: found.brand || 'Timbermach',
              model: found.model || '717T',
              year: parseInt(found.ano) || 2021,
              hoursUsed: found.hoursUsed || 2400,
              price: found.valor || 520000,
              priceNegotiable: true,
              locationState: found.cidade?.includes('/') ? found.cidade.split('/')[1] : 'SC',
              locationCity: found.cidade?.includes('/') ? found.cidade.split('/')[0] : 'Joinville',
              description: found.description || `Disponível para venda: ${found.maquina || 'Motoniveladora Timbermach 717T'}. Revisões em dia.`,
              userName: found.nome || 'Nardinei Zanardi',
              userPhone: found.whatsapp || '(47) 99620-5669',
              createdAt: found.timestamp || new Date().toISOString(),
              status: 'active',
              images: (found.images && found.images.length > 0)
                ? found.images
                : (found.fotos && found.fotos.length > 0)
                ? found.fotos
                : ['/cat_320d_excavator.jpg']
            };
          }
        }
      } catch (e) {}
    }

    // 3. Fallback para item padrão se ainda não achou
    if (!item && allListings.length > 0) {
      item = allListings[0];
    }

    if (item) {
      setInitialItem(item);
      setTitle(item.title);
      setPrice(item.price ? item.price.toLocaleString('pt-BR') : '520.000');
      setBrand(item.brand || 'Timbermach');
      setModel(item.model || '717T');
      setYear(item.year?.toString() || '2021');
      setHoursUsed(item.hoursUsed?.toString() || '2400');
      setCategory(item.category || 'linha_amarela');
      setSubcategory(item.subcategoryType || 'Motoniveladora');
      setLocationCity(item.locationCity || 'Joinville');
      setLocationState(item.locationState || 'SC');
      setDescription(item.description || '');
      setVideoUrl(item.videoUrl || '');
      setPhotos(item.images && item.images.length > 0 ? item.images : ['/cat_320d_excavator.jpg']);
      setIsPaused(!!item.isPaused);
    }
  }, [listingId, allListings]);

  // Form states
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [hoursUsed, setHoursUsed] = useState('');
  const [category, setCategory] = useState('linha_amarela');
  const [subcategory, setSubcategory] = useState('Motoniveladora');
  const [locationCity, setLocationCity] = useState('');
  const [locationState, setLocationState] = useState('SC');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [isPaused, setIsPaused] = useState(false);

  // UI feedback & modals
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compressão WebP 800px para novos uploads
  const compressImageToWebP = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;
            const maxDim = 800;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              let dataUrl = canvas.toDataURL('image/webp', 0.82);
              if (!dataUrl || !dataUrl.startsWith('data:image/webp')) {
                dataUrl = canvas.toDataURL('image/jpeg', 0.85);
              }
              resolve(dataUrl);
            } else {
              resolve(e.target?.result as string);
            }
          } catch (err) {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => resolve(e.target?.result as string);
        img.src = e.target?.result as string;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const availableSlots = 12 - photos.length;
    if (availableSlots <= 0) {
      alert('Limite de 12 fotos atingido!');
      return;
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);
    const compressedPromises = filesToProcess.map((f) => compressImageToWebP(f));
    const newCompressedPhotos = await Promise.all(compressedPromises);

    setPhotos((prev) => [...prev, ...newCompressedPhotos]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = (idx: number) => {
    if (window.confirm('Deseja excluir esta mídia?')) {
      setPhotos((prev) => prev.filter((_, i) => i !== idx));
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!initialItem) return;

    setIsSaving(true);

    const numericPrice = parseFloat(price.replace(/\./g, '').replace(',', '.')) || 0;
    const numericYear = parseInt(year) || undefined;
    const numericHours = parseInt(hoursUsed.replace(/\D/g, '')) || undefined;

    const updated: ListingItem = {
      ...initialItem,
      title: title.trim() || initialItem.title,
      price: numericPrice,
      brand: brand.trim(),
      model: model.trim(),
      year: numericYear,
      hoursUsed: numericHours,
      category,
      subcategoryType: subcategory,
      locationCity: locationCity.trim(),
      locationState: locationState.trim(),
      description: description.trim(),
      videoUrl: videoUrl.trim() || undefined,
      images: photos.length > 0 ? photos : ['/cat_320d_excavator.jpg'],
      isPaused,
    };

    setTimeout(() => {
      onSave(updated);
      setIsSaving(false);
      setToastMessage('✅ Anúncio atualizado com sucesso!');
      setTimeout(() => {
        onViewProduct(updated);
      }, 1000);
    }, 400);
  };

  const handleConfirmDelete = () => {
    if (!initialItem) return;
    onDelete(initialItem.id);
    setShowDeleteModal(false);
  };

  if (!initialItem) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-orange-500 mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Anúncio não encontrado</h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          Não foi possível localizar o anúncio para edição.
        </p>
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
        >
          Voltar para Meus Anúncios
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-20">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[90] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-7 h-7 stroke-[2.5]" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">
                Tem certeza?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Essa ação não pode ser desfeita. Seu anúncio será removido permanentemente da plataforma.
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs cursor-pointer shadow-md transition-all active:scale-95"
              >
                Sim, Excluir Anúncio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Header Bar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                Editar Anúncio
              </h1>
              <span className="text-[11px] text-slate-400 font-mono">
                ID: {initialItem.id.slice(-8)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewProduct(initialItem)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-transform active:scale-95"
            >
              <Eye className="w-3.5 h-3.5 text-orange-400" />
              <span className="hidden sm:inline">Ver Anúncio</span>
            </button>

            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Excluir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <form onSubmit={handleFormSubmit} className="space-y-6">
          
          {/* PAUSAR / ATIVAR ANÚNCIO */}
          <div className={`p-4 rounded-2xl border-2 flex items-center justify-between gap-3 transition-colors ${
            isPaused 
              ? 'bg-amber-50 border-amber-300 text-amber-900' 
              : 'bg-emerald-50 border-emerald-300 text-emerald-900'
          }`}>
            <div className="flex items-center gap-2.5">
              {isPaused ? (
                <PauseCircle className="w-5 h-5 text-amber-600 shrink-0" />
              ) : (
                <PlayCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
              <div>
                <span className="text-xs font-black uppercase tracking-wider block">
                  Status: {isPaused ? 'Anúncio Pausado' : 'Anúncio Ativo'}
                </span>
                <span className="text-[11px] opacity-80">
                  {isPaused 
                    ? 'Seu anúncio está oculto dos compradores no feed.' 
                    : 'Seu anúncio está visível para milhares de compradores.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs cursor-pointer shadow-xs transition-transform active:scale-95 ${
                isPaused 
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isPaused ? 'Reativar Anúncio' : 'Pausar Anúncio'}
            </button>
          </div>

          {/* 1. SEÇÃO DE FOTOS DA MÁQUINA */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Fotos da Máquina ({photos.length}/12)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fotos reais públicas (compressão WebP 800px automática)
                </p>
              </div>
              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                Visualização Livre
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              multiple
              className="hidden"
            />

            <div className="flex flex-wrap gap-2.5 items-center pt-1">
              {photos.map((p, idx) => (
                <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-sm group">
                  <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                  
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-900/80 text-white">
                    #{idx + 1}
                  </span>

                  {/* Botão de Excluir Foto: Vermelho redondo com lixeira */}
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(idx)}
                    className="absolute top-1.5 right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white shadow-md flex items-center justify-center cursor-pointer transition-all border border-white/50"
                    title="Excluir foto"
                  >
                    <Trash2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}

              {photos.length < 12 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 sm:h-24 px-4 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50/50 hover:border-orange-500 hover:bg-orange-100/60 flex flex-col items-center justify-center text-orange-700 transition-all cursor-pointer text-center shadow-xs active:scale-95"
                  title="Upload de foto com compressão WebP 800px"
                >
                  <Upload className="w-5 h-5 text-[#FF6B00] mb-1" />
                  <span className="text-xs font-black">Upload WebP</span>
                  <span className="text-[10px] text-slate-500 font-medium">800px auto</span>
                </button>
              )}
            </div>
          </div>

          {/* 2. DADOS BÁSICOS (TÍTULO E PREÇO) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Título & Preço de Venda
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Título do Anúncio *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Vendo Motoniveladora Timbermach 717T 2021"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Preço à Vista (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="520.000"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-black font-mono focus:ring-2 focus:ring-orange-500 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Localização (Cidade / Estado) *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      value={locationCity}
                      onChange={(e) => setLocationCity(e.target.value)}
                      placeholder="Cidade"
                      className="col-span-2 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500"
                    />
                    <input
                      type="text"
                      required
                      maxLength={2}
                      value={locationState}
                      onChange={(e) => setLocationState(e.target.value.toUpperCase())}
                      placeholder="UF"
                      className="px-2 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-center uppercase focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. FICHA TÉCNICA DA MÁQUINA */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              Ficha Técnica & Especificações
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Marca / Fabricante
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="Ex: Timbermach, Caterpillar, JCB"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Modelo
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Ex: 717T, 320D"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Ano de Fabricação
                </label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="Ex: 2021"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Horas de Uso (Horímetro)
                </label>
                <input
                  type="text"
                  value={hoursUsed}
                  onChange={(e) => setHoursUsed(e.target.value)}
                  placeholder="Ex: 2.400 horas"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Link de Vídeo YouTube (Opcional)
              </label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtu.be/..."
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Descrição do Vendedor
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descreva detalhes mecânicos, histórico de revisões, estado de pneus/esteiras..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-orange-500 resize-y"
              />
            </div>
          </div>

          {/* BOTÕES DE AÇÃO INFERIORES */}
          <div className="flex items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={onBack}
              className="py-3 px-5 rounded-2xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs sm:text-sm cursor-pointer transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3.5 px-6 rounded-2xl bg-[#FF6B00] hover:bg-orange-600 active:scale-98 text-white font-black text-xs sm:text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-transform disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Salvando Alterações...' : 'Salvar Alterações'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
