create or replace function http_app_add(http_req JSON) returns JSON as
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

    var fields = ['app_name', 'brand_id'];
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

    var sql_req = "select * from tb_app where app_name = $1";
    var sql_res = plv8.execute(sql_req, http_req.body.app_name);
    if(sql_res.length > 0){
        result.http_code = 400;
        result.errors.push({
            message: 'App name exists',
            detail: http_req.body.app_name
        });
        return(result);
    }
    var brand_id = http_req.body.brand_id;
    var app_name = http_req.body.app_name;
    var repo_id = http_req.body.repo_id;
    var url_staging = http_req.body.url_staging;
    var url_production = http_req.body.url_production;
    var config_staging = http_req.body.config_staging;
    var config_production = http_req.body.config_production;

    sql_req = `insert into tb_app
                (app_name, repo_id, url_staging, url_production, config_staging, config_production, brand_id)
                values ($1, $2, $3, $4, $5, $6, $7)
                returning app_id`;
    sql_res = plv8.execute(sql_req, app_name, repo_id, url_staging, url_production, config_staging, config_production, brand_id);
    if (sql_res.length == 0) {
        result.http_code = 500;
        result.errors.push({
            message: 'Error creating app'
        });
    };
    result.data.app_id = sql_res[0].app_id;

    return result;

$$ LANGUAGE plv8;
