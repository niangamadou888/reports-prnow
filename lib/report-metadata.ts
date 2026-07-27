import type { PDFRecord } from './storage';

const TITLE_MAX_LENGTH = 180;
const DESCRIPTION_MAX_LENGTH = 320;

function cleanText(value: string | null | undefined, maxLength: number): string {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export function filenameTitle(originalName: string): string {
  let stem = originalName
    .replace(/\.(pdf|xlsx|xls)$/i, '')
    .replace(/_+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Package reports append " - Basic S0MTFA4" (or another package label).
  const packageSeparator = stem.lastIndexOf(' - ');
  if (
    packageSeparator > 0 &&
    /\s[A-Z0-9]{6,12}$/i.test(stem.slice(packageSeparator + 3))
  ) {
    stem = stem.slice(0, packageSeparator).trim();
  } else {
    // Unified reports append only the release identifier.
    stem = stem.replace(/\s+[A-Z0-9]{6,12}$/i, '').trim();
  }

  return cleanText(stem, TITLE_MAX_LENGTH);
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
