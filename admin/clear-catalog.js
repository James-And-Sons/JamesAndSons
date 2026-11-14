const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('--- Wiping existing catalog data ---');
    
    // Delete related records first to respect foreign key constraints
    const ticketMessages = await prisma.ticketMessage.deleteMany();
    console.log(`Deleted ${ticketMessages.count} ticket messages.`);

    const tickets = await prisma.ticket.deleteMany();
    console.log(`Deleted ${tickets.count} tickets.`);

    const returnRequests = await prisma.returnRequest.deleteMany();
    console.log(`Deleted ${returnRequests.count} return requests.`);

    const orderItems = await prisma.orderItem.deleteMany();
    console.log(`Deleted ${orderItems.count} order items.`);

    const orders = await prisma.order.deleteMany();
    console.log(`Deleted ${orders.count} orders.`);

    const rfqItems = await prisma.rFQItem.deleteMany();
    console.log(`Deleted ${rfqItems.count} RFQ items.`);

    const rfqs = await prisma.rFQ.deleteMany();
    console.log(`Deleted ${rfqs.count} RFQs.`);

    const variants = await prisma.productVariant.deleteMany();
    console.log(`Deleted ${variants.count} product variants.`);

    const products = await prisma.product.deleteMany();
    console.log(`Deleted ${products.count} products.`);

    console.log('--- Catalog cleared successfully! ---');
  } catch (error) {
    console.error('Wiping failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
