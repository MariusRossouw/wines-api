(function (root) {
  if(!plv8.ufn){
    return;
  }

  plv8.ufn.insert_one = function(data_obj, tb_name){
		var md = moment();
		data_obj.create_date = md.format("YYYY-MM-DD");
		data_obj.create_time = md.format('YYYY-MM-DDTHH:mm:ss');
    data_obj.create_display_time = md.format('YYYY-MM-DD HH:mm');
    
    var items = 1;
    var columns = "";
    var vars = "";
    var a = [];
    
    for(var key in data_obj){
      if (data_obj.hasOwnProperty(key)) {
    
        vars += "$" + items + ",";
    
        a.push(data_obj[key]);
        columns += key + ',';
        items ++;
      }
    }
    
    var insert_columns = columns.substr(0,(columns.length-1));
    var insert_values = vars.substr(0,(vars.length-1));
    
    insert_columns = '(' + insert_columns + ')';
    
    var s_records = "insert into " + tb_name + " " + insert_columns +
    " values ("+ insert_values +") returning id;";
    
    var s_records_vars = [s_records].concat(a);
    // return(s_records_vars);
    
    var sqlres = plv8.execute.apply(this, s_records_vars);

    return(sqlres[0]);

  };


  plv8.ufn.update_one = function(data_obj, tb_name, params){
    var md = moment();
    data_obj.update_date = md.format("YYYY-MM-DD");
		data_obj.update_time = md.format('YYYY-MM-DDTHH:mm:ss');
    data_obj.update_display_time = md.format('YYYY-MM-DD HH:mm');

    var items = 1;
    var columns = "";
    var vars = "";
    var a = [];

    
    for(var key in data_obj){
      if (data_obj.hasOwnProperty(key)) {
        a.push(data_obj[key]);
        columns += key + ' = $' + items + ',';
        items ++;
      }
    }
    
    var s_where = ' where ' + params[0].field + ' = ' + params[0].value + ' ';
    
    var update_columns = columns.substr(0,(columns.length-1));
    
    var s_records = "update " + tb_name + " set " + update_columns + s_where +" returning id;";
    
    var s_records_vars = [s_records].concat(a);
    
    var sqlres = plv8.execute.apply(this, s_records_vars);

    return(sqlres[0]);
  };


  plv8.ufn.generic_select_build = function(fields,tables,params){
    var s_select = " select ";
    var s_from = " from ";
    var s_where = " where ";

    for (var i = 0; i < fields.length; i++) {
      s_select += " " + fields[i].field + " ,";
    }
    // remove last comma
    s_select = s_select.substr(0,(s_select.length-1));

    for (var i = 0; i < tables.length; i++) {
      if (tables[i].join_type == 'base') {
        s_from += " " + tables[i].table + " " + tables[i].alias + " ";
      } else {
        s_from += tables[i].join_type + " " + tables[i].table + " " + tables[i].alias + " ";

        for (var j = 0; j < tables[i].params.length; j++) {
          var s_params = "on";
          var param = tables[i].params[j];

          if (param.param_join == 'base') {
            s_params += " " + param.field + " = " + param.value + " ";
            s_from += s_params;
          } else {
            s_params = "";
            s_params += " " + param.param_join + " " + param.field + " = " + param.value + " ";
            s_from += s_params;
          }
        }
      }
    }

    for (var i = 0; i < params.length; i++) {
      if (params[i].param_join == 'base') {
        s_where += " " + params[i].field + " = " + params[i].value;
      } else {
        s_where += " " + params[i].param_join + " " + params[i].field + " = " + params[i].value;
      }
    }

    var sql = s_select + s_from + s_where;
    var sqlres = plv8.execute(sql);
    return(sqlres);
  }
  
  // select p.first_name from tb_profile 
  // inner join tb_accounts on a.profile_id = p.id and a.account_no = '123456789'
  // left join tb_avatar on av.profile_id = p.id
  // where p.id = 1
  // and a.state = active;

  plv8.ufn.generic_select_list = function(fields,tables,params,offset,limit) {
    var s_select = " select ";
    var s_from = " from ";
    var s_where = " where ";

    for (var i = 0; i < fields.length; i++) {
      s_select += " " + fields[i].field + " ,";
    }
    s_select = s_select.substr(0,(s_select.length-1));

    for (var i = 0; i < tables.length; i++) {
      if (tables[i].join_type == 'base') {
        s_from += " " + tables[i].table + " " + tables[i].alias + " ";
      } else { 
        s_from += tables[i].join_type + " " + tables[i].table + " " + tables[i].alias + " ";

        for (var j = 0; j < tables[i].params.length; j++) {
          var s_params = "on";
          var param = tables[i].params[j];

          if (param.param_join == 'base') {
            s_params += " " + param.field + " = " + param.value + " ";
            s_from += s_params;
          } else {
            s_params = "";
            s_params += " " + param.param_join + " " + param.field + " = " + param.value + " ";
            s_from += s_params;
          }
        }
      }
    }

    for (var i = 0; i < params.length; i++) {
      if (params[i].param_join == 'base') {
        s_where += " " + params[i].field + " = " + params[i].value;
      } else {
        s_where += " " + params[i].param_join + " " + params[i].field + " = " + params[i].value;
      }
    }

    var sql = s_select + s_from + s_where;
    var sqlres = plv8.execute(sql);
    return(sqlres);
  }
  
}(this));
