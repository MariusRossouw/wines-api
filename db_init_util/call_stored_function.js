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

//console.log('Connection: ' + moment().format('mm:sssss'));
var connection_obj = pgp_connection_obj_from_env();
//console.log(JSON.stringify(connection_obj,null,2));

var db_client = pgp(connection_obj);

var fn_name = nconf.get('name');
var p1 = nconf.get('p1');


if(!fn_name){
  console.log('Abort: provide --name');
  process.exit(0);
}

var sql1 = '';
var params = [];
if(p1){
  sql1 = 'select ' + fn_name + '($1);';
  params = [p1];
} else {
  sql1 = 'select ' + fn_name + '();';
}

//console.log('Start: ' + moment().format('mm:sssss'));
var q = db_client.manyOrNone(sql1, params);
q.then(function (data) {
  final(null,data);
  console.log(data);
});
q.catch(function (err) {
  console.log('postgress proc error:');
  final(err,{});
});

var final = function(err,data) {
    //console.log('Final: ' + moment().format('mm:sssss'));
    if (err) {
      console.error(err);
    }
    console.log('Done');
    process.exit(0);
};

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

