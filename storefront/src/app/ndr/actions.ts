'use server';

import { getShiprocketToken } from '@/lib/shiprocket';

export async function submitNDRReattemptAction(shipmentId: string, date: string, notes: string) {
  const token = await getShiprocketToken();
  if (!token) return { success: false, message: 'Logistics service unavailable' };

  try {
    const res = await fetch('https://apiv2.shiprocket.in/v1/external/ndr/action/reattempt', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({
        shipment_id: shipmentId,
        deferred_date: date, // YYYY-MM-DD
        remarks: notes
      }),
      cache: 'no-store'
    });

    const data = await res.json();
    if (data.status_code === 200 || data.status === 'success') {
      return { success: true };
    }
    return { success: false, message: data.message || 'Failed to schedule re-attempt.' };
  } catch (error: any) {
    console.error('NDR Action Error:', error);
    return { success: false, message: 'API Call Failed' };
  }
}
