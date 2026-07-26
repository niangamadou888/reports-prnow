import type { PDFRecord } from './storage';

const TITLE_MAX_LENGTH = 180;
const DESCRIPTION_MAX_LENGTH = 320;

function cleanText(value: string | null | undefined, maxLength: number): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

function filenameTitle(originalName: string): string {
  return cleanText(
    originalName.replace(/\.(pdf|xlsx|xls)$/i, '').replace(/[-_]+/g, ' '),
    TITLE_MAX_LENGTH,
  );
}

export interface ResolvedReportMetadata {
  title: string;
  description: string;
}

export function resolveReportMetadata(
  report: Pick<PDFRecord, 'originalName' | 'fileType' | 'metaTitle' | 'metaDescription'>,
): ResolvedReportMetadata {
  const title =
    cleanText(report.metaTitle, TITLE_MAX_LENGTH) ||
    filenameTitle(report.originalName) ||
    'PRNow Report';
  const description =
    cleanText(report.metaDescription, DESCRIPTION_MAX_LENGTH) ||
    `View the PRNow distribution report for “${title},” including verified publication placements and live coverage links.`;

  return { title, description };
}
