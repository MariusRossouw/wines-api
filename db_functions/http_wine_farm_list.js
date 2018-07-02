create or replace function http_wine_farm_list(http_req_text text) returns JSON as
$$
if (!plv8.ufn) {
  var sup = plv8.find_function("plv8_startup");
  sup();
 }

 var result = {
    http_code : 200,
    error_code : "",
    message : "",
    data : {
      records: []
    },
    errors : []
  };

  var http_req = plv8.ufn.http_req_parse(http_req_text);
  if (http_req.err_message != '') {
    result.http_code = 403;
    result.message = http_req.err_message;
    return(result);
  }

  var s = "select * from tb_wine_farm";
  plv8.elog(INFO, s);
  var query_result = plv8.execute(s);

  if (query_result && query_result.length > 0) {
    result.data.records = query_result;
  }

  return(result);
  
  $$ LANGUAGE plv8;