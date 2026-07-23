import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--obsidian)', borderTop: '1px solid var(--border)', padding: '60px 40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px', letterSpacing: '0.1em', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          
          <div>
            <h3 style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              James <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>&amp;</span> Sons
            </h3>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '15px', color: 'var(--gold-pale)', marginBottom: '20px', letterSpacing: '0.05em' }}>
              &ldquo;Let your light shine before others&rdquo; &mdash;Matthew 5:16
            </p>
            <p style={{ lineHeight: 1.8 }}>Curators of luxury illumination.<br/>Elevating spaces with heritage craftsmanship.</p>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '8px', textTransform: 'uppercase' }}>Shop</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/collections" className="footer-link">Collections</Link></li>
              <li><Link href="/spaces" className="footer-link">Spaces</Link></li>
              <li><Link href="/catalogues" className="footer-link">Download Catalogues</Link></li>
              <li><Link href="https://indiamart.jamesandsons.in" className="footer-link">B2B Portal</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '8px', textTransform: 'uppercase' }}>Company</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/about" className="footer-link">About Us</Link></li>
              <li><Link href="/contact" className="footer-link">Contact</Link></li>
              <li><Link href="/careers" className="footer-link">Careers</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '8px', textTransform: 'uppercase' }}>Legal</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/terms" className="footer-link">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy" className="footer-link">Privacy Policy</Link></li>
              <li><Link href="/shipping-policy" className="footer-link">Shipping Policy</Link></li>
              <li><Link href="/returns-policy" className="footer-link">Returns Policy</Link></li>
            </ul>
          </div>

          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '12px', textTransform: 'uppercase' }}>Support</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
              <Link 
                href="/account/tickets" 
                className="btn-support-ticket"
              >
                Raise a Ticket
              </Link>
              <Link 
                href="/returns" 
                className="footer-link"
                style={{ fontSize: '11px', textTransform: 'uppercase', textDecoration: 'none' }}
              >
                Returns Portal
              </Link>
            </div>
          </div>
          
        </div>
        
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} James & Sons. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span className="footer-link" style={{ cursor: 'pointer' }}>Instagram</span>
            <a href="https://pin.it/1KZxSIww1" target="_blank" rel="noopener noreferrer" className="footer-link" style={{ textDecoration: 'none' }}>Pinterest</a>
            <span className="footer-link" style={{ cursor: 'pointer' }}>LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
