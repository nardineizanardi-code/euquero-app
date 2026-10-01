import React, { useState, useEffect } from 'react';
import { 
  X, Lock, Unlock, QrCode, CreditCard, Copy, CheckCircle2, 
  ShieldCheck, Video, Play, MessageSquare, AlertCircle
} from 'lucide-react';

interface VideoUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlockSuccess: (newVideoUrl?: string) => void;
  itemTitle?: string;
  itemCity?: string;
  videoUrl?: string;
  sellerPhone?: string;
  sellerCpf?: string;
}

export const VideoUnlockModal: React.FC<VideoUnlockModalProps> = ({
  isOpen,
  onClose,
  onUnlockSuccess,
  itemTitle = 'CAT 320D 2019 com 4.200 Horas',
  itemCity = 'Paulínia/SP - Joinville/SC (teste)',
  videoUrl = '',
  sellerPhone = '(47) 99620-5669',
  sellerCpf = '123.456.789-00',
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [approvalToast, setApprovalToast] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Se o item já tem vídeo liberado ou se acabou de pagar
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [inputVideoUrl, setInputVideoUrl] = useState<string>(videoUrl || 'https://youtu.be/Jmsm2SCzn1o');
  const [videoDuplicateError, setVideoDuplicateError] = useState<string>('');
  const [isSavedWithSuccess, setIsSavedWithSuccess] = useState<boolean>(false);

  const PIX_KEY_STRING = "00020126330014br.gov.bcb.pix0111+554799620566900520400005303986540519.905802BR5925Nardinei Zanardi6009Joinville62070503***6304ABCD";

  // Extrai ID do YouTube
  const extractYouTubeId = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = trimmed.match(regExp);
    return match ? match[1] : trimmed.toLowerCase();
  };

  // TRAVA 1 - BUG 2 RESOLVIDO: Permitir reuso do link de teste e pelo mesmo proprietário
  const checkVideoDuplicate = (_url: string, _cpf: string): boolean => {
    // PROMPT 6 BUG 2: Removido o bloqueio para permitir publicar e testar livremente
    return false;
  };

  const validateVideoUrl = (url: string) => {
    if (!url.trim()) {
      setVideoDuplicateError('');
      return false;
    }
    const isDup = checkVideoDuplicate(url, sellerCpf);
    if (isDup) {
      setVideoDuplicateError(
        "⛔ Esse vídeo já foi usado em outra máquina! Cada máquina precisa de um vídeo exclusivo mostrando só essa máquina funcionando. Grave um vídeo novo só dessa máquina!"
      );
      return true;
    }
    setVideoDuplicateError('');
    return false;
  };

  useEffect(() => {
    if (isOpen) {
      setIsPlaying(false);
      setIsProcessing(false);
      setPixCopied(false);
      setApprovalToast('');
      setVideoDuplicateError('');
      setIsSavedWithSuccess(false);

      if (videoUrl && videoUrl.length > 5) {
        setIsPaid(true);
        setInputVideoUrl(videoUrl);
      } else {
        setIsPaid(false);
        setInputVideoUrl('https://youtu.be/Jmsm2SCzn1o');
      }
    }
  }, [isOpen, videoUrl]);

  if (!isOpen) return null;

  // Aprovação do pagamento de R$ 19,90 em 2 segundos
  const triggerAutoApproval = () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setApprovalToast('Pagamento de R$ 19,90 aprovado! Liberando vídeo...');

    setTimeout(() => {
      setIsProcessing(false);
      setApprovalToast('');
      setIsPaid(true);
    }, 2000);
  };

  const handleCopyPix = () => {
    setPixCopied(true);
    try {
      navigator.clipboard.writeText(PIX_KEY_STRING);
    } catch (e) {}
    triggerAutoApproval();
  };

  const handleSelectCard = () => {
    setPaymentMethod('card');
    triggerAutoApproval();
  };

  // Salvar vídeo com TRAVAS ANTI-MALANDRAGEM
  const handleSaveVerifiedVideo = () => {
    const isDup = checkVideoDuplicate(inputVideoUrl, sellerCpf);
    if (isDup) {
      setVideoDuplicateError(
        "⛔ Esse vídeo já foi usado em outra máquina! Cada máquina precisa de um vídeo exclusivo mostrando só essa máquina funcionando. Grave um vídeo novo só dessa máquina!"
      );
      return;
    }

    const cleanCpf = (sellerCpf || '').replace(/\D/g, '') || 'default';
    const vidId = extractYouTubeId(inputVideoUrl);

    // Salva em videosUsadosPorCPF oficial
    try {
      const savedArr = localStorage.getItem('videosUsadosPorCPF');
      const dataArr = savedArr ? JSON.parse(savedArr) : {};
      const listArr: string[] = dataArr[cleanCpf] || [];
      if (!listArr.includes(inputVideoUrl)) {
        listArr.push(inputVideoUrl);
        dataArr[cleanCpf] = listArr;
        localStorage.setItem('videosUsadosPorCPF', JSON.stringify(dataArr));
      }
    } catch (err) {}

    // Salva em euquero_cpf_videos
    try {
      const savedVideos = localStorage.getItem('euquero_cpf_videos');
      const data = savedVideos ? JSON.parse(savedVideos) : {};
      const list = data[cleanCpf] || [];
      if (!list.some((it: any) => it.videoId === vidId)) {
        list.push({
          videoId: vidId,
          url: inputVideoUrl,
          productTitle: itemTitle,
          createdAt: new Date().toISOString()
        });
        data[cleanCpf] = list;
        localStorage.setItem('euquero_cpf_videos', JSON.stringify(data));
      }
    } catch (err) {}

    try {
      localStorage.setItem('video_pago_cat320d', 'true');
      localStorage.setItem('euquero_user_premium', 'true');
      window.dispatchEvent(new Event('storage'));
    } catch (e) {}

    setIsSavedWithSuccess(true);
    onUnlockSuccess(inputVideoUrl);
  };

  // WhatsApp Nardinei Zanardi oficial
  const cleanPhone = (sellerPhone || '').replace(/\D/g, '') || '5547996205669';
  const finalWaPhone = cleanPhone.length === 11 ? `55${cleanPhone}` : cleanPhone;
  const waUrl = `https://wa.me/${finalWaPhone}?text=${encodeURIComponent(
    'Olá Nardinei! Vi a máquina no EuQuero'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Toast flutuante de aprovação da taxa única */}
      {approvalToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 animate-in slide-in-from-top-4 duration-200 font-bold text-sm">
          <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin shrink-0" />
          <span>{approvalToast}</span>
        </div>
      )}

      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Topo do modal */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white relative shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-black uppercase tracking-wider mb-2">
            <Video className="w-3.5 h-3.5" />
            <span>Vídeo Verificado · Taxa R$ 19,90</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black font-display tracking-tight text-white leading-tight">
            {isSavedWithSuccess || (videoUrl && videoUrl.length > 5)
              ? 'Vídeo Verificado da Máquina'
              : isPaid
              ? 'Ativar Vídeo Exclusivo da Máquina'
              : 'Adicionar Vídeo Verificado (R$ 19,90)'}
          </h3>

          <p className="text-xs text-slate-300 mt-1 max-w-sm truncate">
            {itemTitle} ({itemCity})
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CASO 1: VÍDEO JÁ ATIVO E VERIFICADO (PLAYER SEM AUTOPLAY)                 */}
        {/* ========================================================================= */}
        {isSavedWithSuccess || (videoUrl && videoUrl.length > 5 && isPaid) ? (
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-500 text-emerald-950 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-sm sm:text-base font-black text-emerald-900 block leading-tight">
                  ✅ Vídeo verificado ativo!
                </span>
                <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                  Vídeo exclusivo da própria máquina - gravado em Paulínia/SP (26/09/2026).
                </span>
              </div>
            </div>

            {/* PLAYER COM THUMBNAIL PARADA E BOTÃO PLAY (SEM AUTOPLAY) */}
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-700">
              {!isPlaying ? (
                <div
                  onClick={() => setIsPlaying(true)}
                  className="relative w-full h-full cursor-pointer flex flex-col items-center justify-center select-none group"
                >
                  <img
                    src={`https://img.youtube.com/vi/${extractYouTubeId(inputVideoUrl || videoUrl) || 'Jmsm2SCzn1o'}/hqdefault.jpg`}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/cat_320d_excavator.jpg';
                    }}
                    alt={itemTitle}
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.75] group-hover:scale-105 group-hover:brightness-[0.85] transition-all duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-slate-950/60" />

                  <div className="absolute top-3 left-3 z-10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/90 backdrop-blur-md text-emerald-400 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider shadow-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                      <span>Vídeo Verificado - Exclusivo desta máquina - R$ 19,90</span>
                    </span>
                  </div>

                  <div className="relative z-10 flex flex-col items-center gap-2">
                    <button
                      type="button"
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-all border-4 border-white cursor-pointer"
                    >
                      <Play className="w-8 h-8 fill-white translate-x-0.5" />
                    </button>
                    <span className="text-xs font-bold text-white bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-700 text-center shadow-md">
                      Clique para ver o vídeo gravado em {itemCity} (26/09/2026)
                    </span>
                  </div>
                </div>
              ) : (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(inputVideoUrl || videoUrl) || 'Jmsm2SCzn1o'}?autoplay=1`}
                  title="Vídeo Máquina"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full border-0"
                />
              )}
            </div>

            {/* CARD DO VENDEDOR FIXO COM WHATSAPP */}
            <div className="p-3.5 sm:p-4 bg-slate-100 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0">
                  EQ
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-bold text-sm text-slate-900">Vendedor Verificado</h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                      <span>Oficial EuQuero</span>
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 font-mono">
                    📍 <strong>Paulínia/SP - Joinville/SC</strong> · WhatsApp: <span className="font-bold text-emerald-700">(47) 9962-XXXX</span>
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200 shrink-0">
                ● Online
              </span>
            </div>

            {/* BOTÃO LARANJA CHAT SEGURO EUQUERO (#FF6B00) */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 px-6 rounded-2xl bg-[#FF6B00] hover:bg-orange-600 active:scale-[0.98] text-white font-black text-xs sm:text-sm shadow-xl shadow-orange-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer border border-amber-400/40 text-center"
              >
                <MessageSquare className="w-5 h-5 fill-white text-white shrink-0" />
                <span>Clique para falar com vendedor (Chat Seguro EuQuero)</span>
              </button>

              <p className="text-[11px] text-slate-500 text-center leading-relaxed font-medium px-2">
                🛡️ Negociação protegida pelo chat interno. O número completo permanece salvo no banco e não é exposto ao público.
              </p>
            </div>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Concluir & Fechar
              </button>
            </div>

          </div>
        ) : isPaid ? (
          /* ========================================================================= */
          /* CASO 2: PAGOU R$ 19,90 -> INSERIR O LINK EXCLUSIVO COM AS 3 TRAVAS        */
          /* ========================================================================= */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            
            <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <span className="text-xs sm:text-sm font-black text-emerald-900 block leading-tight">
                  Taxa R$ 19,90 Aprovada! Agora insira o vídeo desta máquina
                </span>
                <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                  Insira o link exclusivo do YouTube para ativar o selo Verificado no feed.
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 text-white space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Link do Vídeo YouTube (Opcional - deixe em branco para 4 fotos grátis)
                </label>
                <input
                  type="text"
                  required={false}
                  value={inputVideoUrl}
                  onChange={(e) => {
                    setInputVideoUrl(e.target.value);
                    validateVideoUrl(e.target.value);
                  }}
                  placeholder="https://youtu.be/... (Opcional - deixe em branco para 4 fotos grátis)"
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 focus:border-[#FF6B00] rounded-xl text-xs sm:text-sm font-mono text-emerald-400 outline-none"
                />

                {/* TRAVA 2 - REGRA DO VÍDEO EXCLUSIVO EM VERMELHO */}
                <p className="text-[11px] text-red-400 mt-1.5 font-bold leading-tight">
                  ⚠️ REGRA: 1 vídeo exclusivo por máquina. Máx 3 minutos. Deve mostrar APENAS esta máquina funcionando. Vídeo com várias máquinas será removido e taxa não reembolsada. Não pode repetir link.
                </p>

                {/* TRAVA 3 - DURAÇÃO ATÉ 3 MINUTOS */}
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  ⏱️ Duração: Máx 3 minutos - Mostre só esta máquina funcionando.
                </p>

                {/* TRAVA 1 - ERRO DE VÍDEO DUPLICADO NO MESMO CPF */}
                {videoDuplicateError && (
                  <div className="mt-2 p-3 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs font-bold flex items-start gap-2 shadow-md animate-in fade-in">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">{videoDuplicateError}</span>
                  </div>
                )}
              </div>

              {/* PRÉVIA */}
              <div className="pt-1">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Prévia — Sem autoplay · Só toca ao clicar</span>
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                    Vídeo Verificado - Exclusivo desta máquina - R$ 19,90
                  </span>
                </div>

                <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                  {!isPlaying ? (
                    <div
                      onClick={() => setIsPlaying(true)}
                      className="relative w-full h-full cursor-pointer flex flex-col items-center justify-center group"
                    >
                      <img
                        src={`https://img.youtube.com/vi/${extractYouTubeId(inputVideoUrl) || 'Jmsm2SCzn1o'}/hqdefault.jpg`}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/cat_320d_excavator.jpg';
                        }}
                        alt="Thumbnail"
                        className="absolute inset-0 w-full h-full object-cover brightness-[0.75] group-hover:scale-105 transition-all duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40" />
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        <button
                          type="button"
                          className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-all border-4 border-white cursor-pointer"
                        >
                          <Play className="w-7 h-7 fill-white translate-x-0.5" />
                        </button>
                        <span className="text-xs font-bold text-white bg-slate-900/90 px-3 py-1 rounded-full border border-slate-700 text-center">
                          Clique para ver o vídeo da máquina
                        </span>
                      </div>
                    </div>
                  ) : (
                    <iframe
                      src={`https://www.youtube.com/embed/${extractYouTubeId(inputVideoUrl) || 'Jmsm2SCzn1o'}?autoplay=1`}
                      title="Vídeo"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                disabled={!inputVideoUrl.trim() || !!videoDuplicateError}
                onClick={handleSaveVerifiedVideo}
                className="w-full py-4 px-6 rounded-2xl bg-[#00875A] hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Salvar Vídeo Verificado & Ativar Selo</span>
              </button>
            </div>

          </div>
        ) : (
          /* ========================================================================= */
          /* CASO 3: CHECKOUT DA TAXA ÚNICA R$ 19,90 (PIX COM QR CODE E COPIA E COLA)   */
          /* ========================================================================= */
          <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
            
            {/* Card de Valor Taxa Única R$ 19,90 */}
            <div className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-300 flex items-center justify-between gap-4 shadow-sm">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 bg-orange-200/80 px-2.5 py-0.5 rounded-md">
                  Taxa Única de Verificação do Vendedor R$ 19,90
                </span>
                <div className="text-3xl font-black font-mono text-slate-900 mt-1">
                  R$ 19,90
                </div>
                <p className="text-xs text-slate-600 font-medium mt-0.5">
                  Libera o vídeo exclusivo da sua máquina no feed para todos os compradores assistirem gratuitamente.
                </p>
              </div>

              <div className="w-14 h-14 rounded-2xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0 shadow-md">
                <ShieldCheck className="w-7 h-7" />
              </div>
            </div>

            {/* Seletor PIX / Cartão */}
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-2">
                Escolha a forma de pagamento:
              </span>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('pix')}
                  className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'pix'
                      ? 'border-[#00875A] bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <QrCode className="w-4 h-4 text-emerald-600" />
                  <span>PIX Instantâneo</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectCard}
                  className={`p-3 rounded-xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'card'
                      ? 'border-[#00875A] bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-slate-700" />
                  <span>Cartão de Crédito</span>
                </button>
              </div>
            </div>

            {/* PIX COM QR CODE E COPIA E COLA */}
            {paymentMethod === 'pix' ? (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                  <div className="w-24 h-24 bg-white p-1.5 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-xs shrink-0">
                    <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900 fill-current">
                      <rect x="0" y="0" width="30" height="30" fill="black" />
                      <rect x="5" y="5" width="20" height="20" fill="white" />
                      <rect x="10" y="10" width="10" height="10" fill="black" />
                      <rect x="70" y="0" width="30" height="30" fill="black" />
                      <rect x="75" y="5" width="20" height="20" fill="white" />
                      <rect x="80" y="10" width="10" height="10" fill="black" />
                      <rect x="0" y="70" width="30" height="30" fill="black" />
                      <rect x="5" y="75" width="20" height="20" fill="white" />
                      <rect x="10" y="80" width="10" height="10" fill="black" />
                      <rect x="35" y="5" width="5" height="15" fill="black" />
                      <rect x="45" y="5" width="10" height="5" fill="black" />
                      <rect x="60" y="10" width="5" height="10" fill="black" />
                      <rect x="35" y="35" width="30" height="30" fill="black" />
                      <rect x="42" y="42" width="16" height="16" fill="white" />
                      <rect x="47" y="47" width="6" height="6" fill="#00875A" />
                      <rect x="70" y="35" width="10" height="25" fill="black" />
                      <rect x="85" y="45" width="10" height="10" fill="black" />
                      <rect x="35" y="70" width="15" height="10" fill="black" />
                      <rect x="55" y="75" width="10" height="15" fill="black" />
                      <rect x="70" y="70" width="25" height="10" fill="black" />
                      <rect x="80" y="85" width="15" height="10" fill="black" />
                    </svg>
                  </div>

                  <div className="flex-1 text-center sm:text-left">
                    <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                      PIX Banco Central
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">
                      Pague com o App do seu Banco
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Copie a chave oficial ou escaneie o QR Code para aprovação em 2s.
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-700">Chave PIX Copia e Cola:</span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                      Aprovação em 2s no simulador
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={PIX_KEY_STRING}
                      className="w-full text-[11px] font-mono p-2.5 bg-white border border-slate-300 rounded-xl text-slate-600 truncate select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyPix}
                      className="px-4 py-2.5 bg-[#00875A] hover:bg-emerald-700 text-white rounded-xl text-xs font-black shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 italic">
                    Clique em <strong>Copiar</strong> para aprovar automaticamente em 2s no simulador.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                  <span className="font-bold text-slate-700">Parcelamento:</span>
                  <span className="font-black text-slate-900 font-mono text-sm">
                    1x de R$ 19,90 (sem juros)
                  </span>
                </div>
                <input
                  type="text"
                  placeholder="Número do Cartão: 0000 0000 0000 0000"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs sm:text-sm"
                  defaultValue="4111 2222 3333 4444"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="MM/AA"
                    defaultValue="12/28"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs sm:text-sm"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    defaultValue="889"
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* Botão de Confirmação */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isProcessing}
                onClick={triggerAutoApproval}
                className="w-full py-4 px-6 rounded-2xl bg-[#00875A] hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {isProcessing ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>Confirmando pagamento...</span>
                  </span>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Confirmar Pagamento (R$ 19,90) & Continuar</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-center text-slate-500">
              🛡️ Pagamento seguro · Libera a inserção do vídeo verificado exclusivo desta máquina.
            </p>
          </div>
        )}

      </div>
    </div>
  );
};
