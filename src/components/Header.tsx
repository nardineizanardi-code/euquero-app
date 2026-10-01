import React, { useState, useRef, useEffect } from 'react';
import { Bell, MessageSquare, Search, Flame, Tag, ChevronDown } from 'lucide-react';
import { ActiveBuyersBanner, ActiveBuyersStats } from './ActiveBuyersBanner';

interface HeaderProps {
  onOpenNotifications: () => void;
  unreadAlertsCount: number;
  onOpenConversations: () => void;
  unreadMessagesCount: number;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onOpenPretendentes: () => void;
  onOpenMeusAnuncios?: () => void;
  pretendentesCount?: number;
  activeBuyersStats?: ActiveBuyersStats;
  onSelectBuyersTicker?: () => void;
  onSelectYoutubeTicker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenNotifications,
  unreadAlertsCount = 2,
  onOpenConversations,
  unreadMessagesCount,
  searchQuery,
  setSearchQuery,
  onOpenPretendentes,
  onOpenMeusAnuncios,
  pretendentesCount = 4,
  activeBuyersStats,
  onSelectBuyersTicker,
  onSelectYoutubeTicker,
}) => {
  const [isEqMenuOpen, setIsEqMenuOpen] = useState(false);
  const eqMenuRef = useRef<HTMLDivElement>(null);

  // Fecha menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (eqMenuRef.current && !eqMenuRef.current.contains(e.target as Node)) {
        setIsEqMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Logo EuQuero (Eu preto #0F172A, Quero laranja #FF6B00) */}
        <div className="flex items-center gap-3">
          <a href="#" className="flex items-center gap-0.5 group">
            <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A] font-display">
              Eu<span className="text-[#FF6B00]">Quero</span>
            </span>
          </a>
        </div>

        {/* Barra de Busca (estilo dos prints) */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Buscar máquinas, caminhões, tratores..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-100 hover:bg-slate-100/80 focus:bg-white border border-transparent focus:border-slate-300 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-[#FF6B00]/20 text-slate-800 font-medium"
            />
          </div>
        </div>

        {/* Ações: Pretendentes 🔥, Sino com 2 notificações, Chat, Perfil EQ */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Botão Atalho: Procuras Compatíveis 🔥 */}
          <button
            type="button"
            onClick={onOpenPretendentes}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-50 hover:bg-orange-100 text-orange-950 border border-orange-200 text-xs font-black transition-all cursor-pointer shadow-2xs active:scale-95"
            title="Ver procuras compatíveis por filtro (produto + valor + região)"
          >
            <Flame className="w-3.5 h-3.5 text-[#FF6B00] fill-[#FF6B00]" />
            <span>Procuras Compatíveis ({pretendentesCount})</span>
          </button>

          {/* Sino com 2 notificações */}
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative p-2.5 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Notificações do Match"
          >
            <Bell className="w-5 h-5 text-slate-700" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#FF6B00] text-white text-[10px] font-black flex items-center justify-center shadow-xs">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Chat / Mensagens */}
          <button
            type="button"
            onClick={onOpenConversations}
            className="relative p-2.5 rounded-full text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Minhas Negociações"
          >
            <MessageSquare className="w-5 h-5 text-slate-700" />
            {unreadMessagesCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#00A86B] ring-2 ring-white"></span>
            )}
          </button>

          {/* Perfil EQ com Dropdown (Preto #0F172A) - PROMPT 5 */}
          <div className="relative" ref={eqMenuRef}>
            <button
              type="button"
              onClick={() => setIsEqMenuOpen(!isEqMenuOpen)}
              className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-black text-xs shadow-sm cursor-pointer hover:ring-2 hover:ring-[#FF6B00] transition-all"
              title="Menu do Usuário EuQuero"
            >
              EQ
            </button>

            {isEqMenuOpen && (
              <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3.5 py-2 border-b border-slate-100">
                  <p className="text-xs font-black text-slate-900">Minha Conta EuQuero</p>
                  <p className="text-[10px] text-slate-400">Painel do Anunciante</p>
                </div>

                {/* LINK SOLICITADO: Meus Anúncios -> /meus-anuncios */}
                <button
                  type="button"
                  onClick={() => {
                    setIsEqMenuOpen(false);
                    if (onOpenMeusAnuncios) {
                      onOpenMeusAnuncios();
                    }
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-orange-50 hover:text-[#FF6B00] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Tag className="w-4 h-4 text-[#FF6B00]" />
                  <span>Meus Anúncios</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsEqMenuOpen(false);
                    onOpenPretendentes();
                  }}
                  className="w-full text-left px-3.5 py-2.5 text-xs font-bold text-slate-800 hover:bg-orange-50 hover:text-[#FF6B00] flex items-center gap-2.5 transition-colors cursor-pointer"
                >
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span>Procuras Compatíveis ({pretendentesCount})</span>
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Mobile Search Bar */}
      <div className="sm:hidden px-4 pb-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            placeholder="Buscar máquinas, caminhões, tratores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-full text-slate-800"
          />
        </div>
      </div>

      {/* BANNER ANIMADO: 🔥 HOJE: [501+] COMPRADORES ATIVOS (Estratégia das caixas 101-110) | Linha Amarela 5 | Agrícola 4 | Vídeos no YouTube: 312 */}
      <ActiveBuyersBanner
        stats={activeBuyersStats}
        onClickBuyers={onSelectBuyersTicker}
        onClickYoutube={onSelectYoutubeTicker}
      />
    </header>
  );
};

