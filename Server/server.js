const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');  // Add this line
const { spawn } = require('child_process');  // Add this line

const app = express();

const dir = './uploads';

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, dir);
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({storage: storage});

app.use(cors());

app.post('/upload', upload.single('photo'), function(req, res, next){
    // Run your Python script here
    const python = spawn('python', ['./uploads/main.py', req.file.path]);

    python.stdout.on('data', function (data) {
      console.log('Pipe data from python script ...');
      console.log(data.toString());
    });

    python.on('close', (code) => {
        console.log(`child process close all stdio with code ${code}`);
    });

    res.send({
        message: 'File uploaded successfully!',
        file: req.file,
    });
});

app.listen(3000, function() {
    console.log('App running on port 3000')
});
