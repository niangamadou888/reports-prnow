import { NextResponse } from 'next/server';
import { getAllPDFs } from '@/lib/storage';

export async function GET() {
  try {
    const pdfs = await getAllPDFs();
    return NextResponse.json(pdfs);
  } catch (error) {
    console.error('Error fetching PDFs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch PDFs' },
      { status: 500 }
    );
  }
}
