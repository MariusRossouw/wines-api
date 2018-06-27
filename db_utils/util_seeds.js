(function (root) {
  if(!plv8.ufn){
    return;
  }

  plv8.ufn.new_area = function(name){
    var md = moment();
    var create_date = md.format("YYYY-MM-DD");
    var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    var create_display_time = md.format('YYYY-MM-DD HH:mm');

    var sql = 'select name from tb_area where name = $1;';
    var sqlres = plv8.execute(sql, name);
    if(sqlres.length > 0){
        return;
    }

    var sql_insert = 'insert into tb_area (name, create_date, create_time, create_display_time) ';
    sql_insert += 'values($1,$2,$3,$4) returning id; ';
    sql_res = plv8.execute(sql_insert, name, create_date, create_time, create_display_time);
    var area_id = sql_res.id;
  };

  plv8.ufn.new_bus_unit = function(code, name){
    var md = moment();
    var create_date = md.format("YYYY-MM-DD");
    var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    var create_display_time = md.format('YYYY-MM-DD HH:mm');

    var sql = 'select code from tb_business_unit where code = $1;';
    var sqlres = plv8.execute(sql, code);
    if(sqlres.length > 0){
        return;
    }

    var sql_insert = 'insert into tb_business_unit (code, name, create_date, create_time, create_display_time) ';
    sql_insert += 'values($1,$2,$3,$4,$5) returning id; ';
    sql_res = plv8.execute(sql_insert, code, name, create_date, create_time, create_display_time);
    var bus_unit_id = sql_res.id;
  };

  plv8.ufn.new_domain = function(gl_code, name, business_unit_id, province_id){
    var md = moment();
    var create_date = md.format("YYYY-MM-DD");
    var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    var create_display_time = md.format('YYYY-MM-DD HH:mm');

    var sql = 'select gl_code from tb_domain where gl_code = $1;';
    var sqlres = plv8.execute(sql, gl_code);
    if(sqlres.length > 0){
        return;
    }

    var sql_insert = 'insert into tb_domain (gl_code, name, business_unit_id, province_id, create_date, create_time, create_display_time) ';
    sql_insert += 'values($1,$2,$3,$4,$5,$6,$7) returning id; ';
    sql_res = plv8.execute(sql_insert, gl_code, name, business_unit_id, province_id, create_date, create_time, create_display_time);
    var domain_id = sql_res.id;
  };

  plv8.ufn.new_income_type = function(income_gl_code, income_name){
    var md = moment();
    var create_date = md.format("YYYY-MM-DD");
    var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    var create_display_time = md.format('YYYY-MM-DD HH:mm');

    var sql = 'select income_gl_code from tb_income_type where income_gl_code = $1;';
    var sqlres = plv8.execute(sql, income_gl_code);
    if(sqlres.length > 0){
        return;
    }

    var sql_insert = 'insert into tb_income_type (income_gl_code, income_name, create_date, create_time, create_display_time) ';
    sql_insert += 'values($1,$2,$3,$4,$5) returning id; ';
    sql_res = plv8.execute(sql_insert, income_gl_code, income_name, create_date, create_time, create_display_time);
    var income_type_id = sql_res.id;
  };


  plv8.ufn.new_profile = function(type, email, first_name, last_name, name, password, mobile_no_exl, mobile_country_code, verified){
                                
		var md = moment();
		var create_date = md.format("YYYY-MM-DD");
		var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    var create_display_time = md.format('YYYY-MM-DD HH:mm');

    var result = {
      http_code:200,
      message:'',
      data:{}
    };

    var s = "insert into tb_type(type) values($1) ON CONFLICT (type) \
      DO UPDATE SET type=EXCLUDED.type RETURNING type_id";
    var sres = plv8.execute(s, type);
    var type_id = sres[0].type_id;

    var sql = 'select profile_id from tb_profile where email = $1;';

		var sqlres = plv8.execute(sql, email);
		if(sqlres.length > 0){
			return;
		}

		var sql_insert = 'insert into tb_profile (email, first_name, last_name, name, password, mobile_no_exl, mobile_country_code, verified) ';
    sql_insert += 'values($1,$2,$3,$4,$5,$6,$7,$8) returning profile_id; ';

		sql_res = plv8.execute(sql_insert, email, first_name, last_name, name, password, mobile_no_exl, mobile_country_code, verified);
    var profile_id = sql_res[0].profile_id;

    var s = "insert into tb_profile_type_map(profile_id, type_id) values($1,$2) ON CONFLICT (profile_id,type_id) \
      DO UPDATE SET profile_id=EXCLUDED.profile_id RETURNING profile_type_id";
    var sres = plv8.execute(s, profile_id, type_id);

    result.data = sql_res;
    result.profile_id = profile_id;
    return(result);
    
  };

  
  plv8.ufn.new_project = function(kpi_gl_code, project_gl_code, name, area_id, project_type){
    var md = moment();
    var create_date = md.format("YYYY-MM-DD");
    var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    var create_display_time = md.format('YYYY-MM-DD HH:mm');

    var sql = 'select id from tb_project where name = $1;';
    var sqlres = plv8.execute(sql, name);
    if(sqlres.length > 0){
        return;
    }

    var sql_insert = 'insert into tb_project (kpi_gl_code, project_gl_code, name, area_id, project_type, create_date, create_time, create_display_time) ';
    sql_insert += 'values($1,$2,$3,$4,$5,$6,$7,$8) returning id; ';
    sql_res = plv8.execute(sql_insert, kpi_gl_code, project_gl_code, name, area_id, project_type, create_date, create_time, create_display_time);
    var project_id = sql_res.id;
  };

  plv8.ufn.new_province = function(abrv, name){

    var sql = 'select abrv from tb_province where abrv = $1;';
    var sqlres = plv8.execute(sql, abrv);
    if(sqlres.length > 0){
        return;
    }

    var sql_insert = 'insert into tb_province (abrv, province_name) ';
    sql_insert += 'values($1,$2) returning province_id; ';
    sql_res = plv8.execute(sql_insert, abrv, name);
    var province_id = sql_res.province_id;
  };

  plv8.ufn.new_volunteer_type = function(description){
		var md = moment();
		var create_date = md.format("YYYY-MM-DD");
		var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
		var create_display_time = md.format('YYYY-MM-DD HH:mm');

		var sql = 'select description from tb_volunteer_type where description = $1;';
		var sqlres = plv8.execute(sql, description);
		if(sqlres.length > 0){
			return;
		}

		var sql_insert = 'insert into tb_volunteer_type (description, create_date, create_time, create_display_time) ';
		sql_insert += 'values($1,$2,$3,$4) returning id; ';

		sql_res = plv8.execute(sql_insert, description, create_date, create_time, create_display_time);
		var volunteer_type_id = sql_res.id;
  };
  
  plv8.ufn.new_volunteer_subtype = function(volunteer_type_id, description) {
		var md = moment();
		var create_date = md.format("YYYY-MM-DD");
		var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
		var create_display_time = md.format('YYYY-MM-DD HH:mm');

		var sql = 'select id from tb_volunteer_subtype where volunteer_type_id = $1 AND description = $2;';
		var sqlres = plv8.execute(sql, volunteer_type_id, description);
		if(sqlres.length > 0){
      result.error = volunteer_type_id, + ' ' + description + ' already exists'
			return(result);
		}

		var sql_insert = 'insert into tb_volunteer_subtype (volunteer_type_id, description, create_date, create_time, create_display_time ) ';
		sql_insert += 'values($1,$2,$3,$4,$5) returning id; ';

		sql_res = plv8.execute(sql_insert, volunteer_type_id, description, create_date, create_time, create_display_time);

  };

  plv8.ufn.new_status = function(state, status_type) {
		var md = moment();
		var create_date = md.format("YYYY-MM-DD");
		var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
		var create_display_time = md.format('YYYY-MM-DD HH:mm');
    
    var sql = 'select state from tb_status where state = $1;';
    var sqlres = plv8.execute(sql, state);
    if(sqlres.length > 0){
        return;
    }
		var sql_insert = 'insert into tb_status (state, status_type, create_date, create_time, create_display_time) ';
		sql_insert += 'values($1,$2,$3,$4,$5) returning id; ';
		sql_res = plv8.execute(sql_insert, state, status_type, create_date, create_time, create_display_time);
  };


  plv8.ufn.new_profile_cansa = function(id, profile_type, gender, race, dob_day, dob_month, dob_year, first_name, last_name, name, password, email, mobile_number, id_number, physical_address, physical_suburb, physical_city_town, physical_postal_code, physical_province_id, communication_sms, communication_email, volunteer, uuid, verified, status, img) {
		var md = moment();
		var create_date = md.format("YYYY-MM-DD");
		var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
		var create_display_time = md.format('YYYY-MM-DD HH:mm');

    var sql = 'select email from tb_profile where email = $1;';
    var sqlres = plv8.execute(sql, email);
    if(sqlres.length > 0){
        return;
    }

		var sql_insert_profile = 'insert into tb_profile (id, profile_type, gender, race, dob_day, dob_month, dob_year, first_name, last_name, name, password, email, mobile_number, id_number, address_id, communication_sms, communication_email, volunteer, uuid, verified, status, img, create_date, create_time, create_display_time)';
		sql_insert_profile += 'values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25) returning id; ';
    sql_res_profile = plv8.execute(sql_insert_profile, id, profile_type, gender, race, dob_day, dob_month, dob_year, first_name, last_name, name, password, email, mobile_number, id_number, id, communication_sms, communication_email, volunteer, uuid, verified, status, img, create_date, create_time, create_display_time);
  };


  plv8.ufn.new_profile_address = function(id, physical_address, physical_suburb, physical_city_town, physical_postal_code, physical_province_id) {
		var md = moment();
		var create_date = md.format("YYYY-MM-DD");
		var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    var create_display_time = md.format('YYYY-MM-DD HH:mm');
    var result = {
      http_code:200,
      message:'',
      data:{}
    };

    // var sql = 'select id from tb_address where id = $1;';
    // var sqlres = plv8.execute(sql, id);
    // if(sqlres.length > 0){
    //     return; 
    // }

    var sql_insert_addr = 'insert into tb_address (id, physical_address, physical_suburb, physical_city_town, physical_postal_code, physical_province_id, create_date, create_time, create_display_time)';
    sql_insert_addr += 'values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning id; ';
    sql_res_addr = plv8.execute(sql_insert_addr, id, physical_address, physical_suburb, physical_city_town, physical_postal_code, physical_province_id, create_date, create_time, create_display_time);
    
    var new_addr_id = sql_res_addr;
    return(new_addr_id);
  };

  plv8.ufn.new_staff_role = function(role) {
		var md = moment();
		var create_date = md.format("YYYY-MM-DD");
		var create_time = md.format('YYYY-MM-DDTHH:mm:ss');
		var create_display_time = md.format('YYYY-MM-DD HH:mm');
    
    var sql = 'select role from tb_staff_role where role = $1;';
    var sqlres = plv8.execute(sql, role);
    if(sqlres.length > 0){
        return;
    }
		var sql_insert = 'insert into tb_staff_role (role, create_date, create_time, create_display_time) ';
		sql_insert += 'values($1,$2,$3,$4) returning id; ';
		sql_res = plv8.execute(sql_insert, role, create_date, create_time, create_display_time);
  };
  

}(this));