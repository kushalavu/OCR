// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const pdfParse = require('pdf-parse');
// const db = require('../db/connection');
// const { PDFDocument } = require('pdf-lib');

// const router = express.Router();
// // 
// // Multer setup
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// router.post('/upload', upload.single('file'), async (req, res) => {
//   const filePath = req.file.path;

//   try {
//     const specificPagesBuffer = await extractSpecificPages(filePath);
//     const text = await extractTextFromPdfBuffer(specificPagesBuffer);

//     db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [text], (err, results) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error', details: err });
//       }

//       const fileId = results.insertId;
//       res.json({ message: 'Text extracted and saved to database', fileId, text });
//     });
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: 'Error processing PDF', details: error.message });
//   } finally {
//     fs.unlinkSync(filePath);
//   }
// });

// router.get('/extracted-data', (req, res) => {
//   const fileId = req.query.id;

//   if (!fileId) {
//     return res.status(400).json({ error: 'File ID is required' });
//   }


//   const query = 'SELECT id, extracted_text FROM ocr_results WHERE id = ?';

//   db.query(query, [fileId], (err, results) => {
//     if (err) {
//       console.error('Database error:', err);
//       return res.status(500).json({ error: 'Database error', details: err });
//     }

//     if (results.length === 0) {
//       return res.status(404).json({ message: 'No data found for the specified file ID' });
//     }

//     res.json({
//       message: 'Extracted data retrieved successfully',
//       data: results[0],
//     });
//   });
// });

// async function extractSpecificPages(pdfPath) {
//   const pdfBuffer = fs.readFileSync(pdfPath);
//   const pdfDoc = await PDFDocument.load(pdfBuffer);

//   const newPdf = await PDFDocument.create();
//   const pageIndexes = [9, 10]; 

//   for (const index of pageIndexes) {
//     const [page] = await newPdf.copyPages(pdfDoc, [index]);
//     newPdf.addPage(page);
//   }

//   const extractedPdfBuffer = await newPdf.save();
//   return extractedPdfBuffer;
// }


// async function extractTextFromPdfBuffer(pdfBuffer) {
//   try {
//     const data = await pdfParse(pdfBuffer);
//     return data.text;  
//   } catch (error) {
//     throw new Error('Error extracting text from PDF: ' + error.message);
//   }
// }

// module.exports = router;
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const { PDFDocument } = require('pdf-lib');
const db = require('../db/connection');

const router = express.Router();

// Multer setup for file upload
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// POST route for file upload and text extraction
router.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;

  try {
    // Extract pages based on specific text
    const specificPagesBuffer = await extractPagesBasedOnExactText(filePath, 'Your Pets Food Sensitivities: Overview');
    
    // Extract text from the newly created PDF buffer
    const text = await extractTextFromPdfBuffer(specificPagesBuffer);

    // Insert extracted text into database
    db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [text], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err });
      }

      const fileId = results.insertId;
      res.json({ message: 'Text extracted and saved to database', fileId, text });
    });
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ error: 'Error processing PDF', details: error.message });
  } finally {
    fs.unlinkSync(filePath); // Clean up the uploaded file after processing
  }
});

// GET route to retrieve extracted data from the database
router.get('/extracted-data', (req, res) => {
  const fileId = req.query.id;

  if (!fileId) {
    return res.status(400).json({ error: 'File ID is required' });
  }

  const query = 'SELECT id, extracted_text FROM ocr_results WHERE id = ?';

  db.query(query, [fileId], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error', details: err });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No data found for the specified file ID' });
    }

    res.json({
      message: 'Extracted data retrieved successfully',
      data: results[0],
    });
  });
});

// Function to extract specific pages based on the presence of the exact text
async function extractPagesBasedOnExactText(pdfPath, searchText) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);
  const newPdf = await PDFDocument.create();
  const totalPages = pdfDoc.getPageCount();
  const pagesToExtract = [];

  // Loop through each page to extract text and check for specific exact sentence
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.getPage(pageIndex);
    const pageText = await extractTextFromPage(pdfPath, pageIndex);

    // Check if the page contains the exact text (case-sensitive)
    if (pageText.includes(searchText)) {
      pagesToExtract.push(pageIndex); // Only store pages with the exact text
    }
  }

  // If no pages match the text, return empty buffer or handle accordingly
  if (pagesToExtract.length === 0) {
    return Buffer.from(''); // Or handle case when no pages are found
  }

  // Add pages that contain the exact sentence to the new PDF
  for (const pageIndex of pagesToExtract) {
    const [page] = await newPdf.copyPages(pdfDoc, [pageIndex]);
    newPdf.addPage(page);
  }

  // Return the new PDF buffer with the extracted pages
  const extractedPdfBuffer = await newPdf.save();
  return extractedPdfBuffer;
}

// Function to extract text from a specific page using pdf-parse
async function extractTextFromPage(pdfPath, pageIndex) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const data = await pdfParse(pdfBuffer);
  const pageText = data.text.split('\n'); // Split by lines for easier matching

  // Return all the text as a string for matching
  return pageText.join(' ').trim();
}

// Function to extract all text from the PDF
async function extractTextFromPdfBuffer(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;  // Return the text from the entire PDF
  } catch (error) {
    throw new Error('Error extracting text from PDF: ' + error.message);
  }
}

module.exports = router;




