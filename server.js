// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const mysql = require('mysql2');
// const cors = require('cors');
// const fs = require('fs');
// const pdfParse = require('pdf-parse');

// // Set up express app
// const app = express();
// app.use(cors());

// // Set up port
// const port = 5000;

// // Set up MySQL connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'root@123',
//   database: 'ocr',
// });

// db.connect((err) => {
//   if (err) console.error('Error connecting to MySQL:', err);
//   else console.log('Connected to MySQL database');
// });

// // Set up multer
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // Ensure uploads directory exists
// if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });

// // Route to upload file and process with PDF text extraction
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const filePath = req.file.path;

//   try {
//     // Read the PDF file
//     const dataBuffer = fs.readFileSync(filePath);
    
//     // Extract text using pdf-parse
//     const pdfData = await pdfParse(dataBuffer);

//     // Save extracted text to database
//     const extractedText = pdfData.text;
//     db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [extractedText], (err) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error', details: err });
//       }

//       res.json({ message: 'Text extracted and saved to database', text: extractedText });
//     });
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: 'Error processing PDF', details: error.message });
//   } finally {
//     // Clean up uploaded file
//     fs.unlinkSync(filePath);
//   }
// });

// // Start server
// app.listen(port, () => {
//   console.log(`Server is running on http://localhost:${port}`);
// });
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const mysql = require('mysql2');
// const fs = require('fs');
// const cors = require('cors');
// const { PDFDocument } = require('pdf-lib');
// const pdfParse = require('pdf-parse');
// const app = express();
// app.use(cors());

// const port = 5000;

// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'root@123',
//   database: 'ocr',
// });

// db.connect((err) => {
//   if (err) console.error('Error connecting to MySQL:', err);
//   else console.log('Connected to MySQL database');
// });

// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });

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
//     let extractedText = data.text;
//     return extractedText;
//   } catch (error) {
//     throw new Error('Error extracting text from PDF: ' + error.message);
//   }
// }
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const filePath = req.file.path;

//   try {
//     const specificPagesBuffer = await extractSpecificPages(filePath);
//     const text = await extractTextFromPdfBuffer(specificPagesBuffer);
//     db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [text], (err) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error', details: err });
//       }

//       res.json({ message: 'Text extracted and saved to database', text });
//     });
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: 'Error processing PDF', details: error.message });
//   } finally {
//     fs.unlinkSync(filePath);
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
// -----------------------------------------------------------------------------------------------------------
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const mysql = require('mysql2');
// const fs = require('fs');
// const cors = require('cors');
// const pdfPoppler = require('pdf-poppler');
// const Tesseract = require('tesseract.js');
// const app = express();
// app.use(cors());

// const port = 5000;

// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'root@123',
//   database: 'ocr',
// });

// db.connect((err) => {
//   if (err) console.error('Error connecting to MySQL:', err);
//   else console.log('Connected to MySQL database');
// });

// // Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });

// // Function to convert all pages of PDF to images
// async function convertPdfToImages(pdfPath, outputDir) {
//   if (!fs.existsSync(outputDir)) {
//     console.log(`Creating output directory: ${outputDir}`);
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   // Step 1: Convert all pages
//   const options = {
//     format: 'png',
//     out_dir: outputDir,
//     out_prefix: 'page-',
//   };

//   console.log('Converting PDF to images...');
//   try {
//     await pdfPoppler.convert(pdfPath, options);
//   } catch (err) {
//     throw new Error(`Error converting PDF to images: ${err.message}`);
//   }

//   // Log the contents of the output directory
//   const files = fs.readdirSync(outputDir);
//   console.log('Files in output directory:', files);

//   // Return the paths of the generated images
//   return files.filter(file => file.endsWith('.png')).map(file => path.join(outputDir, file));
// }

// // Function to perform OCR using Tesseract.js on an image
// async function extractTextFromImage(imagePath) {
//   try {
//     const { data: { text } } = await Tesseract.recognize(imagePath, 'eng', {
//       logger: (m) => console.log(m),
//     });
//     return text;
//   } catch (error) {
//     throw new Error('Error during OCR: ' + error.message);
//   }
// }

// async function extractTextFromPdf(pdfPath, outputDir) {
//   // Step 1: Convert all PDF pages to images
//   const imagePaths = await convertPdfToImages(pdfPath, outputDir);

//   // Step 2: Perform OCR on each image
//   let extractedText = '';
//   for (const imagePath of imagePaths) {
//     const text = await extractTextFromImage(imagePath);
//     extractedText += text + '\n';
//   }

//   return extractedText;
// }

// // Endpoint to handle file upload and PDF processing
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const filePath = req.file.path;
//   const outputDir = './output';

//   try {
//     // Step 1: Extract text from the PDF
//     const extractedText = await extractTextFromPdf(filePath, outputDir);

//     // Step 2: Insert the extracted text into the MySQL database
//     db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [extractedText], (err) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error', details: err });
//       }

//       res.json({ message: 'Text extracted and saved to database', text: extractedText });
//     });
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: 'Error processing PDF', details: error.message });
//   } finally {
//     // Clean up the uploaded file
//     fs.unlinkSync(filePath);
//   }
// });

// // Start the server
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
// =-------------------------------------------------------------
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const mysql = require('mysql2');
// const fs = require('fs');
// const cors = require('cors');
// const sharp = require('sharp');
// const Tesseract = require('tesseract.js');
// const pdfPoppler = require('pdf-poppler');
// const app = express();

// // Use CORS to allow cross-origin requests
// app.use(cors());

// const port = 5000;

// // MySQL connection
// const db = mysql.createConnection({
//   host: 'localhost',
//   user: 'root',
//   password: 'root@123',
//   database: 'ocr',
// });

