// --- Payment Provider Interfaces ---

export interface CreateOrderParams {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface OrderResult {
  id: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
  rawResponse?: any;
}

export interface VerifySignatureParams {
  orderId: string;
  paymentId: string;
  signature: string;
  webhookSecret?: string;
}

export interface IPaymentProvider {
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifySignature(params: VerifySignatureParams): boolean;
}


// --- Shipping Provider Interfaces ---

export interface ShippingAddress {
  name: string;
  email?: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export interface RateCalculationParams {
  originPincode: string;
  destinationPincode: string;
  weight: number; // in kg
  declaredValue: number;
}

export interface ShippingRateResult {
  success: boolean;
  rate?: number;
  error?: string;
}

export interface CreateShipmentParams {
  orderId: string;
  pickupLocation: string;
  deliveryAddress: ShippingAddress;
  weight: number;
  declaredValue: number;
  subTotal: number;
}

export interface ShipmentResult {
  success: boolean;
  shipmentId?: string;
  awbNumber?: string;
  courierName?: string;
  error?: string;
  rawResponse?: any;
}

export interface IShippingProvider {
  checkServiceability(pincode: string): Promise<boolean>;
  calculateRates(params: RateCalculationParams): Promise<ShippingRateResult>;
  createShipment(params: CreateShipmentParams): Promise<ShipmentResult>;
}
