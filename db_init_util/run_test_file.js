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

var file_name = nconf.get('file');
if(!file_name){
  console.log('Abort: provide --name');
  process.exit(0);
}
var p1 = nconf.get('p1');

var file_path = __dirname;
var file = file_path + '/../test_files/' + file_name;
console.log(file);

var file_stat = {};

var file_json = {};
var sql1 = '';
var params = [];

var connection_obj = pgp_connection_obj_from_env();
console.log(JSON.stringify(connection_obj,null,2));
var db_client = pgp(connection_obj);

async.waterfall([
      function(callback){
        fs.stat(file, callback);
      },
      function(data,callback){
        file_stat = data;
        //If you do not supply an encoding you get a buffer,
        //which you can convert: data.toString('ascii', 0, data.length)
        fs.readFile(file, 'utf8', callback);
      },
      function(data,callback){
        console.log(data);
        file_json = JSON.parse(data);
        //var new_content = data.replace('create or replace function ' + rename_from, 'create or replace function ' + rename_to);
        // fs.writeFile(file,new_content,function(err){
        //   callback(err,{});
        // });
        callback(null,{});
      },
      function(data,callback){
        //if(p1){
          sql1 = 'select ' + file_json.function_name + '($1);';
          params = [file_json.data];
        //} else {
        //  sql1 = 'select ' + fn_name + '();';
        //}
        var q = db_client.manyOrNone(sql1, params);
        q.then(function(data){
          callback(null,data);
        });
        q.catch(function(err){
          callback(err,{});
        });
      },
      function(data,callback){
        console.log(JSON.stringify(data,null,2));
        callback(null,{});
      }
    ],
    function(err,data) {
      if (err) {
        console.error(err);
      }
      console.log('Done');
      process.exit(0);
    }
);

function pgp_connection_obj_from_env(){
  if(!nconf.get('PG_DB_USERNAME') || nconf.get('PG_DB_USERNAME').length === 0){
   return {};
  }
  if(!nconf.get('PG_DB_HOST') || nconf.get('PG_DB_HOST').length === 0){
   return {};
  }
  if(!nconf.get('PG_DB_NAME') || nconf.get('PG_DB_NAME').length === 0){
   return {};
  }

  var c = {};
  c.host = nconf.get('PG_DB_HOST');
  c.database = nconf.get('PG_DB_NAME');
  c.user = nconf.get('PG_DB_USERNAME');
  if(nconf.get('PG_DB_PASSWORD') && nconf.get('PG_DB_PASSWORD').length > 0){
    c.password = nconf.get('PG_DB_PASSWORD');
  }
  if(nconf.get('PG_DB_PORT') && nconf.get('PG_DB_PORT').length > 0){  //5432
    c.port = nconf.get('PG_DB_PORT');
  }

  return c;
}

