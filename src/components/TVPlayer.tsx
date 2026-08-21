'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';

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
  const videoRef = useRef<HTMLVideoElement>(null);

  const fetchMedia = async () => {
    // Busca mídias da apresentação ativa principal (usaremos um limit para simplificar)
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      console.error('Erro ao buscar mídias:', error);
      return;
    }

    if (data) {
      setMediaList(data as MediaItem[]);
    }
  };

  useEffect(() => {
    fetchMedia();

    // Inscreve-se no realtime
    const channel = supabase
      .channel('public:media')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'media' },
        () => {
          fetchMedia();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (mediaList.length === 0) return;

    // Se o index atual for maior que a lista (ex: removeram o ultimo item), reseta para 0
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
        // Fallback se não conseguir dar play
        timer = setTimeout(nextSlide, 5000);
      });
    }

    return () => clearTimeout(timer);
  }, [currentIndex, mediaList]);

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % mediaList.length);
  };

  if (mediaList.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black text-slate-500 text-3xl font-light overflow-hidden">
        Aguardando ofertas...
      </div>
    );
  }

  const currentMedia = mediaList[currentIndex];

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden select-none">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentMedia.id}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0 flex items-center justify-center"
        >
          {currentMedia.media_type === 'image' ? (
            <img
              src={currentMedia.url}
              alt="Oferta"
              className="w-full h-full object-contain"
            />
          ) : (
            <video
              ref={videoRef}
              src={currentMedia.url}
              className="w-full h-full object-contain"
              muted
              onEnded={nextSlide}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
