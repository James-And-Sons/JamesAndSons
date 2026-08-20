import Hero from "@/components/Hero";
import SpaceGrid from "@/components/SpaceGrid";
import CategoryGrid from "@/components/CategoryGrid";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import BestSellersSection from "@/components/BestSellersSection";
import AboutExcerpt from "@/components/AboutExcerpt";
import ContactCTA from "@/components/ContactCTA";
import {
  getSpaces,
  getProducts,
  getCategories,
  getNewArrivals,
  getBestSellers,
} from "@/lib/products";

export default async function Home() {
  const results = await Promise.allSettled([
    getSpaces(),
    getProducts(),
    getCategories(),
    getNewArrivals(8),
    getBestSellers(6),
  ]);

  const spaces = results[0].status === "fulfilled" ? results[0].value : [];
  const products = results[1].status === "fulfilled" ? results[1].value : [];
  const categories = results[2].status === "fulfilled" ? results[2].value : [];
  const newArrivals = results[3].status === "fulfilled" ? results[3].value : [];
  const bestSellers = results[4].status === "fulfilled" ? results[4].value : [];

  return (
    <main className="home-main">
      <Hero />
      <BestSellersSection products={bestSellers} />
      <SpaceGrid spaces={spaces as any} />
      <AboutExcerpt />
      <CategoryGrid categories={categories as any} products={products} />
      <NewArrivalsSection products={newArrivals} />
      <ContactCTA />
    </main>
  );
}
