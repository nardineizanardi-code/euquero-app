import React, { useState, useEffect } from 'react';
import { Play, Sparkles, X, CheckCircle2, Award, Zap } from 'lucide-react';

interface RewardedAdModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRewardGranted: () => void;
}

export const RewardedAdModal: React.FC<RewardedAdModalProps> = ({
  isOpen,
  onClose,
  onRewardGranted,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(15);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsRemaining(15);
      setIsCompleted(false);
      setIsPlaying(false);
      return;
    }

    // Auto-start video when open
    setIsPlaying(true);
  }, [isOpen]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, secondsRemaining]);

  if (!isOpen) return null;

  const handleClaimReward = () => {
    onRewardGranted();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg bg-slate-900 text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col">
        
        {/* Top Video Header */}
        <div className="p-4 bg-slate-950 flex items-center justify-between border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
              Rewarded Ad
            </span>
            <span className="text-slate-400">Patrocinador Oficial Eu Quero</span>
          </div>

          <div className="flex items-center gap-2">
            {!isCompleted ? (
              <span className="font-mono tabular-nums text-xs bg-slate-800 px-2.5 py-1 rounded-full text-slate-300">
                Recompensa em: {secondsRemaining}s
              </span>
            ) : (
              <span className="text-emerald-400 font-bold flex items-center gap-1 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Recompensa Liberada!
              </span>
            )}

            {isCompleted && (
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Video Player Canvas Simulation */}
        <div className="relative aspect-[16/9] bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6 text-center overflow-hidden">
          {/* Animated background glow */}
          <div className="absolute w-72 h-72 rounded-full bg-orange-500/10 blur-3xl animate-pulse" />

          {!isCompleted ? (
            <div className="relative z-10 space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center mx-auto ring-8 ring-orange-500/10 animate-bounce">
                <Award className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Desbloqueando Pacote de 10 Fotos
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  Assista ao vídeo publicitário até o fim para turbinar seu anúncio gratuitamente!
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-48 h-1.5 bg-slate-800 rounded-full mx-auto overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-1000 ease-linear"
                  style={{ width: `${((15 - secondsRemaining) / 15) * 100}%` }}
                />
              </div>

              {/* Fast test trigger for demo convenience */}
              <button
                onClick={() => {
                  setSecondsRemaining(0);
                  setIsCompleted(true);
                  setIsPlaying(false);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300 underline cursor-pointer pt-2 block mx-auto"
              >
                [Acelerar vídeo para teste]
              </button>
            </div>
          ) : (
            <div className="relative z-10 space-y-3 py-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">
                  Parabéns! Pacote de 10 Fotos Liberado
                </h3>
                <p className="text-xs text-slate-300 max-w-xs mx-auto mt-1">
                  Agora você pode adicionar até 10 fotos em alta resolução para vender muito mais rápido.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end">
          {isCompleted ? (
            <button
              onClick={handleClaimReward}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg transition-all active:scale-[0.98] cursor-pointer"
            >
              Aplicar 10 Fotos no Anúncio Agora
            </button>
          ) : (
            <p className="text-xs text-slate-400 text-center w-full">
              Aguarde {secondsRemaining} segundos para obter a recompensa...
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
