create or replace function http_user_profile_add(http_req JSON) returns JSON as
$$

    if(!plv8.ufn){
        var sup = plv8.find_function("plv8_startup");
        sup();
    }

    var result = {
        http_code: 200,
        errors: [],
        data: {}
    };

    var fields = ['email', 'password', 'first_name', 'last_name', 'type'];
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

    var sql_req = "select * from tb_profile where email = $1";
    var sql_res = plv8.execute(sql_req, http_req.body.email);
    if(sql_res.length > 0){
        result.http_code = 400;
        result.errors.push({
            message: 'User email exists',
            detail: http_req.body.email
        });
        return(result);
    }

    var email = http_req.body.email;
    var password = http_req.body.password;
    var first_name = http_req.body.first_name;
    var last_name = http_req.body.last_name;
    var reps = http_req.body.reps || [];
    var mobile_no_exl = http_req.body.mobile_no_exl || '';
    var type = http_req.body.type || 'Rep';


    sql_req = `insert into tb_profile
                (email, password, first_name, last_name, mobile_no_exl, type)
                values ($1, $2, $3, $4, $5, $6)
                returning profile_id`;
    sql_res = plv8.execute(sql_req, email, password, first_name, last_name, mobile_no_exl, type);
    if (sql_res.length == 0) {
        result.http_code = 500;
        result.errors.push({
            message: 'Error creating user'
        });
    };
    result.data.profile_id = sql_res[0].profile_id;

    for(var i = 0; i < reps.length; i++){
        var rep = reps[i];
        var selected = rep.selected;
        
        var sql_req2 = `select * from tb_manager_rep_map where rep_id = $1 and manager_id = $2;`;
        var sql_res2 = plv8.execute(sql_req2,rep.profile_id, result.data.profile_id);

        var t_id = sql_res2.length > 0 ? sql_res2[0].t_id : null;

        var is_enabled = sql_res2.length > 0 ? sql_res2[0].is_active : false;

        if(selected){
            if(!t_id){
                var i_sql = `insert into tb_manager_rep_map 
                (manager_id,rep_id,is_active)
                values
                ($1,$2,$3)
                ON CONFLICT (manager_id,rep_id) DO NOTHING;`;
                var i_sqlres = plv8.execute(i_sql,result.data.profile_id,rep.profile_id,true);
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

    return result;

$$ LANGUAGE plv8;
