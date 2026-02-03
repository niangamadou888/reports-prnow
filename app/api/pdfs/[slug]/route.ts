import { NextRequest, NextResponse } from 'next/server';
import { deletePDF, getPDF, getFileData } from '@/lib/storage';

function getContentType(filePath: string): string {
  const lower = filePath.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.xlsx')) return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (lower.endsWith('.xls')) return 'application/vnd.ms-excel';
  return 'application/octet-stream';
}

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

    const fileBuffer = await getFileData(slug);
    if (!fileBuffer) {
      return NextResponse.json(
        { error: 'File data not found' },
        { status: 404 }
      );
    }

    const contentType = getContentType(pdf.filePath);

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${pdf.originalName}"`,
      },
    });
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
