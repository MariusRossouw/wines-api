create or replace function http_component_add(http_req JSON) returns JSON as
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

    var fields = ['component_name', 'url_id'];
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

    var sql_req = "select * from tb_component where component_name = $1 and url_id = $2";
    var sql_res = plv8.execute(sql_req, http_req.body.component_name, http_req.body.url_id);
    if(sql_res.length > 0){
        result.http_code = 400;
        result.errors.push({
            message: 'URL component exists for this App',
            detail: http_req.body.component_name
        });
        return(result);
    }

    var component_name = http_req.body.component_name;


    sql_req = `insert into tb_component
                (component_name)
                values ($1)
                returning component_id`;
    sql_res = plv8.execute(sql_req, component_name);
    if (sql_res.length == 0) {
        result.http_code = 500;
        result.errors.push({
            message: 'Error creating component'
        });
    };
    result.data.component_id = sql_res[0].component_id;

    return result;

$$ LANGUAGE plv8;
