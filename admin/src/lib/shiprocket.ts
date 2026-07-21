import { getShiprocketToken as sharedGetToken } from '@james-andsons/shiprocket';

export async function getShiprocketToken() {
  return sharedGetToken();
}

/**
 * Check if a given pincode is serviceable by Shiprocket
 */
export async function checkPincodeServiceability(pickupPostcode: string, deliveryPostcode: string, weightKg: number) {
  const token = await getShiprocketToken();
  if (!token) return { status: 0, message: 'Logistics service unavailable' };

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPostcode}&delivery_postcode=${deliveryPostcode}&weight=${weightKg}&cod=0`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    );

    const data = await res.json();
    if (data.status === 200 && data.data && data.data.available_courier_companies?.length > 0) {
      // Find the fastest/recommended courier
      const couriers = data.data.available_courier_companies;
      return { 
        status: 200, 
        serviceable: true,
        estimatedDeliveryDate: couriers[0].etd 
      };
    }
    
    return { status: 404, serviceable: false, message: 'Pincode not serviceable' };
  } catch (err) {
    console.error('Shiprocket Serviceability Error:', err);
    return { status: 500, serviceable: false, message: 'Logistics check failed' };
  }
}

/**
 * Creates a Shiprocket Custom Order
 */
export async function createShiprocketOrder(params: any) {
  const token = await getShiprocketToken();
  if (!token) return { success: false, message: 'Logistics service unavailable' };

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify(params),
      cache: 'no-store'
    });

    const data = await res.json();
    
    if (data.status_code === 1 || data.order_id) {
      return { success: true, order_id: data.order_id, shipment_id: data.shipment_id };
    } else {
      console.error('Shiprocket Order Failed:', data);
      return { success: false, message: data.message || 'Creation failed' };
    }
  } catch (err) {
    console.error('createShiprocketOrder Error:', err);
    return { success: false, message: 'API Call Failed' };
  }
}
/**
 * Synchronize a product (and its variants) with Shiprocket's catalogue
 */
export async function syncProductToShiprocket(product: any) {
  const token = await getShiprocketToken();
  if (!token) return { success: false, message: 'Logistics service unavailable' };

  const itemsToSync = [];

  // If product has variants, sync each variant as a separate SKU
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach((v: any) => {
      itemsToSync.push({
        name: `${product.name} - ${v.name}`,
        sku: v.sku,
        mrp: v.mrp || product.mrp,
        selling_price: v.d2cPrice || product.d2cPrice,
        qty: v.stockQuantity || 0,
        hsn_code: product.hsnCode || '',
        weight: v.weight || product.weight || 0.5, 
        length: v.length || product.length || 10, 
        breadth: v.breadth || product.breadth || 10, 
        height: v.height || product.height || 10,
        category_code: "default",
        type: "Single",
        channel_id: 10319482 // Synchronize to the "CUSTOM" channel so it appears in Listings
      });
    });
  } else {
    // Sync the main product
    itemsToSync.push({
      name: product.name,
      sku: product.sku,
      mrp: product.mrp,
      selling_price: product.d2cPrice,
      qty: product.stockQuantity || 0,
      hsn_code: product.hsnCode || '',
      weight: product.weight || 0.5,
      length: product.length || 10, 
      breadth: product.breadth || 10, 
      height: product.height || 10,
      category_code: "default",
      type: "Single",
      channel_id: 10319482
    });
  }

  const results = [];
  for (const item of itemsToSync) {
    try {
      const res = await fetch('https://apiv2.shiprocket.in/v1/external/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(item),
        cache: 'no-store'
      });

      const data = await res.json();
      if (!res.ok) {
        const isSkuTaken = data.errors?.sku?.some((msg: string) => msg.includes('already been taken')) || 
                           (typeof data.message === 'string' && data.message.includes('already been taken'));
        if (isSkuTaken) {
          console.log(`[Shiprocket] SKU ${item.sku} is already registered in Shiprocket catalogue. Skipping sync.`);
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
export async function getShippingRates(deliveryPincode: string, weightKg: number, subtotal: number) {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=110001&delivery_postcode=${deliveryPincode}&weight=${weightKg}&cod=0`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    );

    const data = await res.json();
    if (data.status === 200 && data.data?.available_courier_companies) {
      const couriers = data.data.available_courier_companies;
      // Get the cheapest or recommended rate
      const rate = couriers[0].rate;
      
      // Apply custom logic: free shipping over 50k, or add 15% handling margin
      let finalRate = rate * 1.15; // 15% markup
      if (subtotal > 50000) finalRate = 0;

      return {
        rate: Math.ceil(finalRate),
        etd: couriers[0].etd,
        courierName: couriers[0].courier_name
      };
    }
    return null;
  } catch (err) {
    console.error('getShippingRates Error:', err);
    return null;
  }
}

