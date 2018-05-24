var async = require('async');
var _ = require('underscore');
//var ObjectID = require('mongodb').ObjectID;
var http = require('http');
var querystring = require("querystring");
var moment = require("moment");
var multer  = require('multer');

var utils = require("../includes/utils.js");
var spawn = require("../includes/spawn.js");

// var multer_config = {
//   dest: './uploads/',
//   rename: function (fieldname, filename) {
//       console.log(fieldname + ' ' + filename + ' renaming ...');
//       return filename+Date.now();
//   },
//   onFileUploadStart: function (file) {
//     console.log(file.originalname + ' is starting ...');
//   },
//   onFileUploadComplete: function (file) {
//     console.log(file.fieldname + ' uploaded to  ' + file.path);
//   },
//   limits_later: {
//     fieldNameSize: 100,
//     files: 2,
//     fields: 5
//   }
// };

//Special express middleware dealing with multipart fileuploads
//https://github.com/expressjs/multer
//exports.multer_funct = multer({dest: __dirname + '/../uploads/'});

exports.file_upload = function(req, res){
  var env = 'development';

  var mypayload = null;
  if (req.body && req.body.mypayload){
    mypayload = JSON.parse(req.body.mypayload);
  }
  if (mypayload.media_type){mypayload.media_type == 'pic'};

  console.log("Files: " + JSON.stringify(req.files));
  var result = {};
  var files =  {"file0":{
    "fieldname":"file0",
    "originalname":"images.jpeg",
    "name":"c2891712ed01224138a2e75f547b5401.jpeg",
    "encoding":"7bit","mimetype":"image/jpeg",
    "path":"uploads/c2891712ed01224138a2e75f547b5401.jpeg",
    "extension":"jpeg",
    "size":4773,
    "truncated":false,
    "buffer":null}};

  var dbfiles = [];
  for (var prop in req.files){
      var f = req.files[prop];
      f.person_id = ObjectID(mypayload.person_id);
      f._id = ObjectID();
      f.create_date = new Date();
      f.media_type = mypayload.media_type;
      dbfiles.push(f);
  }
  //console.log(JSON.stringify(dbfiles));

  async.waterfall([
    function(callback) {
      req.db.collection('files').insert(dbfiles,callback);
    },
    function(data,callback) {
      var cmd = 'cp';
      var args = [dbfiles[0].name, '../uploads100'];
      var options = {
        cwd: __dirname + '/../uploads',
      };
      console.log("Copy");
      console.log(cmd);
      console.log(JSON.stringify(args));
      console.log(JSON.stringify(options));
      spawn.childProcessSpawn(cmd,args,options,callback);
    },
    function(data,callback) {
      console.log(data);
      callback(null,{});
    },
    //mogrify -resize '100' -quality 100 1a6f324549fb120b50089d60f0d5dc75.jpg
    function(data,callback) {
      if(env == 'production'){
        var cmd = 'mogrify';
        var args = ["-resize","100","-quality","100",dbfiles[0].name];
        var options = {
          cwd: __dirname + '/../uploads100',
        };
        console.log("Resize");
        console.log(cmd);
        console.log(JSON.stringify(args));
        console.log(JSON.stringify(options));
        spawn.childProcessSpawn(cmd,args,options,callback);
      } else {
        callback(null,'');
      }
    },
    function(data,callback) {
      console.log(data);
      callback(null,{});
    }
  ],
  function(err,data) {
    utils.gen_result_old(res,err,200,dbfiles);
  });

  //next
  //https://github.com/zivester/node-quickthumb
  //imagemagick

};

exports.person_files_list = function(req, res){
  console.log(req.params.person_id + ' ' + req.params.person_id.length);

  // if (!req.query.media_type){req.query.media_type == 'pic'};

  async.waterfall([
    function(callback) {
      if (!req.params.person_id || req.params.person_id.length === 0 || req.params.person_id == "undefined"){
        callback({"http_code":"404","message":"invalid person"},{});
      } else {
        callback(null,{});
      }
    },
    function(data,callback) {
      var projection = {
        _id: true,
        // originalname: true,
        name: true
        // media_type: true
      };
      var filter = {person_id: ObjectID(req.params.person_id)};
      // filter.media_type = req.query.media_type;
      req.db.collection('files').find(filter,projection).sort({name:1}).toArray(callback);
    }
  ],
  function(err,data) {
    if (err) {
      var api_err = {"http_code":"500","message":"system error", "dump":err};
      res.send(500,api_err);
    } else {
      res.send(200,data);
    }
  });
};


exports.file_upload_base64 = function(req, res){
  function random_number(length){
    var seed1 = Math.pow(10,length);
    var seed2 = Math.pow(10,length-1) + 1;
    return Math.floor(Math.random() * (seed1 - seed2)) + seed2;
  }
  function decodeBase64Image(dataString) {
    var matches = dataString.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    var response = {};

    if (matches.length !== 3)
    {
      return new Error('Invalid input string');
    }

    response.type = matches[1];
    response.data = new Buffer(matches[2], 'base64');

    return response;
  }

  //console.log(JSON.stringify(req.body));

  var new_file_name = random_number(15).toString();
  var file_path = __dirname + "/../uploads/" + new_file_name + ".jpeg";
  var imageBuffer = decodeBase64Image(req.body.imagedata);

  var file =  {
    "fieldname": "file0",
    "originalname": "cropped_image.png",
    "name": new_file_name + ".jpeg",
    //"encoding":"7bit",
    "mimetype": "image/png",
    "path": file_path,
    "extension": "png",
    //"size":4773,
    //"truncated":false,
    //"buffer":null,

    "media_type":"pic",
    "create_date":new Date(),
    "_id":ObjectID(),
    "person_id":req.body.person_id,
  };

  async.waterfall([
    function(callback) {
      try {
        console.log("write file");
        fs.writeFile(file_path, imageBuffer.data, function(err){
          console.log("write file callback");
          if(err){
            console.error(err);
          }
          callback(err,{});
        });
      } catch(error) {
        console.log("write file try error");
        if(error){
          console.error(error);
        }
        callback(error,{});
      }
    },
    function(data,callback) {
      console.log("db insert");
      req.db.collection('files').insert(file,callback);
    }
  ],
  function(err,data) {
    if (err) {
      if (err.http_code) {
        res.send(err.http_code,err);
      } else {
        var api_err = {"http_code":"500","message":"system error", "dump":err};
        res.send(500,api_err);
      }
    } else {
      res.send(201,file);
    }
  });
};


