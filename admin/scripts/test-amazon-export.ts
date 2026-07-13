import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

async function run() {
  const scriptDir = __dirname;
  const adminDir = path.dirname(scriptDir);
  const workspaceRoot = path.dirname(adminDir);
  const tempDir = path.join(workspaceRoot, 'scratch');
  const scriptPath = path.join(scriptDir, 'generate-amazon-excel.py');
  const envPath = path.join(adminDir, '.env.local');
  
  const tempJsonPath = path.join(tempDir, 'test_products.json');
  const tempOutPath = path.join(tempDir, 'test_output.xlsm');

  try {
    // Load env variables manually from .env.local
    console.log('Loading .env.local...');
    const envContent = await fs.readFile(envPath, 'utf-8');
    for (const line of envContent.split('\n')) {
      const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // remove quotes if any
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key] = value;
      }
    }

    // Now import prisma from admin/src/lib/prisma
    // This ensures it uses the correct pg adapter initialization
    const { prisma } = await import('../src/lib/prisma');

    console.log('Fetching products from database...');
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: 'asc' }
    });
    console.log(`Fetched ${products.length} products.`);

    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempJsonPath, JSON.stringify(products, null, 2), 'utf-8');
    console.log(`Wrote temp JSON to ${tempJsonPath}`);

    console.log('Running python generator script...');
    const cmd = `python3 "${scriptPath}" "${tempJsonPath}" "${tempOutPath}"`;
    const { stdout, stderr } = await execAsync(cmd);
    console.log('stdout:', stdout);
    if (stderr) console.error('stderr:', stderr);

    console.log('Verifying generated file exists...');
    const stats = await fs.stat(tempOutPath);
    console.log(`Successfully generated file of size ${stats.size} bytes.`);
    console.log('Test PASSED!');

    await prisma.$disconnect();
  } catch (error) {
    console.error('Test FAILED:', error);
    process.exit(1);
  }
}

run();
