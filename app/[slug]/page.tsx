import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPDF } from '@/lib/storage';
import PDFViewer from './PDFViewer';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pdf = await getPDF(slug);

  if (!pdf) {
    return { title: 'Not Found' };
  }

  const fileType = pdf.fileType || 'pdf';
  const title = fileType === 'excel' ? 'PRNow | Excel Report' : 'PRNow | PDF Report';

  return { title };
}

export default async function PDFPage({ params }: PageProps) {
  const { slug } = await params;
  const pdf = await getPDF(slug);

  if (!pdf) {
    notFound();
  }

  return <PDFViewer slug={slug} originalName={pdf.originalName} fileType={pdf.fileType || 'pdf'} />;
}
