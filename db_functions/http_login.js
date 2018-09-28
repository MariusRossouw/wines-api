create or replace function http_login(http_req_text text) returns JSON as
$$
if (!plv8.ufn) {
  var sup = plv8.find_function("plv8_startup");
  sup();
 }

  var result = {
    http_code:200,
    message:'',
    data:{
      filters:{}
    }
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

  var mobile_no_exl = '';
  if(http_req.body.mobile_number){
    mobile_no_exl = http_req.body.mobile_number.substr(1);
  }

  var addr_details = {
    address_line_1: '',
    address_line_2: '',
    address_line_3: '',
    address_line_4: '',
    physical_province_id: 0,
    province: ''
  };

  // var s = "select * from tb_profile where email = $1 and password = $2;";
  // var s = "select \
  // p.*, \
  // a.address_line_1, \
  // a.address_line_2, \
  // a.address_line_3, \
  // a.address_line_4, \
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
    // not found with email - try mobile_no_exl
    var s1 = "select * from tb_profile where mobile_no_exl = $1 and password = $2;";
    plv8.elog(INFO, s1);
    var query_result1 = plv8.execute(s1,http_req.body.mobile_no_exl,http_req.body.password);
    if(query_result1.length == 0){
      result.http_code = 403;
      result.message = 'Invalid Email/ Mobile Number or Password';
      return(result);
    } else {
      // find permissions and create nav
      // find address

      if (query_result1[0].address_id > 0) {
        var profile_addr_id = query_result1[0].address_id;
  
        var s_addr = "select \
          a.address_line_1, \
          a.address_line_2, \
          a.address_line_3, \
          a.address_line_4, \
          a.physical_province_id, \
          p.name province \
          from tb_address a \
          left join tb_province p on a.physical_province_id = p.id \
          where a.id = $1; "; 
  
        plv8.elog(INFO, s1, null, 2);
        var query_result_addr = plv8.execute(s_addr,profile_addr_id);
  
        if(query_result_addr.length > 0) {
          addr_details.address_line_1 = query_result_addr[0].address_line_1 ;
          addr_details.address_line_2 = query_result_addr[0].address_line_2 ;
          addr_details.address_line_3 = query_result_addr[0].address_line_3 ;
          addr_details.address_line_4 = query_result_addr[0].address_line_4 ;
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
        // result.data.profile_id = query_result1[0].id;
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
        a.address_line_1, \
        a.address_line_2, \
        a.address_line_3, \
        a.address_line_4, \
        a.physical_province_id, \
        p.name province \
        from tb_address a \
        left join tb_province p on a.physical_province_id = p.id \
        where a.id = $1; "; 

      plv8.elog(INFO, s1, null, 2);
      var query_result_addr = plv8.execute(s_addr,profile_addr_id);

      if(query_result_addr.length > 0) {
        addr_details.address_line_1 = query_result_addr[0].address_line_1 ;
        addr_details.address_line_2 = query_result_addr[0].address_line_2 ;
        addr_details.address_line_3 = query_result_addr[0].address_line_3 ;
        addr_details.address_line_4 = query_result_addr[0].address_line_4 ;
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
      // result.data.profile_id = query_result[0].id;

      // ********* START FILTERS *********
    var profile = query_result[0];
    var is_rep = profile.type == 'Rep' ? true : false;
    var is_manager = profile.type == 'Manager' ? true : false;

    var filters = {};

    if(!is_rep && !is_manager){
      // ===== years =====
      var s = `select distinct transaction_year from tb_transactions;`;
      var sres = plv8.execute(s);
      var years = sres;

      filters.years = years;

      // ===== codes =====
      var s = `select distinct code from tb_merchant;`;
      var sres = plv8.execute(s);
      var codes = sres;

      filters.codes = codes;

      // ===== merchant_groups =====
      var s = `select merchant_group_id, group_name from tb_merchant_group;`;
      var sres = plv8.execute(s);
      var merchant_groups = sres;

      filters.merchant_groups = merchant_groups;

      // ===== merchants =====
      var s = `select merchant_id, merchant_name from tb_merchant;`;
      var sres = plv8.execute(s);
      var merchants = sres;

      filters.merchants = merchants;

      // ===== wine_farms =====
      var s = `select wine_farm_id, farm_name from tb_wine_farm;`;
      var sres = plv8.execute(s);
      var wine_farms = sres;

      filters.wine_farms = wine_farms;

      // ===== products =====
      var s = `select product_id, description as product_name from tb_product;`;
      var sres = plv8.execute(s);
      var products = sres;

      filters.products = products;

      // ===== types =====
      var s = `select product_type_id, product_type from tb_product_type;`;
      var sres = plv8.execute(s);
      var types = sres;

      filters.types = types;

      // ===== reps =====
      var s = `select profile_id, rep_name from tb_profile where rep_name is not null;`;
      var sres = plv8.execute(s);
      var reps = sres;

      filters.reps = reps;

      // ===== provinces =====
      var s = `select province_id, province_name from tb_province;`;
      var sres = plv8.execute(s);
      var provinces = sres;

      filters.provinces = provinces;
    }
    if(is_rep){
      // ===== years =====
      var s = `select distinct transaction_year from tb_transactions where profile_id = $1;`;
      var sres = plv8.execute(s,profile.profile_id);
      var years = sres;

      filters.years = years;

      // ===== codes =====
      var s = `select distinct m.code from tb_merchant m
      inner join tb_merchant_profile_map mp on mp.merchant_id = m.merchant_id
      where mp.profile_id = $1;`;
      var sres = plv8.execute(s,profile.profile_id);
      var codes = sres;

      filters.codes = codes;

      // ===== merchant_groups =====
      var s = `select distinct mg.merchant_group_id, mg.group_name from tb_merchant_group mg
      inner join tb_merchant m on m.merchant_group_id = mg.merchant_group_id
      inner join tb_merchant_profile_map mp on mp.merchant_id = m.merchant_id
      where mp.profile_id = $1;`;
      var sres = plv8.execute(s,profile.profile_id);
      var merchant_groups = sres;

      filters.merchant_groups = merchant_groups;

      // ===== merchants =====
      var s = `select distinct m.merchant_id, m.merchant_name from tb_merchant m
      inner join tb_merchant_profile_map mp on mp.merchant_id = m.merchant_id
      where mp.profile_id = $1;`;
      var sres = plv8.execute(s,profile.profile_id);
      var merchants = sres;

      filters.merchants = merchants;

      // ===== wine_farms =====
      var s = `select wine_farm_id, farm_name from tb_wine_farm
        where wine_farm_id in (
        select distinct wine_farm_id 
        from tb_wine_farm_product_map wp 
        where wp.product_id in(
          select product_id 
          from tb_transactions t where t.profile_id = $1
        ));`;
      var sres = plv8.execute(s,profile.profile_id);
      var wine_farms = sres;

      filters.wine_farms = wine_farms;

      // ===== products =====
      var s = `select distinct product_id, description as product_name from tb_product p 
      where p.product_id in(
        select product_id 
        from tb_transactions t where t.profile_id = $1
      );`;
      var sres = plv8.execute(s,profile.profile_id);
      var products = sres;

      filters.products = products;

      // ===== types =====
      var s = `select product_type_id, product_type from tb_product_type
      where product_type_id in(
      select distinct product_type_id from tb_product p 
      where p.product_id in(
        select product_id 
        from tb_transactions t where t.profile_id = $1
      ));`;
      var sres = plv8.execute(s,profile.profile_id);
      var types = sres;

      filters.types = types;

      // ===== reps =====
      var s = `select profile_id, rep_name from tb_profile where rep_name is not null and profile_id = $1;`;
      var sres = plv8.execute(s,profile.profile_id);
      var reps = sres;

      filters.reps = reps;

      // ===== provinces =====
      var s = `select province_id, province_name from tb_province 
      where province_id in(
      select distinct m.province_id from tb_merchant m 
      where m.merchant_id in(
        select t.merchant_id
        from tb_transactions t where t.profile_id = $1
      ));`;
      var sres = plv8.execute(s,profile.profile_id);
      var provinces = sres;

      filters.provinces = provinces;
    }
    if(is_manager){
      // ===== years =====
      var s = `select distinct transaction_year 
      from tb_transactions 
      where profile_id in(
        select rep_id 
        from tb_manager_rep_map mrm 
        where mrm.manager_id = $1
      );`;
      var sres = plv8.execute(s,profile.profile_id);
      var years = sres;

      filters.years = years;

      // ===== codes =====
      var s = `select distinct m.code from tb_merchant m
      inner join tb_merchant_profile_map mp on mp.merchant_id = m.merchant_id
      where mp.profile_id in(
        select rep_id 
        from tb_manager_rep_map mrm 
        where mrm.manager_id = $1
      );`;
      var sres = plv8.execute(s,profile.profile_id);
      var codes = sres;

      filters.codes = codes;

      // ===== merchant_groups =====
      var s = `select distinct mg.merchant_group_id, mg.group_name from tb_merchant_group mg
      inner join tb_merchant m on m.merchant_group_id = mg.merchant_group_id
      inner join tb_merchant_profile_map mp on mp.merchant_id = m.merchant_id
      where mp.profile_id in(
        select rep_id 
        from tb_manager_rep_map mrm 
        where mrm.manager_id = $1
      );`;
      var sres = plv8.execute(s,profile.profile_id);
      var merchant_groups = sres;

      filters.merchant_groups = merchant_groups;

      // ===== merchants =====
      var s = `select distinct m.merchant_id, m.merchant_name from tb_merchant m
      inner join tb_merchant_profile_map mp on mp.merchant_id = m.merchant_id
      where mp.profile_id in(
        select rep_id 
        from tb_manager_rep_map mrm 
        where mrm.manager_id = $1
      );`;
      var sres = plv8.execute(s,profile.profile_id);
      var merchants = sres;

      filters.merchants = merchants;

      // ===== wine_farms =====
      var s = `select wine_farm_id, farm_name from tb_wine_farm
      where wine_farm_id in (
      select distinct wine_farm_id 
      from tb_wine_farm_product_map wp 
      where wp.product_id in(
        select product_id 
        from tb_transactions t where t.profile_id in(
          select rep_id 
          from tb_manager_rep_map mrm 
          where mrm.manager_id = $1
        )
      ));`;
      var sres = plv8.execute(s,profile.profile_id);
      var wine_farms = sres;

      filters.wine_farms = wine_farms;

      // ===== products =====
      var s = `select distinct product_id, description as product_name from tb_product p 
      where p.product_id in(
        select product_id 
        from tb_transactions t where t.profile_id in(
          select rep_id 
          from tb_manager_rep_map mrm 
          where mrm.manager_id = $1
        )
      );`;
      var sres = plv8.execute(s,profile.profile_id);
      var products = sres;

      filters.products = products;

      // ===== types =====
      var s = `select product_type_id, product_type from tb_product_type
      where product_type_id in(
      select distinct product_type_id from tb_product p 
      where p.product_id in(
        select product_id 
        from tb_transactions t where t.profile_id in(
          select rep_id 
          from tb_manager_rep_map mrm 
          where mrm.manager_id = $1
        )
      ));`;
      var sres = plv8.execute(s,profile.profile_id);
      var types = sres;

      filters.types = types;

      // ===== reps =====
      var s = `select profile_id, rep_name from tb_profile where rep_name is not null and profile_id in(
          select distinct rep_id 
          from tb_manager_rep_map mrm 
          where mrm.manager_id = $1
        );`;
      var sres = plv8.execute(s,profile.profile_id);
      var reps = sres;

      filters.reps = reps;

      // ===== provinces =====
      var s = `select province_id, province_name from tb_province 
      where province_id in(
      select distinct m.province_id from tb_merchant m 
      where m.merchant_id in(
        select t.merchant_id
        from tb_transactions t where t.profile_id in(
          select rep_id 
          from tb_manager_rep_map mrm 
          where mrm.manager_id = $1
        )
      ));`;
      var sres = plv8.execute(s,profile.profile_id);
      var provinces = sres;

      filters.provinces = provinces;
    }

// ********* END FILTERS *********

    } else {
      result.http_code = 403;
      result.message = 'Please verify your email before you can login';
      return(result);
    }
  }

  result.data.filters = filters;

  return (result);
$$ LANGUAGE plv8;
