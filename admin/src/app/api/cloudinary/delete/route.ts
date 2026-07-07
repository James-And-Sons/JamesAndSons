import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function getPublicIdFromUrl(url: string): string | null {
  try {
    const parts = url.split('/upload/');
    if (parts.length < 2) return null;

    const path = parts[1]; // e.g. "v1570598947/folder/sample.jpg" or "folder/sample.jpg"
    const pathParts = path.split('/');

    // If the first part is a version prefix (starts with 'v' followed by digits), remove it
    if (pathParts[0].match(/^v\d+$/)) {
      pathParts.shift();
    }

    const rest = pathParts.join('/');
    // Remove file extension
    const dotIndex = rest.lastIndexOf('.');
    if (dotIndex === -1) return rest;
    return rest.substring(0, dotIndex);
  } catch (error) {
    console.error('Error parsing public ID from Cloudinary URL:', error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const publicId = getPublicIdFromUrl(url);
    if (!publicId) {
      return NextResponse.json({ error: 'Invalid Cloudinary URL' }, { status: 400 });
    }

    console.log(`Destroying Cloudinary asset with public ID: ${publicId}`);
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok' || result.result === 'not found') {
      return NextResponse.json({ success: true, result });
    } else {
      return NextResponse.json({ error: 'Failed to delete asset', result }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Cloudinary delete error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete asset' }, { status: 500 });
  }
}
