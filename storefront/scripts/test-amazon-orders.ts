import * as fs from 'fs';
import * as path from 'path';

// 1. Load storefront .env.local environment variables
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

async function testAmazonOrders() {
  console.log('=== Amazon SP-API Connection & Ingestion Test ===');
  
  try {
    const { getLwaAccessToken, getAmazonConfig } = await import('../src/lib/amazon-sp-api');
    const { fetchNewAmazonOrders, getAmazonOrderItems } = await import('../src/lib/integrations/amazon-orders');
    
    // Check credentials config
    const config = getAmazonConfig();
    console.log('Loaded Configuration:');
    console.log(`- Seller ID: ${config.sellerId}`);
    console.log(`- Marketplace ID: ${config.marketplaceId}`);
    console.log(`- SP-API Endpoint: ${config.endpoint}`);
    console.log(`- AWS Region: ${config.awsRegion}`);
    console.log(`- LWA Client ID: ${process.env.AMAZON_LWA_CLIENT_ID ? 'Configured' : 'Missing'}`);
    
    // Step 2: Fetch LWA token
    console.log('\n--- Step 1: Testing LWA OAuth Token exchange... ---');
    const token = await getLwaAccessToken();
    console.log('✅ Success! Token acquired:', token.substring(0, 15) + '...');
    
    // Step 3: Fetch orders from last 24 hours (1440 minutes)
    console.log('\n--- Step 2: Testing Orders API connectivity... ---');
    const minutesBack = 1440; // 24 hours
    const orders = await fetchNewAmazonOrders(minutesBack);
    console.log(`✅ Success! Fetched ${orders.length} order(s) from Seller Central.`);
    
    if (orders.length > 0) {
      console.log('\nSample Order Details:');
      const order = orders[0];
      console.log(`- Amazon Order ID: ${order.AmazonOrderId}`);
      console.log(`- Purchase Date: ${order.PurchaseDate}`);
      console.log(`- Order Status: ${order.OrderStatus}`);
      console.log(`- Total Amount: ${order.OrderTotal?.Amount} ${order.OrderTotal?.CurrencyCode}`);
      
      // Step 4: Fetch items for the order
      console.log('\n--- Step 3: Testing Order Items API... ---');
      const items = await getAmazonOrderItems(order.AmazonOrderId);
      console.log(`✅ Success! Loaded ${items.length} item(s) for order ${order.AmazonOrderId}`);
      for (const item of items) {
        console.log(`  * SKU: ${item.SellerSKU} | ASIN: ${item.ASIN} | Qty: ${item.QuantityOrdered} | Price: ${item.ItemPrice?.Amount}`);
      }
    } else {
      console.log('\nNo unshipped Amazon orders found in the last 24 hours. Connect SP-API sandbox or create a test order in Seller Central to see live data.');
    }
    
    console.log('\n🎉 End-to-end SP-API Orders API handshake passed successfully!');
    
  } catch (err: any) {
    console.error('\n❌ Connection Test Failed:');
    console.error(err.message || err);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

testAmazonOrders();
