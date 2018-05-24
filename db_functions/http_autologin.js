create or replace function http_autologin(http_req_text text) returns JSON as
$$
if(!plv8.ufn){
  var sup = plv8.find_function("plv8_startup");
  sup();
 }

  var result = {
    http_code:200,
    message:'',
    data:{}
  };

  var http_req = plv8.ufn.http_req_parse(http_req_text);
  if(http_req.err_message != ''){
    result.http_code = 403;
    result.message = http_req.err_message;
    return(result);
  }

  if(!http_req.email){
    result.http_code = 403;
    result.message = 'email required';
    return(result);
  };
  if(!http_req.password || http_req.password.trim().length == 0){
    result.http_code = 403;
    result.message = 'password required';
    return(result);
  };

  var s = "select * from tb_profile where email = $1 and password = $2;";
  plv8.elog(INFO, s);
  var query_result = plv8.execute(s,http_req.email,http_req.password);

  if(query_result.length == 0){
    var s1 = "select * from tb_profile where mobile_number = $1 and password = $2;";
    plv8.elog(INFO, s1);
    var query_result1 = plv8.execute(s1,http_req.email,http_req.password);
    if(query_result1.length == 0){
      result.http_code = 403;
      result.message = 'Invalid Email / Mobile Number and Password';
      return(result);
    } else{
      result.data = query_result1[0];
      result.data.profile_id = query_result1[0].id;
    }
  } else {
    result.data = query_result[0];
    result.data.profile_id = query_result[0].id;
  }



  return (result);
$$ LANGUAGE plv8;
