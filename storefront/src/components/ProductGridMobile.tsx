'use client';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';

export default function ProductGridMobile({ products = [] }: { products: any[] }) {
  const { addItem } = useCartStore();
  // Taking max 4 products for mobile new arrivals grid
  const displayProducts = products.slice(0, 4);

  return (
    <section className="section md:hidden mt-4" style={{ paddingTop: '10px' }}>
      <div className="section-header" style={{ padding: '0 16px', marginBottom: '16px', borderBottom: 'none' }}>
        <div>
          <div className="section-label">Latest</div>
          <h2 className="section-title" style={{ fontSize: '28px' }}>New <em>Arrivals</em></h2>
        </div>
      </div>

      <div className="mobile-products-grid">
        {displayProducts.map((product, index) => (
          <Link key={product.id || index} href={`/products/${product.slug}`} className="mobile-product-card">
            <div className="mobile-product-img">
              {product.images && product.images[0] ? (
                <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
              ) : (
                <i className="ti ti-bulb mobile-product-img-icon"></i>
              )}
            </div>
            <div className="mobile-product-info">
              <div>
                <div className="mobile-product-name">{product.name}</div>
                <div className="mobile-product-sku">SKU: {product.sku || 'N/A'}</div>
              </div>
              <div className="mobile-product-footer">
                <div className="mobile-product-price">₹{product.d2cPrice?.toLocaleString()} <span>+ GST</span></div>
                <button className="mobile-add-btn" onClick={(e) => { e.preventDefault(); e.stopPropagation(); addItem(product); }}>
                  <i className="ti ti-plus"></i>
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
