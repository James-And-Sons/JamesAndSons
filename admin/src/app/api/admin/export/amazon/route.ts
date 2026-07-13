import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

export async function GET(req: NextRequest) {
  const workspaceRoot = '/Users/abhishikt_mac/Skills/Coding/Growth-ho clients/JamesAndSons';
  const tempDir = path.join(workspaceRoot, 'scratch');
  const scriptPath = path.join(workspaceRoot, 'admin/scripts/generate-amazon-excel.py');
  
  const randId = Math.random().toString(36).substring(7);
  const tempJsonPath = path.join(tempDir, `temp_products_${randId}.json`);
  const tempOutPath = path.join(tempDir, `temp_output_${randId}.xlsm`);

  try {
    // 1. Fetch products with their variants from DB
    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: 'asc' }
    });

    // Ensure temp directory exists
    await fs.mkdir(tempDir, { recursive: true });

    // 2. Write temp JSON data
    await fs.writeFile(tempJsonPath, JSON.stringify(products, null, 2), 'utf-8');

    // 3. Call python script to populate Excel template
    // Quote paths to handle spaces in folder names correctly
    const cmd = `python3 "${scriptPath}" "${tempJsonPath}" "${tempOutPath}"`;
    await execAsync(cmd);

    // 4. Read the populated xlsm file bytes
    const fileBuffer = await fs.readFile(tempOutPath);

    // 5. Send back as binary attachment
    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel.sheet.macroEnabled.12',
        'Content-Disposition': 'attachment; filename="amazon_listing_feed.xlsm"'
      }
    });

  } catch (error: any) {
    console.error('Amazon Excel export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  } finally {
    // 6. Cleanup temp files in the background/finally block
    try {
      await fs.unlink(tempJsonPath).catch(() => {});
      await fs.unlink(tempOutPath).catch(() => {});
    } catch (cleanupErr) {
      console.error('Cleanup of temp files failed:', cleanupErr);
    }
  }
}
