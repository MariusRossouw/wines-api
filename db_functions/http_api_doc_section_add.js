create or replace function http_api_doc_section_add(http_req_text text) returns JSON as
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

    if(!http_req.body.sectionName || http_req.body.sectionName.trim().length == 0){
        result.http_code = 403;
        result.message = 'section name required';
        return(result);
    };


    var s = "select * from tb_api_doc_sections where sectionName = $1;";
    plv8.elog(INFO, s);
    var query_result = plv8.execute(s,http_req.body.sectionName);

    if(query_result.length > 0){
        result.http_code = 403;
        result.message = 'That section name all-ready exist';
        return(result);
    } else {
        var sql_insert = 'insert into tb_api_doc_sections (sectionName) values($1) returning api_doc_section_id;';
        var query_result1 = plv8.execute(sql_insert, http_req.body.sectionName);
        plv8.elog(INFO, JSON.stringify(query_result1));
        var new_id = query_result1[0].api_doc_section_id;

        result.data.api_doc_section_id = new_id.toString();
    }

    return (result);

$$ LANGUAGE plv8;
