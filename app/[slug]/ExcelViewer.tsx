'use client';

import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';

interface ExcelViewerProps {
  slug: string;
  originalName: string;
  initialSheet?: string;
}

interface SheetData {
  name: string;
  headers: string[];
  rows: string[][];
}

function isUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

export default function ExcelViewer({ slug, originalName, initialSheet }: ExcelViewerProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedSheet, setCopiedSheet] = useState<number | null>(null);

  useEffect(() => {
    async function loadExcel() {
      try {
        const res = await fetch(`/api/pdfs/${slug}`);
        if (!res.ok) throw new Error('Failed to fetch file');

        const buffer = await res.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const parsed: SheetData[] = workbook.SheetNames.map((name) => {
          const sheet = workbook.Sheets[name];
          const json = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' });

          if (json.length === 0) {
            return { name, headers: [], rows: [] };
          }

          const headers = json[0].map(String);
          const rows = json.slice(1).map((row) => row.map(String));

          return { name, headers, rows };
        });

        setSheets(parsed);

        // Set initial sheet based on query parameter
        if (initialSheet !== undefined) {
          const sheetIndex = parseInt(initialSheet, 10);
          if (!isNaN(sheetIndex) && sheetIndex >= 0 && sheetIndex < parsed.length) {
            // It's a valid index
            setActiveSheet(sheetIndex);
          } else {
            // Try to find by name (case-insensitive)
            const nameIndex = parsed.findIndex(
              (s) => s.name.toLowerCase() === initialSheet.toLowerCase()
            );
            if (nameIndex !== -1) {
              setActiveSheet(nameIndex);
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load file');
      } finally {
        setLoading(false);
      }
    }

    loadExcel();
  }, [slug, initialSheet]);

  if (loading) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">Loading spreadsheet...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <p className="text-red-400">Error: {error}</p>
      </div>
    );
  }

  const current = sheets[activeSheet];

  const findUrlColumn = (sheet: SheetData): number => {
    for (let c = 0; c < (sheet.headers.length || (sheet.rows[0]?.length ?? 0)); c++) {
      if (sheet.rows.some((row) => isUrl(row[c] || ''))) return c;
    }
    return -1;
  };

  const copySheetUrls = async (sheetIdx: number) => {
    const sheet = sheets[sheetIdx];
    if (!sheet) return;
    const colIdx = findUrlColumn(sheet);
    if (colIdx === -1) return;
    const urls = sheet.rows
      .map((row) => (row[colIdx] || '').trim())
      .filter((value) => isUrl(value));
    if (urls.length === 0) return;
    try {
      await navigator.clipboard.writeText(urls.join('\n'));
      setCopiedSheet(sheetIdx);
      setTimeout(() => setCopiedSheet((s) => (s === sheetIdx ? null : s)), 1500);
    } catch {
      // Clipboard write may fail in restricted contexts; ignore silently.
    }
  };

  if (!current || (current.headers.length === 0 && current.rows.length === 0)) {
    return (
      <div className="w-full flex items-center justify-center p-12">
        <p className="text-gray-400">This sheet is empty.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col overflow-hidden">
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex items-center bg-gray-800 border-b border-gray-700 px-2 pt-2 gap-1 overflow-x-auto">
          {sheets.map((sheet, i) => {
            const showCopy = i === 2 && findUrlColumn(sheet) !== -1;
            const isCopied = copiedSheet === i;
            return (
              <div key={sheet.name} className="flex items-center gap-1">
                <button
                  onClick={() => setActiveSheet(i)}
                  className={`px-4 py-2 text-sm rounded-t-md whitespace-nowrap transition-colors ${
                    i === activeSheet
                      ? 'bg-gray-900 text-white border-t border-x border-gray-600'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  }`}
                >
                  {sheet.name}
                </button>
                {showCopy && (
                  <button
                    type="button"
                    onClick={() => copySheetUrls(i)}
                    title={isCopied ? 'Copied!' : 'Copy all URLs in this sheet'}
                    className={`px-2 py-1 text-xs rounded border transition-colors ${
                      isCopied
                        ? 'bg-green-600 border-green-500 text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white'
                    }`}
                  >
                    {isCopied ? 'Copied' : 'Copy all URLs'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="bg-gray-700 text-gray-400 px-3 py-2 text-center border border-gray-600 w-12 font-normal">
                #
              </th>
              {current.headers.map((header, i) => (
                <th
                  key={i}
                  className="bg-gray-700 text-gray-200 px-3 py-2 text-left border border-gray-600 font-semibold whitespace-nowrap"
                >
                  {header || <span className="text-gray-500 italic">—</span>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.rows.map((row, rowIdx) => (
              <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'}>
                <td className="bg-gray-800 text-gray-500 px-3 py-1.5 text-center border border-gray-700 text-xs">
                  {rowIdx + 1}
                </td>
                {current.headers.map((_, colIdx) => (
                  <td
                    key={colIdx}
                    className="text-gray-300 px-3 py-1.5 border border-gray-700 whitespace-nowrap max-w-xs truncate"
                    title={row[colIdx] || ''}
                  >
                    {row[colIdx] || ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
