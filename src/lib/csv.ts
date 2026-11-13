/**
 * Escapes a single CSV field according to RFC 4180 and neutralizes
 * spreadsheet formula injection (=, +, -, @, leading tab/CR).
 */
export function sanitizeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Neutralize formula injection even if preceded by whitespace
  if (/^[\t\r ]*[=+\-@]/.test(str) || /^[\t\r]/.test(str)) {
    str = `'${str}`;
  }

  // Quote field if it contains commas, quotes, CR, LF, or leading/trailing spaces
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

export function buildCsvContent(headers: string[], rows: unknown[][]): string {
  const headerLine = headers.map(sanitizeCsvCell).join(',');
  const dataLines = rows.map((row) => row.map(sanitizeCsvCell).join(','));
  return [headerLine, ...dataLines].join('\r\n');
}
