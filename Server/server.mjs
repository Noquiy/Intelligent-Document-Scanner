import express from 'express';
import multer from 'multer';
import cors from 'cors';
import fs from 'fs';
import { exec } from 'child_process';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

const dir = './uploads';

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});

const upload = multer({ storage: storage });

app.use(cors());

// Queue to hold file processing promises
const fileProcessingQueue = [];

// Function to execute the Python script for a specific uploaded file
function processFilePythonScript(uploadedFilePath) {
  return new Promise((resolve, reject) => {
    const pythonScript = './uploads/maskProcessing.py';
    const command = `python ${pythonScript} ${uploadedFilePath}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(chalk.red('Error executing Python script:'), error);
        resolve(null); // Resolve with null in case of an error
      } else {
        console.log(chalk.green('Python script executed successfully!'));
        resolve(stdout);
      }
    });
  });
}

// Route to handle file uploads
app.post('/upload', upload.single('photo'), function (req, res) {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  console.log(chalk.blue('File uploaded, starting processing...'));

  const processingPromise = processFilePythonScript(req.file.path);
  fileProcessingQueue.push(processingPromise);

  Promise.resolve()
    .then(() => {
      return Promise.all(fileProcessingQueue);
    })
    .then(() => {
      const coordinatesFilePath = path.join(__dirname, 'coordinates.json');
      const dimensionsFilePath = path.join(__dirname, 'dimensions.json');
      
      fs.readFile(coordinatesFilePath, 'utf8', (err, coordinatesData) => {
        if (err) {
          console.error(chalk.red('Error reading coordinates.json:'), err);
          res.status(500).json({ error: 'Error reading coordinates' });
          return;
        }
        fs.readFile(dimensionsFilePath, 'utf8', (err, dimensionsData) => {
          if (err) {
            console.error(chalk.red('Error reading dimensions.json:'), err);
            res.status(500).json({ error: 'Error reading dimensions' });
            return;
          }
  
          const coordinates = JSON.parse(coordinatesData);
          const dimensions = JSON.parse(dimensionsData);
  
          res.json({
            message: 'File uploaded and Python script executed successfully',
            coordinates: coordinates,
            dimensions: dimensions,
          });
        });
      });
    })
    .catch((error) => {
      console.error(chalk.red('Error in file processing:'), error);
      res.status(500).json({ error: 'Something went wrong during file processing' });
    })
    .finally(() => {
      const index = fileProcessingQueue.indexOf(processingPromise);
      if (index !== -1) {
        fileProcessingQueue.splice(index, 1);
      }
    });
});

app.listen(3000, function () {
  console.log(chalk.yellow('Server is running on port 3000'));
});
