const fs = require('fs');
const db = require('../db/connection');
const { extractSpecificPages, extractTextFromPdfBuffer } = require('../utils/pdfUtils');

// Handle file upload and processing
async function uploadFile(req, res) {
  const filePath = req.file.path;

  try {
    // Extract specific pages
    const specificPagesBuffer = await extractSpecificPages(filePath);

    // Extract text from extracted pages
    const extractedText = await extractTextFromPdfBuffer(specificPagesBuffer);

    // Save extracted text to database
    db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [extractedText], (err) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err });
      }

      res.json({ message: 'Text extracted and saved to database', text: extractedText });
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Error processing PDF', details: error.message });
  } finally {
    // Clean up uploaded file
    fs.unlinkSync(filePath);
  }
}

module.exports = { uploadFile };
