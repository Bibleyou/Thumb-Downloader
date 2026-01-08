
import React, { useState, useEffect } from 'react';
import { Search, Download, History, Trash2, Youtube, PlayCircle, Loader2, AlertCircle, Copy, CheckCircle2, History as HistoryIcon, Trash2 as TrashIcon, ExternalLink } from 'lucide-react';
import { extractYouTubeId, detectPlatform } from './utils/extractors';
import { Platform, VideoMetadata, DownloadHistoryItem } from './types';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoMetadata | null>(null);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);

  useEffect(() => {
    // Verifica se a API KEY está disponível (Vite define process.env via config)
    const apiKey = process.env.API_KEY;
    if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
      setIsApiReady(true);
    }
    
    const savedHistory = localStorage.getItem('thumb_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('thumb_history', JSON.stringify(history));
  }, [history]);

  const addToHistory = (metadata: VideoMetadata) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.metadata.originalUrl !== metadata.originalUrl);
      return [{ timestamp: Date.now(), metadata }, ...filtered].slice(0, 12);
    });
  };

  const handleClearHistory = () => {
    if (confirm("Deseja limpar seu histórico de buscas?")) {
      setHistory([]);
      localStorage.removeItem('thumb_history');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async (imgUrl: string, fileName: string) => {
    try {
      const response = await fetch(imgUrl);
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${fileName}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(imgUrl, '_blank');
    }
  };

  const processUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanUrl = url.trim();
    if (!cleanUrl) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const platform = detectPlatform(cleanUrl);

    try {
      if (platform === Platform.YOUTUBE) {
        const id = extractYouTubeId(cleanUrl);
        if (!id) throw new Error("Link do YouTube não reconhecido.");
        
        const meta: VideoMetadata = {
          id,
          title: "Vídeo do YouTube",
          platform: Platform.YOUTUBE,
          originalUrl: cleanUrl,
          thumbnails: [
            { url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, label: 'Qualidade Máxima (HD)' },
            { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, label: 'Alta Qualidade' },
            { url: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, label: 'Qualidade Média' },
          ]
        };
        setResult(meta);
        addToHistory(meta);
      } else if (platform === Platform.RUMBLE) {
        if (!isApiReady) {
          throw new Error("API_KEY do Gemini não configurada na Vercel. Necessário para Rumble.");
        }
        const gemini = new GeminiService();
        const meta = await gemini.fetchRumbleMetadata(cleanUrl);
        setResult(meta);
        addToHistory(meta);
      } else {
        throw new Error("Por favor, insira um link válido do YouTube ou Rumble.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 min-h-screen">
      <div className="flex justify-center mb-8">
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.15em] border backdrop-blur-md transition-all ${
          isApiReady ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
        }`}>
          <div className={`w-2 h-2 rounded-full animate-pulse ${isApiReady ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]' : 'bg-amber-500'}`} />
          {isApiReady ? 'Gemini AI Ativo' : 'Somente YouTube (Sem API Key)'}
        </div>
      </div>

      <header className="text-center mb-12">
        <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter italic">
          <span className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            THUMB
          </span>
          <span className="text-emerald-500">PRO</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          Extraia miniaturas de qualquer vídeo em segundos.
        </p>
      </header>

      <div className="relative max-w-3xl mx-auto mb-20 group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[28px] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative glass-morphism p-2 rounded-[26px] shadow-2xl">
          <form onSubmit={processUrl} className="flex items-center gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Link do vídeo aqui..."
                className="w-full bg-transparent border-none rounded-2xl py-5 pl-14 pr-4 focus:ring-0 text-xl placeholder:text-slate-600 font-medium text-white"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={24} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-16 px-10 rounded-2xl bg-white text-black font-black text-lg hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'EXTRAIR'}
            </button>
          </form>
        </div>
        
        {error && (
          <div className="absolute -bottom-16 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 text-red-400 bg-red-400/5 px-5 py-2.5 rounded-2xl border border-red-400/20 text-sm font-semibold backdrop-blur-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          </div>
        )}
      </div>

      {result && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-24 animate-in fade-in duration-700">
          <div className="lg:col-span-8 group">
            <div className="relative rounded-[32px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
              <img
                src={result.thumbnails[0].url}
                className="w-full aspect-video object-cover"
                alt="Thumbnail"
                onError={(e) => {
                   const target = e.target as HTMLImageElement;
                   if (result.platform === Platform.YOUTUBE && !target.src.includes('hqdefault')) {
                     target.src = result.thumbnails[1].url;
                   }
                }}
              />
              <div className="absolute top-6 left-6">
                <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl backdrop-blur-xl border border-white/10 ${
                  result.platform === Platform.YOUTUBE ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {result.platform === Platform.YOUTUBE ? <Youtube size={18} /> : <PlayCircle size={18} />}
                  <span className="font-black text-xs uppercase">{result.platform}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-morphism p-8 rounded-[32px] flex flex-col justify-between h-full">
               <div>
                  <h2 className="text-2xl font-black text-white mb-8 leading-tight line-clamp-2">{result.title}</h2>
                  <div className="space-y-4">
                    {result.thumbnails.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => handleDownload(t.url, `thumb-${result.id}-${i}`)}
                        className="w-full group bg-white/5 hover:bg-white/10 border border-white/5 p-5 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="text-left">
                          <p className="text-sm font-black text-slate-100">{t.label}</p>
                        </div>
                        <Download size={20} className="text-emerald-400" />
                      </button>
                    ))}
                  </div>
               </div>
               
               <div className="mt-10 flex gap-3">
                 <button 
                  onClick={() => handleCopy(result.originalUrl)}
                  className="flex-1 py-4 rounded-2xl border border-white/10 text-slate-400 font-bold hover:text-white flex items-center justify-center gap-2 text-xs uppercase"
                 >
                  {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                  {copied ? 'Copiado' : 'Link'}
                 </button>
                 <a 
                  href={result.originalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-14 h-14 rounded-2xl border border-white/10 flex items-center justify-center text-slate-400 hover:text-white"
                 >
                   <ExternalLink size={20} />
                 </a>
               </div>
            </div>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4 text-white">
              <HistoryIcon size={24} className="text-emerald-400" />
              <h3 className="text-3xl font-black italic uppercase">Recentes</h3>
            </div>
            <button onClick={handleClearHistory} className="text-slate-600 hover:text-red-500 font-bold text-xs uppercase flex items-center gap-2">
              <TrashIcon size={16} /> Limpar
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {history.map((h, i) => (
              <div key={i} onClick={() => setUrl(h.metadata.originalUrl)} className="cursor-pointer group">
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group-hover:border-emerald-500/50 transition-all">
                  <img src={h.metadata.thumbnails[0].url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100" alt="History" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default App;
