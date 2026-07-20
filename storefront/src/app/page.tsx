import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SpaceGrid from "@/components/SpaceGrid";
import ProductGridMobile from "@/components/ProductGridMobile";
import { getSpaces, getProducts } from "@/lib/products";

export default async function Home() {
  const spaces = await getSpaces();
  const products = await getProducts();

  return (
    <main>
      <Navigation />
      <Hero />
      <SpaceGrid spaces={spaces as any} />
      <ProductGridMobile products={products} />
    </main>
  );
}
