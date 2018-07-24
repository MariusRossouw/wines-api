create or replace function http_api_doc_endpoint_add(http_req_text text) returns JSON as
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

    if(!http_req.body.subSectionName || http_req.body.subSectionName.trim().length == 0){
        result.http_code = 403;
        result.message = 'section name required';
        return(result);
    };
    if(!http_req.body.api_doc_section_id){
        result.http_code = 403;
        result.message = 'section id required';
        return(result);
    };


    var s = "select * from tb_api_docs_endpoint where subSectionName = $1 AND api_doc_section_id = $2;";
    plv8.elog(INFO, s);
    var query_result = plv8.execute(s,http_req.body.subSectionName, http_req.body.api_doc_section_id);

    if(query_result.length > 0){
        result.http_code = 403;
        result.message = 'That sub-section name all-ready exist';
        return(result);
    } else {
        var sql_insert = 'insert into tb_api_docs_endpoint (subSectionName, api_doc_section_id, method, endpoint, description, requirements, requiredFields) values($1,$2,$3,$4,$5,$6,$7) returning api_doc_endpoint_id;';
        var query_result1 = plv8.execute(sql_insert, http_req.body.subSectionName, http_req.body.api_doc_section_id, http_req.body.method, http_req.body.endpoint, http_req.body.description, http_req.body.requirements, http_req.body.requiredFields);
        plv8.elog(INFO, JSON.stringify(query_result1));
        var new_id = query_result1[0].api_doc_endpoint_id;

        for(var i = 0; i < http_req.body.reqRes.length; i++){
            var sql_insert = 'insert into tb_api_docs_req_res (headers, requestBody, responseBody, resCode, api_doc_endpoint_id) values($1,$2,$3,$4,$5) returning api_doc_req_res_id;';
            var query_result1 = plv8.execute(sql_insert, http_req.body.reqRes[i].headers, http_req.body.reqRes[i].requestBody, http_req.body.reqRes[i].responseBody, http_req.body.reqRes[i].resCode, new_id);
        }
    }

    return (result);

$$ LANGUAGE plv8;
