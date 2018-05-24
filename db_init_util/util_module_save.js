var fs = require('fs');
var path = require('path');
var _ = require('underscore');
var async = require('async');
var moment = require('moment');
var nconf = require('nconf');
var pgp = require('pg-promise')({
    // Initialization Options
});

nconf.argv().env();

var connection_obj = pgp_connection_obj_from_env();
//console.log(JSON.stringify(connection_obj,null,2));
var db_client = pgp(connection_obj);

//var file_path = __dirname;
//var files_dir = file_path + '/../db_functions';

var file_full_path = nconf.get('file');
var file_folder = nconf.get('folder');

if(file_full_path){
  run_one_file(file_full_path);
} else if(file_folder){
  do_all_files(file_folder);
} else {
  console.log('no file or folder specified');
  // try{
  //   db_client.end();
  // } catch (err){

  // };
  process.exit(0);
}

function run_one_file(file){
  run_file(
    file,
    function(err,data) {
      // try{
      //   db_client.end();
      // } catch (err){

      // };
      if (err) {
        console.error(err);
      } else {
        console.log('Done');
      }
      process.exit(0);
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
      // try{
      //   db_client.end();
      // } catch (err){

      // };
      if (err) {
        console.error(err);
      } else {
        console.log('Done');
      }
      process.exit(0);
    }
  );
};


function run_file(file_full_path, callback){
  console.log(file_full_path);

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
        file_content = data;
        callback(null,{});
      },
      function(data,callback){
        console.log('file read');
        var sql1 = 'delete from plv8_util_modules where filename = $1;'
        var q = db_client.manyOrNone(sql1,[path.basename(file_full_path)]);
        q.then(function (data) {
          callback(null,data);
        });
        q.catch(function (error) {
          console.log('postgress proc error:');
          callback(error,{});
        });
      },
      function(data,callback){
        console.log('previous deleted');
        //db_client.query(file_content, callback);
        var sql1 = 'insert into plv8_util_modules (filename, code) values ($1, $2);'
        var q = db_client.manyOrNone(sql1,[path.basename(file_full_path),file_content]);
        q.then(function (data) {
          callback(null,data);
        });
        q.catch(function (error) {
          console.log('postgress proc error:');
          callback(error,{});
        });
      },
      function(data,callback){
        console.log('code inserted');
        //console.log(JSON.stringify(data));
        callback(null,{});
      }
    ],
    function(err,data) {
      callback(err,{});
    }
  );
}





function pgp_connection_obj_from_env(){
  if(!nconf.get('PG_DB_USERNAME') || nconf.get('PG_DB_USERNAME').length == 0){
   return {};
  }
  if(!nconf.get('PG_DB_HOST') || nconf.get('PG_DB_HOST').length == 0){
   return {};
  }
  if(!nconf.get('PG_DB_NAME') || nconf.get('PG_DB_NAME').length == 0){
   return {};
  }

  var c = {};
  c.host = nconf.get('PG_DB_HOST');;
  c.database = nconf.get('PG_DB_NAME');
  c.user = nconf.get('PG_DB_USERNAME');
  if(nconf.get('PG_DB_PASSWORD') && nconf.get('PG_DB_PASSWORD').length > 0){
    c.password = nconf.get('PG_DB_PASSWORD');
  }
  if(nconf.get('PG_DB_PORT') && nconf.get('PG_DB_PORT').length > 0){  //5432
    c.port = nconf.get('PG_DB_PORT');
  }

  return c;
};
