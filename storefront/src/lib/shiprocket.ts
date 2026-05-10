// In-memory token cache for serverless environments
let cachedToken: string | null = null;
let tokenExpiryTime: number = 0;

export async function getShiprocketToken() {
  const now = Date.now();
  
  // If we have a valid token (with 5 mins buffer), reuse it
  if (cachedToken && now < tokenExpiryTime - 5 * 60 * 1000) {
    return cachedToken;
  }

  const email = process.env.SHIPROCKET_EMAIL;
  const password = process.env.SHIPROCKET_PASSWORD;

  if (!email || !password) {
    console.error('CRITICAL: Shiprocket credentials missing from Environment Variables.');
    return null;
  }

  console.log(`Attempting Shiprocket login for: ${email}`);

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      cache: 'no-store'
    });

    if (!res.ok) {
      throw new Error(`Shiprocket auth failed: ${res.statusText}`);
    }

    const data = await res.json();
    cachedToken = data.token;
    
    // Simplistic expiry: assume token is good for 9 days (Shiprocket tokens usually last 10)
    tokenExpiryTime = now + 9 * 24 * 60 * 60 * 1000; 
    
    return cachedToken;
  } catch (err) {
    console.error('getShiprocketToken Error:', err);
    return null;
  }
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
export async function getPickupLocations() {
  const token = await getShiprocketToken();
  if (!token) return null;

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/settings/get/pickup/locations', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch pickup locations:', error);
    return null;
  }
}

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
        console.error(`Shiprocket Sync Failed for SKU ${item.sku}:`, data);
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
    const pickupPincode = process.env.STORE_PICKUP_PINCODE || '202001';
    const res = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weightKg}&cod=0`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store'
      }
    );

    const data = await res.json();
    if (data.status === 200 && data.data?.available_courier_companies) {
      const couriers = data.data.available_courier_companies;
      // Get the cheapest or recommended rate
      const firstCourier = couriers[0];
      const rate = firstCourier.rate;
      
      // Get city/state from the first courier (destination info)
      // Note: Shiprocket returns these in the courier objects
      const city = firstCourier.city || '';
      const state = firstCourier.state || '';

      // Apply custom logic: free shipping over 50k, or add 15% handling margin
      let finalRate = rate * 1.15; // 15% markup
      if (subtotal > 50000) finalRate = 0;

      return {
        rate: Math.ceil(finalRate),
        etd: firstCourier.etd,
        courierName: firstCourier.courier_name,
        city,
        state
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
 * Creates a Shiprocket Reverse (Return) Order
 */
export async function createShiprocketReturnOrder(params: any) {
  const token = await getShiprocketToken();
  if (!token) return { success: false, message: 'Logistics service unavailable' };

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/return', {
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
      console.error('Shiprocket Return Order Failed:', data);
      return { success: false, message: data.message || 'Creation failed' };
    }
  } catch (err) {
    console.error('createShiprocketReturnOrder Error:', err);
    return { success: false, message: 'API Call Failed' };
  }
}

