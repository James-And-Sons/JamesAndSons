'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function deleteUserAddressAction(addressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.userAddress.delete({
      where: { 
        id: addressId,
        userId: user.id // Safety check
      }
    });
    revalidatePath('/account/addresses');
    return { success: true };
  } catch (error) {
    console.error('Delete Address Error:', error);
    return { success: false, error: 'Failed to delete address' };
  }
}

export async function setDefaultAddressAction(addressId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // Unset current default
    await prisma.userAddress.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false }
    });

    // Set new default
    await prisma.userAddress.update({
      where: { id: addressId },
      data: { isDefault: true }
    });

    revalidatePath('/account/addresses');
    revalidatePath('/checkout');
    return { success: true };
  } catch (error) {
    console.error('Set Default Address Error:', error);
    return { success: false, error: 'Failed to update default address' };
  }
}

export async function updateUserAddressAction(addressId: string, data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    await prisma.userAddress.update({
      where: { id: addressId },
      data: {
        name: data.name,
        street: data.street,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone
      }
    });
    revalidatePath('/account/addresses');
    return { success: true };
  } catch (error) {
    console.error('Update Address Error:', error);
    return { success: false, error: 'Failed to update address' };
  }
}

export async function addUserAddressAction(data: any) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Unauthorized' };

  try {
    // If setting as default, unset others
    if (data.isDefault) {
      await prisma.userAddress.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.userAddress.create({
      data: {
        userId: user.id,
        name: data.name,
        street: data.street,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        phone: data.phone,
        isDefault: data.isDefault || false
      }
    });

    revalidatePath('/account/addresses');
    return { success: true, address };
  } catch (error) {
    console.error('Add Address Error:', error);
    return { success: false, error: 'Failed to add address' };
  }
}
