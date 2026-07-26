'use client';

import ExcelViewer from './ExcelViewer';

interface PDFViewerProps {
  slug: string;
  originalName: string;
  displayTitle: string;
  fileType: 'pdf' | 'excel';
  initialSheet?: string;
}

export default function PDFViewer({
  slug,
  originalName,
  displayTitle,
  fileType,
  initialSheet,
}: PDFViewerProps) {
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
      <header className="flex items-center justify-between gap-3 bg-gray-800 px-3 py-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          <a
            href="https://prnow.io"
            target="_blank"
            rel="noopener"
            aria-label="PRNow — press release distribution"
            className="flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="PRNow"
              className="h-5 sm:h-6 w-auto brightness-0 invert"
            />
          </a>
          <span className="hidden h-5 w-px flex-shrink-0 bg-gray-600 sm:block" aria-hidden="true" />
          {isExcel ? (
            <svg className="w-5 h-5 text-green-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM9.5 11.5l2 3.5-2 3.5h1.5l1.25-2.5L13.5 18.5H15l-2-3.5 2-3.5h-1.5l-1.25 2.5-1.25-2.5H9.5z"/>
            </svg>
          ) : (
            <svg className="w-5 h-5 text-red-400 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 2l5 5h-5V4zM10 19l-1.5-6h1l1 4 1-4h1L11 19h-1z"/>
            </svg>
          )}
          <h1 className="min-w-0 truncate text-sm font-medium text-white sm:text-base">
            {displayTitle}
          </h1>
        </div>
        <button
          onClick={handleDownload}
          className={`flex min-h-11 flex-shrink-0 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:px-4 ${
            isExcel ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
          aria-label={`Download ${displayTitle}`}
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
          <span className="hidden sm:inline">Download</span>
        </button>
      </header>

      <main className="flex-1 flex">
        {isExcel ? (
          <ExcelViewer slug={slug} originalName={originalName} initialSheet={initialSheet} />
        ) : (
          <iframe
            src={fileUrl}
            className="w-full h-full min-h-[calc(100vh-110px)]"
            title={originalName}
          />
        )}
      </main>

      <footer className="bg-gray-800 px-6 py-3 text-center text-xs sm:text-sm text-gray-400 border-t border-gray-700">
        This press release distribution report is powered by{' '}
        <a
          href="https://prnow.io"
          target="_blank"
          rel="noopener"
          className="text-blue-400 hover:text-blue-300 underline underline-offset-2"
        >
          PRNow
        </a>{' '}
        — affordable press release distribution to 400+ publishers worldwide.
      </footer>
    </div>
  );
}
