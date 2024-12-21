const express = require('express');
const cors = require('cors');
const ocrRoutes = require('./routes/ocr');
require('dotenv').config();

const app = express();
app.use(cors());

// Middleware for parsing JSON
app.use(express.json());

// OCR routes
app.use('/api', ocrRoutes);



// Start server
const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});


