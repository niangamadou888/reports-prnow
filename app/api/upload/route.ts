import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { generateUniqueSlug, addPDF } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Generate unique slug
    const slug = await generateUniqueSlug();

    // Upload to Vercel Blob
    const blob = await put(`pdfs/${slug}.pdf`, file, {
      access: 'public',
      contentType: 'application/pdf',
    });

    // Add record to KV
    await addPDF({
      slug,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      blobUrl: blob.url,
    });

    return NextResponse.json({
      success: true,
      slug,
      url: `/${slug}`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
