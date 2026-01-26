import { kv } from '@vercel/kv';
import { del } from '@vercel/blob';

export interface PDFRecord {
  slug: string;
  originalName: string;
  uploadedAt: string;
  fileSize: number;
  blobUrl: string; // URL from Vercel Blob
}

const PDF_LIST_KEY = 'pdf_records';

// Generate a random slug (6 characters, alphanumeric)
export function generateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let slug = '';
  for (let i = 0; i < 6; i++) {
    slug += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return slug;
}

// Generate unique slug (check for duplicates)
export async function generateUniqueSlug(): Promise<string> {
  const records = await getAllPDFs();
  const existingSlugs = new Set(records.map(r => r.slug));

  let slug = generateSlug();
  let attempts = 0;

  while (existingSlugs.has(slug) && attempts < 100) {
    slug = generateSlug();
    attempts++;
  }

  if (attempts >= 100) {
    // Fallback to longer slug
    slug = generateSlug() + generateSlug();
  }

  return slug;
}

export async function addPDF(record: PDFRecord): Promise<void> {
  const records = await getAllPDFs();
  records.push(record);
  await kv.set(PDF_LIST_KEY, records);
}

export async function getAllPDFs(): Promise<PDFRecord[]> {
  const records = await kv.get<PDFRecord[]>(PDF_LIST_KEY);
  if (!records) return [];
  return records.sort((a, b) =>
    new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );
}

export async function getPDF(slug: string): Promise<PDFRecord | undefined> {
  const records = await getAllPDFs();
  return records.find(r => r.slug === slug);
}

export async function deletePDF(slug: string): Promise<boolean> {
  const records = await getAllPDFs();
  const index = records.findIndex(r => r.slug === slug);

  if (index === -1) return false;

  const pdf = records[index];

  // Delete from Vercel Blob
  if (pdf.blobUrl) {
    try {
      await del(pdf.blobUrl);
    } catch (error) {
      console.error('Error deleting blob:', error);
    }
  }

  // Remove from records
  records.splice(index, 1);
  await kv.set(PDF_LIST_KEY, records);

  return true;
}
