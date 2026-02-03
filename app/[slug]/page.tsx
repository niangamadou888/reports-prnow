import { notFound } from 'next/navigation';
import { getPDF } from '@/lib/storage';
import PDFViewer from './PDFViewer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function PDFPage({ params }: PageProps) {
  const { slug } = await params;
  const pdf = await getPDF(slug);

  if (!pdf) {
    notFound();
  }

  return <PDFViewer slug={slug} originalName={pdf.originalName} fileType={pdf.fileType || 'pdf'} />;
}
