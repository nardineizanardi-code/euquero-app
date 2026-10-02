import React, { useState } from 'react';
import { 
  CheckCircle2, ShieldCheck, ExternalLink, MessageSquare, Play
} from 'lucide-react';

interface MachineVideoPlayerProps {
  itemId: string;
  itemTitle?: string;
  isUnlocked?: boolean;
  onUnlockRequest?: () => void;
  thumbnailUrl?: string;
  compact?: boolean;
  videoUrl?: string;
}

export const MachineVideoPlayer: React.FC<MachineVideoPlayerProps> = ({
  itemTitle = 'CAT 320D 2019 Paulínia/SP',
  compact = false,
  thumbnailUrl = '/cat_320d_excavator.jpg',
  videoUrl,
}) => {
  // REGRA MESTRE: Thumbnail parado com botão PLAY grande, SEM autoplay.
  // Só toca quando clicar no PLAY!
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const realYoutubeEmbed = 'https://www.youtube.com/embed/Jmsm2SCzn1o?autoplay=1';
  const realYoutubeLink = videoUrl || 'https://youtu.be/Jmsm2SCzn1o';

  const whatsappUrl = "https://wa.me/5547996205669?text=Ol%C3%A1%20Nardinei!%20Vi%20a%20m%C3%A1quina%20no%20EuQuero";

  return (
    <div className="w-full rounded-2xl overflow-hidden border-2 border-slate-200 bg-slate-950 text-white shadow-md relative">
      
      {/* 1. BARRA DE CABEÇALHO DO VÍDEO (YOUTUBE INTEGRADO VERIFICADO) */}
      <div className="px-3.5 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 truncate">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-500" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600" />
          </span>
          <span className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5 truncate">
            <span className="text-emerald-400">✅ Vídeo Verificado Oficial da Máquina (YouTube)</span>
          </span>
        </div>

        <a
          href={realYoutubeLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[10px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full bg-red-600 hover:bg-red-700 text-white shrink-0 flex items-center gap-1 shadow-sm transition-transform active:scale-95 cursor-pointer"
        >
          <span>Abrir YouTube</span>
          <ExternalLink className="w-2.5 h-2.5" />
        </a>
      </div>

      {/* 2. ÁREA DO PLAYER: THUMBNAIL PARADO COM BOTÃO PLAY GRANDE (SEM AUTOPLAY) */}
      <div className="w-full flex flex-col bg-slate-950">
        
        <div className={`relative w-full ${compact ? 'aspect-[16/10]' : 'aspect-video'} bg-black overflow-hidden group`}>
          {!isPlaying ? (
            <div 
              onClick={() => setIsPlaying(true)}
              className="relative w-full h-full cursor-pointer flex flex-col items-center justify-center select-none"
            >
              {/* Imagem de fundo estática com blur sutil nas bordas */}
              <img
                src={thumbnailUrl || '/cat_320d_excavator.jpg'}
                alt={itemTitle}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.78] group-hover:scale-105 group-hover:brightness-[0.88] transition-all duration-300"
              />

              {/* Vinheta escura no topo e base */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-slate-950/70" />

              {/* Selo no topo da thumbnail */}
              <div className="absolute top-3 left-3 z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider shadow-md">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                  <span>Vídeo verificado - 1 vídeo por produto - R$ 19,90 por máquina</span>
                </span>
              </div>

              {/* BOTÃO PLAY GRANDE CENTRAL */}
              <div className="relative z-10 flex flex-col items-center gap-3">
                <button
                  type="button"
                  aria-label="Assistir vídeo"
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 group-hover:scale-110 active:scale-95 transition-all duration-200 border-4 border-white/90"
                >
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white translate-x-0.5" />
                </button>

                {/* TEXTO EXATO SOLICITADO: "Clique para ver o vídeo gravado em Paulínia/SP (26/09/2026)" */}
                <div className="bg-slate-900/85 backdrop-blur-md px-4 py-1.5 rounded-full border border-slate-700/80 shadow-lg text-center">
                  <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Clique para ver o vídeo gravado em Paulínia/SP (26/09/2026)
                  </span>
                </div>
              </div>

              {/* Indicador inferior */}
              <div className="absolute bottom-2.5 right-3 z-10 text-[10px] text-slate-300 font-mono bg-black/60 px-2 py-0.5 rounded">
                Duração: 0:42 · HD 1080p
              </div>
            </div>
          ) : (
            /* IFRAME YOUTUBE CARREGADO SOMENTE APÓS O CLIQUE NO PLAY */
            <iframe
              src={realYoutubeEmbed}
              title="Vídeo CAT 320D - Paulínia/SP"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full border-0"
            />
          )}
        </div>

        {/* 3. CHECKLIST DO QUE COMPROVA NO VÍDEO & CONTATO DO VENDEDOR */}
        <div className="p-4 sm:p-5 bg-slate-900 border-t border-slate-800 space-y-3.5">
          
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 stroke-[2.5]" />
              <span>Checklist Comprovado no Vídeo (Paulínia/SP):</span>
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] sm:text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>Bomba hidráulica:</strong> 350 bar</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>Motor CAT C7.1:</strong> Zero fumaça</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span><strong>Giro 360°:</strong> Tração 100%</span>
              </div>
            </div>
          </div>

          {/* CARD DO VENDEDOR FIXO - PROMPT 8: Esconder dados sensíveis e mascarar telefone */}
          <div className="p-3.5 bg-slate-950/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                EQ
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-xs sm:text-sm text-white">Vendedor Verificado</h4>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded border border-emerald-500/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                    <span>Oficial EuQuero</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  📍 <strong>Paulínia/SP - Joinville/SC</strong> · WhatsApp: <span className="font-bold text-emerald-400 font-mono">(47) 9962-XXXX</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
              ● Online
            </span>
          </div>

          {/* BOTÃO LARANJA CHAT SEGURO EUQUERO (PROMPT 8) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => {
                const modalChatBtn = document.querySelector('button[title*="Chat"]') as HTMLButtonElement;
                if (modalChatBtn) modalChatBtn.click();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-[#FF6B00] hover:bg-orange-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-amber-400/40 text-center"
            >
              <MessageSquare className="w-5 h-5 fill-white text-white shrink-0" />
              <span>Clique para falar com vendedor (Chat Seguro EuQuero)</span>
            </button>

            {/* TEXTO PEQUENO CINZA ABAIXO DO BOTÃO */}
            <p className="text-[11px] text-slate-400 text-center leading-relaxed font-medium px-2">
              🛡️ Negociação protegida pelo chat interno. O número completo permanece salvo no banco e não é exposto ao público.
            </p>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
            <span>Link do YouTube: <a href={realYoutubeLink} target="_blank" rel="noreferrer" className="text-orange-400 font-mono underline">youtu.be/Jmsm2SCzn1o</a></span>
            <span className="text-emerald-400 font-bold">✓ Vídeo Liberado para Compradores</span>
          </div>
        </div>
      </div>

    </div>
  );
};
