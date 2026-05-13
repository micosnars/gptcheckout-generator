import React, { useState, useEffect } from 'react';
import { Zap, ShieldCheck, Briefcase, Check, ArrowRight, Loader2, Play } from 'lucide-react';

export default function App() {
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem('checkoutStats');
    return saved ? JSON.parse(saved) : { total: 1284, plus: 942, business: 342 };
  });

  const [planType, setPlanType] = useState<'plus' | 'business'>('plus');
  const [jsonInput, setJsonInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('checkoutStats', JSON.stringify(stats));
  }, [stats]);

  const handleGenerate = async () => {
    setError(null);
    setResultUrl(null);

    if (!jsonInput.trim()) {
      setError('Please paste your session JSON first.');
      return;
    }

    try {
      let parsed;
      try {
        parsed = JSON.parse(jsonInput);
      } catch (e) {
        throw new Error('Invalid JSON format. Please check your input.');
      }

      const accessToken = parsed.accessToken || parsed.token;
      if (!accessToken) {
        throw new Error('Access token not found in the parsed JSON.');
      }

      const accountId = parsed.account?.id || parsed.user?.id;

      setIsLoading(true);

      const response = await fetch('/api/generate-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          accessToken,
          accountId,
          planType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate checkout session');
      }

      setResultUrl(data.checkoutUrl);
      
      setStats(prev => ({
        ...prev,
        total: prev.total + 1,
        plus: planType === 'plus' ? prev.plus + 1 : prev.plus,
        business: planType === 'business' ? prev.business + 1 : prev.business
      }));

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (resultUrl) {
      navigator.clipboard.writeText(resultUrl);
    }
  };

  const openLink = () => {
    if (resultUrl) {
      window.open(resultUrl, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-zinc-100">
      <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-[#0b0e14]/90 z-10 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
            <Play className="text-white w-4 h-4 fill-current" />
          </div>
          <h1 className="text-xl font-bold tracking-tight uppercase">
            Checkout <span className="gradient-text">Generator</span>
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center bg-zinc-900/50 px-3 py-1.5 rounded-full border border-white/5">
            <div className="neon-pulse mr-2"></div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">
              API Status: Online
            </span>
          </div>
          <div className="text-xs text-zinc-500">v2.4.0-stable</div>
        </div>
      </header>

      <main className="flex-grow p-8 grid grid-rows-[auto_1fr] gap-8 max-w-[1024px] mx-auto w-full overflow-hidden">
        <section className="grid grid-cols-3 gap-6">
          <div className="glass p-5 rounded-2xl flex items-center space-x-4">
            <div className="bg-purple-500/10 p-3 rounded-xl">
              <Zap className="text-purple-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Total Generated</p>
              <p className="text-2xl font-mono font-bold">{stats.total.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex items-center space-x-4">
            <div className="bg-green-500/10 p-3 rounded-xl">
              <ShieldCheck className="text-green-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Plus Plans</p>
              <p className="text-2xl font-mono font-bold">{stats.plus.toLocaleString()}</p>
            </div>
          </div>
          <div className="glass p-5 rounded-2xl flex items-center space-x-4">
            <div className="bg-blue-500/10 p-3 rounded-xl">
              <Briefcase className="text-blue-500 w-6 h-6" />
            </div>
            <div>
              <p className="text-xs uppercase text-zinc-500 font-bold tracking-wider">Business Plans</p>
              <p className="text-2xl font-mono font-bold">{stats.business.toLocaleString()}</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-8 h-full min-h-0">
          <div className="glass rounded-3xl p-6 flex flex-col space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm uppercase font-bold text-zinc-400 tracking-widest">Configuration</h2>
              <div className="flex bg-zinc-900 rounded-lg p-1 border border-white/5">
                <button 
                  onClick={() => setPlanType('plus')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${planType === 'plus' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Plus
                </button>
                <button 
                  onClick={() => setPlanType('business')}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${planType === 'business' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Business
                </button>
              </div>
            </div>

            <div className="flex-grow flex flex-col space-y-2 min-h-0">
              <label className="text-xs text-zinc-500 font-medium ml-1">Paste JSON Session Auth</label>
              <textarea 
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="flex-grow code-area border border-white/5 rounded-xl p-4 text-xs text-purple-300 outline-none resize-none placeholder:text-zinc-700 w-full" 
                placeholder='{ "accessToken": "eyJhbGci...", "account": { "id": "org-123" } }'
              ></textarea>
              {error && <p className="text-xs text-red-500 font-medium ml-1 mt-1">{error}</p>}
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="glow-button w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm flex items-center justify-center space-x-2 shrink-0"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              <span>{isLoading ? 'Generating Session...' : 'Generate Checkout Session'}</span>
            </button>
          </div>

          <div className="glass rounded-3xl p-6 border-dashed border-zinc-800 flex flex-col items-center justify-center text-center relative h-full">
            <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 to-transparent pointer-events-none rounded-3xl"></div>
            
            {resultUrl ? (
              <div className="flex flex-col items-center justify-center space-y-6 w-full z-10 animate-in fade-in zoom-in duration-300">
                <div className="bg-green-500/20 w-16 h-16 rounded-full flex items-center justify-center border border-green-500/30">
                  <Check className="text-green-500 w-8 h-8" strokeWidth={3} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-white">Session Generated</h3>
                  <p className="text-sm text-zinc-400 max-w-[280px] mx-auto">Your localized checkout session is ready for processing.</p>
                </div>
                <div className="w-full bg-black/40 border border-white/5 p-4 rounded-xl flex flex-col space-y-3 shadow-xl">
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider text-left">Destination URL</div>
                  <div className="text-xs font-mono text-purple-400 bg-black/50 p-3 rounded-lg break-all text-left">
                    {resultUrl}
                  </div>
                  <div className="flex space-x-3 pt-2">
                    <button onClick={copyToClipboard} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors cursor-pointer text-white">
                      Copy Link
                    </button>
                    <button onClick={openLink} className="flex-1 py-2.5 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-bold transition-colors cursor-pointer">
                      Open Session
                    </button>
                  </div>
                </div>
              </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-zinc-600 space-y-4 z-10 w-3/4">
                    <div className="w-16 h-16 border-2 border-dashed border-zinc-700 rounded-full flex items-center justify-center mb-2">
                         <Play className="w-6 h-6 text-zinc-700 ml-1" />
                    </div>
                    <h3 className="text-lg font-bold">Waiting for Input</h3>
                    <p className="text-sm">Paste your session JSON and configure your plan to generate a fast checkout link.</p>
                </div>
            )}
          </div>
        </section>
      </main>

      <footer className="h-12 border-t border-white/5 flex items-center px-8 text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-medium justify-between bg-[#0b0e14]/90 shrink-0">
        <div>© 2024 Secure Engine • Indonesia Node</div>
        <div className="flex space-x-6">
          <span>Puppeteer Stealth v1.2</span>
          <span>Jakarta Zone</span>
        </div>
      </footer>
    </div>
  );
}

