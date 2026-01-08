
import React, { useState, useEffect } from 'react';
import { 
  Search, Download, History, Youtube, PlayCircle, Loader2, AlertCircle, 
  Copy, CheckCircle2, History as HistoryIcon, Trash2 as TrashIcon, 
  ExternalLink, Menu, X, Shield, Info, FileText, Mail, ChevronDown
} from 'lucide-react';
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
  const [currentView, setCurrentView] = useState<'home' | 'privacy' | 'terms' | 'about' | 'contact'>('home');
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => {
    const checkApiKey = () => {
      try {
        const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : null;
        if (apiKey && apiKey !== 'undefined' && apiKey !== '') {
          setIsApiReady(true);
        }
      } catch (e) {
        console.warn("Ambiente de variáveis não carregado totalmente.");
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
  }, []);

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
    setCurrentView('home');

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
          throw new Error("API_KEY do Gemini não detectada. Adicione a variável API_KEY nas configurações da Vercel.");
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
          O extrator de miniaturas mais rápido para criadores de conteúdo.
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
                placeholder="Cole o link do vídeo aqui..."
                className="w-full bg-transparent border-none rounded-2xl py-5 pl-14 pr-4 focus:ring-0 text-xl placeholder:text-slate-600 font-medium text-white"
              />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-400 transition-colors" size={24} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="h-16 px-10 rounded-2xl bg-white text-black font-black text-lg hover:bg-emerald-400 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-3"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : 'BAIXAR'}
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
                  {copied ? 'Copiado' : 'Link Original'}
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
              <h3 className="text-3xl font-black italic uppercase tracking-tighter">Seu Histórico</h3>
            </div>
            <button onClick={handleClearHistory} className="text-slate-600 hover:text-red-500 font-bold text-xs uppercase flex items-center gap-2 transition-colors">
              <TrashIcon size={16} /> Limpar Tudo
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

      {/* SEO CONTENT SECTION - OBRIGATÓRIO ADSENSE */}
      <section className="mt-32 pt-20 border-t border-white/5 space-y-24 max-w-4xl mx-auto">
        <div className="grid md:grid-cols-2 gap-16">
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-white leading-tight">Como baixar miniaturas em HD?</h2>
            <p className="text-slate-400 leading-relaxed">
              O ThumbPro foi desenvolvido para simplificar o fluxo de trabalho de designers e YouTubers. 
              Para baixar uma miniatura em alta resolução, basta copiar o link do vídeo do YouTube ou Rumble 
              e colar em nossa barra de busca. Nossa ferramenta processa o link instantaneamente e oferece as 
              melhores opções de download disponíveis.
            </p>
          </div>
          <div className="space-y-6">
            <h2 className="text-4xl font-black text-white leading-tight">Miniaturas do Rumble com IA</h2>
            <p className="text-slate-400 leading-relaxed">
              Diferente de outras ferramentas, o ThumbPro utiliza a tecnologia Gemini AI da Google para 
              extrair metadados complexos do Rumble, garantindo que você sempre encontre a capa correta, 
              mesmo quando os métodos tradicionais falham.
            </p>
          </div>
        </div>

        <div className="glass-morphism p-12 rounded-[40px] space-y-10">
          <h2 className="text-3xl font-black text-white text-center">Perguntas Frequentes (FAQ)</h2>
          <div className="space-y-8">
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-bold text-lg">O ThumbPro é gratuito?</h3>
              <p className="text-slate-400">Sim, nossa ferramenta é 100% gratuita para todos os usuários. Não exigimos cadastro para baixar miniaturas básicas do YouTube.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-bold text-lg">É legal baixar thumbnails?</h3>
              <p className="text-slate-400">As miniaturas são propriedade intelectual dos criadores de conteúdo. Nossa ferramenta deve ser usada apenas para fins de referência, inspiração ou uso autorizado pelo proprietário original.</p>
            </div>
            <div className="space-y-3">
              <h3 className="text-emerald-400 font-bold text-lg">Quais plataformas são suportadas?</h3>
              <p className="text-slate-400">Atualmente suportamos YouTube e Rumble com extração inteligente.</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );

  const renderPrivacy = () => (
    <div className="max-w-3xl mx-auto py-20 animate-in fade-in duration-500">
      <h2 className="text-5xl font-black text-white mb-10 italic uppercase">Política de Privacidade</h2>
      <div className="space-y-6 text-slate-400 leading-loose">
        <p>No ThumbPro, a privacidade dos nossos visitantes é uma das nossas principais prioridades. Este documento de Política de Privacidade contém tipos de informações que são coletadas e registradas pelo ThumbPro e como as utilizamos.</p>
        <h3 className="text-xl font-bold text-white mt-8 uppercase">Arquivos de Log</h3>
        <p>O ThumbPro segue um procedimento padrão de uso de arquivos de log. Esses arquivos registram os visitantes quando eles visitam sites. Todas as empresas de hospedagem fazem isso e uma parte das análises dos serviços de hospedagem. As informações coletadas pelos arquivos de log incluem endereços de protocolo de internet (IP), tipo de navegador, Provedor de Serviços de Internet (ISP), carimbo de data e hora, páginas de referência/saída e possivelmente o número de cliques.</p>
        <h3 className="text-xl font-bold text-white mt-8 uppercase">Cookies e Web Beacons</h3>
        <p>Como qualquer outro site, o ThumbPro usa 'cookies'. Esses cookies são usados para armazenar informações, incluindo as preferências dos visitantes e as páginas do site que o visitante acessou ou visitou. As informações são usadas para otimizar a experiência dos usuários, personalizando o conteúdo de nossa página da web com base no tipo de navegador dos visitantes e/ou outras informações.</p>
        <h3 className="text-xl font-bold text-white mt-8 uppercase">Google DoubleClick DART Cookie</h3>
        <p>O Google é um dos fornecedores terceirizados em nosso site. Ele também usa cookies, conhecidos como cookies DART, para veicular anúncios aos visitantes do nosso site com base na visita ao nosso site e a outros sites na Internet.</p>
        <button onClick={() => setCurrentView('home')} className="mt-12 text-emerald-400 font-black uppercase text-sm flex items-center gap-2 hover:gap-4 transition-all">
          <X size={18} /> Voltar para a Início
        </button>
      </div>
    </div>
  );

  const renderTerms = () => (
    <div className="max-w-3xl mx-auto py-20 animate-in fade-in duration-500">
      <h2 className="text-5xl font-black text-white mb-10 italic uppercase">Termos de Uso</h2>
      <div className="space-y-6 text-slate-400 leading-loose">
        <p>Ao acessar o site ThumbPro, você concorda em cumprir estes termos de serviço, todas as leis e regulamentos aplicáveis ​​e concorda que é responsável pelo cumprimento de todas as leis locais aplicáveis.</p>
        <h3 className="text-xl font-bold text-white mt-8 uppercase">1. Licença de Uso</h3>
        <p>É concedida permissão para baixar temporariamente uma cópia dos materiais (informações ou software) no site ThumbPro apenas para visualização transitória pessoal e não comercial.</p>
        <h3 className="text-xl font-bold text-white mt-8 uppercase">2. Isenção de responsabilidade</h3>
        <p>Os materiais no site da ThumbPro são fornecidos 'como estão'. ThumbPro não oferece garantias, expressas ou implícitas, e, por este meio, isenta e nega todas as outras garantias, incluindo, sem limitação, garantias implícitas ou condições de comercialização, adequação a um fim específico ou não violação de propriedade intelectual ou outra violação de direitos.</p>
        <button onClick={() => setCurrentView('home')} className="mt-12 text-emerald-400 font-black uppercase text-sm flex items-center gap-2 hover:gap-4 transition-all">
          <X size={18} /> Voltar para a Início
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-morphism border-b-0">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div onClick={() => setCurrentView('home')} className="cursor-pointer font-black italic text-2xl tracking-tighter group">
            THUMB<span className="text-emerald-500 group-hover:text-emerald-400 transition-colors">PRO</span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <button onClick={() => setCurrentView('home')} className={`text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ${currentView === 'home' ? 'text-emerald-400' : 'text-slate-400'}`}>Início</button>
            <button onClick={() => setCurrentView('about')} className={`text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ${currentView === 'about' ? 'text-emerald-400' : 'text-slate-400'}`}>Sobre</button>
            <button onClick={() => setCurrentView('privacy')} className={`text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ${currentView === 'privacy' ? 'text-emerald-400' : 'text-slate-400'}`}>Privacidade</button>
            <button onClick={() => setCurrentView('contact')} className={`text-xs font-black uppercase tracking-widest hover:text-emerald-400 transition-colors ${currentView === 'contact' ? 'text-emerald-400' : 'text-slate-400'}`}>Contato</button>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${
            isApiReady ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isApiReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            {isApiReady ? 'AI ON' : 'AI OFF'}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto px-4 pt-32 pb-20 w-full">
        {currentView === 'home' && renderHome()}
        {currentView === 'privacy' && renderPrivacy()}
        {currentView === 'terms' && renderTerms()}
        {(currentView === 'about' || currentView === 'contact') && (
          <div className="py-20 text-center space-y-6">
            <h2 className="text-4xl font-black text-white uppercase italic">{currentView}</h2>
            <p className="text-slate-400">Esta seção está em desenvolvimento. Para suporte, envie um e-mail para <span className="text-emerald-400 font-bold">contato@thumbpro.site</span></p>
            <button onClick={() => setCurrentView('home')} className="px-8 py-3 bg-white text-black font-black uppercase rounded-full hover:bg-emerald-400 transition-colors">Voltar</button>
          </div>
        )}
      </main>

      {/* FOOTER - ESSENCIAL PARA ADSENSE */}
      <footer className="border-t border-white/5 bg-[#020617] py-20 mt-auto">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="font-black italic text-3xl tracking-tighter">
                THUMB<span className="text-emerald-500">PRO</span>
              </div>
              <p className="text-slate-500 max-w-xs leading-relaxed">
                Baixe miniaturas de alta qualidade do YouTube e Rumble. Uma ferramenta essencial para editores e designers.
              </p>
            </div>
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-widest">Legal</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><button onClick={() => setCurrentView('privacy')} className="hover:text-emerald-400 transition-colors">Política de Privacidade</button></li>
                <li><button onClick={() => setCurrentView('terms')} className="hover:text-emerald-400 transition-colors">Termos de Serviço</button></li>
                <li><button onClick={() => setCurrentView('home')} className="hover:text-emerald-400 transition-colors">Isenção de Responsabilidade</button></li>
              </ul>
            </div>
            <div className="space-y-6">
              <h4 className="text-white font-black uppercase text-xs tracking-widest">Links Rápidos</h4>
              <ul className="space-y-4 text-slate-500 text-sm">
                <li><button onClick={() => setCurrentView('home')} className="hover:text-emerald-400 transition-colors">Home</button></li>
                <li><button onClick={() => setCurrentView('about')} className="hover:text-emerald-400 transition-colors">Sobre Nós</button></li>
                <li><button onClick={() => setCurrentView('contact')} className="hover:text-emerald-400 transition-colors">Contato</button></li>
              </ul>
            </div>
          </div>
          <div className="pt-10 border-t border-white/5 flex flex-col md:row items-center justify-between gap-6 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
            <p>© 2024 ThumbPro - Todos os direitos reservados.</p>
            <div className="flex items-center gap-8">
              <span>Feito com ❤️ por Criadores</span>
            </div>
          </div>
        </div>
      </footer>

      {/* COOKIE BANNER - CONFORMIDADE GDPR/LGPD */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom-full duration-700">
          <div className="max-w-4xl mx-auto glass-morphism border border-emerald-500/20 p-6 md:p-8 rounded-[32px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center md:text-left">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 shrink-0">
                <Shield size={24} />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">
                Nós usamos cookies para melhorar sua experiência e oferecer anúncios personalizados. Ao continuar navegando, você concorda com nossa <button onClick={() => setCurrentView('privacy')} className="text-emerald-400 font-bold underline">Política de Privacidade</button>.
              </p>
            </div>
            <button 
              onClick={acceptCookies}
              className="px-10 py-4 bg-emerald-500 text-black font-black uppercase text-xs rounded-2xl hover:bg-emerald-400 transition-colors whitespace-nowrap shadow-[0_8px_20px_rgba(16,185,129,0.3)]"
            >
              Aceitar Cookies
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
