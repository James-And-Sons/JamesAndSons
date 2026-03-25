import Link from 'next/link';

export default function Hero() {
  return (
    <section className="hero">
      <div className="hero-bg"></div>
      
      {/* Abstract Chandelier Graphics */}
      <div className="hero-chandelier"></div>
      <svg className="hero-svg" viewBox="0 0 400 500" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M200 40 L200 380" stroke="url(#goldGradient)" strokeWidth="2" strokeDasharray="4 4" />
        <circle cx="200" cy="40" r="12" fill="none" stroke="#C4A05A" strokeWidth="1.5" />
        
        {/* Tier 1 */}
        <path d="M80 180 Q200 240 320 180" fill="none" stroke="#C4A05A" strokeWidth="1.5" opacity="0.6" />
        <line x1="80" y1="180" x2="80" y2="220" stroke="#E2C882" strokeWidth="2" />
        <circle cx="80" cy="225" r="5" fill="#C4A05A" filter="url(#glow)" />
        <line x1="320" y1="180" x2="320" y2="220" stroke="#E2C882" strokeWidth="2" />
        <circle cx="320" cy="225" r="5" fill="#C4A05A" filter="url(#glow)" />
        
        {/* Tier 2 */}
        <path d="M40 260 Q200 340 360 260" fill="none" stroke="#C4A05A" strokeWidth="1" opacity="0.4" />
        <line x1="40" y1="260" x2="40" y2="310" stroke="#E2C882" strokeWidth="1.5" />
        <circle cx="40" cy="315" r="4" fill="#C4A05A" filter="url(#glow)" />
        <line x1="120" y1="285" x2="120" y2="340" stroke="#E2C882" strokeWidth="1.5" />
        <circle cx="120" cy="345" r="4" fill="#C4A05A" filter="url(#glow)" />
        <line x1="280" y1="285" x2="280" y2="340" stroke="#E2C882" strokeWidth="1.5" />
        <circle cx="280" cy="345" r="4" fill="#C4A05A" filter="url(#glow)" />
        <line x1="360" y1="260" x2="360" y2="310" stroke="#E2C882" strokeWidth="1.5" />
        <circle cx="360" cy="315" r="4" fill="#C4A05A" filter="url(#glow)" />
        
        {/* Center Drop */}
        <circle cx="200" cy="390" r="8" fill="#F5E9C8" filter="url(#glowLarge)" />
        <path d="M200 400 L195 420 L200 430 L205 420 Z" fill="#C4A05A" opacity="0.8" />
        
        <defs>
          <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C4A05A" stopOpacity="0" />
            <stop offset="50%" stopColor="#E2C882" stopOpacity="1" />
            <stop offset="100%" stopColor="#C4A05A" stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="glowLarge" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      </svg>
      
      <div className="hero-eyebrow">The 2026 Collection</div>
      
      <div className="font-serif italic text-[#D4AF37] text-[13px] tracking-widest mb-6 opacity-80">
        &ldquo;Let your light shine before others&rdquo; &mdash;Matthew 5:16
      </div>
      
      <h1 className="hero-title">
        Illuminate<br />
        <em>with Purpose</em>
      </h1>
      
      <p className="hero-sub">
        Explore India's premier B2B & D2C ecosystem for luxury lighting. Masterfully crafted chandeliers engineered for sustainable brilliance.
      </p>
      
      <div className="hero-ctas">
        <Link href="/collections" className="btn-primary" style={{ textDecoration: 'none' }}>Shop Collection</Link>
        <Link href="/b2b" className="btn-outline" style={{ textDecoration: 'none' }}>B2B Portal Login</Link>
      </div>
      
      <div className="hero-stats">
        <div className="hero-stat">
          <div className="hero-stat-num">90+</div>
          <div className="hero-stat-label">CRI Rating</div>
        </div>
        <div className="hero-stat">
          <div className="hero-stat-num">100%</div>
          <div className="hero-stat-label">BIS Certified</div>
        </div>
      </div>
    </section>
  );
}
