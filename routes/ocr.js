const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const db = require('../db/connection');
const { PDFDocument } = require('pdf-lib');
const Tesseract = require('tesseract.js');

const router = express.Router();

// Multer setup
const storage = multer.diskStorage({
  destination: './uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Route to handle file uploads
router.post('/upload', upload.single('file'), async (req, res) => {
  const filePath = req.file.path;

  try {
    const fileExtension = path.extname(req.file.originalname).toLowerCase();

    let extractedText;
    if (fileExtension === '.pdf') {
      // PDF text extraction
      const specificPagesBuffer = await extractSpecificPages(filePath);
      extractedText = await extractTextFromPdfBuffer(specificPagesBuffer);
    } else if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(fileExtension)) {
      // Image text extraction
      extractedText = await extractTextFromImage(filePath);
    } else {
      throw new Error('Unsupported file format');
    }

    // Save extracted text to the database
    db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [extractedText], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error', details: err });
      }

      const fileId = results.insertId;
      res.json({ message: 'Text extracted and saved to database', fileId, text: extractedText });
    });
  } catch (error) {
    console.error('Error processing file:', error);
    res.status(500).json({ error: 'Error processing file', details: error.message });
  } finally {
    fs.unlinkSync(filePath); // Clean up the uploaded file
  }
});

// Route to retrieve extracted text
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

// Extract specific pages from a PDF
async function extractSpecificPages(pdfPath) {
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfDoc = await PDFDocument.load(pdfBuffer);

  const newPdf = await PDFDocument.create();
  const pageIndexes = [9, 10]; // 0-based page indexes

  for (const index of pageIndexes) {
    const [page] = await newPdf.copyPages(pdfDoc, [index]);
    newPdf.addPage(page);
  }

  const extractedPdfBuffer = await newPdf.save();
  return extractedPdfBuffer;
}

// Extract text from PDF buffer
async function extractTextFromPdfBuffer(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    return data.text;
  } catch (error) {
    throw new Error('Error extracting text from PDF: ' + error.message);
  }
}

// Extract text from an image using Tesseract.js
async function extractTextFromImage(imagePath) {
  try {
    const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
      logger: (info) => console.log(info), // Optional: Logs OCR progress
    });
    return text;
  } catch (error) {
    throw new Error('Error extracting text from image: ' + error.message);
  }
}

module.exports = router;
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const pdfParse = require('pdf-parse');
// const db = require('../db/connection');
// const { PDFDocument } = require('pdf-lib');
// const Tesseract = require('tesseract.js');

// const router = express.Router();

// // Multer setup
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // Route to handle file uploads
// router.post('/upload', upload.single('file'), async (req, res) => {
//   const filePath = req.file.path;
//   const searchSentence = req.body.sentence;

//   try {
//     const fileExtension = path.extname(req.file.originalname).toLowerCase();

//     let extractedText;
//     let specificPagesBuffer;

//     if (fileExtension === '.pdf') {
//       // Extract text from the PDF
//       extractedText = await extractTextFromPdf(filePath);
//       console.log('Extracted Text:', extractedText);  // Debugging

//       // Find the page with the sentence
//       const pageIndex = findPageWithSentence(extractedText, searchSentence);
//       console.log('Found page index:', pageIndex);  // Debugging

//       if (pageIndex === -1) {
//         return res.status(404).json({ error: 'Sentence not found in the PDF' });
//       }

//       // Extract the specific page
//       specificPagesBuffer = await extractSpecificPage(filePath, pageIndex);
//     } else if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff'].includes(fileExtension)) {
//       // Image text extraction
//       extractedText = await extractTextFromImage(filePath);
//     } else {
//       throw new Error('Unsupported file format');
//     }

//     // Check if specificPagesBuffer is defined
//     const responseData = {
//       message: 'Text extracted and saved to database',
//       fileId: null,
//       text: extractedText,
//     };

//     // Save extracted text to the database
//     db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [extractedText], (err, results) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error', details: err });
//       }

//       const fileId = results.insertId;
//       responseData.fileId = fileId;

//       // Check if specificPagesBuffer exists before sending it as base64
//       if (specificPagesBuffer) {
//         responseData.file = specificPagesBuffer.toString('base64');
//       } else {
//         responseData.file = null;
//       }

//       res.json(responseData);
//     });

//   } catch (error) {
//     console.error('Error processing file:', error);
//     res.status(500).json({ error: 'Error processing file', details: error.message });
//   } finally {
//     fs.unlinkSync(filePath);  // Clean up uploaded file
//   }
// });



// // Route to retrieve extracted text
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

// // Extract text from PDF
// async function extractTextFromPdf(pdfPath) {
//   const pdfBuffer = fs.readFileSync(pdfPath);
//   const data = await pdfParse(pdfBuffer);
//   return data.text;
// }

// // Find the page containing the sentence
// function findPageWithSentence(extractedText, sentence) {
//   const pages = extractedText.split('\n\n');
//   for (let i = 0; i < pages.length; i++) {
//     if (pages[i].includes(sentence)) {
//       return i;
//     }
//   }
//   return -1;
// }

// // Extract the specific page containing the sentence from the PDF
// async function extractSpecificPage(pdfPath, pageIndex) {
//   const pdfBuffer = fs.readFileSync(pdfPath);
//   const pdfDoc = await PDFDocument.load(pdfBuffer);

//   const newPdf = await PDFDocument.create();
//   const [page] = await newPdf.copyPages(pdfDoc, [pageIndex]);
//   newPdf.addPage(page);

//   const extractedPdfBuffer = await newPdf.save();
//   return extractedPdfBuffer;
// }

// // Extract text from an image using Tesseract.js
// async function extractTextFromImage(imagePath) {
//   try {
//     const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
//       logger: (info) => console.log(info), // Optional: Logs OCR progress
//     });
//     return text;
//   } catch (error) {
//     throw new Error('Error extracting text from image: ' + error.message);
//   }
// }

// module.exports = router;
