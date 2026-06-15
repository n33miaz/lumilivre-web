/**
 * Dashboard report export.
 *
 * The page builds a framework-agnostic {@link DashboardReport} (already
 * localized via i18n) and hands it here. This module owns only the formatting
 * and the file I/O, and pulls the heavy `exceljs` / `jspdf` libraries in via
 * dynamic `import()` so they stay out of the initial bundle — they load only
 * when the user actually exports.
 */

export interface ReportTable {
  /** Worksheet name (xlsx) and section heading (pdf). */
  name: string;
  columns: string[];
  rows: Array<Array<string | number>>;
}

export interface DashboardReport {
  title: string;
  /** Pre-formatted "generated on <date>" caption. */
  generatedAtLabel: string;
  tables: ReportTable[];
}

const LUMI_PRIMARY_HEX = '762075';
const LUMI_PRIMARY_RGB: [number, number, number] = [118, 32, 117];
const CAPTION_RGB: [number, number, number] = [107, 114, 128]; // gray-500
const ZEBRA_HEX = 'F6F0F7';
const ZEBRA_RGB: [number, number, number] = [246, 240, 247];

/** Builds an `<a download>` for an in-memory blob and clicks it. */
export const triggerDownload = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Defer revocation off the click tick so the browser has started consuming
  // the blob before the object URL is freed (guards against rare cancelled
  // downloads with larger files in some browsers).
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
};

/** Excel-safe sheet name: ≤31 chars, none of \ / ? * [ ] : */
const toSheetName = (name: string, fallback: string) =>
  (name.replace(/[\\/?*[\]:]/g, ' ').trim() || fallback).slice(0, 31);

/** Formatted `.xlsx` — one styled worksheet per table. */
export const exportDashboardXlsx = async (
  report: DashboardReport,
  filename: string,
) => {
  const mod = await import('exceljs');
  // Vite serves exceljs's UMD browser build, so the constructor may sit on
  // `.default`; the published types expose it on the namespace. Reconcile both.
  const ExcelJS = (mod as unknown as { default?: typeof mod }).default ?? mod;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'LumiLivre';
  workbook.created = new Date();

  report.tables.forEach((table, tableIndex) => {
    const sheet = workbook.addWorksheet(
      toSheetName(table.name, `Tabela ${tableIndex + 1}`),
      { views: [{ state: 'frozen', ySplit: 1 }] },
    );

    sheet.columns = table.columns.map((header, index) => ({
      header,
      key: `c${index}`,
      width: index === 0 ? 40 : 18,
    }));

    const headerRow = sheet.getRow(1);
    headerRow.height = 22;
    headerRow.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'left' };
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: `FF${LUMI_PRIMARY_HEX}` },
      };
    });

    table.rows.forEach((row) => sheet.addRow(row));

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.alignment = { vertical: 'middle' };
      if (rowNumber % 2 === 1) {
        row.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: `FF${ZEBRA_HEX}` },
          };
        });
      }
      row.eachCell((cell) => {
        if (typeof cell.value === 'number') {
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, filename);
};

/** Real multi-section PDF report — title, caption, one table per section. */
export const exportDashboardPdf = async (
  report: DashboardReport,
  filename: string,
) => {
  const [{ jsPDF }, autoTableMod] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableMod.default;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 40;
  let cursorY = 54;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...LUMI_PRIMARY_RGB);
  doc.text(report.title, marginX, cursorY);

  cursorY += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...CAPTION_RGB);
  doc.text(report.generatedAtLabel, marginX, cursorY);
  cursorY += 14;

  const pageHeight = doc.internal.pageSize.getHeight();
  const PAGE_MARGIN_BOTTOM = 40; // autotable's default bottom margin at unit 'pt'

  report.tables.forEach((table) => {
    // Keep each section heading on the same page as the head of its table.
    // Without this, a heading could be orphaned at the bottom while autotable
    // pushes the table itself to the next page. ~120pt ≈ gap + title + header row.
    if (cursorY + 120 > pageHeight - PAGE_MARGIN_BOTTOM) {
      doc.addPage();
      cursorY = 54;
    }
    cursorY += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...LUMI_PRIMARY_RGB);
    doc.text(table.name, marginX, cursorY);

    autoTable(doc, {
      startY: cursorY + 8,
      head: [table.columns],
      body: table.rows.map((row) => row.map((cell) => String(cell))),
      margin: { left: marginX, right: marginX },
      styles: { fontSize: 9, cellPadding: 6, overflow: 'linebreak' },
      headStyles: {
        fillColor: LUMI_PRIMARY_RGB,
        textColor: 255,
        fontStyle: 'bold',
      },
      alternateRowStyles: { fillColor: ZEBRA_RGB },
    });

    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY;
    cursorY = lastY ?? cursorY + 8;
  });

  doc.save(filename);
};
