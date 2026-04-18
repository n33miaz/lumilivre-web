export type DashboardExportRow = Record<
  string,
  string | number | boolean | null | undefined
>;

const escapeCsvValue = (
  value: string | number | boolean | null | undefined,
) => {
  const normalized = value === null || value === undefined ? '' : String(value);
  if (!/[",\n\r]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
};

export const toCsv = (rows: DashboardExportRow[]) => {
  if (rows.length === 0) return '';

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map((row) =>
      headers.map((header) => escapeCsvValue(row[header])).join(','),
    ),
  ];

  return lines.join('\n');
};

export const downloadCsv = (filename: string, rows: DashboardExportRow[]) => {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const printDashboardPdf = () => {
  window.print();
};
