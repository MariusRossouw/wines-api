create or replace function http_user_find(http_req_text text) returns JSON as
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

  if(!http_req.body.email_mobile_number){
    result.http_code = 403;
    result.message = 'email_mobile_number required';
    return(result);
  };

  var s_email = "select * from tb_profile where email = $1;";
  plv8.elog(INFO, s_email);
  var query_result_email = plv8.execute(s_email,http_req.body.email_mobile_number);

  if (query_result_email && query_result_email.length > 0) {
    result.data = query_result_email[0];
  }

  var s_mobile = "select * from tb_profile where concat(mobile_country_code,mobile_no_exl) = $1;";
  plv8.elog(INFO, s_mobile);
  var query_result_mobile = plv8.execute(s_mobile,http_req.body.email_mobile_number);

  if (query_result_mobile && query_result_mobile.length > 0) {
    result.data = query_result_mobile[0];
  }

  return(result);
  
  $$ LANGUAGE plv8;