// db.connect((err) => {
//   if (err) console.error('Error connecting to MySQL:', err);
//   else console.log('Connected to MySQL database');
// });

// // Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });

// // Function to convert specific pages of PDF to images
// async function convertPdfToImages(pdfPath, outputDir, pages) {
//   if (!fs.existsSync(outputDir)) {
//     console.log(`Creating output directory: ${outputDir}`);
//     fs.mkdirSync(outputDir, { recursive: true });
//   }

//   for (const page of pages) {
//     const options = {
//       format: 'png',
//       out_dir: outputDir,
//       out_prefix: `page-${page + 1}`,  // Output prefix
//       page: page + 1, // pdf-poppler is 1-based indexed for pages
//     };

//     console.log(`Converting page ${page + 1}...`);
//     try {
//       await pdfPoppler.convert(pdfPath, options);
//     } catch (err) {
//       throw new Error(`Error converting PDF page ${page + 1} to image: ${err.message}`);
//     }
//   }

//   // Log the contents of the output directory
//   const files = fs.readdirSync(outputDir);
//   console.log("Files in output directory:", files);

//   // Update this to match the actual output files format
//   return pages.map((page) => {
//     const pageNumber = page + 1;
//     // Ensure we're matching files like 'page--01.png', 'page--02.png', etc.
//     return path.join(outputDir, `page--${String(pageNumber).padStart(2, '0')}.png`);
//   });
// }

// // Preprocess image before OCR
// async function preprocessImage(imagePath) {
//   console.log("Processing image:", imagePath); // Log the image path to debug
//   const outputImagePath = imagePath.replace('.png', '-processed.png'); // Modify the name for the processed image
//   await sharp(imagePath)
//     .grayscale()       // Convert to grayscale for better OCR accuracy
//     .threshold(128)    // Apply binary thresholding
//     .resize(3000)      // Resize the image for better OCR accuracy
//     .toFile(outputImagePath);
//   return outputImagePath;
// }

// // Perform OCR in parallel for multiple images
// async function extractTextFromMultipleImages(imagePaths) {
//   let allText = '';
//   for (const imagePath of imagePaths) {
//     const processedImagePath = await preprocessImage(imagePath); // Process the image first
//     // Perform OCR on the processed image
//     const text = await extractTextFromImage(processedImagePath); 
//     allText += text + '\n'; // Concatenate the text from all images
//   }
//   return allText;
// }

// // Extract text from image using Tesseract OCR
// async function extractTextFromImage(imagePath) {
//   const { data: { text } } = await Tesseract.recognize(
//     imagePath,
//     'eng',
//     {
//       logger: (m) => console.log(m),
//     }
//   );
//   return text;
// }

// // Endpoint to handle file upload and PDF processing
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const filePath = req.file.path;
//   const outputDir = './output';
//   const pagesToExtract = [9,11];

//   try {
//     const imagePaths = await convertPdfToImages(filePath, outputDir, pagesToExtract);

//     const extractedText = await extractTextFromMultipleImages(imagePaths);

//     db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [extractedText], (err) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error', details: err });
//       }

//       res.json({ message: 'Text extracted and saved to database', text: extractedText });
//     });
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: 'Error processing PDF', details: error.message });
//   } finally {

//     fs.unlinkSync(filePath);
//   }
// });

// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
// const express = require('express');
// const multer = require('multer');
// const path = require('path');
// const fs = require('fs');
// const cors = require('cors');
// const { PDFDocument } = require('pdf-lib');
// const pdfParse = require('pdf-parse');
// require('dotenv').config();

// const db = require('./db/connection'); // Import database connection
// const app = express();
// app.use(cors());

// const port = process.env.PORT || 5000;

// // Multer setup for file uploads
// const storage = multer.diskStorage({
//   destination: './uploads/',
//   filename: (req, file, cb) => {
//     cb(null, Date.now() + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// // Ensure uploads directory exists
// if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads', { recursive: true });

// // Extract specific pages from PDF
// async function extractSpecificPages(pdfPath) {
//   const pdfBuffer = fs.readFileSync(pdfPath);
//   const pdfDoc = await PDFDocument.load(pdfBuffer);

//   const newPdf = await PDFDocument.create();
//   const pageIndexes = [9, 10]; // Change to desired page indexes (0-based)

//   for (const index of pageIndexes) {
//     const [page] = await newPdf.copyPages(pdfDoc, [index]);
//     newPdf.addPage(page);
//   }

//   return await newPdf.save();
// }

// // Extract text from PDF buffer
// async function extractTextFromPdfBuffer(pdfBuffer) {
//   const data = await pdfParse(pdfBuffer);
//   return data.text;
// }

// // File upload and processing route
// app.post('/upload', upload.single('file'), async (req, res) => {
//   const filePath = req.file.path;

//   try {
//     // Extract specific pages
//     const specificPagesBuffer = await extractSpecificPages(filePath);

//     // Extract text from extracted pages
//     const extractedText = await extractTextFromPdfBuffer(specificPagesBuffer);

//     // Save extracted text to database
//     db.query('INSERT INTO ocr_results (extracted_text) VALUES (?)', [extractedText], (err) => {
//       if (err) {
//         console.error('Database error:', err);
//         return res.status(500).json({ error: 'Database error', details: err });
//       }

//       res.json({ message: 'Text extracted and saved to database', text: extractedText });
//     });
//   } catch (error) {
//     console.error('Error processing PDF:', error);
//     res.status(500).json({ error: 'Error processing PDF', details: error.message });
//   } finally {
//     // Clean up uploaded file
//     fs.unlinkSync(filePath);
//   }
// });

// // Start server
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
