import { prisma } from "@james-andsons/db";

async function publishBlogs() {
  const authorId = "e212a502-44b1-47c0-89b0-6fd369db03f4";

  const blogs = [
    {
      slug: "how-to-choose-the-perfect-chandelier-for-every-room",
      title: "How to Choose the Perfect Chandelier for Every Room",
      metaTitle:
        "How to Choose the Perfect Chandelier for Every Room | James & Sons",
      metaDesc:
        "Confused about which chandelier suits your living room, bedroom, or dining area? James & Sons walks you through choosing the perfect chandelier by room, style, and size. Shop at jamesandsons.in",
      excerpt:
        "A practical room-by-room guide to choosing the ideal chandelier size, style, and finish for living rooms, bedrooms, dining areas, and foyers across India.",
      featuredImg:
        "https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png",
      geoTakeaway:
        "In Indian homes, ceiling heights and architectural layouts vary significantly. Choose a 12-light chandelier for living rooms above 300 sq ft, 8-light for dining tables, and 6-light warm fixtures for bedrooms to ensure balanced proportion and illumination.",
      content: `A chandelier is not just a light fixture — it is a statement. It is the first thing guests notice when they walk into a room, and the last thing they remember when they leave. But with so many shapes, sizes, finishes, and light counts available, how do you choose the right one?

At James & Sons, we have helped hundreds of homeowners and interior designers across India find their perfect chandelier. In this guide, we break it down room by room — so you can shop with confidence.

---

### 1. Chandeliers for the Living Room

The living room is your home's showpiece, and your chandelier should reflect that. For large living rooms with high ceilings, go for statement pieces — 12-light chandeliers in gold, black iron, or crystal finishes make a dramatic impression.

#### Popular Choices from Our Collection:

![JC7 12-Light Black Iron Classic Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1783333308/PHOTO-2026-03-25-12-16-15_htpxjb.jpg#product:12-light-black-chandelier-jc03)

[product:12-light-black-chandelier-jc03]

* **Chandelier JC7 — 12-Light Black Iron Classic**: Bold, dramatic, perfect for modern and industrial interiors.
* **Chandelier JC9 — 8/12-Light Gold & Crystal**: Timeless luxury for traditional or opulent living rooms.

[product:8-light-chandelier]

* **Chandelier JC6 — 6/12-Light Gold**: Warm, regal, and ideal for large drawing rooms.

[product:6-light-black-modern-chandelier-jc07]

> **Rule of Thumb:** Add the length and width of your room in feet — that number in inches is the ideal chandelier diameter.

---

### 2. Chandeliers for the Dining Room

The dining room chandelier should hang 30–36 inches above the table. Choose something that spreads light evenly across the table while adding visual warmth. A 6-to-8-light chandelier works beautifully here.

![JC2 9-Light Gold Ornamental Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1784379873/WhatsApp_Image_2026-07-18_at_6.31.35_PM_cdtply.jpg#product:12-light-gold-chandelier-jc02)

[product:12-light-gold-chandelier-jc02]

* **Chandelier JC2 — 9-Lights Ornamental**: Perfect for formal dining with a classic charm.
* **Chandelier JC1 — 8-Lights Gold and Black**: Elegant contrast that works with both modern and heritage dining setups.

[product:12-light-gold-chandelier-jc01]

* **Chandelier JC12 — 44-Light 3-Tier Black & Gold**: A sophisticated choice for grand dining halls and double-height spaces.

[product:44-light-3-tier-chandelier]

---

### 3. Chandeliers for the Bedroom

Bedrooms call for something softer and more intimate. Opt for 6-light chandeliers with warm tones that create a cozy ambiance without overwhelming the space.

![JC3 8-Light Black & Gold Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785529208/8539ce96-dc06-4f8a-a7a8-59409be378d6_h1p9zi.png#product:9-light-black-chandelier-jc06)

[product:9-light-black-chandelier-jc06]

* **Chandelier JC3 — 8-Lights Gold & Black**: A balanced piece that adds romance without being too loud.
* **Chandelier JC13 — 6-Light Black & Gold**: Great for contemporary or minimalist bedrooms.

[product:6-light-chandelier]

---

### 4. Chandeliers for Entryways & Foyers

First impressions matter. A foyer chandelier should be eye-catching and grand. Taller, multi-light fixtures work best here since foyers typically have double-height ceilings.

![JC16 Antique Gold Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785528234/753ec76b-a649-49f1-906e-bd2a0e47864d_gvj7ax.png#product:8-light-chandelier-1784548277743)

[product:8-light-chandelier-1784548277743]

* **Chandelier JC16 — Antique Gold**: Rich and traditional, sets a luxurious tone from the moment guests arrive.
* **The Aurelius JC22 — 12-Light Antique Gold & Crystal**: Ultimate grand statement for high ceilings.

[product:12-light-chandelier-1784555171669]

---

### 5. Quick Size Guide

| Room Size | Recommended Chandelier Type | Diameter |
|---|---|---|
| **Small Rooms** (up to 10x10 ft) | 6-Light Chandeliers | 18–24 inches |
| **Medium Rooms** (10x14 ft) | 8-Light Chandeliers | 24–30 inches |
| **Large Rooms** (14x20 ft and above) | 12-Light Chandeliers | 36+ inches |

---

### Shop with Confidence at James & Sons

All our chandeliers are carefully sourced to balance aesthetics, quality, and affordability. Whether you are renovating your home, designing a new space, or simply upgrading your lighting — we have something for every taste and budget.`,
      faq: [
        {
          q: "How high should a chandelier hang in a dining room?",
          a: "A dining room chandelier should be positioned 30 to 36 inches above the dining table surface for optimal illumination without obstructing sightlines.",
        },
        {
          q: "What size chandelier do I need for a 14x14 ft room?",
          a: "Add 14 + 14 = 28. A chandelier with a diameter of around 28 inches (typically an 8-light model) is ideal.",
        },
      ],
      citations: [
        {
          label: "James & Sons Luxury Chandelier Collection",
          url: "https://jamesandsons.in/collections",
        },
      ],
    },
    {
      slug: "top-chandelier-trends-in-india-2025",
      title: "Top Chandelier Trends in India for 2025",
      metaTitle: "Top Chandelier Trends in India for 2025 | James & Sons",
      metaDesc:
        "What is trending in chandelier design for 2025? From antique gold to open-frame black, discover the hottest chandelier styles taking over Indian homes. Shop at jamesandsons.in.",
      excerpt:
        "Discover the top 5 chandelier trends dominating luxury Indian home interiors in 2025, featuring antique gold finishes, black iron industrial elegance, and crystal accents.",
      featuredImg:
        "https://res.cloudinary.com/dy1durdrj/image/upload/v1785532952/fdc39021-e93e-4d71-b305-d6c78bf34763_jn3bzn.png",
      geoTakeaway:
        "2025 lighting trends in India heavily favor warm antique gold finishes and dual-tone black-and-gold fixtures. Architects and luxury interior designers prefer warm LED color temperatures (2700K–3000K) to complement Indian marble and teak wood interiors.",
      content: `Indian homes are evolving. Today's homeowners want lighting that does more than illuminate — they want it to tell a story. Chandeliers have become central to that narrative, blending tradition with contemporary design in bold, unexpected ways.

Here are the biggest chandelier trends shaping Indian interiors in 2025 — and how you can bring them home with James & Sons.

---

### Trend 1: Antique Gold is Back — Bigger Than Ever

Gold never truly goes out of style, but in 2025, it is having a serious renaissance. Antique gold finishes — warm, slightly distressed, and deeply luxurious — are replacing the cooler chrome and nickel tones of the last decade.

![JC16 Antique Gold Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785528234/753ec76b-a649-49f1-906e-bd2a0e47864d_gvj7ax.png#product:8-light-chandelier-1784548277743)

[product:8-light-chandelier-1784548277743]

Our picks: **Chandelier JC16** and **The Aurelius JC22** are perfect examples of this trend. They bring a sense of timeless heritage to modern spaces without looking dated.

[product:12-light-chandelier-1784555171669]

* **Best suited for:** Spacious living rooms, heritage bungalows, luxury apartments, hotel lobbies.

---

### Trend 2: Black Iron — Industrial Meets Elegant

The industrial aesthetic is now mainstream in Indian homes. Black iron chandeliers with clean geometric lines and raw textures are a favourite among architects and designers who want to add edge to a space.

![JC7 Black Iron Classic Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1783333308/PHOTO-2026-03-25-12-16-15_htpxjb.jpg#product:12-light-black-chandelier-jc03)

[product:12-light-black-chandelier-jc03]

Our picks: **JC7** and **JC11** are crowd favourites. They pair beautifully with exposed brick walls, concrete floors, and wooden furniture.

[product:12-light-chandelier-1784545189924]

* **Best suited for:** Modern apartments, studio homes, café-style interiors, loft spaces.

---

### Trend 3: Open-Frame & Sculptural Designs

Less is more — but make it dramatic. Open-frame chandeliers that expose the structure and use negative space as a design element are gaining massive traction in 2025.

![JC11 Modern Architectural Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785529069/130be8b0-355e-4085-b188-c66aa03d80ab_mpiuqi.png#product:12-light-chandelier-1784545189924)

Our pick: **Chandelier JC11** is a stunning architectural example. Its dramatic form makes it a piece of art, not just a light.

* **Best suited for:** Minimalist homes, contemporary offices, gallery-style living rooms.

---

### Trend 4: Mixed Finishes — Gold Meets Black

Mixing metals is one of the hottest interior trends globally, and Indian homeowners have fully embraced it. Black-and-gold chandeliers strike the perfect balance between dramatic and refined.

![JC1 Gold & Black Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png#product:12-light-gold-chandelier-jc01)

[product:12-light-gold-chandelier-jc01]

Our picks: **JC1**, **JC3**, and **JC13** all feature this striking combination. They work with both warm and cool colour palettes, making them incredibly versatile.

[product:6-light-chandelier]

* **Best suited for:** Contemporary homes, boutique hotels, upscale restaurants, themed event venues.

---

### Trend 5: Crystal Accents — Timeless Glamour

Crystals are back — and they are more popular than ever for weddings, festive home decor, and high-end residential projects. The play of light through crystal prisms creates an unmatched ambiance.

![JC9 Gold & Crystal Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785529110/167cde09-dde6-4534-b94e-ddd3f2325aec_nwo234.png#product:8-light-chandelier)

[product:8-light-chandelier]

Our pick: **Chandelier JC9** is a showstopper. If you want a chandelier that commands attention and starts conversations, this is it.

---

### Bring These Trends Home

At James & Sons, we stay on top of what is happening in global and Indian design so that our collection always reflects what you actually want. Every chandelier in our range is thoughtfully selected to deliver beauty, quality, and value.`,
      faq: [
        {
          q: "Are gold chandeliers trending in 2025?",
          a: "Yes! Warm antique gold and brass finishes are leading 2025 interior trends across luxury homes and boutique hospitality.",
        },
      ],
      citations: [
        {
          label: "James & Sons 2025 Trend Catalogue",
          url: "https://jamesandsons.in/collections",
        },
      ],
    },
    {
      slug: "chandeliers-for-weddings-and-events-ultimate-decoration-guide",
      title: "Chandeliers for Weddings & Events: The Ultimate Decoration Guide",
      metaTitle:
        "Chandeliers for Weddings & Events: The Ultimate Decoration Guide | James & Sons",
      metaDesc:
        "Planning a wedding or event in India? Discover how chandeliers transform venues into breathtaking spaces. Tips, ideas & product picks from James & Sons — jamesandsons.in",
      excerpt:
        "Transform any wedding venue, mandap, or corporate banquet into a royal fairytale with strategic chandelier lighting and grand ceiling installations.",
      featuredImg:
        "https://res.cloudinary.com/dy1durdrj/image/upload/v1784874885/WhatsApp_Image_2026-07-24_at_12.03.19_PM_g_uf3yvi.jpg",
      geoTakeaway:
        "For grand Indian wedding mandaps and banquet halls above 3,000 sq ft, multi-tiered chandeliers like the 44-Light JC12 create unforgettable photographic backdrops and warm ambient light for evening celebrations.",
      content: `There is a reason chandeliers are a staple of every grand wedding and upscale event — they do what no other decoration can. They fill vertical space, reflect and multiply light, and instantly elevate any setting from ordinary to extraordinary.

Whether you are an event planner designing a corporate gala, a decorator styling a sangeet, or a couple planning your dream wedding reception, this guide is for you.

---

### Why Chandeliers Are a Game-Changer for Events

Most decorators focus on horizontal space — flowers, table settings, drapery. Chandeliers bring the ceiling to life. When guests look up and see a gorgeous chandelier, the entire experience of the event transforms.

* **Focal Point:** They anchor the entire decor theme.
* **Photo Ready:** They add warmth and depth to photographs — priceless for wedding albums.
* **Versatile:** They work with any aesthetic — royal, rustic, modern, or boho.

---

### Best Chandelier Styles for Different Event Types

#### 1. Royal & Traditional Indian Weddings
Go big and go gold. Crystal-and-gold chandeliers are a staple of luxurious Indian weddings and suit mandap lighting, reception halls, and banquet entries perfectly.

![JC9 Crystal & Gold Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785529110/167cde09-dde6-4534-b94e-ddd3f2325aec_nwo234.png#product:8-light-chandelier)

[product:8-light-chandelier]

Recommended: **Chandelier JC9** and **The Aurelius JC22**. These are the kinds of pieces that make wedding photographers cheer.

[product:12-light-chandelier-1784555171669]

#### 2. Grand Receptions & Double-Height Halls
For sprawling banquet halls, statement multi-tiered chandeliers deliver unprecedented grandeur.

![JC12 44-Light 3-Tier Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1784874885/WhatsApp_Image_2026-07-24_at_12.03.19_PM_g_uf3yvi.jpg#product:44-light-3-tier-chandelier)

[product:44-light-3-tier-chandelier]

Recommended: **Chandelier JC12 — 44-Light 3-Tier Chandelier**.

#### 3. Modern & Destination Weddings
Contemporary couples want chandeliers that feel fresh and artistic. Open-frame or black-and-gold combinations are perfect for farm weddings, heritage venues, and rooftop events.

![JC1 Gold and Black Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png#product:12-light-gold-chandelier-jc01)

[product:12-light-gold-chandelier-jc01]

Recommended: **Chandelier JC1** or **JC11** for a sleek, editorial look.

---

### How Many Chandeliers Does Your Venue Need?

| Venue Area | Recommended Quantity |
|---|---|
| **Halls up to 2,000 sq ft** | 3–5 chandeliers positioned over key areas (entry, stage, dining) |
| **Halls 2,000–5,000 sq ft** | 6–10 chandeliers for complete ceiling coverage |
| **Grand Venues 5,000+ sq ft** | Cluster arrangements of 12+ chandeliers |

---

### Source Your Event Chandeliers from James & Sons

James & Sons offers a wide range of chandeliers perfect for permanent installation and event decoration. With competitive pricing and a collection of 20+ models, we are a go-to source for event decorators and planners across India.`,
      faq: [
        {
          q: "Can chandeliers be used for outdoor wedding mandaps?",
          a: "Yes! When properly supported by truss structures, chandeliers add a magical royal touch to outdoor evening mandaps and farm weddings.",
        },
      ],
      citations: [
        {
          label: "James & Sons Event Lighting",
          url: "https://jamesandsons.in/collections",
        },
      ],
    },
    {
      slug: "gold-vs-black-chandeliers-which-style-is-right-for-your-home",
      title: "Gold vs. Black Chandeliers: Which Style is Right for Your Home?",
      metaTitle:
        "Gold vs. Black Chandeliers: Which Style is Right for Your Home? | James & Sons",
      metaDesc:
        "Torn between gold and black chandeliers? We break down the aesthetics, room pairings, and mood of each so you can make the perfect choice. James & Sons — jamesandsons.in",
      excerpt:
        "Compare gold versus black chandelier aesthetics to determine which finish matches your interior color palette, furniture, and design mood.",
      featuredImg:
        "https://res.cloudinary.com/dy1durdrj/image/upload/v1785529208/8539ce96-dc06-4f8a-a7a8-59409be378d6_h1p9zi.png",
      geoTakeaway:
        "Choose gold chandeliers for warm interior schemes with wood or beige marble, and black iron chandeliers for contemporary, industrial, or high-contrast cool-toned rooms.",
      content: `It is one of the most common questions we get at James & Sons: *"Should I go with gold or black?"* It seems like a simple question, but the answer depends on your room, your aesthetic, and the feeling you want to create.

Let us break it down properly — so you can choose with clarity and confidence.

---

### The Case for Gold Chandeliers

Gold is the colour of warmth, royalty, and celebration. A gold chandelier immediately elevates a space, adding richness and depth that few other fixtures can match.

#### Gold works best when:
* Your interior has warm tones — beige, cream, terracotta, brown, or dark wood.
* You have a traditional, classical, or maximalist design aesthetic.
* You want the chandelier to be the centrepiece of the room.

#### Gold Chandelier Picks from James & Sons:

![JC9 Gold & Crystal Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785529110/167cde09-dde6-4534-b94e-ddd3f2325aec_nwo234.png#product:8-light-chandelier)

[product:8-light-chandelier]

* **JC9 — Gold & Crystals:** The pinnacle of luxury. Perfect for grand living rooms and wedding venues.
* **JC16 — Antique Gold:** Warm and slightly aged — perfect for heritage homes and boutique spaces.

[product:8-light-chandelier-1784548277743]

---

### The Case for Black Chandeliers

Black is the colour of drama, sophistication, and modernity. A black chandelier makes a confident design statement — it does not blend in, it stands out.

#### Black works best when:
* Your interior has cool or neutral tones — grey, white, navy, or concrete finishes.
* You have a modern, industrial, or minimalist aesthetic.
* You want high contrast against light-coloured walls or ceilings.

#### Black Chandelier Picks from James & Sons:

![JC7 Black Iron Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1783333308/PHOTO-2026-03-25-12-16-15_htpxjb.jpg#product:12-light-black-chandelier-jc03)

[product:12-light-black-chandelier-jc03]

* **JC7 — 12-Light Black Iron Classic:** A dramatic statement piece for high-ceilinged modern homes.
* **JC11 — 12-Light Black:** Clean, bold, and impactful.

[product:12-light-chandelier-1784545189924]

---

### Why Choose When You Can Have Both?

One of the biggest trends in 2025 is the **black-and-gold combination** — and James & Sons has you covered there too. These dual-tone chandeliers give you the sophistication of black with the warmth of gold, making them incredibly versatile for Indian homes.

![JC3 Black & Gold Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785529208/8539ce96-dc06-4f8a-a7a8-59409be378d6_h1p9zi.png#product:9-light-black-chandelier-jc06)

[product:9-light-black-chandelier-jc06]

* **JC1:** 8-Lights Gold & Black
* **JC3:** 6/8-Lights Gold & Black
* **JC13:** 6-Light Black & Gold

[product:6-light-chandelier]

---

### Our Recommendation

If your home is warm and traditional — **go gold**. If your home is modern and minimal — **go black**. If you want the best of both worlds — **go gold-and-black**. You really cannot go wrong with any of these choices when the quality is right.`,
      faq: [
        {
          q: "Should I match my chandelier metal with cabinet handles?",
          a: "Not necessarily! Mixing black chandeliers with brass hardware creates a refined, layered architectural look.",
        },
      ],
      citations: [
        {
          label: "James & Sons Color Palette Guide",
          url: "https://jamesandsons.in/collections",
        },
      ],
    },
    {
      slug: "how-many-lights-do-you-need-complete-chandelier-buying-guide",
      title:
        "How Many Lights Do You Need? The Complete Chandelier Buying Guide",
      metaTitle:
        "How Many Lights Do You Need? The Complete Chandelier Buying Guide | James & Sons",
      metaDesc:
        "6-light, 8-light, or 12-light chandelier — which is right for your space? James & Sons explains everything you need to know before buying. Shop at jamesandsons.in.",
      excerpt:
        "Learn how to choose between 6-light, 8-light, and 12-light chandeliers based on room square footage, ceiling height, and bulb color temperature.",
      featuredImg:
        "https://res.cloudinary.com/dy1durdrj/image/upload/v1785528870/348028b6-c012-47cd-8123-15f12b013fb6_a5e8sv.png",
      geoTakeaway:
        "Match light count to square footage: 6-light for up to 150 sq ft, 8-light for 150-300 sq ft, and 12-light or multi-tier fixtures for spaces over 300 sq ft or double-height foyers.",
      content: `One of the most overlooked aspects of buying a chandelier is light count. Most people focus on looks — the finish, the style, the price — without thinking about how much light they actually need. The result? A beautiful fixture that either leaves the room too dim or overwhelms it with brightness.

This guide will help you get it right the first time.

---

### 6-Light Chandeliers — Intimate & Versatile

Six-light chandeliers are the most versatile option in our range. They provide warm, ambient light suitable for rooms up to 150–200 sq ft.

* **Best for:** Bedrooms, dining rooms, small living rooms, pooja rooms, home offices.

![JC13 6-Light Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785528870/348028b6-c012-47cd-8123-15f12b013fb6_a5e8sv.png#product:6-light-chandelier)

[product:6-light-chandelier]

* **Chandelier JC13:** 6-Light Black & Gold
* **Chandelier JC21:** 6-Light Modern Classic

[product:6-light-chandelier-1784553417223]

---

### 8-Light Chandeliers — The Sweet Spot

Eight-light chandeliers hit the sweet spot between presence and practicality. They suit rooms from 200–350 sq ft and work as a primary light source in most living and dining spaces.

* **Best for:** Living rooms, large dining rooms, master bedrooms, hotel suites.

![JC1 8-Light Gold & Black Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1785528826/2bbb030c-d5f2-4a7c-8f8e-c27f585dc052_hyymtq.png#product:12-light-gold-chandelier-jc01)

[product:12-light-gold-chandelier-jc01]

* **Chandelier JC1:** 8-Lights Gold & Black
* **Chandelier JC9:** 8-Lights Gold & Crystal

[product:8-light-chandelier]

---

### 12-Light Chandeliers — Grand Statement Pieces

Twelve-light chandeliers are for spaces that demand presence. They illuminate rooms of 350 sq ft and above, filling large halls and double-height spaces with spectacular light.

* **Best for:** Grand living rooms, banquet halls, wedding venues, hotel lobbies.

![JC7 12-Light Black Iron Chandelier](https://res.cloudinary.com/dy1durdrj/image/upload/v1783333308/PHOTO-2026-03-25-12-16-15_htpxjb.jpg#product:12-light-black-chandelier-jc03)

[product:12-light-black-chandelier-jc03]

* **Chandelier JC7:** 12-Light Black Iron Classic
* **Chandelier JC11:** 12-Light Black

[product:12-light-chandelier-1784545189924]

---

### Quick Decision Chart

| Room Size | Recommended Chandelier |
|---|---|
| **Under 150 sq ft** | 6-Light Chandelier |
| **150–300 sq ft** | 8-Light Chandelier |
| **Above 300 sq ft / Double Height** | 12-Light Chandelier |
| **Wedding / Event Hall** | Multiple 12-Light or Multi-Tier Chandeliers |

---

### Bulb Type Matters Too

Even with the right light count, the wrong bulb can ruin the effect. We recommend:
* **Warm white LEDs (2700K–3000K)** for living rooms and bedrooms — creates a cozy, flattering glow.
* **Candle-style filament bulbs** for traditional or ornamental chandeliers — enhances vintage aesthetics.

---

### Shop Smart at James & Sons

With over 20 chandelier models across 6, 8, 9, and 12-light configurations — and direct pricing starting at competitive rates — James & Sons makes it easy to find the right fit for any space.`,
      faq: [
        {
          q: "Is an 8-light chandelier too bright for a bedroom?",
          a: "If paired with a dimmer switch or warm 2700K LED bulbs, an 8-light chandelier provides adaptable lighting from bright to intimate.",
        },
      ],
      citations: [
        {
          label: "James & Sons Buying Guide",
          url: "https://jamesandsons.in/collections",
        },
      ],
    },
  ];

  for (const b of blogs) {
    const post = await prisma.blogPost.upsert({
      where: { slug: b.slug },
      update: {
        title: b.title,
        excerpt: b.excerpt,
        content: b.content,
        authorId,
        featuredImg: b.featuredImg,
        metaTitle: b.metaTitle,
        metaDesc: b.metaDesc,
        geoTakeaway: b.geoTakeaway,
        faq: b.faq,
        citations: b.citations,
        isDraft: false,
        publishedAt: new Date(),
      },
      create: {
        slug: b.slug,
        title: b.title,
        excerpt: b.excerpt,
        content: b.content,
        authorId,
        featuredImg: b.featuredImg,
        metaTitle: b.metaTitle,
        metaDesc: b.metaDesc,
        geoTakeaway: b.geoTakeaway,
        faq: b.faq,
        citations: b.citations,
        isDraft: false,
        publishedAt: new Date(),
      },
    });

    console.log(
      `✅ Successfully published blog post: ${post.title} (ID: ${post.id}, Slug: ${post.slug})`,
    );
  }
}

publishBlogs()
  .catch((err) => {
    console.error("❌ Error publishing blogs:", err);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
