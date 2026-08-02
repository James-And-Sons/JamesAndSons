import * as fs from 'fs';
import * as path from 'path';

// Load env variables manually from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

async function run() {
  const { prisma } = await import('@james-andsons/db');
  
  const products = await prisma.product.findMany({
    include: { category: true }
  });

  const categories = new Set(products.map(p => p.category?.name || 'No Category'));
  console.log('Unique categories in database:', Array.from(categories));

  console.log('Sample product names and categories:');
  products.slice(0, 30).forEach(p => {
    console.log(`Name: "${p.name}" | Category: "${p.category?.name || 'N/A'}"`);
  });
}

run().catch(console.error);
