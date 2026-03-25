import Link from 'next/link';

export default function Footer() {
  return (
    <footer style={{ backgroundColor: 'var(--obsidian)', borderTop: '1px solid var(--border)', padding: '60px 40px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '11px', letterSpacing: '0.1em', marginTop: 'auto' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px' }}>
          
          <div>
            <h3 style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)', fontSize: '20px', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '8px' }}>
              James <span style={{ color: 'var(--gold)', fontStyle: 'italic' }}>&amp;</span> Sons
            </h3>
            <p style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '10px', color: 'var(--gold)', opacity: 0.7, marginBottom: '16px', letterSpacing: '0.05em' }}>
              &ldquo;Let your light shine before others&rdquo; &mdash;Matthew 5:16
            </p>
            <p style={{ lineHeight: 1.8 }}>Curators of luxury illumination.<br/>Elevating spaces with heritage craftsmanship.</p>
          </div>
          
          <div>
            <h4 style={{ color: 'var(--text)', marginBottom: '8px', textTransform: 'uppercase' }}>Shop</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link href="/collections" className="footer-link">Collections</Link></li>
              <li><Link href="/#spaces" className="footer-link">Spaces</Link></li>
              <li><Link href="/b2b" className="footer-link">B2B Portal</Link></li>
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
              <li><Link href="/terms-and-conditions" className="footer-link">Terms &amp; Conditions</Link></li>
              <li><Link href="/privacy-policy" className="footer-link">Privacy Policy</Link></li>
              <li><Link href="/shipping-policy" className="footer-link">Shipping Policy</Link></li>
              <li><Link href="/returns" className="footer-link">Returns</Link></li>
            </ul>
          </div>
          
        </div>
        
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <p style={{ margin: 0 }}>&copy; {new Date().getFullYear()} James & Sons. All rights reserved.</p>
          <div style={{ display: 'flex', gap: '4px' }}>
            <span className="footer-link" style={{ cursor: 'pointer' }}>Instagram</span>
            <span className="footer-link" style={{ cursor: 'pointer' }}>Pinterest</span>
            <span className="footer-link" style={{ cursor: 'pointer' }}>LinkedIn</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
