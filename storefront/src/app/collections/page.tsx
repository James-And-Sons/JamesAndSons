import Navigation from "@/components/Navigation";
import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/products";

export default async function CollectionsPage(props: {
  searchParams: Promise<{ space?: string }>
}) {
  const searchParams = await props.searchParams;
  const initialProducts = await getProducts();
  return (
    <>
      <Navigation />
      <main className="md:pt-16 min-h-screen">
        <ProductGrid initialFilter={searchParams.space} initialProducts={initialProducts} />
      </main>
    </>
  );
}
