create or replace function http_api_method(http_req_text text) returns JSON as
$$
if(!plv8.ufn){
  var sup = plv8.find_function("plv8_startup");
  sup();
 }

  var result = {
    http_code : 200,
    error_code : "",
    message : "",
    data : {},
    errors : []
  };

  var md = moment();
  var create_date = md.format("YYYY-MM-DD");
  var create_time = md.format('YYYY-MM-DDTHH:mm:ss.SSS');
  var create_display_time = md.format('YYYY-MM-DD HH:mm');

  http_req = {};

  try {
    http_req = JSON.parse(http_req_text);
  } catch(e){
    result.http_code = 403;
    result.error_code = 'json_parse_error';
    result.message = 'Invalid http request';
    log_request();
    return result;
  };
  if(!http_req.query){http_req.query = {}};
  if(!http_req.body){http_req.body = {}};
  if(!http_req.url){http_req.url = ''};

  http_req.create_date = create_date;
  http_req.create_time = create_time;
  http_req.create_display_time = create_display_time;

  var function_name = '';
  var path_array = http_req.url.split('/');
  if(path_array.length > 1){
    function_name = path_array[1];
  }
  var path_array2 = function_name.split('?');
  function_name = path_array2[0];

  result.function_name = function_name;
  if(!function_name || function_name.length == 0){
    result.http_code = 403;
    result.error_code = 'function_name_error';
    result.message = 'Function name error';
    log_request();
    return result;
  };


  /*
  TODO: axept, change all GET to POST, and only allow POST
  or allow only these get
    profiles_list_admin
    profiles_list_consumer
    accounts_list_consumer
    accounts_get_one
    accounts_transactions
    transaction_events
    master_account_list
    master_account_get_one
    contact_us_list
    login_admin
    gen_json_get
    gen_json_list
  */

  if(http_req.api_name == 'canserve'){
    function_name = 'http_canserve' + path_array.join('_');
  } 
  if (http_req.api_name && http_req.api_name == '_'){
    function_name = 'http_' + function_name;
  }

  // if(http_req.api_name && http_req.api_name == 'spika'){
  //   function_name = 'http_spika_' + function_name;
  // }
  // if(http_req.api_name && http_req.api_name == 'axept'){
  //   function_name = 'http_axept_' + function_name;
  // }
  // if(http_req.api_name && http_req.api_name == 'business'){
  //   function_name = 'http_business_' + function_name;
  // }

  // if(http_req.api_name == ''){
  //   if(function_name == 'paysafeacqcallback') function_name = 'http_other_paysafe_callback';
  // }

  // if(http_req.api_name == ''){
  //   if(function_name == 'paysafeacqcallback') function_name = 'http_other_paysafe_callback';
  // }

  // if(http_req.api_name == 'axept'){
  //   if(function_name == 'http_axept_profiles_update_admin') function_name = 'http_axept_profiles_update_one_admin';
  //   if(function_name == 'http_axept_profiles_update_consumer') function_name = 'http_axept_profiles_update_one_consumer';
  //   if(function_name == 'http_axept_transaction_events') function_name = 'http_axept_transaction_events_admin';
  //   if(function_name == 'http_axept_master_account_list') function_name = 'http_axept_master_account_list_admin';
  //   if(function_name == 'http_axept_master_account_get_one') function_name = 'http_axept_master_account_admin_get_one';
  // }

  // if(http_req.api_name == 'spika'){
  //   if(function_name == 'http_spika_email_validate') function_name = 'http_spika_email_verification';
  //   if(function_name == 'http_spika_send_money_get') function_name = 'http_spika_remits_get_one';
  //   if(function_name == 'http_spika_receive_money_get') function_name = 'http_spika_remits_get_one';
  // }

  function log_request(){
    var sql = 'insert into tb_api_log (orig_id, type, data, error, create_time, action_type, action_name) values ($1, $2, $3, $4, $5, $6, $7) returning id';
    var sql_res = plv8.execute(sql, 0, 'api', http_req, result.error_code, create_time, 'stored_function', function_name);
    if(sql_res.length > 0 && sql_res[0].log_id){
      http_req.log_id = sql_res[0].log_id;
    }
  };
  function log_result(){
    var sql = 'insert into tb_api_log (orig_id, type, data, error, create_time) values ($1, $2, $3, $4, $5)';
    plv8.execute(sql, http_req.log_id, 'api_res', result, result.message, create_time);
  };

  http_req.function_name = function_name;
  log_request();

  var f = null;
  try {
    f = plv8.find_function(function_name);
  } catch (err){
    result.http_code = 403;
    result.error_code = 'function_not_found';
    result.message = 'Function not found';
    log_result();
    return result;
  }

  // var byref = {};
  // plv8.ufn.resolve_profile_token(http_req, result, byref);
  // if(result.http_code != 200){
  //   return(result);
  // }
  // var profile = byref.profile;

  result = f(JSON.stringify(http_req));
  log_result();
  return result;

/*
curl -i \
-X POST \
-H "Content-Type: application/json" \
-H "Accept: application/json" \
-s http://localhost:31001/health_check2 \
-d '{"type":"test"}'
*/

$$ LANGUAGE plv8;

