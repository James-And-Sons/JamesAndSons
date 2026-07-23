import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SpaceGrid from "@/components/SpaceGrid";
import CategoryGrid from "@/components/CategoryGrid";
import NewArrivalsSection from "@/components/NewArrivalsSection";
import BestSellersSection from "@/components/BestSellersSection";
import AboutExcerpt from "@/components/AboutExcerpt";
import ContactCTA from "@/components/ContactCTA";
import Footer from "@/components/Footer";
import { getSpaces, getProducts, getCategories, getNewArrivals, getBestSellers } from "@/lib/products";

export default async function Home() {
  const [spaces, products, categories, newArrivals, bestSellers] = await Promise.all([
    getSpaces(),
    getProducts(),
    getCategories(),
    getNewArrivals(8),
    getBestSellers(6),
  ]);

  return (
    <main>
      <Navigation />
      <Hero />
      <SpaceGrid spaces={spaces as any} />
      <CategoryGrid categories={categories as any} />
      <NewArrivalsSection products={newArrivals} />
      <BestSellersSection products={bestSellers} />
      <AboutExcerpt />
      <ContactCTA />
      <Footer />
    </main>
  );
}
