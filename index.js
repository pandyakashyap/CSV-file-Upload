const express = require('express');
const bodyParser = require('body-parser');
const csv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const mysql = require('mysql');

const app = express();
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

// where to store file data connect with disk storage
let storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, './uploads');
  },

  filename: (req, file, callback) => {
    callback(null, file.fieldname + "-" + Date.now() + path.extname(file.originalname));
  }
  
});

let upload = multer({
  storage: storage
});

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "",
  database: "csvupload"
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.post('/import-csv', upload.single('file'), (req, res) => {
  let filePath = req.file.path;
  uploadCsv(filePath, (err, results) => {
    if (err) 
    {
      res.send(err);
    }
    else 
    {
      res.send(results);
    }
  });
});

function uploadCsv(filePath, callback) 
{
  let stream = fs.createReadStream(filePath);
  let csvData = [];
  let fileStream = csv.parse()
    .on('data', function(data) {
      csvData.push(data);
    })
    .on('end', function() {
      csvData.shift();

      pool.getConnection((err, connection) => {
        if (err) {
          console.log(err);
        } 
        else 
        {
          let query = "INSERT INTO users (Name, Surname, Age, Salary, Location, Designation) VALUES ?";
          connection.query(query, [csvData], (error, response) => {
            if (error) {
              console.log(error);
            } 
            else 
            {
              console.log("Data imported successfully.....");
            }
          });
        }
      });

      fs.unlinkSync(filePath);
    });
  stream.pipe(fileStream);
}

app.listen(5000, () => {
  console.log('App is listening on port 5000');
});
