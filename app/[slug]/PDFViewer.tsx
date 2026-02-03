'use client';

interface PDFViewerProps {
  slug: string;
  originalName: string;
  fileType: 'pdf' | 'excel';
}

export default function PDFViewer({ slug, originalName, fileType }: PDFViewerProps) {
  const fileUrl = `/api/pdfs/${slug}`;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isExcel = fileType === 'excel';

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <header className="bg-gray-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {isExcel ? (
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 11.5l2 3.5-2 3.5h1.5l1.25-2.5L13.5 18.5H15l-2-3.5 2-3.5h-1.5l-1.25 2.5-1.25-2.5H9.5z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM10 19l-1.5-6h1l1 4 1-4h1L11 19h-1z"/>
            </svg>
          )}
          <span className="text-white font-medium truncate max-w-md">
            {originalName}
          </span>
        </div>
        <button
          onClick={handleDownload}
          className={`flex items-center gap-2 px-4 py-2 text-white rounded-md transition-colors ${
            isExcel ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
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
        {isExcel ? (
          <div className="w-full flex flex-col items-center justify-center text-center p-8">
            <svg className="w-24 h-24 text-green-500 mb-6" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 11.5l2 3.5-2 3.5h1.5l1.25-2.5L13.5 18.5H15l-2-3.5 2-3.5h-1.5l-1.25 2.5-1.25-2.5H9.5z"/>
            </svg>
            <h2 className="text-2xl font-semibold text-white mb-3">{originalName}</h2>
            <p className="text-gray-400 mb-8 max-w-md">
              Excel files cannot be previewed in the browser. Click the button below to download and view in Excel.
            </p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-3 px-8 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Excel File
            </button>
          </div>
        ) : (
          <iframe
            src={fileUrl}
            className="w-full h-full min-h-[calc(100vh-60px)]"
            title={originalName}
          />
        )}
      </main>
    </div>
  );
}
