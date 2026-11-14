import * as fs from 'fs';
import * as path from 'path';

// Load env
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = trimmed.split('=');
    const key = parts[0].trim();
    let val = parts.slice(1).join('=').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    process.env[key] = val;
  }
}

async function testOrderPipeline() {
  console.log('--- Order Integration Pipeline End-to-End Test ---');

  try {
    const { prisma } = await import('../src/lib/prisma');
    const { runOrderIntegrations } = await import('../src/lib/integrations/orchestrator');

    // 1. Fetch a product to attach to the test order
    const product = await prisma.product.findFirst();

    if (!product) {
      console.error('No products found in the database. Please populate catalog first.');
      return;
    }

    // 2. Fetch an existing user from the database
    const user = await prisma.user.findFirst();

    if (!user) {
      console.error('No users found in the database. Please register a user first.');
      return;
    }

    const orderNumber = `TEST-ORD-${Date.now().toString().slice(-6)}`;
    console.log(`Step 1: Creating mock paid order ${orderNumber} in database...`);

    // 3. Create mock order
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: user.id,
        status: 'PAID',
        totalAmount: 15000,
        taxAmount: 2700,
        shippingAmount: 0,
        shippingAddress: 'Flat 101, Sea View Residency, Marine Drive, Mumbai, Maharashtra - 400001',
        shippingPhone: '9999999999',
        shippingCity: 'Mumbai',
        shippingState: 'Maharashtra',
        shippingPincode: '400001',
        billingAddress: 'Flat 101, Sea View Residency, Marine Drive, Mumbai, Maharashtra - 400001',
        ucInstallationStatus: 'DRAFT_PENDING',
        ucInstallationSlot: '2026-07-15 10:00 AM - 12:30 PM',
        items: {
          create: [
            {
              productId: product.id,
              quantity: 1,
              unitPrice: product.d2cPrice,
              total: product.d2cPrice + 1499,
              warrantyPlanSku: 'OW-1Y-MOCK',
              warrantyPlanName: 'Onsitego 1-Year Extended Warranty',
              warrantyPrice: 1499
            }
          ]
        }
      }
    });

    console.log(`Order created successfully. Database ID: ${order.id}`);
    
    // 4. Populate a mock UC Service Mapping if none exists
    const mapping = await prisma.ucServiceMapping.findFirst({
      where: { sku: product.sku }
    });
    if (!mapping && product.sku) {
      await prisma.ucServiceMapping.create({
        data: {
          sku: product.sku,
          ucServiceId: 'uc-chandelier-install-mock',
          technicianCount: 1,
          weightCategory: 'LIGHT'
        }
      });
      console.log(`Created temporary UC Service Mapping for SKU "${product.sku}".`);
    }

    // 5. Trigger the Integrations Orchestrator
    console.log('\nStep 2: Triggering Integrations Orchestrator pipeline...');
    await runOrderIntegrations(order.id);

    // 6. Verify database updates
    console.log('\nStep 3: Querying updated order status from Supabase...');
    const updatedOrder = await prisma.order.findUnique({
      where: { id: order.id }
    });

    console.log('\n================ TEST RESULTS ================');
    console.log(`- Order Number:            ${updatedOrder?.orderNumber}`);
    console.log(`- Zoho Sales Order ID:     ${updatedOrder?.zohoSalesOrderId || '✗ Sync Failed'}`);
    console.log(`- Onsitego Certificate:    ${updatedOrder?.onsitegoCertificateUrl || '✗ Registration Failed'}`);
    console.log(`- Urban Company Ticket ID: ${updatedOrder?.ucTicketId || '✗ Booking Failed'}`);
    console.log(`- UC Booking Status:       ${updatedOrder?.ucInstallationStatus}`);
    console.log('==============================================\n');

  } catch (err) {
    console.error('Test order pipeline execution failed:', err);
  }
}

testOrderPipeline();
