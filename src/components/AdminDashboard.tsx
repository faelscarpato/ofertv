'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, MediaItem, AudioItem, MediaType, TransitionType } from '@/lib/supabaseClient';
import {
  Tv,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Eye,
  Clock,
  Video,
  Image as ImageIcon,
  CheckCircle,
  AlertTriangle,
  UploadCloud,
  Link as LinkIcon,
  PlayCircle,
  PauseCircle,
  FileText,
  Sparkles,
  Wand2,
  Music,
  Volume2,
} from 'lucide-react';

const BUCKET_NAME = 'ofertv-media';

type AspectRatio = '16:9' | '9:16' | 'original';

interface BannerTheme {
  id: string;
  name: string;
  bgColor: string;
  headerBg: string;
  badgeBg: string;
  badgeTextColor: string;
  titleColor: string;
  priceColor: string;
  accentColor: string;
  cardBg: string;
}

const BANNER_THEMES: BannerTheme[] = [
  {
    id: 'supermarket-red',
    name: 'Supermercado (Vermelho/Amarelo)',
    bgColor: '#b91c1c',
    headerBg: '#991b1b',
    badgeBg: '#facc15',
    badgeTextColor: '#000000',
    titleColor: '#ffffff',
    priceColor: '#facc15',
    accentColor: '#ffffff',
    cardBg: '#ffffff',
  },
  {
    id: 'gourmet-dark',
    name: 'Gourmet / Moderno (Dark Cyan)',
    bgColor: '#090d16',
    headerBg: '#0f172a',
    badgeBg: '#06b6d4',
    badgeTextColor: '#000000',
    titleColor: '#f8fafc',
    priceColor: '#22d3ee',
    accentColor: '#38bdf8',
    cardBg: '#1e293b',
  },
  {
    id: 'butcher-gold',
    name: 'Açougue & Carnes (Bordeaux & Gold)',
    bgColor: '#450a0a',
    headerBg: '#2a0606',
    badgeBg: '#eab308',
    badgeTextColor: '#000000',
    titleColor: '#ffffff',
    priceColor: '#fde047',
    accentColor: '#f59e0b',
    cardBg: '#ffffff',
  },
  {
    id: 'fresh-green',
    name: 'Hortifrúti / Verde Natural',
    bgColor: '#064e3b',
    headerBg: '#022c22',
    badgeBg: '#4ade80',
    badgeTextColor: '#052e16',
    titleColor: '#ffffff',
    priceColor: '#86efac',
    accentColor: '#22c55e',
    cardBg: '#ffffff',
  },
  {
    id: 'black-friday',
    name: 'Black Friday / Neon Gold',
    bgColor: '#000000',
    headerBg: '#111111',
    badgeBg: '#fbbf24',
    badgeTextColor: '#000000',
    titleColor: '#ffffff',
    priceColor: '#fbbf24',
    accentColor: '#f59e0b',
    cardBg: '#1c1917',
  },
];

