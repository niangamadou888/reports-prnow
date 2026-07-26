import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getPDF } from '@/lib/storage';
import { resolveReportMetadata } from '@/lib/report-metadata';
import PDFViewer from './PDFViewer';

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sheet?: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const pdf = await getPDF(slug);

  if (!pdf) {
    return { title: 'Not Found' };
  }

  const { title, description } = resolveReportMetadata(pdf);

  return {
    title,
    description,
    openGraph: {
      type: 'website',
      siteName: 'PRNow',
      title,
      description,
      url: `/${slug}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function PDFPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const { sheet } = await searchParams;
  const pdf = await getPDF(slug);

  if (!pdf) {
    redirect('https://prnow.io');
  }

  const metadata = resolveReportMetadata(pdf);

  return (
    <PDFViewer
      slug={slug}
      originalName={pdf.originalName}
      displayTitle={metadata.title}
      fileType={pdf.fileType || 'pdf'}
      initialSheet={sheet}
    />
  );
}
