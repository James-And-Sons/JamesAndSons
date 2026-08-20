import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paramsToSign } = body;

    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      console.error('CLOUDINARY_API_SECRET environment variable is missing.');
      return NextResponse.json({ error: 'Cloudinary API secret not configured' }, { status: 500 });
    }

    // Sort parameters alphabetically
    const sortedKeys = Object.keys(paramsToSign).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${paramsToSign[key]}`)
      .join('&') + apiSecret;

    // Generate SHA-1 signature
    const signature = crypto
      .createHash('sha1')
      .update(signatureString)
      .digest('hex');

    return NextResponse.json({ signature });
  } catch (error) {
    console.error('Cloudinary signing error:', error);
    return NextResponse.json({ error: 'Failed to sign' }, { status: 500 });
  }
}
