import Footer from '@/components/Footer';
import Link from 'next/link';
import { BRAND_CONFIG } from '@james-andsons/config';

export const metadata = {
  title: `Returns & Refund Policy | ${BRAND_CONFIG.name}`,
  description: `Official Returns and Refund Policy for ${BRAND_CONFIG.name} orders in India.`,
};

export default function ReturnsPolicyPage() {
  return (
    <main style={{ minHeight: '100vh', background: 'var(--obsidian)', color: 'var(--cream)' }}>
      
      <section style={{ padding: '140px 24px 80px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold)', marginBottom: '12px' }}>
          Legal & Compliance
        </div>
        <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 300, lineHeight: 1.1, marginBottom: '24px' }}>
          Returns & Refund <em>Policy</em>
        </h1>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: '15px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '48px' }}>
          This Returns & Refund Policy applies to all purchases made on {BRAND_CONFIG.domain} within India. Please read the terms below carefully prior to initiating a return request.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          {/* Policy Overview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
            <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Territory</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>India Only</div>
            </div>

            <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Returns Scope</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Defective Products Only</div>
            </div>

            <div style={{ padding: '24px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '8px' }}>Exchanges</div>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '18px' }}>Not Accepted</div>
            </div>
          </div>

          {/* Section 1: Defective Products Returns */}
          <div style={{ padding: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', marginBottom: '16px', color: 'var(--cream)' }}>
              1. Return Eligibility (Defective & Damaged Items)
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: '16px' }}>
              We accept return requests <strong>exclusively for products that arrive defective, physically damaged in transit, or missing core components</strong>.
            </p>
            <ul style={{ paddingLeft: '20px', fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.8 }}>
              <li>Return claims must be submitted within <strong>7 days of delivery</strong> via our online <Link href="/returns" style={{ color: 'var(--gold)', textDecoration: 'underline' }}>Self-Service Returns Portal</Link>.</li>
              <li>Items must be unused, in their original condition, accompanied by all original packaging, tags, and BIS certification documentation.</li>
              <li>Proof of defect or transit damage (clear unboxing photos/video) is required during the portal submission.</li>
            </ul>
          </div>

          {/* Section 2: Non-Acceptance of Exchanges */}
          <div style={{ padding: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', marginBottom: '16px', color: 'var(--cream)' }}>
              2. Exchanges Policy
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              <strong>Exchanges are not accepted.</strong> We do not swap products for different sizes, finishes, or styles after purchase. If a product is verified as defective, a replacement for the exact same model will be dispatched or a full refund will be processed to the original payment method upon return inspection.
            </p>
          </div>

          {/* Section 3: Reverse Logistics & Costs */}
          <div style={{ padding: '32px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', marginBottom: '16px', color: 'var(--cream)' }}>
              3. Reverse Pickup & Shipping Costs
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              For approved defective return claims within India, {BRAND_CONFIG.name} will arrange a reverse pickup at zero additional cost to the customer. If our courier partner cannot serve your location, we will guide you on self-shipping with full shipping fee reimbursement.
            </p>
          </div>

          {/* Section 4: Contact & Support */}
          <div style={{ padding: '32px', background: 'rgba(184,134,11,0.05)', border: '1px solid rgba(184,134,11,0.2)', borderRadius: '20px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', marginBottom: '12px', color: 'var(--gold)' }}>
              Need Help With a Defective Order?
            </h2>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: '14px', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '20px' }}>
              Initiate your claim directly via our Returns Portal using your Order Number and Shipping Pincode, or contact our support team at <a href={`mailto:${BRAND_CONFIG.supportEmail}`} style={{ color: 'var(--gold)', textDecoration: 'underline' }}>{BRAND_CONFIG.supportEmail}</a>.
            </p>
            <Link href="/returns" className="btn-primary" style={{ display: 'inline-block', padding: '12px 28px', borderRadius: '10px' }}>
              Go to Returns Portal
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
