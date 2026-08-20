'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { 
  createShiprocketReturnOrder, 
  assignAWB, 
  generateLabel, 
  getWalletBalance, 
  getPickupLocations, 
  addPickupLocation 
} from '@/lib/shiprocket';

export async function approveReturnRequestAction(requestId: string) {
  try {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: requestId },
      include: {
        order: {
          include: {
            user: true,
            items: {
              include: { product: true }
            }
          }
        }
      }
    });

    if (!returnRequest) {
      throw new Error('Return request not found');
    }

    const order = returnRequest.order;
    const parts = order.shippingAddress.split(', ');
    const pincodeStr = order.shippingPincode || parts.pop()?.split(' - ')[1] || '110030';
    const stateStr = order.shippingState || parts.pop() || '';
    const cityStr = order.shippingCity || parts.pop() || '';
    const addrStr = order.shippingPincode && order.shippingState && order.shippingCity
      ? order.shippingAddress.split(', ').slice(0, -3).join(', ') || order.shippingAddress
      : parts.join(', ') || order.shippingAddress;

    // Use default package metrics or first product dimensions
    const firstProduct = order.items[0]?.product;
    const length = firstProduct?.length || 10;
    const breadth = firstProduct?.breadth || 10;
    const height = firstProduct?.height || 10;
    const weight = firstProduct?.weight || 0.5;

    // Map to Shiprocket Return Order schema
    const reverseOrderParams = {
      order_id: `${order.orderNumber}-R`,
      order_date: new Date().toISOString().split('T')[0],
      pickup_customer_name: order.user.firstName,
      pickup_last_name: order.user.lastName,
      pickup_address: addrStr,
      pickup_city: cityStr,
      pickup_state: stateStr,
      pickup_pincode: pincodeStr,
      pickup_country: "India",
      pickup_email: order.user.email.trim().toLowerCase(),
      pickup_phone: (order.shippingPhone || order.user.phone || '9999999999').replace(/\D/g, '').slice(-10) || '9999999999',
      
      shipping_customer_name: "James & Sons Warehouse",
      shipping_last_name: "Operations",
      shipping_address: "B-24 Phase 2", // Standard fallback
      shipping_address_2: "Industrial Area",
      shipping_city: "Aligarh",
      shipping_state: "Uttar Pradesh",
      shipping_country: "India",
      shipping_pincode: process.env.STORE_PICKUP_PINCODE || "202001",
      shipping_phone: "9999999999",
      shipping_email: "operations@jamesandsons.in",
      
      order_items: order.items.map(item => ({
        name: item.product.name,
        sku: item.product.sku,
        units: item.quantity,
        selling_price: item.unitPrice,
        hsn: item.product.hsnCode || ""
      })),
      payment_method: "Prepaid",
      sub_total: order.totalAmount - order.taxAmount - order.shippingAmount,
      length,
      breadth,
      height,
      weight
    };

    console.log(`[ApproveReturn] Pushing reverse order to Shiprocket for order ${order.orderNumber}`);
    const shipRes = await createShiprocketReturnOrder(reverseOrderParams);

    if (!shipRes.success) {
      const errorMsg = typeof shipRes.message === 'object'
        ? JSON.stringify(shipRes.message)
        : shipRes.message || 'Failed to create return order';
      
      await prisma.returnRequest.update({
        where: { id: requestId },
        data: {
          fulfillmentError: errorMsg
        }
      });
      throw new Error(errorMsg);
    }

    const returnShipmentId = shipRes.shipment_id;
    console.log(`[ApproveReturn] Return order created. Shipment ID: ${returnShipmentId}. Assigning AWB...`);

    let returnAwb = null;
    let returnLabel = null;
    let errNote = null;

    // Assign AWB for reverse shipment
    const awbRes = await assignAWB(returnShipmentId);
    if (awbRes.success) {
      returnAwb = awbRes.awb_code;
      console.log(`[ApproveReturn] Return AWB Assigned: ${returnAwb}`);
      
      // Generate return label
      const labelUrl = await generateLabel([returnShipmentId]);
      if (labelUrl) {
        returnLabel = labelUrl;
      } else {
        errNote = 'Reverse shipment created & AWB assigned, but label generation failed.';
      }
    } else {
      errNote = `Reverse shipment created (ID: ${returnShipmentId}), but AWB assignment failed: ${awbRes.message}`;
    }

    await prisma.returnRequest.update({
      where: { id: requestId },
      data: {
        status: 'APPROVED',
        shipmentId: returnShipmentId?.toString(),
        awbNumber: returnAwb,
        labelUrl: returnLabel,
        fulfillmentError: errNote,
      }
    });

    revalidatePath('/logistics');
    return { success: true };
  } catch (error: any) {
    console.error('approveReturnRequestAction error:', error);
    return { success: false, error: error.message };
  }
}

export async function rejectReturnRequestAction(requestId: string, adminNote: string) {
  try {
    await prisma.returnRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        adminNote
      }
    });
    revalidatePath('/logistics');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchPickupLocationsAction() {
  try {
    const res = await getPickupLocations();
    return res;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function createPickupLocationAction(data: any) {
  try {
    const res = await addPickupLocation(data);
    return res;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function fetchWalletBalanceAction() {
  try {
    const res = await getWalletBalance();
    return res;
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export async function submitNDRAction(shipmentId: string, deferredDate: string, remarks: string) {
  try {
    const { getShiprocketToken } = await import('@/lib/shiprocket');
    const t = await getShiprocketToken();
    if (!t) throw new Error('Shiprocket auth failed');

    const res = await fetch('https://apiv2.shiprocket.in/v1/external/ndr/action/reattempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${t}`
      },
      body: JSON.stringify({
        shipment_id: parseInt(shipmentId),
        deferred_date: deferredDate,
        remarks: remarks
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    if (res.ok && (data.status_code === 200 || data.status === 'success')) {
      return { success: true };
    }
    return { success: false, message: data.message || 'NDR Reattempt failed' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
