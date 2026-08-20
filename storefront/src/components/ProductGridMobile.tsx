"use client";
import { useCartStore } from "@/store/cart";
import Link from "next/link";
import { AdaptiveImageFrame } from "@james-andsons/media";

export default function ProductGridMobile({
  products = [],
}: {
  products: any[];
}) {
  const { addItem } = useCartStore();
  // Taking max 4 products for mobile new arrivals grid
  const displayProducts = products.slice(0, 4);

  return (
    <section className="section md:hidden mt-4" style={{ paddingTop: "10px" }}>
      <div
        className="section-header"
        style={{
          padding: "0 16px",
          marginBottom: "16px",
          borderBottom: "none",
        }}
      >
        <div>
          <div className="section-label">Latest</div>
          <h2 className="section-title" style={{ fontSize: "28px" }}>
            New <em>Arrivals</em>
          </h2>
        </div>
      </div>

      <div className="mobile-products-grid">
        {displayProducts.map((product, index) => (
          <Link
            key={product.id || index}
            href={`/products/${product.slug}`}
            className="mobile-product-card"
          >
            {product.images && product.images[0] ? (
              <AdaptiveImageFrame
                src={product.images[0]}
                alt={product.name}
                objectFit="cover"
                className="mobile-product-img"
              />
            ) : (
              <div className="mobile-product-img">
                <i className="ti ti-bulb mobile-product-img-icon"></i>
              </div>
            )}
            <div className="mobile-product-info">
              <div>
                <div className="mobile-product-name">{product.name}</div>
              </div>
              <div className="mobile-product-footer">
                <div className="mobile-product-price">
                  ₹{product.d2cPrice?.toLocaleString()} <span>incl. GST</span>
                </div>
                <button
                  className="mobile-add-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    addItem(product);
                  }}
                >
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
