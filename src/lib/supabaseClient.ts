import { createClient } from '@supabase/supabase-js';

export type MediaType = 'image' | 'video';
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'flip';

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