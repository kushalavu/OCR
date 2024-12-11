const fs = require('fs');
const { PDFDocument } = require('pdf-lib');
const pdfParse = require('pdf-parse');

// Extract specific pages from a PDF
async function extractSpecificPages(pdfPath, pageIndexes = [9, 10]) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const newPdf = await PDFDocument.create();
  for (const index of pageIndexes) {
    const [page] = await newPdf.copyPages(pdfDoc, [index]);
    newPdf.addPage(page);
  }

  return await newPdf.save();
}

// Extract text from a PDF buffer
async function extractTextFromPdfBuffer(pdfBuffer) {
  const data = await pdfParse(pdfBuffer);
  return data.text;
}

module.exports = { extractSpecificPages, extractTextFromPdfBuffer };
