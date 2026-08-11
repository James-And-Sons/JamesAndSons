import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (!q || q.length < 2) {
      return NextResponse.json({
        products: [],
        categories: [],
        spaces: [],
        blogs: [],
        userOrders: [],
        userTickets: [],
        userRfqs: [],
      });
    }

    // Authenticate user to fetch account specific records (Orders, Tickets, RFQs)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Query Catalog Products, Categories, Spaces, and Blogs
    const catalogPromises = Promise.all([
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { sku: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { category: { name: { contains: q, mode: "insensitive" } } },
          ],
        },
        take: 10,
        select: {
          id: true,
          name: true,
          slug: true,
          sku: true,
          images: true,
          mrp: true,
          d2cPrice: true,
          b2bPrice: true,
          stockQuantity: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      }),

      prisma.category.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      }),

      prisma.space.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 4,
        select: {
          id: true,
          name: true,
          slug: true,
          image: true,
        },
      }),

      prisma.blogPost.findMany({
        where: {
          isDraft: false,
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { excerpt: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 3,
        select: {
          id: true,
          title: true,
          slug: true,
          featuredImg: true,
          publishedAt: true,
        },
      }),
    ]);

    // Query User Account Specific Records if Authenticated
    let userSpecificPromise = Promise.resolve<{
      userOrders: any[];
      userTickets: any[];
      userRfqs: any[];
    }>({ userOrders: [], userTickets: [], userRfqs: [] });

    if (user) {
      userSpecificPromise = (async () => {
        const dbUser = await prisma.user.findFirst({
          where: { OR: [{ id: user.id }, { email: user.email }] },
          select: { id: true },
        });

        const userIdToQuery = dbUser?.id || user.id;

        const [orders, tickets, rfqs] = await Promise.all([
          prisma.order.findMany({
            where: {
              userId: userIdToQuery,
              OR: [
                { orderNumber: { contains: q, mode: "insensitive" } },
                { trackingNumber: { contains: q, mode: "insensitive" } },
                {
                  items: {
                    some: {
                      product: {
                        name: { contains: q, mode: "insensitive" },
                      },
                    },
                  },
                },
              ],
            },
            take: 4,
            select: {
              id: true,
              orderNumber: true,
              status: true,
              totalAmount: true,
              createdAt: true,
            },
          }),
          prisma.ticket.findMany({
            where: {
              userId: userIdToQuery,
              OR: [
                { ticketNumber: { contains: q, mode: "insensitive" } },
                { subject: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            },
            take: 4,
            select: {
              id: true,
              ticketNumber: true,
              subject: true,
              status: true,
              createdAt: true,
            },
          }),
          prisma.rFQ.findMany({
            where: {
              userId: userIdToQuery,
              OR: [
                { rfqNumber: { contains: q, mode: "insensitive" } },
                { projectName: { contains: q, mode: "insensitive" } },
              ],
            },
            take: 4,
            select: {
              id: true,
              rfqNumber: true,
              projectName: true,
              status: true,
            },
          }),
        ]);

        return {
          userOrders: orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            title: `Order #${o.orderNumber}`,
            subtitle: `${o.status.toUpperCase()} · ${new Date(
              o.createdAt,
            ).toLocaleDateString("en-IN")}`,
            url: `/account/orders`,
            amount: o.totalAmount,
          })),
          userTickets: tickets.map((t) => ({
            id: t.id,
            ticketNumber: t.ticketNumber,
            title: `Ticket #${t.ticketNumber}: ${t.subject}`,
            subtitle: `Status: ${t.status.toUpperCase()}`,
            url: `/account/tickets`,
          })),
          userRfqs: rfqs.map((r) => ({
            id: r.id,
            rfqNumber: r.rfqNumber,
            title: `Trade RFQ #${r.rfqNumber}`,
            subtitle: r.projectName
              ? `Project: ${r.projectName}`
              : `Status: ${r.status}`,
            url: `/account/rfqs`,
          })),
        };
      })();
    }

    const [[products, categories, spaces, blogs], userData] = await Promise.all(
      [catalogPromises, userSpecificPromise],
    );

    // Format products
    const formattedProducts = products.map((p) => {
      const primaryImage =
        Array.isArray(p.images) && p.images.length > 0 ? p.images[0] : null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug || p.id,
        sku: p.sku,
        price: p.d2cPrice || p.mrp || 0,
        mrp: p.mrp,
        imageUrl: primaryImage,
        categoryName: p.category?.name || "Catalog",
        inStock: (p.stockQuantity || 0) > 0,
        b2bPrice: p.b2bPrice,
      };
    });

    return NextResponse.json(
      {
        products: formattedProducts,
        categories: categories.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          imageUrl: c.image,
          url: `/collections?category=${c.slug}`,
        })),
        spaces: spaces.map((s) => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          imageUrl: s.image,
          url: `/spaces?space=${s.slug}`,
        })),
        blogs: blogs.map((b) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          imageUrl: b.featuredImg,
          url: `/blog/${b.slug}`,
        })),
        userOrders: userData.userOrders,
        userTickets: userData.userTickets,
        userRfqs: userData.userRfqs,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=10, s-maxage=30",
        },
      },
    );
  } catch (error: any) {
    console.error("Error in GET /api/search:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search catalog" },
      { status: 500 },
    );
  }
}
