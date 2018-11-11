create or replace function http_app_component_list(http_req JSON) returns JSON as
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

 var fields = ['app_id'];
  var body = Object.keys(http_req.body);
  var i = 0;
  while (i < fields.length) {
      if (body.indexOf(fields[i]) == -1) {
          result.errors.push({
              message: 'Field required',
              detail: fields[i]
          });
      }
      i++;
  }
  if (result.errors.length > 0) {
      result.http_code = 400;
      return(result);
  }

  var s = "select * from tb_component where app_id = $1";
  plv8.elog(INFO, s);
  var query_result = plv8.execute(s, http_req.body.app_id);

  if (query_result && query_result.length > 0) {
    result.data.records = query_result;
  }

  return(result);

  $$ LANGUAGE plv8;