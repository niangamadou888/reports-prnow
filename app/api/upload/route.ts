import { NextRequest, NextResponse } from 'next/server';
import {
  generateUniqueSlug,
  addPDF,
  replacePDFBySlug,
  isClaimableSlug,
  saveFile,
  isPDFFile,
  isExcelFile,
  FileType,
} from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const rawTitle = formData.get('title');
    const rawDescription = formData.get('description');
    const rawSlug = formData.get('slug');

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type - allow PDF and Excel
    const isPdf = isPDFFile(file);
    const isExcel = isExcelFile(file);

    if (!isPdf && !isExcel) {
      return NextResponse.json(
        { error: 'Only PDF and Excel (.xlsx, .xls) files are allowed' },
        { status: 400 }
      );
    }

    const fileType: FileType = isPdf ? 'pdf' : 'excel';

    // A caller may CLAIM a slug (PRNow's regenerated pricing-page samples), which
    // replaces the file already stored there so the public URL never churns.
    // Anything outside the narrow sample pattern is ignored rather than rejected,
    // and a claim on a slug nobody holds simply becomes that slug's first upload.
    const claimed =
      typeof rawSlug === 'string' && isClaimableSlug(rawSlug.trim()) ? rawSlug.trim() : '';

    // Generate unique slug from filename
    const slug = claimed || (await generateUniqueSlug(file.name));

    // Generate virtual file path identifier
    const filePath = await saveFile(file, slug, fileType);

    // Read file data and store in MySQL
    const fileData = Buffer.from(await file.arrayBuffer());
    const record = {
      slug,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      filePath,
      fileType,
      fileData,
      metaTitle: typeof rawTitle === 'string' ? rawTitle.trim().slice(0, 500) || null : null,
      metaDescription:
        typeof rawDescription === 'string'
          ? rawDescription.trim().replace(/\s+/g, ' ').slice(0, 1000) || null
          : null,
    };

    const replaced = claimed ? await replacePDFBySlug(record) : false;
    if (!replaced) {
      await addPDF(record);
    }

    return NextResponse.json({
      success: true,
      slug,
      url: `/${slug}`,
      fileType,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
