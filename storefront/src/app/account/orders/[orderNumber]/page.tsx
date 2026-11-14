import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { formatPrice } from '@/lib/utils'
import OrderDetailClient from './OrderDetailClient'

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderNumber: string }>
}) {
  const { orderNumber } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !user.email) redirect(`/login?next=/account/orders/${orderNumber}`)

  const dbUser = await prisma.user.findUnique({ where: { email: user.email } })
  if (!dbUser) redirect('/login')

  const order = await prisma.order.findFirst({
    where: { orderNumber, userId: dbUser.id },
    include: {
      items: {
        include: { product: true }
      }
    }
  })

  if (!order) notFound()

  return <OrderDetailClient order={order as any} />
}
