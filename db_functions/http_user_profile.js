create or replace function http_user_profile(http_req_text text) returns JSON as
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

  var http_req = plv8.ufn.http_req_parse(http_req_text);
  if (http_req.err_message != '') {
    result.http_code = 403;
    result.message = http_req.err_message;
    return(result);
  }

  if(!http_req.body.profile_id){
    result.http_code = 403;
    result.message = 'profile_id required';
    return(result);
  };

  var s = "select * from tb_profile where profile_id = $1;";
  plv8.elog(INFO, s);
  var query_result = plv8.execute(s,http_req.body.profile_id);

  if (query_result && query_result.length > 0) {
    result.data = query_result[0];
  }

  return(result);
  
  $$ LANGUAGE plv8;