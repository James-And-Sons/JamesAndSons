import { prisma } from "@james-andsons/db";

async function updateAboutPage() {
  const contentHtml = `
<p>James &amp; Sons is a family-owned manufacturer of premium decorative lighting, proudly carrying forward a legacy inspired by our forefather, Mr. James. What began as a commitment to fine craftsmanship has evolved into a trusted name in the lighting industry, known for creating elegant lighting solutions that combine traditional artistry with modern innovation.</p>

<p>For generations, we have specialized in the design and manufacture of Chandeliers, Hanging Lamp Shades, Wall Brackets, Pole &amp; Gate Lights, and Table &amp; Floor Lamps. Every product is crafted with precision using premium-quality materials to deliver exceptional beauty, durability, and performance.</p>

<p>At James &amp; Sons, we believe lighting is more than illumination—it defines the character of a space. Whether for luxurious residences, hotels, restaurants, villas, or commercial projects, our creations are designed to transform interiors and exteriors with timeless elegance.</p>

<p>Driven by our commitment to quality, innovation, and customer satisfaction, we continue to uphold the values established by our forefather while embracing contemporary design and customized lighting solutions for clients across India and beyond.</p>

<p style="font-size: 1.1em; color: var(--gold-light); font-family: var(--font-serif); font-style: italic; margin-top: 32px; border-left: 3px solid var(--gold); padding-left: 16px;">
<strong>James &amp; Sons is more than a lighting manufacturer—it is a legacy of craftsmanship, excellence, and trust, dedicated to Lighting the World with Elegance.</strong>
</p>
`.trim();

  const title = "About James & Sons";
  const metaTitle = "About Us | James & Sons Decorative Lighting Manufacturer";
  const metaDesc =
    "James & Sons is a family-owned manufacturer of premium decorative chandeliers, wall brackets, hanging lamps, and luxury lighting across India.";

  // Update or upsert slug: "about"
  const pageAbout = await prisma.page.upsert({
    where: { slug: "about" },
    update: {
      title,
      content: contentHtml,
      metaTitle,
      metaDescription: metaDesc,
      isPublished: true,
    },
    create: {
      slug: "about",
      title,
      content: contentHtml,
      metaTitle,
      metaDescription: metaDesc,
      isPublished: true,
    },
  });
  console.log(`✅ Upserted About page (slug: "about", ID: ${pageAbout.id})`);

  // Also update or upsert slug: "about-us" for complete URL coverage
  const pageAboutUs = await prisma.page.upsert({
    where: { slug: "about-us" },
    update: {
      title,
      content: contentHtml,
      metaTitle,
      metaDescription: metaDesc,
      isPublished: true,
    },
    create: {
      slug: "about-us",
      title,
      content: contentHtml,
      metaTitle,
      metaDescription: metaDesc,
      isPublished: true,
    },
  });
  console.log(
    `✅ Upserted About page (slug: "about-us", ID: ${pageAboutUs.id})`,
  );
}

updateAboutPage()
  .catch((err) => {
    console.error("Error updating About page:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
