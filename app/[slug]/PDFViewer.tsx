'use client';

import { useState } from 'react';
import ExcelViewer from './ExcelViewer';

interface PDFViewerProps {
  slug: string;
  originalName: string;
  displayTitle: string;
  fileType: 'pdf' | 'excel';
  initialSheet?: string;
}

async function writeToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('navigator.clipboard.writeText failed, falling back to execCommand', err);
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } catch (err) {
    console.error('document.execCommand(copy) fallback failed', err);
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

export default function PDFViewer({
  slug,
  originalName,
  displayTitle,
  fileType,
  initialSheet,
}: PDFViewerProps) {
  const fileUrl = `/api/pdfs/${slug}`;
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = originalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = async () => {
    const copied = await writeToClipboard(window.location.href);
    setCopyStatus(copied ? 'copied' : 'error');
    window.setTimeout(() => setCopyStatus('idle'), 2500);
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
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 ${
              copyStatus === 'copied'
                ? 'border-green-500 bg-green-600 text-white hover:bg-green-700'
                : copyStatus === 'error'
                  ? 'border-red-500 bg-red-600 text-white hover:bg-red-700'
                  : 'border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600'
            }`}
            aria-label={`${
              copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Copy failed' : 'Copy link to'
            } ${displayTitle}`}
          >
            {copyStatus === 'copied' ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <rect x="9" y="9" width="11" height="11" rx="2" strokeWidth={2} />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2h3" />
              </svg>
            )}
            <span>{copyStatus === 'copied' ? 'Copied' : copyStatus === 'error' ? 'Retry' : 'Copy'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-gray-800 sm:px-4 ${
              isExcel ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
            aria-label={`Download ${displayTitle}`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
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
          <span className="sr-only" role="status" aria-live="polite">
            {copyStatus === 'copied' ? 'Report link copied.' : copyStatus === 'error' ? 'Could not copy the report link.' : ''}
          </span>
        </div>
      </header>

      <main className="flex-1 flex">
        {isExcel ? (
          <ExcelViewer slug={slug} initialSheet={initialSheet} />
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
