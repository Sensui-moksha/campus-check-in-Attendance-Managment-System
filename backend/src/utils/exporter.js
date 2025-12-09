const { Parser } = require('json2csv');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { StringDecoder } = require('string_decoder');

/**
 * Export utilities for CSV, XLSX, PDF formats
 * Used by exports controller
 */

/**
 * Generate CSV from array of objects
 * @param {Array} data - Array of objects to export
 * @param {Array} fields - Field names/columns (optional, auto-detect if not provided)
 * @returns {String} CSV string
 */
function generateCSVString(data, fields = null) {
  if (!data || data.length === 0) {
    return '';
  }

  if (!fields) {
    fields = Object.keys(data[0]);
  }

  const json2csvParser = new Parser({ fields });
  return json2csvParser.parse(data);
}

/**
 * Generate XLSX buffer from array of objects
 * @param {Array} data - Array of objects
 * @param {String} sheetName - Worksheet name
 * @param {Array} fields - Columns (optional)
 * @returns {Promise<Buffer>} XLSX file buffer
 */
async function generateXLSXBuffer(data, sheetName = 'Sheet1', fields = null) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  if (!data || data.length === 0) {
    worksheet.addRow(['No data']);
    const buffer = await workbook.xlsx.writeBuffer();
    return buffer;
  }

  // Auto-detect fields
  if (!fields) {
    fields = Object.keys(data[0]);
  }

  // Add header row
  worksheet.addRow(fields);
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };

  // Add data rows
  data.forEach(row => {
    const values = fields.map(field => row[field] || '');
    worksheet.addRow(values);
  });

  // Auto-fit columns
  fields.forEach((field, index) => {
    const column = worksheet.getColumn(index + 1);
    let maxLength = field.length;
    column.eachCell({ includeEmpty: true }, cell => {
      const cellLength = String(cell.value).length;
      if (cellLength > maxLength) {
        maxLength = cellLength;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer;
}

/**
 * Generate PDF from array of objects
 * @param {Array} data - Array of objects
 * @param {String} title - PDF title
 * @param {Array} fields - Columns to include
 * @returns {Promise<Buffer>} PDF file buffer
 */
async function generatePDFBuffer(data, title = 'Report', fields = null) {
  return new Promise((resolve, reject) => {
    const pdf = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    const chunks = [];
    pdf.on('data', chunk => chunks.push(chunk));
    pdf.on('end', () => resolve(Buffer.concat(chunks)));
    pdf.on('error', reject);

    // Title
    pdf.fontSize(16).font('Helvetica-Bold').text(title, { align: 'center' });
    pdf.moveDown();

    // Date
    pdf.fontSize(10).font('Helvetica').text(`Generated: ${new Date().toLocaleString()}`, {
      align: 'center',
    });
    pdf.moveDown();

    if (!data || data.length === 0) {
      pdf.fontSize(12).text('No data available', { align: 'center' });
      pdf.end();
      return;
    }

    // Auto-detect fields
    if (!fields) {
      fields = Object.keys(data[0]);
    }

    // Table header
    const columnWidth = (pdf.page.width - 100) / fields.length;
    const startX = pdf.x;
    const startY = pdf.y;

    // Header row
    pdf.fontSize(9).font('Helvetica-Bold');
    fields.forEach((field, index) => {
      pdf.text(field, startX + index * columnWidth, startY, {
        width: columnWidth,
        height: 20,
        align: 'left',
      });
    });

    // Separator line
    pdf.moveTo(startX, startY + 20).lineTo(pdf.page.width - 50, startY + 20).stroke();
    pdf.moveDown();

    // Data rows
    pdf.fontSize(8).font('Helvetica');
    let currentY = pdf.y;
    const pageHeight = pdf.page.height - 100;

    data.forEach((row, rowIndex) => {
      if (currentY > pageHeight) {
        pdf.addPage();
        currentY = 50;
      }

      fields.forEach((field, colIndex) => {
        const value = String(row[field] || '').substring(0, 30);
        pdf.text(value, startX + colIndex * columnWidth, currentY, {
          width: columnWidth - 5,
          height: 15,
          align: 'left',
        });
      });

      currentY += 15;
    });

    pdf.end();
  });
}

/**
 * Format attendance data for export
 * Transforms attendance records into export-friendly structure
 * @param {Array} records - Attendance records with student/session details
 * @param {Object} studentStats - Student attendance statistics (optional)
 * @param {String} markedByRole - Role of person marking attendance
 * @returns {Array} Formatted records
 */
function formatAttendanceForExport(records, studentStats = {}, markedByRole = 'Unknown') {
  return records.map(record => {
    const studentId = record.student?._id?.toString();
    const stats = studentStats[studentId] || { attended: 0, total: 0 };

    // Prefer subject-defined totalClasses if provided on the record; fallback to computed stats
    const totalClasses = record.totalClasses ?? stats.total ?? 0;
    const classesAttended = stats.attended || 0;
    const percentage = totalClasses > 0 ? ((classesAttended / totalClasses) * 100).toFixed(1) : 0;
    
    return {
      rollNo: record.student?.rollNo || '',
      name: record.student?.name || 'Unknown',
      classesAttended,
      totalClasses,
      markedBy: markedByRole,
      status: record.status || 'absent',
      overallPercentage: percentage,
    };
  });
}

module.exports = {
  generateCSVString,
  generateXLSXBuffer,
  generatePDFBuffer,
  formatAttendanceForExport,
};
