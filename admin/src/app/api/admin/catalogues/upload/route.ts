import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const folder = isPdf ? 'catalogues/pdfs' : 'catalogues/covers';

    return new Promise<NextResponse>((resolve) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto',
          public_id: `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`,
        },
        (error, result) => {
          if (error || !result) {
            console.error('Cloudinary upload error:', error);
            resolve(NextResponse.json({ error: error?.message || 'Cloudinary upload failed' }, { status: 500 }));
          } else {
            resolve(
              NextResponse.json({
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                sizeBytes: result.bytes,
                fileName: file.name,
              })
            );
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('Error handling upload:', error);
    return NextResponse.json({ error: 'Server error handling file upload' }, { status: 500 });
  }
}
