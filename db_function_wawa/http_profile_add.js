create or replace function http_profile_add(http_req JSON) returns JSON as
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

    var fields = ['email', 'password', 'profile_name', 'contact_no'];
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
    var name = http_req.body.profile_name;
    var contact_no = http_req.body.contact_no;


    sql_req = `insert into tb_profile
                (email, password, profile_name, contact_no)
                values ($1, $2, $3, $4)
                returning profile_id`;
    sql_res = plv8.execute(sql_req, email, password, profile_name, contact_no);
    if (sql_res.length == 0) {
        result.http_code = 500;
        result.errors.push({
            message: 'Error creating user'
        });
    };
    result.data.profile_id = sql_res[0].profile_id;

    return result;

$$ LANGUAGE plv8;
