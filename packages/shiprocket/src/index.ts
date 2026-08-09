import {
  IShippingProvider,
  ShippingAddress,
  RateCalculationParams,
  ShippingRateResult,
  CreateShipmentParams,
  ShipmentResult,
} from "@james-andsons/interfaces";

// In-memory token cache for serverless environments
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

export interface IShiprocketConfig {
  email?: string;
  password?: string;
}

export async function getShiprocketToken(config: IShiprocketConfig = {}) {
  const now = Date.now();

  // If we have a valid token (with 5 mins buffer), reuse it
  if (cachedToken && now < tokenExpiryTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  const email = config.email || process.env.SHIPROCKET_EMAIL;
  const password = config.password || process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.error("CRITICAL: Shiprocket credentials missing.");
    return null;
  }

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        cache: "no-store",
      },
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    if (!data?.token) {
      throw new Error("Invalid response format: missing token property");
    }

    cachedToken = data.token;
    tokenExpiryTime = now + 9 * 24 * 60 * 60 * 1000;
    return cachedToken;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[Shiprocket Authentication Exception]:", {
      error: message,
      timestamp: new Date().toISOString(),
    });
    return null;
  }
}

/**
 * Check if a given pincode is serviceable by Shiprocket
 */
export async function checkPincodeServiceability(
  pickupPostcode: string,
  deliveryPostcode: string,
  weightKg: number,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return { status: 0, message: "Logistics service unavailable" };

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weightKg}&cod=0`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (
      data.status === 200 &&
      data.data &&
      data.data.available_courier_companies?.length > 0
    ) {
      const couriers = data.data.available_courier_companies;
      return {
        status: 200,
        serviceable: true,
        estimatedDeliveryDate: couriers[0].etd,
      };
    }

    return {
      status: 404,
      serviceable: false,
      message: "Pincode not serviceable",
    };
  } catch (err) {
    console.error("Shiprocket Serviceability Error:", err);
    return {
      status: 500,
      serviceable: false,
      message: "Logistics check failed",
    };
  }
}

/**
 * Creates a Shiprocket Custom Order
 */
export async function createShiprocketOrder(
  params: any,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/adhoc",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
        cache: "no-store",
      },
    );

    const data = await res.json();

    if (data.status_code === 1 || data.order_id) {
      return {
        success: true,
        orderId: data.order_id,
        order_id: data.order_id,
        shipmentId: data.shipment_id,
        shipment_id: data.shipment_id,
        status: "created",
      };
    }

    return {
      success: false,
      message: data.message || "Failed to create Shiprocket order",
    };
  } catch (err) {
    console.error("createShiprocketOrder Error:", err);
    return { success: false, message: "Failed to create shipment order" };
  }
}

/**
 * Sync a product to the Shiprocket catalog
 */
export async function syncProductToShiprocket(
  product: any,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return [];

  const itemsToSync = [];
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v: any) => {
      itemsToSync.push({
        name: `${product.name} - ${v.name}`,
        sku: v.sku,
        mrp: v.mrp || product.mrp,
        selling_price: v.d2cPrice || product.d2cPrice,
        qty: v.stockQuantity || 0,
        hsn_code: product.hsnCode || "",
        weight: v.weight || product.weight || 0.5,
        length: v.length || product.length || 10,
        breadth: v.breadth || product.breadth || 10,
        height: v.height || product.height || 10,
        category_code: "default",
        type: "Single",
        channel_id: 10319482,
      });
    });
  } else {
    itemsToSync.push({
      name: product.name,
      sku: product.sku,
      mrp: product.mrp,
      selling_price: product.d2cPrice,
      qty: product.stockQuantity || 0,
      hsn_code: product.hsnCode || "",
      weight: product.weight || 0.5,
      length: product.length || 10,
      breadth: product.breadth || 10,
      height: product.height || 10,
      category_code: "default",
      type: "Single",
      channel_id: 10319482,
    });
  }

  const results = [];
  for (const item of itemsToSync) {
    try {
      const res = await fetch(
        "https://apiv2.shiprocket.in/v1/external/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(item),
          cache: "no-store",
        },
      );

      const data = await res.json();
      if (!res.ok) {
        const isSkuTaken =
          data.errors?.sku?.some((msg: string) =>
            msg.includes("already been taken"),
          ) ||
          (typeof data.message === "string" &&
            data.message.includes("already been taken"));
        if (isSkuTaken) {
          console.log(
            `[Shiprocket] SKU ${item.sku} is already registered in Shiprocket catalogue. Skipping sync.`,
          );
        } else {
          console.error(`Shiprocket Sync Failed for SKU ${item.sku}:`, data);
        }
      }
      results.push({ sku: item.sku, success: res.ok, data });
    } catch (err) {
      console.error(`Error syncing SKU ${item.sku}:`, err);
      results.push({ sku: item.sku, success: false, error: err });
    }
  }

  return results;
}

/**
 * Get real-time shipping rates based on pincode and weight
 */
export async function getShippingRates(
  deliveryPincode: string,
  weightKg: number,
  subtotal: number,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return null;

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110001&delivery_postcode=${deliveryPincode}&weight=${weightKg}&cod=0`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (data.status === 200 && data.data?.available_courier_companies) {
      const couriers = data.data.available_courier_companies;
      const firstCourier = couriers[0];
      const rate = firstCourier.rate;
      const city = firstCourier.city || "";
      const state = firstCourier.state || "";

      let finalRate = rate * 1.15; // 15% markup
      if (subtotal > 50000) finalRate = 0;

      return {
        rate: Math.ceil(finalRate),
        etd: firstCourier.etd,
        courierName: firstCourier.courier_name,
        city,
        state,
      };
    }
    return null;
  } catch (err) {
    console.error("getShippingRates Error:", err);
    return null;
  }
}

