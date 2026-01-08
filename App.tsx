import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Youtube, PlayCircle, Loader2, AlertCircle, 
  Copy, CheckCircle2, History as HistoryIcon, Trash2 as TrashIcon, 
  ExternalLink, X, Shield, Languages, ChevronDown, Globe
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
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'about' | 'contact'>('home');
  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const t = {
    en: {
      hero_title: "The fastest thumbnail extractor for content creators.",
      placeholder: "Paste video link here...",
      btn_extract: "EXTRACT",
      btn_downloading: "DOWNLOADING",
      status_ai_on: "AI ACTIVE",
      status_ai_off: "YOUTUBE ONLY",
      history_title: "RECENT",
      btn_clear: "Clear All",
      copy_link: "Copy Link",
      copied: "Copied",
      nav_home: "Home",
      nav_about: "About",
      nav_privacy: "Privacy",
      nav_terms: "Terms",
      nav_contact: "Contact",
      faq_title: "Frequently Asked Questions",
      q1: "Is ThumbPro free?",
      a1: "Yes, our tool is 100% free for everyone. No registration required for YouTube downloads.",
      q2: "Is it legal to download thumbnails?",
      a2: "Thumbnails are the intellectual property of creators. Use this tool for reference or with the owner's permission.",
      q3: "Which platforms are supported?",
      a3: "We currently support YouTube and Rumble with AI-powered extraction.",
      seo_h1: "How to download HD thumbnails?",
      seo_p1: "ThumbPro simplifies the workflow for designers and YouTubers. Just copy the video link and paste it here. We process it instantly.",
      seo_h2: "Rumble AI Extraction",
      seo_p2: "We use Google's Gemini AI to find high-quality Rumble covers where others fail.",
      cookie_text: "We use cookies to improve your experience. By continuing, you agree to our ",
      cookie_btn: "Accept Cookies",
      footer_desc: "Download high-quality thumbnails from YouTube and Rumble. Essential for editors and designers.",
      error_invalid: "Please enter a valid YouTube or Rumble link.",
      error_no_api: "Gemini API_KEY not detected. AI features disabled.",
      quality_max: "Max Resolution (HD)",
      quality_high: "High Quality",
      quality_med: "Medium Quality",
      quality_orig: "Original Resolution"
    },
    pt: {
      hero_title: "O extrator de miniaturas mais rápido para criadores de conteúdo.",
      placeholder: "Cole o link do vídeo aqui...",
      btn_extract: "EXTRAIR",
      btn_downloading: "BAIXANDO",
      status_ai_on: "IA ATIVA",
      status_ai_off: "SÓ YOUTUBE",
      history_title: "RECENTES",
      btn_clear: "Limpar Tudo",
      copy_link: "Copiar Link",
      copied: "Copiado",
      nav_home: "Início",
      nav_about: "Sobre",
      nav_privacy: "Privacidade",
      nav_terms: "Termos",
      nav_contact: "Contato",
      faq_title: "Perguntas Frequentes",
      q1: "O ThumbPro é gratuito?",
      a1: "Sim, nossa ferramenta é 100% gratuita para todos. Sem registro para YouTube.",
      q2: "É legal baixar miniaturas?",
      a2: "As miniaturas são propriedade intelectual dos criadores. Use para referência ou com permissão.",
      q3: "Quais plataformas são suportadas?",
      a3: "Atualmente suportamos YouTube e Rumble com extração via IA.",
      seo_h1: "Como baixar miniaturas em HD?",
      seo_p1: "O ThumbPro simplifica o trabalho de designers e YouTubers. Copie o link e cole aqui. Processamos na hora.",
      seo_h2: "Extração Rumble via IA",
      seo_p2: "Usamos a IA Gemini do Google para encontrar capas de alta qualidade no Rumble.",
      cookie_text: "Usamos cookies para melhorar sua experiência. Ao continuar, você aceita nossa ",
      cookie_btn: "Aceitar Cookies",
      footer_desc: "Baixe miniaturas de alta qualidade do YouTube e Rumble. Essencial para editores e designers.",
      error_invalid: "Por favor, insira um link válido do YouTube ou Rumble.",
      error_no_api: "API_KEY do Gemini não detectada. Funções de IA desativadas.",
      quality_max: "Qualidade Máxima (HD)",
      quality_high: "Alta Qualidade",
      quality_med: "Qualidade Média",
      quality_orig: "Resolução Original"
    }
  };

  const currentT = t[lang];

  useEffect(() => {
    const checkApiKey = () => {
      try {
        const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
        if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
          setIsApiReady(true);
        }
      } catch (e) {
        console.warn("API Environment not ready.");
      }
    };

    checkApiKey();
    
    const savedHistory = localStorage.getItem('thumb_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history");
      }
    }

    const consent = localStorage.getItem('cookie_consent');
    if (!consent) setShowCookieBanner(true);

    const savedLang = localStorage.getItem('app_lang') as Language;
    if (savedLang && (savedLang === 'en' || savedLang === 'pt')) {
      setLang(savedLang);
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'pt') setLang('pt');
    }
  }, []);

  const changeLang = (l: Language) => {
    setLang(l);
    localStorage.setItem('app_lang', l);
    setShowLangMenu(false);
  };

  useEffect(() => {
    localStorage.setItem('thumb_history', JSON.stringify(history));
  }, [history]);

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowCookieBanner(false);
  };

  const addToHistory = (metadata: VideoMetadata) => {
    setHistory(prev => {
      const filtered = prev.filter(item => item.metadata.originalUrl !== metadata.originalUrl);
      return [{ timestamp: Date.now(), metadata }, ...filtered].slice(0, 12);
    });
  };

  const handleClearHistory = () => {
    if (confirm(lang === 'pt' ? "Deseja limpar o histórico?" : "Clear history?")) {
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
    setCurrentView('home');

    const platform = detectPlatform(cleanUrl);

    try {
      if (platform === Platform.YOUTUBE) {
        const id = extractYouTubeId(cleanUrl);
        if (!id) throw new Error(currentT.error_invalid);
        
        const meta: VideoMetadata = {
          id,
          title: "YouTube Video",
          platform: Platform.YOUTUBE,
          originalUrl: cleanUrl,
          thumbnails: [
            { url: `https://img.youtube.com/vi/${id}/maxresdefault.jpg`, label: currentT.quality_max },
            { url: `https://img.youtube.com/vi/${id}/hqdefault.jpg`, label: currentT.quality_high },
            { url: `https://img.youtube.com/vi/${id}/mqdefault.jpg`, label: currentT.quality_med },
          ]
        };
        setResult(meta);
        addToHistory(meta);
      } else if (platform === Platform.RUMBLE) {
        if (!isApiReady) {
          throw new Error(currentT.error_no_api);
        }
        const gemini = new GeminiService();
        const meta = await gemini.fetchRumbleMetadata(cleanUrl);
        // Translate labels for Rumble
        meta.thumbnails = meta.thumbnails.map(t => ({...t, label: currentT.quality_orig}));
        setResult(meta);
        addToHistory(meta);
      } else {
        throw new Error(currentT.error_invalid);
      }
    } catch (err: any) {
      setError(err.message || "Error processing link.");
    } finally {
      setLoading(false);
    }
  };

  const renderHome = () => (
    <>
      <header className="text-center mb-12">
        <h1 className="text-6xl md:text-7xl font-black mb-6 tracking-tighter italic">
          <span className="bg-gradient-to-br from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
            THUMB
          </span>
          <span className="text-emerald-500">PRO</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          {currentT.hero_title}
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
                placeholder={currentT.placeholder}
                className="w-full bg-transparent border-none rounded-2xl py-5 pl-14 pr-4 focus:ring-0 text-xl placeholder:text-slate-600 font-medium text-white"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={24} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-16 px-10 rounded-2xl bg-white text-black font-black text-lg hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : currentT.btn_extract}
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
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-24 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
                  {copied ? currentT.copied : currentT.copy_link}
                 </button>
               </div>
            </div>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="mt-20 mb-20">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4 text-white">
              <HistoryIcon size={24} className="text-emerald-400" />
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">{currentT.history_title}</h3>
            </div>
            <button onClick={handleClearHistory} className="text-slate-600 hover:text-red-500 font-bold text-xs uppercase flex items-center gap-2 transition-colors">
              <TrashIcon size={16} /> {currentT.btn_clear}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {history.map((h, i) => (
              <div key={i} onClick={() => {setUrl(h.metadata.originalUrl); window.scrollTo({top: 0, behavior: 'smooth'})}} className="cursor-pointer group">
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group-hover:border-emerald-500/50 transition-all shadow-lg group-hover:shadow-emerald-500/10">
                  <img src={h.metadata.thumbnails[0].url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="Recent Thumb" />
                </div>
                <p className="mt-2 text-[10px] text-slate-500 font-bold truncate group-hover:text-slate-300 transition-colors">{h.metadata.title}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-32 pt-20 border-t border-white/5 space-y-24 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-white leading-tight">{currentT.seo_h1}</h2>
            <p className="text-slate-400 leading-relaxed">{currentT.seo_p1}</p>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-white leading-tight">{currentT.seo_h2}</h2>
            <p className="text-slate-400 leading-relaxed">{currentT.seo_p2}</p>
          </div>
        </div>

        <div className="glass-morphism p-12 rounded-[40px] space-y-10">
          <h2 className="text-3xl font-black text-white text-center">{currentT.faq_title}</h2>
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-bold text-lg">{currentT.q1}</h3>
              <p className="text-slate-400">{currentT.a1}</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-bold text-lg">{currentT.q2}</h3>
              <p className="text-slate-400">{currentT.a2}</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-bold text-lg">{currentT.q3}</h3>
              <p className="text-slate-400">{currentT.a3}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div onClick={() => setCurrentView('home')} className="cursor-pointer font-black italic text-2xl tracking-tighter group flex items-center gap-2">
            THUMB<span className="text-emerald-500 group-hover:text-emerald-400 transition-colors">PRO</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => setCurrentView('home')} className={`text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ${currentView === 'home' ? 'text-emerald-400' : 'text-slate-400'}`}>{currentT.nav_home}</button>
            <button onClick={() => setCurrentView('privacy')} className={`text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ${currentView === 'privacy' ? 'text-emerald-400' : 'text-slate-400'}`}>{currentT.nav_privacy}</button>
            <button onClick={() => setCurrentView('terms')} className={`text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ${currentView === 'terms' ? 'text-emerald-400' : 'text-slate-400'}`}>{currentT.nav_terms}</button>
            
            <div className="relative">
              <button 
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs font-black text-slate-300 hover:bg-white/10 transition-all uppercase tracking-widest"
              >
                <Globe size={14} className="text-emerald-400" />
                {lang}
                <ChevronDown size={14} />
              </button>
              
              {showLangMenu && (
                <div className="absolute top-full right-0 mt-2 w-32 glass-morphism border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                  <button onClick={() => changeLang('en')} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors ${lang === 'en' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'}`}>English</button>
                  <button onClick={() => changeLang('pt')} className={`w-full text-left px-5 py-4 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors ${lang === 'pt' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'}`}>Português</button>
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${
            isApiReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isApiReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isApiReady ? currentT.status_ai_on : currentT.status_ai_off}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto px-4 pt-32 pb-20 w-full">
        {currentView === 'home' && renderHome()}
        {currentView === 'privacy' && (
           <div className="max-w-3xl mx-auto py-20 animate-in fade-in duration-500">
            <h2 className="text-5xl font-black text-white mb-10 italic uppercase">{currentT.nav_privacy}</h2>
            <p className="text-slate-400 leading-loose">Privacy Policy content for {lang === 'en' ? 'global' : 'local'} audience. Data is stored locally in your browser.</p>
            <button onClick={() => setCurrentView('home')} className="mt-12 text-emerald-400 font-black uppercase text-sm">Return Home</button>
          </div>
        )}
        {currentView === 'terms' && (
           <div className="max-w-3xl mx-auto py-20 animate-in fade-in duration-500">
            <h2 className="text-5xl font-black text-white mb-10 italic uppercase">{currentT.nav_terms}</h2>
            <p className="text-slate-400 leading-loose">Terms of service for ThumbPro. Personal and non-commercial use only.</p>
            <button onClick={() => setCurrentView('home')} className="mt-12 text-emerald-400 font-black uppercase text-sm">Return Home</button>
          </div>
        )}
      </main>

      <footer className="border-t border-white/5 bg-[#020617] py-20 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="font-black italic text-3xl tracking-tighter">
                THUMB<span className="text-emerald-500">PRO</span>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed">{currentT.footer_desc}</p>
            </div>
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-widest">Legal</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><button onClick={() => setCurrentView('privacy')} className="hover:text-emerald-400 transition-colors">{currentT.nav_privacy}</button></li>
                <li><button onClick={() => setCurrentView('terms')} className="hover:text-emerald-400 transition-colors">{currentT.nav_terms}</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-widest">Links</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><button onClick={() => setCurrentView('home')} className="hover:text-emerald-400 transition-colors">{currentT.nav_home}</button></li>
                <li><button onClick={() => setCurrentView('about')} className="hover:text-emerald-400 transition-colors">{currentT.nav_about}</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            <p>© 2024 ThumbPro - Worldwide Edition</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> GLOBAL SERVER</span>
            </div>
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-full duration-700">
          <div className="max-w-4xl mx-auto glass-morphism border border-emerald-500/20 p-6 md:p-8 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Shield size={24} />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                {currentT.cookie_text} <button onClick={() => setCurrentView('privacy')} className="text-emerald-400 font-bold underline">{currentT.nav_privacy}</button>.
              </p>
            </div>
            <button 
              onClick={acceptCookies}
              className="px-10 py-4 bg-emerald-500 text-black font-black uppercase text-xs rounded-2xl hover:bg-emerald-400 transition-colors whitespace-nowrap shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
            >
              {currentT.cookie_btn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;