import { getSpaces } from "@/lib/products";
import Navigation from "@/components/Navigation";
import Link from "next/link";
import Image from "next/image";

export const revalidate = 3600; // Cache for 1 hour

export default async function SpacesPage() {
  const spaces = await getSpaces();

  return (
    <main className="min-h-screen bg-[var(--obsidian)] text-[var(--text)] pt-12">
      <Navigation />
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 py-16">
        <div className="flex flex-col items-center text-center mb-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="font-mono text-[11px] tracking-[0.2em] uppercase text-[var(--gold)] mb-4">
            Curated Environments
          </div>
          <h1 className="font-serif text-4xl md:text-6xl font-light text-[var(--cream)] mb-6">
            Shop by <em className="italic text-[var(--gold-light)]">Space</em>
          </h1>
          <p className="font-body text-[15px] text-[var(--text-muted)] max-w-[600px] leading-relaxed">
            Discover our luxury lighting collections perfectly tailored for every room in your home. From grand living rooms to intimate dining settings, find the perfect illumination.
          </p>
        </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {spaces.map((space, index) => (
              <Link
                key={space.id}
                href={`/collections?space=${space.slug}`}
                className="group relative block w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-22px)] max-w-[400px] aspect-[4/5] overflow-hidden bg-[var(--surface)] animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {space.image ? (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${space.image})` }}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[var(--surface2)] to-[var(--surface)] transition-transform duration-700 group-hover:scale-105 flex items-center justify-center opacity-50">
                    <svg width="60" height="75" viewBox="0 0 100 120" stroke="var(--gold)" fill="none" className="opacity-30">
                      <path d="M50 10 L50 40" strokeWidth="1" strokeDasharray="3 3" />
                      <path d="M20 70 Q50 30 80 70" strokeWidth="2" opacity="0.7" />
                      <circle cx="50" cy="95" r="4" fill="var(--gold-light)" stroke="none" />
                    </svg>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent transition-opacity duration-300" />

                <div className="absolute bottom-0 left-0 right-0 p-10 lg:p-12 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="font-mono text-[10px] tracking-[0.15em] uppercase text-[var(--gold)] mb-2">
                    {space._count.products} Fixtures
                  </div>
                  <h2 className="font-serif text-3xl font-light text-[var(--cream)] group-hover:text-white transition-colors">
                    {space.name}
                  </h2>
                  {space.description && (
                    <p className="font-body text-sm text-[var(--text-muted)] mt-3 line-clamp-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {space.description}
                    </p>
                  )}
                </div>

                <div className="absolute top-6 right-6 w-10 h-10 border border-[var(--border-gold)] rounded-full flex items-center justify-center text-[var(--gold)] opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                  →
                </div>
              </Link>
            ))}
          </div>
        </div>
    </main>
  );
}
