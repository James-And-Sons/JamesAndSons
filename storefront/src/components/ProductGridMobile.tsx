import Link from 'next/link';

export default function ProductGridMobile({ products = [] }: { products: any[] }) {
  // Taking max 4 products for mobile new arrivals grid
  const displayProducts = products.slice(0, 4);

  return (
    <section className="section md:hidden mt-4" style={{ paddingTop: '20px' }}>
      <div className="section-header" style={{ padding: '0 24px', marginBottom: '20px', borderBottom: 'none' }}>
        <div>
          <div className="section-label">Latest</div>
          <h2 className="section-title" style={{ fontSize: '28px' }}>New <em>Arrivals</em></h2>
        </div>
      </div>

      <div className="mobile-products-grid">
        {displayProducts.map((product, index) => (
          <Link key={product.id || index} href={`/product/${product.slug}`} className="mobile-product-card">
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
                <div className="mobile-product-price">₹{product.price?.toLocaleString()} <span>+ GST</span></div>
                <button className="mobile-add-btn" onClick={(e) => { e.preventDefault(); /* add to cart logic */ }}>
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
