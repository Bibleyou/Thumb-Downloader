import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Youtube, PlayCircle, Loader2, AlertCircle, 
  Copy, CheckCircle2, History as HistoryIcon, Trash2 as TrashIcon, 
  Shield, Globe, ChevronDown, ExternalLink
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
      hero_title: "The fastest thumbnail extractor for global content creators.",
      placeholder: "Paste video link here (YouTube or Rumble)...",
      btn_extract: "EXTRACT",
      status_ai_on: "AI ACTIVE",
      status_ai_off: "YOUTUBE ONLY",
      history_title: "RECENT SEARCHES",
      btn_clear: "Clear All",
      copy_link: "Copy URL",
      copied: "Copied!",
      nav_home: "Home",
      nav_privacy: "Privacy",
      nav_terms: "Terms",
      faq_title: "Frequently Asked Questions",
      q1: "Is ThumbPro free?",
      a1: "Yes, our tool is 100% free for everyone. No registration required for YouTube downloads.",
      q2: "Is it legal to download thumbnails?",
      a2: "Thumbnails are intellectual property. Use for reference or with the owner's permission.",
      q3: "Which platforms are supported?",
      a3: "We support YouTube natively and Rumble via AI-powered extraction.",
      seo_h1: "High Definition Thumbnails",
      seo_p1: "ThumbPro simplifies the workflow for designers and YouTubers. Extract high-resolution covers instantly for any project.",
      seo_h2: "Rumble AI Extraction",
      seo_p2: "We use Google's Gemini AI to find high-quality Rumble covers where traditional scrapers fail.",
      cookie_text: "We use cookies to improve your experience. By continuing, you agree to our ",
      cookie_btn: "Accept",
      footer_desc: "Download high-quality thumbnails from YouTube and Rumble. Essential for editors and designers worldwide.",
      error_invalid: "Invalid video link. Check the URL and try again.",
      error_no_api: "AI extraction requires a valid API key. AI features disabled.",
      quality_max: "Max Resolution (HD)",
      quality_high: "High Quality",
      quality_med: "Medium Quality",
      quality_orig: "Original Size"
    },
    pt: {
      hero_title: "O extrator de miniaturas mais rápido para criadores globais.",
      placeholder: "Cole o link do vídeo aqui (YouTube ou Rumble)...",
      btn_extract: "EXTRAIR",
      status_ai_on: "IA ATIVA",
      status_ai_off: "SÓ YOUTUBE",
      history_title: "BUSCAS RECENTES",
      btn_clear: "Limpar Tudo",
      copy_link: "Copiar Link",
      copied: "Copiado!",
      nav_home: "Início",
      nav_privacy: "Privacidade",
      nav_terms: "Termos",
      faq_title: "Perguntas Frequentes",
      q1: "O ThumbPro é gratuito?",
      a1: "Sim, nossa ferramenta é 100% gratuita para todos. Sem registro para YouTube.",
      q2: "É legal baixar miniaturas?",
      a2: "As miniaturas são propriedade intelectual. Use para referência ou com permissão.",
      q3: "Quais plataformas são suportadas?",
      a3: "Suportamos YouTube nativamente e Rumble através de extração via IA.",
      seo_h1: "Miniaturas em Alta Definição",
      seo_p1: "O ThumbPro simplifica o trabalho de designers e YouTubers. Extraia capas em alta resolução instantaneamente.",
      seo_h2: "Extração Rumble via IA",
      seo_p2: "Usamos a IA Gemini do Google para encontrar capas de alta qualidade no Rumble.",
      cookie_text: "Usamos cookies para melhorar sua experiência. Ao continuar, você aceita nossa ",
      cookie_btn: "Aceitar",
      footer_desc: "Baixe miniaturas de alta qualidade do YouTube e Rumble. Essencial para editores e designers.",
      error_invalid: "Link inválido. Verifique a URL e tente novamente.",
      error_no_api: "Extração via IA requer chave de API. Funções de IA desativadas.",
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
        setHistory(prev => [{ timestamp: Date.now(), metadata: meta }, ...prev.filter(h => h.metadata.id !== meta.id)].slice(0, 12));
      } else if (platform === Platform.RUMBLE) {
        if (!isApiReady) throw new Error(currentT.error_no_api);
        const gemini = new GeminiService();
        const meta = await gemini.fetchRumbleMetadata(url);
        setResult(meta);
        setHistory(prev => [{ timestamp: Date.now(), metadata: meta }, ...prev.filter(h => h.metadata.originalUrl !== meta.originalUrl)].slice(0, 12));
      } else {
        throw new Error(currentT.error_invalid);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderHome = () => (
    <>
      <header className="text-center mb-16 pt-10">
        <h1 className="text-6xl md:text-8xl font-black mb-6 tracking-tighter italic">
          <span className="text-gradient">THUMB</span>
          <span className="text-emerald-500">PRO</span>
        </h1>
        <p className="text-slate-400 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
          {currentT.hero_title}
        </p>
      </header>

      <div className="max-w-4xl mx-auto mb-24 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-[32px] blur opacity-10 group-focus-within:opacity-30 transition duration-500"></div>
        <div className="relative glass-morphism p-2 rounded-[30px] shadow-2xl">
          <form onSubmit={processUrl} className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" size={24} />
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={currentT.placeholder}
                className="w-full bg-transparent border-none rounded-2xl py-6 pl-16 pr-6 focus:ring-0 text-xl font-medium text-white placeholder:text-slate-600"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full md:w-auto h-16 px-12 rounded-2xl bg-white text-black font-black text-lg hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : currentT.btn_extract}
            </button>
          </form>
        </div>
        {error && (
          <div className="absolute -bottom-14 left-0 right-0 flex justify-center animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2 text-red-400 bg-red-400/5 px-6 py-2 rounded-2xl border border-red-400/20 text-sm font-bold backdrop-blur-md">
              <AlertCircle size={16} /> {error}
            </div>
          </div>
        )}
      </div>

      {result && (
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-32 animate-in fade-in slide-in-from-bottom-6 duration-700">
          <div className="lg:col-span-8 group">
            <div className="relative rounded-[40px] overflow-hidden bg-slate-900 border border-white/5 shadow-2xl">
              <img
                src={result.thumbnails[0].url}
                className="w-full aspect-video object-cover"
                alt="Thumbnail Preview"
              />
              <div className="absolute top-6 left-6">
                <div className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl backdrop-blur-2xl border border-white/10 font-black text-xs uppercase tracking-widest ${
                  result.platform === Platform.YOUTUBE ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {result.platform === Platform.YOUTUBE ? <Youtube size={16} /> : <PlayCircle size={16} />}
                  {result.platform}
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="glass-morphism p-8 rounded-[40px] flex flex-col justify-between h-full">
              <div>
                <h2 className="text-2xl font-black text-white mb-8 leading-tight line-clamp-2 italic uppercase">{result.title}</h2>
                <div className="space-y-4">
                  {result.thumbnails.map((t, i) => (
                    <button
                      key={i}
                      onClick={() => window.open(t.url, '_blank')}
                      className="w-full group bg-white/5 hover:bg-white/10 border border-white/5 p-5 rounded-2xl flex items-center justify-between transition-all"
                    >
                      <span className="text-xs font-black uppercase text-slate-300 tracking-widest">{t.label}</span>
                      <Download size={20} className="text-emerald-400" />
                    </button>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => { navigator.clipboard.writeText(result.originalUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                className="mt-10 flex items-center justify-center gap-3 text-xs font-black uppercase text-slate-500 hover:text-white transition-colors tracking-widest"
              >
                {copied ? <CheckCircle2 size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? currentT.copied : currentT.copy_link}
              </button>
            </div>
          </div>
        </section>
      )}

      {history.length > 0 && (
        <section className="mb-32">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-3xl font-black italic uppercase text-white flex items-center gap-3">
              <HistoryIcon size={24} className="text-emerald-400" /> {currentT.history_title}
            </h3>
            <button onClick={() => setHistory([])} className="text-slate-600 hover:text-red-500 font-bold text-xs uppercase flex items-center gap-2">
              <TrashIcon size={16} /> {currentT.btn_clear}
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-6">
            {history.map((h, i) => (
              <div key={i} onClick={() => {setUrl(h.metadata.originalUrl); window.scrollTo({top: 0, behavior: 'smooth'})}} className="cursor-pointer group">
                <div className="aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-white/5 group-hover:border-emerald-500/50 transition-all shadow-lg">
                  <img src={h.metadata.thumbnails[0].url} className="w-full h-full object-cover opacity-50 group-hover:opacity-100 transition-opacity" alt="Recent" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="max-w-4xl mx-auto space-y-24 pb-20 border-t border-white/5 pt-20">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-white italic uppercase">{currentT.seo_h1}</h2>
            <p className="text-slate-400 leading-relaxed text-lg">{currentT.seo_p1}</p>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-white italic uppercase">{currentT.seo_h2}</h2>
            <p className="text-slate-400 leading-relaxed text-lg">{currentT.seo_p2}</p>
          </div>
        </div>

        <div className="glass-morphism p-12 rounded-[48px] space-y-12">
          <h2 className="text-3xl font-black text-white text-center italic uppercase tracking-wider">{currentT.faq_title}</h2>
          <div className="grid md:grid-cols-1 gap-10">
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {currentT.q1}
              </h3>
              <p className="text-slate-300 font-medium">{currentT.a1}</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {currentT.q2}
              </h3>
              <p className="text-slate-300 font-medium">{currentT.a2}</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-black uppercase text-sm tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500"></div> {currentT.q3}
              </h3>
              <p className="text-slate-300 font-medium">{currentT.a3}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderPolicy = (title: string, content: string) => (
    <div className="max-w-3xl mx-auto py-20 animate-in fade-in duration-500">
      <h2 className="text-5xl font-black text-white mb-12 italic uppercase tracking-tighter">{title}</h2>
      <div className="space-y-6 text-slate-400 leading-loose text-lg font-medium">
        <p>{content}</p>
        <p>This application is designed for creators to preview and reference video metadata. We do not store any video files on our servers.</p>
      </div>
      <button onClick={() => setCurrentView('home')} className="mt-16 text-emerald-400 font-black uppercase tracking-widest text-sm hover:text-white transition-colors flex items-center gap-2">
        <TrashIcon size={16} className="rotate-180" /> Back to home
      </button>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism h-20 flex items-center justify-between px-8 border-b-0">
        <div onClick={() => setCurrentView('home')} className="cursor-pointer font-black italic text-2xl tracking-tighter flex items-center gap-2">
          THUMB<span className="text-emerald-500">PRO</span>
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          <button onClick={() => setCurrentView('home')} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'home' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>{currentT.nav_home}</button>
          <button onClick={() => setCurrentView('privacy')} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'privacy' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>{currentT.nav_privacy}</button>
          <button onClick={() => setCurrentView('terms')} className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${currentView === 'terms' ? 'text-emerald-400' : 'text-slate-400 hover:text-white'}`}>{currentT.nav_terms}</button>
          
          <div className="relative">
            <button onClick={() => setShowLangMenu(!showLangMenu)} className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[11px] font-black text-slate-300 hover:bg-white/10 transition-all uppercase">
              <Globe size={14} className="text-emerald-400" />
              {lang}
              <ChevronDown size={14} />
            </button>
            {showLangMenu && (
              <div className="absolute top-full right-0 mt-3 w-40 glass-morphism rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95">
                <button onClick={() => changeLang('en')} className={`w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-colors ${lang === 'en' ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400'}`}>English</button>
                <button onClick={() => changeLang('pt')} className={`w-full text-left px-6 py-4 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-500/10 transition-colors ${lang === 'pt' ? 'text-emerald-400 bg-emerald-500/5' : 'text-slate-400'}`}>Português</button>
              </div>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.15em] border transition-all ${
          isApiReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isApiReady ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {isApiReady ? currentT.status_ai_on : currentT.status_ai_off}
        </div>
      </nav>

      <main className="flex-1 max-w-6xl mx-auto px-6 pt-36 pb-20 w-full">
        {currentView === 'home' && renderHome()}
        {currentView === 'privacy' && renderPolicy("Privacy Policy", "At ThumbPro, we value your privacy. We do not store your search history or extracted URLs on our cloud servers. All application data like your history is stored locally in your browser's memory.")}
        {currentView === 'terms' && renderPolicy("Terms of Service", "By using ThumbPro, you agree to use extracted content for personal and non-commercial purposes only. Thumbnails are the property of their respective creators.")}
      </main>

      <footer className="border-t border-white/5 bg-[#020617] py-20 px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="space-y-4 text-center md:text-left">
            <div className="font-black italic text-3xl tracking-tighter">
              THUMB<span className="text-emerald-500">PRO</span>
            </div>
            <p className="text-slate-500 text-sm font-medium max-w-xs">{currentT.footer_desc}</p>
          </div>
          <div className="flex gap-12 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <button onClick={() => setCurrentView('privacy')} className="hover:text-emerald-400 transition-colors">Privacy</button>
            <button onClick={() => setCurrentView('terms')} className="hover:text-emerald-400 transition-colors">Terms</button>
            <span className="flex items-center gap-2 text-slate-700">© 2024 WORLDWIDE</span>
          </div>
        </div>
      </footer>

      {showCookieBanner && (
        <div className="fixed bottom-8 left-8 right-8 z-[100] animate-in slide-in-from-bottom-full duration-700">
          <div className="max-w-4xl mx-auto glass-morphism p-8 rounded-[36px] border border-emerald-500/20 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <p className="text-slate-300 text-sm font-medium text-center md:text-left leading-relaxed">
              {currentT.cookie_text} <button onClick={() => setCurrentView('privacy')} className="text-emerald-400 font-black underline hover:text-emerald-300 transition-colors">{currentT.nav_privacy}</button>.
            </p>
            <button onClick={() => { localStorage.setItem('cookie_consent', 'true'); setShowCookieBanner(false); }} className="bg-emerald-500 text-black font-black px-12 py-4 rounded-2xl text-xs uppercase tracking-widest hover:bg-emerald-400 transition-colors whitespace-nowrap">
              {currentT.cookie_btn}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;