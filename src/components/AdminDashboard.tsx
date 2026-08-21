'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Trash2, GripVertical, MonitorPlay, Plus, UploadCloud, Link as LinkIcon } from 'lucide-react';

type MediaItem = { 
  id: string; 
  url: string; 
  media_type: 'image' | 'video'; 
  duration: number;
  order_index: number;
};

export default function AdminDashboard() {
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [inputMode, setInputMode] = useState<'upload' | 'link'>('upload');
  
  const [type, setType] = useState<'image' | 'video'>('image');
  const [duration, setDuration] = useState(10);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('order_index', { ascending: true });
    
    if (data) setMediaItems(data as MediaItem[]);
  };

  const handleAddMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let finalUrl = url;

    if (inputMode === 'upload') {
      if (!file) {
        alert('Selecione um arquivo primeiro.');
        setLoading(false);
        return;
      }
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('ofertv-media')
        .upload(fileName, file);

      if (uploadError) {
        console.error(uploadError);
        alert('Erro ao fazer upload do arquivo. O bucket "ofertv-media" foi criado e é público?');
        setLoading(false);
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('ofertv-media')
        .getPublicUrl(fileName);
        
      finalUrl = publicUrlData.publicUrl;
    } else {
      if (!url) {
        setLoading(false);
        return;
      }
    }

    const nextOrderIndex = mediaItems.length > 0 
      ? Math.max(...mediaItems.map(m => m.order_index)) + 1 
      : 0;
    
    const newItem = {
      url: finalUrl,
      media_type: type,
      duration: type === 'image' ? duration : 0,
      order_index: nextOrderIndex,
    };
    
    const { error } = await supabase.from('media').insert([newItem]);
    
    if (!error) {
      setUrl('');
      setFile(null);
      // Reset the file input visually
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
      await fetchMedia();
    } else {
      console.error(error);
      alert('Erro ao adicionar mídia no banco de dados.');
    }
    setLoading(false);
  };

  const handleRemoveMedia = async (id: string, mediaUrl: string) => {
    if (!confirm('Deseja realmente remover esta mídia?')) return;
    
    // Deleta do banco de dados
    const { error } = await supabase.from('media').delete().eq('id', id);
    
    if (!error) {
      // Tenta deletar o arquivo do Storage se for um arquivo upado (contém ofertv-media na URL)
      if (mediaUrl.includes('ofertv-media')) {
        const urlParts = mediaUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        await supabase.storage.from('ofertv-media').remove([fileName]);
      }
      await fetchMedia();
    } else {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-8 font-sans selection:bg-cyan-500/30">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-6">
          <div className="flex items-center gap-3">
            <MonitorPlay className="w-8 h-8 text-cyan-400" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-600 bg-clip-text text-transparent">
              OferTV Admin
            </h1>
          </div>
          <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-900 rounded-full border border-slate-800">
             <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
            <span className="text-sm text-cyan-400 font-medium tracking-wider">REALTIME LIVE</span>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Painel de Adição (Glassmorphism) */}
          <section className="col-span-1 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl h-fit">
            <h2 className="text-xl font-semibold mb-6 text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-cyan-500" /> Nova Oferta
            </h2>
            <form onSubmit={handleAddMedia} className="space-y-5">
              
              {/* Tabs de Seleção: Upload vs Link */}
              <div className="flex bg-slate-950 rounded-lg p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    inputMode === 'upload' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <UploadCloud className="w-4 h-4" /> Upload
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('link')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${
                    inputMode === 'link' ? 'bg-slate-800 text-cyan-400 shadow' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <LinkIcon className="w-4 h-4" /> Link URL
                </button>
              </div>

              {inputMode === 'upload' ? (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Arquivo de Mídia</label>
                  <input
                    id="file-upload"
                    type="file"
                    accept="image/*,video/*"
                    onChange={(e) => {
                      const selected = e.target.files?.[0];
                      if (selected) {
                        setFile(selected);
                        setType(selected.type.startsWith('video') ? 'video' : 'image');
                      }
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-800 file:text-cyan-400 hover:file:bg-slate-700 cursor-pointer"
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">URL da Mídia</label>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://sua-imagem.com/oferta.jpg"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all placeholder:text-slate-700"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Tipo</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'image' | 'video')}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all"
                  >
                    <option value="image">Imagem</option>
                    <option value="video">Vídeo</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-400">Duração (s)</label>
                  <input
                    type="number"
                    disabled={type === 'video'}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    min={1}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-cyan-500 transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-transparent border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-slate-950 font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Adicionar à Fila'}
              </button>
            </form>
          </section>

          {/* Fila de Reprodução */}
          <section className="col-span-1 lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-6 text-white">Fila de Reprodução (Live)</h2>
            <div className="space-y-3">
              {mediaItems.map((item, index) => (
                <div
                  key={item.id}
                  className="group flex items-center justify-between bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <GripVertical className="w-5 h-5 text-slate-700 cursor-grab active:cursor-grabbing" />
                    <div className="text-slate-500 font-mono text-sm w-6">{index + 1}.</div>
                    <div className="w-20 h-14 bg-slate-900 rounded overflow-hidden relative border border-slate-800">
                      {item.media_type === 'image' ? (
                        <img src={item.url} alt="thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-slate-600 bg-slate-900">VIDEO</div>
                      )}
                    </div>
                    <div className="hidden sm:block">
                      <div className="text-sm text-slate-300 font-medium truncate max-w-[200px] xl:max-w-sm" title={item.url}>
                        {item.url.split('/').pop() || item.url}
                      </div>
                      <div className="text-xs text-cyan-500 mt-1 uppercase tracking-wider font-semibold">
                        {item.media_type} • {item.media_type === 'image' ? `${item.duration}s` : 'Automático'}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleRemoveMedia(item.id, item.url)}
                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              
              {mediaItems.length === 0 && (
                <div className="text-center py-16 text-slate-500 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center gap-3">
                  <MonitorPlay className="w-12 h-12 text-slate-700" />
                  <p>Nenhuma mídia na fila. Adicione ofertas ao lado para transmitir.</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
