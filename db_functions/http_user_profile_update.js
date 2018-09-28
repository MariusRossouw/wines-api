create or replace function http_user_profile_update(http_req_text text) returns JSON as
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

  if(!http_req.body.profile_id){
    result.http_code = 403;
    result.message = 'profile_id required';
    return(result);
  };

  if(!http_req.body.update){

    var s = "update tb_profile set ";
    var obj = http_req.body.update;
    var update_items = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key) && key != 'profile_id') {
          update_items.push(obj[key])
          s += key + " = $" + update_items.length + ",";
        }
    }
    var sql = s.substr(0, (s.length - 1));

    update_items.push(http_req.body.profile_id)
    sql += " where profile_id = $" + update_items.length + "returning profile_id;";;

    var query_items = [];
    query_items.push(sql);
    query_items.push(update_items);
    
    var query_result = plv8.execute.apply(this, query_items);

    if (query_result && query_result.length > 0) {
      result.data.profile_id = query_result[0].profile_id;
    }
  }
  var reps = http_req.body.reps || [];
  for(var i = 0; i < reps.length; i++){
        var rep = reps[i];
        var selected = rep.selected;
        
        var sql_req2 = `select * from tb_manager_rep_map where rep_id = $1 and manager_id = $2;`;
        var sql_res2 = plv8.execute(sql_req2,rep.profile_id, http_req.body.profile_id);

        var t_id = sql_res2.length > 0 ? sql_res2[0].t_id : null;

        var is_enabled = sql_res2.length > 0 ? sql_res2[0].is_active : false;

        if(selected){
            if(!t_id){
                var i_sql = `insert into tb_manager_rep_map 
                (manager_id,rep_id,is_active)
                values
                ($1,$2,$3)
                ON CONFLICT (manager_id,rep_id) DO NOTHING;`;
                var i_sqlres = plv8.execute(i_sql,http_req.body.profile_id,rep.profile_id,true);
            }else if(!is_active){
                var i_sql = `update tb_manager_rep_map set is_active = $1 where t_id = $2;`;
                var i_sqlres = plv8.execute(i_sql,true,t_id);
            }
        }else{
            if(t_id && is_active){
                var i_sql = `update tb_manager_rep_map set is_active = $1 where t_id = $2;`;
                var i_sqlres = plv8.execute(i_sql,false,t_id);
            }
        }
    }

  return(result);
  
  $$ LANGUAGE plv8;