
import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Youtube, PlayCircle, Loader2, AlertCircle, 
  Copy, CheckCircle2, History as HistoryIcon, Trash2 as TrashIcon, 
  X, Shield, ChevronDown, Globe
} from 'lucide-react';
import { extractYouTubeId, detectPlatform } from './utils/extractors';
import { Platform, VideoMetadata, DownloadHistoryItem } from './types';
import { GeminiService } from './services/geminiService';

type Language = 'en' | 'pt';

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<VideoMetadata | null>(null);
  const [history, setHistory] = useState<DownloadHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);
  const [isApiReady, setIsApiReady] = useState(false);
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms'>('home');
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = {
    en: {
      hero_title: "High-quality thumbnail extraction for global creators.",
      placeholder: "Paste YouTube or Rumble link...",
      btn_extract: "EXTRACT",
      status_ai_on: "AI READY",
      status_ai_off: "LEGACY MODE",
      history_title: "RECENT",
      btn_clear: "Clear",
      copy_link: "Copy URL",
      copied: "Copied!",
      nav_home: "Home",
      nav_privacy: "Privacy",
      nav_terms: "Terms",
      faq_title: "FAQ",
      q1: "Is it free?",
      a1: "Yes, 100% free with no registration required.",
      q2: "Legal usage?",
      a2: "Thumbnails belong to creators. Use for reference or with permission.",
      cookie_text: "We use cookies to improve your experience. See our ",
      cookie_btn: "Got it",
      error_invalid: "Invalid video link.",
      error_no_api: "AI service currently unavailable.",
      quality_max: "Max Quality (HD)",
      quality_high: "High Quality",
      quality_med: "Medium Quality",
      quality_orig: "Original Size"
    },
    pt: {
      hero_title: "Extração de miniaturas em alta qualidade para criadores globais.",
      placeholder: "Cole o link do YouTube ou Rumble...",
      btn_extract: "EXTRAIR",
      status_ai_on: "IA ATIVA",
      status_ai_off: "MODO LEGADO",
      history_title: "RECENTES",
      btn_clear: "Limpar",
      copy_link: "Copiar Link",
      copied: "Copiado!",
      nav_home: "Início",
      nav_privacy: "Privacidade",
      nav_terms: "Termos",
      faq_title: "Dúvidas",
      q1: "É grátis?",
      a1: "Sim, 100% gratuito e sem necessidade de cadastro.",
      q2: "Uso legal?",
      a2: "As capas pertencem aos criadores. Use para referência ou com permissão.",
      cookie_text: "Usamos cookies para melhorar sua experiência. Leia nossa ",
      cookie_btn: "Aceitar",
      error_invalid: "Link inválido.",
      error_no_api: "Serviço de IA indisponível no momento.",
      quality_max: "Qualidade Máxima (HD)",
      quality_high: "Alta Qualidade",
      quality_med: "Qualidade Média",
      quality_orig: "Tamanho Original"
    }
  };

  const currentT = t[lang];

  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
      if (apiKey && apiKey !== 'undefined') setIsApiReady(true);
    };

    checkApiKey();
    
    const savedHistory = localStorage.getItem('thumb_history');
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) {}
    }

    if (!localStorage.getItem('cookie_consent')) setShowCookieBanner(true);

    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang) setLang(savedLang);
    else if (navigator.language.startsWith('pt')) setLang('pt');
  }, []);

  useEffect(() => {
    localStorage.setItem('thumb_history', JSON.stringify(history));
  }, [history]);

  const changeLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('app_lang', l);
    setShowLangMenu(false);
  };

  const processUrl = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentView('home');

    const platform = detectPlatform(url);

    try {
      if (platform === Platform.YOUTUBE) {
        const id = extractYouTubeId(url);
        if (!id) throw new Error(currentT.error_invalid);
        
        const meta: VideoMetadata = {
          id,
          title: "YouTube Video",
          platform: Platform.YOUTUBE,
          originalUrl: url,
          thumbnails: [
            { url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, label: currentT.quality_max },
            { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, label: currentT.quality_high },
            { url: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, label: currentT.quality_med },
          ]
        };
        setResult(meta);
        setHistory(prev => [ { timestamp: Date.now(), metadata: meta }, ...prev.filter(h => h.metadata.id !== meta.id) ].slice(0, 10));
      } else if (platform === Platform.RUMBLE) {
        if (!isApiReady) throw new Error(currentT.error_no_api);
        const gemini = new GeminiService();
        const meta = await gemini.fetchRumbleMetadata(url);
        setResult(meta);
        setHistory(prev => [ { timestamp: Date.now(), metadata: meta }, ...prev.filter(h => h.metadata.originalUrl !== meta.originalUrl) ].slice(0, 10));
      } else {
        throw new Error(currentT.error_invalid);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-20 flex items-center justify-between px-6">
        <div onClick={() => setCurrentView('home')} className="cursor-pointer font-black italic text-2xl tracking-tighter flex items-center gap-2">
          THUMB<span className="text-emerald-500">PRO</span>
        </div>
        
        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => setCurrentView('home')} className={`text-[10px] font-black uppercase tracking-widest ${currentView === 'home' ? 'text-emerald-400' : 'text-slate-400'}`}>{currentT.nav_home}</button>
          <button onClick={() => setCurrentView('privacy')} className={`text-[10px] font-black uppercase tracking-widest ${currentView === 'privacy' ? 'text-emerald-400' : 'text-slate-400'}`}>{currentT.nav_privacy}</button>
          
          <div className="relative">
            <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-300">
              <Globe size={12} className="text-emerald-400" />
              {lang.toUpperCase()}
              <ChevronDown size={12} />
            </button>
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-2 w-32 glass-morphism rounded-xl overflow-hidden shadow-2xl">
                <button onClick={() => changeLang('en')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase hover:bg-emerald-500/10 text-slate-300">English</button>
                <button onClick={() => changeLang('pt')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase hover:bg-emerald-500/10 text-slate-300">Português</button>
              </div>
            )}
          </div>
        </div>

        <div className={`text-[9px] font-black px-3 py-1 rounded-full border ${isApiReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
          {isApiReady ? currentT.status_ai_on : currentT.status_ai_off}
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto px-4 pt-32 pb-20 w-full">
        {currentView === 'home' && (
          <>
            <div className="text-center mb-16">
              <h1 className="text-5xl md:text-7xl font-black mb-6 italic tracking-tighter text-white">
                {lang === 'en' ? 'WORLDWIDE' : 'GLOBAL'} <span className="text-emerald-500">ACCESS</span>
              </h1>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">{currentT.hero_title}</p>
            </div>

            <form onSubmit={processUrl} className="max-w-3xl mx-auto mb-20 relative group">
              <div className="absolute -inset-1 bg-emerald-500 rounded-[24px] blur opacity-10 group-focus-within:opacity-30 transition-opacity"></div>
              <div className="relative glass-morphism p-2 rounded-[22px] flex gap-2">
                <div className="flex-1 flex items-center px-4">
                  <Search size={20} className="text-slate-500 mr-3" />
                  <input 
                    value={url} 
                    onChange={e => setUrl(e.target.value)}
                    placeholder={currentT.placeholder}
                    className="w-full bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-600 font-medium py-4"
                  />
                </div>
                <button 
                  disabled={loading}
                  className="bg-white text-black font-black px-8 py-4 rounded-2xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : currentT.btn_extract}
                </button>
              </div>
              {error && <p className="absolute -bottom-8 left-6 text-red-400 text-xs font-bold">{error}</p>}
            </form>

            {result && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="lg:col-span-8 overflow-hidden rounded-[28px] border border-white/5 bg-slate-900 shadow-2xl">
                  <img src={result.thumbnails[0].url} className="w-full aspect-video object-cover" alt="Result" />
                </div>
                <div className="lg:col-span-4 flex flex-col gap-4">
                  <div className="glass-morphism p-6 rounded-[28px] h-full flex flex-col justify-between">
                    <div>
                      <h2 className="text-white font-black text-xl mb-6 line-clamp-2 italic uppercase">{result.title}</h2>
                      <div className="space-y-3">
                        {result.thumbnails.map((t, i) => (
                          <button 
                            key={i} 
                            onClick={() => window.open(t.url, '_blank')}
                            className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/5"
                          >
                            <span className="text-[10px] font-black uppercase text-slate-300">{t.label}</span>
                            <Download size={16} className="text-emerald-400" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(result.originalUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-slate-500 hover:text-white transition-colors"
                    >
                      {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      {copied ? currentT.copied : currentT.copy_link}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {history.length > 0 && (
              <div className="mt-24">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-white font-black italic uppercase tracking-tighter text-2xl flex items-center gap-2">
                    <HistoryIcon size={20} className="text-emerald-400" /> {currentT.history_title}
                  </h3>
                  <button onClick={() => setHistory([])} className="text-slate-600 hover:text-red-400 text-[10px] font-black uppercase flex items-center gap-2 transition-colors">
                    <TrashIcon size={14} /> {currentT.btn_clear}
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {history.map((h, i) => (
                    <div key={i} onClick={() => setUrl(h.metadata.originalUrl)} className="cursor-pointer group">
                      <div className="aspect-video rounded-xl overflow-hidden bg-slate-900 border border-white/5 group-hover:border-emerald-500/50 transition-all">
                        <img src={h.metadata.thumbnails[0].url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {currentView === 'privacy' && (
          <div className="max-w-2xl mx-auto py-10 space-y-6 text-slate-400 leading-relaxed">
            <h2 className="text-4xl font-black text-white italic uppercase mb-10">Privacy Policy</h2>
            <p>Your data privacy is important to us. ThumbPro does not collect personal information on our servers. All search history is stored locally in your browser's local storage.</p>
            <p>We use third-party tools (like Gemini API) to extract data from public video links you provide. By using the tool, you agree to the processing of these public URLs.</p>
            <button onClick={() => setCurrentView('home')} className="text-emerald-400 font-bold uppercase text-xs mt-10">Back to home</button>
          </div>
        )}
      </main>

      <footer className="py-12 border-t border-white/5 bg-[#020617] px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
            © 2024 THUMBPRO WORLDWIDE
          </div>
          <div className="flex gap-8 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <button onClick={() => setCurrentView('privacy')} className="hover:text-emerald-400">Privacy</button>
            <button onClick={() => setCurrentView('home')} className="hover:text-emerald-400">Support</button>
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <div className="fixed bottom-6 left-6 right-6 z-[100] animate-in slide-in-from-bottom-full duration-700">
          <div className="max-w-3xl mx-auto glass-morphism p-6 rounded-[24px] border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-300 text-sm font-medium">
              {currentT.cookie_text} <button onClick={() => setCurrentView('privacy')} className="text-emerald-400 font-bold underline">{currentT.nav_privacy}</button>.
            </p>
            <button onClick={() => { localStorage.setItem('cookie_consent', 'true'); setShowCookieBanner(false); }} className="bg-emerald-500 text-black font-black px-8 py-3 rounded-xl text-xs uppercase hover:bg-emerald-400 transition-colors">
              {currentT.cookie_btn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
