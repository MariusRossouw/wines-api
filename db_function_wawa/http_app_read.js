create or replace function http_app_read(http_req JSON) returns JSON as
$$
if (!plv8.ufn) {
  var sup = plv8.find_function("plv8_startup");
  sup();
 }

var result = {
    http_code:200,
    message:'',
    data:{}
  };

  if(!http_req.body.app_id){
    result.http_code = 403;
    result.message = 'app_id required';
    return(result);
  };

  var s = "select * from tb_app where app_id = $1;";
  plv8.elog(INFO, s);
  var query_result = plv8.execute(s,http_req.body.app_id);

  if (query_result && query_result.length > 0) {
    result.data = query_result[0];
  }

  return(result);

  $$ LANGUAGE plv8;