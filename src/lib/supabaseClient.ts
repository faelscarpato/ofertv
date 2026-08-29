import { createClient } from '@supabase/supabase-js';

export type MediaType = 'image' | 'video';
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip';
export type AudioSourceType = 'youtube' | 'soundcloud' | 'direct';

export interface MediaItem {
  id: string;
  title: string;
  media_type: MediaType;
  url: string;
  duration: number;
  transition_type: TransitionType;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AudioItem {
  id: string;
  title: string;
  url: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ParsedAudio {
  type: AudioSourceType;
  embedUrl: string;
  rawUrl: string;
}

// Parser automático de links de áudio (YouTube, YouTube Music, SoundCloud, MP3)
export function parseAudioSource(url: string): ParsedAudio {
  const trimmed = (url || '').trim();

  // 1. YouTube e YouTube Music
  if (trimmed.includes('youtube.com') || trimmed.includes('youtu.be')) {
    let videoId = '';
    let playlistId = '';

    try {
      const urlObj = new URL(trimmed);
      if (trimmed.includes('youtu.be/')) {
        videoId = urlObj.pathname.replace('/', '').split('?')[0];
      } else if (urlObj.searchParams.has('v')) {
        videoId = urlObj.searchParams.get('v') || '';
      }
      if (urlObj.searchParams.has('list')) {
        playlistId = urlObj.searchParams.get('list') || '';
      }
    } catch {
      const vMatch = trimmed.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
      if (vMatch) videoId = vMatch[1];
    }

    let embedUrl = '';
    if (playlistId) {
      embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&autoplay=1&loop=1&enablejsapi=1`;
    } else if (videoId) {
      embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&enablejsapi=1&controls=0`;
    } else {
      embedUrl = trimmed;
    }

    return { type: 'youtube', embedUrl, rawUrl: trimmed };
  }

  // 2. SoundCloud
  if (trimmed.includes('soundcloud.com')) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      trimmed
    )}&auto_play=true&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;
    return { type: 'soundcloud', embedUrl, rawUrl: trimmed };
  }

  // 3. Áudio Direto / MP3 / Web Rádio
  return { type: 'direct', embedUrl: trimmed, rawUrl: trimmed };
}

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cskhkhgqlpdcpbvktqfl.supabase.co';

const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});