import Navigation from "@/components/Navigation";
import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/products";

export default async function CollectionsPage(props: {
  searchParams: Promise<{ space?: string }>
}) {
  const searchParams = await props.searchParams;
  const initialProducts = await getProducts();
  return (
    <main className="pt-24 min-h-screen">
      <Navigation />
      <ProductGrid initialFilter={searchParams.space} initialProducts={initialProducts} />
    </main>
  );
}
