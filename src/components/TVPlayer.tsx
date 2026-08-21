'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { Maximize, Minimize, RotateCw } from 'lucide-react';

type MediaItem = {
  id: string;
  media_type: 'image' | 'video';
  url: string;
  duration: number;
  order_index: number;
};

export default function TVPlayer() {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const wakeLockRef = useRef<any>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('order_index', { ascending: true });

    if (!error && data) setMediaList(data as MediaItem[]);
  };

  useEffect(() => {
    fetchMedia();

    const channel = supabase
      .channel('public:media')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'media' }, () => {
        fetchMedia();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Timer & Playback logic
  useEffect(() => {
    if (mediaList.length === 0) return;

    if (currentIndex >= mediaList.length) {
      setCurrentIndex(0);
      return;
    }

    const currentMedia = mediaList[currentIndex];
    let timer: NodeJS.Timeout;

    if (currentMedia.media_type === 'image') {
      timer = setTimeout(() => {
        nextSlide();
      }, (currentMedia.duration || 10) * 1000);
    } else if (currentMedia.media_type === 'video' && videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.error("Autoplay bloqueado:", err);
        timer = setTimeout(nextSlide, 5000);
      });
    }

    return () => clearTimeout(timer);
  }, [currentIndex, mediaList]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaList.length);
  };

  // Screen Wake Lock API (Impede a TV de hibernar)
  useEffect(() => {
    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        }
      } catch (err) {
        console.error('Wake Lock error:', err);
      }
    };

    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') requestWakeLock();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) wakeLockRef.current.release();
    };
  }, []);

  // Fullscreen listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Autohide Controls
  const handleInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  useEffect(() => {
    handleInteraction();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.error(err));
    } else {
      document.exitFullscreen();
    }
  };

  const rotatePlayer = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  if (mediaList.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-slate-500 text-3xl font-light overflow-hidden">
        Aguardando ofertas...
      </div>
    );
  }

  const currentMedia = mediaList[currentIndex];
  const isPortrait = rotation === 90 || rotation === 270;

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black overflow-hidden select-none"
      onMouseMove={handleInteraction}
      onClick={handleInteraction}
    >
      {/* Container Principal que sofre a rotação Totem */}
      <div 
        className="relative flex items-center justify-center transition-transform duration-700 ease-in-out"
        style={{
          width: isPortrait ? '100vh' : '100vw',
          height: isPortrait ? '100vw' : '100vh',
          transform: `rotate(${rotation}deg)`
        }}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={currentMedia.id}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0 flex items-center justify-center w-full h-full"
          >
            {currentMedia.media_type === 'image' ? (
              <>
                {/* Background Blur: Dá aspecto premium e preenche proporções diferentes */}
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40 scale-110"
                  style={{ backgroundImage: `url(${currentMedia.url})` }}
                />
                <img
                  src={currentMedia.url}
                  alt="Oferta"
                  className="relative z-10 w-full h-full object-contain drop-shadow-2xl"
                />
              </>
            ) : (
              <video
                ref={videoRef}
                src={currentMedia.url}
                className="relative z-10 w-full h-full object-contain"
                muted
                onEnded={nextSlide}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controles Ocultáveis (Ficam sempre visíveis na orientação normal da tela real) */}
      <div 
        className={`fixed bottom-6 right-6 flex gap-4 transition-opacity duration-500 z-50 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      >
        <button 
          onClick={(e) => { e.stopPropagation(); rotatePlayer(); }}
          className="p-4 bg-slate-900/80 hover:bg-slate-800 backdrop-blur border border-slate-700 text-cyan-400 rounded-full shadow-2xl transition-all hover:scale-110"
          title="Rotacionar Painel (Totem)"
        >
          <RotateCw className="w-6 h-6" />
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
          className="p-4 bg-slate-900/80 hover:bg-slate-800 backdrop-blur border border-slate-700 text-cyan-400 rounded-full shadow-2xl transition-all hover:scale-110"
          title="Tela Cheia"
        >
          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
        </button>
      </div>
    </div>
  );
}
