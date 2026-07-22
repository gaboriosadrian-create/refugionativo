import { Logger } from '../../../core/logger/Logger';

export class ExportService {
  /**
   * Main export orchestrator. Creates downloads dynamically using Blobs
   */
  public static exportData(
    data: { columns: string[]; rows: any[] },
    format: 'csv' | 'json' | 'excel' | 'pdf',
    title: string
  ): void {
    Logger.info(`[ExportService] Exporting data in format: ${format} for ${title}`);

    try {
      const sanitizedTitle = title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      
      switch (format) {
        case 'json':
          this.downloadBlob(
            JSON.stringify(data, null, 2),
            `${sanitizedTitle}.json`,
            'application/json'
          );
          break;

        case 'csv':
          const csvContent = this.convertToCSV(data);
          this.downloadBlob(
            csvContent,
            `${sanitizedTitle}.csv`,
            'text/csv;charset=utf-8;'
          );
          break;

        case 'excel':
          // For clients who want an Excel-compatible tab-separated format with special XML markers or raw CSV
          const excelContent = this.convertToCSV(data, '\t');
          this.downloadBlob(
            excelContent,
            `${sanitizedTitle}.xls`,
            'application/vnd.ms-excel;charset=utf-8;'
          );
          break;

        case 'pdf':
          // Open stylized print layout for executive signatures
          this.triggerBrowserPrint(data, title);
          break;
      }
    } catch (err) {
      Logger.error(`[ExportService] Error exporting dataset:`, err);
    }
  }

  /**
   * Formats a data object into standard CSV string formats
   */
  private static convertToCSV(data: { columns: string[]; rows: any[] }, separator = ','): string {
    const headers = data.columns.join(separator);
    const rowLines = data.rows.map(row => {
      return data.columns.map(col => {
        const val = row[col] !== undefined ? String(row[col]) : '';
        // Escape quotes and wrap inside double quotes if separators are contained inside value
        const escaped = val.replace(/"/g, '""');
        return escaped.includes(separator) || escaped.includes('\n') ? `"${escaped}"` : escaped;
      }).join(separator);
    });
    return [headers, ...rowLines].join('\n');
  }

  /**
   * Triggers file downloads client-side
   */
  private static downloadBlob(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    Logger.info(`[ExportService] Successfully triggered client-side file download for: ${filename}`);
  }

  /**
   * Opens a printable window representing a beautiful executive PDF layout
   */
  private static triggerBrowserPrint(data: { columns: string[]; rows: any[] }, title: string): void {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor habilite los popups en su navegador para exportar a PDF.');
      return;
    }

    const rowsHtml = data.rows.map(row => `
      <tr>
        ${data.columns.map(col => `<td>${row[col] !== undefined ? row[col] : '-'}</td>`).join('')}
      </tr>
    `).join('');

    const headersHtml = data.columns.map(col => `<th>${col}</th>`).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>${title}</title>
          <style>
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              border-bottom: 2px solid #054f3c;
              padding-bottom: 20px;
              margin-bottom: 30px;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .title {
              font-size: 24px;
              font-weight: 800;
              color: #054f3c;
              margin: 0;
            }
            .meta {
              font-size: 11px;
              color: #64748b;
              text-align: right;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #054f3c;
              color: #ffffff;
              text-align: left;
              padding: 10px 12px;
              font-size: 12px;
              text-transform: uppercase;
              letter-spacing: 0.05em;
            }
            td {
              padding: 10px 12px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 12px;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .footer {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              color: #94a3b8;
            }
            @media print {
              .no-print { display: none; }
              body { margin: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="title">${title}</h1>
              <p style="margin: 5px 0 0 0; font-size: 12px; color: #475569;">Informe de Negocio Automatizado - StayFlow BI Platform</p>
            </div>
            <div class="meta">
              <p>Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}</p>
              <p>Generador: Sistema Ejecutivo StayFlow</p>
            </div>
          </div>

          <button class="no-print" onclick="window.print()" style="margin-bottom: 20px; padding: 10px 20px; background-color: #054f3c; color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 12px;">
            Imprimir o Guardar como PDF
          </button>

          <table>
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer">
            <span>© ${new Date().getFullYear()} StayFlow Platform - Confidencial para Uso Interno</span>
            <span>Página 1 de 1</span>
          </div>

          <script>
            // Auto trigger print dialogue in modern browsers
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
