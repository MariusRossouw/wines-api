create or replace function http_app_list(http_req JSON) returns JSON as
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

  var s = "select * from tb_app";
  plv8.elog(INFO, s);
  var query_result = plv8.execute(s);

  if (query_result && query_result.length > 0) {
    result.data.records = query_result;
  }

  return(result);

  $$ LANGUAGE plv8;