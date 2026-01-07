
import React, { useState, useEffect } from 'react';
import { Search, Download, History, Trash2, Youtube, PlayCircle, Loader2, AlertCircle, Copy, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
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
    // Check if API key is present for Rumble features
    if (process.env.API_KEY) {
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
      return [{ timestamp: Date.now(), metadata }, ...filtered].slice(0, 10);
    });
  };

  const handleClearHistory = () => {
    if (confirm("Deseja limpar todo o histórico?")) {
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
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const platform = detectPlatform(url);

    try {
      if (platform === Platform.YOUTUBE) {
        const id = extractYouTubeId(url);
        if (!id) throw new Error("URL do YouTube inválida.");
        
        const meta: VideoMetadata = {
          id,
          title: "Thumbnail do YouTube",
          platform: Platform.YOUTUBE,
          originalUrl: url,
          thumbnails: [
            { url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, label: 'Resolução Máxima' },
            { url: `https://img.youtube.com/vi/${id}/sddefault.jpg`, label: 'Resolução Standard' },
            { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, label: 'Alta Qualidade' },
          ]
        };
        setResult(meta);
        addToHistory(meta);
      } else if (platform === Platform.RUMBLE) {
        if (!isApiReady) {
          throw new Error("API Key não configurada. Rumble requer integração com Gemini.");
        }
        const gemini = new GeminiService();
        const meta = await gemini.fetchRumbleMetadata(url);
        setResult(meta);
        addToHistory(meta);
      } else {
        throw new Error("Plataforma não suportada. Use links do YouTube ou Rumble.");
      }
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao processar a URL.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20">
      {/* Badge Status */}
      <div className="flex justify-center mb-6">
        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
          isApiReady ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'
        }`}>
          {isApiReady ? <ShieldCheck size={12} /> : <Zap size={12} />}
          {isApiReady ? 'Gemini AI Conectado' : 'Modo YouTube Apenas'}
        </div>
      </div>

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-5xl md:text-6xl font-black mb-4 tracking-tight">
          <span className="bg-gradient-to-r from-red-500 via-orange-500 to-emerald-500 bg-clip-text text-transparent">
            ThumbPro
          </span>
        </h1>
        <p className="text-slate-400 text-lg font-medium max-w-md mx-auto">
          Baixe as melhores capas para seus vídeos com inteligência artificial.
        </p>
      </div>

      {/* Main Action Area */}
      <div className="glass-morphism p-2 rounded-[24px] mb-12 shadow-2xl relative">
        <form onSubmit={processUrl} className="flex items-center gap-2 p-1">
          <div className="relative flex-1 group">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="youtube.com/watch?v=..."
              className="w-full bg-transparent border-none rounded-xl py-4 pl-12 pr-4 focus:ring-0 text-lg placeholder:text-slate-600 transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors" size={22} />
          </div>
          <button
            type="submit"
            disabled={loading}
            className={`h-14 px-8 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
              loading ? 'bg-slate-800' : 'bg-white text-black hover:bg-emerald-400 active:scale-95'
            }`}
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Baixar'}
          </button>
        </form>
        {error && (
          <div className="absolute -bottom-14 left-0 right-0 flex justify-center">
            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 px-4 py-2 rounded-full border border-red-400/20 text-xs font-medium animate-in zoom-in duration-300">
              <AlertCircle size={14} />
              {error}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16 animate-in slide-in-from-bottom-8 duration-700 ease-out">
          <div className="lg:col-span-8">
            <div className="group relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl">
              <img
                src={result.thumbnails[0].url}
                className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-700"
                alt="Main"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-8">
                <span className="text-white font-bold text-xl">{result.title}</span>
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-4">
            <div className="bg-slate-900/50 p-6 rounded-3xl border border-white/5 flex flex-col justify-between h-full">
               <div>
                  <div className="flex items-center gap-2 mb-6">
                    {result.platform === Platform.YOUTUBE ? 
                      <Youtube className="text-red-500" size={24} /> : 
                      <PlayCircle className="text-emerald-500" size={24} />
                    }
                    <span className="font-bold text-slate-300">{result.platform}</span>
                  </div>
                  <div className="space-y-3">
                    {result.thumbnails.map((t, i) => (
                      <button
                        key={i}
                        onClick={() => handleDownload(t.url, `thumb-${result.id}-${i}`)}
                        className="w-full group bg-white/5 hover:bg-white/10 border border-white/5 p-4 rounded-2xl flex items-center justify-between transition-all"
                      >
                        <div className="text-left">
                          <p className="text-sm font-bold text-slate-200">{t.label}</p>
                          <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-0.5">JPG • HIGH RES</p>
                        </div>
                        <Download size={18} className="text-emerald-500 group-hover:translate-y-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
               </div>
               <button 
                onClick={() => handleCopy(result.originalUrl)}
                className="mt-6 w-full py-3 rounded-xl border border-white/10 text-slate-500 hover:text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2 text-sm"
               >
                {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? 'Link Copiado' : 'Copiar URL'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="mt-16 pt-16 border-t border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black text-slate-200 flex items-center gap-3">
              <History size={24} className="text-emerald-500" />
              Recentes
            </h3>
            <button
              onClick={handleClearHistory}
              className="p-2 text-slate-600 hover:text-red-500 transition-colors"
              title="Limpar histórico"
            >
              <Trash2 size={20} />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {history.map((h, i) => (
              <div
                key={i}
                onClick={() => { setUrl(h.metadata.originalUrl); window.scrollTo({top: 0, behavior: 'smooth'}); }}
                className="group cursor-pointer"
              >
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 mb-2 border border-white/5 group-hover:border-emerald-500/30 transition-all">
                  <img src={h.metadata.thumbnails[0].url} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-all" />
                </div>
                <p className="text-xs font-bold text-slate-500 truncate">{h.metadata.title}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <footer className="mt-32 text-center">
        <p className="text-slate-700 text-[10px] uppercase tracking-[0.2em] font-bold">
          Powered by Gemini 2.5 • Developed for Vercel
        </p>
      </footer>
    </div>
  );
};

export default App;