/**
 * Generate Shipping Label PDF
 */
export async function generateLabel(
  shipmentIds: number[],
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return null;

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/courier/generate/label",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: shipmentIds }),
        cache: "no-store",
      },
    );

    const data = await res.json();
    return data.label_url || null;
  } catch (err) {
    console.error("generateLabel Error:", err);
    return null;
  }
}

/**
 * Generate Shipping Manifest PDF (Courier Pickup Handover)
 */
export async function generateManifest(
  shipmentIds: number[],
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return null;

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/manifests/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: shipmentIds }),
        cache: "no-store",
      },
    );

    const data = await res.json();
    return data.manifest_url || data.url || null;
  } catch (err) {
    console.error("generateManifest Error:", err);
    return null;
  }
}

/**
 * Generate Shiprocket Invoice PDF
 */
export async function generateInvoice(
  orderIds: number[],
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return null;

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/print/invoice",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: orderIds }),
        cache: "no-store",
      },
    );

    const data = await res.json();
    return data.invoice_url || data.url || null;
  } catch (err) {
    console.error("generateInvoice Error:", err);
    return null;
  }
}

/**
 * Request Pickup for shipments
 */
export async function requestPickup(
  shipmentIds: number[],
  pickupDate?: string,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return null;

  try {
    const payload: any = { shipment_id: shipmentIds };
    if (pickupDate) {
      payload.pickup_date = [pickupDate];
    }

    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/courier/generate/pickup",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    return await res.json();
  } catch (err) {
    console.error("requestPickup Error:", err);
    return null;
  }
}

/**
 * Assign an AWB (Tracking Number) to a shipment
 */
export async function assignAWB(
  shipmentId: number,
  courierId?: number | null,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const payload: any = { shipment_id: shipmentId };
    if (courierId) {
      payload.courier_id = courierId;
    }

    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/courier/assign/awb",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (data.status === 200 || data.awb_assign_status === 1) {
      return {
        success: true,
        awb_code: data.response.data.awb_code,
        courier_name: data.response.data.courier_name,
      };
    } else {
      console.error("AWB Assignment Failed:", data);
      let errMsg =
        data.response?.data?.awb_assign_error ||
        data.message ||
        "AWB Assignment failed";
      if (typeof errMsg === "object") {
        errMsg = JSON.stringify(errMsg);
      }
      if (errMsg.includes("Insufficient amount")) {
        errMsg =
          "Insufficient Shiprocket Wallet Balance. Please recharge your Shiprocket wallet balance to generate AWB label.";
      }
      return {
        success: false,
        message: errMsg,
      };
    }
  } catch (err) {
    console.error("assignAWB Error:", err);
    return { success: false, message: "API Call Failed" };
  }
}

/**
 * Cancels a Shiprocket Order by its sales channel order ID
 */
