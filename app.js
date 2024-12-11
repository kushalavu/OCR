// const express = require('express');
// const cors = require('cors');
// const ocrRoutes = require('./routes/ocr');
// require('dotenv').config();

// const app = express();
// app.use(cors());

// // Middleware for parsing JSON
// app.use(express.json());

// // OCR routes
// app.use('/api', ocrRoutes);



// // Start server
// const port = process.env.PORT || 5000;
// app.listen(port, () => {
//   console.log(`Server running on http://localhost:${port}`);
// });
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const ocrRoutes = require('./routes/ocr'); // Import OCR routes

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.use('/api', ocrRoutes); // Prefix the routes with '/api'

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

