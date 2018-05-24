var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var nconf = require('nconf');
var pg = require('pg');

nconf.argv().env();

var conString = connection_string_from_env();
//var conString = "postgres://jaco@localhost/kcco";
console.log('Connection String: ' + conString);

var db_client = new pg.Client(conString);


//var file_path = __dirname;
//var files_dir = file_path + '/../db_functions';

var file_full_path = nconf.get('file');
var file_folder = nconf.get('folder');

if(file_full_path){
  console.log('--- file ---');
  db_client.connect(function(err) {
    if(err){
      console.error(err);
      return;
    };
    run_one_file(file_full_path);
  });
} else if(file_folder){
  console.log('--- folder ---');
  db_client.connect(function(err) {
    if(err){
      console.error(err);
      return;
    };
    do_all_files(file_folder);
  });
} else {
  console.log('--- no file or folder specified ---');
  process.exit(0);
};

function run_one_file(file){
  run_file(
    file,
    function(err,data) {
      if (err) {
        console.error(err);
      } else {
        console.log('--- done ---');
      };
      try{
        db_client.end();
      } catch (err){

      };
      //process.exit(0);
    }
  );
};

function do_all_files(files_dir, callback){
  //console.log(files_dir);
  async.waterfall(
    [
      function(callback){
        fs.readdir(files_dir,callback);
      },
      function(data,callback){
        async.mapSeries(
          data,
          function(file_name, callback){
            file_full_path = files_dir + '/' + file_name;
            if(file_name == '.DS_Store'){
              callback(null,{});
              return;
            };
            run_file(file_full_path, callback);
          },
          function(err,data){
            if(err){
              console.error(err);
            }
            callback(null,{});
          }
        );
      }
    ],
    function(err,data) {
      if (err) {
        console.error(err);
      } else {
        console.log('--- done ---');
      };
      try{
        db_client.end();
      } catch (err){

      };
      process.exit(0);
    }
  );
};



function run_file(file_full_path, callback){
  //console.log(file_full_path);

  var file_stat = {};
  var file_content = '';

  async.waterfall(
    [
      function(callback){
        fs.stat(file_full_path, callback);
      },
      function(data,callback){
        file_stat = data;
        //If you do not supply an encoding you get a buffer,
        //which you can convert: data.toString('ascii', 0, data.length)
        fs.readFile(file_full_path, 'utf8', callback);
      },
      function(data,callback){
        console.log('file read ' + file_full_path);
        file_content = data;
        //console.log(file_content);
        callback(null,{});
      },
      function(data,callback){
        db_client.query(file_content, callback);
        // db_client.query(file_content, function(err,data){
        //   if(err) {console.error(err);}
        //   if(data) {console.log(data);} 
        //   callback(err,{});
        // });
      },
      function(data,callback){
        console.log('script run');
        //console.log(JSON.stringify(data));
        callback(null,{});
      }
    ],
    function(err,data) {
      callback(err,{});
    }
  );
};


function connection_string_from_env(){
  if(!nconf.get('PG_DB_USERNAME') || nconf.get('PG_DB_USERNAME').length == 0){
   return '';
  }
  if(!nconf.get('PG_DB_HOST') || nconf.get('PG_DB_HOST').length == 0){
   return '';
  }
  if(!nconf.get('PG_DB_NAME') || nconf.get('PG_DB_NAME').length == 0){
   return '';
  }

  var s = "postgres://"
  s = s + nconf.get('PG_DB_USERNAME');
  if(nconf.get('PG_DB_PASSWORD') && nconf.get('PG_DB_PASSWORD').length > 0){
    s = s + ':' + nconf.get('PG_DB_PASSWORD');
  }
  s = s + '@' + nconf.get('PG_DB_HOST');
  if(nconf.get('PG_DB_PORT') && nconf.get('PG_DB_PORT').length > 0){
    s = s + ':' + nconf.get('PG_DB_PORT');
  }
  s = s + '/' + nconf.get('PG_DB_NAME');
  return s;
};