export async function cancelShiprocketOrder(
  channelOrderId: string,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    console.log(
      `[Shiprocket] Searching for order ${channelOrderId} to cancel...`,
    );
    const getRes = await fetch(
      `https://apiv2.shiprocket.in/v1/external/orders?channel_order_id=${channelOrderId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    if (!getRes.ok) {
      const errorData = await getRes.json().catch(() => ({}));
      console.error("Failed to get Shiprocket order details:", errorData);
      return {
        success: false,
        message: "Failed to retrieve order details from Shiprocket",
      };
    }

    const getData = await getRes.json();
    const ordersList: any[] = getData.data || [];
    const orderData = ordersList.find(
      (o: any) =>
        o.channel_order_id === channelOrderId ||
        o.order_id === channelOrderId ||
        String(o.id) === channelOrderId,
    );
    if (!orderData || !orderData.id) {
      console.warn(
        `[Shiprocket] Order ${channelOrderId} not found on Shiprocket. Skipping cancellation.`,
      );
      return {
        success: true,
        message: "Order not found on Shiprocket, nothing to cancel.",
      };
    }

    // Step 1: Trigger courier shipment cancellation if shipment AWB or ID exists
    const shipmentId = orderData.shipment_id || orderData.shipments?.[0]?.id;
    const awbCode = orderData.awb_code || orderData.shipments?.[0]?.awb_code;

    if (awbCode || shipmentId) {
      console.log(
        `[Shiprocket] Sending courier partner cancellation for AWB/Shipment ${awbCode || shipmentId}...`,
      );
      try {
        const shipCancelRes = await fetch(
          "https://apiv2.shiprocket.in/v1/external/orders/cancel/shipment",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(
              awbCode ? { awbs: [awbCode] } : { shipment_id: [shipmentId] },
            ),
            cache: "no-store",
          },
        );
        const shipCancelData = await shipCancelRes.json().catch(() => ({}));
        console.log(
          `[Shiprocket] Shipment cancel response for ${awbCode || shipmentId}:`,
          shipCancelData,
        );
      } catch (shipErr) {
        console.warn(
          "[Shiprocket] Courier shipment cancellation warning:",
          shipErr,
        );
      }
    }

    // Step 2: Cancel Shiprocket Order entry
    console.log(
      `[Shiprocket] Sending cancel request for Shiprocket Order ID ${orderData.id}...`,
    );
    const cancelRes = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/cancel",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [orderData.id] }),
        cache: "no-store",
      },
    );

    const cancelData = await cancelRes.json();
    if (
      cancelRes.ok &&
      (cancelData.status === 200 ||
        cancelData.status_code === 200 ||
        cancelData.success)
    ) {
      console.log(
        `[Shiprocket] Order ${channelOrderId} (ID: ${orderData.id}) cancelled successfully.`,
      );
      return { success: true };
    } else {
      console.error("Failed to cancel Shiprocket order:", cancelData);
      return {
        success: false,
        message: cancelData.message || "Shiprocket order cancellation failed",
      };
    }
  } catch (err: any) {
    console.error("cancelShiprocketOrder Error:", err);
    return { success: false, message: err.message || "API Call Failed" };
  }
}

/**
 * Explicitly cancels an active Shiprocket Shipment/AWB with the courier partner
 */
export async function cancelShiprocketShipment(
  awbOrShipmentId: string | number,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const isNumeric = !isNaN(Number(awbOrShipmentId));
    const payload = isNumeric
      ? { shipment_id: [Number(awbOrShipmentId)] }
      : { awbs: [String(awbOrShipmentId)] };

    console.log(
      `[Shiprocket] Triggering shipment cancellation for AWB/Shipment ${awbOrShipmentId}...`,
    );

    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/cancel/shipment",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        cache: "no-store",
      },
    );

    const data = await res.json().catch(() => ({}));
    if (
      res.ok &&
      (data.status === 200 || data.status_code === 200 || data.success)
    ) {
      return {
        success: true,
        message: data.message || "Shipment cancelled & wallet refund requested",
      };
    }

    return {
      success: false,
      message: data.message || "Shipment cancellation request sent",
    };
  } catch (err: any) {
    console.error("cancelShiprocketShipment Error:", err);
    return { success: false, message: err.message || "API Call Failed" };
  }
}

/**
 * Creates a Shiprocket Reverse (Return) Order
 */
export async function createShiprocketReturnOrder(
  params: any,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/orders/create/return",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (data.status_code === 1 || data.order_id) {
      return {
        success: true,
        order_id: data.order_id,
        shipment_id: data.shipment_id,
      };
    } else {
      console.error("Shiprocket Return Order Failed:", data);
      return { success: false, message: data.message || "Creation failed" };
    }
  } catch (err) {
    console.error("createShiprocketReturnOrder Error:", err);
    return { success: false, message: "API Call Failed" };
  }
}

/**
 * Track a shipment using its AWB
 */
export async function trackShipment(
  awb: string,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${awb}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (data.tracking_data && data.tracking_data.track_status === 1) {
      return { success: true, data: data.tracking_data };
    }
    return { success: false, message: "Tracking data not found" };
  } catch (err) {
    console.error("trackShipment Error:", err);
    return { success: false, message: "API Call Failed" };
  }
}

/**
 * Calculate shipping rates for a pincode
 */
export async function calculateShipping(
  deliveryPincode: string,
  weight: number,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token) return { success: false, rate: 0 };

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${process.env.STORE_PICKUP_PINCODE || "110001"}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=1`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (
      data.status === 200 &&
      data.data.available_courier_companies.length > 0
    ) {
      const rates = data.data.available_courier_companies;
      const cheapest = rates.reduce((prev: any, curr: any) =>
        prev.rate < curr.rate ? prev : curr,
      );
      return { success: true, rate: cheapest.rate };
    }
    return { success: false, rate: 0 };
  } catch (err) {
    console.error("calculateShipping Error:", err);
    return { success: false, rate: 0 };
  }
}

