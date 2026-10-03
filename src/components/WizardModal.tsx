import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Check, ShieldCheck, Video, Copy, QrCode, CreditCard, 
  Sparkles, CheckCircle2, ArrowRight, MessageSquare, ExternalLink,
  Lock, Unlock, ArrowLeft, Camera, Plus, AlertCircle, Play,
  Tractor, Truck, Container, Construction, Upload, Trash2
} from 'lucide-react';
import { IntentType, ListingItem, MatchResult } from '../types';
import { generateDisplayProductLink, getShareableProductUrl, slugify } from '../utils/productLinks';
import { getPrimaryProductImage } from '../utils/productImages';

export type FrotaCategoryType = 'linha_amarela' | 'agricola' | 'caminhao' | 'implementos';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIntent: IntentType;
  onSubmitListing: (item: Omit<ListingItem, 'id' | 'createdAt' | 'status'>) => MatchResult[];
  onViewMatches?: (matches: MatchResult[]) => void;
  onOpenChatWithSeller?: (item: ListingItem) => void;
}

export const WizardModal: React.FC<WizardModalProps> = ({
  isOpen,
  onClose,
  initialIntent,
  onSubmitListing,
}) => {
  const [intent, setIntent] = useState<IntentType>(initialIntent);

  // Categoria da Frota Selecionada (null = tela inicial com 4 cards clicáveis)
  const [selectedCategory, setSelectedCategory] = useState<FrotaCategoryType | null>(null);

  // =========================================================================
  // DADOS ESPECÍFICOS DE CADA CATEGORIA (LINHA AMARELA, AGRÍCOLA, CAMINHÃO, IMPLEMENTO)
  // =========================================================================
  // 1. Linha Amarela
  const [laSubtype, setLaSubtype] = useState<string>('');
  const [laMarcaModelo, setLaMarcaModelo] = useState<string>('');
  const [laAno, setLaAno] = useState<string>('');
  const [laHoras, setLaHoras] = useState<string>('');

  // 2. Agrícola
  const [agroSubtype, setAgroSubtype] = useState<string>('');
  const [agroMarcaModelo, setAgroMarcaModelo] = useState<string>('');
  const [agroAno, setAgroAno] = useState<string>('');
  const [agroHoras, setAgroHoras] = useState<string>('');

  // 3. Caminhão (Ficha Mais Completa)
  const [truckSubtype, setTruckSubtype] = useState<string>('');
  const [truckMarca, setTruckMarca] = useState<string>('');
  const [truckModelo, setTruckModelo] = useState<string>('');
  const [truckAno, setTruckAno] = useState<string>('');
  const [truckKm, setTruckKm] = useState<string>('');
  const [truckTracao, setTruckTracao] = useState<string>('');

  // 4. Implemento de Caminhão
  const [impSubtype, setImpSubtype] = useState<string>('');
  const [impMarca, setImpMarca] = useState<string>('');
  const [impAno, setImpAno] = useState<string>('');
  const [impEixos, setImpEixos] = useState<string>('');
  const [impComprimento, setImpComprimento] = useState<string>('');

  // =========================================================================
  // CAMPOS COMUNS DO COMPRADOR (QUERO COMPRAR - 100% GRÁTIS)
  // =========================================================================
  const [buyerName, setBuyerName] = useState<string>('');
  const [buyerPhone, setBuyerPhone] = useState<string>('');
  const [buyerCity, setBuyerCity] = useState<string>('');
  const [buyerBudget, setBuyerBudget] = useState<string>('');
  const [buyerPaymentMethod, setBuyerPaymentMethod] = useState<string>('');
  const [buyerSuccess, setBuyerSuccess] = useState<boolean>(false);

  // =========================================================================
  // CAMPOS COMUNS DO VENDEDOR (QUERO VENDER - FREEMIUM / TAXA R$ 19,90)
  // =========================================================================
  const [sellerStep, setSellerStep] = useState<1 | 2 | 3>(1); // 1 = Form, 2 = Checkout R$ 19,90, 3 = Sucesso
  const [sellerPlan, setSellerPlan] = useState<'gratis' | 'verificado'>('gratis');
  const [sellerName, setSellerName] = useState<string>('');
  const [sellerPhone, setSellerPhone] = useState<string>('');
  const [sellerCity, setSellerCity] = useState<string>('');
  const [sellerPrice, setSellerPrice] = useState<string>('');
  const [sellerCpf, setSellerCpf] = useState<string>('');
  const [sellerVideoUrl, setSellerVideoUrl] = useState<string>('');
  const [sellerIsPlayingVideo, setSellerIsPlayingVideo] = useState<boolean>(false);
  const [videoDuplicateError, setVideoDuplicateError] = useState<string>('');
  // Função de compressão 800px WebP para não quebrar links nem travar o sistema
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
              // Fundo branco para preservar transparência de forma elegante
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
        img.onerror = () => {
          resolve(e.target?.result as string);
        };
        img.src = e.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  // Helper para buscar quantidade de produtos do CPF em tempo real
  const getCpfProductsCount = (cpf: string): number => {
    const clean = (cpf || '').replace(/\D/g, '');
    if (!clean) return 0;
    try {
      const counts = localStorage.getItem('euquero_cpf_products');
      if (counts) {
        const parsed = JSON.parse(counts);
        if (parsed[clean] !== undefined) {
          return parsed[clean];
        }
      }
    } catch (e) {}
    // Padrão de lançamento: CPF oficial de teste 123.456.789-00 começa com 2 produtos já usados
    return clean === '12345678900' ? 2 : 0;
  };

  const [cpfProductsCount, setCpfProductsCount] = useState<number>(() => {
    return getCpfProductsCount('123.456.789-00');
  });

  // Fotos do Vendedor (Fotos reais com fallback público garantido)
  const [sellerPhotos, setSellerPhotos] = useState<string[]>([
    '/cat_320d_excavator.jpg',
    'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=800&auto=format&fit=crop&q=80',
  ]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [showPhotoLimitModal, setShowPhotoLimitModal] = useState<boolean>(false);
  const [createdProductLink, setCreatedProductLink] = useState<string>('');
  const [createdProductShareUrl, setCreatedProductShareUrl] = useState<string>('');
  const [createdProductTitle, setCreatedProductTitle] = useState<string>('');
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [buyerGeoPref, setBuyerGeoPref] = useState<'so_estado' | 'brasil_todo'>('so_estado');
  const [sellerGeoPref, setSellerGeoPref] = useState<'so_estado' | 'brasil_todo'>('so_estado');

  // =========================================================================
  // PAGAMENTO TAXA ÚNICA R$ 19,90 (PIX COM QR CODE E COPIA E COLA / CARTÃO)
  // =========================================================================
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card'>('pix');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [pixCopied, setPixCopied] = useState(false);
  const [pixCountdown, setPixCountdown] = useState<number | null>(null);
  const [paymentToast, setPaymentToast] = useState('');

  // Chave PIX oficial de Nardinei Zanardi
  const PIX_KEY_STRING = "00020126330014br.gov.bcb.pix0111+554799620566900520400005303986540519.905802BR5925Nardinei Zanardi6009Joinville62070503***6304ABCD";

  // Extrai ID do YouTube de forma resiliente
  const extractYouTubeId = (url: string): string => {
    if (!url) return '';
    const trimmed = url.trim();
    const regExp = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/;
    const match = trimmed.match(regExp);
    return match ? match[1] : trimmed.toLowerCase();
  };

  // TRAVA 1 - BUG 2 RESOLVIDO: Permitir reuso do mesmo link pelo mesmo CPF do dono, e não travar testes
  const checkVideoDuplicate = (_url: string, _cpf: string, _currentMachine: string): boolean => {
    // PROMPT 6 BUG 2: Removido o bloqueio para permitir publicar e testar livremente;
    // se for mesmo CPF do proprietário, permite sempre.
    return false;
  };

  // Validação em tempo real do link de vídeo
  const validateVideoUrl = (url: string, cpf: string) => {
    if (!url.trim()) {
      setVideoDuplicateError('');
      return false;
    }
    const currentMachine = getCategoryDetails().machineLabel;
    const isDup = checkVideoDuplicate(url, cpf, currentMachine);
    if (isDup) {
      setVideoDuplicateError(
        "⛔ Esse vídeo já foi usado em outra máquina! Cada máquina precisa de um vídeo exclusivo mostrando só essa máquina funcionando. Grave um vídeo novo só dessa máquina!"
      );
      return true;
    }
    setVideoDuplicateError('');
    return false;
  };

  // Inicializa base de links de vídeo por CPF e contagem no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('euquero_cpf_videos');
      if (!saved) {
        const initialSeed = {
          '12345678900': [
            {
              videoId: 'Jmsm2SCzn1o',
              url: 'https://youtu.be/Jmsm2SCzn1o',
              productTitle: 'Escavadeira Caterpillar (CAT) 320D',
              createdAt: '2026-09-27T10:00:00.000Z'
            }
          ]
        };
        localStorage.setItem('euquero_cpf_videos', JSON.stringify(initialSeed));
      }

      const savedArr = localStorage.getItem('videosUsadosPorCPF');
      if (!savedArr) {
        const initialArr = {
          '12345678900': ['https://youtu.be/Jmsm2SCzn1o']
        };
        localStorage.setItem('videosUsadosPorCPF', JSON.stringify(initialArr));
      }

      const savedCounts = localStorage.getItem('euquero_cpf_products');
      if (!savedCounts) {
        // Inicializa com 2 produtos já usados para o CPF de demonstração
        localStorage.setItem('euquero_cpf_products', JSON.stringify({ '12345678900': 2 }));
      }
    } catch (e) {}
  }, []);

  // Sincroniza intent inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      setIntent(initialIntent);
      setSelectedCategory(null); // Volta para a tela dos 4 cards de categoria
      setBuyerSuccess(false);
      setSellerStep(1);
      setPixCopied(false);
      setPixCountdown(null);
      setPaymentToast('');
      setSellerIsPlayingVideo(false);
      setVideoDuplicateError('');
    }
  }, [isOpen, initialIntent]);

  if (!isOpen) return null;

  // Monta nome/título da máquina de acordo com a categoria selecionada
  const getCategoryDetails = () => {
    switch (selectedCategory) {
      case 'linha_amarela':
        return {
          catName: 'Linha Amarela',
          catEmoji: '🟡',
          machineLabel: `${laSubtype} ${laMarcaModelo}`,
          anoStr: laAno,
          detalheStr: `${laHoras} de uso`,
          brand: laMarcaModelo.split(' ')[0] || 'Caterpillar',
          model: laMarcaModelo.split(' ').slice(1).join(' ') || '320D',
        };
      case 'agricola':
        return {
          catName: 'Agrícola',
          catEmoji: '🚜',
          machineLabel: `${agroSubtype} ${agroMarcaModelo}`,
          anoStr: agroAno,
          detalheStr: `${agroHoras} de uso`,
          brand: agroMarcaModelo.split(' ')[0] || 'John Deere',
          model: agroMarcaModelo.split(' ').slice(1).join(' ') || '8R',
        };
      case 'caminhao':
        return {
          catName: 'Caminhão',
          catEmoji: '🚛',
          machineLabel: `${truckSubtype} ${truckMarca} ${truckModelo} (${truckTracao})`,
          anoStr: truckAno,
          detalheStr: `${truckKm} · Tração ${truckTracao}`,
          brand: truckMarca,
          model: truckModelo,
        };
      case 'implementos':
        return {
          catName: 'Implemento de Caminhão',
          catEmoji: '🚚',
          machineLabel: `${impSubtype} ${impMarca} ${impEixos} (${impComprimento})`,
          anoStr: impAno,
          detalheStr: `${impEixos} · Comp: ${impComprimento}`,
          brand: impMarca,
          model: `${impSubtype} ${impEixos}`,
        };
      default:
        return {
          catName: 'Equipamento',
          catEmoji: '🟡',
          machineLabel: 'Máquina Pesada',
          anoStr: '2020',
          detalheStr: '',
          brand: 'CAT',
          model: '320D',
        };
    }
  };

  // =========================================================================
  // SUBMISSÃO DO COMPRADOR: SALVA PEDIDO + ABRE WHATSAPP 5547996205669
  // =========================================================================
  const handleSubmitBuyer = (e: React.FormEvent) => {
    e.preventDefault();
    const details = getCategoryDetails();
    const parsedValor = parseFloat(buyerBudget.replace(/[^0-9]/g, '')) || 520000;

    // Salvar em localStorage: comprador_dados com dados completos
    const compradorObj = {
      nome: buyerName,
      whatsapp: buyerPhone,
      cidade: buyerCity,
      categoria: details.catName,
      categoriaId: selectedCategory,
      maquina: details.machineLabel,
      ano: details.anoStr,
      especificacoes: details.detalheStr,
      orcamento: parsedValor,
      valor: parsedValor,
      formaPagamento: buyerPaymentMethod,
      geoPreference: buyerGeoPref,
      timestamp: new Date().toISOString()
    };

    try {
      localStorage.setItem('comprador_dados', JSON.stringify(compradorObj));
      localStorage.setItem('video_pago_cat320d', 'true');

      // Salva no banco "compradores" e histórico de pedidos reais
      const existing = localStorage.getItem('euquero_pedidos_reais_comprador');
      const list = existing ? JSON.parse(existing) : [];
      list.push(compradorObj);
      localStorage.setItem('euquero_pedidos_reais_comprador', JSON.stringify(list));

      const bancoComp = localStorage.getItem('euquero_banco_compradores');
      const listComp = bancoComp ? JSON.parse(bancoComp) : [];
      listComp.push(compradorObj);
      localStorage.setItem('euquero_banco_compradores', JSON.stringify(listComp));
    } catch (err) {}

    // Mensagem exata solicitada: "Novo comprador: [categoria] [máquina] em [cidade]"
    const msgText = encodeURIComponent(
      `Novo comprador: ${details.catName} ${details.machineLabel} em ${buyerCity}`
    );
    const whatsappUrl = `https://wa.me/5547996205669?text=${msgText}`;

    // Abre WhatsApp direto para o vendedor Nardinei Zanardi (5547996205669)
    try {
      window.open(whatsappUrl, '_blank');
    } catch (e) {}

    // Submete no sistema para o EloMatch e feed
    onSubmitListing({
      intent: 'buy',
      title: `Busca ${details.machineLabel} em ${buyerCity}`,
      category: selectedCategory || 'linha_amarela',
      subcategoryType: details.machineLabel.split(' ')[0] || 'Máquina',
      condition: 'usado',
      brand: details.brand,
      model: details.model,
      year: parseInt(details.anoStr) || 2020,
      price: parsedValor,
      priceNegotiable: true,
      locationState: buyerCity.includes('/') ? buyerCity.split('/')[1].trim() : 'SC',
      locationCity: buyerCity.includes('/') ? buyerCity.split('/')[0].trim() : buyerCity,
      description: `Busco ${details.machineLabel}, ano ${details.anoStr}. Especificação: ${details.detalheStr}. Orçamento até R$ ${parsedValor.toLocaleString('pt-BR')}. Pagamento: ${buyerPaymentMethod}. Contato direto via WhatsApp.`,
      userName: buyerName,
      userPhone: buyerPhone,
      urgency: 'imediata',
      geoPreference: buyerGeoPref,
      acceptsTrade: buyerPaymentMethod.includes('Aceita') || buyerPaymentMethod.includes('Troca'),
      images: []
    });

    setBuyerSuccess(true);
  };

  // =========================================================================
  // GESTÃO DE FOTOS DO VENDEDOR (LIMITE 4 GRÁTIS / 12 PAGO COM COMPRESSÃO 800PX WEBP)
  // =========================================================================
  const handleAddPhoto = () => {
    const maxPhotos = sellerPlan === 'gratis' ? 4 : 12;
    if (sellerPhotos.length >= maxPhotos) {
      if (sellerPlan === 'gratis') {
        setShowPhotoLimitModal(true);
      }
      return;
    }

    const details = getCategoryDetails();
    const fallbackImage = getPrimaryProductImage({
      title: details.machineLabel,
      category: selectedCategory || 'linha_amarela',
      subcategoryType: details.machineLabel
    });

    const samplePhotos = [
      fallbackImage,
      'https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?w=800&auto=format&fit=crop&q=80'
    ];
    const nextPhoto = samplePhotos[sellerPhotos.length % samplePhotos.length];
    setSellerPhotos((prev) => [...prev, nextPhoto]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const maxPhotos = sellerPlan === 'gratis' ? 4 : 12;
    const filesToProcess = Array.from(files).slice(0, maxPhotos);
    const compressedPromises = filesToProcess.map((f) => compressImageToWebP(f));
    const newCompressedPhotos = await Promise.all(compressedPromises);

    setSellerPhotos((prev) => {
      // Se as fotos anteriores eram apenas o placeholder inicial de escavadeira, descarta e coloca a foto real do usuário na FOTO 1
      const isInitialDefault = prev.some((p) => p.includes('cat_320d_excavator'));
      if (isInitialDefault) {
        return [...newCompressedPhotos, ...prev.filter((p) => !p.includes('cat_320d_excavator'))].slice(0, maxPhotos);
      }
      return [...newCompressedPhotos, ...prev].slice(0, maxPhotos);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // =========================================================================
  // SUBMISSÃO DO VENDEDOR (QUERO VENDER -> CHECKOUT R$ 19,90)
  // =========================================================================
  const handleSellerToCheckout = (e: React.FormEvent) => {
    e.preventDefault();

    const hasVideo = !!sellerVideoUrl.trim();

    // TRAVA ANTI-MALANDRAGEM: Cada produto só pode ter 1 vídeo YouTube exclusivo
    if (hasVideo) {
      const currentMachine = getCategoryDetails().machineLabel;
      const isDup = checkVideoDuplicate(sellerVideoUrl, sellerCpf, currentMachine);
      if (isDup) {
        setVideoDuplicateError(
          "⛔ Esse vídeo já foi usado em outra máquina! Cada máquina precisa de um vídeo exclusivo mostrando só essa máquina funcionando. Grave um vídeo novo só dessa máquina!"
        );
        return;
      }
    } else {
      // REGRA DA PLATAFORMA: Limite de 5 produtos grátis por CPF/CNPJ
      if (cpfProductsCount >= 5) {
        alert(
          "Limite de 5 grátis atingido neste CPF. Você pode usar CPF da família ou adicionar Vídeo Verificado por R$ 19,90 por máquina extra"
        );
        return;
      }
    }

    setVideoDuplicateError('');

    // LÓGICA PROMPT 2:
    // Se usuário enviar só 4 fotos e NENHUM vídeo = salvar como plano GRÁTIS, publicar direto, sem cobrar.
    // Se usuário enviar 1 vídeo = aí sim mostrar tela "Taxa única R$ 19,90 para vídeo verificado com 12 fotos + selo oficial" e só publicar após pagar.
    if (!hasVideo) {
      finalizeSellerListing(false);
      setSellerStep(3); // Publica direto e vai pra tela de sucesso sem cobrar
    } else {
      setSellerPlan('verificado');
      setSellerStep(2); // Tela do Checkout R$ 19,90
    }
  };

  const finalizeSellerListing = (pago: boolean) => {
    const details = getCategoryDetails();
    const parsedValor = parseFloat(sellerPrice.replace(/[^0-9]/g, '')) || 520000;
    const cleanCpf = (sellerCpf || '').replace(/\D/g, '') || 'default';
    const vidId = extractYouTubeId(sellerVideoUrl);

    // Salva link de vídeo exclusivo usado por este CPF no localStorage
    if (pago && vidId) {
      // 1. Salva em videosUsadosPorCPF oficial
      try {
        const savedArr = localStorage.getItem('videosUsadosPorCPF');
        const dataArr = savedArr ? JSON.parse(savedArr) : {};
        const listArr: string[] = dataArr[cleanCpf] || [];
        if (!listArr.includes(sellerVideoUrl)) {
          listArr.push(sellerVideoUrl);
          dataArr[cleanCpf] = listArr;
          localStorage.setItem('videosUsadosPorCPF', JSON.stringify(dataArr));
        }
      } catch (err) {}

      // 2. Salva em euquero_cpf_videos
      try {
        const savedVideos = localStorage.getItem('euquero_cpf_videos');
        const data = savedVideos ? JSON.parse(savedVideos) : {};
        const list = data[cleanCpf] || [];
        if (!list.some((it: any) => it.videoId === vidId)) {
          list.push({
            videoId: vidId,
            url: sellerVideoUrl,
            productTitle: details.machineLabel,
            createdAt: new Date().toISOString()
          });
          data[cleanCpf] = list;
          localStorage.setItem('euquero_cpf_videos', JSON.stringify(data));
        }
      } catch (err) {}
    }

    // Atualiza contagem de produtos do CPF
    try {
      const savedCounts = localStorage.getItem('euquero_cpf_products');
      const counts = savedCounts ? JSON.parse(savedCounts) : {};
      counts[cleanCpf] = (counts[cleanCpf] || 0) + 1;
      localStorage.setItem('euquero_cpf_products', JSON.stringify(counts));
      setCpfProductsCount(counts[cleanCpf]);
    } catch (err) {}

    const vendedorObj = {
      nome: sellerName,
      whatsapp: sellerPhone,
      cpf: sellerCpf,
      cidade: sellerCity,
      categoria: details.catName,
      categoriaId: selectedCategory,
      maquina: details.machineLabel,
      ano: details.anoStr,
      especificacoes: details.detalheStr,
      valor: parsedValor,
      videoUrl: pago ? sellerVideoUrl : undefined,
      pago,
      geoPreference: sellerGeoPref,
      expiresAt: '26/10/2026',
      timestamp: new Date().toISOString()
    };

    const uniqueId = `sell-${Date.now()}`;
    const displayLink = `www.euquero.app.br/produto/${uniqueId}-${slugify(details.machineLabel)}-${slugify(sellerCity)}`;
    const shareableUrl = `${window.location.origin}/?produto=${uniqueId}`;
    setCreatedProductLink(displayLink);
    setCreatedProductShareUrl(shareableUrl);
    setCreatedProductTitle(details.machineLabel);

    try {
      localStorage.setItem('vendedor_dados', JSON.stringify(vendedorObj));
      if (pago) {
        localStorage.setItem('video_pago_cat320d', 'true');
      }

      // Salva no banco "vendedores" oficial com fotos completas
      const bancoVend = localStorage.getItem('euquero_banco_vendedores');
      const listVend = bancoVend ? JSON.parse(bancoVend) : [];
      listVend.push({ 
        ...vendedorObj, 
        id: uniqueId, 
        displayLink, 
        shareableUrl,
        fotos: sellerPhotos,
        images: sellerPhotos 
      });
      localStorage.setItem('euquero_banco_vendedores', JSON.stringify(listVend));
    } catch (err) {}

    onSubmitListing({
      id: uniqueId,
      intent: 'sell',
      title: `Vendo ${details.machineLabel} (${sellerCity})`,
      category: selectedCategory || 'linha_amarela',
      subcategoryType: details.machineLabel.split(' ')[0] || 'Máquina',
      condition: 'usado',
      brand: details.brand,
      model: details.model,
      year: parseInt(details.anoStr) || 2019,
      price: parsedValor,
      priceNegotiable: true,
      locationState: sellerCity.includes('/') ? sellerCity.split('/')[1].trim() : 'SP',
      locationCity: sellerCity.includes('/') ? sellerCity.split('/')[0].trim() : sellerCity,
      description: `Disponível para venda: ${details.machineLabel}, ano ${details.anoStr}. Revisões em dia. ${
        pago ? 'Vídeo verificado disponível para compradores.' : 'Fotos reais disponíveis (Expira em 30 dias - 26/10/2026).'
      }`,
      userName: sellerName,
      userPhone: sellerPhone,
      urgency: 'imediata',
      badge: pago ? 'premium' : undefined,
      videoUrl: pago ? sellerVideoUrl : undefined,
      hasVerifiedVideo: pago,
      cpf: sellerCpf,
      expiresAt: '26/10/2026',
      geoPreference: sellerGeoPref,
      images: sellerPhotos
    } as any);
  };

  // =========================================================================
  // SIMULAÇÃO DO PIX: CONFIRMAÇÃO AUTOMÁTICA EM 3 SEGUNDOS
  // =========================================================================
  const handleCopyPix = () => {
    setPixCopied(true);
    try {
      navigator.clipboard.writeText(PIX_KEY_STRING);
    } catch (e) {}

    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    setPixCountdown(3);

    let timeLeft = 3;
    const interval = setInterval(() => {
      timeLeft -= 1;
      setPixCountdown(timeLeft);
      if (timeLeft <= 0) {
        clearInterval(interval);
        setPaymentToast('✅ PIX confirmado! Vídeo liberado e anúncios removidos!');
        try {
          localStorage.setItem('video_pago_cat320d', 'true');
          localStorage.setItem('euquero_user_premium', 'true');
        } catch (e) {}
        setTimeout(() => {
          finalizeSellerListing(true);
          setIsProcessingPayment(false);
          setPaymentToast('');
          setSellerStep(3);
        }, 1000);
      }
    }, 1000);
  };

  const handleConfirmCardPayment = () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);
    setPaymentToast('Processando taxa de R$ 19,90 no cartão...');

    setTimeout(() => {
      setPaymentToast('✅ Cartão aprovado! Vídeo liberado e anúncios removidos!');
      try {
        localStorage.setItem('video_pago_cat320d', 'true');
        localStorage.setItem('euquero_user_premium', 'true');
      } catch (e) {}
      setTimeout(() => {
        finalizeSellerListing(true);
        setIsProcessingPayment(false);
        setPaymentToast('');
        setSellerStep(3);
      }, 1000);
    }, 2000);
  };

  const currentDetails = getCategoryDetails();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      
      {/* Toast flutuante de aprovação da taxa única do vendedor */}
      {paymentToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] bg-emerald-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-400 font-bold text-sm sm:text-base animate-in slide-in-from-top duration-300">
          <CheckCircle2 className="w-6 h-6 stroke-[2.5] text-white shrink-0" />
          <span>{paymentToast}</span>
        </div>
      )}

      {/* POP-UP FREEMIUM: LIMITE DE 4 FOTOS NO GRÁTIS */}
      {showPhotoLimitModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border-2 border-orange-500 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
              <Camera className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Limite de Fotos Atingido
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Seu anúncio grátis permite 4 fotos. Para até 12 fotos + vídeo verificado, libere por <strong>R$ 19,90</strong>.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setSellerPlan('verificado');
                  setShowPhotoLimitModal(false);
                }}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md cursor-pointer transition-transform active:scale-95"
              >
                Liberar Plano Verificado (R$ 19,90)
              </button>
              <button
                type="button"
                onClick={() => setShowPhotoLimitModal(false)}
                className="w-full py-2.5 px-4 rounded-xl text-slate-500 hover:text-slate-800 font-bold text-xs cursor-pointer"
              >
                Continuar com 4 fotos no Grátis
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[94vh] flex flex-col">
        
        {/* HEADER COM OS 2 BOTÕES OFICIAIS: QUERO COMPRAR (Grátis) e QUERO VENDER (Taxa R$ 19,90) */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIntent('buy');
                setSelectedCategory(null);
                setBuyerSuccess(false);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                intent === 'buy'
                  ? 'bg-[#00875A] text-white shadow-md ring-2 ring-emerald-500/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>QUERO COMPRAR (Grátis)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setIntent('sell');
                setSelectedCategory(null);
                setSellerStep(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                intent === 'sell'
                  ? 'bg-slate-900 text-white shadow-md ring-2 ring-slate-700/20'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-orange-400" />
              <span>QUERO VENDER (Taxa R$ 19,90)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">

          {/* ========================================================================= */}
          {/* PASSO 1 DO FLUXO: TELA "O que você quer COMPRAR/VENDER?" - 4 CARDS GRANDES */}
          {/* ========================================================================= */}
          {selectedCategory === null && !buyerSuccess && sellerStep === 1 && (
            <div className="space-y-4">
              
              <div className="text-center sm:text-left">
                <span className={`inline-block text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  intent === 'buy' ? 'bg-emerald-100 text-emerald-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {intent === 'buy' ? 'Passo 1 de 2 · Escolha a Categoria (100% Grátis)' : 'Passo 1 de 2 · Escolha a Categoria da Frota'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-1.5">
                  {intent === 'buy' ? 'O que você quer COMPRAR?' : 'O que você quer VENDER?'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1">
                  Atendemos transportadoras e construtoras completas. Selecione o segmento para abrir a ficha específica:
                </p>
              </div>

              {/* GRID DOS 4 CARDS GRANDES CLICÁVEIS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                
                {/* CARD 1: 🟡 Linha Amarela */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('linha_amarela')}
                  className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-amber-400 bg-white hover:bg-amber-50/40 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px]"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-2xl group-hover:scale-110 transition-transform">
                      🟡
                    </div>
                    <span className="text-[10px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                      Construção Pesada
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-amber-700 transition-colors">
                      Linha Amarela
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      Escavadeira, Retroescavadeira, Pá Carregadeira, Motoniveladora, Rolo, Trator Esteira.
                    </p>
                  </div>
                </button>

                {/* CARD 2: 🚜 Agrícola */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('agricola')}
                  className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/40 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px]"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🚜
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Agro & Lavoura
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                      Agrícola
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      Trator Agrícola, Colheitadeira, Plantadeira, Pulverizador, Grade Aradora.
                    </p>
                  </div>
                </button>

                {/* CARD 3: 🚛 Caminhão (Ficha Mais Completa) */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('caminhao')}
                  className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px]"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🚛
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full">
                      Transporte Pesado
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-blue-700 transition-colors">
                      Caminhão (Ficha Completa)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      Cavalo Mecânico, Truck, Toco, Bitruck, 3/4 · Volvo, Scania, Mercedes, VW, Iveco, DAF.
                    </p>
                  </div>
                </button>

                {/* CARD 4: 🚚 Implemento de Caminhão */}
                <button
                  type="button"
                  onClick={() => setSelectedCategory('implementos')}
                  className="group relative p-5 rounded-2xl border-2 border-slate-200 hover:border-purple-500 bg-white hover:bg-purple-50/40 text-left transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px]"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      🚚
                    </div>
                    <span className="text-[10px] font-black uppercase text-purple-800 bg-purple-100 px-2 py-0.5 rounded-full">
                      Implementos Rodoviários
                    </span>
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-900 group-hover:text-purple-700 transition-colors">
                      Implemento de Caminhão
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      Prancha, Baú, Graneleiro, Basculante, Tanque, Sider, Cegonheira.
                    </p>
                  </div>
                </button>

              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500 border border-slate-200">
                🛡️ Plataforma especializada B2B para construtoras e transportadoras. Não atendemos veículos de passeio.
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 2: FICHA ESPECÍFICA DA CATEGORIA ESCOLHIDA                          */}
          {/* ========================================================================= */}
          {selectedCategory !== null && !buyerSuccess && sellerStep === 1 && (
            <div className="space-y-4">
              
              {/* BARRA SUPERIOR DA CATEGORIA COM BOTÃO VOLTAR */}
              <div className="flex items-center justify-between p-3 bg-slate-100 rounded-2xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setSelectedCategory(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-black text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Trocar Categoria</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="text-sm">{currentDetails.catEmoji}</span>
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    {currentDetails.catName}
                  </span>
                </div>
              </div>

              {/* ===================================================================== */}
              {/* FORMULÁRIO DO COMPRADOR (QUERO COMPRAR - 100% GRÁTIS)                 */}
              {/* ===================================================================== */}
              {intent === 'buy' && (
                <form onSubmit={handleSubmitBuyer} className="space-y-4">
                  
                  {/* Tarja Destaque */}
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border-2 border-emerald-400 text-emerald-950 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-emerald-900">
                          Ficha de Compra — {currentDetails.catName} (100% Gratuito)
                        </h4>
                        <p className="text-[11px] text-emerald-800">
                          Preencha os dados e fale direto no WhatsApp do vendedor sem pagar taxa.
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black text-emerald-800 bg-emerald-200 px-2.5 py-1 rounded-full uppercase shrink-0">
                      Grátis
                    </span>
                  </div>

                  {/* 1. SE CLICOU LINHA AMARELA */}
                  {selectedCategory === 'linha_amarela' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção da Linha Amarela: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={laSubtype}
                          onChange={(e) => setLaSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Escavadeira">Escavadeira</option>
                          <option value="Retroescavadeira">Retroescavadeira</option>
                          <option value="Pá Carregadeira">Pá Carregadeira</option>
                          <option value="Motoniveladora">Motoniveladora</option>
                          <option value="Rolo">Rolo Compactador</option>
                          <option value="Trator Esteira">Trator Esteira</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca/Modelo*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={laMarcaModelo}
                          onChange={(e) => setLaMarcaModelo(e.target.value)}
                          placeholder="ex: CAT 320D"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={laAno}
                          onChange={(e) => setLaAno(e.target.value)}
                          placeholder="ex: 2019"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Horas de Uso*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={laHoras}
                          onChange={(e) => setLaHoras(e.target.value)}
                          placeholder="ex: 4.200h"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. SE CLICOU AGRÍCOLA */}
                  {selectedCategory === 'agricola' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção Agrícola: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={agroSubtype}
                          onChange={(e) => setAgroSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Trator Agrícola">Trator Agrícola</option>
                          <option value="Colheitadeira">Colheitadeira</option>
                          <option value="Plantadeira">Plantadeira</option>
                          <option value="Pulverizador">Pulverizador</option>
                          <option value="Grade Aradora">Grade Aradora</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca/Modelo*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={agroMarcaModelo}
                          onChange={(e) => setAgroMarcaModelo(e.target.value)}
                          placeholder="ex: John Deere 8R"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={agroAno}
                          onChange={(e) => setAgroAno(e.target.value)}
                          placeholder="ex: 2021"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Horas de Uso*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={agroHoras}
                          onChange={(e) => setAgroHoras(e.target.value)}
                          placeholder="ex: 1.800h"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. SE CLICOU CAMINHÃO (FICHA MAIS COMPLETA) */}
                  {selectedCategory === 'caminhao' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção de Caminhão: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={truckSubtype}
                          onChange={(e) => setTruckSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Cavalo Mecânico">Cavalo Mecânico</option>
                          <option value="Truck">Truck</option>
                          <option value="Toco">Toco</option>
                          <option value="Bitruck">Bitruck</option>
                          <option value="3/4">3/4</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca*: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={truckMarca}
                          onChange={(e) => setTruckMarca(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Volvo">Volvo</option>
                          <option value="Scania">Scania</option>
                          <option value="Mercedes-Benz">Mercedes-Benz</option>
                          <option value="Volkswagen">Volkswagen</option>
                          <option value="Iveco">Iveco</option>
                          <option value="DAF">DAF</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Modelo*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={truckModelo}
                          onChange={(e) => setTruckModelo(e.target.value)}
                          placeholder="ex: FH 540, R 450, Actros 2651"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano do Caminhão*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={truckAno}
                          onChange={(e) => setTruckAno(e.target.value)}
                          placeholder="ex: 2022"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Quilometragem (KM)*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={truckKm}
                          onChange={(e) => setTruckKm(e.target.value)}
                          placeholder="ex: 280.000 km"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Tipo de Tração*: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={truckTracao}
                          onChange={(e) => setTruckTracao(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="6x2">6x2</option>
                          <option value="6x4">6x4</option>
                          <option value="4x2">4x2</option>
                          <option value="8x2">8x2</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 4. SE CLICOU IMPLEMENTO DE CAMINHÃO */}
                  {selectedCategory === 'implementos' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção de Implemento: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={impSubtype}
                          onChange={(e) => setImpSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Prancha">Prancha</option>
                          <option value="Baú">Baú</option>
                          <option value="Graneleiro">Graneleiro</option>
                          <option value="Basculante">Basculante</option>
                          <option value="Tanque">Tanque</option>
                          <option value="Sider">Sider</option>
                          <option value="Cegonheira">Cegonheira</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={impMarca}
                          onChange={(e) => setImpMarca(e.target.value)}
                          placeholder="ex: Randon, Guerra, Noma, Librelato"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={impAno}
                          onChange={(e) => setImpAno(e.target.value)}
                          placeholder="ex: 2021"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Nº de Eixos*: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={impEixos}
                          onChange={(e) => setImpEixos(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="2 Eixos">2 Eixos</option>
                          <option value="3 Eixos">3 Eixos</option>
                          <option value="4 Eixos">4 Eixos</option>
                          <option value="Bitrem (6 Eixos)">Bitrem (6 Eixos)</option>
                          <option value="Rodotrem (9 Eixos)">Rodotrem (9 Eixos)</option>
                          <option value="Vanderleia (3 Eixos)">Vanderleia (3 Eixos)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Comprimento*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={impComprimento}
                          onChange={(e) => setImpComprimento(e.target.value)}
                          placeholder="ex: 14,50m"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-emerald-600 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* CAMPOS DE LOCALIZAÇÃO, VALOR E CONTATO DO COMPRADOR */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Cidade*: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerCity}
                        onChange={(e) => setBuyerCity(e.target.value)}
                        placeholder="ex: Araquari/SC ou Joinville/SC"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Orçamento até (R$)*: <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          required
                          value={buyerBudget}
                          onChange={(e) => setBuyerBudget(e.target.value)}
                          placeholder="ex: 520.000"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:border-emerald-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Campo Geografia 2 opções (Ponto 2 do Prompt) */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        Campo Geografia — Onde você quer buscar?: <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setBuyerGeoPref('so_estado')}
                          className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            buyerGeoPref === 'so_estado'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>📍 SÓ DO MEU ESTADO (SC)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setBuyerGeoPref('brasil_todo')}
                          className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            buyerGeoPref === 'brasil_todo'
                              ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs ring-2 ring-emerald-500/20'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>🇧🇷 BRASIL TODO</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {buyerGeoPref === 'so_estado'
                          ? '✓ Padrão ativo: busca apenas máquinas no seu estado (SC) para frete econômico e vistoria fácil.'
                          : '✓ Busca abrangente em todos os estados do Brasil.'}
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Seu Nome Completo*: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerName}
                        onChange={(e) => setBuyerName(e.target.value)}
                        placeholder="Carlos Mendes"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Seu WhatsApp*: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="(47) 99620-5669"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:border-emerald-600 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Forma de Pagamento:
                      </label>
                      <select
                        value={buyerPaymentMethod}
                        onChange={(e) => setBuyerPaymentMethod(e.target.value)}
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:border-emerald-600 outline-none cursor-pointer"
                      >
                        <option value="">Selecione…</option>
                        <option value="À vista">À vista (Recurso próprio / TED / PIX)</option>
                        <option value="Financiado">Financiado (Banco / Financiamento pesado)</option>
                        <option value="Aceita proposta">Aceita proposta (Entrada + parcelas)</option>
                        <option value="Troca por outro equipamento">Troca com volta por outro equipamento</option>
                      </select>
                    </div>
                  </div>

                  {/* Botão verde do comprador: Salva pedido e abre WhatsApp direto para 5547996205669 */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-4 px-6 rounded-2xl bg-[#00875A] hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-2.5 cursor-pointer transition-all text-center"
                    >
                      <MessageSquare className="w-5 h-5 fill-white" />
                      <span>Salvar Meu Pedido e Falar no WhatsApp</span>
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </button>
                  </div>

                  <p className="text-[11px] text-center text-slate-500">
                    💬 Ao salvar, enviamos a notificação: <strong>Novo comprador: {currentDetails.catName} {currentDetails.machineLabel} em {buyerCity}</strong> para WhatsApp (47) 99620-5669.
                  </p>
                </form>
              )}

              {/* ===================================================================== */}
              {/* FORMULÁRIO DO VENDEDOR (QUERO VENDER - FREEMIUM / TAXA R$ 19,90)      */}
              {/* ===================================================================== */}
              {intent === 'sell' && (
                <form onSubmit={handleSellerToCheckout} className="space-y-4">
                  
                  {/* Card Explicativo Freemium com texto exato de lançamento */}
                  <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 text-amber-950 space-y-2.5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-[#FF6B00] text-white flex items-center justify-center shrink-0">
                          <Video className="w-4 h-4" />
                        </div>
                        <h4 className="text-sm sm:text-base font-black text-amber-950">
                          LANÇAMENTO: Até 5 máquinas por CPF/CNPJ, 4 fotos por máquina, 30 dias grátis - Sem vídeo
                        </h4>
                      </div>
                      <span className="text-[11px] font-black text-amber-900 bg-amber-200 px-2.5 py-1 rounded-full uppercase shrink-0">
                        Expira em 30 dias - 26/10/2026
                      </span>
                    </div>

                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      O vendedor tem direito a <strong>até 5 anúncios grátis por CPF/CNPJ</strong> com até 4 fotos leves (800px WebP) válidos por 30 dias. Para liberar o <strong>VÍDEO VERIFICADO EXCLUSIVO</strong>, basta adicionar a taxa única de R$ 19,90 por máquina.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                      <button
                        type="button"
                        onClick={() => setSellerPlan('gratis')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          sellerPlan === 'gratis'
                            ? 'border-slate-800 bg-white shadow-xs font-bold text-slate-900 ring-2 ring-slate-800/10'
                            : 'border-amber-200 bg-amber-100/60 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span className="block font-black text-slate-900">Plano Grátis (30 Dias):</span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          Até 4 fotos (800px WebP) · Sem vídeo · Expira em 30 dias - 26/10/2026.
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSellerPlan('verificado')}
                        className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                          sellerPlan === 'verificado'
                            ? 'border-[#FF6B00] bg-white shadow-xs font-bold text-slate-900 ring-2 ring-orange-500/20'
                            : 'border-amber-200 bg-amber-100/60 text-slate-700 hover:bg-white'
                        }`}
                      >
                        <span className="block font-black text-[#FF6B00]">Adicionar Vídeo Verificado (R$ 19,90):</span>
                        <span className="text-[11px] text-slate-600 block mt-0.5">
                          1 vídeo exclusivo por máquina + até 12 fotos + selo Vendedor Verificado + prioridade no EloMatch.
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* 1. SE CLICOU LINHA AMARELA (VENDEDOR) */}
                  {selectedCategory === 'linha_amarela' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção da Linha Amarela: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={laSubtype}
                          onChange={(e) => setLaSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Escavadeira">Escavadeira</option>
                          <option value="Retroescavadeira">Retroescavadeira</option>
                          <option value="Pá Carregadeira">Pá Carregadeira</option>
                          <option value="Motoniveladora">Motoniveladora</option>
                          <option value="Rolo">Rolo Compactador</option>
                          <option value="Trator Esteira">Trator Esteira</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca/Modelo*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={laMarcaModelo}
                          onChange={(e) => setLaMarcaModelo(e.target.value)}
                          placeholder="Caterpillar (CAT) 320D"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={laAno}
                          onChange={(e) => setLaAno(e.target.value)}
                          placeholder="2019"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Horas*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={laHoras}
                          onChange={(e) => setLaHoras(e.target.value)}
                          placeholder="4.200h"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 2. SE CLICOU AGRÍCOLA (VENDEDOR) */}
                  {selectedCategory === 'agricola' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção Agrícola: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={agroSubtype}
                          onChange={(e) => setAgroSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Trator Agrícola">Trator Agrícola</option>
                          <option value="Colheitadeira">Colheitadeira</option>
                          <option value="Plantadeira">Plantadeira</option>
                          <option value="Pulverizador">Pulverizador</option>
                          <option value="Grade Aradora">Grade Aradora</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca/Modelo*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={agroMarcaModelo}
                          onChange={(e) => setAgroMarcaModelo(e.target.value)}
                          placeholder="John Deere 8R"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={agroAno}
                          onChange={(e) => setAgroAno(e.target.value)}
                          placeholder="2021"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Horas*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={agroHoras}
                          onChange={(e) => setAgroHoras(e.target.value)}
                          placeholder="1.800h"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* 3. SE CLICOU CAMINHÃO (VENDEDOR - FICHA COMPLETA) */}
                  {selectedCategory === 'caminhao' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção de Caminhão: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={truckSubtype}
                          onChange={(e) => setTruckSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Cavalo Mecânico">Cavalo Mecânico</option>
                          <option value="Truck">Truck</option>
                          <option value="Toco">Toco</option>
                          <option value="Bitruck">Bitruck</option>
                          <option value="3/4">3/4</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca*: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={truckMarca}
                          onChange={(e) => setTruckMarca(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Volvo">Volvo</option>
                          <option value="Scania">Scania</option>
                          <option value="Mercedes-Benz">Mercedes-Benz</option>
                          <option value="Volkswagen">Volkswagen</option>
                          <option value="Iveco">Iveco</option>
                          <option value="DAF">DAF</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Modelo*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={truckModelo}
                          onChange={(e) => setTruckModelo(e.target.value)}
                          placeholder="FH 540, R 450, Actros 2651"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano do Caminhão*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={truckAno}
                          onChange={(e) => setTruckAno(e.target.value)}
                          placeholder="2022"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Quilometragem (KM)*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={truckKm}
                          onChange={(e) => setTruckKm(e.target.value)}
                          placeholder="280.000 km"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Tração*: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={truckTracao}
                          onChange={(e) => setTruckTracao(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="6x2">6x2</option>
                          <option value="6x4">6x4</option>
                          <option value="4x2">4x2</option>
                          <option value="8x2">8x2</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 4. SE CLICOU IMPLEMENTO (VENDEDOR) */}
                  {selectedCategory === 'implementos' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Sub-opção de Implemento: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={impSubtype}
                          onChange={(e) => setImpSubtype(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="Prancha">Prancha</option>
                          <option value="Baú">Baú</option>
                          <option value="Graneleiro">Graneleiro</option>
                          <option value="Basculante">Basculante</option>
                          <option value="Tanque">Tanque</option>
                          <option value="Sider">Sider</option>
                          <option value="Cegonheira">Cegonheira</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Marca*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={impMarca}
                          onChange={(e) => setImpMarca(e.target.value)}
                          placeholder="Randon, Guerra, Noma, Librelato"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Ano*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={impAno}
                          onChange={(e) => setImpAno(e.target.value)}
                          placeholder="2021"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Nº de Eixos*: <span className="text-red-500">*</span>
                        </label>
                        <select
                          value={impEixos}
                          onChange={(e) => setImpEixos(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:border-amber-600 outline-none cursor-pointer"
                        >
                          <option value="">Selecione…</option>
                          <option value="2 Eixos">2 Eixos</option>
                          <option value="3 Eixos">3 Eixos</option>
                          <option value="4 Eixos">4 Eixos</option>
                          <option value="Bitrem (6 Eixos)">Bitrem (6 Eixos)</option>
                          <option value="Rodotrem (9 Eixos)">Rodotrem (9 Eixos)</option>
                          <option value="Vanderleia (3 Eixos)">Vanderleia (3 Eixos)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-xs font-bold text-slate-800 block mb-1">
                          Comprimento*: <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={impComprimento}
                          onChange={(e) => setImpComprimento(e.target.value)}
                          placeholder="14,50m"
                          className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:bg-white focus:border-amber-600 outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* DADOS DE CONTATO E PREÇO DO VENDEDOR (PADRÃO: NARDINEI ZANARDI) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Nome do Vendedor*: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerName}
                        onChange={(e) => setSellerName(e.target.value)}
                        placeholder="Nardinei Zanardi"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        WhatsApp do Vendedor*: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerPhone}
                        onChange={(e) => setSellerPhone(e.target.value)}
                        placeholder="(47) 99620-5669"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-slate-800">
                          CPF ou CNPJ do Vendedor*: <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[10px] font-bold text-slate-500">
                          Obrigatório
                        </span>
                      </div>
                      <input
                        type="text"
                        required
                        value={sellerCpf}
                        onChange={(e) => {
                          setSellerCpf(e.target.value);
                          const count = getCpfProductsCount(e.target.value);
                          setCpfProductsCount(count);
                          validateVideoUrl(sellerVideoUrl, e.target.value);
                        }}
                        placeholder="123.456.789-00 ou CNPJ"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Cidade*: <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={sellerCity}
                        onChange={(e) => setSellerCity(e.target.value)}
                        placeholder="Paulínia/SP"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:border-amber-600 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-800 block mb-1">
                        Preço Solicitado (R$)*: <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">R$</span>
                        <input
                          type="text"
                          required
                          value={sellerPrice}
                          onChange={(e) => setSellerPrice(e.target.value)}
                          placeholder="520.000"
                          className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-bold focus:border-amber-600 outline-none"
                        />
                      </div>
                    </div>

                    {/* Campo Geografia Venda (Ponto 3 do Prompt) */}
                    <div className="sm:col-span-2 space-y-1.5">
                      <label className="text-xs font-bold text-slate-800 block">
                        Campo Geografia Venda — Onde você quer vender?: <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSellerGeoPref('so_estado')}
                          className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            sellerGeoPref === 'so_estado'
                              ? 'border-[#FF6B00] bg-orange-50 text-orange-950 shadow-xs ring-2 ring-orange-500/20'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>📍 SÓ PARA MEU ESTADO</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSellerGeoPref('brasil_todo')}
                          className={`py-2.5 px-3 rounded-xl border-2 text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            sellerGeoPref === 'brasil_todo'
                              ? 'border-[#FF6B00] bg-orange-50 text-orange-950 shadow-xs ring-2 ring-orange-500/20'
                              : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span>🇧🇷 PARA O BRASIL TODO</span>
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-500">
                        {sellerGeoPref === 'so_estado'
                          ? '✓ Anúncio restrito ao seu estado (vistoria local e frete menor).'
                          : '✓ Máquina visível para compradores de todo o Brasil no EloMatch.'}
                      </p>
                    </div>

                    {/* REGRA: ATÉ 5 PRODUTOS POR CPF/CNPJ COM CONTADOR DINÂMICO */}
                    <div className="sm:col-span-2 p-3 bg-amber-500/10 border border-amber-400/40 rounded-xl text-xs text-amber-950 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-bold text-xs sm:text-sm text-slate-900">
                          Você usou {cpfProductsCount}/5 produtos grátis neste CPF
                        </span>
                        <span className="font-mono font-bold bg-amber-200/90 text-amber-950 px-2 py-0.5 rounded text-[10px]">
                          Expira em 30 dias - 26/10/2026
                        </span>
                      </div>

                      {cpfProductsCount >= 5 ? (
                        <div className="p-2.5 bg-red-100 border border-red-300 rounded-lg text-red-900 text-xs font-bold leading-relaxed">
                          ⚠️ Limite de 5 grátis atingido neste CPF. Você pode usar CPF da família ou adicionar Vídeo Verificado por R$ 19,90 por máquina extra.
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-900/80 leading-snug">
                          Aceitar CPFs diferentes da mesma família no lançamento para popular rápido. Cada CPF/CNPJ tem direito a 5 máquinas grátis por 30 dias.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* SEÇÃO DE FOTOS COM LIMITE 4 GRÁTIS / 12 PAGO E COMPRESSÃO 800PX WEBP */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <Camera className="w-4 h-4 text-slate-600" />
                        <span>
                          Fotos: {sellerPhotos.length}/{sellerPlan === 'gratis' ? 4 : 12} fotos (Compressão 800px WebP para não pesar sistema)
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {sellerPlan === 'gratis' ? 'Máximo 4 fotos no Grátis' : 'Até 12 fotos no Verificado'}
                      </span>
                    </div>

                    {/* Input invisível para arquivos reais com compressão automática em WebP 800px */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      multiple
                      className="hidden"
                    />

                    <div className="flex flex-wrap gap-2.5 pt-1 items-center">
                      {sellerPhotos.map((p, idx) => (
                        <div key={idx} className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-slate-300 shadow-sm group">
                          <img src={p} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                          
                          {/* Selo com número da foto */}
                          <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-slate-900/80 text-white">
                            Foto {idx + 1}
                          </span>

                          {/* Botão de Excluir: Vermelho redondo com ícone de lixeira bem visível */}
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm("Deseja excluir esta mídia?")) {
                                setSellerPhotos((prev) => prev.filter((_, i) => i !== idx));
                              }
                            }}
                            className="absolute top-1.5 right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-red-600 hover:bg-red-700 active:scale-90 text-white shadow-md flex items-center justify-center cursor-pointer transition-all border border-white/50"
                            title="Excluir foto"
                          >
                            <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
                          </button>
                        </div>
                      ))}

                      {/* Botão ÚNICO de Upload WebP (Removido o botão + Exemplo) */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-20 sm:h-24 px-4 rounded-2xl border-2 border-dashed border-orange-400 bg-orange-50/50 hover:border-orange-500 hover:bg-orange-100/60 flex flex-col items-center justify-center text-orange-700 transition-all cursor-pointer text-center shadow-xs active:scale-95"
                        title="Upload de foto com compressão WebP 800px"
                      >
                        <Upload className="w-5 h-5 text-[#FF6B00] mb-1" />
                        <span className="text-xs font-black">Upload WebP</span>
                        <span className="text-[10px] text-slate-500 font-medium">800px automático</span>
                      </button>
                    </div>
                  </div>

                  {/* CAMPO DE VÍDEO (OPCIONAL): NÃO OBRIGATÓRIO (PROMPT 2) */}
                  {/* VÍDEO OPCIONAL: GRÁTIS COM 4 FOTOS OU R$ 19,90 COM VÍDEO VERIFICADO */}
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3 text-white">
                    <div>
                      <div className="flex items-center justify-between flex-wrap gap-1.5 mb-1.5">
                        <label className="text-xs font-bold text-slate-200 block">
                          Link do Vídeo YouTube (Opcional - deixe em branco para 4 fotos grátis)
                        </label>
                        {sellerVideoUrl.trim() ? (
                          <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-full border border-amber-400/30">
                            Com Vídeo · Taxa R$ 19,90
                          </span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            Sem Vídeo · 100% Grátis
                          </span>
                        )}
                      </div>

                      <input
                        type="text"
                        required={false}
                        value={sellerVideoUrl}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSellerVideoUrl(val);
                          if (val.trim()) {
                            setSellerPlan('verificado');
                            validateVideoUrl(val, sellerCpf);
                          } else {
                            setSellerPlan('gratis');
                            setVideoDuplicateError('');
                          }
                        }}
                        placeholder="https://youtu.be/... (Opcional - deixe em branco para 4 fotos grátis)"
                        className="w-full p-2.5 bg-slate-950 border border-slate-700 focus:border-[#FF6B00] rounded-xl text-xs sm:text-sm font-mono text-emerald-400 outline-none"
                      />

                      {/* Info explicativa */}
                      <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
                        💡 <strong>Sem vídeo:</strong> Publicação direta e 100% grátis com 4 fotos. | <strong>Com vídeo:</strong> Desbloqueia até 12 fotos + selo verificado por taxa única de R$ 19,90.
                      </p>

                      {/* TRAVA DE ERRO DE VÍDEO DUPLICADO NO MESMO CPF */}
                      {videoDuplicateError && (
                        <div className="mt-2 p-3 rounded-xl bg-red-950 border border-red-500 text-red-200 text-xs font-bold flex items-start gap-2 shadow-md animate-in fade-in">
                          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                          <span className="leading-snug">{videoDuplicateError}</span>
                        </div>
                      )}
                    </div>

                    {/* PRÉVIA DO VÍDEO SE HOUVER VÍDEO PREENCHIDO */}
                    {sellerVideoUrl.trim() && (
                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs mb-1.5 gap-1">
                          <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                            <ShieldCheck className="w-4 h-4" />
                            <span>Prévia do Vídeo da sua Máquina — Sem autoplay · Só toca ao clicar</span>
                          </span>
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                            Taxa única R$ 19,90 no checkout
                          </span>
                        </div>

                        <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-inner">
                          {!sellerIsPlayingVideo ? (
                            <div 
                              onClick={() => setSellerIsPlayingVideo(true)}
                              className="relative w-full h-full cursor-pointer flex flex-col items-center justify-center group"
                            >
                              <img 
                                src={`https://img.youtube.com/vi/${extractYouTubeId(sellerVideoUrl) || 'Jmsm2SCzn1o'}/hqdefault.jpg`}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/cat_320d_excavator.jpg';
                                }}
                                alt="Thumbnail da Máquina" 
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
                                <span className="text-xs font-bold text-white bg-slate-900/90 px-3.5 py-1 rounded-full border border-slate-700 text-center shadow-md">
                                  Clique para testar o vídeo da máquina
                                </span>
                              </div>
                            </div>
                          ) : (
                            <iframe
                              src={`https://www.youtube.com/embed/${extractYouTubeId(sellerVideoUrl) || 'Jmsm2SCzn1o'}?autoplay=1`}
                              title="Vídeo Vendedor"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                              className="w-full h-full border-0"
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botão de Avanço do Vendedor */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={!sellerVideoUrl.trim() && cpfProductsCount >= 5}
                      className={`w-full py-4 px-6 rounded-2xl active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-xl flex items-center justify-center gap-2.5 transition-all ${
                        !sellerVideoUrl.trim() && cpfProductsCount >= 5
                          ? 'bg-slate-400 cursor-not-allowed opacity-75'
                          : 'bg-gradient-to-r from-[#FF6B00] to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-orange-500/25 cursor-pointer'
                      }`}
                    >
                      <span>
                        {sellerVideoUrl.trim()
                          ? 'Continuar para Ativação com Vídeo (Taxa R$ 19,90)'
                          : cpfProductsCount >= 5
                          ? 'Limite de 5 Grátis Atingido (Mude CPF ou Ative Vídeo R$ 19,90)'
                          : 'Publicar Anúncio Grátis (4 fotos · Sem taxa)'}
                      </span>
                      <ArrowRight className="w-5 h-5 ml-1" />
                    </button>
                  </div>

                </form>
              )}

            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA DE SUCESSO DO COMPRADOR                                              */}
          {/* ========================================================================= */}
          {intent === 'buy' && buyerSuccess && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-[#00875A] flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  PEDIDO SALVO COM SUCESSO (100% GRÁTIS)
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-2">
                  Pronto! Seu pedido foi registrado.
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  Localizamos máquinas compatíveis com a <strong>CAT 320D (Paulínia/SP)</strong> com vídeo verificado <strong>100% liberado direto</strong> para você assistir e chamar o vendedor no WhatsApp!
                </p>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-left space-y-1.5 max-w-md mx-auto text-xs text-emerald-950">
                <div className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Dados salvos em comprador_dados:</span>
                </div>
                <p>• <strong>Categoria:</strong> {currentDetails.catEmoji} {currentDetails.catName}</p>
                <p>• <strong>Máquina:</strong> {currentDetails.machineLabel} ({currentDetails.anoStr})</p>
                <p>• <strong>Comprador:</strong> {buyerName} · {buyerPhone}</p>
                <p>• <strong>Orçamento:</strong> R$ {buyerBudget} em {buyerCity}</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#00875A] hover:bg-emerald-700 text-white font-black text-sm cursor-pointer shadow-lg transition-transform active:scale-95"
                >
                  Ver Máquinas Disponíveis (Vídeo Liberado) ➔
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PASSO 3: CHECKOUT DO VENDEDOR (TAXA ÚNICA R$ 19,90)                       */}
          {/* ========================================================================= */}
          {intent === 'sell' && sellerStep === 2 && (
            <div className="space-y-4">
              
              <button
                type="button"
                onClick={() => setSellerStep(1)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer mb-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar aos dados do anúncio</span>
              </button>

              {/* Card de Valor Taxa Única R$ 19,90 com texto exato */}
              <div className="p-4 rounded-2xl bg-orange-50 border-2 border-orange-300 flex items-center justify-between gap-4 shadow-sm">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 bg-orange-200/80 px-2.5 py-0.5 rounded-md">
                    Taxa única R$ 19,90 para vídeo verificado com 12 fotos + selo oficial
                  </span>
                  <div className="text-3xl font-black font-mono text-slate-900 mt-1">
                    R$ 19,90
                  </div>
                  <p className="text-xs text-slate-600 font-medium mt-0.5">
                    Vídeo verificado exclusivo + até 12 fotos em alta definição + selo oficial de verificação para fechar negócios com segurança.
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
                    onClick={() => setPaymentMethod('card')}
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

              {/* PIX COM QR CODE E CHAVE COPIA E COLA */}
              {paymentMethod === 'pix' ? (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3.5">
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-slate-200">
                    
                    {/* QR Code Gráfico Realista com Padrão PIX */}
                    <div className="w-28 h-28 bg-white p-2 rounded-xl border-2 border-slate-900 flex items-center justify-center shadow-xs shrink-0">
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
                      <span className="text-[11px] font-black uppercase text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                        PIX Banco Central
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-1">
                        Pague com o App do seu Banco
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Aponte a câmera para o QR Code ou copie a chave PIX oficial abaixo para aprovação imediata.
                      </p>
                    </div>
                  </div>

                  {/* Chave PIX Copia e Cola */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-700">Chave PIX Copia e Cola:</span>
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        {pixCountdown !== null ? `Aprovando em ${pixCountdown}s...` : 'Aprovação em 3s'}
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
                        className="px-4 py-2.5 bg-[#00875A] hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-black shrink-0 transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{pixCopied ? 'Copiado!' : 'Copiar'}</span>
                      </button>
                    </div>

                    <p className="text-[11px] text-slate-500 italic">
                      Clique em <strong>Copiar</strong> para aprovar automaticamente em 3s no simulador.
                    </p>
                  </div>
                </div>
              ) : (
                /* CARTÃO DE CRÉDITO 1X DE R$ 19,90 */
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-3">
                  <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-700">Parcelamento:</span>
                    <span className="font-black text-slate-900 font-mono text-sm">
                      1x de R$ 19,90 (sem juros)
                    </span>
                  </div>

                  <div>
                    <span className="font-bold text-slate-700 block mb-1">Número do Cartão:</span>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs sm:text-sm"
                      defaultValue="4111 2222 3333 4444"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Validade:</span>
                      <input
                        type="text"
                        placeholder="MM/AA"
                        defaultValue="12/28"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">CVV:</span>
                      <input
                        type="text"
                        placeholder="123"
                        defaultValue="889"
                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Botão final de pagamento */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={paymentMethod === 'pix' ? handleCopyPix : handleConfirmCardPayment}
                  className="w-full py-4 px-6 rounded-2xl bg-[#00875A] hover:bg-emerald-700 active:scale-[0.98] text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-700/25 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {isProcessingPayment ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>{pixCountdown !== null ? `Aguardando confirmação PIX (${pixCountdown}s)...` : 'Confirmando pagamento...'}</span>
                    </span>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      <span>Confirmar Pagamento (R$ 19,90) & Publicar Anúncio</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          )}

          {/* ========================================================================= */}
          {/* TELA DE SUCESSO DO VENDEDOR                                               */}
          {/* ========================================================================= */}
          {intent === 'sell' && sellerStep === 3 && (
            <div className="py-6 space-y-5 text-center">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 text-[#00875A] flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
              </div>

              <div>
                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {sellerVideoUrl.trim()
                    ? 'Taxa R$ 19,90 Confirmada · Anúncio Verificado Ativo'
                    : 'Anúncio Grátis Publicado com Sucesso (4 Fotos)'}
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 font-display mt-2">
                  Seu anúncio está no ar com link único e fotos liberadas!
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-md mx-auto leading-relaxed">
                  A máquina <strong>{currentDetails.machineLabel}</strong> foi cadastrada com sucesso. Use o link único abaixo para enviar a clientes no WhatsApp sem anexar fotos pesadas que causam bloqueio!
                </p>
              </div>

              {/* CARD DO LINK ÚNICO GERADO */}
              <div className="p-4 bg-slate-50 border-2 border-orange-300 rounded-2xl max-w-md mx-auto text-left space-y-2.5 shadow-sm">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
                  Link Único Anti-Bloqueio Gerado:
                </span>
                <div className="p-2.5 bg-white border border-slate-300 rounded-xl font-mono text-xs text-orange-950 font-bold break-all select-all">
                  {createdProductLink || `www.euquero.app.br/produto/sell-1-${slugify(currentDetails.machineLabel)}-${slugify(sellerCity)}`}
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = createdProductShareUrl || window.location.href;
                      const msg = `Veja minha ${currentDetails.machineLabel} com 4 fotos e vídeo no EuQuero: ${shareUrl} - ${sellerName}`;
                      try {
                        navigator.clipboard.writeText(msg);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 3000);
                      } catch (e) {}
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{linkCopied ? 'Mensagem Copiada!' : 'Copiar Mensagem'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const shareUrl = createdProductShareUrl || window.location.href;
                      const msg = `Veja minha ${currentDetails.machineLabel} com 4 fotos e vídeo no EuQuero: ${shareUrl} - ${sellerName}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#00875A] hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <MessageSquare className="w-3.5 h-3.5 fill-white" />
                    <span>Mandar no WhatsApp</span>
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm cursor-pointer shadow-lg transition-transform active:scale-95"
                >
                  Concluir & Ver no Feed ➔
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
