create or replace function http_brand_update(http_req JSON) returns JSON as
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

  if(!http_req.body.brand_id){
    result.http_code = 403;
    result.message = 'brand_id required';
    return(result);
  };

  if(!http_req.body.update){

    var s = "update tb_brand set ";
    var obj = http_req.body.update;
    var update_items = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && key != 'brand_id') {
          update_items.push(obj[key])
          s += key + " = $" + update_items.length + ",";
        }
    }
    var sql = s.substr(0, (s.length - 1));

    update_items.push(http_req.body.brand_id)
    sql += " where brand_id = $" + update_items.length + "returning brand_id;";;

    var query_items = [];
    query_items.push(sql);
    query_items.push(update_items);

    var query_result = plv8.execute.apply(this, query_items);

    if (query_result && query_result.length > 0) {
      result.data.brand_id = query_result[0].brand_id;
    }
  }

  return(result);

  $$ LANGUAGE plv8;