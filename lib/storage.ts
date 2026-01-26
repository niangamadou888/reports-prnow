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

// Convert filename to URL-friendly slug
export function filenameToSlug(filename: string): string {
  return filename
    .replace(/\.pdf$/i, '') // Remove .pdf extension
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length
}

// Generate unique slug from filename (check for duplicates)
export async function generateUniqueSlug(filename: string): Promise<string> {
  const records = await getAllPDFs();
  const existingSlugs = new Set(records.map(r => r.slug));

  const baseSlug = filenameToSlug(filename) || 'document';
  let slug = baseSlug;
  let counter = 2;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
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
