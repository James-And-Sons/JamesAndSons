import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/products";

export default async function CollectionsPage(props: {
  searchParams: Promise<{ space?: string; category?: string }>
}) {
  const searchParams = await props.searchParams;
  const initialProducts = await getProducts();
  return (
    <>
      <main className="collections-main pt-1 md:pt-24 min-h-screen">
        <ProductGrid
          initialFilter={searchParams.space}
          initialCategory={searchParams.category}
          initialProducts={initialProducts}
        />
      </main>
    </>
  );
}
