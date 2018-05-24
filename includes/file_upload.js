var async = require('async');
var _ = require('underscore');
var https = require('https');
var querystring = require("querystring");
var moment = require("moment");
var request = require("request");
var utils = require("../includes/utils.js");
var fs = require('fs');


exports.file_upload = function(req, res) {
  console.log('ALL: ' , req);
  if(!req.files){
    console.log('What!!!!!');
    res.send(500);
  }else{
      console.log(req.files);
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



  exports.deletePhoto = function (req, res) {
    var fileName = req.body.img;
    var file_path = __dirname + "/../uploads/" + fileName + ".png";
    var stream = fs.createReadStream(fileName);
    stream.pipe(res).once("close", function () {
        stream.close();
        deleteFile(fileName);
    })
  };