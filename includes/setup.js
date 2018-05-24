var nconf = require('nconf');

exports.pgp_connection_obj_from_env = function(){
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

