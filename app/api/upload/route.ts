import { NextRequest, NextResponse } from 'next/server';
import { generateUniqueSlug, addPDF, saveFile, isPDFFile, isExcelFile, FileType } from '@/lib/storage';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

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

    // Generate unique slug from filename
    const slug = await generateUniqueSlug(file.name);

    // Save file to local disk
    const filePath = await saveFile(file, slug, fileType);

    // Add record to MySQL
    await addPDF({
      slug,
      originalName: file.name,
      uploadedAt: new Date().toISOString(),
      fileSize: file.size,
      filePath,
      fileType,
    });

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
