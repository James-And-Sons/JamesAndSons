'use client';
import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Check if already installed / running in standalone mode
    if (typeof window !== 'undefined') {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);

      // 2. Detect if device is iOS (iPhone/iPad)
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isAppleMobile = /iphone|ipad|ipod/.test(userAgent);
      const isSafari = /safari/.test(userAgent) && !/crios|fxios|opera|mobi|chrome/.test(userAgent);
      setIsIOS(isAppleMobile);

      // 3. Listen for Chrome's native beforeinstallprompt event
      const handleBeforeInstall = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstall);

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      };
    }
  }, []);

  if (isStandalone) return null;

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) {
      // Prompt not captured yet or not supported, show instructions
      alert('To install this app: \n- On Android Chrome: Tap the three dots menu (⋮) on the top right and select "Add to Home Screen".\n- On desktop Chrome: Click the install icon inside the browser address bar.');
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      <div className="px-4 pb-3">
        <button
          onClick={handleInstallClick}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-[10px] font-mono tracking-[0.14em] uppercase text-accent bg-accent/10 border border-accent/30 hover:bg-accent/20 transition-all rounded-sm cursor-pointer font-medium"
        >
          <Download size={12} />
          <span>Install Admin App</span>
        </button>
      </div>

      {showIOSInstructions && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-200">
          <div className="bg-surface border border-accent/30 rounded-lg p-6 max-w-[340px] w-full shadow-2xl relative">
            <button 
              onClick={() => setShowIOSInstructions(false)}
              className="absolute top-4 right-4 text-muted hover:text-primary cursor-pointer"
            >
              <X size={16} />
            </button>
            <div className="text-center space-y-4">
              <div className="font-mono text-[9px] uppercase tracking-widest text-accent">iOS Installation Guide</div>
              <h3 className="font-serif text-[18px] text-primary font-normal m-0">Add to Home Screen</h3>
              <p className="font-body text-[12px] text-muted leading-relaxed">
                Safari on iPhone/iPad does not support direct installation buttons. Please follow these steps:
              </p>
              <div className="bg-background/50 border border-border p-4 text-[12px] font-body text-left space-y-2.5 rounded-sm">
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded">1</span>
                  <span>Tap the <strong>Share</strong> button at the bottom of Safari <span className="text-[14px]">⎋</span>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded">2</span>
                  <span>Scroll down and select <strong>"Add to Home Screen"</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-mono text-[10px] bg-accent/10 border border-accent/20 text-accent px-1.5 py-0.5 rounded">3</span>
                  <span>Tap <strong>"Add"</strong> on the top right to complete.</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                className="w-full btn-primary text-[10px] font-mono uppercase tracking-widest py-2.5"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
