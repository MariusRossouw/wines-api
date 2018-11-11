create or replace function http_repo_add(http_req JSON) returns JSON as
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

    var fields = ['repo_name'];
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

    var sql_req = "select * from tb_repo where repo_name = $1";
    var sql_res = plv8.execute(sql_req, http_req.body.repo_name);
    if(sql_res.length > 0){
        result.http_code = 400;
        result.errors.push({
            message: 'Repo name exists',
            detail: http_req.body.repo_name
        });
        return(result);
    }

    var repo_name = http_req.body.repo_name;


    sql_req = `insert into tb_repo
                (repo_name)
                values ($1)
                returning repo_id`;
    sql_res = plv8.execute(sql_req, repo_name);
    if (sql_res.length == 0) {
        result.http_code = 500;
        result.errors.push({
            message: 'Error creating repo'
        });
    };
    result.data.repo_id = sql_res[0].repo_id;

    return result;

$$ LANGUAGE plv8;
