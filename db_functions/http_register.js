create or replace function http_register(http_req_text text) returns JSON as
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

  var addr_data_obj = {};
  var interest_data_obj = {};
  var profile_data_obj = {};
  var verify_data_obj = {};

  var interest_table_name = 'tb_interest';
  var addr_table_name = 'tb_address';
  var profile_table_name = 'tb_profile';
  var verify_table_name = 'tb_register_verify';
  

  var jdata = {};
  var name;

  if(http_req.body.first_name){
    name = http_req.body.first_name + ' ' + http_req.body.last_name;
  }
  if(http_req.body.business_name){
    name = http_req.body.business_name;
  }
  if(!http_req.body.password){
    var password = randomStr(6);
    http_req.body.password = password;
    data_obj.change_password = true;
  }

  function objHasData(obj) {
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        return true;
      }
    }
    return false;
  }

  function randomStr(n) {
    var n = n || 9; s = '', r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i=0; i < n; i++) { s += r.charAt(Math.floor(Math.random()*r.length)); }
    return s;
  };
  
  if(http_req.body.communication_email){
    var s = "select * from tb_profile where email = $1;";
    plv8.elog(INFO, s);
    var query_result = plv8.execute(s,http_req.body.email);

    if(query_result.length > 0){
      result.http_code = 403;
      result.message = 'That email is already in use';
      return(result);
    } 
    result.data.communication_method = 'Email';
  } 

  if(http_req.body.communication_sms){
    var s1 = "select * from tb_profile where mobile_number = $1;";
    plv8.elog(INFO, s1);
    var query_result1 = plv8.execute(s1,http_req.body.mobile_number);

    if(query_result1.length > 0){
      result.http_code = 403;
      result.message = 'That mobile number is already in use';
      return(result);
    }
    result.data.communication_method = 'SMS';
  }

  // build address obj
  if (http_req.body.physical_address && http_req.body.physical_address.length > 0) {
    addr_data_obj.physical_address = http_req.body.physical_address;
  }

  if (http_req.body.physical_city_town && http_req.body.physical_city_town.length > 0) {
    addr_data_obj.physical_city_town = http_req.body.physical_city_town;
  }

  if (http_req.body.physical_suburb && http_req.body.physical_suburb.length > 0) {
    addr_data_obj.physical_suburb = http_req.body.physical_suburb;
  }

  if (http_req.body.physical_postal_code && http_req.body.physical_postal_code.length > 0) {
    addr_data_obj.physical_postal_code = http_req.body.physical_postal_code;
  }

  if (http_req.body.physical_province_id && http_req.body.physical_province_id > 0) {
    addr_data_obj.physical_province_id = http_req.body.physical_province_id;
  }

  var new_address_id = 0;

  if (objHasData(addr_data_obj)) {
    // result.addr_data_obj = addr_data_obj;
    var query_result_address = plv8.ufn.insert_one(addr_data_obj, addr_table_name);
    // result.query_result_address_id = query_result_address.id;
    
    new_address_id = query_result_address.id;
    // result.new_address_id = new_address_id;
    // result.query_result_address = query_result_address;
    // return(result);
  }

  // build interest_data_obj
  if (http_req.body.news_letter) {
    interest_data_obj.news_letter = http_req.body.news_letter;
  }

  if (http_req.body.health_updates) {
    interest_data_obj.health_updates = http_req.body.health_updates;
  }

  if (http_req.body.fundraising_events) {
    interest_data_obj.fundraising_events = http_req.body.fundraising_events;
  }

  if (http_req.body.health_screening_events) {
    interest_data_obj.health_screening_events = http_req.body.health_screening_events;
  }

  if (http_req.body.health_promotions) {
    interest_data_obj.health_promotions = http_req.body.health_promotions;
  }

  if (http_req.body.affected_by_cancer) {
    interest_data_obj.affected_by_cancer = http_req.body.affected_by_cancer;
  }

  var query_result_interest;
  var new_interest_id = 0;
  
  if (objHasData(interest_data_obj)) {
    query_result_interest = plv8.ufn.insert_one(interest_data_obj, interest_table_name);
    new_interest_id = query_result_interest.id;
  } 

  profile_data_obj.profile_type = http_req.body.profile_type;
  profile_data_obj.gender = http_req.body.gender;
  profile_data_obj.race = http_req.body.race;
  profile_data_obj.religious_views = http_req.body.religious_views;
  profile_data_obj.dob_day = http_req.body.dob_day;
  profile_data_obj.dob_month = http_req.body.dob_month;
  profile_data_obj.dob_year = http_req.body.dob_year;
  profile_data_obj.first_name = http_req.body.first_name;
  profile_data_obj.last_name = http_req.body.last_name;
  profile_data_obj.business_name = http_req.body.business_name;
  profile_data_obj.name = name;
  profile_data_obj.password = http_req.body.password;
  profile_data_obj.email = http_req.body.email;
  profile_data_obj.mobile_number = http_req.body.mobile_number;
  profile_data_obj.id_number = http_req.body.id_number;
  profile_data_obj.communication_sms = http_req.body.communication_sms;
  profile_data_obj.communication_email = http_req.body.communication_email;

  if (new_address_id > 0) {
    profile_data_obj.address_id = new_address_id;
  }

  if (new_interest_id > 0) {
    profile_data_obj.interest_id = new_interest_id;
  }

  profile_data_obj.jdata = http_req.body.jdata;
  profile_data_obj.verified = false;
  //profile_data_obj.status = 'Created not yet Verified';
  profile_data_obj.status_id = 1;
  profile_data_obj.new_email = http_req.body.email;

  var query_result = plv8.ufn.insert_one(profile_data_obj, profile_table_name);

  var new_profile_id = query_result.id;

  result.data.name = name;
  result.data.email = http_req.body.email;
  result.data.change_password = profile_data_obj.change_password;
  result.data.profile_id = new_profile_id.toString();

  result.query_result = query_result;
  return(result);

  // tb_register_verify
  verify_data_obj.profile_id = new_profile_id;
  verify_data_obj.new_email = http_req.body.email;
  verify_data_obj.next_url = '';
  if (http_req.body.next_url && http_req.body.next_url.length > 0) {
    verify_data_obj.next_url = http_req.body.next_url;
  }

  var query_result_verify = plv8.ufn.insert_one(verify_data_obj, verify_table_name);

  
  return(result);

$$ LANGUAGE plv8;



