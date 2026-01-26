'use client';

interface PDFViewerProps {
  slug: string;
  originalName: string;
}

export default function PDFViewer({ slug, originalName }: PDFViewerProps) {
  const pdfUrl = `/api/pdfs/${slug}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-white font-medium truncate max-w-md">
            {originalName}
          </span>
        </div>
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
      </header>

      <main className="flex-1 flex">
        <iframe
          src={pdfUrl}
          className="w-full h-full min-h-[calc(100vh-60px)]"
          title={originalName}
        />
      </main>
    </div>
  );
}
