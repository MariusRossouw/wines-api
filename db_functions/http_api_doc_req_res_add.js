create or replace function http_api_doc_req_res_add(http_req_text text) returns JSON as
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


    var sql_insert = 'insert into tb_api_docs_req_res (headers, requestBody, responseBody, resCode, api_doc_endpoint_id) values($1,$2,$3,$4,$5) returning api_doc_req_res_id;';
    var query_result1 = plv8.execute(sql_insert, http_req.body.headers, http_req.body.requestBody, http_req.body.responseBody, http_req.body.resCode, http_req.body.api_doc_endpoint_id);
    plv8.elog(INFO, JSON.stringify(query_result1));
    var new_id = query_result1[0].api_doc_req_res_id;

    result.data.api_doc_req_res_id = new_id.toString();

    return (result);

$$ LANGUAGE plv8;
