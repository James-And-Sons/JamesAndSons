import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { BRAND_CONFIG } from '@james-andsons/config';

function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '';
  let str = String(val).replace(/"/g, '""');
  if (str.includes(',') || str.includes('\n') || str.includes('"')) {
    str = `"${str}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader ? authHeader.split(' ')[1] : req.nextUrl.searchParams.get('secret');
    const secret = process.env.INVENTORY_SYNC_WEBHOOK_SECRET;

    if (secret && token && token !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const format = req.nextUrl.searchParams.get('format') || 'xml';

    const products = await prisma.product.findMany({
      include: { variants: true },
      orderBy: { name: 'asc' }
    });

    const getAvailabilityXml = (qty: number) => (qty > 0 ? 'in_stock' : 'out_of_stock');
    const getAvailabilityCsv = (qty: number) => (qty > 0 ? 'in stock' : 'out of stock');
    const getProductLink = (slug: string) => `${BRAND_CONFIG.storefrontUrl}/products/${slug}`;
    const getPriceText = (price: number) => `${Math.round(price)}.00 ${BRAND_CONFIG.currencyCode || 'INR'}`;

    if (format === 'csv') {
      const headers = [
        'id',
        'title',
        'description',
        'link',
        'image_link',
        'price',
        'sale_price',
        'availability',
        'condition',
        'brand',
        'google_product_category',
        'color',
        'size',
        'material',
        'country_of_origin',
        'mpn'
      ];

      const rows = [headers.join(',')];

      for (const p of products) {
        if (p.variants && p.variants.length > 0) {
          for (const v of p.variants) {
            const vPrice = v.d2cPrice || p.d2cPrice;
            const vMrp = v.mrp || p.mrp;
            const vImages = v.images && v.images.length > 0 ? v.images : p.images;
            const brandVal = v.brand || p.brand || BRAND_CONFIG.name;
            const googleCatVal = v.googleProductCategory || p.googleProductCategory || 'Home & Garden > Lighting > Light Fixtures';

            rows.push([
              escapeCSV(v.sku),
              escapeCSV(`${p.name} - ${v.name}`),
              escapeCSV(p.description || p.name),
              escapeCSV(getProductLink(p.slug)),
              escapeCSV(vImages[0] || `${BRAND_CONFIG.storefrontUrl}/images/placeholder.png`),
              escapeCSV(getPriceText(vPrice)),
              escapeCSV(vMrp && vPrice < vMrp ? getPriceText(vPrice) : ''),
              escapeCSV(getAvailabilityCsv(v.stockQuantity)),
              escapeCSV('new'),
              escapeCSV(brandVal),
              escapeCSV(googleCatVal),
              escapeCSV(v.color || p.color || ''),
              escapeCSV(v.size || p.size || ''),
              escapeCSV(v.material || p.material || ''),
              escapeCSV(v.countryOfOrigin || p.countryOfOrigin || 'India'),
              escapeCSV(v.sku)
            ].join(','));
          }
        } else {
          const brandVal = p.brand || BRAND_CONFIG.name;
          const googleCatVal = p.googleProductCategory || 'Home & Garden > Lighting > Light Fixtures';

          rows.push([
            escapeCSV(p.sku),
            escapeCSV(p.name),
            escapeCSV(p.description || p.name),
            escapeCSV(getProductLink(p.slug)),
            escapeCSV(p.images[0] || `${BRAND_CONFIG.storefrontUrl}/images/placeholder.png`),
            escapeCSV(getPriceText(p.d2cPrice)),
            escapeCSV(p.mrp && p.d2cPrice < p.mrp ? getPriceText(p.d2cPrice) : ''),
            escapeCSV(getAvailabilityCsv(p.stockQuantity)),
            escapeCSV('new'),
            escapeCSV(brandVal),
            escapeCSV(googleCatVal),
            escapeCSV(p.color || ''),
            escapeCSV(p.size || ''),
            escapeCSV(p.material || ''),
            escapeCSV(p.countryOfOrigin || 'India'),
            escapeCSV(p.sku)
          ].join(','));
        }
      }

      return new Response(rows.join('\n'), {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="google_merchant_feed.csv"'
        }
      });
    }

    // Default: RSS 2.0 XML Format
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n`;
    xml += `  <channel>\n`;
    xml += `    <title>${escapeXml(BRAND_CONFIG.name)} Product Catalog</title>\n`;
    xml += `    <link>${escapeXml(BRAND_CONFIG.storefrontUrl)}</link>\n`;
    xml += `    <description>Official Google Merchant Center Product Feed for ${escapeXml(BRAND_CONFIG.name)}</description>\n`;

    for (const p of products) {
      const processItem = (
        sku: string,
        title: string,
        price: number,
        mrp: number,
        stockQty: number,
        images: string[],
        category: string,
        brandName: string,
        color?: string | null,
        material?: string | null,
        size?: string | null,
        country?: string | null
      ) => {
        let itemXml = `    <item>\n`;
        itemXml += `      <g:id>${escapeXml(sku)}</g:id>\n`;
        itemXml += `      <g:title>${escapeXml(title)}</g:title>\n`;
        itemXml += `      <g:description>${escapeXml(p.description || title)}</g:description>\n`;
        itemXml += `      <g:link>${escapeXml(getProductLink(p.slug))}</g:link>\n`;
        
        const primaryImg = images[0] || `${BRAND_CONFIG.storefrontUrl}/images/placeholder.png`;
        itemXml += `      <g:image_link>${escapeXml(primaryImg)}</g:image_link>\n`;

        if (images.length > 1) {
          for (let i = 1; i < Math.min(images.length, 10); i++) {
            itemXml += `      <g:additional_image_link>${escapeXml(images[i])}</g:additional_image_link>\n`;
          }
        }

        itemXml += `      <g:price>${escapeXml(getPriceText(price))}</g:price>\n`;
        if (mrp && price < mrp) {
          itemXml += `      <g:sale_price>${escapeXml(getPriceText(price))}</g:sale_price>\n`;
        }

        itemXml += `      <g:availability>${getAvailabilityXml(stockQty)}</g:availability>\n`;
        itemXml += `      <g:condition>new</g:condition>\n`;
        itemXml += `      <g:brand>${escapeXml(brandName || BRAND_CONFIG.name)}</g:brand>\n`;
        itemXml += `      <g:google_product_category>${escapeXml(category || 'Home & Garden > Lighting > Light Fixtures')}</g:google_product_category>\n`;
        itemXml += `      <g:mpn>${escapeXml(sku)}</g:mpn>\n`;

        if (color) itemXml += `      <g:color>${escapeXml(color)}</g:color>\n`;
        if (material) itemXml += `      <g:material>${escapeXml(material)}</g:material>\n`;
        if (size) itemXml += `      <g:size>${escapeXml(size)}</g:size>\n`;
        itemXml += `      <g:country_of_origin>${escapeXml(country || 'IN')}</g:country_of_origin>\n`;
        itemXml += `    </item>\n`;

        return itemXml;
      };

      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          const vPrice = v.d2cPrice || p.d2cPrice;
          const vMrp = v.mrp || p.mrp;
          const vImages = v.images && v.images.length > 0 ? v.images : p.images;
          const brandVal = v.brand || p.brand || BRAND_CONFIG.name;
          const googleCatVal = v.googleProductCategory || p.googleProductCategory || 'Home & Garden > Lighting > Light Fixtures';

          xml += processItem(
            v.sku,
            `${p.name} - ${v.name}`,
            vPrice,
            vMrp,
            v.stockQuantity,
            vImages,
            googleCatVal,
            brandVal,
            v.color || p.color,
            v.material || p.material,
            v.size || p.size,
            v.countryOfOrigin || p.countryOfOrigin
          );
        }
      } else {
        const brandVal = p.brand || BRAND_CONFIG.name;
        const googleCatVal = p.googleProductCategory || 'Home & Garden > Lighting > Light Fixtures';

        xml += processItem(
          p.sku,
          p.name,
          p.d2cPrice,
          p.mrp,
          p.stockQuantity,
          p.images,
          googleCatVal,
          brandVal,
          p.color,
          p.material,
          p.size,
          p.countryOfOrigin
        );
      }
    }

    xml += `  </channel>\n`;
    xml += `</rss>`;

    return new Response(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'Content-Disposition': 'inline; filename="google_merchant_feed.xml"'
      }
    });
  } catch (error: any) {
    console.error('Google Merchant Feed Export failed:', error);
    return NextResponse.json({ error: error.message || 'Export failed' }, { status: 500 });
  }
}
