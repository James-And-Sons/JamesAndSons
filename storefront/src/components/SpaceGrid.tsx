import Link from 'next/link';

export default function SpaceGrid() {
  return (
    <section className="section" id="spaces">
      <div className="section-header">
        <div>
          <div className="section-label">Curated Environs</div>
          <h2 className="section-title">Shop by <em>Space</em></h2>
        </div>
        <Link href="/collections" className="link-all">View All Spaces</Link>
      </div>
      
      <div className="space-grid">
        <Link href="/collections?space=grand-foyer" className="space-card block">
          <div className="space-card-bg"></div>
          <svg className="space-card-chandelier" width="120" height="150" viewBox="0 0 100 120" stroke="#C4A05A" fill="none">
            <path d="M50 10 L50 80" strokeWidth="1" strokeDasharray="2 2"/>
            <path d="M20 60 Q50 90 80 60" strokeWidth="1.5"/>
            <line x1="20" y1="60" x2="20" y2="75" stroke="#E2C882" strokeWidth="2"/>
            <circle cx="20" cy="80" r="3" fill="#C4A05A"/>
            <line x1="80" y1="60" x2="80" y2="75" stroke="#E2C882" strokeWidth="2"/>
            <circle cx="80" cy="80" r="3" fill="#C4A05A"/>
            <line x1="50" y1="80" x2="50" y2="100" stroke="#E2C882" strokeWidth="2"/>
            <circle cx="50" cy="105" r="4" fill="#F5E9C8"/>
          </svg>
          <div className="space-card-arrow">↗</div>
          <div className="space-card-content">
            <div className="space-card-name">Grand Foyer</div>
            <div className="space-card-count">42 Designs</div>
          </div>
        </Link>
        
        <div className="space-grid-right">
          <Link href="/collections?space=dining" className="space-card block">
            <div className="space-card-bg"></div>
            <div className="space-card-arrow">↗</div>
            <div className="space-card-content">
              <div className="space-card-name">Dining Estate</div>
              <div className="space-card-count">28 Designs</div>
            </div>
          </Link>
          
          <Link href="/collections?space=bedroom" className="space-card block">
            <div className="space-card-bg"></div>
            <div className="space-card-arrow">↗</div>
            <div className="space-card-content">
              <div className="space-card-name">Master Bed</div>
              <div className="space-card-count">15 Designs</div>
            </div>
          </Link>
          
          <Link href="/collections?space=hotel" className="space-card block">
            <div className="space-card-bg"></div>
            <div className="space-card-arrow">↗</div>
            <div className="space-card-content">
              <div className="space-card-name">Hotel Lobby</div>
              <div className="space-card-count">B2B Exclusive</div>
            </div>
          </Link>
          
          <Link href="/collections?space=conference" className="space-card block">
            <div className="space-card-bg"></div>
            <div className="space-card-arrow">↗</div>
            <div className="space-card-content">
              <div className="space-card-name">Conference</div>
              <div className="space-card-count">B2B Exclusive</div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
