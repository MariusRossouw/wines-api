create or replace function http_login(http_req_text text) returns JSON as
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

  if (!http_req.body.email) {
    result.http_code = 403;
    result.message = 'email required';
    return(result);
  }

  if (!http_req.body.password || http_req.body.password.trim().length == 0) { 
    result.http_code = 403;
    result.message = 'password required';
    return(result);
  }

  var addr_details = {
    physical_address: '',
    physical_suburb: '',
    physical_city_town: '',
    physical_postal_code: '',
    physical_province_id: 0,
    province: ''
  };

  // var s = "select * from tb_profile where email = $1 and password = $2;";
  // var s = "select \
  // p.*, \
  // a.physical_address, \
  // a.physical_suburb, \
  // a.physical_city_town, \
  // a.physical_postal_code, \
  // a.physical_province_id, \
  // pr.name province \
  // from tb_profile p \
  // left join tb_address a on p.address_id = a.id \
  // join tb_province pr on a.physical_province_id = pr.id \
  // where p.email = $1 and p.password = $2;";

  var s = "select * from tb_profile p where p.email = $1 and p.password = $2;";

  plv8.elog(INFO, s);
  var query_result = plv8.execute(s,http_req.body.email,http_req.body.password);


  if(query_result.length == 0){
    // not found with email - try mobile_number
    var s1 = "select * from tb_profile where mobile_number = $1 and password = $2;";
    plv8.elog(INFO, s1);
    var query_result1 = plv8.execute(s1,http_req.body.mobile_number,http_req.body.password);
    if(query_result1.length == 0){
      result.http_code = 403;
      result.message = 'Invalid Email/ Mobile Number or Password';
      return(result);
    } else {
      // find address

      if (query_result1[0].address_id > 0) {
        var profile_addr_id = query_result1[0].address_id;
  
        var s_addr = "select \
          a.physical_address, \
          a.physical_suburb, \
          a.physical_city_town, \
          a.physical_postal_code, \
          a.physical_province_id, \
          p.name province \
          from tb_address a \
          left join tb_province p on a.physical_province_id = p.id \
          where a.id = $1; "; 
  
        plv8.elog(INFO, s1, null, 2);
        var query_result_addr = plv8.execute(s_addr,profile_addr_id);
  
        if(query_result_addr.length > 0) {
          addr_details.physical_address = query_result_addr[0].physical_address ;
          addr_details.physical_suburb = query_result_addr[0].physical_suburb ;
          addr_details.physical_city_town = query_result_addr[0].physical_city_town ;
          addr_details.physical_postal_code = query_result_addr[0].physical_postal_code ;
          addr_details.physical_province_id = query_result_addr[0].physical_province_id ;
          addr_details.province = query_result_addr[0].province ;
        }
      }
      
      if(query_result[0].change_password == true){
        result.http_code = 202;
        result.message = 'Please change your password';
        result.data.mobile_number = http_req.body.mobile_number;
        result.data.change_password = query_result[0].change_password;
        return(result);
      }
      if(query_result1[0].verified == true){
        result.data = query_result1[0];
        result.data.address = addr_details;
        result.data.profile_id = query_result1[0].id;
      } else {
        result.http_code = 403;
        result.message = 'Please enter your OTP before you can login';
        return(result);
      }
    }
  } else {
    // found with email - now find addr

    if (query_result[0].address_id > 0) {
      var profile_addr_id = query_result[0].address_id;

      var s_addr = "select \
        a.physical_address, \
        a.physical_suburb, \
        a.physical_city_town, \
        a.physical_postal_code, \
        a.physical_province_id, \
        p.name province \
        from tb_address a \
        left join tb_province p on a.physical_province_id = p.id \
        where a.id = $1; "; 

      plv8.elog(INFO, s1, null, 2);
      var query_result_addr = plv8.execute(s_addr,profile_addr_id);

      if(query_result_addr.length > 0) {
        addr_details.physical_address = query_result_addr[0].physical_address ;
        addr_details.physical_suburb = query_result_addr[0].physical_suburb ;
        addr_details.physical_city_town = query_result_addr[0].physical_city_town ;
        addr_details.physical_postal_code = query_result_addr[0].physical_postal_code ;
        addr_details.physical_province_id = query_result_addr[0].physical_province_id ;
        addr_details.province = query_result_addr[0].province ;
      }
    }

    if(query_result[0].change_password == true){
      result.http_code = 202;
      result.message = 'Please change your password';
      result.data.email = http_req.body.email;
      result.data.change_password = query_result[0].change_password;
      return(result);
    }
    if(query_result[0].verified == true){
      result.data = query_result[0];
      result.data.address = addr_details;
      result.data.profile_id = query_result[0].id;
    } else {
      result.http_code = 403;
      result.message = 'Please verify your email before you can login';
      return(result);
    }
  }



  return (result);
$$ LANGUAGE plv8;
