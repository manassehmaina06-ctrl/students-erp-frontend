const PDFDocument = require('pdfkit');

/**
 * Generate a payment receipt PDF.
 *
 * @param {Object} payment  - The payment record (Mongoose subdoc)
 * @param {Object} student  - The student record
 * @param {Object} fees     - { total, paid, balance }
 * @param {Object} programme - { name, code } or null
 * @returns {PDFDocument}   - The PDFKit document stream
 */
function generateReceiptPdf(payment, student, fees, programme) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    info: {
      Title: `Receipt ${payment.receiptNumber}`,
      Author: 'Strathmore University',
      Subject: 'Payment Receipt',
    },
  });

  const pageWidth = doc.page.width;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const studentName = [
    student.personalInfo?.title,
    student.personalInfo?.surname,
    student.personalInfo?.lastName,
  ].filter(Boolean).join(' ') || 'Unnamed';

  // ---------- HEADER ----------
  doc
    .fontSize(20)
    .fillColor('#1e3a8a')
    .text('STRATHMORE UNIVERSITY', { align: 'center' })
    .moveDown(0.2);

  doc
    .fontSize(14)
    .fillColor('#4b5563')
    .text('Payment Receipt', { align: 'center' })
    .moveDown(1);

  // Horizontal rule
  doc
    .moveTo(margin, doc.y)
    .lineTo(pageWidth - margin, doc.y)
    .strokeColor('#9ca3af')
    .lineWidth(1)
    .stroke()
    .moveDown(1);

  // ---------- RECEIPT META ----------
  const metaTop = doc.y;
  doc.fontSize(10).fillColor('#374151');

  doc.text('Receipt Number', margin, metaTop, { width: 150 });
  doc.fontSize(12).fillColor('#111827').text(payment.receiptNumber || '—', margin, metaTop + 14);

  doc.fontSize(10).fillColor('#374151')
    .text('Date Issued', pageWidth / 2, metaTop, { width: 150 });
  doc.fontSize(12).fillColor('#111827')
    .text(
      payment.receiptIssuedAt
        ? new Date(payment.receiptIssuedAt).toLocaleString()
        : (payment.confirmedAt ? new Date(payment.confirmedAt).toLocaleString() : '—'),
      pageWidth / 2,
      metaTop + 14
    );

  doc.y = metaTop + 45;

  // ---------- STUDENT BLOCK ----------
  doc.moveDown(1);
  doc.fontSize(11).fillColor('#1e3a8a').text('Student Details');
  doc.moveDown(0.3);

  const studentTop = doc.y;
  doc.fontSize(10).fillColor('#374151').text('Name', margin, studentTop);
  doc.fontSize(11).fillColor('#111827').text(studentName, margin, studentTop + 13);

  doc.fontSize(10).fillColor('#374151').text('Student Number', pageWidth / 2, studentTop);
  doc.fontSize(11).fillColor('#111827').text(student.studentNumber || '—', pageWidth / 2, studentTop + 13);

  doc.fontSize(10).fillColor('#374151').text('Programme', margin, studentTop + 38);
  doc.fontSize(11).fillColor('#111827').text(
    programme ? `${programme.name} (${programme.code})` : '—',
    margin,
    studentTop + 51
  );

  doc.fontSize(10).fillColor('#374151').text('School Email', pageWidth / 2, studentTop + 38);
  doc.fontSize(11).fillColor('#111827').text(student.schoolEmail || '—', pageWidth / 2, studentTop + 51);

  doc.y = studentTop + 80;
  doc.moveDown(1);

  // ---------- PAYMENT DETAILS ----------
  doc.fontSize(11).fillColor('#1e3a8a').text('Payment Details');
  doc.moveDown(0.5);

  const tableTop = doc.y;
  const rowHeight = 22;
  const col1 = margin;
  const col2 = margin + 200;

  // Box
  doc
    .rect(margin, tableTop, contentWidth, rowHeight * 4)
    .strokeColor('#d1d5db')
    .lineWidth(0.5)
    .stroke();

  const rows = [
    ['Amount',    `KES ${Number(payment.amount || 0).toLocaleString()}`],
    ['Method',    (payment.method || '—').toUpperCase()],
    ['Reference', payment.reference || '—'],
    ['Status',    (payment.status || 'confirmed').toUpperCase()],
  ];

  rows.forEach((r, i) => {
    const y = tableTop + i * rowHeight;
    if (i > 0) {
      doc.moveTo(margin, y).lineTo(pageWidth - margin, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    }
    doc.fontSize(10).fillColor('#6b7280').text(r[0], col1 + 10, y + 6, { width: 150 });
    doc.fontSize(11).fillColor('#111827').text(r[1], col2, y + 6, { width: contentWidth - 210 });
  });

  doc.y = tableTop + rowHeight * 4 + 20;

  // ---------- FEE SUMMARY ----------
  doc.fontSize(11).fillColor('#1e3a8a').text('Fee Summary');
  doc.moveDown(0.5);

  const summaryTop = doc.y;
  const summaryBoxHeight = 60;

  doc
    .rect(margin, summaryTop, contentWidth, summaryBoxHeight)
    .fillAndStroke('#f3f4f6', '#d1d5db');

  doc.fontSize(10).fillColor('#6b7280')
    .text('Total Billed', margin + 20, summaryTop + 15)
    .text('Total Paid', margin + contentWidth / 3 + 20, summaryTop + 15)
    .text('Balance', margin + (contentWidth * 2) / 3 + 20, summaryTop + 15);

  doc.fontSize(13).fillColor('#111827')
    .text(`KES ${Number(fees.total || 0).toLocaleString()}`, margin + 20, summaryTop + 30)
    .text(`KES ${Number(fees.paid || 0).toLocaleString()}`, margin + contentWidth / 3 + 20, summaryTop + 30);

  const balanceColor = (fees.balance || 0) > 0 ? '#dc2626' : '#16a34a';
  doc.fillColor(balanceColor)
    .text(`KES ${Number(fees.balance || 0).toLocaleString()}`, margin + (contentWidth * 2) / 3 + 20, summaryTop + 30);

  doc.y = summaryTop + summaryBoxHeight + 30;

  // ---------- FOOTER ----------
  doc.moveDown(2);
   doc.fontSize(8).fillColor('#9ca3af')
    .text('This is a computer-generated receipt and does not require a signature.', margin, doc.y, { align: 'center', width: contentWidth })
    .moveDown(0.3)
    .text('Thank you for your payment.', margin, doc.y, { align: 'center', width: contentWidth });
  doc
    .fontSize(8)
    .fillColor('#9ca3af')
    .text(
      `Receipt ${payment.receiptNumber} · Generated ${new Date().toLocaleString()}`,
      margin,
      doc.page.height - 50,
      { align: 'center', width: contentWidth }
    );

  doc.end();
  return doc;
}

module.exports = generateReceiptPdf;