import { MetadataRoute } from 'next';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OferTV Admin & Player',
    short_name: 'OferTV',
    description: 'Sistema de Digital Signage e Ofertas',
    start_url: '/admin',
    display: 'standalone',
    background_color: '#020617', // slate-950
    theme_color: '#06b6d4', // cyan-500
    icons: [
      {
        src: '/icone.jpg',
        sizes: '192x192',
        type: 'image/jpeg',
      },
      {
        src: '/icone.jpg',
        sizes: '512x512',
        type: 'image/jpeg',
      },
    ],
  };
}
