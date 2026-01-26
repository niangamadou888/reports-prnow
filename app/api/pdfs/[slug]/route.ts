import { NextRequest, NextResponse } from 'next/server';
import { deletePDF, getPDF } from '@/lib/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const pdf = await getPDF(slug);

    if (!pdf) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    // Redirect to the Vercel Blob URL
    return NextResponse.redirect(pdf.blobUrl);
  } catch (error) {
    console.error('Error serving PDF:', error);
    return NextResponse.json(
      { error: 'Failed to serve PDF' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const success = await deletePDF(slug);

    if (!success) {
      return NextResponse.json(
        { error: 'PDF not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting PDF:', error);
    return NextResponse.json(
      { error: 'Failed to delete PDF' },
      { status: 500 }
    );
  }
}
