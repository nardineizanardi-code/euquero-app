import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Tag, PlusCircle, Trash2, ExternalLink, 
  Search, ShieldCheck, CheckCircle2, AlertCircle, Eye, Sparkles
} from 'lucide-react';
import { ListingItem } from '../types';
import { CardImageWithFallback } from './CardImageWithFallback';
import { formatVendendoEm } from '../utils/geoDistance';

interface MeusAnunciosViewProps {
  onBack: () => void;
  onOpenWizard: (intent: 'buy' | 'sell') => void;
  onViewProductDetail: (item: ListingItem) => void;
  allListings: ListingItem[];
}

export const MeusAnunciosView: React.FC<MeusAnunciosViewProps> = ({
  onBack,
  onOpenWizard,
  onViewProductDetail,
  allListings,
}) => {
  // Pega CPF salvo no localStorage (ex: vendedor_dados, euquero_user_cpf, etc) ou estado local
  const [cpfInput, setCpfInput] = useState<string>(() => {
    try {
      const savedUser = localStorage.getItem('vendedor_dados');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.cpf) return parsed.cpf;
      }
      return localStorage.getItem('euquero_user_cpf') || '';
    } catch (e) {
      return '';
    }
  });

  const [activeFilterCpf, setActiveFilterCpf] = useState<string>(cpfInput);
  const [userListings, setUserListings] = useState<ListingItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Simula busca no banco/Supabase por CPF
  // supabase.from('produtos').select('*').eq('cpf', cleanCpf)
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      try {
        const cleanFilter = activeFilterCpf.replace(/\D/g, '');
        
        // 1. Busca anúncios criados no allListings (estado da aplicação)
        let filtered = allListings.filter((item) => {
          if (!cleanFilter) return item.intent === 'sell'; // Se não tiver CPF, mostra anúncios de venda locais
          const itemCpfClean = (item.cpf || '').replace(/\D/g, '');
          return itemCpfClean === cleanFilter || itemCpfClean.includes(cleanFilter);
        });

        // 2. Busca também no localStorage 'euquero_banco_vendedores'
        const bancoVendStr = localStorage.getItem('euquero_banco_vendedores');
        if (bancoVendStr) {
          const bancoVend: any[] = JSON.parse(bancoVendStr);
          const fromStorage = bancoVend
            .filter((v) => {
              if (!cleanFilter) return true;
              const vCpfClean = (v.cpf || '').replace(/\D/g, '');
              return vCpfClean === cleanFilter || vCpfClean.includes(cleanFilter);
            })
            .map((v) => ({
              id: v.id || `sell-${Date.now()}`,
              intent: 'sell' as const,
              title: v.machineLabel || v.titulo || 'Máquina Anunciada',
              category: v.category || 'linha_amarela',
              subcategoryType: v.subcategoryType || 'Máquina',
              condition: 'usado' as const,
              brand: v.brand || 'Marca Livre',
              model: v.model || '',
              price: v.valor || v.price || 0,
              priceNegotiable: true,
              locationCity: v.city || v.locationCity || 'Joinville',
              locationState: v.state || v.locationState || 'SC',
              description: v.description || 'Anúncio ativo no EuQuero.',
              userName: v.sellerName || 'Meu Anúncio',
              userPhone: v.sellerPhone || '',
              createdAt: v.timestamp || new Date().toISOString(),
              status: 'active' as const,
              images: v.photos && v.photos.length > 0 ? v.photos : ['/cat_320d_excavator.jpg'],
              badge: v.pago ? 'premium' as const : undefined,
              hasVerifiedVideo: !!v.pago,
              cpf: v.cpf,
            }));

          // Junta sem duplicar IDs
          const existingIds = new Set(filtered.map((f) => f.id));
          fromStorage.forEach((item) => {
            if (!existingIds.has(item.id)) {
              filtered.push(item as ListingItem);
            }
          });
        }

        // Se o usuário ainda não tiver cadastrado anúncios próprios com esse CPF,
        // garantimos exibir ao menos os anúncios do vendedor cadastrado para demonstração
        if (filtered.length === 0 && !cleanFilter) {
          filtered = allListings.filter((it) => it.intent === 'sell').slice(0, 3);
        }

        setUserListings(filtered);
      } catch (e) {
        setUserListings([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [activeFilterCpf, allListings]);

  const handleApplyCpfFilter = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('euquero_user_cpf', cpfInput);
    } catch (e) {}
    setActiveFilterCpf(cpfInput);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full animate-in fade-in duration-200">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 shadow-2xs transition-transform active:scale-95 cursor-pointer"
            title="Voltar ao Feed Principal"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#0F172A] text-white text-[11px] font-black uppercase tracking-wider">
                Painel do Vendedor
              </span>
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Oficial EuQuero
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 tracking-tight mt-1">
              Meus Anúncios Publicados
            </h1>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onOpenWizard('sell')}
          className="px-5 py-3 rounded-2xl bg-[#FF6B00] hover:bg-[#e05e00] text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Criar Novo Anúncio</span>
        </button>
      </div>

      {/* Filtro por CPF / Busca no Banco Supabase */}
      <div className="my-6 p-4 sm:p-5 rounded-2xl bg-white border border-slate-200 shadow-xs">
        <form onSubmit={handleApplyCpfFilter} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Filtrar por CPF do vendedor (ex: 123.456.789-00 ou deixe vazio)"
              value={cpfInput}
              onChange={(e) => setCpfInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 focus:bg-white border border-slate-200 focus:border-[#FF6B00] rounded-xl outline-none transition-all font-mono"
            />
          </div>
          <button
            type="submit"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            Buscar Anúncios
          </button>
        </form>
        <p className="text-[11px] text-slate-500 mt-2">
          💡 Os anúncios estão salvos com segurança no banco de dados. Digite seu CPF para sincronizar ou veja seus anúncios ativos na sessão.
        </p>
      </div>

      {/* Listagem dos Anúncios do Usuário */}
      {isLoading ? (
        <div className="py-16 text-center text-slate-400 font-bold text-sm">
          Carregando seus anúncios...
        </div>
      ) : userListings.length === 0 ? (
        <div className="py-16 px-6 text-center bg-white rounded-3xl border border-slate-200 shadow-xs max-w-md mx-auto">
          <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base sm:text-lg font-black text-slate-900">
            Nenhum anúncio encontrado para este CPF
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Você ainda não publicou anúncios com este documento ou pode cadastrar seu primeiro ativo agora mesmo.
          </p>
          <button
            type="button"
            onClick={() => onOpenWizard('sell')}
            className="mt-5 px-5 py-2.5 rounded-xl bg-[#00A86B] hover:bg-emerald-600 text-white font-bold text-xs shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Anunciar Máquina ou Veículo</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 px-1">
            <span>Mostrando {userListings.length} {userListings.length === 1 ? 'anúncio' : 'anúncios'}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              ● Todos com Status Ativo
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userListings.map((listing) => {
              const photoUrl = listing.images && listing.images.length > 0 
                ? listing.images[0] 
                : '/cat_320d_excavator.jpg';

              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden hover:shadow-md transition-shadow flex flex-col justify-between"
                >
                  <div className="flex gap-4 p-4">
                    {/* Foto da Máquina */}
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-slate-100 shrink-0 relative">
                      <CardImageWithFallback
                        src={photoUrl}
                        alt={listing.title}
                        category={listing.category}
                        imageClassName="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-600 text-white shadow-xs">
                        Ativo
                      </span>
                    </div>

                    {/* Dados do Anúncio */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {listing.category.replace('_', ' ')}
                        </span>
                        {listing.badge === 'premium' && (
                          <span className="text-[9px] font-black text-amber-900 bg-amber-200 px-1.5 py-0.2 rounded uppercase">
                            Premium
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug line-clamp-2 mt-0.5">
                        {listing.title}
                      </h3>

                      <div className="mt-1 text-xs text-[#00875A] font-black">
                        {formatVendendoEm(listing.locationCity, listing.locationState)}
                      </div>

                      <div className="mt-2 text-base sm:text-lg font-black font-mono text-slate-900">
                        R$ {listing.price.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>

                  {/* Barra de Ações do Anúncio */}
                  <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400 font-mono">
                      ID: {listing.id.slice(-8)}
                    </span>

                    <button
                      type="button"
                      onClick={() => onViewProductDetail(listing)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs transition-transform active:scale-95"
                    >
                      <Eye className="w-3.5 h-3.5 text-orange-400" />
                      <span>Ver Anúncio</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};
