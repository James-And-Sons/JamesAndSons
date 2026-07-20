import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('--- STARTING DATABASE CLEANUP ---');

  console.log('1. Deleting Return Requests...');
  await prisma.returnRequest.deleteMany({});

  console.log('2. Deleting Order Items...');
  await prisma.orderItem.deleteMany({});

  console.log('3. Deleting Orders...');
  await prisma.order.deleteMany({});

  console.log('4. Deleting RFQ Items...');
  await prisma.rFQItem.deleteMany({});

  console.log('5. Deleting RFQs...');
  await prisma.rFQ.deleteMany({});

  console.log('6. Deleting Ticket Messages...');
  await prisma.ticketMessage.deleteMany({});

  console.log('7. Deleting Tickets...');
  await prisma.ticket.deleteMany({});

  console.log('8. Deleting Coupon Usages...');
  await prisma.couponUsage.deleteMany({});

  console.log('9. Deleting Affiliate Conversions...');
  await prisma.affiliateConversion.deleteMany({});

  console.log('10. Deleting Abandoned Carts...');
  await prisma.abandonedCart.deleteMany({});

  console.log('11. Deleting User Addresses...');
  await prisma.userAddress.deleteMany({});

  console.log('12. Deleting B2B Companies...');
  await prisma.company.deleteMany({});

  console.log('13. Deleting non-preserved Users...');
  const result = await prisma.user.deleteMany({
    where: {
      email: {
        notIn: ['vishal@jamesandsons.in', 'admin@jamesandsons.in']
      }
    }
  });

  console.log(`Successfully deleted ${result.count} test user records.`);
  console.log('--- DATABASE CLEANUP COMPLETED ---');
}

main()
  .catch(e => {
    console.error('Error during cleanup:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