export default function AdminDashboard() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [audioItems, setAudioItems] = useState<AudioItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [activeTab, setActiveTab] = useState<'template' | 'upload' | 'url' | 'audio'>('template');

  // Estados do Estúdio de Cartazes
  const [productTitle, setProductTitle] = useState<string>('Picanha Bovina Peça');
  const [priceFrom, setPriceFrom] = useState<string>('69,90');
  const [priceTo, setPriceTo] = useState<string>('49,90');
  const [unit, setUnit] = useState<string>('kg');
  const [badgeText, setBadgeText] = useState<string>('OFERTA DA SEMANA');
  const [footerText, setFooterText] = useState<string>('Ofertas válidas enquanto durarem os estoques.');
  const [selectedTheme, setSelectedTheme] = useState<BannerTheme>(BANNER_THEMES[0]);
  const [templateOrientation, setTemplateOrientation] = useState<'16:9' | '9:16'>('16:9');
  const [templateDuration, setTemplateDuration] = useState<number>(10);
  const [templateTransition, setTemplateTransition] = useState<TransitionType>('fade');
  const [productImageFile, setProductImageFile] = useState<File | null>(null);
  const [productImagePreview, setProductImagePreview] = useState<string | null>(null);

  // Estados do Upload Direto
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadMediaType, setUploadMediaType] = useState<MediaType>('image');
  const [uploadAspectRatio, setUploadAspectRatio] = useState<AspectRatio>('16:9');
  const [uploadDuration, setUploadDuration] = useState<number>(10);
  const [uploadTransition, setUploadTransition] = useState<TransitionType>('fade');

  // Estados do Link URL
  const [customUrl, setCustomUrl] = useState<string>('');
  const [urlTitle, setUrlTitle] = useState<string>('');
  const [urlMediaType, setUrlMediaType] = useState<MediaType>('image');
  const [urlDuration, setUrlDuration] = useState<number>(10);
  const [urlTransition, setUrlTransition] = useState<TransitionType>('fade');

  // Estados de Áudio
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioTitle, setAudioTitle] = useState<string>('');
  const [audioUrl, setAudioUrl] = useState<string>('');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const audioInputRef = useRef<HTMLInputElement | null>(null);
  const productImageInputRef = useRef<HTMLInputElement | null>(null);

  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      const [mediaRes, audioRes] = await Promise.all([
        supabase.from('media').select('*').order('order_index', { ascending: true }),
        supabase.from('audios').select('*').order('order_index', { ascending: true }),
      ]);

      if (mediaRes.error) throw mediaRes.error;
      if (audioRes.error) throw audioRes.error;

      setItems((mediaRes.data as MediaItem[]) || []);
      setAudioItems((audioRes.data as AudioItem[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao listar mídias';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const processImageToWebP = async (
    imageSource: HTMLImageElement | File,
    aspectRatio: AspectRatio = '16:9'
  ): Promise<File> => {
    let img: HTMLImageElement;

    if (imageSource instanceof File) {
      img = new Image();
      img.src = URL.createObjectURL(imageSource);
      await new Promise((res, rej) => {
        img.onload = () => res(true);
        img.onerror = rej;
      });
    } else {
      img = imageSource;
    }

    let targetWidth = 1920;
    let targetHeight = 1080;

    if (aspectRatio === '9:16') {
      targetWidth = 1080;
      targetHeight = 1920;
    } else if (aspectRatio === 'original') {
      targetWidth = img.naturalWidth || 1920;
      targetHeight = img.naturalHeight || 1080;
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Não foi possível iniciar o Canvas');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    const imgRatio = img.naturalWidth / img.naturalHeight;
    const targetRatio = targetWidth / targetHeight;

    let sx = 0, sy = 0, sWidth = img.naturalWidth, sHeight = img.naturalHeight;

    if (imgRatio > targetRatio) {
      sWidth = img.naturalHeight * targetRatio;
      sx = (img.naturalWidth - sWidth) / 2;
    } else {
      sHeight = img.naturalWidth / targetRatio;
      sy = (img.naturalHeight - sHeight) / 2;
    }

    ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => {
          if (b) resolve(b);
          else reject(new Error('Falha na conversão WebP'));
        },
        'image/webp',
        0.85
      );
    });

    return new File([blob], `processed-${Date.now()}.webp`, { type: 'image/webp' });
  };

  // Renderizador Tipográfico Preciso no Canvas
  const renderTemplateCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const isHorizontal = templateOrientation === '16:9';
    const width = isHorizontal ? 1920 : 1080;
    const height = isHorizontal ? 1080 : 1920;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fundo
    ctx.fillStyle = selectedTheme.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Cabeçalho
    const headerHeight = isHorizontal ? 160 : 220;
    ctx.fillStyle = selectedTheme.headerBg;
    ctx.fillRect(0, 0, width, headerHeight);

    // Selo
    if (badgeText.trim()) {
      ctx.save();
      const badgeWidth = isHorizontal ? 500 : 620;
      const badgeH = isHorizontal ? 72 : 90;
      const badgeX = isHorizontal ? 80 : (width - badgeWidth) / 2;
      const badgeY = isHorizontal ? 44 : 65;

      ctx.fillStyle = selectedTheme.badgeBg;
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeH, 16);
      ctx.fill();

      ctx.fillStyle = selectedTheme.badgeTextColor;
      ctx.font = `bold ${isHorizontal ? 36 : 46}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText.toUpperCase(), badgeX + badgeWidth / 2, badgeY + badgeH / 2);
      ctx.restore();
    }

    // Card do Produto
    const cardMarginX = isHorizontal ? 80 : 60;
    const cardMarginY = isHorizontal ? 200 : 260;
    const cardWidth = isHorizontal ? 900 : width - cardMarginX * 2;
    const cardHeight = isHorizontal ? 740 : 880;

    ctx.save();
    ctx.fillStyle = selectedTheme.cardBg;
    ctx.beginPath();
    ctx.roundRect(cardMarginX, cardMarginY, cardWidth, cardHeight, 28);
    ctx.fill();
    ctx.restore();

    // Imagem do Produto
    if (productImagePreview) {
      const pImg = new Image();
      pImg.crossOrigin = 'anonymous';
      pImg.src = productImagePreview;
      await new Promise((res) => {
        pImg.onload = res;
        pImg.onerror = res;
      });

      const pPadding = 40;
      const pMaxW = cardWidth - pPadding * 2;
      const pMaxH = cardHeight - pPadding * 2;

      const pRatio = pImg.naturalWidth / pImg.naturalHeight;
      let drawW = pMaxW;
      let drawH = drawW / pRatio;

      if (drawH > pMaxH) {
        drawH = pMaxH;
        drawW = drawH * pRatio;
      }

      const drawX = cardMarginX + (cardWidth - drawW) / 2;
      const drawY = cardMarginY + (cardHeight - drawH) / 2;

      ctx.drawImage(pImg, drawX, drawY, drawW, drawH);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Foto do Produto', cardMarginX + cardWidth / 2, cardMarginY + cardHeight / 2);
    }

    // Informações de Preço
    const infoX = isHorizontal ? 1040 : width / 2;
    const infoStartY = isHorizontal ? 270 : 1220;

    ctx.save();
    ctx.fillStyle = selectedTheme.titleColor;
    ctx.font = `bold ${isHorizontal ? 64 : 70}px sans-serif`;
    ctx.textAlign = isHorizontal ? 'left' : 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(productTitle || 'Nome do Produto', infoX, infoStartY, isHorizontal ? 800 : width - 120);
    ctx.restore();

    if (priceFrom.trim()) {
      const fromY = infoStartY + (isHorizontal ? 100 : 110);
      ctx.save();
      ctx.fillStyle = '#94a3b8';
      ctx.font = `bold ${isHorizontal ? 38 : 46}px sans-serif`;
      ctx.textAlign = isHorizontal ? 'left' : 'center';
      ctx.textBaseline = 'top';
      const deText = `DE: R$ ${priceFrom}`;
      ctx.fillText(deText, infoX, fromY);

      const deMetrics = ctx.measureText(deText);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 4;
      ctx.beginPath();
      const lineStartX = isHorizontal ? infoX : infoX - deMetrics.width / 2;
      ctx.moveTo(lineStartX, fromY + (isHorizontal ? 18 : 22));
      ctx.lineTo(lineStartX + deMetrics.width, fromY + (isHorizontal ? 18 : 22));
      ctx.stroke();
      ctx.restore();
    }

    const porY = infoStartY + (isHorizontal ? 190 : 210);
    ctx.save();
    ctx.fillStyle = selectedTheme.accentColor;
    ctx.font = `bold ${isHorizontal ? 32 : 38}px sans-serif`;
    ctx.textAlign = isHorizontal ? 'left' : 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('POR APENAS', infoX, porY);
    ctx.restore();

    const priceBaselineY = porY + (isHorizontal ? 170 : 190);

    const prefixFont = `bold ${isHorizontal ? 56 : 64}px sans-serif`;
    const numberFont = `bold ${isHorizontal ? 150 : 170}px sans-serif`;
    const unitFont = `bold ${isHorizontal ? 42 : 50}px sans-serif`;

    ctx.font = prefixFont;
    const prefixText = 'R$ ';
    const prefixWidth = ctx.measureText(prefixText).width;

    ctx.font = numberFont;
    const numberText = priceTo.trim() || '0,00';
    const numberWidth = ctx.measureText(numberText).width;

    let cleanUnit = unit.trim();
    if (cleanUnit && !cleanUnit.startsWith('/')) {
      cleanUnit = `/${cleanUnit}`;
    }
    ctx.font = unitFont;
    const unitWidth = cleanUnit ? ctx.measureText(cleanUnit).width : 0;

    const spacingUnit = 16;
    const totalBlockWidth = prefixWidth + numberWidth + (cleanUnit ? unitWidth + spacingUnit : 0);
    const startPriceX = isHorizontal ? infoX : (width - totalBlockWidth) / 2;

    ctx.save();
    ctx.textBaseline = 'alphabetic';
    ctx.textAlign = 'left';

    ctx.font = prefixFont;
    ctx.fillStyle = selectedTheme.priceColor;
    ctx.fillText(prefixText, startPriceX, priceBaselineY - (isHorizontal ? 12 : 14));

    ctx.font = numberFont;
    ctx.fillStyle = selectedTheme.priceColor;
    ctx.fillText(numberText, startPriceX + prefixWidth, priceBaselineY);

    if (cleanUnit) {
      ctx.font = unitFont;
      ctx.fillStyle = selectedTheme.titleColor;
      const unitX = startPriceX + prefixWidth + numberWidth + spacingUnit;
      ctx.fillText(cleanUnit, unitX, priceBaselineY - (isHorizontal ? 10 : 12));
    }
    ctx.restore();

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    const footerH = isHorizontal ? 75 : 95;
    ctx.fillRect(0, height - footerH, width, footerH);

    ctx.fillStyle = '#ffffff';
    ctx.font = `500 ${isHorizontal ? 22 : 26}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(footerText, width / 2, height - footerH / 2);
  }, [
    productTitle,
    priceFrom,
    priceTo,
    unit,
    badgeText,
    footerText,
    selectedTheme,
    templateOrientation,
    productImagePreview,
  ]);

  useEffect(() => {
    if (activeTab === 'template') {
      renderTemplateCanvas();
    }
  }, [activeTab, renderTemplateCanvas]);

  // Ação: Publicar Cartaz do Estúdio com Upload Seguro
  const handlePublishTemplate = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      setIsSaving(true);
      setStatusMessage(null);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Erro na exportação do cartaz'));
          },
          'image/webp',
          0.9
        );
      });

      const uniqueId = `cartaz-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fileName = `banners/${uniqueId}.webp`;
      const fileToUpload = new File([blob], `${uniqueId}.webp`, { type: 'image/webp' });

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileToUpload, {
          contentType: 'image/webp',
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErr) {
        throw new Error(`Falha no Storage: ${uploadErr.message}`);
      }

      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const nextIndex = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) + 1 : 0;

      const { error: dbErr } = await supabase.from('media').insert([
        {
          title: productTitle.trim() || 'Cartaz Promocional',
          url: publicUrl,
          media_type: 'image',
          duration: templateDuration,
          transition_type: templateTransition,
          order_index: nextIndex,
          is_active: true,
        },
      ]);

      if (dbErr) throw dbErr;

      setStatusMessage({ type: 'success', text: `Cartaz publicado com sucesso na TV (${templateDuration}s)!` });
      await fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao publicar cartaz';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Ação: Upload de Arquivo com Otimização
  const handleUploadFileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      setStatusMessage({ type: 'error', text: 'Selecione uma imagem ou vídeo para enviar.' });
      return;
    }

    try {
      setIsSaving(true);
      setStatusMessage(null);

      let fileToUpload: File = uploadFile;
      let finalExt = uploadFile.name.split('.').pop()?.toLowerCase() || 'bin';
      let contentType = uploadFile.type || 'application/octet-stream';

      if (uploadMediaType === 'image') {
        fileToUpload = await processImageToWebP(uploadFile, uploadAspectRatio);
        finalExt = 'webp';
        contentType = 'image/webp';
      }

      const uniqueId = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const fileName = `${uploadMediaType}s/${uniqueId}.${finalExt}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileToUpload, {
          contentType,
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      const nextIndex = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) + 1 : 0;

      const { error: dbErr } = await supabase.from('media').insert([
        {
          title: uploadTitle.trim() || 'Oferta Promocional',
          url: publicUrl,
          media_type: uploadMediaType,
          duration: uploadMediaType === 'image' ? uploadDuration : 15,
          transition_type: uploadTransition,
          order_index: nextIndex,
          is_active: true,
        },
      ]);

      if (dbErr) throw dbErr;

      setUploadFile(null);
      setUploadPreview(null);
      setUploadTitle('');
      setStatusMessage({ type: 'success', text: 'Mídia salva e publicada com sucesso!' });
      await fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar mídia';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  // Ação: Adicionar Faixa de Áudio
  const handleAddAudioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    let finalAudioUrl = '';

    try {
      setIsSaving(true);

      if (audioFile) {
        const fileExt = audioFile.name.split('.').pop()?.toLowerCase() || 'mp3';
        const uniqueId = `audio-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const fileName = `audios/${uniqueId}.${fileExt}`;

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, audioFile, {
            contentType: audioFile.type || 'audio/mpeg',
            cacheControl: '3600',
            upsert: true,
          });

        if (uploadErr) throw uploadErr;

        const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        finalAudioUrl = urlData.publicUrl;
      } else if (audioUrl.trim()) {
        finalAudioUrl = audioUrl.trim();
      } else {
        setStatusMessage({ type: 'error', text: 'Informe um arquivo de áudio ou uma URL.' });
        setIsSaving(false);
        return;
      }

      const nextIndex = audioItems.length > 0 ? Math.max(...audioItems.map((i) => i.order_index)) + 1 : 0;

      const { error: dbErr } = await supabase.from('audios').insert([
        {
          title: audioTitle.trim() || 'Faixa de Áudio',
          url: finalAudioUrl,
          order_index: nextIndex,
          is_active: true,
        },
      ]);

      if (dbErr) throw dbErr;

      setAudioFile(null);
      setAudioTitle('');
      setAudioUrl('');
      setStatusMessage({ type: 'success', text: 'Áudio adicionado à playlist da TV!' });
      await fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao salvar áudio';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAudio = async (audio: AudioItem) => {
    if (!confirm(`Excluir áudio "${audio.title}"?`)) return;

    try {
      setIsSaving(true);
      if (audio.url.includes(BUCKET_NAME)) {
        const parts = audio.url.split(`${BUCKET_NAME}/`);
        if (parts.length > 1) {
          const rawPath = decodeURIComponent(parts[1].split('?')[0]);
          await supabase.storage.from(BUCKET_NAME).remove([rawPath]);
        }
      }

      const { error } = await supabase.from('audios').delete().eq('id', audio.id);
      if (error) throw error;

      setStatusMessage({ type: 'success', text: 'Áudio excluído.' });
      await fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir áudio';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAudioStatus = async (audio: AudioItem) => {
    try {
      const { error } = await supabase
        .from('audios')
        .update({ is_active: !audio.is_active })
        .eq('id', audio.id);

      if (error) throw error;
      await fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alternar status do áudio';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleDeleteItem = async (item: MediaItem) => {
    if (!confirm(`Remover "${item.title}" da programação?`)) return;

    try {
      setIsSaving(true);

      if (item.url.includes(BUCKET_NAME)) {
        try {
          const parts = item.url.split(`${BUCKET_NAME}/`);
          if (parts.length > 1) {
            const rawPath = decodeURIComponent(parts[1].split('?')[0]);
            await supabase.storage.from(BUCKET_NAME).remove([rawPath]);
          }
        } catch (sErr) {
          console.warn('Erro ao remover do storage:', sErr);
        }
      }

      const { error: dbErr } = await supabase.from('media').delete().eq('id', item.id);
      if (dbErr) throw dbErr;

      setStatusMessage({ type: 'success', text: 'Mídia excluída da grade.' });
      await fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao excluir item';
      setStatusMessage({ type: 'error', text: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: MediaItem) => {
    try {
      const { error } = await supabase
        .from('media')
        .update({ is_active: !item.is_active })
        .eq('id', item.id);

      if (error) throw error;
      await fetchItems();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao alternar status';
      setStatusMessage({ type: 'error', text: msg });
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newItems = [...items];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setItems(newItems);

    try {
      const updates = newItems.map((item, idx) => ({
        id: item.id,
        order_index: idx,
        title: item.title,
        url: item.url,
        media_type: item.media_type,
        duration: item.duration,
        transition_type: item.transition_type,
        is_active: item.is_active,
      }));

      const { error } = await supabase.from('media').upsert(updates);
      if (error) throw error;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao ordenar itens';
      setStatusMessage({ type: 'error', text: msg });
      await fetchItems();
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 lg:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-3">
              <Tv className="h-8 w-8 text-cyan-400" />
              <h1 className="text-3xl font-bold tracking-tight text-white">OferTV Studio & Sound</h1>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Estúdio de cartazes digitais, otimização WebP e playlist contínua de áudio para varejo.
            </p>
          </div>
          <a
            href="/tv"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-5 py-2.5 font-medium text-white shadow-lg transition-colors hover:bg-cyan-500"
          >
            <Eye className="h-4 w-4" />
            Abrir Player TV
          </a>
        </header>

        {statusMessage && (
          <div
            className={`flex items-center gap-3 rounded-lg p-4 text-sm font-medium ${
              statusMessage.type === 'success'
                ? 'border border-emerald-800 bg-emerald-950/60 text-emerald-300'
                : 'border border-rose-800 bg-rose-950/60 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle className="h-5 w-5 shrink-0" />
            ) : (
              <AlertTriangle className="h-5 w-5 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('template')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'template'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Wand2 className="h-4 w-4" />
            Estúdio de Cartazes (Canvas)
          </button>

          <button
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            Upload de Imagem/Vídeo
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'audio'
                ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <Music className="h-4 w-4 text-purple-300" />
            Rádio & Músicas ({audioItems.length})
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:bg-slate-900 hover:text-white'
            }`}
          >
            <LinkIcon className="h-4 w-4" />
            Link URL
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-6">
            {activeTab === 'template' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Sparkles className="h-5 w-5 text-amber-400" />
                    Estúdio de Cartaz Promocional
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setTemplateOrientation('16:9')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        templateOrientation === '16:9' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      16:9 (TV)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTemplateOrientation('9:16')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold ${
                        templateOrientation === '9:16' ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      9:16 (Totem)
                    </button>
                  </div>
                </div>

                <div className="flex justify-center rounded-xl bg-black/60 p-4 border border-slate-800 overflow-hidden">
                  <canvas ref={canvasRef} className="max-h-[340px] max-w-full rounded-lg shadow-2xl object-contain" />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Nome do Produto</label>
                    <input
                      type="text"
                      value={productTitle}
                      onChange={(e) => setProductTitle(e.target.value)}
                      placeholder="Ex: Picanha Bovina Peça"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Selo de Destaque</label>
                    <input
                      type="text"
                      value={badgeText}
                      onChange={(e) => setBadgeText(e.target.value)}
                      placeholder="Ex: OFERTA DA SEMANA"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Preço De (R$)</label>
                    <input
                      type="text"
                      value={priceFrom}
                      onChange={(e) => setPriceFrom(e.target.value)}
                      placeholder="Ex: 69,90"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Preço Por (R$)</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        type="text"
                        value={priceTo}
                        onChange={(e) => setPriceTo(e.target.value)}
                        placeholder="Ex: 49,90"
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      />
                      <input
                        type="text"
                        value={unit}
                        onChange={(e) => setUnit(e.target.value)}
                        placeholder="kg"
                        className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white text-center focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">
                      Duração na TV (Segundos)
                    </label>
                    <div className="mt-1 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-slate-400" />
                      <input
                        type="number"
                        min={3}
                        max={180}
                        value={templateDuration}
                        onChange={(e) => setTemplateDuration(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Efeito de Transição</label>
                    <select
                      value={templateTransition}
                      onChange={(e) => setTemplateTransition(e.target.value as TransitionType)}
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    >
                      <option value="fade">Dissolver (Fade)</option>
                      <option value="slide">Deslizar (Slide)</option>
                      <option value="zoom">Aproximar (Zoom)</option>
                      <option value="flip">Girar (Flip 3D)</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-400">Foto do Produto</label>
                    <input
                      ref={productImageInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          setProductImageFile(file);
                          setProductImagePreview(URL.createObjectURL(file));
                        }
                      }}
                      className="hidden"
                    />
                    <div className="mt-1 flex gap-3 items-center">
                      <button
                        type="button"
                        onClick={() => productImageInputRef.current?.click()}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                      >
                        {productImageFile ? 'Trocar Foto' : 'Carregar Imagem do Produto'}
                      </button>
                      {productImageFile && (
                        <button
                          type="button"
                          onClick={() => {
                            setProductImageFile(null);
                            setProductImagePreview(null);
                          }}
                          className="text-xs text-rose-400 hover:underline"
                        >
                          Remover Imagem
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Tema Visual</label>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {BANNER_THEMES.map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setSelectedTheme(theme)}
                          className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs font-medium transition-all ${
                            selectedTheme.id === theme.id
                              ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                              : 'border-slate-800 bg-slate-950 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          <span className="h-4 w-4 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: theme.bgColor }} />
                          <span className="truncate">{theme.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handlePublishTemplate}
                  disabled={isSaving}
                  className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-cyan-500 py-3.5 font-bold text-slate-950 shadow-xl transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSaving ? 'Enviando...' : `Renderizar e Publicar (${templateDuration}s na TV)`}
                </button>
              </div>
            )}

            {activeTab === 'upload' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <UploadCloud className="h-5 w-5 text-cyan-400" />
                  Upload Direto de Mídia
                </h2>

                <form onSubmit={handleUploadFileSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Título</label>
                    <input
                      type="text"
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                      placeholder="Ex: Vídeo de Ofertas Açougue"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400">Formato</label>
                      <div className="mt-1 grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setUploadMediaType('image')}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium ${
                            uploadMediaType === 'image'
                              ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                              : 'border-slate-800 bg-slate-950 text-slate-400'
                          }`}
                        >
                          <ImageIcon className="h-4 w-4" />
                          Imagem
                        </button>
                        <button
                          type="button"
                          onClick={() => setUploadMediaType('video')}
                          className={`flex items-center justify-center gap-1.5 rounded-lg border py-2 text-xs font-medium ${
                            uploadMediaType === 'video'
                              ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                              : 'border-slate-800 bg-slate-950 text-slate-400'
                          }`}
                        >
                          <Video className="h-4 w-4" />
                          Vídeo
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400">Efeito de Transição</label>
                      <select
                        value={uploadTransition}
                        onChange={(e) => setUploadTransition(e.target.value as TransitionType)}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
                      >
                        <option value="fade">Dissolver (Fade)</option>
                        <option value="slide">Deslizar (Slide)</option>
                        <option value="zoom">Aproximar (Zoom)</option>
                        <option value="flip">Girar (Flip 3D)</option>
                      </select>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        const file = e.target.files[0];
                        setUploadFile(file);
                        setUploadMediaType(file.type.startsWith('video/') ? 'video' : 'image');
                        setUploadPreview(URL.createObjectURL(file));
                        if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }}
                    className="hidden"
                  />

                  {!uploadFile ? (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-950/60 p-8 text-center cursor-pointer hover:border-slate-500"
                    >
                      <UploadCloud className="h-10 w-10 text-cyan-400 mb-2" />
                      <p className="text-sm font-medium text-white">Clique para selecionar imagem ou vídeo</p>
                      <p className="mt-1 text-xs text-slate-400">Conversão automática para WebP</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-700 bg-slate-950 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs text-cyan-300 font-semibold">{uploadFile.name}</span>
                        <button type="button" onClick={() => setUploadFile(null)} className="text-xs text-rose-400 hover:underline">
                          Trocar
                        </button>
                      </div>
                      <div className="h-40 w-full bg-black rounded-lg overflow-hidden flex items-center justify-center">
                        {uploadMediaType === 'image' && uploadPreview && <img src={uploadPreview} alt="Preview" className="h-full w-full object-contain" />}
                        {uploadMediaType === 'video' && uploadPreview && <video src={uploadPreview} controls className="h-full w-full object-contain" />}
                      </div>
                    </div>
                  )}

                  {uploadMediaType === 'image' && (
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400">Duração (Segundos)</label>
                      <input
                        type="number"
                        min={3}
                        max={180}
                        value={uploadDuration}
                        onChange={(e) => setUploadDuration(Number(e.target.value))}
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-lg bg-cyan-600 py-3 font-semibold text-white shadow-lg hover:bg-cyan-500 disabled:opacity-50"
                  >
                    {isSaving ? 'Enviando...' : 'Salvar Mídia na TV'}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="rounded-xl border border-purple-900/60 bg-slate-900/70 p-6 shadow-xl space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                    <Music className="h-5 w-5 text-purple-400" />
                    Trilha Sonora & Rádio Interna
                  </h2>
                  <span className="text-xs text-purple-300 font-medium bg-purple-950/80 px-3 py-1 rounded-full border border-purple-800">
                    Áudio Independente
                  </span>
                </div>

                <form onSubmit={handleAddAudioSubmit} className="space-y-4 rounded-lg bg-slate-950 p-4 border border-slate-800">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Nome da Faixa / Locução</label>
                    <input
                      type="text"
                      value={audioTitle}
                      onChange={(e) => setAudioTitle(e.target.value)}
                      placeholder="Ex: Música Ambiente / Vinheta Promocional"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                      Arquivo de Áudio (MP3, WAV, AAC, OGG)
                    </label>
                    <input
                      ref={audioInputRef}
                      type="file"
                      accept="audio/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          const file = e.target.files[0];
                          setAudioFile(file);
                          if (!audioTitle) setAudioTitle(file.name.replace(/\.[^/.]+$/, ''));
                        }
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => audioInputRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-purple-800 bg-purple-950/20 py-4 text-xs font-semibold text-purple-300 hover:bg-purple-950/40"
                    >
                      <Volume2 className="h-4 w-4" />
                      {audioFile ? `Selecionado: ${audioFile.name}` : 'Selecionar arquivo de áudio'}
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Ou Link URL Direto de Áudio</label>
                    <input
                      type="url"
                      value={audioUrl}
                      onChange={(e) => setAudioUrl(e.target.value)}
                      placeholder="https://exemplo.com/musica.mp3"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3.5 py-2 text-sm text-white focus:border-purple-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSaving}
                    className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 py-3 font-semibold text-white shadow-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {isSaving ? 'Enviando Áudio...' : 'Adicionar à Playlist de Áudio'}
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-white">Playlist de Áudio ({audioItems.length} faixas)</h3>
                  {audioItems.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">Nenhum áudio cadastrado.</p>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {audioItems.map((audio) => (
                        <div key={audio.id} className="flex items-center justify-between py-3 gap-3">
                          <div className="flex items-center gap-3">
                            <Music className="h-4 w-4 text-purple-400 shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-white">{audio.title}</p>
                              <audio src={audio.url} controls className="h-7 w-48 sm:w-64 mt-1" />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleAudioStatus(audio)}
                              className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                                audio.is_active ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {audio.is_active ? 'Ativo' : 'Pausado'}
                            </button>
                            <button
                              onClick={() => handleDeleteAudio(audio)}
                              className="p-1.5 text-rose-400 hover:bg-rose-950/50 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'url' && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl space-y-6">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                  <LinkIcon className="h-5 w-5 text-cyan-400" />
                  Inserir por Link Externo (HTTPS)
                </h2>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!customUrl.trim()) return;
                    setIsSaving(true);
                    const nextIndex = items.length > 0 ? Math.max(...items.map((i) => i.order_index)) + 1 : 0;
                    await supabase.from('media').insert([
                      {
                        title: urlTitle.trim() || 'Oferta Externa',
                        url: customUrl.trim(),
                        media_type: urlMediaType,
                        duration: urlMediaType === 'image' ? urlDuration : 15,
                        transition_type: urlTransition,
                        order_index: nextIndex,
                        is_active: true,
                      },
                    ]);
                    setCustomUrl('');
                    setUrlTitle('');
                    setIsSaving(false);
                    fetchItems();
                  }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">Título</label>
                    <input
                      type="text"
                      value={urlTitle}
                      onChange={(e) => setUrlTitle(e.target.value)}
                      placeholder="Ex: Vídeo de Oferta"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-400">URL</label>
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="https://exemplo.com/banner.jpg"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                  <button type="submit" disabled={isSaving} className="w-full rounded-lg bg-cyan-600 py-3 font-semibold text-white">
                    Adicionar à Grade
                  </button>
                </form>
              </div>
            )}
          </div>

          <div className="lg:col-span-5">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h2 className="text-lg font-semibold text-white">Grade Visual na TV ({items.length})</h2>
                <span className="text-xs text-slate-400">Sincronização Ativa</span>
              </div>

              {isLoading ? (
                <div className="py-16 text-center text-sm text-slate-400">Carregando grade...</div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
                  <FileText className="h-12 w-12 text-slate-700 mb-3" />
                  <p className="text-sm font-medium">Nenhuma mídia ativa.</p>
                </div>
              ) : (
                <div className="mt-4 divide-y divide-slate-800/80 max-h-[680px] overflow-y-auto pr-1">
                  {items.map((item, index) => (
                    <div key={item.id} className="flex items-center justify-between gap-3 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col gap-1">
                          <button
                            disabled={index === 0}
                            onClick={() => handleMoveOrder(index, 'up')}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-20"
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </button>
                          <button
                            disabled={index === items.length - 1}
                            onClick={() => handleMoveOrder(index, 'down')}
                            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-white disabled:opacity-20"
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-black border border-slate-800 flex items-center justify-center">
                          {item.media_type === 'image' ? (
                            <img src={item.url} alt={item.title} className="h-full w-full object-cover" />
                          ) : (
                            <video src={item.url} className="h-full w-full object-cover" />
                          )}
                        </div>

                        <div className="max-w-[140px] sm:max-w-[180px]">
                          <h3 className="truncate text-sm font-medium text-white">{item.title}</h3>
                          <p className="text-xs text-slate-400">
                            {item.media_type.toUpperCase()} • {item.duration}s • {item.transition_type || 'fade'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(item)}
                          className={`rounded-full p-1.5 ${
                            item.is_active ? 'text-emerald-400 hover:bg-emerald-950/50' : 'text-slate-500 hover:bg-slate-800'
                          }`}
                        >
                          {item.is_active ? <PlayCircle className="h-5 w-5" /> : <PauseCircle className="h-5 w-5" />}
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item)}
                          className="rounded-lg p-1.5 text-rose-400 hover:bg-rose-950/50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}