'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface PDFRecord {
  slug: string;
  originalName: string;
  uploadedAt: string;
  fileSize: number;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function AdminPage() {
  const [pdfs, setPdfs] = useState<PDFRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchPdfs = async () => {
    try {
      const response = await fetch('/api/pdfs');
      const data = await response.json();
      setPdfs(data);
    } catch (error) {
      console.error('Error fetching PDFs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this PDF?')) return;

    setDeleting(slug);
    try {
      const response = await fetch(`/api/pdfs/${slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setPdfs(pdfs.filter((pdf) => pdf.slug !== slug));
      } else {
        alert('Failed to delete PDF');
      }
    } catch (error) {
      console.error('Error deleting PDF:', error);
      alert('Failed to delete PDF');
    } finally {
      setDeleting(null);
    }
  };

  const copyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/${slug}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-900">All Reports</h1>
          <Link
            href="/"
            className="px-4 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-800 transition-colors"
          >
            Upload New
          </Link>
        </div>
      </header>

      <main className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : pdfs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <svg
                className="mx-auto h-12 w-12 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <p className="text-gray-500 mb-4">No PDFs uploaded yet</p>
              <Link
                href="/"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Upload your first PDF
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      File Name
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Slug
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Size
                    </th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                      Uploaded
                    </th>
                    <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {pdfs.map((pdf) => (
                    <tr key={pdf.slug} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-900 truncate block max-w-xs">
                          {pdf.originalName}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                          {pdf.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatFileSize(pdf.fileSize)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600">
                          {formatDate(pdf.uploadedAt)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => copyLink(pdf.slug)}
                            className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                          >
                            Copy Link
                          </button>
                          <a
                            href={`/${pdf.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded hover:bg-blue-50 transition-colors"
                          >
                            View
                          </a>
                          <button
                            onClick={() => handleDelete(pdf.slug)}
                            disabled={deleting === pdf.slug}
                            className="px-3 py-1 text-sm text-red-600 hover:text-red-700 border border-red-300 rounded hover:bg-red-50 transition-colors disabled:opacity-50"
                          >
                            {deleting === pdf.slug ? 'Deleting...' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white border-t border-gray-200 px-6 py-4">
        <p className="text-center text-sm text-gray-500">
          PR Now Reports - Secure PDF Hosting
        </p>
      </footer>
    </div>
  );
}
