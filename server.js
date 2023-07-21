const express = require('express');
const multer = require('multer');
const cors = require('cors');

const app = express();

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './uploads');
    },
    filename: function(req, file, cb){
        cb(null, Date.now() + '-' + file.originalname);
    },
});

const upload = multer({storage: storage});

app.use(cors());

app.post('/upload', upload.single('photo'), function(req, res, next){
    res.send({
        message: 'File uploaded successfully!',
        file: req.file,
    });
});

app.listen(3000, function() {
    console.log('App running on port 3000')
})