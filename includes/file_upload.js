var async = require('async');
var _ = require('underscore');
var https = require('https');
var querystring = require("querystring");
var moment = require("moment");
var request = require("request");
var utils = require("../includes/utils.js");
var fs = require('fs');
var xlsx = require('xlsx');
var path = require('path');

exports.file_upload = function(req, res) {
  console.log('ALL: ' , req);
  if(!req.files){
    console.log('What!!!!!');
    res.send(500);
  }else{
      // console.log(req.files);
      console.log('Body: ' , req.body);
      var file_name = req.body.uuid + '.png';
      req.files.file.mv(__dirname + '/../uploads/' + file_name, function(err) {
      if (err){
          console.log(err);
          res.send(500);
      }
      res.send(200);
      });
  }
};

exports.file_upload_64 = function(req, res) {

  console.log('REQ.BODY: ', req.body);

  function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response = {};

    if (matches.length !== 3){
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
  }

  var new_file_name = "";

  if (req.body.uuid) {
    new_file_name = req.body.uuid + new Date().getTime();
  } else {
    new_file_name = new Date().getTime();
  }
  var file_path = __dirname + "/../uploads/" + new_file_name + ".png";
  var imageBuffer = decodeBase64Image(req.body.imagedata);

  var old_file_path = __dirname + "/../uploads/" + req.body.old_img + ".png";

  console.log("write file");
  fs.writeFile(file_path, imageBuffer.data, function(err) {
    if(err){
      console.log(err);
      res.send(500);
    } else {
      // deleteFile(old_file_path);
      res.send(200, new_file_name);
    }
  });
};

// ===== Wine specfic =====

// store file contents to DB
var store_contents = function(pdb, file, proc_name){
  return new Promise((resolve,reject)=>{
    try {
      var workbook = xlsx.readFile(file);
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
    } catch (err) {
      console.log(err);
      reject({http_code: 500, message: 'Failed to read xl file'})
    }
    console.log(typeof worksheet);

    pdb.proc(proc_name, worksheet)
    .then(data => {
      // TODO: email rep with link
      // console.log(data)
      if(data[proc_name].http_code != 200){
        reject(data[proc_name]);
      }
      resolve(data[proc_name])
    })
    .catch(err => {
      console.log('PROC ERR: ',err)
      reject({http_code: 500, message: 'Failed to store file'})
    })
  });
}

// store the file on the server
var store_file = function(files){
  return new Promise((resolve,reject)=>{
    var file_name = files.file.name;
    var file_path = path.join(__dirname ,'/../','uploads/' , file_name);

    files.file.mv(file_path, function(err) {
      if (err){
          console.log(err);
          reject({http_code: 500, message: 'Failed to store xl file'})
      }
      resolve(file_path)
    });
  })
}

// remove a file with the specified path
var remove_file = function(path){
  return new Promise((resolve,reject) => {
    fs.unlink(path, (err) => {
      if (err) reject(err);
      console.log(path + ' was deleted');
      resolve({message:'file removed', http_code: 200})
    });
  })
}

exports.upload_file_store = function(req, res){
  if(!req.files){
    console.log('file not found');
    res.status(500).send({http_code: 500, message: 'file not found'});
  }else{
    var return_data = {};
    var path = '';

    // console.log(req.files);
    console.log('Body: ' , req.body);

    // store the file on the server
    store_file(req.files)
    .then(dataPath => {
      path = dataPath
      // store the file contents in the DB
      return store_contents(req.pdb, dataPath, req.body.proc_name)
    })
    .then(data => {
      return_data = data;
      // remove the file off the server when done
      return remove_file(path)
    })
    .then(dataStored =>{
      res.status(200).send(return_data);
    })
    .catch(err =>{
      console.log(err)
      res.status(500).send(err);
    })
  }
}

