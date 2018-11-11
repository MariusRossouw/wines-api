create or replace function http_task_add(http_req JSON) returns JSON as
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

    var fields = ['email', 'password', 'task_name', 'contact_no'];
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

    var task_name = http_req.body.task_name;
    var priority = http_req.body.priority;
    var description = http_req.body.description;
    var notes = http_req.body.notes;
    var brand_id = http_req.body.brand_id;
    var app_id = http_req.body.app_id;
    var url_id = http_req.body.url_id;
    var component_id = http_req.body.component_id;
    var type = http_req.body.type;
    var kind = http_req.body.kind;
    var size = http_req.body.size;
    var assigned_to = http_req.body.assigned_to;


    sql_req = `insert into tb_task
                (task_name, priority, description, notes, brand_id, app_id, url_id, component_id, type, kind, size, assigned_to)
                values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
                returning task_id`;
    sql_res = plv8.execute(sql_req, task_name, priority, description, notes, brand_id, app_id, url_id, component_id, type, kind, size, assigned_to);
    if (sql_res.length == 0) {
        result.http_code = 500;
        result.errors.push({
            message: 'Error creating task'
        });
    };
    result.data.task_id = sql_res[0].task_id;

    return result;

$$ LANGUAGE plv8;