/**
 * Generate Shipping Label PDF
 */
export async function generateLabel(shipmentIds: number[]) {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ shipment_id: shipmentIds }),
      cache: 'no-store'
    });

    const data = await res.json();
    return data.label_url || null;
  } catch (err) {
    console.error('generateLabel Error:', err);
    return null;
  }
}

/**
 * Request Pickup for shipments
 */
export async function requestPickup(shipmentIds: number[]) {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/pickup', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ shipment_id: shipmentIds }),
      cache: 'no-store'
    });

    return await res.json();
  } catch (err) {
    console.error('requestPickup Error:', err);
    return null;
  }
}

/**
 * Assign an AWB (Tracking Number) to a shipment
 */
export async function assignAWB(shipmentId: number) {
  const token = await getShiprocketToken();
  if (!token) return { success: false, message: 'Logistics service unavailable' };

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ shipment_id: shipmentId }),
      cache: 'no-store'
    });

    const data = await res.json();
    if (data.status === 200 || data.awb_assign_status === 1) {
      return {
        success: true,
        awb_code: data.response.data.awb_code,
        courier_name: data.response.data.courier_name
      };
    } else {
      console.error('AWB Assignment Failed:', data);
      return { success: false, message: data.message || 'AWB Assignment failed' };
    }
  } catch (err) {
    console.error('assignAWB Error:', err);
    return { success: false, message: 'API Call Failed' };
  }
}

/**
 * Cancels a Shiprocket Order by its sales channel order ID (storefront orderNumber)
 */
export async function cancelShiprocketOrder(channelOrderId: string) {
  const token = await getShiprocketToken();
  if (!token) return { success: false, message: 'Logistics service unavailable' };

  try {
    // 1. Fetch Shiprocket order details using channel_order_id to get the Shiprocket internal order ID
    console.log(`[Shiprocket] Searching for order ${channelOrderId} to cancel...`);
    const getRes = await fetch(`https://apiv2.shiprocket.in/v1/external/orders?channel_order_id=${channelOrderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      },
      cache: 'no-store'
    });

    if (!getRes.ok) {
      const errorData = await getRes.json().catch(() => ({}));
      console.error('Failed to get Shiprocket order details:', errorData);
      return { success: false, message: 'Failed to retrieve order details from Shiprocket' };
    }

    const getData = await getRes.json();
    const orderData = getData.data?.find((o: any) => o.order_id === channelOrderId);
    if (!orderData || !orderData.id) {
      console.warn(`[Shiprocket] Order ${channelOrderId} not found on Shiprocket. Skipping cancellation.`);
      return { success: true, message: 'Order not found on Shiprocket, nothing to cancel.' };
    }

    // 2. Call Shiprocket cancel API using the retrieved internal ID
    console.log(`[Shiprocket] Sending cancel request for Shiprocket Order ID ${orderData.id}...`);
    const cancelRes = await fetch('https://apiv2.shiprocket.in/v1/external/orders/cancel', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ ids: [orderData.id] }),
      cache: 'no-store'
    });

    const cancelData = await cancelRes.json();
    if (cancelRes.ok && (cancelData.status === 200 || cancelData.status_code === 200 || cancelData.success)) {
      console.log(`[Shiprocket] Order ${channelOrderId} (ID: ${orderData.id}) cancelled successfully.`);
      return { success: true };
    } else {
      console.error('Failed to cancel Shiprocket order:', cancelData);
      return { success: false, message: cancelData.message || 'Shiprocket order cancellation failed' };
    }
  } catch (err: any) {
    console.error('cancelShiprocketOrder Error:', err);
    return { success: false, message: err.message || 'API Call Failed' };
  }
}


