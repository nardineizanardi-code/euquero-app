import React, { useState, useEffect } from 'react';
import { Smartphone, Download, Check, X, Share, PlusSquare, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallAppButtonProps {
  variant?: 'footer' | 'floating' | 'banner';
}

export const InstallAppButton: React.FC<InstallAppButtonProps> = ({ variant = 'footer' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [installSuccessToast, setInstallSuccessToast] = useState<string>('');

  useEffect(() => {
    // 1. Detecta se já está rodando como PWA (standalone)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches || 
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
    }

    // 2. Detecta iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // 3. Captura o evento beforeinstallprompt no Chrome / Android / Edge / Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // 4. Captura quando o app foi instalado com sucesso
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      setInstallSuccessToast('✅ App EuQuero instalado com sucesso na tela inicial!');
      setTimeout(() => setInstallSuccessToast(''), 4000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Se estiver no iOS, exibe modal explicativo guiado
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    // Se o evento nativo estiver disponível, aciona o prompt do navegador
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setInstallSuccessToast('🎉 Instalando App EuQuero...');
          setTimeout(() => setInstallSuccessToast(''), 3500);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Erro ao acionar prompt de instalação:', err);
      }
    } else {
      // Fallback para quando o navegador não disparou o evento ainda
      setShowIOSModal(true);
    }
  };

  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>App EuQuero Instalado</span>
      </div>
    );
  }

  return (
    <>
      {/* Toast flutuante de sucesso */}
      {installSuccessToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[70] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs sm:text-sm border border-emerald-400 animate-in fade-in slide-in-from-top-4">
          <Check className="w-4 h-4" />
          <span>{installSuccessToast}</span>
        </div>
      )}

      {/* Botão Oficial Solicitado: 📲 Instalar App EuQuero com ícone EQ preto redondo */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="group relative inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 hover:from-slate-900 hover:to-slate-800 text-white border-2 border-orange-500/50 hover:border-[#FF6B00] shadow-[0_4px_20px_rgba(255,107,0,0.25)] transition-all duration-300 cursor-pointer active:scale-95"
        title="Instalar App EuQuero direto na sua tela inicial"
      >
        {/* Ícone EQ Preto Redondo Oficial */}
        <div className="w-7 h-7 rounded-full bg-[#0F172A] border-2 border-[#FF6B00] flex items-center justify-center font-black text-[11px] tracking-tight text-white shadow-inner shrink-0 group-hover:scale-110 transition-transform">
          <span className="text-white">E</span>
          <span className="text-[#FF6B00]">Q</span>
        </div>

        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className="text-sm">📲</span>
            <span className="font-black text-xs sm:text-sm tracking-tight text-white group-hover:text-orange-100">
              Instalar App EuQuero
            </span>
          </div>
          <span className="text-[10px] text-orange-400 block -mt-0.5 font-semibold">
            Sem baixar da loja · Abre rápido
          </span>
        </div>

        <div className="w-6 h-6 rounded-full bg-[#FF6B00]/20 flex items-center justify-center text-[#FF6B00] group-hover:bg-[#FF6B00] group-hover:text-white transition-colors ml-1">
          <Download className="w-3.5 h-3.5" />
        </div>
      </button>

      {/* Modal Guiado de Instalação (para iOS Safari ou navegadores sem prompt automático) */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border-2 border-orange-500/40 text-white rounded-[24px] max-w-sm w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[#0F172A] border-2 border-[#FF6B00] flex items-center justify-center font-black text-lg text-white shrink-0 shadow-lg">
                <span className="text-white">E</span>
                <span className="text-[#FF6B00]">Q</span>
              </div>
              <div>
                <h3 className="text-base font-black text-white">Instalar App EuQuero</h3>
                <p className="text-xs text-orange-400 font-medium">Acesso rápido direto na sua tela</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              O EuQuero é um aplicativo leve (PWA). Para instalar em seu celular ou computador:
            </p>

            <div className="space-y-3 p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-200 mb-5">
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6B00] font-bold flex items-center justify-center shrink-0 text-[11px]">1</span>
                <div>
                  No navegador (Safari/Chrome), toque no botão de <strong className="text-white">Compartilhar</strong> ou no menu de <strong className="text-white">3 pontinhos</strong>.
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6B00] font-bold flex items-center justify-center shrink-0 text-[11px]">2</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span>Role e selecione</span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-800 font-bold text-white border border-slate-700">
                    <PlusSquare className="w-3 h-3 text-[#FF6B00]" />
                    Adicionar à Tela de Início
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-orange-500/20 text-[#FF6B00] font-bold flex items-center justify-center shrink-0 text-[11px]">3</span>
                <div>
                  Toque em <strong className="text-white">Adicionar</strong> no canto superior direito. Pronto!
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-[#FF6B00] hover:bg-orange-600 text-white font-black text-xs rounded-xl transition-all cursor-pointer shadow-md"
            >
              Entendi, obrigado!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