/**
 * Fetches the Shiprocket Wallet Balance details
 */
export async function getWalletBalance(config: IShiprocketConfig = {}) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/account/details/wallet-balance",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (res.ok && data.data) {
      return {
        success: true,
        balance: parseFloat(data.data.balance_amount) || 0,
        data: data.data,
      };
    }
    return {
      success: false,
      message: data.message || "Failed to fetch wallet balance",
    };
  } catch (err: any) {
    console.error("getWalletBalance Error:", err);
    return { success: false, message: err.message || "API Call Failed" };
  }
}

/**
 * Fetches list of pickup locations/warehouses from Shiprocket
 */
export async function getPickupLocations(config: IShiprocketConfig = {}) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/settings/company/pickup",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (res.ok && data.data?.shipping_address) {
      return {
        success: true,
        locations: data.data.shipping_address,
      };
    }
    return {
      success: false,
      message: data.message || "Failed to fetch pickup locations",
    };
  } catch (err: any) {
    console.error("getPickupLocations Error:", err);
    return { success: false, message: err.message || "API Call Failed" };
  }
}

/**
 * Adds a new pickup location (warehouse) in Shiprocket
 */
export async function addPickupLocation(
  params: any,
  config: IShiprocketConfig = {},
) {
  const token = await getShiprocketToken(config);
  if (!token)
    return { success: false, message: "Logistics service unavailable" };

  try {
    const res = await fetch(
      "https://apiv2.shiprocket.in/v1/external/settings/company/addaddress",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(params),
        cache: "no-store",
      },
    );

    const data = await res.json();
    if (res.ok && (data.success || data.address_id || data.data)) {
      return {
        success: true,
        addressId: data.address_id || data.data?.id,
        message: data.message || "Pickup location added successfully",
      };
    }
    return {
      success: false,
      message: data.message || "Failed to add pickup location",
    };
  } catch (err: any) {
    console.error("addPickupLocation Error:", err);
    return { success: false, message: err.message || "API Call Failed" };
  }
}

/**
 * Implement IShippingProvider interface for white-label, swappable configuration
 */
export class ShiprocketProvider implements IShippingProvider {
  private email?: string;
  private password?: string;

  constructor(config: IShiprocketConfig = {}) {
    this.email = config.email || process.env.SHIPROCKET_EMAIL;
    this.password = config.password || process.env.SHIPROCKET_PASSWORD;
  }

  async checkServiceability(pincode: string): Promise<boolean> {
    const res = await checkPincodeServiceability("110001", pincode, 0.5, {
      email: this.email,
      password: this.password,
    });
    return !!res.serviceable;
  }

  async calculateRates(
    params: RateCalculationParams,
  ): Promise<ShippingRateResult> {
    const res = await calculateShipping(
      params.destinationPincode,
      params.weight,
      { email: this.email, password: this.password },
    );
    return {
      success: res.success,
      rate: res.rate,
      error: res.success ? undefined : "No rates found",
    };
  }

  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const orderData = {
      order_id: params.orderId,
      order_date: new Date().toISOString().slice(0, 10),
      pickup_location: params.pickupLocation,
      billing_customer_name:
        params.deliveryAddress.name.split(" ")[0] || "Customer",
      billing_last_name:
        params.deliveryAddress.name.split(" ").slice(1).join(" ") || "Customer",
      billing_address: params.deliveryAddress.addressLine1,
      billing_address_2: params.deliveryAddress.addressLine2 || "",
      billing_city: params.deliveryAddress.city,
      billing_pincode: params.deliveryAddress.pincode,
      billing_state: params.deliveryAddress.state,
      billing_country: params.deliveryAddress.country || "India",
      billing_email: params.deliveryAddress.email || "customer@example.com",
      billing_phone: params.deliveryAddress.phone,
      shipping_is_billing: true,
      order_items: [
        {
          name: "Products Portfolio",
          sku: "MIXED",
          units: 1,
          selling_price: params.subTotal,
          discount: 0,
          tax: 0,
        },
      ],
      payment_method: "Prepaid",
      sub_total: params.subTotal,
      length: 10,
      width: 10,
      height: 10,
      weight: params.weight,
    };

    const res = await createShiprocketOrder(orderData, {
      email: this.email,
      password: this.password,
    });
    return {
      success: res.success,
      shipmentId: res.shipmentId ? String(res.shipmentId) : undefined,
      error: res.message,
      rawResponse: res,
    };
  }
}
