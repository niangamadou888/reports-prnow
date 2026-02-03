import path from 'path';
import fs from 'fs/promises';
import { getPool, ensureSchema } from './db';
import { RowDataPacket } from 'mysql2';

export type FileType = 'pdf' | 'excel';

export interface PDFRecord {
  slug: string;
  originalName: string;
  uploadedAt: string;
  fileSize: number;
  filePath: string;
  fileType?: FileType;
}

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

const EXCEL_MIME_TYPES = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
  'application/vnd.ms-excel', // .xls
];

const EXCEL_EXTENSIONS = ['.xlsx', '.xls'];

export function isExcelFile(file: File): boolean {
  return (
    EXCEL_MIME_TYPES.includes(file.type) ||
    EXCEL_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext))
  );
}

export function isPDFFile(file: File): boolean {
  return file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
}

export function getFileExtension(file: File): string {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) return '.xlsx';
  if (name.endsWith('.xls')) return '.xls';
  if (name.endsWith('.pdf')) return '.pdf';
  return '';
}

// Convert filename to URL-friendly slug
export function filenameToSlug(filename: string): string {
  return filename
    .replace(/\.(pdf|xlsx|xls)$/i, '') // Remove file extensions
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
  await ensureSchema();
  const db = getPool();

  const baseSlug = filenameToSlug(filename) || 'document';
  let slug = baseSlug;
  let counter = 2;

  while (true) {
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT 1 FROM pdf_records WHERE slug = ? LIMIT 1',
      [slug]
    );
    if (rows.length === 0) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

export async function saveFile(file: File, slug: string, fileType: FileType): Promise<string> {
  const folder = fileType === 'pdf' ? 'pdfs' : 'excel';
  const ext = getFileExtension(file) || (fileType === 'pdf' ? '.pdf' : '.xlsx');
  const dir = path.join(UPLOAD_DIR, folder);

  await fs.mkdir(dir, { recursive: true });

  const filePath = path.join(dir, `${slug}${ext}`);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(filePath, buffer);

  // Return relative path from uploads dir
  return `${folder}/${slug}${ext}`;
}

export async function addPDF(record: PDFRecord): Promise<void> {
  await ensureSchema();
  const db = getPool();
  await db.execute(
    'INSERT INTO pdf_records (slug, original_name, uploaded_at, file_size, file_path, file_type) VALUES (?, ?, ?, ?, ?, ?)',
    [record.slug, record.originalName, record.uploadedAt, record.fileSize, record.filePath, record.fileType || 'pdf']
  );
}

export async function getAllPDFs(): Promise<PDFRecord[]> {
  await ensureSchema();
  const db = getPool();
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT slug, original_name, uploaded_at, file_size, file_path, file_type FROM pdf_records ORDER BY uploaded_at DESC'
  );
  return rows.map(row => ({
    slug: row.slug,
    originalName: row.original_name,
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : String(row.uploaded_at),
    fileSize: row.file_size,
    filePath: row.file_path,
    fileType: row.file_type || 'pdf',
  }));
}

export async function getPDF(slug: string): Promise<PDFRecord | undefined> {
  await ensureSchema();
  const db = getPool();
  const [rows] = await db.execute<RowDataPacket[]>(
    'SELECT slug, original_name, uploaded_at, file_size, file_path, file_type FROM pdf_records WHERE slug = ? LIMIT 1',
    [slug]
  );
  if (rows.length === 0) return undefined;
  const row = rows[0];
  return {
    slug: row.slug,
    originalName: row.original_name,
    uploadedAt: row.uploaded_at instanceof Date ? row.uploaded_at.toISOString() : String(row.uploaded_at),
    fileSize: row.file_size,
    filePath: row.file_path,
    fileType: row.file_type || 'pdf',
  };
}

export async function deletePDF(slug: string): Promise<boolean> {
  await ensureSchema();
  const db = getPool();

  const pdf = await getPDF(slug);
  if (!pdf) return false;

  // Delete the file from disk
  if (pdf.filePath) {
    try {
      const fullPath = path.join(UPLOAD_DIR, pdf.filePath);
      await fs.unlink(fullPath);
    } catch (error) {
      console.error('Error deleting file from disk:', error);
    }
  }

  // Remove from database
  await db.execute('DELETE FROM pdf_records WHERE slug = ?', [slug]);

  return true;
}
