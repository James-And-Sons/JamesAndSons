import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
  if (!dbUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: dbUser.id }
  })

  if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

  // Only allow cancellation if order hasn't shipped
  const nonCancellableStatuses = ['SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED']
  if (nonCancellableStatuses.includes(order.status)) {
    return NextResponse.json({ 
      error: `Cannot cancel an order with status "${order.status}"` 
    }, { status: 400 })
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' }
  })

  return NextResponse.json({ success: true, order: updatedOrder })
}
