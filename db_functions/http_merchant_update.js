create or replace function http_merchant_update(http_req_text text) returns JSON as
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

  if(!http_req.body.merchant_id){
    result.http_code = 403;
    result.message = 'merchant_id required';
    return(result);
  };

  var s = "update tb_merchant set ";
  var obj = http_req.body.update;
  var update_items = [];
  for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        update_items.push(obj[key])
        s += key + " = $" + update_items.length + ",";
      }
  }
  var sql = s.substr(0, (s.length - 1));

  update_items.push(http_req.body.merchant_id)
  sql += " where merchant_id = $" + update_items.length + "returning merchant_id;";

  var query_items = [];
  query_items.push(sql);
  query_items.push(update_items);

  var query_result = plv8.execute.apply(this, query_items);

  if (query_result && query_result.length > 0) {
    result.data.merchant_id = query_result[0].merchant_id;
  }

  return(result);

  $$ LANGUAGE plv8;