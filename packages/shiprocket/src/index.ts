import { IShippingProvider, ShippingAddress, RateCalculationParams, ShippingRateResult, CreateShipmentParams, ShipmentResult } from '@james-andsons/interfaces';

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
    console.error('CRITICAL: Shiprocket credentials missing.');
    return null;
  }

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
export async function checkPincodeServiceability(
  pickupPostcode: string,
  deliveryPostcode: string,
  weightKg: number,
  config: IShiprocketConfig = {}
) {
  const token = await getShiprocketToken(config);
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
export async function createShiprocketOrder(params: any, config: IShiprocketConfig = {}) {
  const token = await getShiprocketToken(config);
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
      return {
        success: true,
        orderId: data.order_id,
        shipmentId: data.shipment_id,
        status: 'created'
      };
    }

    return {
      success: false,
      message: data.message || 'Failed to create Shiprocket order'
    };
  } catch (err) {
    console.error('createShiprocketOrder Error:', err);
    return { success: false, message: 'Failed to create shipment order' };
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
    const res = await checkPincodeServiceability("110001", pincode, 0.5, { email: this.email, password: this.password });
    return !!res.serviceable;
  }

  async calculateRates(params: RateCalculationParams): Promise<ShippingRateResult> {
    const token = await getShiprocketToken({ email: this.email, password: this.password });
    if (!token) return { success: false, error: 'Logistics service unavailable' };

    try {
      const res = await fetch(
        `https://apiv2.shiprocket.in/v1/external/courier/serviceability/?pickup_postcode=${params.originPincode}&delivery_postcode=${params.destinationPincode}&weight=${params.weight}&cod=0`,
        {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store'
        }
      );
      const data = await res.json();
      if (data.status === 200 && data.data && data.data.available_courier_companies?.length > 0) {
        const rate = data.data.available_courier_companies[0].rate;
        return { success: true, rate };
      }
      return { success: false, error: 'Pincode not serviceable' };
    } catch (e: any) {
      return { success: false, error: e.message || 'Rate calculation failed' };
    }
  }

  async createShipment(params: CreateShipmentParams): Promise<ShipmentResult> {
    const orderData = {
      order_id: params.orderId,
      order_date: new Date().toISOString().slice(0, 10),
      pickup_location: params.pickupLocation,
      billing_customer_name: params.deliveryAddress.name.split(' ')[0] || 'Customer',
      billing_last_name: params.deliveryAddress.name.split(' ').slice(1).join(' ') || 'Customer',
      billing_address: params.deliveryAddress.addressLine1,
      billing_address_2: params.deliveryAddress.addressLine2 || '',
      billing_city: params.deliveryAddress.city,
      billing_pincode: params.deliveryAddress.pincode,
      billing_state: params.deliveryAddress.state,
      billing_country: params.deliveryAddress.country || 'India',
      billing_email: params.deliveryAddress.email || 'customer@example.com',
      billing_phone: params.deliveryAddress.phone,
      shipping_is_billing: true,
      order_items: [
        {
          name: 'Products Portfolio',
          sku: 'MIXED',
          units: 1,
          selling_price: params.subTotal,
          discount: 0,
          tax: 0,
        }
      ],
      payment_method: 'Prepaid',
      sub_total: params.subTotal,
      length: 10,
      width: 10,
      height: 10,
      weight: params.weight
    };

    const res = await createShiprocketOrder(orderData, { email: this.email, password: this.password });
    return {
      success: res.success,
      shipmentId: res.shipmentId ? String(res.shipmentId) : undefined,
      error: res.message,
      rawResponse: res
    };
  }
}
