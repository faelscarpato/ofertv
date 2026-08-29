'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, MediaItem, AudioItem, TransitionType, parseAudioSource, ParsedAudio } from '@/lib/supabaseClient';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import {
  Tv,
  WifiOff,
  AlertCircle,
  Maximize,
  Minimize,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Music,
  Radio,
} from 'lucide-react';

const transitionVariants: Record<TransitionType, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { x: '100%', opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: '-100%', opacity: 0 },
  },
  zoom: {
    initial: { scale: 1.12, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.92, opacity: 0 },
  },
  flip: {
    initial: { rotateY: 90, opacity: 0 },
    animate: { rotateY: 0, opacity: 1 },
    exit: { rotateY: -90, opacity: 0 },
  },
};

export default function TVPlayer() {
  const [playlist, setPlaylist] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Estados de Trilha Sonora
  const [audioList, setAudioList] = useState<AudioItem[]>([]);
  const [currentAudioIndex, setCurrentAudioIndex] = useState<number>(0);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  const fetchPlaylist = useCallback(async () => {
    try {
      setErrorMessage(null);
      const { data, error } = await supabase
        .from('media')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setPlaylist((data as MediaItem[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro na sincronização de mídias';
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAudios = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('audios')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (error) throw error;
      setAudioList((data as AudioItem[]) || []);
    } catch (err) {
      console.warn('Erro ao sincronizar áudios:', err);
    }
  }, []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        }
      }
    } catch (err) {
      console.warn('Fullscreen indisponível:', err);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleUserInteraction = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        setIsAudioMuted((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  useEffect(() => {
    fetchPlaylist();
    fetchAudios();

    const mediaChannel = supabase
      .channel('tv-media-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' }, () => {
        fetchPlaylist();
      })
      .subscribe();

    const audioChannel = supabase
      .channel('tv-audio-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audios' }, () => {
        fetchAudios();
      })
      .subscribe();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      supabase.removeChannel(mediaChannel);
      supabase.removeChannel(audioChannel);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [fetchPlaylist, fetchAudios]);

  const advanceSlide = useCallback(() => {
    setPlaylist((prevList) => {
      if (prevList.length <= 1) return prevList;
      setCurrentIndex((prevIdx) => (prevIdx + 1) % prevList.length);
      return prevList;
    });
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (playlist.length === 0 || isPaused) return;

    const currentMedia = playlist[currentIndex];
    if (!currentMedia) {
      setCurrentIndex(0);
      return;
    }

    if (currentMedia.media_type === 'image') {
      const durationMs = Math.max(currentMedia.duration || 10, 3) * 1000;
      timerRef.current = setTimeout(() => {
        advanceSlide();
      }, durationMs);
    }
  }, [currentIndex, playlist, isPaused, advanceSlide]);

  const advanceAudio = useCallback(() => {
    setAudioList((prevList) => {
      if (prevList.length <= 1) return prevList;
      setCurrentAudioIndex((prevIdx) => (prevIdx + 1) % prevList.length);
      return prevList;
    });
  }, []);

  const toggleSound = () => {
    setIsAudioMuted((prev) => {
      const nextState = !prev;
      if (!nextState && audioPlayerRef.current) {
        audioPlayerRef.current.play().catch(() => {});
      }
      return nextState;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-4">
          <Tv className="h-16 w-16 animate-pulse text-cyan-400" />
          <p className="text-xl font-medium tracking-wide">Iniciando OferTV Player...</p>
        </div>
      </div>
    );
  }

  if (errorMessage && playlist.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 p-6 text-center text-white">
        <AlertCircle className="mb-4 h-16 w-16 text-rose-500" />
        <h1 className="text-2xl font-bold">Falha de Conexão</h1>
        <p className="mt-2 max-w-md text-zinc-400">{errorMessage}</p>
        <button
          onClick={() => {
            fetchPlaylist();
            fetchAudios();
          }}
          className="mt-6 rounded-lg bg-cyan-600 px-6 py-2.5 font-semibold text-white hover:bg-cyan-500"
        >
          Reconectar
        </button>
      </div>
    );
  }

  if (playlist.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <Tv className="mb-4 h-20 w-20 text-zinc-600" />
        <h2 className="text-2xl font-semibold text-zinc-300">Aguardando Grade de Ofertas</h2>
        <p className="mt-2 text-zinc-500">Cadastre cartazes ou mídias no painel /admin para iniciar.</p>
      </div>
    );
  }

  const currentMedia = playlist[currentIndex] || playlist[0];
  const activeTransition: TransitionType = currentMedia.transition_type || 'fade';
  const currentAudio = audioList[currentAudioIndex];
  const parsedAudio: ParsedAudio | null = currentAudio ? parseAudioSource(currentAudio.url) : null;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      className="relative h-screen w-screen overflow-hidden bg-black select-none cursor-default"
      style={{ perspective: 1000 }}
    >
      {/* 1. Player de Áudio Nativo (MP3 / Direct Stream) */}
      {!isAudioMuted && parsedAudio && parsedAudio.type === 'direct' && (
        <audio
          ref={audioPlayerRef}
          src={parsedAudio.embedUrl}
          autoPlay
          playsInline
          onEnded={advanceAudio}
          onError={advanceAudio}
          className="hidden"
        />
      )}

      {/* 2. Player de Áudio do YouTube / YouTube Music (Executado em Fundo) */}
      {!isAudioMuted && parsedAudio && parsedAudio.type === 'youtube' && (
        <iframe
          src={parsedAudio.embedUrl}
          allow="autoplay; encrypted-media"
          className="pointer-events-none fixed -top-[9999px] -left-[9999px] h-10 w-10 opacity-0"
          title="YouTube Audio Stream"
        />
      )}

      {/* 3. Player de Áudio do SoundCloud (Executado em Fundo) */}
      {!isAudioMuted && parsedAudio && parsedAudio.type === 'soundcloud' && (
        <iframe
          src={parsedAudio.embedUrl}
          allow="autoplay"
          className="pointer-events-none fixed -top-[9999px] -left-[9999px] h-10 w-10 opacity-0"
          title="SoundCloud Audio Stream"
        />
      )}

      {/* Indicador de Offline */}
      {!isOnline && (
        <div className="absolute top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-rose-600/90 px-4 py-1.5 text-xs font-semibold text-white shadow-lg backdrop-blur-md">
          <WifiOff className="h-4 w-4" />
          <span>Modo Offline</span>
        </div>
      )}

      {/* Controles Flutuantes com Auto-Hide */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="absolute top-4 right-4 z-50 flex items-center gap-2 rounded-2xl bg-slate-950/85 p-2 shadow-2xl backdrop-blur-md border border-slate-800"
          >
            {audioList.length > 0 && (
              <div className="flex items-center gap-2 border-r border-slate-800 pr-2">
                <button
                  onClick={toggleSound}
                  className={`flex h-10 items-center gap-2 rounded-xl px-3 text-xs font-semibold transition-colors ${
                    !isAudioMuted
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                  title={isAudioMuted ? 'Ativar Som (M)' : 'Silenciar (M)'}
                >
                  {!isAudioMuted ? <Volume2 className="h-4 w-4 text-emerald-400" /> : <VolumeX className="h-4 w-4" />}
                  <span className="hidden sm:inline truncate max-w-[130px]">
                    {currentAudio?.title || 'Rádio Interna'}
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
              title={isPaused ? 'Continuar (Espaço)' : 'Pausar (Espaço)'}
            >
              {isPaused ? <Play className="h-5 w-5 text-emerald-400" /> : <Pause className="h-5 w-5 text-amber-400" />}
            </button>

            <button
              onClick={() => advanceSlide()}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
              title="Próxima Mídia"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-600 text-white shadow-md transition-colors hover:bg-cyan-500"
              title={isFullscreen ? 'Sair da Tela Cheia (F)' : 'Tela Cheia (F)'}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Renderização Visual com Transição Dinâmica */}
      <AnimatePresence mode="wait">
        {currentMedia && (
          <motion.div
            key={`${currentMedia.id}-${currentIndex}`}
            variants={transitionVariants[activeTransition]}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="absolute inset-0 flex h-full w-full items-center justify-center bg-black"
          >
            {currentMedia.media_type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={currentMedia.title}
                className="h-full w-full object-contain"
                onError={() => advanceSlide()}
              />
            ) : (
              <video
                ref={videoRef}
                src={currentMedia.url}
                autoPlay
                muted
                playsInline
                onEnded={() => advanceSlide()}
                onError={() => advanceSlide()}
                className="h-full w-full object-contain"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barra de Progresso */}
      <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
        {!isPaused && (
          <motion.div
            key={`bar-${currentMedia?.id}-${currentIndex}`}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{
              duration: currentMedia?.media_type === 'image' ? Math.max(currentMedia.duration || 10, 3) : 10,
              ease: 'linear',
            }}
            className="h-full bg-cyan-400"
          />
        )}
      </div>
    </div>
  );
}