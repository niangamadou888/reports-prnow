import { NextResponse } from 'next/server';
import { resolveReportMetadata } from '@/lib/report-metadata';
import { getPDF } from '@/lib/storage';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    const report = await getPDF(slug);

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const metadata = resolveReportMetadata(report);
    return NextResponse.json({
      ...metadata,
      slug: report.slug,
      originalName: report.originalName,
      fileType: report.fileType || 'pdf',
    });
  } catch (error) {
    console.error('Error serving report metadata:', error);
    return NextResponse.json(
      { error: 'Failed to serve report metadata' },
      { status: 500 },
    );
  }
}
