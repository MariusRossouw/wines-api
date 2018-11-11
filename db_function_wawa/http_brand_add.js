create or replace function http_brand_add(http_req JSON) returns JSON as
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

    var fields = ['brand_name', 'trading_as'];
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

    var sql_req = "select * from tb_brand where brand_name = $1";
    var sql_res = plv8.execute(sql_req, http_req.body.brand_name);
    if(sql_res.length > 0){
        result.http_code = 400;
        result.errors.push({
            message: 'Brand name exists',
            detail: http_req.body.brand_name
        });
        return(result);
    }

    var brand_name = http_req.body.brand_name;
    var trading_as = http_req.body.trading_as;
    var registration_number = http_req.body.registration_number;
    var vat_number = http_req.body.vat_number;


    sql_req = `insert into tb_brand
                (brand_name, trading_as, registration_number, vat_number)
                values ($1, $2, $3, $4)
                returning brand_id`;
    sql_res = plv8.execute(sql_req, brand_name, trading_as, registration_number, vat_number);
    if (sql_res.length == 0) {
        result.http_code = 500;
        result.errors.push({
            message: 'Error creating brand'
        });
    };
    result.data.brand_id = sql_res[0].brand_id;

    return result;

$$ LANGUAGE plv8;
