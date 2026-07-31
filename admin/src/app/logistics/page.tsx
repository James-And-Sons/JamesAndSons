import { prisma } from "../../lib/prisma";
import { getWalletBalance, getPickupLocations } from "../../lib/shiprocket";
import LogisticsDashboardClient from "./LogisticsDashboardClient";

export const dynamic = "force-dynamic";

export default async function LogisticsPage() {
  // Fetch return requests from DB
  const returnRequests = await prisma.returnRequest.findMany({
    include: {
      order: {
        include: {
          user: true,
          items: {
            include: { product: true },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Fetch orders that are processing or shipped to allow NDR testing
  const activeOrders = await prisma.order.findMany({
    where: {
      status: {
        in: ["PROCESSING", "SHIPPED", "DELIVERED", "RETURNED"],
      },
    },
    include: { user: true },
    orderBy: { createdAt: "desc" },
  });

  // Fetch from Shiprocket (using safe defaults if API credentials are mock or missing)
  let walletBalance = 0;
  let pickupLocations: any[] = [];
  let connectionStatus = "DISCONNECTED";

  try {
    const balanceRes = await getWalletBalance();
    if (balanceRes.success) {
      walletBalance = balanceRes.balance ?? 0;
      connectionStatus = "CONNECTED";
    }

    const locationsRes = await getPickupLocations();
    if (locationsRes.success) {
      pickupLocations = locationsRes.locations || [];
      connectionStatus = "CONNECTED";
    }
  } catch (err) {
    console.error("Failed to load Shiprocket logistics info:", err);
  }

  // Format return requests for client components
  const formattedReturns = returnRequests.map((r: any) => ({
    id: r.id,
    orderId: r.orderId,
    orderNumber: r.order.orderNumber,
    customerName: `${r.order.user.firstName} ${r.order.user.lastName}`,
    reason: r.reason,
    status: r.status,
    adminNote: r.adminNote || "",
    awbNumber: r.awbNumber || "",
    shipmentId: r.shipmentId || "",
    labelUrl: r.labelUrl || "",
    fulfillmentError: r.fulfillmentError || "",
    createdAt: r.createdAt,
    items: r.order.items.map((i: any) => ({
      name: i.product.name,
      sku: i.product.sku,
      quantity: i.quantity,
      price: i.unitPrice,
    })),
  }));

  const formattedOrders = activeOrders.map((o: any) => ({
    id: o.id,
    orderNumber: o.orderNumber,
    customerName: `${o.user.firstName} ${o.user.lastName}`,
    status: o.status,
    awbNumber: o.awbNumber || "",
    trackingNumber: o.trackingNumber || "",
    fulfillmentError: o.fulfillmentError || "",
    shippingAddress: o.shippingAddress,
    updatedAt: o.updatedAt,
  }));

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="font-serif text-[32px] md:text-[36px] font-normal text-primary tracking-wide mb-1">
          Logistics Control Center
        </h1>
        <p className="font-body text-muted text-[13px] m-0">
          Manage return shipments, NDR re-attempts, warehouse addresses, and
          real-time Shiprocket rates.
        </p>
      </div>

      <LogisticsDashboardClient
        returns={formattedReturns}
        orders={formattedOrders}
        walletBalance={walletBalance}
        pickupLocations={pickupLocations}
        connectionStatus={connectionStatus}
      />
    </div>
  );
}
